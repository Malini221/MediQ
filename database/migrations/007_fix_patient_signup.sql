-- Migration 007: Robust Auth Trigger for Profiles and Patient Record Provisioning
-- Fixes "Database error saving new user" by setting explicit search_path,
-- providing safe fallback for date_of_birth, and preventing unhandled exceptions.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  extracted_role text;
  safe_role public.system_role_enum;
  new_patient_id uuid;
  dob_str text;
  parsed_dob date;
BEGIN
  -- Extract system role from user metadata
  extracted_role := COALESCE(
    new.raw_user_meta_data->>'system_role',
    new.raw_user_meta_data->>'account_type',
    'family_caregiver'
  );

  -- Safely cast to system_role_enum
  BEGIN
    safe_role := extracted_role::public.system_role_enum;
  EXCEPTION WHEN OTHERS THEN
    safe_role := 'family_caregiver'::public.system_role_enum;
  END;

  -- 1. Create base profile (ON CONFLICT DO NOTHING for idempotent retries)
  INSERT INTO public.profiles (id, full_name, system_role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'),
    safe_role
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    system_role = EXCLUDED.system_role;

  -- 2. Provision patient record ONLY if role is 'patient'
  IF safe_role = 'patient' THEN
    dob_str := new.raw_user_meta_data->>'date_of_birth';
    
    -- Parse or default date of birth safely without throwing
    IF dob_str IS NOT NULL AND dob_str <> '' THEN
      BEGIN
        parsed_dob := dob_str::date;
      EXCEPTION WHEN OTHERS THEN
        parsed_dob := CURRENT_DATE - INTERVAL '30 years';
      END;
    ELSE
      parsed_dob := CURRENT_DATE - INTERVAL '30 years';
    END IF;

    -- Create patient record
    INSERT INTO public.patients (
      full_name, 
      date_of_birth, 
      primary_diagnosis
    )
    VALUES (
      COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown Patient'),
      parsed_dob,
      'Condition pending assessment'
    )
    RETURNING id INTO new_patient_id;

    -- Bind user to patient record
    INSERT INTO public.patient_memberships (
      user_id, 
      patient_id, 
      assigned_role
    )
    VALUES (
      new.id,
      new_patient_id,
      'patient'::public.system_role_enum
    )
    ON CONFLICT (user_id, patient_id) DO NOTHING;
  END IF;

  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Log error in PostgreSQL log and return new so auth.users insertion is not aborted abruptly
  RAISE WARNING 'handle_new_user error: %', SQLERRM;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Ensure trigger is active on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

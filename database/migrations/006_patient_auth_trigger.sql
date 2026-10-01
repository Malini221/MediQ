-- Migration 006: Supabase Auth Trigger for Profiles and Patient Linking
-- Goal: Automatically provision correct database records depending on whether the user is a Patient or Care Team.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  extracted_role text;
  safe_role public.system_role_enum;
  new_patient_id uuid;
  dob_str text;
  parsed_dob date;
BEGIN
  -- Extract system role from user metadata. Fallback to 'family_caregiver' for legacy safety.
  extracted_role := COALESCE(
    new.raw_user_meta_data->>'system_role',
    new.raw_user_meta_data->>'account_type',
    'family_caregiver'
  );

  -- Safely cast to our ENUM type
  BEGIN
    safe_role := extracted_role::public.system_role_enum;
  EXCEPTION WHEN invalid_text_representation THEN
    safe_role := 'family_caregiver'::public.system_role_enum;
  END;

  -- 1. Create the base profile for EVERY user (Care Team and Patient)
  INSERT INTO public.profiles (id, full_name, system_role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown User'),
    safe_role
  );

  -- 2. Differentiate: ONLY provision patient records if role is 'patient'
  IF safe_role = 'patient' THEN
    
    dob_str := new.raw_user_meta_data->>'date_of_birth';
    IF dob_str IS NULL OR dob_str = '' THEN
      RAISE EXCEPTION 'Date of birth is required for patient registration';
    END IF;

    -- Validate date format
    BEGIN
      parsed_dob := dob_str::date;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid date format for date_of_birth';
    END;

    -- Create the patient record
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

    -- Bind the user to this patient record via membership
    INSERT INTO public.patient_memberships (
      user_id, 
      patient_id, 
      assigned_role
    )
    VALUES (
      new.id,
      new_patient_id,
      'patient'::public.system_role_enum
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if trigger exists, drop if it does to ensure clean recreation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

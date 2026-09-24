-- Migration 007: Robust Auth Trigger for Profiles and Patient Record Provisioning
-- Fixes "Database error saving new user" and keeps patient provisioning idempotent.

ALTER TABLE public.patients
  ALTER COLUMN date_of_birth DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role public.system_role_enum;
  v_full_name text;
  v_dob date;
  v_diagnosis text;
BEGIN
  v_full_name := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
    split_part(COALESCE(NEW.email, 'User'), '@', 1)
  );

  BEGIN
    v_role := COALESCE(
      (NEW.raw_user_meta_data->>'system_role')::public.system_role_enum,
      'family_caregiver'::public.system_role_enum
    );
  EXCEPTION WHEN invalid_text_representation THEN
    v_role := 'family_caregiver'::public.system_role_enum;
  END;

  INSERT INTO public.profiles (id, full_name, system_role)
  VALUES (NEW.id, v_full_name, v_role)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        system_role = EXCLUDED.system_role,
        updated_at = now();

  IF v_role = 'patient'::public.system_role_enum THEN
    BEGIN
      v_dob := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'date_of_birth', '')::date,
        NULLIF(NEW.raw_user_meta_data->>'dob', '')::date
      );
    EXCEPTION WHEN others THEN
      v_dob := NULL;
    END;

    v_diagnosis := COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'primary_diagnosis'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'diagnosis'), ''),
      'Not specified'
    );

    INSERT INTO public.patients (
      auth_user_id,
      full_name,
      date_of_birth,
      primary_diagnosis,
      baseline_conditions
    )
    VALUES (
      NEW.id,
      v_full_name,
      v_dob,
      v_diagnosis,
      '{}'::jsonb
    )
    ON CONFLICT (auth_user_id) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          date_of_birth = EXCLUDED.date_of_birth,
          primary_diagnosis = EXCLUDED.primary_diagnosis,
          updated_at = now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

COMMENT ON COLUMN public.patients.date_of_birth IS
  'Optional during self-service patient registration; may be completed later in the patient profile.';

-- MediQ: support patient accounts created through the shared authentication UI.
-- Safe additive migration for existing installations.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'system_role_enum' AND e.enumlabel = 'patient'
  ) THEN
    ALTER TYPE public.system_role_enum ADD VALUE 'patient';
  END IF;
END $$;

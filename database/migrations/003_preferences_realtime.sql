-- MediQ additive migration: preferences + secure realtime publication

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_voice_language text NOT NULL DEFAULT 'en';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_preferred_voice_language_check') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_preferred_voice_language_check
      CHECK (preferred_voice_language IN ('en','hi','ta','te'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'observations') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.observations;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'handover_summaries') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.handover_summaries;
  END IF;
END $$;

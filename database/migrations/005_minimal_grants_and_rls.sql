-- Migration 005: Minimal SQL Grants and Missing RLS Policies
-- Goal: Fix 42501 permission denied errors while enforcing least-privilege.

-- 1. Explicitly grant ONLY the operations the FastAPI backend requires via authenticated JWT.
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, UPDATE ON public.patients TO authenticated;
GRANT SELECT ON public.patient_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.observations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.handover_summaries TO authenticated;
GRANT SELECT, INSERT ON public.burnout_logs TO authenticated;
GRANT SELECT ON public.clinical_guidance TO authenticated;

-- 2. Add missing RLS policies that were missing from 001_initial_schema.sql.

-- Profiles: Allow users to update their own profile.
CREATE POLICY "Profiles self update" ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Patient Memberships: Crucial missing policy! 
-- Without this, ANY subquery checking `patient_memberships` returns 0 rows.
CREATE POLICY "Memberships self view" ON public.patient_memberships FOR SELECT
USING (user_id = auth.uid());

-- Patients: Allow updating patient conditions if authorized.
CREATE POLICY "Patients membership update" ON public.patients FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.patient_memberships pm
    WHERE pm.patient_id = public.patients.id AND pm.user_id = auth.uid()
));

-- Observations: Allow updating observation status.
CREATE POLICY "Observations self update" ON public.observations FOR UPDATE
USING (recorded_by = auth.uid());

-- Handover Summaries: Allow inserts and acknowledges.
CREATE POLICY "Handover membership insert" ON public.handover_summaries FOR INSERT
WITH CHECK (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.patient_memberships pm
    WHERE pm.patient_id = public.handover_summaries.patient_id AND pm.user_id = auth.uid()
));

CREATE POLICY "Handover membership update" ON public.handover_summaries FOR UPDATE
USING (EXISTS (
    SELECT 1 FROM public.patient_memberships pm
    WHERE pm.patient_id = public.handover_summaries.patient_id AND pm.user_id = auth.uid()
));

-- Migration 001: Initial MediQ Database Schema & RLS Policies
-- Requires PostgreSQL 15+ with pgvector and uuid-ossp

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ENUM TYPES
CREATE TYPE system_role_enum AS ENUM (
    'family_caregiver',
    'professional_caregiver',
    'clinician',
    'coordinator',
    'patient'
);

CREATE TYPE observation_status_enum AS ENUM (
    'pending',
    'confirmed',
    'escalated'
);

-- TABLES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    system_role system_role_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    primary_diagnosis TEXT NOT NULL,
    baseline_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.patient_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    assigned_role system_role_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_patient_membership UNIQUE (user_id, patient_id)
);

CREATE TABLE IF NOT EXISTS public.observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    original_audio_path TEXT,
    raw_text TEXT NOT NULL,
    extracted_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    status observation_status_enum NOT NULL DEFAULT 'pending',
    priority_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.handover_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    summary_text TEXT NOT NULL,
    source_observation_ids UUID[] NOT NULL,
    priority_watch_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    acknowledged_by UUID REFERENCES public.profiles(id),
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.burnout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    strain_score INTEGER NOT NULL CHECK (strain_score BETWEEN 0 AND 100),
    sentiment_indicators JSONB NOT NULL DEFAULT '{}'::jsonb,
    usage_frequency_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    intervention_offered TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.clinical_guidance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    embedding vector(384),
    is_approved BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.patient_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_patient ON public.patient_memberships(patient_id);
CREATE INDEX IF NOT EXISTS idx_observations_patient_status ON public.observations(patient_id, status);
CREATE INDEX IF NOT EXISTS idx_observations_created ON public.observations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_handovers_patient ON public.handover_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_burnout_user ON public.burnout_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_guidance_embedding ON public.clinical_guidance 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burnout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_guidance ENABLE ROW LEVEL SECURITY;

-- POLICIES
CREATE POLICY "Profiles membership view" ON public.profiles FOR SELECT
USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM public.patient_memberships pm1
    JOIN public.patient_memberships pm2 ON pm1.patient_id = pm2.patient_id
    WHERE pm1.user_id = auth.uid() AND pm2.user_id = public.profiles.id
));

CREATE POLICY "Patients membership view" ON public.patients FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.patient_memberships pm
    WHERE pm.patient_id = public.patients.id AND pm.user_id = auth.uid()
));

CREATE POLICY "Observations membership view" ON public.observations FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.patient_memberships pm
    WHERE pm.patient_id = public.observations.patient_id AND pm.user_id = auth.uid()
));

CREATE POLICY "Observations membership insert" ON public.observations FOR INSERT
WITH CHECK (recorded_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.patient_memberships pm
    WHERE pm.patient_id = public.observations.patient_id AND pm.user_id = auth.uid()
));

CREATE POLICY "Handover membership view" ON public.handover_summaries FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.patient_memberships pm
    WHERE pm.patient_id = public.handover_summaries.patient_id AND pm.user_id = auth.uid()
));

CREATE POLICY "Burnout private read" ON public.burnout_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Burnout private insert" ON public.burnout_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Guidance authenticated read" ON public.clinical_guidance FOR SELECT
USING (auth.role() = 'authenticated' AND is_approved = TRUE);

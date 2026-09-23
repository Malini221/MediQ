# MediQ — Database & RLS Architecture Specification

## Database Engine
- **Engine:** Supabase PostgreSQL 15+
- **Extensions Required:** `pgvector`, `uuid-ossp`

---

## 1. Custom ENUM Types

```sql
CREATE TYPE system_role_enum AS ENUM (
    'family_caregiver',
    'professional_caregiver',
    'clinician',
    'coordinator'
);

CREATE TYPE observation_status_enum AS ENUM (
    'pending',
    'confirmed',
    'escalated'
);
```

---

## 2. Table Definitions

```sql
-- PROFILES (Synced with auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    system_role system_role_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PATIENTS
CREATE TABLE public.patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    primary_diagnosis TEXT NOT NULL,
    baseline_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- PATIENT_MEMBERSHIPS (Access Control Matrix)
CREATE TABLE public.patient_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    assigned_role system_role_enum NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_patient_membership UNIQUE (user_id, patient_id)
);

-- OBSERVATIONS
CREATE TABLE public.observations (
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

-- HANDOVER_SUMMARIES
CREATE TABLE public.handover_summaries (
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

-- BURNOUT_LOGS
CREATE TABLE public.burnout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    strain_score INTEGER NOT NULL CHECK (strain_score BETWEEN 0 AND 100),
    sentiment_indicators JSONB NOT NULL DEFAULT '{}'::jsonb,
    usage_frequency_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    intervention_offered TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CLINICAL_GUIDANCE (HNSW Vector Store)
CREATE TABLE public.clinical_guidance (
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
```

---

## 3. Indexes & HNSW Setup

```sql
CREATE INDEX idx_memberships_user ON public.patient_memberships(user_id);
CREATE INDEX idx_memberships_patient ON public.patient_memberships(patient_id);
CREATE INDEX idx_observations_patient_status ON public.observations(patient_id, status);
CREATE INDEX idx_observations_created ON public.observations(created_at DESC);
CREATE INDEX idx_handovers_patient ON public.handover_summaries(patient_id);
CREATE INDEX idx_burnout_user ON public.burnout_logs(user_id);

-- HNSW Vector Index
CREATE INDEX idx_guidance_embedding ON public.clinical_guidance 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## 4. Row Level Security Policies

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.handover_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.burnout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_guidance ENABLE ROW LEVEL SECURITY;

-- Patients: Membership Isolation
CREATE POLICY "Access assigned patients only"
    ON public.patients FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_memberships pm
            WHERE pm.patient_id = public.patients.id AND pm.user_id = auth.uid()
        )
    );

-- Observations: Read/Write by Patient Membership
CREATE POLICY "Read observations for assigned patients"
    ON public.observations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.patient_memberships pm
            WHERE pm.patient_id = public.observations.patient_id AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Insert observations for assigned patients"
    ON public.observations FOR INSERT
    WITH CHECK (
        recorded_by = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.patient_memberships pm
            WHERE pm.patient_id = public.observations.patient_id AND pm.user_id = auth.uid()
        )
    );

-- Burnout Logs: STRICT PRIVATE ACCESS ONLY
CREATE POLICY "Burnout logs self read only"
    ON public.burnout_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Burnout logs self insert only"
    ON public.burnout_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());
```

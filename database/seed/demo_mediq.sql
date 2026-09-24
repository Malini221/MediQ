-- Synthetic/demo data only. Never use real patient information here.
-- Run against the MediQ Supabase project after the base schema exists.

UPDATE public.patients
SET primary_diagnosis = 'Type 2 diabetes',
    baseline_conditions = '{"conditions":["Type 2 diabetes"],"allergies":["No known allergies"],"mobility":"Independent","care_notes":"Synthetic demo patient for MediQ testing"}'::jsonb,
    updated_at = now()
WHERE full_name = 'Synthetic Test Patient';

UPDATE public.patients
SET primary_diagnosis = 'Hypertension',
    baseline_conditions = '{"conditions":["Hypertension"],"allergies":["No known allergies"],"mobility":"Independent","care_notes":"Synthetic demo patient for MediQ testing"}'::jsonb,
    updated_at = now()
WHERE full_name = 'Malini M';

INSERT INTO public.observations (patient_id, recorded_by, raw_text, status, priority_score, extracted_metadata)
SELECT p.id, p.auth_user_id,
       '[Demo] Patient reports mild tiredness after lunch and stable appetite.',
       'confirmed', 25,
       '{"symptoms":["tiredness"],"mood":"stable","appetite":"stable","safety":{"is_critical":false},"source":"synthetic_demo"}'::jsonb
FROM public.patients p
WHERE p.full_name = 'Synthetic Test Patient'
  AND NOT EXISTS (SELECT 1 FROM public.observations o WHERE o.patient_id = p.id);

INSERT INTO public.observations (patient_id, recorded_by, raw_text, status, priority_score, extracted_metadata)
SELECT p.id, p.auth_user_id,
       '[Demo] Patient reports occasional headache in the evening; no emergency symptoms reported.',
       'confirmed', 35,
       '{"symptoms":["headache"],"mood":"stable","appetite":"stable","safety":{"is_critical":false},"source":"synthetic_demo"}'::jsonb
FROM public.patients p
WHERE p.full_name = 'Malini M'
  AND NOT EXISTS (SELECT 1 FROM public.observations o WHERE o.patient_id = p.id);

INSERT INTO public.handover_summaries
  (patient_id, created_by, summary_text, source_observation_ids, priority_watch_items)
SELECT p.id,
       p.auth_user_id,
       'Demo handover: stable overall. Mild tiredness reported after lunch. Continue routine monitoring and note any change in appetite or energy.',
       ARRAY(
         SELECT o.id
         FROM public.observations o
         WHERE o.patient_id = p.id
         ORDER BY o.created_at DESC
         LIMIT 1
       ),
       '[{"priority":"watch","item":"Energy level","note":"Monitor for persistent fatigue or new symptoms."}]'::jsonb
FROM public.patients p
WHERE p.full_name = 'Synthetic Test Patient'
  AND NOT EXISTS (SELECT 1 FROM public.handover_summaries h WHERE h.patient_id = p.id);

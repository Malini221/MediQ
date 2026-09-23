export interface Patient {
  id: string;
  full_name: string;
  date_of_birth: string;
  primary_diagnosis: string;
  baseline_conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ObservationStatus = 'pending' | 'confirmed' | 'escalated';

export interface Observation {
  id: string;
  patient_id: string;
  recorded_by: string;
  original_audio_path: string | null;
  raw_text: string;
  extracted_metadata: Record<string, any>;
  status: ObservationStatus;
  priority_score: number;
  created_at: string;
  updated_at: string;
}

export interface Handover {
  id: string;
  patient_id: string;
  created_by: string;
  summary_text: string;
  source_observation_ids: string[];
  priority_watch_items: Record<string, any>;
  acknowledged_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicalGuidanceResult {
  id: string;
  category: string;
  title: string;
  content: string;
  metadata: Record<string, any>;
  similarity_score: number;
}

export interface BurnoutMetrics {
  id: string;
  user_id: string;
  strain_score: number;
  sentiment_indicators: Record<string, any>;
  usage_frequency_metrics: Record<string, any>;
  intervention_offered: string | null;
  created_at: string;
}

import { apiClient } from './api';
import { Observation } from '../types/models';

export const observationService = {
  /**
   * Creates a new observation (Text or Voice initial record).
   */
  async createObservation(patientId: string, rawText: string): Promise<Observation> {
    return apiClient.post<Observation>('/api/v1/observations', {
      patient_id: patientId,
      raw_text: rawText,
    });
  },

  /**
   * Uploads an audio blob to an existing observation for transcription and processing.
   */
  async uploadObservationAudio(observationId: string, file: File | Blob, language: string = 'en'): Promise<Observation> {
    const formData = new FormData();
    formData.append('file', file, 'observation.webm');
    formData.append('language', language);

    // apiClient.upload prevents overriding the multipart/form-data boundary
    return apiClient.upload<Observation>(`/api/v1/observations/${observationId}/audio`, formData);
  },

  /**
   * Fetches a specific observation by ID.
   */
  async getObservation(observationId: string): Promise<Observation> {
    return apiClient.get<Observation>(`/api/v1/observations/${observationId}`);
  },

  /**
   * Confirms a pending observation.
   */
  async confirmObservation(observationId: string): Promise<Observation> {
    return apiClient.patch<Observation>(`/api/v1/observations/${observationId}/confirm`, {});
  },

  /**
   * Analyzes an observation to extract structured metadata.
   */
  async analyzeObservation(observationId: string): Promise<Observation> {
    return apiClient.post<Observation>(`/api/v1/observations/${observationId}/analyze`, {});
  },

  /**
   * Assesses the priority and safety of an observation.
   */
  async assessObservationPriority(observationId: string): Promise<Observation> {
    return apiClient.post<Observation>(`/api/v1/observations/${observationId}/priority`, {});
  }
};

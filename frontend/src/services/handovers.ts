import { apiClient } from './api';
import type { Handover } from '../types/models';

export const handoversService = {
  /**
   * Retrieves all handovers for a given patient.
   */
  getPatientHandovers: async (patientId: string): Promise<Handover[]> => {
    return apiClient.get(`/api/v1/patients/${patientId}/handovers`);
  },

  /**
   * Generates a new handover for a given patient.
   */
  generateHandover: async (patientId: string): Promise<Handover> => {
    return apiClient.post(`/api/v1/patients/${patientId}/handover`, {});
  },

  /**
   * Retrieves a specific handover by ID.
   */
  getHandover: async (handoverId: string): Promise<Handover> => {
    return apiClient.get(`/api/v1/handovers/${handoverId}`);
  },

  /**
   * Acknowledges a handover.
   */
  acknowledgeHandover: async (handoverId: string): Promise<Handover> => {
    return apiClient.post(`/api/v1/handovers/${handoverId}/acknowledge`, {});
  },
};

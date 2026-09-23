import { apiClient } from './api';
import type { ClinicalGuidanceResult } from '../types/models';

export const clinicalGuidanceService = {
  /**
   * Searches the approved clinical guidance library using semantic retrieval.
   */
  searchClinicalGuidance: async (query: string, limit: number = 5): Promise<ClinicalGuidanceResult[]> => {
    const params = new URLSearchParams({ query, limit: limit.toString() });
    return apiClient.get(`/api/v1/clinical-guidance/search?${params}`);
  },
};

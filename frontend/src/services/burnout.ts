import { apiClient } from './api';
import { BurnoutMetrics } from '../types/models';

export const getBurnoutMetrics = async (): Promise<BurnoutMetrics[]> => {
  return apiClient.get<BurnoutMetrics[]>('/api/v1/burnout');
};

export const analyzeBurnout = async (): Promise<BurnoutMetrics> => {
  return apiClient.post<BurnoutMetrics>('/api/v1/burnout/analyze', {});
};

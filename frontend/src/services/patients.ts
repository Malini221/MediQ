import { apiClient } from './api';
import { Patient, Observation } from '../types/models';

export const patientService = {
  async getPatients(): Promise<Patient[]> { return apiClient.get<Patient[]>('/api/v1/patients'); },
  async getPatient(patientId: string): Promise<Patient> { return apiClient.get<Patient>(`/api/v1/patients/${patientId}`); },
  async getPatientObservations(patientId: string): Promise<Observation[]> { return apiClient.get<Observation[]>(`/api/v1/patients/${patientId}/observations`); },
  async updatePatient(patientId: string, body: Partial<Pick<Patient, 'primary_diagnosis'|'baseline_conditions'>>): Promise<Patient> { return apiClient.patch<Patient>(`/api/v1/patients/${patientId}`, body); },
};

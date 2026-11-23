
import apiClient from "../api/client";

export interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  medicalHistory: string | null;
  primaryDosha: string | null;
  dateOfBirth: string | null;
  bloodGroup: string | null;
  emergencyContact: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getMyPatientProfile = async (): Promise<PatientProfile> => {
  const response = await apiClient.get<ApiResponse<PatientProfile>>(
    "/patients/me"
  );

  return response.data.data;
};

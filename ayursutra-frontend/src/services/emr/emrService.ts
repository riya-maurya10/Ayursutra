import apiClient from "../api/client";
import type {
  PatientEMRSummaryResponse,
  PatientMedicalRecord,
  DoctorClinicalNote,
  DoshaAssessmentResponse,
  UpsertMedicalRecordRequest,
  CreateClinicalNoteRequest,
  UpdateClinicalNoteRequest,
  AddTherapyObservationRequest,
} from "../../types/emr";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getPatientEMR = async (
  patientId: string
): Promise<PatientEMRSummaryResponse> => {
  const response = await apiClient.get<ApiResponse<PatientEMRSummaryResponse>>(
    `/emr/patient/${patientId}`
  );
  return response.data.data;
};

export const getMyEMR = async (): Promise<PatientEMRSummaryResponse> => {
  const response = await apiClient.get<ApiResponse<PatientEMRSummaryResponse>>(
    "/emr/my"
  );
  return response.data.data;
};

export const upsertMedicalRecord = async (
  patientId: string,
  data: UpsertMedicalRecordRequest
): Promise<PatientMedicalRecord> => {
  const response = await apiClient.put<ApiResponse<PatientMedicalRecord>>(
    `/emr/patient/${patientId}/medical-record`,
    data
  );
  return response.data.data;
};

export const createClinicalNote = async (
  data: CreateClinicalNoteRequest
): Promise<DoctorClinicalNote> => {
  const response = await apiClient.post<ApiResponse<DoctorClinicalNote>>(
    "/emr/clinical-notes",
    data
  );
  return response.data.data;
};

export const updateClinicalNote = async (
  noteId: string,
  data: UpdateClinicalNoteRequest
): Promise<DoctorClinicalNote> => {
  const response = await apiClient.put<ApiResponse<DoctorClinicalNote>>(
    `/emr/clinical-notes/${noteId}`,
    data
  );
  return response.data.data;
};

export const addTherapyObservation = async (
  noteId: string,
  data: AddTherapyObservationRequest
): Promise<DoctorClinicalNote> => {
  const response = await apiClient.post<ApiResponse<DoctorClinicalNote>>(
    `/emr/clinical-notes/${noteId}/therapy-observation`,
    data
  );
  return response.data.data;
};

export const assessDoshaForPatient = async (
  patientId: string,
  questionnaire: Record<string, string>
): Promise<DoshaAssessmentResponse> => {
  const response = await apiClient.post<ApiResponse<DoshaAssessmentResponse>>(
    `/emr/patient/${patientId}/assess-dosha`,
    { answers: questionnaire }
  );
  return response.data.data;
};

export const searchMedicalRecords = async (
  query?: string
): Promise<PatientMedicalRecord[]> => {
  const response = await apiClient.get<ApiResponse<PatientMedicalRecord[]>>(
    "/emr/search",
    { params: { query } }
  );
  return response.data.data;
};

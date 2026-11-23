import apiClient from "../api/client";

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PatientProgressRequest {
  patientId: string;
  therapyPlanId: string;
  therapySessionId?: string;
  therapyName?: string;
  assessmentDate: string;
  dayNumber: number;
  symptoms?: string;
  observations?: string;
  therapyResponse?: string;
  discomfortSideEffects?: string;
  practitionerNotes?: string;
  notesForDoctor?: string;
  improvementPercentage?: number;
  clinicalAssessment?: string;
  treatmentAdjustments?: string;
  nextRecommendation?: string;
}

export interface DoctorProgressReviewRequest {
  improvementPercentage?: number;
  clinicalAssessment?: string;
  treatmentAdjustments?: string;
  nextRecommendation?: string;
}

export interface PatientProgressResponse {
  id: string;
  patientId: string;
  therapyPlanId: string;
  therapySessionId?: string;
  therapyName?: string;
  assessmentDate: string;
  dayNumber: number;
  symptoms?: string;
  observations?: string;
  therapyResponse?: string;
  discomfortSideEffects?: string;
  practitionerNotes?: string;
  notesForDoctor?: string;
  improvementPercentage?: number;
  clinicalAssessment?: string;
  treatmentAdjustments?: string;
  nextRecommendation?: string;
  assessedByTherapistId?: string;
  assessedByTherapistName?: string;
  reviewedByDoctorId?: string;
  reviewedByDoctorName?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create a new daily progress assessment (typically by Therapist or Doctor)
 */
export async function createProgressAssessment(
  request: PatientProgressRequest
): Promise<PatientProgressResponse> {
  const response = await apiClient.post<ApiResponse<PatientProgressResponse>>(
    "/patient-progress",
    request
  );
  return response.data.data;
}

/**
 * Update an existing progress assessment
 */
export async function updateProgressAssessment(
  id: string,
  request: PatientProgressRequest
): Promise<PatientProgressResponse> {
  const response = await apiClient.put<ApiResponse<PatientProgressResponse>>(
    `/patient-progress/${id}`,
    request
  );
  return response.data.data;
}

/**
 * Fetch progress assessment for a specific therapy session
 */
export async function getProgressBySessionId(
  therapySessionId: string
): Promise<PatientProgressResponse | null> {
  try {
    const response = await apiClient.get<ApiResponse<PatientProgressResponse>>(
      `/patient-progress/session/${therapySessionId}`
    );
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Fetch all progress assessments for a patient (sorted newest first)
 */
export async function getProgressByPatientId(
  patientId: string
): Promise<PatientProgressResponse[]> {
  const response = await apiClient.get<ApiResponse<PatientProgressResponse[]>>(
    `/patient-progress/patient/${patientId}`
  );
  return response.data.data || [];
}

/**
 * Doctor clinical review of a progress assessment
 */
export async function doctorReviewProgress(
  id: string,
  review: DoctorProgressReviewRequest
): Promise<PatientProgressResponse> {
  const response = await apiClient.patch<ApiResponse<PatientProgressResponse>>(
    `/patient-progress/${id}/doctor-review`,
    review
  );
  return response.data.data;
}

/**
 * Delete a progress assessment
 */
export async function deleteProgressAssessment(id: string): Promise<void> {
  await apiClient.delete(`/patient-progress/${id}`);
}

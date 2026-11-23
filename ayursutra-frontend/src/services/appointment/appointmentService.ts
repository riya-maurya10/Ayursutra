import apiClient from "../api/client";
import type {
  Appointment,
  BookAppointmentPayload,
  RescheduleAppointmentPayload,
  CancelAppointmentPayload,
  UpdateAppointmentStatusPayload,
  DoctorSlot,
  AppointmentStats,
  AppointmentStatus,
} from "../../types/appointment";
import type { ApiResponse } from "../../types/auth";

export async function bookAppointment(payload: BookAppointmentPayload): Promise<Appointment> {
  const response = await apiClient.post<ApiResponse<Appointment>>("/appointments", payload);
  return response.data.data;
}

export async function getAppointments(params?: {
  clinicId?: string;
  doctorId?: string;
  patientId?: string;
  date?: string;
  status?: AppointmentStatus;
}): Promise<Appointment[]> {
  const response = await apiClient.get<ApiResponse<Appointment[]>>("/appointments", { params });
  return response.data.data ?? [];
}

export async function getMyAppointments(): Promise<Appointment[]> {
  const response = await apiClient.get<ApiResponse<Appointment[]>>("/appointments/my");
  return response.data.data ?? [];
}

export async function getAppointmentById(id: string): Promise<Appointment> {
  const response = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`);
  return response.data.data;
}

export async function getAvailableSlots(doctorId: string, date: string): Promise<DoctorSlot[]> {
  const response = await apiClient.get<ApiResponse<DoctorSlot[]>>("/appointments/available-slots", {
    params: { doctorId, date },
  });
  return response.data.data ?? [];
}

export async function getAppointmentStats(clinicId?: string): Promise<AppointmentStats> {
  const response = await apiClient.get<ApiResponse<AppointmentStats>>("/appointments/stats", {
    params: { clinicId },
  });
  return response.data.data;
}

export async function rescheduleAppointment(
  id: string,
  payload: RescheduleAppointmentPayload
): Promise<Appointment> {
  const response = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}/reschedule`, payload);
  return response.data.data;
}

export async function cancelAppointment(
  id: string,
  payload: CancelAppointmentPayload
): Promise<Appointment> {
  const response = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}/cancel`, payload);
  return response.data.data;
}

export async function confirmAppointment(id: string): Promise<Appointment> {
  const response = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}/confirm`);
  return response.data.data;
}

export async function rejectAppointment(id: string, reason?: string): Promise<Appointment> {
  const response = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}/reject`, null, {
    params: { reason },
  });
  return response.data.data;
}

export async function recordArrival(id: string): Promise<Appointment> {
  const response = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}/arrival`);
  return response.data.data;
}

export async function updateAppointmentStatus(
  id: string,
  payload: UpdateAppointmentStatusPayload
): Promise<Appointment> {
  const response = await apiClient.put<ApiResponse<Appointment>>(`/appointments/${id}/status`, payload);
  return response.data.data;
}

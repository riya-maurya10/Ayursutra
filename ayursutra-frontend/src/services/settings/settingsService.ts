import apiClient from "../api/client";
import type {
  ClinicSettings,
  UserSettings,
  UpdateClinicSettingsPayload,
  UpdateUserSettingsPayload,
} from "../../types/settings";
import type { ApiResponse } from "../../types/auth";

// =========================================================
// CLINIC SETTINGS (ISOLATED BY clinicId)
// =========================================================

export async function getClinicSettings(
  clinicId: string = "CLINIC-MAIN"
): Promise<ClinicSettings> {
  const response = await apiClient.get<ApiResponse<ClinicSettings>>("/settings/clinic", {
    params: { clinicId },
  });
  return response.data.data;
}

export async function updateClinicSettings(
  payload: UpdateClinicSettingsPayload,
  clinicId: string = "CLINIC-MAIN"
): Promise<ClinicSettings> {
  const response = await apiClient.put<ApiResponse<ClinicSettings>>("/settings/clinic", payload, {
    params: { clinicId },
  });
  return response.data.data;
}

// =========================================================
// USER SETTINGS (ISOLATED BY userId OF AUTHENTICATED USER)
// =========================================================

export async function getUserSettings(): Promise<UserSettings> {
  const response = await apiClient.get<ApiResponse<UserSettings>>("/settings/user");
  return response.data.data;
}

export async function updateUserSettings(
  payload: UpdateUserSettingsPayload
): Promise<UserSettings> {
  const response = await apiClient.put<ApiResponse<UserSettings>>("/settings/user", payload);
  return response.data.data;
}

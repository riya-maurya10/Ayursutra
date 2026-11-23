export interface LoginRequest {
  email: string;
  password: string;
}

export type UserRole =
  | "ADMIN"
  | "DOCTOR"
  | "THERAPIST"
  | "RECEPTIONIST"
  | "PATIENT";

export interface LoginResponse {
  token: string;
  email: string;
  fullName: string;
  role: UserRole;
  profilePictureUrl?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
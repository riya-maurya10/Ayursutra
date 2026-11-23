export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type AppointmentType =
  | 'INITIAL_CONSULTATION'
  | 'FOLLOW_UP'
  | 'PANCHAKARMA_ASSESSMENT'
  | 'GENERAL_AYURVEDIC'
  | 'DIET_LIFESTYLE_CONSULTATION'
  | 'WELLNESS_CHECKUP';

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  doctorId: string;
  doctorUserId?: string;
  doctorName: string;
  doctorSpecialization?: string;
  therapistId?: string;
  therapistName?: string;
  appointmentType: AppointmentType;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm:ss or HH:mm
  endTime: string; // HH:mm:ss or HH:mm
  durationMinutes: number;
  status: AppointmentStatus;
  notes?: string;
  chiefComplaints?: string;
  cancellationReason?: string;
  rejectionReason?: string;
  arrivalRecorded?: boolean;
  arrivalTime?: string;
  reminderSent?: boolean;
  bookedByRole?: string;
  bookedByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BookAppointmentPayload {
  patientId?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  doctorId: string;
  therapistId?: string;
  clinicId?: string;
  appointmentType: AppointmentType;
  appointmentDate: string;
  startTime: string;
  durationMinutes?: number;
  chiefComplaints?: string;
  notes?: string;
}

export interface RescheduleAppointmentPayload {
  newDate: string;
  newStartTime: string;
  durationMinutes?: number;
  reason?: string;
}

export interface CancelAppointmentPayload {
  reason: string;
}

export interface UpdateAppointmentStatusPayload {
  status: AppointmentStatus;
  notes?: string;
  rejectionReason?: string;
}

export interface DoctorSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason: string;
}

export interface AppointmentStats {
  total: number;
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  rescheduled: number;
  noShow: number;
  todayCount: number;
}

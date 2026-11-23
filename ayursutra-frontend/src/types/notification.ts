export type NotificationType =
  | 'PATIENT_REGISTRATION'
  | 'STAFF_REGISTRATION'
  | 'STAFF_VERIFICATION'
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'INVENTORY_ALERT'
  | 'CLINIC_ALERT'
  | 'PATIENT_ASSIGNMENT'
  | 'THERAPY_SCHEDULED'
  | 'THERAPY_CANCELLED'
  | 'THERAPY_COMPLETED'
  | 'THERAPY_REMINDER'
  | 'THERAPY_PLAN_UPDATE'
  | 'PATIENT_PROGRESS'
  | 'PATIENT_ARRIVAL'
  | 'BILLING_UPDATE'
  | 'DIET_REMINDER'
  | 'MEDICINE_REMINDER'
  | 'PROGRESS_REMINDER'
  | 'GENERAL';

export type NotificationStatus = 'UNREAD' | 'READ';

export interface NotificationItem {
  id: string;
  recipientId: string;
  patientId?: string;
  therapistId?: string;
  doctorId?: string;
  therapySessionId?: string;
  therapyPlanId?: string;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  link?: string;
  scheduledAt?: string;
  createdAt: string;
  readAt?: string;
}

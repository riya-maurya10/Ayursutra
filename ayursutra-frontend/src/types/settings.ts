export interface ClinicSettings {
  id?: string;
  clinicId: string;
  clinicName?: string;
  tagline?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  logoUrl?: string;
  currency?: string;
  taxRate?: number;
  invoicePrefix?: string;
  invoiceNumberFormat?: string;
  paymentMethods?: string[];
  lowStockThreshold?: number;
  defaultStockUnits?: string[];
  alertOnLowStock?: boolean;
  appointmentSlotDurationMinutes?: number;
  autoConfirmAppointments?: boolean;
  sendSmsNotifications?: boolean;
  sendEmailNotifications?: boolean;
}

export interface UserSettings {
  id?: string;
  userId: string;
  theme?: string;
  language?: string;
  dateFormat?: string;
  timeZone?: string;
  emailNotifications?: boolean;
  appointmentAlerts?: boolean;
  therapyReminders?: boolean;
  billingAlerts?: boolean;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  workingDays?: string[];
  teleconsultationEnabled?: boolean;
  profileVisibility?: string;
}

export type UpdateClinicSettingsPayload = Partial<Omit<ClinicSettings, "id" | "clinicId">>;
export type UpdateUserSettingsPayload = Partial<Omit<UserSettings, "id" | "userId">>;

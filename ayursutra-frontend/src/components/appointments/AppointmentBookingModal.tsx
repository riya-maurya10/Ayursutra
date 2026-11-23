import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  Clock,
  UserRound,
  Stethoscope,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import apiClient from "../../services/api/client";
import {
  bookAppointment,
  getAvailableSlots,
} from "../../services/appointment/appointmentService";
import type {
  Appointment,
  AppointmentType,
  DoctorSlot,
} from "../../types/appointment";

interface DoctorOption {
  id: string;
  fullName: string;
  specialization?: string;
  qualification?: string;
  available?: boolean;
}

interface PatientOption {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
}

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appointment: Appointment) => void;
  userRole: string;
  preselectedDoctorId?: string;
  preselectedDate?: string;
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string; description: string }[] = [
  {
    value: "INITIAL_CONSULTATION",
    label: "Initial Consultation (Prathama Pariksha)",
    description: "Comprehensive Ayurvedic diagnosis, Nadi Pariksha and lifestyle intake",
  },
  {
    value: "FOLLOW_UP",
    label: "Follow-up Consultation (Anu-Pariksha)",
    description: "Treatment progress review and medication adjustment",
  },
  {
    value: "PANCHAKARMA_ASSESSMENT",
    label: "Panchakarma Assessment",
    description: "Eligibility, pre-procedure (Purvakarma) and detox protocol planning",
  },
  {
    value: "GENERAL_AYURVEDIC",
    label: "General Ayurvedic Consultation",
    description: "General wellness checkup and herbal remedies advice",
  },
  {
    value: "DIET_LIFESTYLE_CONSULTATION",
    label: "Diet & Lifestyle Consultation (Pathya-Apathya)",
    description: "Personalized nutrition plan and daily routine (Dinacharya)",
  },
  {
    value: "WELLNESS_CHECKUP",
    label: "Wellness & Dosha Balance Check",
    description: "Seasonal wellness evaluation and preventive healthcare",
  },
];

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userRole,
  preselectedDoctorId,
  preselectedDate,
}) => {
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(preselectedDoctorId || "");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [guestPatientName, setGuestPatientName] = useState<string>("");
  const [guestPatientEmail, setGuestPatientEmail] = useState<string>("");
  const [guestPatientPhone, setGuestPatientPhone] = useState<string>("");
  const [appointmentType, setAppointmentType] = useState<AppointmentType>("INITIAL_CONSULTATION");
  const [appointmentDate, setAppointmentDate] = useState<string>(
    preselectedDate || new Date().toISOString().split("T")[0]
  );
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("");
  const [chiefComplaints, setChiefComplaints] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  const [slots, setSlots] = useState<DoctorSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const isStaffBooking = userRole === "ADMIN" || userRole === "RECEPTIONIST";

  // Load doctors and patients
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        const docRes = await apiClient.get<{ data?: DoctorOption[] }>("/doctors");
        const docList = docRes.data?.data || [];
        setDoctors(docList);

        if (!selectedDoctorId && docList.length > 0) {
          const firstAvailable = docList.find((d) => d.available !== false) || docList[0];
          setSelectedDoctorId(firstAvailable.id);
        }

        if (isStaffBooking) {
          const patRes = await apiClient.get<{ data?: PatientOption[] }>("/patients");
          setPatients(patRes.data?.data || []);
        }
      } catch (err) {
        console.error("Failed to load doctors/patients", err);
      }
    };

    loadData();
  }, [isOpen, isStaffBooking, selectedDoctorId]);

  // Load available slots whenever selected doctor or date changes
  useEffect(() => {
    if (!selectedDoctorId || !appointmentDate) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setIsLoadingSlots(true);
      setErrorMessage("");
      try {
        const availableSlots = await getAvailableSlots(selectedDoctorId, appointmentDate);
        setSlots(availableSlots);
        setSelectedSlotTime("");
      } catch (err: unknown) {
        console.error("Failed to fetch slots", err);
        setSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, appointmentDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!selectedDoctorId) {
      setErrorMessage("Please select a doctor.");
      return;
    }

    if (!appointmentDate) {
      setErrorMessage("Please select an appointment date.");
      return;
    }

    if (!selectedSlotTime) {
      setErrorMessage("Please select an available time slot.");
      return;
    }

    if (isStaffBooking && !selectedPatientId && !guestPatientName) {
      setErrorMessage("Please select an existing patient or provide patient details.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        doctorId: selectedDoctorId,
        appointmentType,
        appointmentDate,
        startTime: selectedSlotTime,
        chiefComplaints,
        notes,
        ...(isStaffBooking && selectedPatientId ? { patientId: selectedPatientId } : {}),
        ...(isStaffBooking && !selectedPatientId
          ? {
              patientName: guestPatientName,
              patientEmail: guestPatientEmail,
              patientPhone: guestPatientPhone,
            }
          : {}),
      };

      const result = await bookAppointment(payload);
      onSuccess(result);
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Failed to book appointment. Please verify availability and try again.";
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSlotTime = (timeStr: string) => {
    try {
      const [h, m] = timeStr.split(":");
      const hours = parseInt(h, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      return `${displayHours}:${m} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#D9DDCE] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECEFE6] bg-[#F8F6F0] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F3D2E] text-white">
              <Calendar size={20} />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-[#1F3D2E]">
                Book Ayurvedic Consultation
              </h2>
              <p className="text-xs text-[#7A806F]">
                Schedule an appointment with specialized Ayurvedic doctors
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#7A806F] hover:bg-[#ECEFE6] hover:text-[#1F3D2E] transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Patient Selection (for Admin / Receptionist) */}
          {isStaffBooking && (
            <div className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0]/40 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <UserRound size={16} className="text-[#1F3D2E]" />
                <span className="text-xs font-semibold text-[#1F3D2E] uppercase tracking-wider">
                  Patient Information
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4D5C4B] mb-1">
                  Select Existing Patient
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full rounded-xl border border-[#D9DDCE] bg-white px-3 py-2 text-xs text-[#1F3D2E] focus:border-[#1F3D2E] focus:outline-none"
                >
                  <option value="">-- Choose registered patient or enter below --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.email} {p.phone ? `• ${p.phone}` : ""})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedPatientId && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-[#4D5C4B] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={guestPatientName}
                      onChange={(e) => setGuestPatientName(e.target.value)}
                      className="w-full rounded-xl border border-[#D9DDCE] bg-white px-3 py-2 text-xs focus:border-[#1F3D2E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#4D5C4B] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="patient@example.com"
                      value={guestPatientEmail}
                      onChange={(e) => setGuestPatientEmail(e.target.value)}
                      className="w-full rounded-xl border border-[#D9DDCE] bg-white px-3 py-2 text-xs focus:border-[#1F3D2E] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#4D5C4B] mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={guestPatientPhone}
                      onChange={(e) => setGuestPatientPhone(e.target.value)}
                      className="w-full rounded-xl border border-[#D9DDCE] bg-white px-3 py-2 text-xs focus:border-[#1F3D2E] focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2E] mb-1.5 flex items-center gap-1.5">
              <Stethoscope size={15} />
              <span>Select Doctor *</span>
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full rounded-xl border border-[#D9DDCE] bg-white px-3.5 py-2.5 text-xs text-[#1F3D2E] focus:border-[#1F3D2E] focus:outline-none font-medium"
              required
            >
              <option value="">-- Choose Ayurvedic Doctor --</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id} disabled={d.available === false}>
                  {d.fullName} {d.specialization ? `(${d.specialization})` : ""}
                  {d.available === false ? " - [Unavailable]" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Appointment Type */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2E] mb-1.5 flex items-center gap-1.5">
              <Sparkles size={15} />
              <span>Appointment Type *</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {APPOINTMENT_TYPES.map((type) => {
                const isSelected = appointmentType === type.value;
                return (
                  <div
                    key={type.value}
                    onClick={() => setAppointmentType(type.value)}
                    className={`cursor-pointer rounded-xl border p-3 transition ${
                      isSelected
                        ? "border-[#1F3D2E] bg-[#1F3D2E]/5 shadow-xs"
                        : "border-[#ECEFE6] bg-white hover:border-[#D9DDCE]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? "text-[#1F3D2E]" : "text-[#4D5C4B]"
                        }`}
                      >
                        {type.label}
                      </span>
                      {isSelected && <CheckCircle2 size={14} className="text-[#1F3D2E]" />}
                    </div>
                    <p className="mt-1 text-[11px] text-[#7A806F] line-clamp-1">
                      {type.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2E] mb-1.5 flex items-center gap-1.5">
              <Calendar size={15} />
              <span>Select Date *</span>
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full sm:w-64 rounded-xl border border-[#D9DDCE] bg-white px-3.5 py-2 text-xs text-[#1F3D2E] focus:border-[#1F3D2E] focus:outline-none"
              required
            />
          </div>

          {/* Time Slot Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#1F3D2E] flex items-center gap-1.5">
                <Clock size={15} />
                <span>Available Consultation Slots *</span>
              </label>
              {selectedSlotTime && (
                <span className="text-xs font-semibold text-[#1F3D2E]">
                  Selected: {formatSlotTime(selectedSlotTime)}
                </span>
              )}
            </div>

            {isLoadingSlots ? (
              <div className="flex items-center justify-center py-6 text-xs text-[#7A806F]">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1F3D2E] border-t-transparent mr-2" />
                Loading doctor schedule...
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#D9DDCE] p-4 text-center text-xs text-[#7A806F]">
                No available time slots for the chosen doctor and date. Please select another day.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {slots.map((slot) => {
                  const isSelected = selectedSlotTime === slot.startTime;
                  const isAvailable = slot.available;

                  return (
                    <button
                      key={slot.startTime}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedSlotTime(slot.startTime)}
                      title={slot.reason}
                      className={`rounded-xl px-2.5 py-2 text-xs font-semibold transition text-center ${
                        isSelected
                          ? "bg-[#1F3D2E] text-white shadow-xs"
                          : isAvailable
                          ? "bg-[#F8F6F0] text-[#1F3D2E] border border-[#ECEFE6] hover:bg-[#ECEFE6]"
                          : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed line-through"
                      }`}
                    >
                      {formatSlotTime(slot.startTime)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chief Complaints */}
          <div>
            <label className="block text-xs font-semibold text-[#1F3D2E] mb-1.5 flex items-center gap-1.5">
              <FileText size={15} />
              <span>Chief Health Complaints & Symptoms</span>
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Persistent lower back stiffness, digestive issues after meals, headache..."
              value={chiefComplaints}
              onChange={(e) => setChiefComplaints(e.target.value)}
              className="w-full rounded-xl border border-[#D9DDCE] bg-white p-3 text-xs text-[#1F3D2E] focus:border-[#1F3D2E] focus:outline-none"
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-medium text-[#4D5C4B] mb-1">
              Additional Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Previous Panchakarma completed in 2025, prefers morning session"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[#D9DDCE] bg-white px-3 py-2 text-xs focus:border-[#1F3D2E] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEFE6]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#D9DDCE] px-4 py-2.5 text-xs font-semibold text-[#4D5C4B] hover:bg-[#F8F6F0] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedSlotTime}
              className="rounded-xl bg-[#1F3D2E] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#2D5A40] transition disabled:opacity-50"
            >
              {isSubmitting ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

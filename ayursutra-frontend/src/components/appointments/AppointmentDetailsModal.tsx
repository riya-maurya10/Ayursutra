import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  UserRound,
  Stethoscope,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserCheck,
  RotateCcw,
  Ban,
  Activity,
} from "lucide-react";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import {
  rescheduleAppointment,
  cancelAppointment,
  confirmAppointment,
  rejectAppointment,
  recordArrival,
  updateAppointmentStatus,
  getAvailableSlots,
} from "../../services/appointment/appointmentService";
import type { Appointment, DoctorSlot } from "../../types/appointment";

interface AppointmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onUpdate: (updated: Appointment) => void;
  userRole: string;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onUpdate,
  userRole,
}) => {
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [newDate, setNewDate] = useState<string>("");
  const [newSlotTime, setNewSlotTime] = useState<string>("");
  const [rescheduleReason, setRescheduleReason] = useState<string>("");
  const [rescheduleSlots, setRescheduleSlots] = useState<DoctorSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState<boolean>(false);

  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");

  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>("");

  if (!isOpen || !appointment) return null;

  const isStaff = userRole === "ADMIN" || userRole === "RECEPTIONIST";
  const isDoctor = userRole === "DOCTOR";

  // Trigger reschedule mode
  const handleStartReschedule = () => {
    setIsRescheduling(true);
    setIsCancelling(false);
    setIsRejecting(false);
    setActionError("");
    setNewDate(appointment.appointmentDate);
    fetchSlotsForNewDate(appointment.appointmentDate);
  };

  const fetchSlotsForNewDate = async (dateStr: string) => {
    setIsLoadingSlots(true);
    try {
      const list = await getAvailableSlots(appointment.doctorId, dateStr);
      setRescheduleSlots(list);
      setNewSlotTime("");
    } catch {
      setRescheduleSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleDateChange = (dateStr: string) => {
    setNewDate(dateStr);
    fetchSlotsForNewDate(dateStr);
  };

  // Submit Reschedule
  const handleSubmitReschedule = async () => {
    if (!newDate || !newSlotTime) {
      setActionError("Please select a new date and available time slot.");
      return;
    }
    try {
      setIsSubmitting(true);
      setActionError("");
      const updated = await rescheduleAppointment(appointment.id, {
        newDate,
        newStartTime: newSlotTime,
        reason: rescheduleReason,
      });
      onUpdate(updated);
      setIsRescheduling(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Failed to reschedule appointment.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Cancel
  const handleSubmitCancel = async () => {
    if (!cancelReason) {
      setActionError("Please provide a reason for cancellation.");
      return;
    }
    try {
      setIsSubmitting(true);
      setActionError("");
      const updated = await cancelAppointment(appointment.id, { reason: cancelReason });
      onUpdate(updated);
      setIsCancelling(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Failed to cancel appointment.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm
  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      const updated = await confirmAppointment(appointment.id);
      onUpdate(updated);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Failed to confirm appointment.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reject
  const handleSubmitReject = async () => {
    try {
      setIsSubmitting(true);
      const updated = await rejectAppointment(appointment.id, rejectReason);
      onUpdate(updated);
      setIsRejecting(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Failed to reject appointment.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record Arrival
  const handleRecordArrival = async () => {
    try {
      setIsSubmitting(true);
      const updated = await recordArrival(appointment.id);
      onUpdate(updated);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Failed to record patient arrival.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Complete / No-Show
  const handleUpdateStatus = async (status: "COMPLETED" | "NO_SHOW") => {
    try {
      setIsSubmitting(true);
      const updated = await updateAppointmentStatus(appointment.id, { status });
      onUpdate(updated);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err as Error).message ||
        "Failed to update appointment status.";
      setActionError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatSlotTime = (timeStr?: string) => {
    if (!timeStr) return "";
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#D9DDCE] overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECEFE6] bg-[#F8F6F0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F3D2E] text-white">
              <Calendar size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-semibold text-[#1F3D2E]">
                  Appointment Details
                </h2>
                <AppointmentStatusBadge status={appointment.status} size="sm" />
              </div>
              <p className="text-xs text-[#7A806F]">
                Reference ID: <span className="font-mono text-[#1F3D2E]">{appointment.id}</span>
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {actionError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-red-600" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-[#ECEFE6] bg-[#F8F6F0]/40 p-4">
            {/* Patient Info */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#7A806F] uppercase tracking-wider flex items-center gap-1.5">
                <UserRound size={13} />
                <span>Patient</span>
              </span>
              <p className="text-sm font-semibold text-[#1F3D2E]">{appointment.patientName}</p>
              {appointment.patientEmail && (
                <p className="text-xs text-[#5C6757] flex items-center gap-1.5">
                  <Mail size={12} />
                  <span>{appointment.patientEmail}</span>
                </p>
              )}
              {appointment.patientPhone && (
                <p className="text-xs text-[#5C6757] flex items-center gap-1.5">
                  <Phone size={12} />
                  <span>{appointment.patientPhone}</span>
                </p>
              )}
            </div>

            {/* Doctor Info */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-[#7A806F] uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope size={13} />
                <span>Ayurvedic Practitioner</span>
              </span>
              <p className="text-sm font-semibold text-[#1F3D2E]">Dr. {appointment.doctorName}</p>
              {appointment.doctorSpecialization && (
                <p className="text-xs text-[#5C6757]">{appointment.doctorSpecialization}</p>
              )}
              {appointment.therapistName && (
                <p className="text-xs text-[#5C6757]">
                  Assigned Therapist: <span className="font-medium">{appointment.therapistName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Schedule & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#ECEFE6] p-3">
              <span className="text-[11px] text-[#7A806F] flex items-center gap-1">
                <Calendar size={12} /> Date
              </span>
              <p className="text-xs font-semibold text-[#1F3D2E] mt-1">
                {appointment.appointmentDate}
              </p>
            </div>

            <div className="rounded-xl border border-[#ECEFE6] p-3">
              <span className="text-[11px] text-[#7A806F] flex items-center gap-1">
                <Clock size={12} /> Time & Duration
              </span>
              <p className="text-xs font-semibold text-[#1F3D2E] mt-1">
                {formatSlotTime(appointment.startTime)} - {formatSlotTime(appointment.endTime)} (
                {appointment.durationMinutes}m)
              </p>
            </div>

            <div className="rounded-xl border border-[#ECEFE6] p-3">
              <span className="text-[11px] text-[#7A806F] flex items-center gap-1">
                <Activity size={12} /> Appointment Type
              </span>
              <p className="text-xs font-semibold text-[#1F3D2E] mt-1">
                {appointment.appointmentType.replace(/_/g, " ")}
              </p>
            </div>
          </div>

          {/* Arrival Status Badge */}
          <div className="flex items-center justify-between rounded-xl border border-[#ECEFE6] bg-[#F8F6F0]/20 p-3">
            <div className="flex items-center gap-2">
              <UserCheck size={16} className={appointment.arrivalRecorded ? "text-emerald-600" : "text-[#7A806F]"} />
              <div>
                <p className="text-xs font-semibold text-[#1F3D2E]">
                  {appointment.arrivalRecorded ? "Patient Check-in Recorded" : "Patient Not Yet Checked In"}
                </p>
                {appointment.arrivalTime && (
                  <p className="text-[11px] text-[#7A806F]">
                    Arrival timestamp: {new Date(appointment.arrivalTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
            </div>

            {!appointment.arrivalRecorded &&
              (isStaff || isDoctor) &&
              appointment.status !== "CANCELLED" &&
              appointment.status !== "COMPLETED" && (
                <button
                  type="button"
                  onClick={handleRecordArrival}
                  disabled={isSubmitting}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  Mark Patient Arrived
                </button>
              )}
          </div>

          {/* Complaints & Notes */}
          {appointment.chiefComplaints && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#1F3D2E] flex items-center gap-1.5">
                <FileText size={13} /> Chief Complaints
              </span>
              <div className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0]/30 p-3 text-xs text-[#4D5C4B] leading-relaxed">
                {appointment.chiefComplaints}
              </div>
            </div>
          )}

          {appointment.notes && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#1F3D2E]">Clinical Notes</span>
              <div className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0]/30 p-3 text-xs text-[#5C6757] leading-relaxed">
                {appointment.notes}
              </div>
            </div>
          )}

          {appointment.cancellationReason && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 space-y-1 text-xs text-red-900">
              <span className="font-semibold flex items-center gap-1.5">
                <Ban size={13} /> Cancellation Reason
              </span>
              <p>{appointment.cancellationReason}</p>
            </div>
          )}

          {appointment.rejectionReason && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 p-3 space-y-1 text-xs text-red-900">
              <span className="font-semibold flex items-center gap-1.5">
                <Ban size={13} /> Declined Reason
              </span>
              <p>{appointment.rejectionReason}</p>
            </div>
          )}

          {/* Inline Reschedule Form */}
          {isRescheduling && (
            <div className="rounded-xl border-2 border-[#1F3D2E]/20 bg-[#F8F6F0]/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1F3D2E] flex items-center gap-1.5">
                  <RotateCcw size={14} /> Reschedule Appointment
                </span>
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="text-xs text-[#7A806F] hover:text-[#1F3D2E]"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4D5C4B] mb-1">
                  Select New Date
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={newDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="rounded-xl border border-[#D9DDCE] bg-white px-3 py-1.5 text-xs text-[#1F3D2E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4D5C4B] mb-1.5">
                  Select Available Time Slot
                </label>
                {isLoadingSlots ? (
                  <p className="text-xs text-[#7A806F]">Loading available slots...</p>
                ) : rescheduleSlots.length === 0 ? (
                  <p className="text-xs text-[#7A806F]">No available slots on this date.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {rescheduleSlots.map((s) => (
                      <button
                        key={s.startTime}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setNewSlotTime(s.startTime)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          newSlotTime === s.startTime
                            ? "bg-[#1F3D2E] text-white"
                            : s.available
                            ? "bg-white text-[#1F3D2E] border border-[#D9DDCE] hover:bg-[#F8F6F0]"
                            : "bg-gray-100 text-gray-400 line-through cursor-not-allowed"
                        }`}
                      >
                        {formatSlotTime(s.startTime)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#4D5C4B] mb-1">
                  Reason for Rescheduling
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patient travel conflict"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full rounded-xl border border-[#D9DDCE] bg-white px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmitReschedule}
                  disabled={isSubmitting || !newSlotTime}
                  className="rounded-xl bg-[#1F3D2E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#2D5A40] disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Saving..." : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          )}

          {/* Inline Cancel Prompt */}
          {isCancelling && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                  <Ban size={14} /> Cancel Appointment
                </span>
                <button
                  type="button"
                  onClick={() => setIsCancelling(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-red-900 mb-1">
                  Reason for Cancellation *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Patient unavailable / Emergency"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs text-red-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSubmitCancel}
                  disabled={isSubmitting || !cancelReason}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          )}

          {/* Inline Reject Prompt */}
          {isRejecting && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-red-800 flex items-center gap-1.5">
                  <XCircle size={14} /> Decline Appointment Request
                </span>
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-red-900 mb-1">
                  Reason for Declining (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Emergency procedure scheduled"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-red-300 bg-white px-3 py-1.5 text-xs text-red-900 focus:outline-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSubmitReject}
                  disabled={isSubmitting}
                  className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? "Declining..." : "Decline Request"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#ECEFE6] bg-[#F8F6F0]/60 px-6 py-3.5">
          <div className="flex items-center gap-2">
            {/* Status change buttons for pending */}
            {appointment.status === "PENDING" && (isDoctor || isStaff) && (
              <>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition"
                >
                  <CheckCircle size={14} />
                  <span>Confirm</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 rounded-xl border border-red-300 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <XCircle size={14} />
                  <span>Decline</span>
                </button>
              </>
            )}

            {/* Doctor Complete / No-Show actions */}
            {(appointment.status === "CONFIRMED" || appointment.status === "RESCHEDULED") &&
              (isDoctor || isStaff) && (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("COMPLETED")}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl bg-[#1F3D2E] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#2D5A40] shadow-xs transition"
                  >
                    <CheckCircle size={14} />
                    <span>Mark Completed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus("NO_SHOW")}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    <Ban size={14} />
                    <span>Mark No-Show</span>
                  </button>
                </>
              )}
          </div>

          <div className="flex items-center gap-2">
            {/* Reschedule Button */}
            {appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED" && (
              <button
                type="button"
                onClick={handleStartReschedule}
                className="flex items-center gap-1.5 rounded-xl border border-[#D9DDCE] bg-white px-3 py-2 text-xs font-semibold text-[#1F3D2E] hover:bg-[#F8F6F0] transition"
              >
                <RotateCcw size={13} />
                <span>Reschedule</span>
              </button>
            )}

            {/* Cancel Button */}
            {appointment.status !== "COMPLETED" && appointment.status !== "CANCELLED" && (
              <button
                type="button"
                onClick={() => setIsCancelling(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition"
              >
                <Ban size={13} />
                <span>Cancel</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D9DDCE] px-4 py-2 text-xs font-semibold text-[#4D5C4B] hover:bg-[#F8F6F0] transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

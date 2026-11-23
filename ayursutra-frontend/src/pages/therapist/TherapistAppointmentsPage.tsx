import { useEffect, useState, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  RefreshCw,
  CheckCircle2,
  CalendarCheck,
  HeartPulse,
} from "lucide-react";
import { getMyAppointments } from "../../services/appointment/appointmentService";
import { AppointmentCalendarView } from "../../components/appointments/AppointmentCalendarView";
import { AppointmentListView } from "../../components/appointments/AppointmentListView";
import { AppointmentDetailsModal } from "../../components/appointments/AppointmentDetailsModal";
import type { Appointment } from "../../types/appointment";

export default function TherapistAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  const fetchTherapistAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMyAppointments();
      setAppointments(list);
    } catch (err) {
      console.error("Failed to load therapist appointments", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTherapistAppointments();
  }, [fetchTherapistAppointments]);

  const handleSelectAppointment = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateAppointment = (updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelectedAppointment(updated);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const todayCount = appointments.filter((a) => a.appointmentDate === todayStr).length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#71834F]">
            Therapy & Clinical Schedule
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-[#173D2D]">
            Assigned Appointments & Therapy Schedules
          </h1>
          <p className="text-xs text-[#6F7D6D] mt-1">
            Check your consultation assist schedules, therapy timings, and patient clinical appointments.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTherapistAppointments}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-2xl border border-[#D5DDD2] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#173D2D] hover:bg-[#F3F6F1] transition shadow-xs self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-blue-800 flex items-center gap-1">
            <CalendarCheck size={13} /> Scheduled Today
          </span>
          <div className="mt-1 text-2xl font-bold text-blue-900">{todayCount}</div>
          <span className="text-[10px] text-blue-700">Appointments & sessions today</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
            <CheckCircle2 size={13} /> Confirmed Total
          </span>
          <div className="mt-1 text-2xl font-bold text-emerald-900">{confirmedCount}</div>
          <span className="text-[10px] text-emerald-700">Active assigned care</span>
        </div>

        <div className="rounded-2xl border border-[#DFE7DD] bg-white p-4 shadow-xs">
          <span className="text-[11px] font-medium text-[#7A8A78] flex items-center gap-1">
            <HeartPulse size={13} /> Total Assigned
          </span>
          <div className="mt-1 text-2xl font-bold text-[#173D2D]">{appointments.length}</div>
          <span className="text-[10px] text-[#71834F]">On your schedule</span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between border-b border-[#ECEFE6] pb-3">
        <div className="text-xs font-semibold text-[#1F3D2E]">
          Showing {appointments.length} appointments
        </div>

        <div className="flex items-center rounded-xl border border-[#D9DDCE] bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "list"
                ? "bg-[#1F3D2E] text-white shadow-xs"
                : "text-[#4D5C4B] hover:text-[#1F3D2E]"
            }`}
          >
            <ListIcon size={14} />
            <span>List View</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "calendar"
                ? "bg-[#1F3D2E] text-white shadow-xs"
                : "text-[#4D5C4B] hover:text-[#1F3D2E]"
            }`}
          >
            <CalendarIcon size={14} />
            <span>Calendar View</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1F3D2E] border-t-transparent" />
          <p className="mt-3 text-xs font-semibold text-[#7A806F]">Loading assigned appointments...</p>
        </div>
      ) : viewMode === "calendar" ? (
        <AppointmentCalendarView
          appointments={appointments}
          onSelectAppointment={handleSelectAppointment}
        />
      ) : (
        <AppointmentListView
          appointments={appointments}
          onSelectAppointment={handleSelectAppointment}
          userRole="THERAPIST"
        />
      )}

      {/* Details Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
        userRole="THERAPIST"
      />
    </div>
  );
}

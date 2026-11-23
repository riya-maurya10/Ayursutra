import { useEffect, useState, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
  Activity,
} from "lucide-react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import {
  getAppointments,
  getAppointmentStats,
} from "../../services/appointment/appointmentService";
import { AppointmentCalendarView } from "../../components/appointments/AppointmentCalendarView";
import { AppointmentListView } from "../../components/appointments/AppointmentListView";
import { AppointmentBookingModal } from "../../components/appointments/AppointmentBookingModal";
import { AppointmentDetailsModal } from "../../components/appointments/AppointmentDetailsModal";
import type { Appointment, AppointmentStats } from "../../types/appointment";

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [preselectedDate, setPreselectedDate] = useState<string>("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, statsData] = await Promise.all([
        getAppointments(),
        getAppointmentStats(),
      ]);
      setAppointments(list);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load appointments", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSelectAppointment = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateAppointment = (updated: Appointment) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
    setSelectedAppointment(updated);
    getAppointmentStats().then(setStats).catch(() => {});
  };

  const handleBookingSuccess = (newAppt: Appointment) => {
    setAppointments((prev) => [newAppt, ...prev]);
    getAppointmentStats().then(setStats).catch(() => {});
  };

  const handleBookOnDate = (dateStr: string) => {
    setPreselectedDate(dateStr);
    setIsBookingModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8F5]">
      <Sidebar role="ADMIN" />

      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <Topbar title="Clinic Appointments & Consultations" />

        <main className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71834F]">
                Clinical Practice Management
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-[#173D2D]">
                Appointments & Consultations
              </h1>
              <p className="text-xs text-[#6F7D6D] mt-1">
                Oversee doctor schedules, manage patient consultations, and track clinical availability.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-2xl border border-[#D5DDD2] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#173D2D] hover:bg-[#F3F6F1] transition shadow-xs"
                title="Refresh schedule"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPreselectedDate("");
                  setIsBookingModalOpen(true);
                }}
                className="flex items-center gap-2 rounded-2xl bg-[#173D2D] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#25523E] transition"
              >
                <Plus size={16} /> Book Appointment
              </button>
            </div>
          </div>

          {/* Metric Tiles */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="rounded-2xl border border-[#DFE7DD] bg-white p-4 shadow-xs">
                <span className="text-[11px] font-medium text-[#7A8A78]">Total Booked</span>
                <div className="mt-1 text-xl font-bold text-[#173D2D]">{stats.total}</div>
                <span className="text-[10px] text-[#71834F]">All consultations</span>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
                <span className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Confirmed
                </span>
                <div className="mt-1 text-xl font-bold text-emerald-900">{stats.confirmed}</div>
                <span className="text-[10px] text-emerald-700">Scheduled to visit</span>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
                <span className="text-[11px] font-medium text-amber-800 flex items-center gap-1">
                  <Clock size={12} /> Pending
                </span>
                <div className="mt-1 text-xl font-bold text-amber-900">{stats.pending}</div>
                <span className="text-[10px] text-amber-700">Awaiting confirmation</span>
              </div>

              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-xs">
                <span className="text-[11px] font-medium text-blue-800 flex items-center gap-1">
                  <CalendarCheck size={12} /> Today
                </span>
                <div className="mt-1 text-xl font-bold text-blue-900">{stats.todayCount}</div>
                <span className="text-[10px] text-blue-700">Today's appointments</span>
              </div>

              <div className="rounded-2xl border border-[#173D2D]/20 bg-[#173D2D]/5 p-4 shadow-xs">
                <span className="text-[11px] font-medium text-[#173D2D] flex items-center gap-1">
                  <Activity size={12} /> Completed
                </span>
                <div className="mt-1 text-xl font-bold text-[#173D2D]">{stats.completed}</div>
                <span className="text-[10px] text-[#173D2D]/80">Care provided</span>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-xs">
                <span className="text-[11px] font-medium text-red-800 flex items-center gap-1">
                  <AlertCircle size={12} /> Cancelled / No-Show
                </span>
                <div className="mt-1 text-xl font-bold text-red-900">
                  {stats.cancelled + stats.noShow}
                </div>
                <span className="text-[10px] text-red-700">Non-attendances</span>
              </div>
            </div>
          )}

          {/* View Mode Toggle */}
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

          {/* Main Appointment View */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1F3D2E] border-t-transparent" />
              <p className="mt-3 text-xs font-semibold text-[#7A806F]">Loading clinic appointments...</p>
            </div>
          ) : viewMode === "calendar" ? (
            <AppointmentCalendarView
              appointments={appointments}
              onSelectAppointment={handleSelectAppointment}
              onBookOnDate={handleBookOnDate}
            />
          ) : (
            <AppointmentListView
              appointments={appointments}
              onSelectAppointment={handleSelectAppointment}
              userRole="ADMIN"
            />
          )}
        </main>
      </div>

      {/* Booking Modal */}
      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
        userRole="ADMIN"
        preselectedDate={preselectedDate}
      />

      {/* Details & Action Modal */}
      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
        userRole="ADMIN"
      />
    </div>
  );
}

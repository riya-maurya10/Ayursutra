import { useEffect, useState, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  Plus,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { getMyAppointments } from "../../services/appointment/appointmentService";
import { AppointmentCalendarView } from "../../components/appointments/AppointmentCalendarView";
import { AppointmentListView } from "../../components/appointments/AppointmentListView";
import { AppointmentBookingModal } from "../../components/appointments/AppointmentBookingModal";
import { AppointmentDetailsModal } from "../../components/appointments/AppointmentDetailsModal";
import type { Appointment } from "../../types/appointment";

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [preselectedDate, setPreselectedDate] = useState<string>("");

  const fetchPatientAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getMyAppointments();
      setAppointments(list);
    } catch (err) {
      console.error("Failed to load patient appointments", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatientAppointments();
  }, [fetchPatientAppointments]);

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

  const handleBookingSuccess = (newAppt: Appointment) => {
    setAppointments((prev) => [newAppt, ...prev]);
  };

  const handleBookOnDate = (dateStr: string) => {
    setPreselectedDate(dateStr);
    setIsBookingModalOpen(true);
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingCount = appointments.filter(
    (a) => a.appointmentDate >= todayStr && a.status !== "CANCELLED"
  ).length;
  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const completedCount = appointments.filter((a) => a.status === "COMPLETED").length;

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 px-5 py-6 sm:px-6 lg:px-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>

          <h1 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#1F3D2E] md:text-3xl">
            My Doctor Appointments
          </h1>

        </div>
        <button
          type="button"
          onClick={() => {
            setPreselectedDate("");
            setIsBookingModalOpen(true);
          }}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1F3D2E] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2D5A40] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#71834F] focus:ring-offset-2"
        >
          <Plus size={17} />
          Book Appointment
        </button>
      </section>



      {/* SUMMARY CARDS */}

      <section className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

        {/* UPCOMING VISITS */}

        <div className="min-w-0 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-medium text-blue-800">
            <CalendarCheck size={15} />
            Upcoming Visits
          </span>

          <div className="mt-2 text-3xl font-bold text-blue-900">
            {upcomingCount}
          </div>

          <p className="mt-1 text-xs text-blue-700">
            Scheduled consultations ahead
          </p>
        </div>

        {/* CONFIRMED */}

        <div className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-medium text-emerald-800">
            <CheckCircle2 size={15} />
            Confirmed
          </span>

          <div className="mt-2 text-3xl font-bold text-emerald-900">
            {confirmedCount}
          </div>

          <p className="mt-1 text-xs text-emerald-700">
            Doctor confirmed your time
          </p>
        </div>

        {/* COMPLETED */}

        <div className="min-w-0 rounded-2xl border border-violet-200 bg-violet-50/50 p-5 shadow-sm">
          <span className="flex items-center gap-2 text-xs font-medium text-violet-800">
            <Sparkles size={15} />
            Completed Consultations
          </span>

          <div className="mt-2 text-3xl font-bold text-violet-900">
            {completedCount}
          </div>

          <p className="mt-1 text-xs text-violet-700">
            Your past care sessions
          </p>
        </div>

      </section>


      <section className="flex min-w-0 flex-col gap-3 border-b border-[#E1E4DB] pb-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-[#4D5C4B]">
          <span className="font-semibold text-[#1F3D2E]">{appointments.length}</span>{" "}
          appointments in your history
        </p>
        <div className="inline-flex w-fit items-center gap-1 rounded-xl border border-[#E1E4DB] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${viewMode === "list"
                ? "bg-[#1F3D2E] text-white shadow-sm"
                : "text-[#4D5C4B] hover:bg-[#F8F6F0] hover:text-[#1F3D2E]"
              }`}
          >
            <ListIcon size={15} />
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            aria-pressed={viewMode === "calendar"}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${viewMode === "calendar"
                ? "bg-[#1F3D2E] text-white shadow-sm"
                : "text-[#4D5C4B] hover:bg-[#F8F6F0] hover:text-[#1F3D2E]"
              }`}
          >
            <CalendarIcon size={15} />
            Calendar View
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[#E1E4DB] bg-white py-16 text-center shadow-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#1F3D2E] border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-[#718078]">
            Loading your appointments...
          </p>
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
          userRole="PATIENT"
        />
      )}

      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
        userRole="PATIENT"
        preselectedDate={preselectedDate}
      />

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
        userRole="PATIENT"
      />
    </div>
  );
}

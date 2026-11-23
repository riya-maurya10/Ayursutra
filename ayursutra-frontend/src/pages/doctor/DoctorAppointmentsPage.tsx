
import { useEffect, useState, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  List as ListIcon,
  RefreshCw,
  Clock,
  CheckCircle2,
  CalendarCheck,
  UserCheck,
} from "lucide-react";

import { getMyAppointments } from "../../services/appointment/appointmentService";
import { AppointmentCalendarView } from "../../components/appointments/AppointmentCalendarView";
import { AppointmentListView } from "../../components/appointments/AppointmentListView";
import { AppointmentDetailsModal } from "../../components/appointments/AppointmentDetailsModal";
import type { Appointment } from "../../types/appointment";

export default function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] =
    useState<boolean>(false);

  const fetchDoctorAppointments = useCallback(async () => {
    setLoading(true);

    try {
      const list = await getMyAppointments();
      setAppointments(list);
    } catch (err) {
      console.error("Failed to load doctor appointments", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctorAppointments();
  }, [fetchDoctorAppointments]);

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

  const todayCount = appointments.filter(
    (a) => a.appointmentDate === todayStr
  ).length;

  const pendingCount = appointments.filter(
    (a) => a.status === "PENDING"
  ).length;

  const confirmedCount = appointments.filter(
    (a) => a.status === "CONFIRMED"
  ).length;

  const arrivedCount = appointments.filter(
    (a) =>
      a.appointmentDate === todayStr && a.arrivalRecorded
  ).length;

  return (
    <div className="w-full min-w-0 max-w-none space-y-6 px-5 py-6 sm:px-6 lg:px-8">


      {/* PAGE HEADER */}

      <section className="flex min-w-0 items-center justify-between gap-4">

        <div className="min-w-0">
          <h1 className="font-sans text-2xl font-bold tracking-tight text-[#1F3D2E] md:text-3xl">
            My Patient Appointments
          </h1>

          {/* <p className="mt-1 text-sm text-[#718078]">
            Review patient consultations and manage your appointments.
          </p> */}
        </div>

        <button
          type="button"
          onClick={fetchDoctorAppointments}
          disabled={loading}
          title="Refresh appointments"
          aria-label="Refresh appointments"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E1E4DB] bg-white text-[#1F3D2E] shadow-sm transition hover:bg-[#F3F6F1] hover:shadow-md disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={loading ? "animate-spin" : ""}
          />
        </button>

      </section>


      {/* SUMMARY CARDS */}

      <section className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

        {/* TODAY'S CONSULTATIONS */}

        <div className="min-w-0 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">

          <span className="flex items-center gap-2 text-xs font-medium text-blue-800">
            <CalendarCheck size={15} />
            Today's Consultations
          </span>

          <div className="mt-2 text-3xl font-bold text-blue-900">
            {todayCount}
          </div>

          <p className="mt-1 text-xs text-blue-700">
            Scheduled on your calendar
          </p>

        </div>

        {/* CHECKED IN */}

        <div className="min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm">

          <span className="flex items-center gap-2 text-xs font-medium text-emerald-800">
            <UserCheck size={15} />
            Checked In Today
          </span>

          <div className="mt-2 text-3xl font-bold text-emerald-900">
            {arrivedCount}
          </div>

          <p className="mt-1 text-xs text-emerald-700">
            Waiting at front clinic desk
          </p>

        </div>

        {/* PENDING REQUESTS */}

        <div className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">

          <span className="flex items-center gap-2 text-xs font-medium text-amber-800">
            <Clock size={15} />
            Requests Pending
          </span>

          <div className="mt-2 text-3xl font-bold text-amber-900">
            {pendingCount}
          </div>

          <p className="mt-1 text-xs text-amber-700">
            Requires your approval
          </p>

        </div>

        {/* CONFIRMED TOTAL */}

        <div className="min-w-0 rounded-2xl border border-[#DFE7DD] bg-white p-5 shadow-sm">

          <span className="flex items-center gap-2 text-xs font-medium text-[#7A8A78]">
            <CheckCircle2 size={15} />
            Confirmed Total
          </span>

          <div className="mt-2 text-3xl font-bold text-[#173D2D]">
            {confirmedCount}
          </div>

          <p className="mt-1 text-xs text-[#71834F]">
            Active consultations
          </p>

        </div>

      </section>

      {/* APPOINTMENT COUNT + VIEW TOGGLE */}

      <section className="flex min-w-0 flex-col gap-3 border-b border-[#E1E4DB] pb-5 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-sm font-medium text-[#4D5C4B]">
          <span className="font-semibold text-[#1F3D2E]">
            {appointments.length}
          </span>{" "}
          appointments assigned to you
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

      {/* MAIN CONTENT */}

      {loading ? (

        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-[#E1E4DB] bg-white py-16 text-center shadow-sm">

          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#1F3D2E] border-t-transparent" />

          <p className="mt-4 text-sm font-medium text-[#718078]">
            Loading your patient consultations...
          </p>

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
          userRole="DOCTOR"
        />

      )}

      {/* APPOINTMENT DETAILS MODAL */}

      <AppointmentDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        appointment={selectedAppointment}
        onUpdate={handleUpdateAppointment}
        userRole="DOCTOR"
      />

    </div>
  );
}

import React, { useState } from "react";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  ChevronRight,
  UserCheck,
  CalendarX,
} from "lucide-react";
import { AppointmentStatusBadge } from "./AppointmentStatusBadge";
import type { Appointment, AppointmentStatus } from "../../types/appointment";

interface AppointmentListViewProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  userRole?: string;
}

export const AppointmentListView: React.FC<AppointmentListViewProps> = ({
  appointments,
  onSelectAppointment,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");

  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const filteredAppointments = appointments.filter((appt) => {
    // Search
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      appt.patientName.toLowerCase().includes(query) ||
      appt.doctorName.toLowerCase().includes(query) ||
      (appt.chiefComplaints && appt.chiefComplaints.toLowerCase().includes(query)) ||
      (appt.notes && appt.notes.toLowerCase().includes(query));

    // Status
    const matchesStatus =
      statusFilter === "ALL" || appt.status === (statusFilter as AppointmentStatus);

    // Date
    let matchesDate = true;
    if (dateFilter === "TODAY") {
      matchesDate = appt.appointmentDate === todayStr;
    } else if (dateFilter === "TOMORROW") {
      matchesDate = appt.appointmentDate === tomorrowStr;
    } else if (dateFilter === "UPCOMING") {
      matchesDate = appt.appointmentDate >= todayStr;
    } else if (dateFilter === "PAST") {
      matchesDate = appt.appointmentDate < todayStr;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

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
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-[#D9DDCE] bg-white p-3.5 shadow-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A806F]" />
          <input
            type="text"
            placeholder="Search by patient, practitioner, complaints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#ECEFE6] bg-[#F8F6F0]/40 pl-9 pr-3 py-2 text-xs text-[#1F3D2E] placeholder-[#7A806F] focus:border-[#1F3D2E] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#ECEFE6] bg-[#F8F6F0]/40 px-2.5 py-1.5">
            <Filter size={13} className="text-[#7A806F]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#1F3D2E] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PENDING">Pending</option>
              <option value="RESCHEDULED">Rescheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#ECEFE6] bg-[#F8F6F0]/40 px-2.5 py-1.5">
            <Calendar size={13} className="text-[#7A806F]" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#1F3D2E] focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Dates</option>
              <option value="TODAY">Today</option>
              <option value="TOMORROW">Tomorrow</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="PAST">Past</option>
            </select>
          </div>
        </div>
      </div>

      {/* Appointment List / Cards */}
      {filteredAppointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#D9DDCE] bg-white p-12 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F0] text-[#7A806F]">
            <CalendarX size={24} />
          </div>
          <h4 className="text-sm font-semibold text-[#1F3D2E]">No appointments found</h4>
          <p className="mt-1 text-xs text-[#7A806F] max-w-sm mx-auto">
            {searchQuery || statusFilter !== "ALL" || dateFilter !== "ALL"
              ? "No appointments match your active filter criteria. Try resetting your search."
              : "No appointments scheduled. Use the 'Book Appointment' button to schedule consultations."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#D9DDCE] bg-white shadow-xs overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECEFE6] bg-[#F8F6F0]/60 text-[11px] font-semibold text-[#7A806F] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Patient</th>
                  <th className="py-3 px-4">Doctor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Arrival</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE6]">
                {filteredAppointments.map((appt) => {
                  const isToday = appt.appointmentDate === todayStr;

                  return (
                    <tr
                      key={appt.id}
                      onClick={() => onSelectAppointment(appt)}
                      className="group cursor-pointer transition hover:bg-[#F8F6F0]/60"
                    >
                      <td className="py-3.5 px-4 font-medium text-[#1F3D2E]">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-[#7A806F]" />
                          <span className={isToday ? "font-semibold text-emerald-800" : ""}>
                            {appt.appointmentDate}
                          </span>
                          {isToday && (
                            <span className="rounded-md bg-emerald-100 text-emerald-800 px-1 text-[10px] font-semibold">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#7A806F]">
                          <Clock size={11} />
                          <span>
                            {formatSlotTime(appt.startTime)} - {formatSlotTime(appt.endTime)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1F3D2E]">{appt.patientName}</div>
                        {appt.patientPhone && (
                          <div className="text-[11px] text-[#7A806F]">{appt.patientPhone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#1F3D2E]">Dr. {appt.doctorName}</div>
                        {appt.doctorSpecialization && (
                          <div className="text-[11px] text-[#7A806F]">{appt.doctorSpecialization}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="rounded-lg bg-[#F8F6F0] border border-[#ECEFE6] px-2 py-0.5 text-[11px] font-medium text-[#4D5C4B]">
                          {appt.appointmentType.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <AppointmentStatusBadge status={appt.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {appt.arrivalRecorded ? (
                          <span
                            className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 p-1"
                            title={`Arrived at ${appt.arrivalTime || "clinic"}`}
                          >
                            <UserCheck size={14} />
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#A6AC9B]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F3D2E] group-hover:text-[#2D5A40]"
                        >
                          <span>Details</span>
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[#ECEFE6]">
            {filteredAppointments.map((appt) => (
              <div
                key={appt.id}
                onClick={() => onSelectAppointment(appt)}
                className="p-4 space-y-2.5 transition active:bg-[#F8F6F0]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3D2E]">
                    <Calendar size={13} className="text-[#7A806F]" />
                    <span>{appt.appointmentDate}</span>
                    <span className="text-[#7A806F]">({formatSlotTime(appt.startTime)})</span>
                  </div>
                  <AppointmentStatusBadge status={appt.status} size="sm" />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-[#1F3D2E]">{appt.patientName}</p>
                    <p className="text-[11px] text-[#7A806F]">Dr. {appt.doctorName}</p>
                  </div>
                  <span className="text-[11px] font-medium text-[#4D5C4B] bg-[#F8F6F0] px-2 py-0.5 rounded-md border border-[#ECEFE6]">
                    {appt.appointmentType.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

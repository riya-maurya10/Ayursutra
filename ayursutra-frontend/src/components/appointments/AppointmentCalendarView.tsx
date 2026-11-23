import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Appointment } from "../../types/appointment";

interface AppointmentCalendarViewProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  onBookOnDate?: (dateStr: string) => void;
}

export const AppointmentCalendarView: React.FC<AppointmentCalendarViewProps> = ({
  appointments,
  onSelectAppointment,
  onBookOnDate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const startingDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday
  const totalDays = lastDayOfMonth.getDate();

  // Month navigation
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group appointments by date string (YYYY-MM-DD)
  const apptMap = appointments.reduce((acc, appt) => {
    const key = appt.appointmentDate;
    if (!acc[key]) acc[key] = [];
    acc[key].push(appt);
    return acc;
  }, {} as Record<string, Appointment[]>);

  // Pad days from previous month
  const calendarCells = [];
  for (let i = 0; i < startingDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(d).padStart(2, "0");
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    calendarCells.push({ dayNumber: d, dateStr });
  }

  const todayStr = new Date().toISOString().split("T")[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "RESCHEDULED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "COMPLETED":
        return "bg-[#1F3D2E]/10 text-[#1F3D2E] border-[#1F3D2E]/20";
      case "CANCELLED":
        return "bg-red-100 text-red-700 border-red-200 line-through";
      case "NO_SHOW":
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="rounded-2xl border border-[#D9DDCE] bg-white shadow-xs overflow-hidden">
      {/* Calendar Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#ECEFE6] bg-[#F8F6F0]/60 p-4 gap-3">
        <div className="flex items-center gap-3">
          <h3 className="font-serif text-lg font-semibold text-[#1F3D2E]">
            {monthNames[month]} {year}
          </h3>
          <button
            type="button"
            onClick={goToday}
            className="rounded-lg border border-[#D9DDCE] bg-white px-2.5 py-1 text-xs font-semibold text-[#1F3D2E] hover:bg-[#F8F6F0] transition"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-xl border border-[#D9DDCE] p-1.5 text-[#4D5C4B] hover:bg-white transition"
            aria-label="Previous Month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-xl border border-[#D9DDCE] p-1.5 text-[#4D5C4B] hover:bg-white transition"
            aria-label="Next Month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-[#ECEFE6] bg-[#F8F6F0]/30 text-center text-xs font-semibold text-[#7A806F] py-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-[#ECEFE6] auto-rows-fr">
        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[100px] sm:min-h-[120px] bg-[#FAF8F5]/50 p-2"
              />
            );
          }

          const isToday = cell.dateStr === todayStr;
          const dayAppts = apptMap[cell.dateStr] || [];

          return (
            <div
              key={cell.dateStr}
              className={`group relative min-h-[100px] sm:min-h-[120px] p-2 transition hover:bg-[#F8F6F0]/40 flex flex-col justify-between ${
                isToday ? "bg-emerald-50/20" : "bg-white"
              }`}
            >
              {/* Day header */}
              <div className="flex items-center justify-between">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday
                      ? "bg-[#1F3D2E] text-white"
                      : "text-[#1F3D2E]"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {onBookOnDate && (
                  <button
                    type="button"
                    onClick={() => onBookOnDate(cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 rounded-md p-0.5 text-[#7A806F] hover:bg-[#ECEFE6] hover:text-[#1F3D2E] transition"
                    title={`Book appointment on ${cell.dateStr}`}
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Day Appointment Pills */}
              <div className="mt-1 space-y-1 overflow-y-auto max-h-20 sm:max-h-24">
                {dayAppts.slice(0, 3).map((appt) => (
                  <div
                    key={appt.id}
                    onClick={() => onSelectAppointment(appt)}
                    className={`cursor-pointer rounded-lg border px-1.5 py-1 text-[10px] font-medium leading-tight truncate transition hover:shadow-xs ${getStatusColor(
                      appt.status
                    )}`}
                    title={`${appt.startTime} - ${appt.patientName} (${appt.doctorName})`}
                  >
                    <span className="font-semibold">{appt.startTime.slice(0, 5)}</span>{" "}
                    <span>{appt.patientName}</span>
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <div className="text-[10px] font-semibold text-[#7A806F] px-1">
                    +{dayAppts.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

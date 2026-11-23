import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  DoorOpen,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import apiClient from "../../services/api/client";
import {
  getAllPatients,
  getAllRooms,
  getAllTherapists,
  type PatientResponse,
  type RoomResponse,
  type TherapistResponse,
} from "../../services/doctor/doctorService";

interface TherapyPlan {
  id: string;
  patientId: string;
  doctorId: string;
  planName: string;
  diagnosis: string | null;
  startDate: string;
  endDate: string;
  status: string;
  therapies: {
    day: number;
    therapyId: string;
    therapyName: string;
    durationMinutes: number;
    sequenceOrder: number;
  }[];
}

interface TherapySession {
  id: string;
  therapyPlanId: string;
  patientId: string;
  therapistId: string | null;
  roomId: string | null;
  therapyId: string;
  therapyName: string;
  dayNumber: number;
  sequenceOrder: number;
  sessionDate: string;
  startTime: string;
  endTime: string;
  plannedDurationMinutes: number;
  actualDurationMinutes: number | null;
  status: string;
  notes: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

type StatusFilter =
  | "ALL"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(date: string): Date | null {
  if (!date || date === "UNKNOWN") return null;
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function DoctorTherapySessionsPage() {
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [patients, setPatients] = useState<PatientResponse[]>([]);
  const [therapists, setTherapists] = useState<TherapistResponse[]>([]);
  const [rooms, setRooms] = useState<RoomResponse[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");

  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("LIST");
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));

  // LOAD DATA
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        setError("");

        const [
          plansResponse,
          patientsResponse,
          therapistsResponse,
          roomsResponse,
        ] = await Promise.all([
          apiClient.get<ApiResponse<TherapyPlan[]>>(
            "/therapy-plans/doctor/my"
          ),
          getAllPatients(),
          getAllTherapists(),
          getAllRooms(),
        ]);

        const doctorPlans = plansResponse.data.data ?? [];

        setPatients(patientsResponse ?? []);
        setTherapists(therapistsResponse ?? []);
        setRooms(roomsResponse ?? []);

        const sessionResponses = await Promise.all(
          doctorPlans.map(async (plan) => {
            try {
              const response = await apiClient.get<
                ApiResponse<TherapySession[]>
              >(`/therapy-sessions/plan/${plan.id}`);

              return response.data.data ?? [];
            } catch (sessionError) {
              console.error(
                `Failed to load sessions for plan ${plan.id}:`,
                sessionError
              );
              return [];
            }
          })
        );

        const allSessions = sessionResponses.flat();

        allSessions.sort((a, b) => {
          const dateA = `${a.sessionDate ?? ""} ${a.startTime ?? ""}`;
          const dateB = `${b.sessionDate ?? ""} ${b.startTime ?? ""}`;

          if (dateA !== dateB) {
            return dateA.localeCompare(dateB);
          }

          return (
            (a.sequenceOrder ?? 0) -
            (b.sequenceOrder ?? 0)
          );
        });

        setSessions(allSessions);
      } catch (err) {
        console.error(
          "Failed to load doctor therapy sessions:",
          err
        );

        setError(
          "Unable to load therapy sessions. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // LOOKUPS
  const getPatient = (patientId: string) =>
    patients.find((patient) => patient.id === patientId);

  const getTherapist = (therapistId: string | null) => {
    if (!therapistId) return undefined;

    return therapists.find(
      (therapist) => therapist.id === therapistId
    );
  };

  const getRoom = (roomId: string | null) => {
    if (!roomId) return undefined;

    return rooms.find((room) => room.id === roomId);
  };

  // SUMMARY COUNTS
  const totalSessions = sessions.length;

  const scheduledSessions = sessions.filter((session) => {
    const status = session.status?.toUpperCase();

    return status === "PLANNED" || status === "SCHEDULED";
  }).length;

  const inProgressSessions = sessions.filter(
    (session) =>
      session.status?.toUpperCase() === "IN_PROGRESS"
  ).length;

  const completedSessions = sessions.filter(
    (session) =>
      session.status?.toUpperCase() === "COMPLETED"
  ).length;

  // FILTERED SESSIONS
  const filteredSessions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return sessions.filter((session) => {
      const patient = getPatient(session.patientId);
      const therapist = getTherapist(session.therapistId);
      const room = getRoom(session.roomId);

      const patientName =
        patient?.fullName?.toLowerCase() ?? "";

      const therapyName =
        session.therapyName?.toLowerCase() ?? "";

      const therapistName =
        therapist?.fullName?.toLowerCase() ?? "";

      const roomNumber =
        room?.roomNumber?.toLowerCase() ?? "";

      const roomName = room?.name?.toLowerCase() ?? "";
      const status = session.status?.toLowerCase() ?? "";
      const notes = session.notes?.toLowerCase() ?? "";

      const matchesSearch =
        search === "" ||
        patientName.includes(search) ||
        therapyName.includes(search) ||
        therapistName.includes(search) ||
        roomNumber.includes(search) ||
        roomName.includes(search) ||
        status.includes(search) ||
        notes.includes(search);

      const normalizedStatus = session.status?.toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "SCHEDULED" &&
          (normalizedStatus === "PLANNED" ||
            normalizedStatus === "SCHEDULED")) ||
        normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [
    sessions,
    patients,
    therapists,
    rooms,
    searchTerm,
    statusFilter,
  ]);

  // GROUP BY DATE
  const groupedSessions = useMemo(() => {
    const groups: Record<string, TherapySession[]> = {};

    filteredSessions.forEach((session) => {
      const date = session.sessionDate || "UNKNOWN";

      if (!groups[date]) {
        groups[date] = [];
      }

      groups[date].push(session);
    });

    return Object.entries(groups).sort(
      ([dateA], [dateB]) => dateA.localeCompare(dateB)
    );
  }, [filteredSessions]);

  // CALENDAR DATA
  const calendarDays = useMemo(() => {
    const firstDay = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      1
    );

    const gridStart = new Date(
      firstDay.getFullYear(),
      firstDay.getMonth(),
      firstDay.getDate() - firstDay.getDay()
    );

    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      return day;
    });
  }, [calendarMonth]);

  const sessionsByDate = useMemo(() => {
    const grouped: Record<string, TherapySession[]> = {};

    filteredSessions.forEach((session) => {
      if (!session.sessionDate) return;

      if (!grouped[session.sessionDate]) {
        grouped[session.sessionDate] = [];
      }

      grouped[session.sessionDate].push(session);
    });

    return grouped;
  }, [filteredSessions]);

  const selectedDateSessions = sessionsByDate[selectedDate] ?? [];
  const todayKey = toDateKey(new Date());

  // FORMAT DATE
  const formatDate = (date: string) => {
    if (!date || date === "UNKNOWN") {
      return "Unknown date";
    }

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-IN",
      {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // FORMAT TIME
  const formatTime = (time: string) => {
    if (!time) return "—";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(
      Number(hours),
      Number(minutes),
      0,
      0
    );

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  // UI STATUS
  const getDisplayStatus = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PLANNED":
      case "SCHEDULED":
        return "Scheduled";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return "Unknown";
    }
  };

  // STATUS CLASSES
  const getStatusClasses = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PLANNED":
      case "SCHEDULED":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "IN_PROGRESS":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "COMPLETED":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "CANCELLED":
        return "border-red-200 bg-red-50 text-red-700";
      default:
        return "border-gray-200 bg-gray-50 text-gray-600";
    }
  };

  // STATUS DOT
  const getStatusDot = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PLANNED":
      case "SCHEDULED":
        return "bg-blue-500";
      case "IN_PROGRESS":
        return "bg-amber-500";
      case "COMPLETED":
        return "bg-emerald-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  // CLEAR FILTERS
  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
  };

  // LOADING
  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />

          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading therapy sessions...
          </p>

          <p className="mt-1 text-xs text-gray-400">
            Fetching your scheduled treatments
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 px-6 py-5 lg:px-8">
      {/* HEADER */}
      <div className="flex flex-col gap-4 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#173D2D]">
            Therapy Sessions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your patients, treatment plans and care sessions.
          </p>
        </div>

        <div className="inline-flex w-fit rounded-xl border border-[#D8E1D4] bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode("LIST")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${viewMode === "LIST"
                ? "bg-[#1B4936] text-white shadow-sm"
                : "text-gray-600 hover:bg-[#F1F5EF]"
              }`}
          >
            <UsersRound className="h-4 w-4" />
            List
          </button>

          <button
            type="button"
            onClick={() => setViewMode("CALENDAR")}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${viewMode === "CALENDAR"
                ? "bg-[#1B4936] text-white shadow-sm"
                : "text-gray-600 hover:bg-[#F1F5EF]"
              }`}
          >
            <CalendarDays className="h-4 w-4" />
            Calendar
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Sessions */}
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">
                Total Sessions
              </p>
              <p className="mt-2 text-2xl font-semibold text-blue-950">
                {totalSessions}
              </p>
              <p className="mt-1 text-xs text-blue-600">
                All therapy sessions
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
              <CalendarDays className="h-5 w-5 text-blue-700" />
            </div>
          </div>
        </div>

        {/* Scheduled */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-sky-700">
                Scheduled
              </p>
              <p className="mt-2 text-2xl font-semibold text-sky-950">
                {scheduledSessions}
              </p>
              <p className="mt-1 text-xs text-sky-600">
                Upcoming treatment
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100">
              <Clock3 className="h-5 w-5 text-sky-700" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-amber-200 bg-amber-100/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-700">
                In Progress
              </p>
              <p className="mt-2 text-2xl font-semibold text-amber-950">
                {inProgressSessions}
              </p>
              <p className="mt-1 text-xs text-amber-600">
                Currently underway
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
              <Clock3 className="h-5 w-5 text-amber-700" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-100/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">
                Completed
              </p>
              <p className="mt-2 text-2xl font-semibold text-emerald-950">
                {completedSessions}
              </p>
              <p className="mt-1 text-xs text-emerald-600">
                Finished treatments
              </p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search patient, therapy, therapist or room..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />

            {searchTerm.length > 0 && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* STATUS FILTERS */}
          <div className="flex shrink-0 flex-wrap gap-2">
            {(
              [
                ["ALL", "All"],
                ["SCHEDULED", "Scheduled"],
                ["IN_PROGRESS", "In Progress"],
                ["COMPLETED", "Completed"],
                ["CANCELLED", "Cancelled"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${statusFilter === value
                    ? "border-emerald-700 bg-emerald-700 text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* RESULT COUNT */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {filteredSessions.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {sessions.length}
            </span>{" "}
            sessions
          </p>

          {(searchTerm || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-emerald-700 transition hover:text-emerald-900"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </div>
      )}

      {/* EMPTY STATE */}
      {!error && filteredSessions.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <CalendarDays className="h-6 w-6 text-gray-400" />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            {searchTerm || statusFilter !== "ALL"
              ? "No matching sessions"
              : "No therapy sessions yet"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            {searchTerm || statusFilter !== "ALL"
              ? "Try a different search term or clear the filters to view all sessions."
              : "Scheduled therapy sessions will appear here once treatments are scheduled for your patients."}
          </p>

          {(searchTerm || statusFilter !== "ALL") && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
      {/* CALENDAR VIEW */}
      {!error && viewMode === "CALENDAR" && (
        <section className="rounded-2xl border border-[#E3E5DC] bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#173D2D]">
                Treatment Calendar
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Select a date to view its scheduled therapy sessions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  setCalendarMonth(
                    new Date(today.getFullYear(), today.getMonth(), 1)
                  );
                  setSelectedDate(toDateKey(today));
                }}
                className="rounded-lg border border-[#D8E1D4] px-3 py-2 text-sm font-medium text-[#285640] transition hover:bg-[#F1F5EF]"
              >
                Today
              </button>

              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setCalendarMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() - 1,
                        1
                      )
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-[#AFC5AD] hover:bg-[#F1F5EF]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <h3 className="min-w-[135px] text-center text-base font-semibold text-gray-800">
                {calendarMonth.toLocaleDateString("en-IN", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setCalendarMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        1
                      )
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-[#AFC5AD] hover:bg-[#F1F5EF]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* STATUS LEGEND */}
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2">
            {[
              ["bg-blue-500", "Scheduled"],
              ["bg-amber-500", "In Progress"],
              ["bg-emerald-500", "Completed"],
              ["bg-red-500", "Cancelled"],
            ].map(([dot, label]) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 text-xs text-gray-600"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
                {label}
              </span>
            ))}
          </div>

          {/* MONTHLY CALENDAR */}
          <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-gray-200">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <div
                  key={day}
                  className="border-b border-r border-gray-200 bg-[#F7F8F4] px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:py-3 sm:text-xs"
                >
                  {day}
                </div>
              )
            )}

            {calendarDays.map((day) => {
              const dateKey = toDateKey(day);
              const daySessions = sessionsByDate[dateKey] ?? [];
              const isCurrentMonth =
                day.getMonth() === calendarMonth.getMonth();
              const isSelected = dateKey === selectedDate;
              const isToday = dateKey === todayKey;

              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => setSelectedDate(dateKey)}
                  aria-pressed={isSelected}
                  className={`min-h-[76px] border-b border-r border-gray-100 p-1.5 text-left transition sm:min-h-[112px] sm:p-2 ${isSelected
                      ? "bg-[#EAF3E5] ring-2 ring-inset ring-[#6F9673]"
                      : "bg-white hover:bg-[#F7FAF5]"
                    } ${!isCurrentMonth ? "opacity-45" : ""}`}
                >
                  <span
                    className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold ${isToday
                        ? "bg-[#1B4936] text-white"
                        : isSelected
                          ? "text-[#1B4936]"
                          : "text-gray-700"
                      }`}
                  >
                    {day.getDate()}
                  </span>

                  <div className="mt-1 space-y-1">
                    {daySessions.slice(0, 2).map((session) => (
                      <div
                        key={session.id}
                        className={`hidden truncate rounded px-1.5 py-1 text-[10px] font-medium sm:block ${getStatusClasses(
                          session.status
                        )}`}
                      >
                        {formatTime(session.startTime)} ·{" "}
                        {session.therapyName}
                      </div>
                    ))}

                    {daySessions.slice(0, 3).map((session) => (
                      <span
                        key={`dot-${session.id}`}
                        className={`mx-0.5 inline-block h-1.5 w-1.5 rounded-full sm:hidden ${getStatusDot(
                          session.status
                        )}`}
                      />
                    ))}

                    {daySessions.length > 2 && (
                      <p className="hidden text-[10px] font-medium text-gray-500 sm:block">
                        +{daySessions.length - 2} more
                      </p>
                    )}

                    {daySessions.length > 0 && (
                      <p className="hidden text-[10px] text-gray-400 sm:block">
                        {daySessions.length}{" "}
                        {daySessions.length === 1 ? "session" : "sessions"}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* SELECTED DATE SESSIONS */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="font-semibold text-[#173D2D]">
                  Sessions for{" "}
                  {parseLocalDate(selectedDate)?.toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  ) ?? selectedDate}
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  {selectedDateSessions.length}{" "}
                  {selectedDateSessions.length === 1
                    ? "session"
                    : "sessions"}{" "}
                  on this date
                </p>
              </div>

              {selectedDate === todayKey && (
                <span className="rounded-full bg-[#EAF3E5] px-3 py-1 text-xs font-medium text-[#285640]">
                  Today
                </span>
              )}
            </div>

            {selectedDateSessions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 bg-[#FAFBF8] px-4 py-9 text-center">
                <CalendarDays className="mx-auto h-7 w-7 text-gray-300" />
                <p className="mt-2 text-sm font-medium text-gray-700">
                  No sessions on this date
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Choose another date or adjust your search and status
                  filters.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateSessions.map((session) => {
                  const patient = getPatient(session.patientId);
                  const therapist = getTherapist(session.therapistId);
                  const room = getRoom(session.roomId);

                  return (
                    <article
                      key={session.id}
                      className="rounded-xl border border-[#DCE5D8] bg-[#F8FAF6] p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {session.therapyName}
                            </h4>

                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                                session.status
                              )}`}
                            >
                              {getDisplayStatus(session.status)}
                            </span>
                          </div>

                          <p className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                            <UserRound className="h-4 w-4 text-gray-400" />
                            {patient?.fullName ?? "Unknown Patient"}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 text-sm font-semibold text-[#285640]">
                          <Clock3 className="h-4 w-4" />
                          {formatTime(session.startTime)} –{" "}
                          {formatTime(session.endTime)}
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-3">
                        <p>
                          <span className="font-semibold text-gray-500">
                            Duration:
                          </span>{" "}
                          {session.plannedDurationMinutes} minutes
                        </p>

                        <p>
                          <span className="font-semibold text-gray-500">
                            Therapist:
                          </span>{" "}
                          {therapist?.fullName ?? "Not assigned"}
                        </p>

                        <p>
                          <span className="font-semibold text-gray-500">
                            Room:
                          </span>{" "}
                          {room?.roomNumber ?? "Not assigned"}
                          {room?.name ? ` · ${room.name}` : ""}
                        </p>
                      </div>

                      {session.notes && (
                        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-gray-600">
                          {session.notes}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* SESSION LIST */}
      {!error && viewMode === "LIST" && groupedSessions.length > 0 && (
        <div className="space-y-6">
          {groupedSessions.map(([date, dateSessions]) => (
            <section key={date}>
              {/* DATE HEADING */}
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
                  <CalendarDays className="h-4 w-4 text-emerald-700" />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-gray-900">
                    {formatDate(date)}
                  </h2>

                  <p className="text-xs text-gray-400">
                    {dateSessions.length}{" "}
                    {dateSessions.length === 1
                      ? "session"
                      : "sessions"}
                  </p>
                </div>
              </div>

              {/* SESSIONS */}
              <div className="space-y-3">
                {dateSessions.map((session, sessionIndex) => {
                  const patient = getPatient(session.patientId);
                  const therapist = getTherapist(session.therapistId);
                  const room = getRoom(session.roomId);

                  return (
                    <div
                      key={session.id}
                      className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${sessionIndex % 2 === 0
                          ? "border-[#B8D0AD] bg-[#EAF3E5] hover:border-[#9FBE91]"
                          : "border-[#B7CBE8] bg-[#E8F0FA] hover:border-[#9CB7DF]"
                        }`}
                    >
                      {/* SESSION HEADER */}
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {session.therapyName}
                            </h3>

                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                                session.status
                              )}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
                                  session.status
                                )}`}
                              />

                              {getDisplayStatus(session.status)}
                            </span>
                          </div>

                          {/* PATIENT */}
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <UserRound className="h-4 w-4 text-gray-400" />

                            <span className="font-medium text-gray-800">
                              {patient?.fullName ?? "Unknown Patient"}
                            </span>
                          </div>
                        </div>

                        {/* TIME */}
                        <div className="flex shrink-0 items-center gap-3 rounded-xl bg-white/80 px-4 py-3">
                          <Clock3 className="h-5 w-5 text-emerald-700" />

                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formatTime(session.startTime)}
                            </p>

                            <p className="text-xs text-gray-500">
                              to {formatTime(session.endTime)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="my-5 h-px bg-gray-300/50" />

                      {/* SESSION DETAILS */}
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* TREATMENT DAY */}
                        <div className="rounded-xl border border-gray-200/80 bg-white/85 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            Treatment Day
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-800">
                            Day {session.dayNumber}
                          </p>
                        </div>

                        {/* DURATION */}
                        <div className="rounded-xl border border-gray-200/80 bg-white/85 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                            Duration
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-800">
                            {session.plannedDurationMinutes} minutes
                          </p>
                        </div>

                        {/* THERAPIST */}
                        <div className="rounded-xl border border-gray-200/80 bg-white/85 p-3">
                          <div className="flex items-center gap-2">
                            <UsersRound className="h-4 w-4 text-gray-500" />

                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                              Therapist
                            </p>
                          </div>

                          <p className="mt-1 truncate text-sm font-medium text-gray-800">
                            {therapist?.fullName ?? "Not assigned"}
                          </p>

                          {therapist?.therapistType && (
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {therapist.therapistType}
                            </p>
                          )}
                        </div>

                        {/* ROOM */}
                        <div className="rounded-xl border border-gray-200/80 bg-white/85 p-3">
                          <div className="flex items-center gap-2">
                            <DoorOpen className="h-4 w-4 text-gray-500" />

                            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                              Room
                            </p>
                          </div>

                          <p className="mt-1 truncate text-sm font-medium text-gray-800">
                            {room?.roomNumber ?? "Not assigned"}
                          </p>

                          {room?.name && (
                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {room.name}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* SESSION NOTES */}
                      {session.notes && (
                        <div className="mt-4 rounded-xl border border-emerald-200 bg-white/80 p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                            Session Notes
                          </p>

                          <p className="mt-1 text-sm leading-6 text-gray-700">
                            {session.notes}
                          </p>
                        </div>
                      )}

                      {/* FOOTER */}
                      <div className="mt-4 flex items-center justify-between border-t border-gray-300/50 pt-4">
                        <p className="text-xs text-gray-500">
                          Sequence {session.sequenceOrder}
                        </p>

                        <p className="text-xs text-gray-500">
                          Session ID: {session.id.slice(-8)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default DoctorTherapySessionsPage;



// import { useEffect, useMemo, useState } from "react";
// import {
//   CalendarDays,
//   CheckCircle2,
//   Clock3,
//   DoorOpen,
//   Search,
//   UserRound,
//   UsersRound,
//   X,
// } from "lucide-react";
// import apiClient from "../../services/api/client";
// import {
//   getAllPatients,
//   getAllRooms,
//   getAllTherapists,
//   type PatientResponse,
//   type RoomResponse,
//   type TherapistResponse,
// } from "../../services/doctor/doctorService";

// interface TherapyPlan {
//   id: string;
//   patientId: string;
//   doctorId: string;
//   planName: string;
//   diagnosis: string | null;
//   startDate: string;
//   endDate: string;
//   status: string;
//   therapies: {
//     day: number;
//     therapyId: string;
//     therapyName: string;
//     durationMinutes: number;
//     sequenceOrder: number;
//   }[];
// }

// interface TherapySession {
//   id: string;
//   therapyPlanId: string;
//   patientId: string;
//   therapistId: string | null;
//   roomId: string | null;
//   therapyId: string;
//   therapyName: string;
//   dayNumber: number;
//   sequenceOrder: number;
//   sessionDate: string;
//   startTime: string;
//   endTime: string;
//   plannedDurationMinutes: number;
//   actualDurationMinutes: number | null;
//   status: string;
//   notes: string | null;
// }

// interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
// }

// type StatusFilter =
//   | "ALL"
//   | "SCHEDULED"
//   | "IN_PROGRESS"
//   | "COMPLETED"
//   | "CANCELLED";

// function DoctorTherapySessionsPage() {
//   const [sessions, setSessions] = useState<TherapySession[]>([]);
//   const [patients, setPatients] = useState<PatientResponse[]>([]);
//   const [therapists, setTherapists] = useState<TherapistResponse[]>([]);
//   const [rooms, setRooms] = useState<RoomResponse[]>([]);

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] =
//     useState<StatusFilter>("ALL");

//   // LOAD DATA
//   useEffect(() => {
//     const loadSessions = async () => {
//       try {
//         setLoading(true);
//         setError("");

//         const [
//           plansResponse,
//           patientsResponse,
//           therapistsResponse,
//           roomsResponse,
//         ] = await Promise.all([
//           apiClient.get<ApiResponse<TherapyPlan[]>>(
//             "/therapy-plans/doctor/my"
//           ),
//           getAllPatients(),
//           getAllTherapists(),
//           getAllRooms(),
//         ]);

//         const doctorPlans = plansResponse.data.data ?? [];

//         setPatients(patientsResponse ?? []);
//         setTherapists(therapistsResponse ?? []);
//         setRooms(roomsResponse ?? []);

//         const sessionResponses = await Promise.all(
//           doctorPlans.map(async (plan) => {
//             try {
//               const response = await apiClient.get<
//                 ApiResponse<TherapySession[]>
//               >(`/therapy-sessions/plan/${plan.id}`);

//               return response.data.data ?? [];
//             } catch (sessionError) {
//               console.error(
//                 `Failed to load sessions for plan ${plan.id}:`,
//                 sessionError
//               );
//               return [];
//             }
//           })
//         );

//         const allSessions = sessionResponses.flat();

//         allSessions.sort((a, b) => {
//           const dateA = `${a.sessionDate ?? ""} ${a.startTime ?? ""}`;
//           const dateB = `${b.sessionDate ?? ""} ${b.startTime ?? ""}`;

//           if (dateA !== dateB) {
//             return dateA.localeCompare(dateB);
//           }

//           return (
//             (a.sequenceOrder ?? 0) -
//             (b.sequenceOrder ?? 0)
//           );
//         });

//         setSessions(allSessions);
//       } catch (err) {
//         console.error(
//           "Failed to load doctor therapy sessions:",
//           err
//         );

//         setError(
//           "Unable to load therapy sessions. Please try again."
//         );
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadSessions();
//   }, []);

//   // LOOKUPS
//   const getPatient = (patientId: string) =>
//     patients.find((patient) => patient.id === patientId);

//   const getTherapist = (therapistId: string | null) => {
//     if (!therapistId) return undefined;

//     return therapists.find(
//       (therapist) => therapist.id === therapistId
//     );
//   };

//   const getRoom = (roomId: string | null) => {
//     if (!roomId) return undefined;

//     return rooms.find((room) => room.id === roomId);
//   };

//   // SUMMARY COUNTS
//   const totalSessions = sessions.length;

//   const scheduledSessions = sessions.filter((session) => {
//     const status = session.status?.toUpperCase();

//     return status === "PLANNED" || status === "SCHEDULED";
//   }).length;

//   const inProgressSessions = sessions.filter(
//     (session) =>
//       session.status?.toUpperCase() === "IN_PROGRESS"
//   ).length;

//   const completedSessions = sessions.filter(
//     (session) =>
//       session.status?.toUpperCase() === "COMPLETED"
//   ).length;

//   // FILTERED SESSIONS
//   const filteredSessions = useMemo(() => {
//     const search = searchTerm.trim().toLowerCase();

//     return sessions.filter((session) => {
//       const patient = getPatient(session.patientId);
//       const therapist = getTherapist(session.therapistId);
//       const room = getRoom(session.roomId);

//       const patientName =
//         patient?.fullName?.toLowerCase() ?? "";

//       const therapyName =
//         session.therapyName?.toLowerCase() ?? "";

//       const therapistName =
//         therapist?.fullName?.toLowerCase() ?? "";

//       const roomNumber =
//         room?.roomNumber?.toLowerCase() ?? "";

//       const roomName = room?.name?.toLowerCase() ?? "";
//       const status = session.status?.toLowerCase() ?? "";
//       const notes = session.notes?.toLowerCase() ?? "";

//       const matchesSearch =
//         search === "" ||
//         patientName.includes(search) ||
//         therapyName.includes(search) ||
//         therapistName.includes(search) ||
//         roomNumber.includes(search) ||
//         roomName.includes(search) ||
//         status.includes(search) ||
//         notes.includes(search);

//       const normalizedStatus = session.status?.toUpperCase();

//       const matchesStatus =
//         statusFilter === "ALL" ||
//         (statusFilter === "SCHEDULED" &&
//           (normalizedStatus === "PLANNED" ||
//             normalizedStatus === "SCHEDULED")) ||
//         normalizedStatus === statusFilter;

//       return matchesSearch && matchesStatus;
//     });
//   }, [
//     sessions,
//     patients,
//     therapists,
//     rooms,
//     searchTerm,
//     statusFilter,
//   ]);

//   // GROUP BY DATE
//   const groupedSessions = useMemo(() => {
//     const groups: Record<string, TherapySession[]> = {};

//     filteredSessions.forEach((session) => {
//       const date = session.sessionDate || "UNKNOWN";

//       if (!groups[date]) {
//         groups[date] = [];
//       }

//       groups[date].push(session);
//     });

//     return Object.entries(groups).sort(
//       ([dateA], [dateB]) => dateA.localeCompare(dateB)
//     );
//   }, [filteredSessions]);

//   // FORMAT DATE
//   const formatDate = (date: string) => {
//     if (!date || date === "UNKNOWN") {
//       return "Unknown date";
//     }

//     return new Date(`${date}T00:00:00`).toLocaleDateString(
//       "en-IN",
//       {
//         weekday: "long",
//         day: "2-digit",
//         month: "long",
//         year: "numeric",
//       }
//     );
//   };

//   // FORMAT TIME
//   const formatTime = (time: string) => {
//     if (!time) return "—";

//     const [hours, minutes] = time.split(":");
//     const date = new Date();

//     date.setHours(
//       Number(hours),
//       Number(minutes),
//       0,
//       0
//     );

//     return date.toLocaleTimeString("en-IN", {
//       hour: "numeric",
//       minute: "2-digit",
//       hour12: true,
//     });
//   };

//   // UI STATUS
//   const getDisplayStatus = (status: string) => {
//     switch (status?.toUpperCase()) {
//       case "PLANNED":
//       case "SCHEDULED":
//         return "Scheduled";
//       case "IN_PROGRESS":
//         return "In Progress";
//       case "COMPLETED":
//         return "Completed";
//       case "CANCELLED":
//         return "Cancelled";
//       default:
//         return "Unknown";
//     }
//   };

//   // STATUS CLASSES
//   const getStatusClasses = (status: string) => {
//     switch (status?.toUpperCase()) {
//       case "PLANNED":
//       case "SCHEDULED":
//         return "border-blue-200 bg-blue-50 text-blue-700";
//       case "IN_PROGRESS":
//         return "border-amber-200 bg-amber-50 text-amber-700";
//       case "COMPLETED":
//         return "border-emerald-200 bg-emerald-50 text-emerald-700";
//       case "CANCELLED":
//         return "border-red-200 bg-red-50 text-red-700";
//       default:
//         return "border-gray-200 bg-gray-50 text-gray-600";
//     }
//   };

//   // STATUS DOT
//   const getStatusDot = (status: string) => {
//     switch (status?.toUpperCase()) {
//       case "PLANNED":
//       case "SCHEDULED":
//         return "bg-blue-500";
//       case "IN_PROGRESS":
//         return "bg-amber-500";
//       case "COMPLETED":
//         return "bg-emerald-500";
//       case "CANCELLED":
//         return "bg-red-500";
//       default:
//         return "bg-gray-400";
//     }
//   };

//   // CLEAR FILTERS
//   const clearFilters = () => {
//     setSearchTerm("");
//     setStatusFilter("ALL");
//   };

//   // LOADING
//   if (loading) {
//     return (
//       <div className="flex min-h-[500px] items-center justify-center">
//         <div className="text-center">
//           <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-700" />

//           <p className="mt-4 text-sm font-medium text-gray-600">
//             Loading therapy sessions...
//           </p>

//           <p className="mt-1 text-xs text-gray-400">
//             Fetching your scheduled treatments
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full space-y-6 px-6 py-5 lg:px-8">
//       {/* HEADER */}
//       <div className="px-1">
//         <h1 className="text-3xl font-bold tracking-tight text-[#173D2D]">
//           Therapy Sessions
//         </h1>
//       </div>

//       {/* SUMMARY CARDS */}
//       <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
//         {/* Total Sessions */}
//         <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-blue-700">
//                 Total Sessions
//               </p>

//               <p className="mt-2 text-2xl font-semibold text-blue-950">
//                 {totalSessions}
//               </p>

//               <p className="mt-1 text-xs text-blue-600">
//                 All therapy sessions
//               </p>
//             </div>

//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
//               <CalendarDays className="h-5 w-5 text-blue-700" />
//             </div>
//           </div>
//         </div>

//         {/* Scheduled */}
//         <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-sky-700">
//                 Scheduled
//               </p>

//               <p className="mt-2 text-2xl font-semibold text-sky-950">
//                 {scheduledSessions}
//               </p>

//               <p className="mt-1 text-xs text-sky-600">
//                 Upcoming treatment
//               </p>
//             </div>

//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100">
//               <Clock3 className="h-5 w-5 text-sky-700" />
//             </div>
//           </div>
//         </div>

//         {/* In Progress */}
//         <div className="rounded-2xl border border-amber-200 bg-amber-100/70 p-5 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-amber-700">
//                 In Progress
//               </p>

//               <p className="mt-2 text-2xl font-semibold text-amber-950">
//                 {inProgressSessions}
//               </p>

//               <p className="mt-1 text-xs text-amber-600">
//                 Currently underway
//               </p>
//             </div>

//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
//               <Clock3 className="h-5 w-5 text-amber-700" />
//             </div>
//           </div>
//         </div>

//         {/* Completed */}
//         <div className="rounded-2xl border border-emerald-200 bg-emerald-100/70 p-5 shadow-sm">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-sm font-medium text-emerald-700">
//                 Completed
//               </p>

//               <p className="mt-2 text-2xl font-semibold text-emerald-950">
//                 {completedSessions}
//               </p>

//               <p className="mt-1 text-xs text-emerald-600">
//                 Finished treatments
//               </p>
//             </div>

//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
//               <CheckCircle2 className="h-5 w-5 text-emerald-700" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* SEARCH + FILTERS */}
//       <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
//         <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
//           <div className="relative min-w-0 flex-1">
//             <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />

//             <input
//               type="text"
//               value={searchTerm}
//               onChange={(event) =>
//                 setSearchTerm(event.target.value)
//               }
//               placeholder="Search patient, therapy, therapist or room..."
//               className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
//             />

//             {searchTerm.length > 0 && (
//               <button
//                 type="button"
//                 onClick={() => setSearchTerm("")}
//                 aria-label="Clear search"
//                 className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-200 hover:text-gray-700"
//               >
//                 <X className="h-4 w-4" />
//               </button>
//             )}
//           </div>

//           {/* STATUS FILTERS */}
//           <div className="flex shrink-0 flex-wrap gap-2">
//             {(
//               [
//                 ["ALL", "All"],
//                 ["SCHEDULED", "Scheduled"],
//                 ["IN_PROGRESS", "In Progress"],
//                 ["COMPLETED", "Completed"],
//               ] as const
//             ).map(([value, label]) => (
//               <button
//                 key={value}
//                 type="button"
//                 onClick={() => setStatusFilter(value)}
//                 className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
//                   statusFilter === value
//                     ? "border-emerald-700 bg-emerald-700 text-white"
//                     : "border-gray-200 bg-white text-gray-600 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
//                 }`}
//               >
//                 {label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* RESULT COUNT */}
//         <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
//           <p className="text-xs text-gray-500">
//             Showing{" "}
//             <span className="font-semibold text-gray-800">
//               {filteredSessions.length}
//             </span>{" "}
//             of{" "}
//             <span className="font-semibold text-gray-800">
//               {sessions.length}
//             </span>{" "}
//             sessions
//           </p>

//           {(searchTerm || statusFilter !== "ALL") && (
//             <button
//               type="button"
//               onClick={clearFilters}
//               className="text-xs font-medium text-emerald-700 transition hover:text-emerald-900"
//             >
//               Clear filters
//             </button>
//           )}
//         </div>
//       </div>

//       {/* ERROR */}
//       {error && (
//         <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
//           <p className="text-sm font-medium text-red-700">
//             {error}
//           </p>
//         </div>
//       )}

//       {/* EMPTY STATE */}
//       {!error && filteredSessions.length === 0 && (
//         <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
//           <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
//             <CalendarDays className="h-6 w-6 text-gray-400" />
//           </div>

//           <h2 className="mt-4 text-lg font-semibold text-gray-900">
//             {searchTerm || statusFilter !== "ALL"
//               ? "No matching sessions"
//               : "No therapy sessions yet"}
//           </h2>

//           <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
//             {searchTerm || statusFilter !== "ALL"
//               ? "Try a different search term or clear the filters to view all sessions."
//               : "Scheduled therapy sessions will appear here once treatments are scheduled for your patients."}
//           </p>

//           {(searchTerm || statusFilter !== "ALL") && (
//             <button
//               type="button"
//               onClick={clearFilters}
//               className="mt-5 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
//             >
//               Clear filters
//             </button>
//           )}
//         </div>
//       )}

//       {/* SESSION LIST */}
//       {!error && groupedSessions.length > 0 && (
//         <div className="space-y-6">
//           {groupedSessions.map(([date, dateSessions]) => (
//             <section key={date}>
//               {/* DATE HEADING */}
//               <div className="mb-3 flex items-center gap-3">
//                 <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50">
//                   <CalendarDays className="h-4 w-4 text-emerald-700" />
//                 </div>

//                 <div>
//                   <h2 className="text-sm font-semibold text-gray-900">
//                     {formatDate(date)}
//                   </h2>

//                   <p className="text-xs text-gray-400">
//                     {dateSessions.length}{" "}
//                     {dateSessions.length === 1
//                       ? "session"
//                       : "sessions"}
//                   </p>
//                 </div>
//               </div>

//               {/* SESSIONS */}
//               <div className="space-y-3">
//                 {dateSessions.map((session, sessionIndex) => {
//                   const patient = getPatient(session.patientId);
//                   const therapist = getTherapist(session.therapistId);
//                   const room = getRoom(session.roomId);

//                   return (
//                     <div
//                       key={session.id}
//                       className={`rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
//                         sessionIndex % 2 === 0
//                           ? "border-[#B8D0AD] bg-[#EAF3E5] hover:border-[#9FBE91]"
//                           : "border-[#B7CBE8] bg-[#E8F0FA] hover:border-[#9CB7DF]"
//                       }`}
//                     >
//                       {/* SESSION HEADER */}
//                       <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                         <div className="min-w-0">
//                           <div className="flex flex-wrap items-center gap-3">
//                             <h3 className="text-lg font-semibold text-gray-900">
//                               {session.therapyName}
//                             </h3>

//                             <span
//                               className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
//                                 session.status
//                               )}`}
//                             >
//                               <span
//                                 className={`h-1.5 w-1.5 rounded-full ${getStatusDot(
//                                   session.status
//                                 )}`}
//                               />

//                               {getDisplayStatus(session.status)}
//                             </span>
//                           </div>

//                           {/* PATIENT */}
//                           <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
//                             <UserRound className="h-4 w-4 text-gray-400" />

//                             <span className="font-medium text-gray-800">
//                               {patient?.fullName ?? "Unknown Patient"}
//                             </span>
//                           </div>
//                         </div>

//                         {/* TIME */}
//                         <div className="flex shrink-0 items-center gap-3 rounded-xl bg-white/80 px-4 py-3">
//                           <Clock3 className="h-5 w-5 text-emerald-700" />

//                           <div>
//                             <p className="text-sm font-semibold text-gray-900">
//                               {formatTime(session.startTime)}
//                             </p>

//                             <p className="text-xs text-gray-500">
//                               to {formatTime(session.endTime)}
//                             </p>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="my-5 h-px bg-gray-300/50" />

//                       {/* SESSION DETAILS */}
//                       <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                         {/* TREATMENT DAY */}
//                         <div className="rounded-xl border border-gray-200/80 bg-white/85 p-3">
//                           <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
//                             Treatment Day
//                           </p>

//                           <p className="mt-1 text-sm font-medium text-gray-800">
//                             Day {session.dayNumber}
//                           </p>
//                         </div>

//                         {/* DURATION */}
//                         <div className="rounded-xl border border-gray-200/80 bg-white/85 p-3">
//                           <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
//                             Duration
//                           </p>

//                           <p className="mt-1 text-sm font-medium text-gray-800">
//                             {session.plannedDurationMinutes} minutes
//                           </p>
//                         </div>

//                         {/* THERAPIST */}
//                         <div className="rounded-xl border border-gray-200/80 bg-white/85 p-3">
//                           <div className="flex items-center gap-2">
//                             <UsersRound className="h-4 w-4 text-gray-500" />

//                             <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
//                               Therapist
//                             </p>
//                           </div>

//                           <p className="mt-1 truncate text-sm font-medium text-gray-800">
//                             {therapist?.fullName ?? "Not assigned"}
//                           </p>

//                           {therapist?.therapistType && (
//                             <p className="mt-0.5 truncate text-xs text-gray-500">
//                               {therapist.therapistType}
//                             </p>
//                           )}
//                         </div>

//                         {/* ROOM */}
//                         <div className="rounded-xl border border-gray-200/80 bg-white/85 p-3">
//                           <div className="flex items-center gap-2">
//                             <DoorOpen className="h-4 w-4 text-gray-500" />

//                             <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
//                               Room
//                             </p>
//                           </div>

//                           <p className="mt-1 truncate text-sm font-medium text-gray-800">
//                             {room?.roomNumber ?? "Not assigned"}
//                           </p>

//                           {room?.name && (
//                             <p className="mt-0.5 truncate text-xs text-gray-500">
//                               {room.name}
//                             </p>
//                           )}
//                         </div>
//                       </div>

//                       {/* SESSION NOTES */}
//                       {session.notes && (
//                         <div className="mt-4 rounded-xl border border-emerald-200 bg-white/80 p-4">
//                           <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
//                             Session Notes
//                           </p>

//                           <p className="mt-1 text-sm leading-6 text-gray-700">
//                             {session.notes}
//                           </p>
//                         </div>
//                       )}

//                       {/* FOOTER */}
//                       <div className="mt-4 flex items-center justify-between border-t border-gray-300/50 pt-4">
//                         <p className="text-xs text-gray-500">
//                           Sequence {session.sequenceOrder}
//                         </p>

//                         <p className="text-xs text-gray-500">
//                           Session ID: {session.id.slice(-8)}
//                         </p>
//                       </div>
//                     </div>
//                   );
//                 })}
//               </div>
//             </section>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default DoctorTherapySessionsPage;
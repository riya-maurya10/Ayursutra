
import { useEffect, useMemo, useState } from "react";

import {
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
  CheckCircle2,
  Circle,
  XCircle,
  PlayCircle,
  ClipboardList,
} from "lucide-react";

import apiClient from "../../services/api/client";

interface PatientProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  age: number | null;
  gender: string | null;
  address: string | null;
  medicalHistory: string | null;
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
  startTime: string | null;
  endTime: string | null;
  plannedDurationMinutes: number;
  actualDurationMinutes: number | null;
  status:
    | "PLANNED"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "CANCELLED"
    | "SKIPPED";
  notes: string | null;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface TherapyPlanSummary {
  id: string;
  doctorId: string;
}

interface PersonSummary {
  id: string;
  fullName: string;
}

interface RoomSummary {
  id: string;
  roomNumber: string;
}

type SessionFilter = "ALL" | "UPCOMING" | "COMPLETED";

interface DayGroup {
  key: string;
  dayNumber: number;
  sessions: TherapySession[];
}

function PatientSessionsPage() {
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});
  const [planDoctorIds, setPlanDoctorIds] = useState<Record<string, string>>({});
  const [therapistNames, setTherapistNames] = useState<Record<string, string>>({});
  const [roomNumbers, setRoomNumbers] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeFilter, setActiveFilter] = useState<SessionFilter>("ALL");

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. Get logged-in patient
        const profileResponse = await apiClient.get<ApiResponse<PatientProfile>>(
          "/patients/me"
        );

        const patientId = profileResponse.data.data.id;

        if (!patientId) {
          throw new Error("Patient ID not found");
        }

        // 2. Get patient sessions
        const sessionsResponse = await apiClient.get<ApiResponse<TherapySession[]>>(
          `/therapy-sessions/patient/${patientId}`
        );

        const fetchedSessions = sessionsResponse.data.data || [];
        setSessions(fetchedSessions);

        // 3. Get unique therapy plan IDs
        const therapyPlanIds = [
          ...new Set(
            fetchedSessions
              .map((session) => session.therapyPlanId)
              .filter(Boolean)
          ),
        ];

        // 4. Fetch therapy plans
        const planResponses = await Promise.all(
          therapyPlanIds.map(async (planId) => {
            try {
              const response = await apiClient.get<ApiResponse<TherapyPlanSummary>>(
                `/therapy-plans/${planId}`
              );
              return response.data.data;
            } catch (error) {
              console.error(`Unable to fetch therapy plan ${planId}:`, error);
              return null;
            }
          })
        );

        // 5. Map therapy plan to doctor
        const planDoctorMap: Record<string, string> = {};

        planResponses.forEach((plan) => {
          if (plan?.id && plan.doctorId) {
            planDoctorMap[plan.id] = plan.doctorId;
          }
        });

        setPlanDoctorIds(planDoctorMap);

        // 6. Fetch doctors
        const doctorIds = [...new Set(Object.values(planDoctorMap).filter(Boolean))];

        const doctorResponses = await Promise.all(
          doctorIds.map(async (doctorId) => {
            try {
              const response = await apiClient.get<ApiResponse<PersonSummary>>(
                `/doctors/${doctorId}`
              );
              return response.data.data;
            } catch (error) {
              console.error(`Unable to fetch doctor ${doctorId}:`, error);
              return null;
            }
          })
        );

        const doctorNameMap: Record<string, string> = {};

        doctorResponses.forEach((doctor) => {
          if (doctor?.id && doctor.fullName) {
            doctorNameMap[doctor.id] = doctor.fullName;
          }
        });

        setDoctorNames(doctorNameMap);

        // 7. Fetch therapists
        const therapistIds = [
          ...new Set(
            fetchedSessions
              .map((session) => session.therapistId)
              .filter((id): id is string => Boolean(id))
          ),
        ];

        const therapistResponses = await Promise.all(
          therapistIds.map(async (therapistId) => {
            try {
              const response = await apiClient.get<ApiResponse<PersonSummary>>(
                `/therapists/${therapistId}`
              );
              return response.data.data;
            } catch (error) {
              console.error(`Unable to fetch therapist ${therapistId}:`, error);
              return null;
            }
          })
        );

        const therapistNameMap: Record<string, string> = {};

        therapistResponses.forEach((therapist) => {
          if (therapist?.id && therapist.fullName) {
            therapistNameMap[therapist.id] = therapist.fullName;
          }
        });

        setTherapistNames(therapistNameMap);

        // 8. Fetch rooms
        const roomIds = [
          ...new Set(
            fetchedSessions
              .map((session) => session.roomId)
              .filter((id): id is string => Boolean(id))
          ),
        ];

        const roomResponses = await Promise.all(
          roomIds.map(async (roomId) => {
            try {
              const response = await apiClient.get<ApiResponse<RoomSummary>>(
                `/rooms/${roomId}`
              );
              return response.data.data;
            } catch (error) {
              console.error(`Unable to fetch room ${roomId}:`, error);
              return null;
            }
          })
        );

        const roomNumberMap: Record<string, string> = {};

        roomResponses.forEach((room) => {
          if (room?.id && room.roomNumber) {
            roomNumberMap[room.id] = room.roomNumber;
          }
        });

        setRoomNumbers(roomNumberMap);
      } catch (error: any) {
        console.error("Unable to fetch patient therapy sessions:", error);

        if (error.response?.status === 404) {
          setSessions([]);
        } else {
          setErrorMessage(
            error.response?.data?.message ||
              "Unable to load your therapy sessions."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "Date not available";

    const dateOnly = dateString.includes("T")
      ? dateString.split("T")[0]
      : dateString;

    const date = new Date(`${dateOnly}T00:00:00`);

    if (Number.isNaN(date.getTime())) return "Date not available";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time
  const formatTime = (time: string | null) => {
    if (!time) return null;

    if (time.includes("T")) {
      const date = new Date(time);

      if (Number.isNaN(date.getTime())) return null;

      return date.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    const [hours, minutes] = time.split(":").map(Number);
    const date = new Date();

    date.setHours(hours, minutes, 0, 0);

    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status: TherapySession["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return "Scheduled";
      case "IN_PROGRESS":
        return "In Progress";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      case "SKIPPED":
        return "Skipped";
      default:
        return "Planned";
    }
  };

  const getStatusClasses = (status: TherapySession["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-[#EAF1E7] text-[#4F7041]";
      case "IN_PROGRESS":
        return "bg-[#E8F0EC] text-[#245B43]";
      case "COMPLETED":
        return "bg-[#E8EFE4] text-[#526B3D]";
      case "CANCELLED":
        return "bg-[#F5E8E5] text-[#9A5145]";
      case "SKIPPED":
        return "bg-[#F1EEE8] text-[#817766]";
      default:
        return "bg-[#F2F3ED] text-[#7A806F]";
    }
  };

  const getStatusIcon = (status: TherapySession["status"]) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 size={14} />;
      case "IN_PROGRESS":
        return <PlayCircle size={14} />;
      case "CANCELLED":
        return <XCircle size={14} />;
      case "SCHEDULED":
        return <CalendarDays size={14} />;
      default:
        return <Circle size={14} />;
    }
  };

  const getSessionDate = (dateString: string) => {
    const dateOnly = dateString?.includes("T")
      ? dateString.split("T")[0]
      : dateString;

    return new Date(`${dateOnly}T00:00:00`);
  };

  // Filter sessions
  const filteredSessions = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...sessions]
      .filter((session) => {
        const sessionDate = getSessionDate(session.sessionDate);

        if (activeFilter === "COMPLETED") {
          return session.status === "COMPLETED";
        }

        if (activeFilter === "UPCOMING") {
          return (
            sessionDate >= today &&
            !["COMPLETED", "CANCELLED", "SKIPPED"].includes(session.status)
          );
        }

        return true;
      })
      .sort((a, b) => {
        const dateDifference =
          getSessionDate(a.sessionDate).getTime() -
          getSessionDate(b.sessionDate).getTime();

        if (dateDifference !== 0) return dateDifference;

        return a.dayNumber - b.dayNumber || a.sequenceOrder - b.sequenceOrder;
      });
  }, [sessions, activeFilter]);

  // Group sessions by therapy plan and day
  const groupedSessions = useMemo<DayGroup[]>(() => {
    const groups = new Map<string, DayGroup>();

    filteredSessions.forEach((session) => {
      const key = `${session.therapyPlanId}-${session.dayNumber}`;

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          dayNumber: session.dayNumber,
          sessions: [],
        });
      }

      groups.get(key)!.sessions.push(session);
    });

    return Array.from(groups.values()).sort((a, b) => {
      const dateA = getSessionDate(a.sessions[0].sessionDate).getTime();
      const dateB = getSessionDate(b.sessions[0].sessionDate).getTime();

      return dateA - dateB || a.dayNumber - b.dayNumber;
    });
  }, [filteredSessions]);

  // Counts
  const upcomingCount = sessions.filter((session) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      getSessionDate(session.sessionDate) >= today &&
      !["COMPLETED", "CANCELLED", "SKIPPED"].includes(session.status)
    );
  }).length;

  const completedCount = sessions.filter(
    (session) => session.status === "COMPLETED"
  ).length;

  const filters: { value: SessionFilter; label: string }[] = [
    { value: "ALL", label: "All Sessions" },
    { value: "UPCOMING", label: "Upcoming" },
    { value: "COMPLETED", label: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#173D2D]">
      <main className="mx-auto max-w-7xl px-5 py-7 sm:px-6 lg:px-8 lg:py-9">

        {/* Page heading */}
        <section className="mb-7">
          <h1 className="text-3xl font-semibold tracking-tight text-[#173D2D] sm:text-4xl">
            My Sessions
          </h1>
          <p className="mt-1.5 text-sm text-[#68736C]">
            Your therapy schedule and session details.
          </p>
        </section>

        {/* Summary cards */}
        <section className="mb-7 grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-2xl border border-[#DDDCD3] bg-white p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF1E8] text-[#71834F]">
              <CalendarDays size={21} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#718078]">
                Upcoming
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#173D2D]">
                {loading ? "—" : upcomingCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-[#DDDCD3] bg-white p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8EFEB] text-[#526B3D]">
              <CheckCircle2 size={21} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#718078]">
                Completed
              </p>
              <p className="mt-1 text-2xl font-semibold text-[#173D2D]">
                {loading ? "—" : completedCount}
              </p>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-6">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
                  activeFilter === filter.value
                    ? "bg-[#173D2D] text-white"
                    : "border border-[#D9DDCE] bg-white text-[#526056] hover:bg-[#EEF1E8]"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>

        {/* Sessions */}
        <section>
          {loading ? (
            <div className="rounded-2xl border border-[#DDDCD3] bg-white p-10 text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#D9DDCE] border-t-[#173D2D]" />
              <p className="text-sm text-[#718078]">Loading sessions...</p>
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-[#E5D1CC] bg-[#FFF8F6] p-8 text-center">
              <XCircle size={28} className="mx-auto mb-3 text-[#9A5145]" />
              <h2 className="text-lg font-semibold text-[#173D2D]">
                Unable to load sessions
              </h2>
              <p className="mt-2 text-sm text-[#7A6E69]">{errorMessage}</p>
            </div>
          ) : groupedSessions.length === 0 ? (
            <div className="rounded-2xl border border-[#DDDCD3] bg-white p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF1E8] text-[#71834F]">
                <ClipboardList size={25} />
              </div>

              <h2 className="mt-4 text-xl font-semibold text-[#173D2D]">
                No sessions found
              </h2>

              <p className="mt-2 text-sm text-[#778078]">
                {activeFilter === "UPCOMING"
                  ? "There are no upcoming sessions."
                  : activeFilter === "COMPLETED"
                  ? "There are no completed sessions yet."
                  : "Your therapy sessions will appear here once scheduled."}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {groupedSessions.map((group) => {
                const firstSession = group.sessions[0];

                return (
                  <div
                    key={group.key}
                    className="overflow-hidden rounded-2xl border border-[#DDE3D8] bg-white shadow-[0_3px_14px_rgba(31,61,46,0.035)]"
                  >
                    {/* Day heading */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EBE3] bg-[#F0F3EB] px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#587447]">
                          <CalendarDays size={19} />
                        </div>

                        <div>
                          <h2 className="text-lg font-semibold text-[#173D2D]">
                            Day {group.dayNumber}
                          </h2>
                          <p className="mt-0.5 text-xs text-[#718078]">
                            {formatDate(firstSession.sessionDate)}
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-[#526B3D]">
                        {group.sessions.length}{" "}
                        {group.sessions.length === 1 ? "Session" : "Sessions"}
                      </span>
                    </div>

                    {/* All sessions of this day inside ONE card */}
                    <div className="divide-y divide-[#ECEFE8]">
                      {group.sessions.map((session, index) => {
                        const doctorId = planDoctorIds[session.therapyPlanId];

                        const doctorName = doctorId
                          ? doctorNames[doctorId]
                          : null;

                        const therapistName = session.therapistId
                          ? therapistNames[session.therapistId]
                          : null;

                        const roomNumber = session.roomId
                          ? roomNumbers[session.roomId]
                          : null;

                        return (
                          <div
                            key={session.id}
                            className="px-5 py-5 sm:px-6"
                          >
                            {/* Therapy name and status */}
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF1E8] text-sm font-semibold text-[#587447]">
                                  {index + 1}
                                </span>

                                <div>
                                  <h3 className="text-base font-semibold text-[#173D2D] sm:text-lg">
                                    {session.therapyName}
                                  </h3>
                                  <p className="mt-0.5 text-xs text-[#879087]">
                                    Session {session.sequenceOrder}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClasses(
                                  session.status
                                )}`}
                              >
                                {getStatusIcon(session.status)}
                                {getStatusLabel(session.status)}
                              </span>
                            </div>

                            {/* Session information */}
                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <div className="flex items-center gap-3 rounded-xl bg-[#F7F6F0] px-3.5 py-3">
                                <CalendarDays
                                  size={17}
                                  className="shrink-0 text-[#71834F]"
                                />
                                <div>
                                  <p className="text-[11px] text-[#879087]">
                                    Date
                                  </p>
                                  <p className="mt-0.5 text-sm font-medium text-[#173D2D]">
                                    {formatDate(session.sessionDate)}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 rounded-xl bg-[#F7F6F0] px-3.5 py-3">
                                <Clock3
                                  size={17}
                                  className="shrink-0 text-[#71834F]"
                                />
                                <div>
                                  <p className="text-[11px] text-[#879087]">
                                    Duration
                                  </p>
                                  <p className="mt-0.5 text-sm font-medium text-[#173D2D]">
                                    {session.plannedDurationMinutes} minutes
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 rounded-xl bg-[#F7F6F0] px-3.5 py-3">
                                <Clock3
                                  size={17}
                                  className="shrink-0 text-[#71834F]"
                                />
                                <div>
                                  <p className="text-[11px] text-[#879087]">
                                    Time
                                  </p>
                                  <p className="mt-0.5 text-sm font-medium text-[#173D2D]">
                                    {session.startTime
                                      ? formatTime(session.startTime)
                                      : "Not scheduled"}
                                    {session.endTime &&
                                      ` – ${formatTime(session.endTime)}`}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Doctor, therapist and room */}
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                              <div className="flex items-center gap-3">
                                <UserRound
                                  size={16}
                                  className="shrink-0 text-[#71834F]"
                                />
                                <div className="min-w-0">
                                  <p className="text-[11px] text-[#879087]">
                                    Doctor
                                  </p>
                                  <p className="truncate text-sm font-medium text-[#173D2D]">
                                    {doctorName ||
                                      (doctorId ? "Loading..." : "Not assigned")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <UserRound
                                  size={16}
                                  className="shrink-0 text-[#71834F]"
                                />
                                <div className="min-w-0">
                                  <p className="text-[11px] text-[#879087]">
                                    Therapist
                                  </p>
                                  <p className="truncate text-sm font-medium text-[#173D2D]">
                                    {therapistName ||
                                      (session.therapistId
                                        ? "Loading..."
                                        : "Not assigned")}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <MapPin
                                  size={16}
                                  className="shrink-0 text-[#71834F]"
                                />
                                <div className="min-w-0">
                                  <p className="text-[11px] text-[#879087]">
                                    Room
                                  </p>
                                  <p className="truncate text-sm font-medium text-[#173D2D]">
                                    {roomNumber ||
                                      (session.roomId
                                        ? "Loading..."
                                        : "Not assigned")}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Optional notes */}
                            {session.notes && (
                              <div className="mt-4 rounded-xl bg-[#F8F7F2] px-4 py-3">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-[#71834F]">
                                  Notes
                                </p>
                                <p className="mt-1 text-sm leading-5 text-[#68736C]">
                                  {session.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PatientSessionsPage;

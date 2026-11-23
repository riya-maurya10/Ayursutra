
import React, { useEffect, useState } from "react";

import {
  CalendarDays,
  Clock3,
  Leaf,
  UserRound,
  Utensils,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import apiClient from "../../services/api/client";

// =====================================================
// API RESPONSE
// =====================================================

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// =====================================================
// PATIENT
// =====================================================

interface PatientProfile {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
}

// =====================================================
// DIET MEAL
// =====================================================

interface DietMeal {
  sequenceOrder: number | null;
  mealType: string | null;
  mealTime: string | null;
  foodItems: string | null;
  instructions: string | null;
  restrictions: string | null;
}

// =====================================================
// DIET PLAN DAY
// =====================================================

interface DietPlanDay {
  dayNumber: number;
  date: string;
  phase: string | null;
  meals: DietMeal[];
}

// =====================================================
// DIET PLAN
// =====================================================

interface DietPlan {
  id: string;
  patientId: string;
  therapyPlanId: string | null;
  doctorId: string;
  planName: string;
  diagnosis: string | null;
  startDate: string;
  endDate: string;
  status: string;
  notes: string | null;
  days: DietPlanDay[];
}

// =====================================================
// DOCTOR
// =====================================================

interface DoctorResponse {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  licenseNumber: string;
  available: boolean;
}

// =====================================================
// COMPONENT
// =====================================================

const PatientDietPlanPage: React.FC = () => {
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);

  const [doctorNames, setDoctorNames] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // ===================================================
  // FETCH DIET PLANS
  // ===================================================

  useEffect(() => {
    const fetchDietPlans = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        // 1. GET LOGGED-IN PATIENT

        const profileResponse = await apiClient.get<
          ApiResponse<PatientProfile>
        >("/patients/me");

        const patientId = profileResponse.data.data?.id;

        if (!patientId) {
          throw new Error("Patient ID not found");
        }

        // 2. GET PATIENT DIET PLANS

        const dietResponse = await apiClient.get<
          ApiResponse<DietPlan[]>
        >(`/diet-plans/patient/${patientId}`);

        const plans: DietPlan[] = dietResponse.data.data || [];

        setDietPlans(plans);

        // 3. GET UNIQUE DOCTOR IDS

        const uniqueDoctorIds = [
          ...new Set(
            plans
              .map((plan) => plan.doctorId)
              .filter((doctorId): doctorId is string =>
                Boolean(doctorId)
              )
          ),
        ];

        // 4. FETCH DOCTORS

        const doctorResults = await Promise.all(
          uniqueDoctorIds.map(async (doctorId) => {
            try {
              const response = await apiClient.get<
                ApiResponse<DoctorResponse>
              >(`/doctors/${doctorId}`);

              const doctor = response.data.data;

              return {
                id: doctorId,
                name: doctor?.fullName || "Doctor",
              };
            } catch (error) {
              console.error(
                `Unable to fetch doctor ${doctorId}:`,
                error
              );

              return {
                id: doctorId,
                name: "Doctor",
              };
            }
          })
        );

        // 5. CREATE DOCTOR NAME MAP

        const doctorMap: Record<string, string> = {};

        doctorResults.forEach((doctor) => {
          doctorMap[doctor.id] = doctor.name;
        });

        setDoctorNames(doctorMap);
      } catch (error: any) {
        console.error(
          "Unable to fetch patient diet plans:",
          error
        );

        if (error.response?.status === 404) {
          setDietPlans([]);
        } else {
          setErrorMessage(
            error.response?.data?.message ||
              error.message ||
              "Unable to load your diet plan."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDietPlans();
  }, []);

  // ===================================================
  // DATE FORMAT
  // ===================================================

  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return "Date not available";
    }

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "Date not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // ===================================================
  // STATUS CLASSES
  // ===================================================

  const getStatusClasses = (status: string): string => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
      case "IN_PROGRESS":
        return "bg-[#E8F0E3] text-[#3F633B]";

      case "COMPLETED":
        return "bg-[#E6F0EA] text-[#245B43]";

      case "CANCELLED":
        return "bg-[#F8EAE7] text-[#984D43]";

      default:
        return "bg-[#F0F2EC] text-[#687665]";
    }
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] px-5 py-8 text-[#1F3D2E] sm:px-7 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-5">
            <div className="h-8 w-56 rounded-lg bg-[#E5E9DF]" />
            <div className="h-4 w-80 max-w-full rounded bg-[#E5E9DF]" />
            <div className="h-64 rounded-2xl border border-[#E2E5DC] bg-white" />
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] px-5 py-8 sm:px-7 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-2xl border border-[#E6D5D0] bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[#F9ECE9] text-[#984D43]">
              <AlertCircle size={27} />
            </div>

            <h2 className="mt-4 text-xl font-bold text-[#1F3D2E]">
              Unable to load diet plan
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#65746A]">
              {errorMessage}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // NO PLAN
  // ===================================================

  if (dietPlans.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] px-5 py-8 text-[#1F3D2E] sm:px-7 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-[#1F3D2E] sm:text-3xl">
              My Diet Plan
            </h1>

            <p className="mt-2 text-sm leading-6 text-[#65746A]">
              Your personalized Ayurvedic dietary recommendations.
            </p>
          </div>

          <div className="rounded-2xl border border-[#DDE3D8] bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF0E4] text-[#587447]">
              <Leaf size={30} />
            </div>

            <h2 className="mt-5 text-xl font-bold text-[#1F3D2E]">
              No diet plan available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#65746A]">
              Your doctor has not assigned a diet plan yet.
              Once a plan is assigned, it will appear here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================
  // MAIN PAGE
  // ===================================================

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#1F3D2E]">
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-7 lg:px-8 lg:py-9">

        {/* PAGE HEADER */}

        <section className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-[#1F3D2E] sm:text-3xl">
            My Diet Plan
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65746A]">
            Follow your personalized dietary schedule during
            your Panchakarma treatment.
          </p>
        </section>

        {/* COLLAPSIBLE DIET PLANS */}

        <div className="space-y-4">
          {dietPlans.map((plan: DietPlan, index: number) => (
            <details
              key={plan.id}
              open={index === 0}
              className="group overflow-hidden rounded-2xl border border-[#DDE3D8] bg-white shadow-[0_3px_16px_rgba(31,61,46,0.045)]"
            >

              {/* DROPDOWN HEADER */}

              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-[#F0F4EB] px-5 py-5 transition hover:bg-[#EAF0E4] sm:px-6 [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#587447]">
                    <Leaf size={23} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#71834F]">
                      Diet Plan {index + 1}
                    </p>

                    <h2 className="mt-1 truncate text-base font-bold text-[#1F3D2E] sm:text-lg">
                      {plan.planName}
                    </h2>

                    {plan.diagnosis && (
                      <p className="mt-1 truncate text-xs text-[#65746A]">
                        {plan.diagnosis}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                  <span
                    className={`hidden rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase sm:inline-flex ${getStatusClasses(
                      plan.status
                    )}`}
                  >
                    {plan.status?.replace(/_/g, " ")}
                  </span>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#42633D] transition-transform duration-200 group-open:rotate-180">
                    <ChevronDown size={19} />
                  </div>
                </div>
              </summary>

              {/* DROPDOWN CONTENT */}

              <div className="border-t border-[#E5EBDD]">

                {/* BASIC INFORMATION */}

                <div className="border-b border-[#E8EDE5] bg-[#FBFCF9] p-5 sm:p-6">

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#71834F]">
                      Plan Information
                    </p>

                    <span
                      className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase sm:hidden ${getStatusClasses(
                        plan.status
                      )}`}
                    >
                      {plan.status?.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    {/* START DATE */}

                    <div className="rounded-xl border border-[#E8EDE5] bg-[#F5F7F1] p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-[#68796C]">
                        <CalendarDays size={17} className="text-[#71834F]" />
                        Start Date
                      </div>

                      <p className="mt-1.5 text-sm font-semibold text-[#244B35]">
                        {formatDate(plan.startDate)}
                      </p>
                    </div>

                    {/* END DATE */}

                    <div className="rounded-xl border border-[#E8EDE5] bg-[#F5F7F1] p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-[#68796C]">
                        <CalendarDays size={17} className="text-[#71834F]" />
                        End Date
                      </div>

                      <p className="mt-1.5 text-sm font-semibold text-[#244B35]">
                        {formatDate(plan.endDate)}
                      </p>
                    </div>

                    {/* DOCTOR */}

                    <div className="rounded-xl border border-[#E8EDE5] bg-[#F5F7F1] p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-[#68796C]">
                        <UserRound size={17} className="text-[#71834F]" />
                        Doctor
                      </div>

                      <p className="mt-1.5 text-sm font-semibold text-[#244B35]">
                        {doctorNames[plan.doctorId] || "Loading..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DIET SCHEDULE */}

                <div className="p-5 sm:p-6">

                  {/* SCHEDULE HEADER */}

                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71834F]">
                        Dietary Schedule
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-[#1F3D2E] sm:text-xl">
                        Daily Meals
                      </h3>
                    </div>

                    <span className="shrink-0 rounded-full bg-[#EAF0E4] px-3.5 py-2 text-xs font-semibold text-[#42633D]">
                      {plan.days?.length || 0} days
                    </span>
                  </div>

                  {/* DAY CARDS */}

                  <div className="space-y-4">
                    {plan.days
                      ?.slice()
                      .sort(
                        (a: DietPlanDay, b: DietPlanDay) =>
                          a.dayNumber - b.dayNumber
                      )
                      .map((day: DietPlanDay) => (
                        <div
                          key={`${plan.id}-${day.dayNumber}`}
                          className="overflow-hidden rounded-xl border border-[#DDE5D9] bg-white"
                        >

                          {/* DAY HEADER */}

                          <div className="flex items-center justify-between gap-3 border-b border-[#E5EBDD] bg-[#F0F4EB] px-4 py-4 sm:px-5">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DDE9D5] text-sm font-bold text-[#315C3C]">
                                {day.dayNumber}
                              </div>

                              <div className="min-w-0">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71834F]">
                                  Day {day.dayNumber}
                                </p>

                                <p className="mt-0.5 text-sm font-semibold text-[#244B35]">
                                  {formatDate(day.date)}
                                </p>
                              </div>
                            </div>

                            {day.phase && (
                              <span className="max-w-[45%] shrink-0 rounded-full border border-[#D8E1D2] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#587447] sm:text-xs">
                                {day.phase.replace(/_/g, " ")}
                              </span>
                            )}
                          </div>

                          {/* MEALS */}

                          <div className="divide-y divide-[#E9EDE6]">
                            {day.meals?.length ? (
                              day.meals
                                .slice()
                                .sort(
                                  (a: DietMeal, b: DietMeal) =>
                                    (a.sequenceOrder ?? 0) -
                                    (b.sequenceOrder ?? 0)
                                )
                                .map(
                                  (meal: DietMeal, mealIndex: number) => (
                                    <div
                                      key={`${plan.id}-${day.dayNumber}-${mealIndex}`}
                                      className="p-4 transition-colors hover:bg-[#FCFDFB] sm:p-5"
                                    >
                                      <div className="flex items-start gap-3 sm:gap-4">

                                        {/* MEAL ICON */}

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0E4] text-[#587447]">
                                          <Utensils size={18} />
                                        </div>

                                        {/* MEAL DETAILS */}

                                        <div className="min-w-0 flex-1">
                                          <div className="flex flex-wrap items-center gap-2.5">

                                            <h4 className="text-sm font-bold uppercase tracking-wide text-[#244B35]">
                                              {meal.mealType || "Meal"}
                                            </h4>

                                            {meal.mealTime && (
                                              <span className="flex items-center gap-1.5 rounded-full bg-[#EDF3E9] px-2.5 py-1 text-xs font-semibold text-[#526D42]">
                                                <Clock3 size={13} />
                                                {meal.mealTime}
                                              </span>
                                            )}
                                          </div>

                                          {/* FOOD ITEMS */}

                                          {meal.foodItems && (
                                            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-[#354B3D]">
                                              {meal.foodItems}
                                            </p>
                                          )}

                                          {/* INSTRUCTIONS */}

                                          {meal.instructions && (
                                            <div className="mt-3">
                                              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#71834F]">
                                                Instructions
                                              </p>

                                              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-[#596B5E]">
                                                {meal.instructions}
                                              </p>
                                            </div>
                                          )}

                                          {/* RESTRICTIONS */}

                                          {meal.restrictions && (
                                            <div className="mt-3 rounded-lg border border-[#F0E2D2] bg-[#FBF5ED] px-3.5 py-3 text-sm leading-5 text-[#805B3C]">
                                              <strong className="font-semibold">
                                                Restrictions:
                                              </strong>{" "}
                                              {meal.restrictions}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )
                            ) : (
                              <div className="px-5 py-7 text-center">
                                <p className="text-sm text-[#718078]">
                                  No meals specified for this day.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* DOCTOR'S NOTES */}

                {plan.notes && (
                  <div className="border-t border-[#E5EBDD] bg-[#F8FAF6] px-5 py-5 sm:px-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#71834F]">
                      Doctor's Notes
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#465D4C]">
                      {plan.notes}
                    </p>
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PatientDietPlanPage;

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Leaf,
  UserRound,
  Utensils,
  Wind,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
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

interface DietMeal {
  sequenceOrder: number;
  mealType: string;
  mealTime: string;
  foodItems: string;
  instructions: string;
  restrictions: string;
}

interface DietPlanDay {
  dayNumber: number;
  date: string;
  phase: string;
  meals: DietMeal[];
}

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

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loadingDietPlans, setLoadingDietPlans] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProfile = async () => {
      try {
        const response = await apiClient.get<ApiResponse<PatientProfile>>(
          "/patients/me"
        );
        if (isMounted) setProfile(response.data.data);
      } catch (error: any) {
        if (error.response?.status === 404 || error.response?.status === 400) {
          if (isMounted) setProfile(null);
        } else {
          console.error("Unable to fetch patient profile:", error);
        }
      } finally {
        if (isMounted) setLoadingProfile(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profile?.id) {
      setDietPlans([]);
      setLoadingDietPlans(false);
      return;
    }

    let isMounted = true;

    const fetchDietPlans = async () => {
      try {
        setLoadingDietPlans(true);
        const response = await apiClient.get<ApiResponse<DietPlan[]>>(
          `/diet-plans/patient/${profile.id}`
        );
        if (isMounted) setDietPlans(response.data.data || []);
      } catch (error) {
        console.error("Unable to fetch patient diet plans:", error);
        if (isMounted) setDietPlans([]);
      } finally {
        if (isMounted) setLoadingDietPlans(false);
      }
    };

    fetchDietPlans();
    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  const profileCompletion = useMemo(() => {
    if (!profile) return 25;

    const fields = [
      profile.fullName,
      profile.email,
      profile.phone,
      profile.age,
      profile.gender,
      profile.address,
      profile.medicalHistory,
    ];

    const completed = fields.filter(
      (field) =>
        field !== null &&
        field !== undefined &&
        String(field).trim() !== ""
    ).length;

    return Math.round((completed / fields.length) * 100);
  }, [profile]);

  const showProfileCompletion = !loadingProfile && profileCompletion < 100;
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || "there";

  const today = useMemo(() => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }, []);

  const formattedToday = useMemo(
    () =>
      new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const currentDietPlan = useMemo(() => {
    if (!dietPlans.length) return null;

    const planForToday = dietPlans.find(
      (plan) => today >= plan.startDate && today <= plan.endDate
    );
    if (planForToday) return planForToday;

    const activePlan = dietPlans.find(
      (plan) => plan.status?.toUpperCase() === "ACTIVE"
    );
    if (activePlan) return activePlan;

    return [...dietPlans].sort((a, b) =>
      b.startDate.localeCompare(a.startDate)
    )[0];
  }, [dietPlans, today]);

  const currentDietDay = useMemo(() => {
    if (!currentDietPlan) return null;

    const exactDay = currentDietPlan.days?.find((day) => day.date === today);
    if (exactDay) return exactDay;

    const start = new Date(`${currentDietPlan.startDate}T00:00:00`);
    const current = new Date(`${today}T00:00:00`);
    const difference =
      Math.floor(
        (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

    return (
      currentDietPlan.days?.find((day) => day.dayNumber === difference) || null
    );
  }, [currentDietPlan, today]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-");
    if (!year || !month || !day) return dateString;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const quickLinks = [
    {
      eyebrow: "YOUR DETAILS",
      title: "Personal & health profile",
      description: "View and manage your personal information.",
      icon: UserRound,
      path: "/patient/profile",
      iconBg: "bg-[#EEF1E8]",
      iconColor: "text-[#536B43]",
    },
    {
      eyebrow: "YOUR TREATMENT",
      title: "Panchakarma care",
      description: "Review your therapy plan and treatment schedule.",
      icon: Leaf,
      path: "/patient/plan",
      iconBg: "bg-[#F2EEDC]",
      iconColor: "text-[#88743B]",
    },
    {
      eyebrow: "YOUR WELLNESS",
      title: "Treatment progress",
      description: "Follow your recorded progress and assessments.",
      icon: ClipboardList,
      path: "/patient/progress",
      iconBg: "bg-[#E8EFEB]",
      iconColor: "text-[#356B4B]",
    },
  ];

  const meals = useMemo(
    () =>
      [...(currentDietDay?.meals || [])].sort(
        (a, b) => a.sequenceOrder - b.sequenceOrder
      ),
    [currentDietDay]
  );

  return (
    <div className="min-h-full bg-[#F7F6F0] text-[#173D2D]">
      <main className="mx-auto w-full max-w-[1440px] px-5 py-7 sm:px-7 lg:px-10 lg:py-9">
        {/* Welcome */}
        <section className="relative mb-8 overflow-hidden rounded-[28px] bg-[#173D2D] px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -bottom-36 right-36 h-64 w-64 rounded-full border border-white/10" />

          <div className="relative flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#DCD7A5]">
                Patient dashboard
              </p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Welcome back, {firstName}
              </h1>
              <p className="mt-2 text-sm text-white/70">
                Your care journey, all in one place.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs text-white/85 sm:self-auto">
              <CalendarDays size={15} />
              {formattedToday}
            </div>
          </div>
        </section>

        {/* Profile completion appears instead of a separate profile quick-link */}
        {showProfileCompletion && (
          <section className="mb-7 rounded-2xl border border-[#DCDDD3] bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEF1E8] text-[#536B43]">
                  <UserRound size={21} />
                </div>
                <div>
                  <h2 className="font-semibold text-[#173D2D]">
                    Complete your patient profile
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm leading-6 text-[#718078]">
                    Add your basic health information so your AyurSutra care
                    team can keep your patient record up to date.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-2 w-40 max-w-[55vw] overflow-hidden rounded-full bg-[#E9EBE3]">
                      <div
                        className="h-full rounded-full bg-[#71834F] transition-all"
                        style={{ width: `${profileCompletion}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[#536B43]">
                      {profileCompletion}% complete
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate("/patient/profile")}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#173D2D] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#24533F]"
              >
                Complete profile <ArrowRight size={16} />
              </button>
            </div>
          </section>
        )}

        {/* Quick links */}
        <section className="mb-8">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#71834F]">
                Quick access
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[#173D2D] sm:text-2xl">
                Your care at a glance
              </h2>
            </div>
          </div>

          <div
            className={`grid gap-4 sm:grid-cols-2 ${
              showProfileCompletion ? "lg:grid-cols-2" : "lg:grid-cols-3"
            }`}
          >
            {quickLinks
              .filter(
                (link) =>
                  !(showProfileCompletion && link.path === "/patient/profile")
              )
              .map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="group flex min-h-[178px] flex-col rounded-2xl border border-[#E1E1D8] bg-white p-5 text-left shadow-[0_2px_10px_rgba(23,61,45,0.025)] transition duration-200 hover:-translate-y-1 hover:border-[#B8C3AF] hover:shadow-[0_12px_28px_rgba(23,61,45,0.08)] sm:p-6"
                  >
                    <div className="flex w-full items-center justify-between">
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${link.iconBg} ${link.iconColor}`}
                      >
                        <Icon size={21} />
                      </span>
                      <ArrowRight
                        size={18}
                        className="text-[#A0AA9A] transition group-hover:translate-x-1 group-hover:text-[#356B4B]"
                      />
                    </div>
                    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#829078]">
                      {link.eyebrow}
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[#173D2D]">
                      {link.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-5 text-[#778078]">
                      {link.description}
                    </p>
                  </button>
                );
              })}
          </div>
        </section>

        {/* Diet plan and supporting care panel */}
        <section className="grid items-stretch gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
          <div className="overflow-hidden rounded-2xl border border-[#E1E1D8] bg-white">
            <div className="flex flex-col gap-3 border-b border-[#ECECE5] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
              <div>
                <div className="flex items-center gap-2 text-[#71834F]">
                  <Utensils size={16} />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">
                    Daily nutrition
                  </p>
                </div>
                <h2 className="mt-2 text-xl font-semibold text-[#173D2D]">
                  Today&apos;s diet plan
                </h2>

                {loadingDietPlans ? (
                  <p className="mt-1.5 text-sm text-[#778078]">
                    Loading your dietary plan...
                  </p>
                ) : currentDietPlan ? (
                  <>
                    <p className="mt-1.5 text-sm font-medium text-[#315A46]">
                      {currentDietPlan.planName}
                    </p>
                    <p className="mt-1 text-xs text-[#8A918B]">
                      {formatDate(currentDietPlan.startDate)} –{" "}
                      {formatDate(currentDietPlan.endDate)}
                      {currentDietDay?.dayNumber
                        ? ` · Day ${currentDietDay.dayNumber}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 text-sm text-[#778078]">
                    Your prescribed meals will appear here.
                  </p>
                )}
              </div>

              {currentDietPlan?.status && (
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#EEF3E9] px-3 py-1.5 text-xs font-medium text-[#48623D]">
                  <CheckCircle2 size={13} />
                  {currentDietPlan.status}
                </span>
              )}
            </div>

            <div className="p-5 sm:p-6">
              {loadingDietPlans ? (
                <div className="flex min-h-[190px] items-center justify-center">
                  <p className="text-sm text-[#778078]">
                    Fetching your meals...
                  </p>
                </div>
              ) : !currentDietPlan ? (
                <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl bg-[#FAFAF7] px-5 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1E8] text-[#71834F]">
                    <Leaf size={21} />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-[#4E463D]">
                    No diet plan assigned yet
                  </h3>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-[#91897C]">
                    Your diet recommendations will be available here once a
                    plan has been prescribed by your care team.
                  </p>
                </div>
              ) : !currentDietDay ? (
                <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl bg-[#FAFAF7] px-5 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EEF1E8] text-[#71834F]">
                    <CalendarDays size={20} />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold text-[#4E463D]">
                    No meals scheduled for today
                  </h3>
                  <p className="mt-1 max-w-sm text-xs leading-5 text-[#91897C]">
                    Open your full diet plan to review the complete schedule.
                  </p>
                </div>
              ) : meals.length === 0 ? (
                <div className="rounded-xl bg-[#FAFAF7] px-5 py-10 text-center text-sm text-[#778078]">
                  No meal details have been added for today.
                </div>
              ) : (
                <div className="divide-y divide-[#ECECE5]">
                  {meals.map((meal, index) => (
                    <div
                      key={`${meal.mealType}-${meal.sequenceOrder}-${index}`}
                      className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-5"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold capitalize text-[#173D2D]">
                            {meal.mealType}
                          </h3>
                          {meal.restrictions && (
                            <span className="rounded-full bg-[#F7F0E7] px-2 py-0.5 text-[10px] font-medium text-[#8A6540]">
                              Dietary note
                            </span>
                          )}
                        </div>
                        {meal.foodItems && (
                          <p className="mt-1.5 text-sm leading-5 text-[#59675D]">
                            {meal.foodItems}
                          </p>
                        )}
                        {meal.instructions && (
                          <p className="mt-1 text-xs leading-5 text-[#899087]">
                            {meal.instructions}
                          </p>
                        )}
                        {meal.restrictions && (
                          <p className="mt-1 text-xs leading-5 text-[#8A6540]">
                            Note: {meal.restrictions}
                          </p>
                        )}
                      </div>
                      {meal.mealTime && (
                        <span className="w-fit shrink-0 rounded-full bg-[#F2F3ED] px-3 py-1 text-xs font-medium text-[#687568]">
                          {meal.mealTime}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-[#ECECE5] pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/patient/diet-plan")}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#173D2D] transition hover:text-[#71834F]"
                >
                  View full diet plan <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <aside className="flex flex-col justify-between rounded-2xl bg-[#EAEDE3] p-6 sm:p-7">
            <div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#536B43]">
                <Wind size={21} />
              </span>
              <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#71834F]">
                A note for your day
              </p>
              <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#173D2D]">
                Consistency matters more than perfection.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[#667368]">
                Use your prescribed care plan as your guide. If you have
                questions about meals, therapies, or daily instructions,
                connect with your AyurSutra care team.
              </p>
            </div>

            <div className="mt-8 border-t border-[#D7DDCF] pt-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#829078]">
                Need to check your schedule?
              </p>
              <button
                type="button"
                onClick={() => navigate("/patient/sessions")}
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#173D2D] hover:text-[#71834F]"
              >
                View my sessions <ArrowRight size={16} />
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

export default PatientDashboard;


import { useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Stethoscope,
  Printer,
  AlertCircle,
} from "lucide-react";

import {
  getMyTherapyPlans,
} from "../../services/therapyPlan/therapyPlanService";

import type {
  TherapyPlan,
} from "../../services/therapyPlan/therapyPlanService";

import {
  getMyPatientProfile,
} from "../../services/patient/patientService";

import type {
  PatientProfile,
} from "../../services/patient/patientService";

import {
  printAyurvedicPrescription,
} from "../../utils/pdfExport";

function PatientTherapyPlan() {
  const [plans, setPlans] = useState<TherapyPlan[]>([]);
  const [patient, setPatient] = useState<PatientProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      setProfileError("");

      const [plansResult, profileResult] = await Promise.allSettled([
        getMyTherapyPlans(),
        getMyPatientProfile(),
      ]);

      if (plansResult.status === "fulfilled") {
        setPlans(plansResult.value);
      } else {
        console.error("Unable to fetch therapy plans:", plansResult.reason);
        setError("Unable to load your therapy plans. Please try again later.");
      }

      if (profileResult.status === "fulfilled") {
        setPatient(profileResult.value);
      } else {
        console.error("Unable to fetch patient profile:", profileResult.reason);
        setPatient(null);
        setProfileError(
          "Your patient profile could not be loaded. Please update your profile before printing the prescription."
        );
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const formatDate = (date: string) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusStyle = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-[#E7F1E8] text-[#2F6545]";

      case "COMPLETED":
        return "bg-[#E8EEE9] text-[#486452]";

      case "CANCELLED":
        return "bg-[#F6E8E6] text-[#8B4A42]";

      case "PLANNED":
        return "bg-[#F1F0E5] text-[#7A7442]";

      default:
        return "bg-[#F1F2ED] text-[#727A72]";
    }
  };

  const handlePrint = (plan: TherapyPlan) => {
    if (!patient) {
      setProfileError(
        "Patient profile is required to print the prescription."
      );
      return;
    }

    printAyurvedicPrescription({
      patientName: patient.fullName || "—",
      patientAge: patient.age ?? undefined,
      patientGender: patient.gender ?? undefined,
      patientPhone: patient.phone || undefined,
      primaryDosha: patient.primaryDosha || undefined,
      therapyPlanName: plan.planName,
      diagnosis: plan.diagnosis || undefined,

      therapies: plan.therapies
        .slice()
        .sort(
          (a, b) =>
            a.day - b.day ||
            a.sequenceOrder - b.sequenceOrder
        )
        .map((therapy) => ({
          name: therapy.therapyName,
          duration: `${therapy.durationMinutes} Mins`,
          frequency: `Day ${therapy.day} · Sequence ${therapy.sequenceOrder}`,
        })),
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F6F0] flex items-center justify-center px-5">
        <div className="flex items-center gap-3 text-[#5E6C61]">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm font-medium">
            Loading your therapy plan...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F0] text-[#173D2D]">
      <main className="mx-auto max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">

        {/* Page Header */}
        <section className="mb-7">
          <h1 className="text-2xl font-bold tracking-tight text-[#173D2D] sm:text-3xl">
            My Therapy Plan
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#718078]">
            View your personalized Panchakarma treatment plan,
            therapies and treatment schedule.
          </p>
        </section>

        {/* Errors */}
        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#E4C9C5] bg-[#FBF0EE] px-4 py-3 text-sm text-[#8B4A42]">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {profileError && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#E7D9B8] bg-[#FBF7EA] px-4 py-3 text-sm text-[#806B38]">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            {profileError}
          </div>
        )}

        {/* Empty State */}
        {!error && plans.length === 0 && (
          <section className="rounded-2xl border border-[#DDDCD3] bg-white px-6 py-12 sm:px-10">
            <div className="mx-auto max-w-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF1E8] text-[#71834F]">
                <FileText size={25} />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-[#173D2D]">
                No therapy plan yet
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#718078]">
                Your personalized therapy plan will appear here
                once your doctor creates and assigns one to you.
              </p>

              <div className="mt-6 rounded-xl bg-[#F7F6F0] p-4 text-left">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#71834F]">
                  What happens next
                </p>

                <p className="mt-2 text-sm leading-6 text-[#68736C]">
                  Your doctor will prepare a treatment plan based
                  on your consultation and assessment.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Therapy Plans */}
        {plans.length > 0 && (
          <div className="space-y-5">
            {plans.map((plan) => {
              const sortedTherapies = plan.therapies
                .slice()
                .sort(
                  (a, b) =>
                    a.day - b.day ||
                    a.sequenceOrder - b.sequenceOrder
                );

              return (
                <section
                  key={plan.id}
                  className="overflow-hidden rounded-2xl border border-[#DDDCD3] bg-white shadow-[0_2px_12px_rgba(31,61,46,0.035)]"
                >
                  {/* Plan Header */}
                  <div className="border-b border-[#EAEAE3] p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF1E8] text-[#71834F]">
                          <Stethoscope size={21} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#71834F]">
                            Therapy Plan
                          </p>

                          <h2 className="mt-1 break-words text-lg font-bold text-[#173D2D] sm:text-xl">
                            {plan.planName}
                          </h2>

                          {plan.diagnosis && (
                            <p className="mt-2 text-sm text-[#718078]">
                              <span className="font-medium text-[#59665D]">
                                Diagnosis:
                              </span>{" "}
                              {plan.diagnosis}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <span
                          className={`rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider ${getStatusStyle(
                            plan.status
                          )}`}
                        >
                          {plan.status}
                        </span>

                        <button
                          onClick={() => handlePrint(plan)}
                          disabled={!patient}
                          title={
                            !patient
                              ? "Patient profile unavailable"
                              : "Print prescription"
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1F3D2E] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#294D3A] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Printer size={14} />
                          Print Prescription
                        </button>
                      </div>
                    </div>

                    {/* Date Cards */}
                    <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-3 rounded-xl bg-[#F7F6F0] px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#71834F]">
                          <CalendarDays size={17} />
                        </div>

                        <div>
                          <p className="text-[11px] font-medium text-[#899189]">
                            Start Date
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-[#173D2D]">
                            {formatDate(plan.startDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl bg-[#F7F6F0] px-4 py-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#71834F]">
                          <CalendarDays size={17} />
                        </div>

                        <div>
                          <p className="text-[11px] font-medium text-[#899189]">
                            End Date
                          </p>
                          <p className="mt-0.5 text-sm font-semibold text-[#173D2D]">
                            {formatDate(plan.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Treatment Schedule */}
                  <div className="p-5 sm:p-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#71834F]">
                          Treatment Schedule
                        </p>

                        <h3 className="mt-1 text-base font-bold text-[#173D2D]">
                          Planned Therapies
                        </h3>
                      </div>

                      <span className="shrink-0 rounded-full bg-[#F1F2ED] px-3 py-1.5 text-xs font-semibold text-[#68736C]">
                        {plan.therapies.length}{" "}
                        {plan.therapies.length === 1
                          ? "Therapy"
                          : "Therapies"}
                      </span>
                    </div>

                    {sortedTherapies.length === 0 ? (
                      <div className="rounded-xl bg-[#F7F6F0] px-5 py-7 text-center">
                        <p className="text-sm text-[#718078]">
                          No therapies have been added to this plan yet.
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {sortedTherapies.map((therapy, index) => (
                          <div
                            key={`${therapy.therapyId}-${therapy.day}-${index}`}
                            className="rounded-xl border border-[#E5E5DD] bg-[#FCFCF9] p-4 transition hover:border-[#C8D3C3] hover:bg-[#FAFBF7]"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF1E8] text-sm font-bold text-[#71834F]">
                                  {therapy.day}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#899189]">
                                    Day {therapy.day}
                                  </p>

                                  <h4 className="mt-0.5 break-words text-sm font-semibold text-[#173D2D]">
                                    {therapy.therapyName}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#F1F2ED] px-2.5 py-2 text-xs font-medium text-[#68736C]">
                                <Clock3 size={14} className="text-[#71834F]" />
                                {therapy.durationMinutes} min
                              </div>
                            </div>

                            <div className="mt-3 border-t border-[#ECEDE6] pt-3">
                              <p className="text-xs text-[#899189]">
                                Sequence{" "}
                                <span className="font-semibold text-[#68736C]">
                                  {therapy.sequenceOrder}
                                </span>
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Footer Note */}
        {plans.length > 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-[#E1E6DB] bg-[#EEF1E8] px-4 py-4">
            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-[#71834F]"
            />

            <p className="text-xs leading-6 text-[#5F6D64] sm:text-sm">
              Your therapy plan is prepared by your care team.
              Follow the schedule prescribed by your doctor and
              consult them if you have any concerns.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default PatientTherapyPlan;

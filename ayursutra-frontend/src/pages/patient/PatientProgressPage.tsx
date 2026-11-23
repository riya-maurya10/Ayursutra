import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CalendarDays, CheckCircle2, ClipboardCheck,
  FileText, HeartPulse, Loader2, MessageSquareText, Stethoscope, TrendingUp,
} from "lucide-react";
import apiClient from "../../services/api/client";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
interface PatientProfile {
  id: string;
  fullName?: string;
  name?: string;
  email?: string;
}
interface PatientProgress {
  id: string;
  patientId: string;
  therapyPlanId: string;
  therapySessionId?: string;
  therapyName?: string;
  assessmentDate: string;
  dayNumber: number;
  symptoms?: string;
  observations?: string;
  improvementPercentage?: number | null;
  therapyResponse?: string;
  discomfortSideEffects?: string;
  practitionerNotes?: string;
  notesForDoctor?: string;
  clinicalAssessment?: string;
  treatmentAdjustments?: string;
  nextRecommendation?: string;
  assessedByTherapistName?: string;
  reviewedByDoctorName?: string;
  reviewedAt?: string;
}
type FilterType = "ALL" | "LATEST";

const isReviewed = (item: PatientProgress) =>
  Boolean(item.reviewedAt || item.reviewedByDoctorName);

const formatDate = (value?: string) => {
  if (!value) return "—";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
};

const Detail = ({
  icon, title, children, tone = "neutral",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  tone?: "neutral" | "warning";
}) => (
  <div className={`rounded-xl border p-4 ${tone === "warning"
      ? "border-[#F0DDAF] bg-[#FFFBF0]"
      : "border-[#E5DDC9] bg-[#F3F0E6]"
    }`}>
    <div className={`flex items-center gap-2 ${tone === "warning" ? "text-[#9A702C]" : "text-[#71834F]"
      }`}>
      {icon}
      <h4 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#526645]">
        {title}
      </h4>
    </div>
    <p className={`mt-2.5 text-sm leading-6 ${tone === "warning" ? "text-[#765B2C]" : "text-[#53635A]"
      }`}>
      {children}
    </p>
  </div>
);

const PatientProgressPage: React.FC = () => {
  const [progress, setProgress] = useState<PatientProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<FilterType>("ALL");

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        setError("");
        const profileResponse = await apiClient.get<ApiResponse<PatientProfile>>(
          "/patients/me"
        );
        const patientId = profileResponse.data.data?.id;
        if (!patientId) throw new Error("Unable to determine the logged-in patient.");

        const response = await apiClient.get<ApiResponse<PatientProgress[]>>(
          `/patient-progress/patient/${patientId}`
        );
        if (response.data.success) setProgress(response.data.data || []);
        else setError(response.data.message || "Unable to fetch patient progress.");
      } catch (err: any) {
        console.error("Unable to fetch patient progress:", err);
        setError(
          err?.response?.data?.message || err?.message ||
          "Unable to load your progress."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const sorted = useMemo(
    () => [...progress].sort((a, b) =>
      new Date(b.assessmentDate).getTime() -
      new Date(a.assessmentDate).getTime() || b.dayNumber - a.dayNumber
    ),
    [progress]
  );
  const shown = filter === "LATEST" ? sorted.slice(0, 1) : sorted;
  const latest = sorted[0];
  const reviewedWithPercent = progress.filter(
    item => isReviewed(item) &&
      item.improvementPercentage !== null &&
      item.improvementPercentage !== undefined
  );
  const average = reviewedWithPercent.length
    ? Math.round(
      reviewedWithPercent.reduce(
        (sum, item) => sum + (item.improvementPercentage ?? 0), 0
      ) / reviewedWithPercent.length
    )
    : null;
  const latestPercent = latest && isReviewed(latest) &&
    latest.improvementPercentage !== null &&
    latest.improvementPercentage !== undefined
    ? latest.improvementPercentage
    : null;

  const heading = (
    <header className="mb-8">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#71834F]">
        YOUR AYURVEDIC CARE
      </p>
      <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#173D2D] sm:text-[2.15rem]">
            My Progress
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#68736C] sm:text-base">
            A clear view of your therapy journey, session observations and doctor-reviewed progress.
          </p>
        </div>
        {progress.length > 0 && (
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#DDE3D8] bg-white px-3.5 py-2 text-xs font-medium text-[#526645]">
            <Activity size={15} />
            {progress.length} {progress.length === 1 ? "assessment" : "assessments"}
          </span>
        )}
      </div>
    </header>
  );

  if (loading || error || progress.length === 0) {
    return (
      <div className="min-h-full bg-[#F8F6F0]">
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
          {heading}
          <div className="rounded-3xl border border-[#E1E5DA] bg-white px-6 py-14 text-center">
            {loading ? (
              <>
                <Loader2 className="mx-auto animate-spin text-[#71834F]" size={28} />
                <p className="mt-3 text-sm text-[#68736C]">Loading your progress...</p>
              </>
            ) : error ? (
              <>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F8EEEB] text-[#9A594D]">
                  <AlertTriangle size={22} />
                </div>
                <h2 className="mt-4 text-lg font-semibold text-[#173D2D]">
                  Unable to load your progress
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#68736C]">{error}</p>
              </>
            ) : (
              <>
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF2E8] text-[#71834F]">
                  <TrendingUp size={26} />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-[#173D2D]">
                  Your progress journey starts here
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#68736C]">
                  Your therapist will add an assessment after each completed therapy session.
                  You will see those updates here along with your doctor&apos;s clinical review.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#F8F6F0]">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
        {heading}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: "Total assessments", value: String(progress.length),
              note: "Recorded therapy sessions", icon: <ClipboardCheck size={20} />,
            },
            {
              label: "Average improvement", value: average === null ? "—" : `${average}%`,
              note: "From doctor-reviewed assessments", icon: <TrendingUp size={20} />,
            },
            {
              label: "Latest improvement", value: latestPercent === null ? "—" : `${latestPercent}%`,
              note: latest && !isReviewed(latest)
                ? "Awaiting doctor review" : "Most recent reviewed result",
              icon: <HeartPulse size={20} />,
            },
          ].map(card => (
            <div
              key={card.label}
              className="rounded-2xl border border-[#8EAF83] bg-[#AFCBA5] p-5 sm:p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#294C37]">
                  {card.label}
                </p>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF2E8] text-[#71834F]">
                  {card.icon}
                </span>
              </div>

              <p className="mt-3 text-3xl font-bold tracking-tight text-[#173D2D]">
                {card.value}
              </p>

              <p className="mt-1 text-xs font-medium text-[#294C37]">
                {card.note}
              </p>
            </div>
          ))}
        </section>

        <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#173D2D]">Treatment history</h2>
            <p className="mt-1 text-sm text-[#78827A]">Your progress, session by session</p>
          </div>
          <div className="inline-flex w-fit rounded-full border border-[#DDE3D8] bg-white p-1">
            {(["ALL", "LATEST"] as FilterType[]).map(value => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${filter === value
                    ? "bg-[#1F3D2E] text-white shadow-sm"
                    : "text-[#58665C] hover:bg-[#F3F5EF]"
                  }`}
              >
                {value === "ALL" ? "All assessments" : "Latest"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {shown.map((item, index) => {
            const reviewed = isReviewed(item);
            const improvement = reviewed &&
              item.improvementPercentage !== null &&
              item.improvementPercentage !== undefined
              ? Math.min(Math.max(item.improvementPercentage, 0), 100)
              : null;

            return (
              <article
                key={item.id}
                className={`overflow-hidden rounded-2xl border shadow-[0_2px_10px_rgba(28,55,39,0.025)] ${index % 2 === 0
                    ? "border-[#DDE5D7] bg-white"
                    : "border-[#8EAF83] bg-[#AFCBA5]"
                  }`}
              >
                <div className="flex flex-col gap-4 border-b border-[#DCE8D7] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2E8] text-[#71834F]">
                      <CalendarDays size={20} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[#173D2D]">Day {item.dayNumber}</h3>
                        {item.therapyName && (
                          <>
                            <span className="text-[#B0B8AC]">·</span>
                            <span className="text-sm font-medium text-[#526645]">{item.therapyName}</span>
                          </>
                        )}
                        {index === 0 && (
                          <span className="rounded-full bg-[#EEF2E8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#526645]">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-[#7A847D]">
                        Session assessment · {formatDate(item.assessmentDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${reviewed ? "bg-[#EEF5EC] text-[#3F684F]" : "bg-[#F7F2E6] text-[#8A6B32]"
                      }`}>
                      {reviewed ? <CheckCircle2 size={14} /> : <Activity size={14} />}
                      {reviewed ? "Doctor reviewed" : "Awaiting doctor review"}
                    </span>
                    <div className="rounded-xl bg-[#F6F7F2] px-4 py-2.5 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#89927F]">
                        Improvement
                      </p>
                      <p className="mt-0.5 text-lg font-semibold text-[#173D2D]">
                        {improvement === null ? "—" : `${improvement}%`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                  <Detail icon={<Activity size={16} />} title="Symptoms">
                    {item.symptoms || "No symptoms recorded."}
                  </Detail>
                  <Detail icon={<FileText size={16} />} title="Therapist observations">
                    {item.observations || "No observations recorded."}
                  </Detail>
                  <Detail icon={<HeartPulse size={16} />} title="Therapy response">
                    {item.therapyResponse || "No therapy response recorded."}
                  </Detail>
                  {item.discomfortSideEffects && (
                    <Detail icon={<AlertTriangle size={16} />} title="Discomfort / side effects" tone="warning">
                      {item.discomfortSideEffects}
                    </Detail>
                  )}
                </div>

                {/* Internal practitioner notes and notes intended for the doctor
                    are deliberately not exposed in the patient-facing portal. */}
                {reviewed && (item.clinicalAssessment || item.treatmentAdjustments) && (
                  <div className="mx-5 mb-4 rounded-xl border border-[#E5DDC9] bg-[#F3F0E6] p-4 sm:mx-6">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5EDE1] pb-3">
                      <div className="flex items-center gap-2 text-[#3F684F]">
                        <Stethoscope size={17} />
                        <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#294C37]">
                          Doctor&apos;s review
                        </h4>
                      </div>
                      {item.reviewedByDoctorName && (
                        <span className="text-xs text-[#607568]">
                          Reviewed by Dr. {item.reviewedByDoctorName}
                          {item.reviewedAt ? ` · ${formatDate(item.reviewedAt)}` : ""}
                        </span>
                      )}
                    </div>
                    {item.clinicalAssessment && (
                      <p className="mt-3 text-sm leading-6 text-[#53635A]">{item.clinicalAssessment}</p>
                    )}
                    {item.treatmentAdjustments && (
                      <div className="mt-3 rounded-lg bg-[#E5EBD9] px-3.5 py-3 text-sm leading-6 text-[#435A49]">
                        <strong className="text-[#294C37]">Treatment adjustments: </strong>
                        {item.treatmentAdjustments}
                      </div>
                    )}
                  </div>
                )}

                {item.nextRecommendation && (
                  <div className="mx-5 mb-5 rounded-xl border border-[#E5DDC9] bg-[#F3F0E6] px-4 py-4 sm:mx-6 sm:mb-6">
                    <div className="flex items-center gap-2 text-[#71834F]">
                      <MessageSquareText size={16} />
                      <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#526645]">
                        Next recommendation
                      </h4>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#53635A]">{item.nextRecommendation}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PatientProgressPage;

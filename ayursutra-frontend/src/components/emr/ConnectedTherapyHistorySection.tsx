import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Sparkles,
  Apple,
  Activity,
  CalendarCheck,
  Stethoscope,
} from "lucide-react";
import { DoctorProgressReviewModal } from "./DoctorProgressReviewModal";

interface ConnectedTherapyHistorySectionProps {
  therapyPlans: any[];
  therapySessions: any[];
  dietPlans: any[];
  progressRecords: any[];
  appointments: any[];
  patientName?: string;
  patientId?: string;
  onProgressUpdated?: () => void;
  canDoctorReview?: boolean;
}

export const ConnectedTherapyHistorySection: React.FC<
  ConnectedTherapyHistorySectionProps
> = ({
  therapyPlans = [],
  therapySessions = [],
  dietPlans = [],
  progressRecords = [],
  appointments = [],
  patientName,
  patientId,
  onProgressUpdated,
  canDoctorReview = false,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "plans" | "sessions" | "diet" | "progress" | "appointments"
  >("plans");

  const [selectedProgressForReview, setSelectedProgressForReview] = useState<any | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] shadow-sm overflow-hidden">
      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center gap-1 border-b border-[#ECEFE6] bg-[#F8F6F0] p-2">
        <button
          onClick={() => setActiveSubTab("plans")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeSubTab === "plans"
              ? "bg-[#1F3D2E] text-white shadow-sm"
              : "text-[#665849] hover:bg-white/80"
          }`}
        >
          <Sparkles size={14} />
          Therapy Plans ({therapyPlans.length})
        </button>

        <button
          onClick={() => setActiveSubTab("sessions")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeSubTab === "sessions"
              ? "bg-[#1F3D2E] text-white shadow-sm"
              : "text-[#665849] hover:bg-white/80"
          }`}
        >
          <CalendarDays size={14} />
          Panchakarma Sessions ({therapySessions.length})
        </button>

        <button
          onClick={() => setActiveSubTab("diet")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeSubTab === "diet"
              ? "bg-[#1F3D2E] text-white shadow-sm"
              : "text-[#665849] hover:bg-white/80"
          }`}
        >
          <Apple size={14} />
          Diet Plans ({dietPlans.length})
        </button>

        <button
          onClick={() => setActiveSubTab("progress")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeSubTab === "progress"
              ? "bg-[#1F3D2E] text-white shadow-sm"
              : "text-[#665849] hover:bg-white/80"
          }`}
        >
          <Activity size={14} />
          Progress Assessments ({progressRecords.length})
        </button>

        <button
          onClick={() => setActiveSubTab("appointments")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${
            activeSubTab === "appointments"
              ? "bg-[#1F3D2E] text-white shadow-sm"
              : "text-[#665849] hover:bg-white/80"
          }`}
        >
          <CalendarCheck size={14} />
          Consultation Visits ({appointments.length})
        </button>
      </div>

      {/* Sub-tab Contents */}
      <div className="p-6 text-xs">
        {/* 1. THERAPY PLANS */}
        {activeSubTab === "plans" && (
          <div className="space-y-4">
            {therapyPlans.length > 0 ? (
              therapyPlans.map((plan: any) => (
                <div
                  key={plan.id}
                  className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#ECEFE6] pb-2.5">
                    <div>
                      <h4 className="font-bold text-[#173F32] text-sm">
                        {plan.planName}
                      </h4>
                      <p className="text-[#766F63] text-xs">
                        Diagnosis: {plan.diagnosis || "Ayurvedic Treatment Plan"}
                      </p>
                    </div>
                    <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                      {plan.status || "ACTIVE"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-[#665849]">
                    <span>
                      Start: <strong>{plan.startDate}</strong>
                    </span>
                    {plan.endDate && (
                      <span>
                        End: <strong>{plan.endDate}</strong>
                      </span>
                    )}
                    {plan.therapies && (
                      <span>
                        Therapies: <strong>{plan.therapies.length} Prescribed</strong>
                      </span>
                    )}
                  </div>

                  {plan.therapies && plan.therapies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {plan.therapies.map((t: any, idx: number) => (
                        <span
                          key={idx}
                          className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-[#1F3D2E] border border-[#D5DCCB]"
                        >
                          {t.therapyName || t.name} ({t.durationMinutes || 45}m)
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Targeted Body Regions & Marma Points */}
                  {((plan.targetedBodyRegions && plan.targetedBodyRegions.length > 0) ||
                    (plan.targetedMarmaPoints && plan.targetedMarmaPoints.length > 0)) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[#ECEFE6] pt-2.5">
                      {plan.targetedBodyRegions && plan.targetedBodyRegions.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7F4E]">Regions:</span>
                          {plan.targetedBodyRegions.map((reg: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-md bg-[#EEF2E8] px-2 py-0.5 text-[11px] font-semibold text-[#2D5A3F] border border-[#D5DCCB]"
                            >
                              {reg.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}

                      {plan.targetedMarmaPoints && plan.targetedMarmaPoints.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B26A00]">Marmas:</span>
                          {plan.targetedMarmaPoints.map((m: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-md bg-[#FFF8EB] px-2 py-0.5 text-[11px] font-semibold text-[#8C4E00] border border-[#F3DFC1]"
                            >
                              {m.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {patientId && (
                    <div className="mt-3 flex justify-end">
                      <Link
                        to={`/doctor/patients/${patientId}/therapy-plan?editPlanId=${plan.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#C6CFBB] bg-white px-3 py-1.5 text-xs font-semibold text-[#1F3D2E] transition hover:bg-[#EEF2E8]"
                      >
                        Edit Plan & Body Mapping →
                      </Link>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-[#91897C] italic">
                No active or past therapy plans linked to this patient.
              </p>
            )}
          </div>
        )}

        {/* 2. PANCHAKARMA SESSIONS */}
        {activeSubTab === "sessions" && (
          <div className="overflow-x-auto">
            {therapySessions.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ECEFE6] text-[#766F63] bg-[#F8F6F0]">
                    <th className="py-2.5 px-3 font-semibold uppercase">Date & Time</th>
                    <th className="py-2.5 px-3 font-semibold uppercase">Therapy</th>
                    <th className="py-2.5 px-3 font-semibold uppercase">Day #</th>
                    <th className="py-2.5 px-3 font-semibold uppercase">Status</th>
                    <th className="py-2.5 px-3 font-semibold uppercase">Session Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFE6]">
                  {therapySessions.map((session: any) => (
                    <tr key={session.id} className="hover:bg-[#F8F6F0]/60">
                      <td className="py-2.5 px-3 font-medium text-[#1F3D2E]">
                        {session.sessionDate}{" "}
                        {session.startTime && (
                          <span className="text-[#766F63]">@ {session.startTime}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#173F32]">
                        {session.therapyName}
                      </td>
                      <td className="py-2.5 px-3 text-[#4E463D]">
                        Day {session.dayNumber ?? 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`rounded px-2 py-0.5 text-[11px] font-semibold ${
                            session.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : session.status === "CANCELLED"
                              ? "bg-rose-50 text-rose-800"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {session.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#665849]">
                        {session.notes || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-6 text-center text-[#91897C] italic">
                No Panchakarma therapy sessions recorded for this patient.
              </p>
            )}
          </div>
        )}

        {/* 3. DIET PLANS */}
        {activeSubTab === "diet" && (
          <div className="space-y-4">
            {dietPlans.length > 0 ? (
              dietPlans.map((diet: any) => (
                <div
                  key={diet.id}
                  className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-4"
                >
                  <div className="flex items-center justify-between border-b border-[#ECEFE6] pb-2">
                    <div>
                      <h4 className="font-bold text-[#173F32] text-sm">
                        {diet.planName}
                      </h4>
                      <p className="text-xs text-[#766F63]">
                        {diet.startDate} to {diet.endDate || "Ongoing"}
                      </p>
                    </div>
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      {diet.status || "ACTIVE"}
                    </span>
                  </div>

                  {diet.notes && (
                    <p className="mt-2.5 text-xs text-[#4E463D]">
                      <strong>Dietary Instructions:</strong> {diet.notes}
                    </p>
                  )}

                  {diet.days && diet.days.length > 0 && (
                    <div className="mt-3 text-xs text-[#766F63]">
                      Includes {diet.days.length} structured daily Ayurvedic meal protocols.
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-[#91897C] italic">
                No diet plans prescribed yet.
              </p>
            )}
          </div>
        )}

        {/* 4. PROGRESS ASSESSMENTS */}
        {activeSubTab === "progress" && (
          <div className="space-y-4">
            {progressRecords.length > 0 ? (
              progressRecords.map((prog: any) => (
                <div
                  key={prog.id}
                  className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-4 transition hover:border-[#D8D2C3]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#ECEFE6] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF3EA] text-[#3F684F]">
                        <Activity size={14} />
                      </div>
                      <div>
                        <span className="font-bold text-[#173F32] text-xs">
                          Assessment Date: {prog.assessmentDate} (Day {prog.dayNumber ?? 1})
                        </span>
                        {prog.therapyName && (
                          <span className="ml-2 font-medium text-[#2F6B46]">
                            • {prog.therapyName}
                          </span>
                        )}
                        {prog.assessedByTherapistName && (
                          <span className="ml-2 text-gray-500">
                            (Assessed by: {prog.assessedByTherapistName})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {prog.improvementPercentage !== undefined && prog.improvementPercentage !== null ? (
                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                          {prog.improvementPercentage}% Improvement
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200">
                          Review Pending
                        </span>
                      )}

                      {canDoctorReview && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedProgressForReview(prog);
                            setIsReviewModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 rounded-lg bg-[#1F3D2E] px-3 py-1 text-xs font-semibold text-white hover:bg-[#2A523D] transition shadow-xs"
                        >
                          <Stethoscope size={12} />
                          {prog.reviewedByDoctorName ? "Update Review" : "Clinical Review"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Therapist Observations */}
                    <div className="space-y-1.5">
                      {prog.symptoms && (
                        <p className="text-[#4E463D]">
                          <strong>Reported Symptoms:</strong> {prog.symptoms}
                        </p>
                      )}

                      {prog.observations && (
                        <p className="text-[#4E463D]">
                          <strong>Therapist Observations:</strong> {prog.observations}
                        </p>
                      )}

                      {prog.therapyResponse && (
                        <p className="text-[#4E463D]">
                          <strong>Response / Tolerance:</strong>{" "}
                          <span className="inline-block rounded bg-[#EEF3EA] px-2 py-0.5 font-medium text-[#2F6B46]">
                            {prog.therapyResponse}
                          </span>
                        </p>
                      )}

                      {prog.discomfortSideEffects && (
                        <p className="text-amber-800 bg-amber-50 rounded p-1.5 border border-amber-200">
                          <strong>Reported Discomfort:</strong> {prog.discomfortSideEffects}
                        </p>
                      )}

                      {prog.notesForDoctor && (
                        <p className="text-[#1F3D2E] bg-[#FAFDF7] rounded p-1.5 border border-[#C5D1BD]">
                          <strong>Therapist Notes for Doctor:</strong> {prog.notesForDoctor}
                        </p>
                      )}

                      {prog.practitionerNotes && (
                        <p className="text-[#665849] italic">
                          <strong>Notes:</strong> {prog.practitionerNotes}
                        </p>
                      )}
                    </div>

                    {/* Doctor Evaluation Details */}
                    <div className="rounded-lg bg-white p-3 border border-[#ECEFE6] space-y-1.5">
                      <div className="flex items-center justify-between border-b border-[#ECEFE6] pb-1 font-semibold text-[#1F3D2E]">
                        <span className="flex items-center gap-1">
                          <Stethoscope size={13} />
                          Doctor Clinical Evaluation
                        </span>
                        {prog.reviewedByDoctorName && (
                          <span className="text-[11px] font-normal text-gray-500">
                            Dr. {prog.reviewedByDoctorName}
                          </span>
                        )}
                      </div>

                      {prog.reviewedByDoctorName ? (
                        <>
                          {prog.clinicalAssessment && (
                            <p className="text-gray-700">
                              <strong>Clinical Assessment:</strong> {prog.clinicalAssessment}
                            </p>
                          )}
                          {prog.treatmentAdjustments && (
                            <p className="text-gray-700">
                              <strong>Adjustments:</strong> {prog.treatmentAdjustments}
                            </p>
                          )}
                          {prog.nextRecommendation && (
                            <p className="text-gray-700">
                              <strong>Next Advice:</strong> {prog.nextRecommendation}
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-400 italic py-2">
                          No doctor clinical review has been recorded yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-[#91897C] italic">
                No treatment progress assessments recorded yet.
              </p>
            )}
          </div>
        )}

        {/* 5. APPOINTMENTS */}
        {activeSubTab === "appointments" && (
          <div className="overflow-x-auto">
            {appointments.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#ECEFE6] text-[#766F63] bg-[#F8F6F0]">
                    <th className="py-2.5 px-3 font-semibold uppercase">Date & Time</th>
                    <th className="py-2.5 px-3 font-semibold uppercase">Doctor</th>
                    <th className="py-2.5 px-3 font-semibold uppercase">Type</th>
                    <th className="py-2.5 px-3 font-semibold uppercase">Status</th>
                    <th className="py-2.5 px-3 font-semibold uppercase">Chief Complaints</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEFE6]">
                  {appointments.map((appt: any) => (
                    <tr key={appt.id} className="hover:bg-[#F8F6F0]/60">
                      <td className="py-2.5 px-3 font-medium text-[#1F3D2E]">
                        {appt.appointmentDate} @ {appt.startTime}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#173F32]">
                        Dr. {appt.doctorName}
                      </td>
                      <td className="py-2.5 px-3 text-[#4E463D]">
                        {appt.appointmentType?.replace(/_/g, " ")}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="rounded bg-[#F8F6F0] border border-[#ECEFE6] px-2 py-0.5 text-[11px] font-semibold text-[#1F3D2E]">
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[#665849]">
                        {appt.chiefComplaints || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-6 text-center text-[#91897C] italic">
                No consultation visits on record for this patient.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Doctor Clinical Review Modal */}
      {selectedProgressForReview && (
        <DoctorProgressReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => {
            setIsReviewModalOpen(false);
            setSelectedProgressForReview(null);
          }}
          assessment={selectedProgressForReview}
          patientName={patientName}
          onReviewSuccess={() => {
            if (onProgressUpdated) {
              onProgressUpdated();
            }
          }}
        />
      )}
    </div>
  );
};

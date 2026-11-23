
import { useEffect, useState, useCallback } from "react";
import {
  FileText,
  HeartPulse,
  Sparkles,
  CalendarDays,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { getMyEMR } from "../../services/emr/emrService";
import type { PatientEMRSummaryResponse } from "../../types/emr";
import { PatientOverviewBanner } from "../../components/emr/PatientOverviewBanner";
import { MedicalHistorySection } from "../../components/emr/MedicalHistorySection";
import { AyurvedicAssessmentSection } from "../../components/emr/AyurvedicAssessmentSection";
import { ClinicalNotesTimeline } from "../../components/emr/ClinicalNotesTimeline";
import { ConnectedTherapyHistorySection } from "../../components/emr/ConnectedTherapyHistorySection";

export default function PatientMedicalRecordPage() {
  const [summary, setSummary] = useState<PatientEMRSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [activeTab, setActiveTab] = useState<
    "summary" | "notes" | "history" | "ayurveda" | "therapies"
  >("summary");

  const loadRecord = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getMyEMR();
      setSummary(data);
    } catch (err: any) {
      console.error("Failed to load personal medical record:", err);
      setError(
        err?.response?.data?.message || err?.message || "Unable to load medical records."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  if (loading) {
    return (
      <div className="min-h-full bg-[#F8F6F0] p-6 lg:p-8">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#D8D2C3] border-t-[#1F3D2E]" />
            <p className="mt-4 text-sm font-medium text-[#665849]">
              Loading your electronic health record...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary || !summary.patient) {
    return (
      <div className="min-h-full bg-[#F8F6F0] p-6 lg:p-8">
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-12 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[#173F32]">Medical Record Unavailable</h2>
          <p className="mt-2 text-xs text-[#665849]">
            {error || "Could not retrieve medical record."}
          </p>
          <button
            onClick={loadRecord}
            className="mt-4 rounded-xl bg-[#1F3D2E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#315A46]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    patient,
    medicalRecord,
    consultationNotes,
    therapyPlans,
    therapySessions,
    dietPlans,
    progressRecords,
    appointments,
  } = summary;

  return (
    <div className="min-h-full space-y-6 bg-[#F8F6F0] p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F3D2E]">
            My Electronic Medical Record (EMR)
          </h1>
          <p className="text-xs text-[#7A806F]">
            Your medical history, consultations and Ayurvedic health records.
          </p>
        </div>

        <button
          type="button"
          onClick={loadRecord}
          aria-label="Refresh medical record"
          title="Refresh medical record"
          disabled={loading}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#718078] transition hover:bg-[#E9EFE4] hover:text-[#1F3D2E] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Patient Overview Banner */}
      <PatientOverviewBanner
        patient={patient}
        medicalRecord={medicalRecord}
        canEdit={false}
      />

      {/* Tab Navigation */}
      <div className="flex w-full flex-nowrap items-center gap-1 overflow-x-auto border-b border-[#D8D2C3] pt-2 scrollbar-thin">
        <button
          onClick={() => setActiveTab("summary")}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition ${
            activeTab === "summary"
              ? "border-[#1F3D2E] text-[#1F3D2E]"
              : "border-transparent text-[#766F63] hover:text-[#1F3D2E]"
          }`}
        >
          <ShieldCheck size={14} />
          Overview & Prescriptions
        </button>

        <button
          onClick={() => setActiveTab("notes")}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition ${
            activeTab === "notes"
              ? "border-[#1F3D2E] text-[#1F3D2E]"
              : "border-transparent text-[#766F63] hover:text-[#1F3D2E]"
          }`}
        >
          <FileText size={14} />
          Doctor Consultations ({consultationNotes?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition ${
            activeTab === "history"
              ? "border-[#1F3D2E] text-[#1F3D2E]"
              : "border-transparent text-[#766F63] hover:text-[#1F3D2E]"
          }`}
        >
          <HeartPulse size={14} />
          Medical History & Vitals
        </button>

        <button
          onClick={() => setActiveTab("ayurveda")}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition ${
            activeTab === "ayurveda"
              ? "border-[#1F3D2E] text-[#1F3D2E]"
              : "border-transparent text-[#766F63] hover:text-[#1F3D2E]"
          }`}
        >
          <Sparkles size={14} />
          Ayurvedic Constitution (Doshas)
        </button>

        <button
          onClick={() => setActiveTab("therapies")}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-medium transition ${
            activeTab === "therapies"
              ? "border-[#1F3D2E] text-[#1F3D2E]"
              : "border-transparent text-[#766F63] hover:text-[#1F3D2E]"
          }`}
        >
          <CalendarDays size={14} />
          Therapies & Visits
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "summary" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
            <h3 className="border-b border-[#ECEFE6] pb-3 text-sm font-bold text-[#173F32]">
              Active Doctor Prescriptions & Formulations
            </h3>

            {consultationNotes &&
            consultationNotes.some((n) => n.prescribedMedicines?.length > 0) ? (
              <div className="mt-4 space-y-4">
                {consultationNotes.map((note) => {
                  if (!note.prescribedMedicines || note.prescribedMedicines.length === 0) {
                    return null;
                  }

                  return (
                    <div
                      key={note.id}
                      className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-4 text-xs"
                    >
                      <div className="mb-3 flex items-center justify-between border-b border-[#ECEFE6] pb-2">
                        <span className="font-bold text-[#1F3D2E]">
                          Prescribed by {note.doctorName} on {note.consultationDate}
                        </span>
                        <span className="text-[#766F63]">
                          Diagnosis: {note.diagnosis}
                        </span>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                        {note.prescribedMedicines.map((med, mIdx) => (
                          <div
                            key={mIdx}
                            className="rounded-lg border border-[#ECEFE6] bg-white p-3"
                          >
                            <span className="block font-bold text-[#173F32]">
                              {med.medicineName}
                            </span>
                            <span className="block text-[11px] text-[#766F63]">
                              {med.formulation || "Formulation"} • {med.dosage}
                            </span>
                            <span className="mt-1 block text-[11px] font-medium text-[#315A46]">
                              Timing: {med.timing}
                            </span>
                            {med.instructions && (
                              <p className="mt-1 text-[11px] italic text-[#8B8476]">
                                {med.instructions}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-4 text-xs italic text-[#91897C]">
                No active prescriptions on record.
              </p>
            )}
          </div>

          <ConnectedTherapyHistorySection
            therapyPlans={therapyPlans || []}
            therapySessions={therapySessions || []}
            dietPlans={dietPlans || []}
            progressRecords={progressRecords || []}
            appointments={appointments || []}
          />
        </div>
      )}

      {activeTab === "notes" && (
        <ClinicalNotesTimeline
          notes={consultationNotes || []}
          currentUserId={patient.userId}
          userRole="PATIENT"
        />
      )}

      {activeTab === "history" && (
        <MedicalHistorySection medicalRecord={medicalRecord} canEdit={false} />
      )}

      {activeTab === "ayurveda" && (
        <AyurvedicAssessmentSection
          medicalRecord={medicalRecord}
          patientId={patient.id}
          canAssess={false}
        />
      )}

      {activeTab === "therapies" && (
        <ConnectedTherapyHistorySection
          therapyPlans={therapyPlans || []}
          therapySessions={therapySessions || []}
          dietPlans={dietPlans || []}
          progressRecords={progressRecords || []}
          appointments={appointments || []}
        />
      )}
    </div>
  );
}

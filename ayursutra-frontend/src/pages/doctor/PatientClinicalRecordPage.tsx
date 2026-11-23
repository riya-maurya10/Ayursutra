import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  HeartPulse,
  Sparkles,
  CalendarDays,
  Plus,
  Compass,
} from "lucide-react";
import BodyMapSelector from "../../components/common/BodyMapSelector";

import { useAuth } from "../../context/AuthContext";
import {
  getPatientEMR,
  upsertMedicalRecord,
  createClinicalNote,
  updateClinicalNote,
  addTherapyObservation,
  assessDoshaForPatient,
} from "../../services/emr/emrService";
import type {
  PatientEMRSummaryResponse,
  DoctorClinicalNote,
  UpsertMedicalRecordRequest,
  CreateClinicalNoteRequest,
  UpdateClinicalNoteRequest,
  AddTherapyObservationRequest,
} from "../../types/emr";

import { PatientOverviewBanner } from "../../components/emr/PatientOverviewBanner";
import { MedicalHistorySection } from "../../components/emr/MedicalHistorySection";
import { AyurvedicAssessmentSection } from "../../components/emr/AyurvedicAssessmentSection";
import { ClinicalNotesTimeline } from "../../components/emr/ClinicalNotesTimeline";
import { ClinicalNoteModal } from "../../components/emr/ClinicalNoteModal";
import { TherapyObservationModal } from "../../components/emr/TherapyObservationModal";
import { ConnectedTherapyHistorySection } from "../../components/emr/ConnectedTherapyHistorySection";
import { EditVitalsAndHistoryModal } from "../../components/emr/EditVitalsAndHistoryModal";

export default function PatientClinicalRecordPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [summary, setSummary] = useState<PatientEMRSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Active top-level Tab
  const [activeTab, setActiveTab] = useState<
    "notes" | "history" | "ayurveda" | "therapies" | "body-marma"
  >("notes");

  // Staged Body & Marma selections for targeted therapy planning
  const [stagedRegions, setStagedRegions] = useState<string[]>([]);
  const [stagedMarmas, setStagedMarmas] = useState<string[]>([]);
  const [stagedTherapies, setStagedTherapies] = useState<any[]>([]);

  // Modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<DoctorClinicalNote | null>(null);
  const [isObservationModalOpen, setIsObservationModalOpen] = useState(false);
  const [observingNote, setObservingNote] = useState<DoctorClinicalNote | null>(null);
  const [isEditHistoryOpen, setIsEditHistoryOpen] = useState(false);

  // Reliable navigation to Patients List (never loops back to clinical record)
  const patientsListRoute = user?.role === "ADMIN" ? "/admin/patients" : "/doctor/patients";

  const loadEMR = useCallback(async (patientId: string) => {
    try {
      setLoading(true);
      setError("");
      const data = await getPatientEMR(patientId);
      setSummary(data);
    } catch (err: any) {
      console.error("Failed to load patient EMR:", err);
      setError(
        err?.response?.data?.message || err?.message || "Unable to load patient clinical record."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadEMR(id);
    }
  }, [id, loadEMR]);

  // Handlers
  const handleSaveMedicalRecord = async (data: UpsertMedicalRecordRequest) => {
    if (!id) return;
    await upsertMedicalRecord(id, data);
    await loadEMR(id);
  };

  const handleSaveNote = async (
    data: CreateClinicalNoteRequest | UpdateClinicalNoteRequest,
    isEdit: boolean
  ) => {
    if (isEdit && editingNote) {
      await updateClinicalNote(editingNote.id, data as UpdateClinicalNoteRequest);
    } else {
      await createClinicalNote(data as CreateClinicalNoteRequest);
    }
    if (id) await loadEMR(id);
  };

  const handleSaveObservation = async (
    noteId: string,
    data: AddTherapyObservationRequest
  ) => {
    await addTherapyObservation(noteId, data);
    if (id) await loadEMR(id);
  };

  const handleAssessDosha = async (answers: Record<string, string>) => {
    if (!id) throw new Error("No patient ID");
    const result = await assessDoshaForPatient(id, answers);
    await loadEMR(id);
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-full bg-[#F8F6F0] p-6 lg:p-8">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#D8D2C3] border-t-[#1F3D2E]" />
            <p className="mt-4 text-sm font-medium text-[#665849]">
              Loading Patient Electronic Medical Record (EMR)...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !summary || !summary.patient) {
    return (
      <div className="min-h-full bg-[#F8F6F0] p-6 lg:p-8">
        <button
          type="button"
          onClick={() => navigate(patientsListRoute)}
          className="mb-6 flex items-center gap-1.5 text-xs font-semibold text-[#315A46] hover:text-[#1F3D2E]"
        >
          <ArrowLeft size={14} /> Back to Patients List
        </button>

        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-12 text-center shadow-sm">
          <h2 className="text-lg font-bold text-[#173F32]">Patient EMR Unavailable</h2>
          <p className="mt-2 text-xs text-[#665849]">{error || "Patient record could not be found."}</p>
          <button
            onClick={() => id && loadEMR(id)}
            className="mt-4 rounded-xl bg-[#1F3D2E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#315A46]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { patient, medicalRecord, consultationNotes, therapyPlans, therapySessions, dietPlans, progressRecords, appointments } =
    summary;

  const canEdit = summary.canEditMedicalRecord ?? (user?.role === "ADMIN" || user?.role === "DOCTOR");
  const canAddNote = summary.canAddClinicalNote ?? (user?.role === "ADMIN" || user?.role === "DOCTOR");

  return (
    <div className="min-h-full bg-[#F8F6F0] p-6 lg:p-8 space-y-6">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate(patientsListRoute)}
          className="flex items-center gap-1.5 text-xs font-semibold text-[#315A46] transition hover:text-[#1F3D2E]"
        >
          <ArrowLeft size={14} /> Back to Patients List
        </button>

        <div className="flex items-center gap-2">
          {canAddNote && (
            <button
              onClick={() => {
                setEditingNote(null);
                setIsNoteModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F3D2E] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#315A46]"
            >
              <Plus size={14} /> New Consultation Note
            </button>
          )}
        </div>
      </div>

      {/* Patient Overview Banner */}
      <PatientOverviewBanner
        patient={patient}
        medicalRecord={medicalRecord}
        onEditMedicalHistory={() => setIsEditHistoryOpen(true)}
        canEdit={canEdit}
      />

      {/* Main Tab Navigation - Redesigned 5-Column Responsive Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {/* Tab 1: Consultation Notes */}
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`group flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-xs font-semibold transition ${
            activeTab === "notes"
              ? "bg-[#EAF0E3] text-[#173F32] border border-[#BACBB0] shadow-sm font-bold"
              : "bg-[#FFFDF8] text-[#665849] border border-[#E5E0D5] hover:bg-[#F4F1EA] hover:text-[#173F32]"
          }`}
        >
          <FileText
            size={16}
            className={`shrink-0 transition ${
              activeTab === "notes" ? "text-[#1F3D2E]" : "text-[#8B8476] group-hover:text-[#1F3D2E]"
            }`}
          />
          <span className="leading-snug">
            Consultation Notes{" "}
            <span className="opacity-75 font-normal">({consultationNotes?.length || 0})</span>
          </span>
        </button>

        {/* Tab 2: Medical History & Vitals */}
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`group flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-xs font-semibold transition ${
            activeTab === "history"
              ? "bg-[#EAF0E3] text-[#173F32] border border-[#BACBB0] shadow-sm font-bold"
              : "bg-[#FFFDF8] text-[#665849] border border-[#E5E0D5] hover:bg-[#F4F1EA] hover:text-[#173F32]"
          }`}
        >
          <HeartPulse
            size={16}
            className={`shrink-0 transition ${
              activeTab === "history" ? "text-[#1F3D2E]" : "text-[#8B8476] group-hover:text-[#1F3D2E]"
            }`}
          />
          <span className="leading-snug">Medical History & Vitals</span>
        </button>

        {/* Tab 3: Ayurvedic Assessment */}
        <button
          type="button"
          onClick={() => setActiveTab("ayurveda")}
          className={`group flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-xs font-semibold transition ${
            activeTab === "ayurveda"
              ? "bg-[#EAF0E3] text-[#173F32] border border-[#BACBB0] shadow-sm font-bold"
              : "bg-[#FFFDF8] text-[#665849] border border-[#E5E0D5] hover:bg-[#F4F1EA] hover:text-[#173F32]"
          }`}
        >
          <Sparkles
            size={16}
            className={`shrink-0 transition ${
              activeTab === "ayurveda" ? "text-[#1F3D2E]" : "text-[#8B8476] group-hover:text-[#1F3D2E]"
            }`}
          />
          <span className="leading-snug">Ayurvedic Assessment</span>
        </button>

        {/* Tab 4: Connected Therapies & Visits */}
        <button
          type="button"
          onClick={() => setActiveTab("therapies")}
          className={`group flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-xs font-semibold transition ${
            activeTab === "therapies"
              ? "bg-[#EAF0E3] text-[#173F32] border border-[#BACBB0] shadow-sm font-bold"
              : "bg-[#FFFDF8] text-[#665849] border border-[#E5E0D5] hover:bg-[#F4F1EA] hover:text-[#173F32]"
          }`}
        >
          <CalendarDays
            size={16}
            className={`shrink-0 transition ${
              activeTab === "therapies" ? "text-[#1F3D2E]" : "text-[#8B8476] group-hover:text-[#1F3D2E]"
            }`}
          />
          <span className="leading-snug">Connected Therapies</span>
        </button>

        {/* Tab 5: Body & Marma Mapping */}
        <button
          type="button"
          onClick={() => setActiveTab("body-marma")}
          className={`group col-span-2 md:col-span-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-center text-xs font-semibold transition ${
            activeTab === "body-marma"
              ? "bg-[#EAF0E3] text-[#173F32] border border-[#BACBB0] shadow-sm font-bold"
              : "bg-[#FFFDF8] text-[#665849] border border-[#E5E0D5] hover:bg-[#F4F1EA] hover:text-[#173F32]"
          }`}
        >
          <Compass
            size={16}
            className={`shrink-0 transition ${
              activeTab === "body-marma" ? "text-[#1F3D2E]" : "text-[#8B8476] group-hover:text-[#1F3D2E]"
            }`}
          />
          <span className="leading-snug">Body & Marma Mapping</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "notes" && (
        <ClinicalNotesTimeline
          notes={consultationNotes || []}
          currentUserName={user?.fullName}
          userRole={user?.role}
          onEditNote={(note) => {
            setEditingNote(note);
            setIsNoteModalOpen(true);
          }}
          onAddObservation={(note) => {
            setObservingNote(note);
            setIsObservationModalOpen(true);
          }}
        />
      )}

      {activeTab === "history" && (
        <MedicalHistorySection
          medicalRecord={medicalRecord}
          onSaveMedicalRecord={handleSaveMedicalRecord}
          canEdit={canEdit}
          onOpenEdit={() => setIsEditHistoryOpen(true)}
        />
      )}

      {activeTab === "ayurveda" && (
        <AyurvedicAssessmentSection
          medicalRecord={medicalRecord}
          patientId={patient.id}
          onAssessDosha={handleAssessDosha}
          canAssess={canEdit}
        />
      )}

      {activeTab === "therapies" && (
        <ConnectedTherapyHistorySection
          therapyPlans={therapyPlans || []}
          therapySessions={therapySessions || []}
          dietPlans={dietPlans || []}
          progressRecords={progressRecords || []}
          appointments={appointments || []}
          patientName={summary?.patient?.fullName}
          patientId={patient?.id}
          onProgressUpdated={() => {
            if (id) loadEMR(id);
          }}
          canDoctorReview={canEdit}
        />
      )}

      {activeTab === "body-marma" && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6B7F4E]">
                  Ayurvedic Anatomy & Sushruta Marma System
                </p>
                <h3 className="mt-1 text-lg font-bold text-[#173F32]">
                  Targeted Body Region & Marma Therapy Selector
                </h3>
                <p className="mt-1 text-xs text-[#665849]">
                  Select target anatomical regions and energy points to prescribe classical Panchakarma therapies tailored for {patient.fullName}.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/doctor/patients/${patient.id}/therapy-plan`, {
                      state: {
                        planName: `Targeted Plan - ${patient.fullName}`,
                        diagnosis: medicalRecord?.clinicalObservations || "Musculoskeletal & Dosha balancing",
                        preselectedRegions: stagedRegions,
                        preselectedMarmas: stagedMarmas,
                        preselectedTherapies: stagedTherapies,
                      },
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F3D2E] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#315A46]"
                >
                  <Plus size={14} />
                  Create Plan with Selections {stagedTherapies.length > 0 ? `(${stagedTherapies.length} staged)` : ""} →
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Body & Marma Selector */}
          <BodyMapSelector
            initialSelectedRegions={stagedRegions}
            initialSelectedMarmas={stagedMarmas}
            onConfirmSelection={({ selectedRegions, selectedMarmas, confirmedTherapies }) => {
              setStagedRegions(selectedRegions);
              setStagedMarmas(selectedMarmas);
              setStagedTherapies(confirmedTherapies);
            }}
          />

          {/* Existing Therapy Plans Quick Links */}
          {therapyPlans && therapyPlans.length > 0 && (
            <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
              <h4 className="text-sm font-bold text-[#173F32]">
                Existing Therapy Plans for {patient.fullName}
              </h4>
              <p className="text-xs text-[#766F63] mt-1">
                You can also view or update existing therapy plans with body and marma mappings:
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {therapyPlans.map((plan: any) => (
                  <div
                    key={plan.id}
                    className="flex flex-col justify-between rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-4"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#173F32] text-xs">{plan.planName}</span>
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                          {plan.status || "ACTIVE"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#665849] line-clamp-1">
                        {plan.diagnosis || "Ayurvedic Treatment Plan"}
                      </p>

                      {/* Targeted tags */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {plan.targetedBodyRegions?.map((r: string, idx: number) => (
                          <span
                            key={idx}
                            className="rounded bg-[#EEF2E8] px-1.5 py-0.5 text-[10px] font-medium text-[#2D5A3F]"
                          >
                            {r.replace(/_/g, " ")}
                          </span>
                        ))}
                        {plan.targetedMarmaPoints?.map((m: string, idx: number) => (
                          <span
                            key={idx}
                            className="rounded bg-[#FFF8EB] px-1.5 py-0.5 text-[10px] font-medium text-[#8C4E00]"
                          >
                            {m.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[#ECEFE6] flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/doctor/patients/${patient.id}/therapy-plan?editPlanId=${plan.id}`
                          )
                        }
                        className="text-xs font-semibold text-[#1F3D2E] hover:underline"
                      >
                        Edit Plan & Body Mapping →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Vitals & Medical History Modal */}
      <EditVitalsAndHistoryModal
        isOpen={isEditHistoryOpen}
        onClose={() => setIsEditHistoryOpen(false)}
        medicalRecord={medicalRecord}
        onSave={handleSaveMedicalRecord}
        patientName={patient.fullName}
      />

      {/* Clinical Note Modal (Create / Edit) */}
      <ClinicalNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setEditingNote(null);
        }}
        patientId={patient.id}
        initialNote={editingNote}
        onSave={handleSaveNote}
      />

      {/* Therapy Observation Modal */}
      <TherapyObservationModal
        isOpen={isObservationModalOpen}
        onClose={() => {
          setIsObservationModalOpen(false);
          setObservingNote(null);
        }}
        note={observingNote}
        onSave={handleSaveObservation}
      />
    </div>
  );
}

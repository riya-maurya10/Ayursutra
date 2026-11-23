import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Stethoscope,
  Pill,
  Sparkles,
  Lock,
} from "lucide-react";
import type {
  DoctorClinicalNote,
  CreateClinicalNoteRequest,
  UpdateClinicalNoteRequest,
  PrescribedMedicineItem,
} from "../../types/emr";

interface ClinicalNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  initialNote?: DoctorClinicalNote | null;
  onSave: (data: CreateClinicalNoteRequest | UpdateClinicalNoteRequest, isEdit: boolean) => Promise<void>;
}

export const ClinicalNoteModal: React.FC<ClinicalNoteModalProps> = ({
  isOpen,
  onClose,
  patientId,
  initialNote,
  onSave,
}) => {
  const isEdit = Boolean(initialNote);

  const [diagnosis, setDiagnosis] = useState("");
  const [visitType, setVisitType] = useState("INITIAL_CONSULTATION");
  const [chiefComplaints, setChiefComplaints] = useState("");
  const [symptomsInput, setSymptomsInput] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [clinicalObservations, setClinicalObservations] = useState("");

  // Ayurvedic Pariksha
  const [nadiPariksha, setNadiPariksha] = useState("");
  const [jihvaPariksha, setJihvaPariksha] = useState("");
  const [netraPariksha, setNetraPariksha] = useState("");
  const [agniObservation, setAgniObservation] = useState("");
  const [amaObservation, setAmaObservation] = useState("");

  // Treatment & Prescriptions
  const [treatmentRecommendations, setTreatmentRecommendations] = useState("");
  const [prescribedMedicines, setPrescribedMedicines] = useState<PrescribedMedicineItem[]>([]);
  const [dietaryAdvice, setDietaryAdvice] = useState("");
  const [lifestyleInstructions, setLifestyleInstructions] = useState("");

  // Follow-up
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpInstructions, setFollowUpInstructions] = useState("");
  const [isConfidential, setIsConfidential] = useState(false);
  const [editReason, setEditReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialNote) {
      setDiagnosis(initialNote.diagnosis || "");
      setVisitType(initialNote.visitType || "FOLLOW_UP");
      setChiefComplaints(initialNote.chiefComplaints || "");
      setSymptoms(initialNote.symptoms || []);
      setClinicalObservations(initialNote.clinicalObservations || "");
      setNadiPariksha(initialNote.nadiPariksha || "");
      setJihvaPariksha(initialNote.jihvaPariksha || "");
      setNetraPariksha(initialNote.netraPariksha || "");
      setAgniObservation(initialNote.agniObservation || "");
      setAmaObservation(initialNote.amaObservation || "");
      setTreatmentRecommendations(initialNote.treatmentRecommendations || "");
      setPrescribedMedicines(initialNote.prescribedMedicines || []);
      setDietaryAdvice(initialNote.dietaryAdvice || "");
      setLifestyleInstructions(initialNote.lifestyleInstructions || "");
      setFollowUpDate(initialNote.followUpDate || "");
      setFollowUpInstructions(initialNote.followUpInstructions || "");
      setIsConfidential(initialNote.isConfidential || false);
      setEditReason("");
    } else {
      setDiagnosis("");
      setVisitType("INITIAL_CONSULTATION");
      setChiefComplaints("");
      setSymptoms([]);
      setClinicalObservations("");
      setNadiPariksha("");
      setJihvaPariksha("");
      setNetraPariksha("");
      setAgniObservation("");
      setAmaObservation("");
      setTreatmentRecommendations("");
      setPrescribedMedicines([]);
      setDietaryAdvice("");
      setLifestyleInstructions("");
      setFollowUpDate("");
      setFollowUpInstructions("");
      setIsConfidential(false);
      setEditReason("");
    }
  }, [initialNote, isOpen]);

  if (!isOpen) return null;

  const handleAddSymptom = () => {
    const trimmed = symptomsInput.trim();
    if (!trimmed) return;
    if (!symptoms.includes(trimmed)) {
      setSymptoms([...symptoms, trimmed]);
    }
    setSymptomsInput("");
  };

  const handleRemoveSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const handleAddMedicine = () => {
    setPrescribedMedicines([
      ...prescribedMedicines,
      {
        medicineName: "",
        formulation: "Kashayam",
        dosage: "",
        timing: "Twice daily after food",
        durationDays: 14,
        instructions: "",
      },
    ]);
  };

  const handleUpdateMedicine = (
    index: number,
    field: keyof PrescribedMedicineItem,
    val: any
  ) => {
    const updated = [...prescribedMedicines];
    updated[index] = { ...updated[index], [field]: val };
    setPrescribedMedicines(updated);
  };

  const handleRemoveMedicine = (index: number) => {
    setPrescribedMedicines(prescribedMedicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setErrorMsg("Diagnosis is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      if (isEdit) {
        const payload: UpdateClinicalNoteRequest = {
          diagnosis,
          chiefComplaints,
          symptoms,
          clinicalObservations,
          nadiPariksha,
          jihvaPariksha,
          netraPariksha,
          agniObservation,
          amaObservation,
          treatmentRecommendations,
          prescribedMedicines,
          dietaryAdvice,
          lifestyleInstructions,
          followUpDate: followUpDate || undefined,
          followUpInstructions,
          isConfidential,
          editReason: editReason || "Clinical details updated",
        };
        await onSave(payload, true);
      } else {
        const payload: CreateClinicalNoteRequest = {
          patientId,
          diagnosis,
          visitType,
          chiefComplaints,
          symptoms,
          clinicalObservations,
          nadiPariksha,
          jihvaPariksha,
          netraPariksha,
          agniObservation,
          amaObservation,
          treatmentRecommendations,
          prescribedMedicines,
          dietaryAdvice,
          lifestyleInstructions,
          followUpDate: followUpDate || undefined,
          followUpInstructions,
          isConfidential,
        };
        await onSave(payload, false);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to save clinical note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative my-8 w-full max-w-4xl rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#ECEFE6] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F3D2E] text-white">
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#173F32]">
                {isEdit ? "Edit Clinical Consultation Note" : "New Consultation & Clinical Note"}
              </h3>
              <p className="text-xs text-[#766F63]">
                Record symptoms, Ayurvedic diagnosis, prescriptions and follow-up plan.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#766F63] hover:bg-[#F8F6F0]"
          >
            <X size={18} />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6 text-xs">
          {/* Section 1: Visit Type & Diagnosis */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block font-bold text-[#1F3D2E] mb-1">
                Visit / Consultation Type
              </label>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs font-medium"
              >
                <option value="INITIAL_CONSULTATION">Initial Consultation</option>
                <option value="FOLLOW_UP">Follow-up Consultation</option>
                <option value="PANCHAKARMA_ASSESSMENT">Panchakarma Assessment</option>
                <option value="ROUTINE_CHECKUP">Routine Wellness Checkup</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-[#1F3D2E] mb-1">
                Clinical Diagnosis (Nidana) *
              </label>
              <input
                type="text"
                placeholder="e.g. Griva Sandhigata Vata (Cervical Spondylosis)"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs font-semibold text-[#173F32] focus:outline-[#1F3D2E]"
              />
            </div>
          </div>

          {/* Section 2: Chief Complaints & Symptoms */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-[#1F3D2E] mb-1">
                Chief Complaints & Duration
              </label>
              <textarea
                rows={3}
                placeholder="Patient's primary complaints in their own words..."
                value={chiefComplaints}
                onChange={(e) => setChiefComplaints(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs focus:outline-[#1F3D2E]"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1F3D2E] mb-1">
                Reported Symptoms (Lakshanas)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type symptom and press enter..."
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSymptom();
                    }
                  }}
                  className="flex-1 rounded-xl border border-[#D8D2C3] bg-white p-2 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddSymptom}
                  className="rounded-xl bg-[#1F3D2E] px-3 py-2 text-xs font-semibold text-white hover:bg-[#315A46]"
                >
                  Add
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                {symptoms.map((s, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-md bg-[#EEF2E8] px-2 py-0.5 text-xs font-medium text-[#315A46] border border-[#D5DCCB]"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(idx)}
                      className="text-[#315A46] hover:text-rose-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Ayurvedic Ashtavidha Pariksha (Pulse, Tongue, Agni, Ama) */}
          <div className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-4">
            <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-[#1F3D2E] uppercase tracking-wider">
              <Sparkles size={14} />
              Ayurvedic Pariksha (Clinical Examination)
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-[#766F63] mb-1 font-semibold">Nadi (Pulse)</label>
                <input
                  type="text"
                  placeholder="e.g. Sarpa-Manduka Gati (V-P)"
                  value={nadiPariksha}
                  onChange={(e) => setNadiPariksha(e.target.value)}
                  className="w-full rounded-lg border border-[#D8D2C3] bg-white p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[#766F63] mb-1 font-semibold">Jihva (Tongue)</label>
                <input
                  type="text"
                  placeholder="e.g. White coating at root"
                  value={jihvaPariksha}
                  onChange={(e) => setJihvaPariksha(e.target.value)}
                  className="w-full rounded-lg border border-[#D8D2C3] bg-white p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[#766F63] mb-1 font-semibold">Agni</label>
                <input
                  type="text"
                  placeholder="e.g. Vishama Agni"
                  value={agniObservation}
                  onChange={(e) => setAgniObservation(e.target.value)}
                  className="w-full rounded-lg border border-[#D8D2C3] bg-white p-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[#766F63] mb-1 font-semibold">Ama Status</label>
                <input
                  type="text"
                  placeholder="e.g. Alpa Ama"
                  value={amaObservation}
                  onChange={(e) => setAmaObservation(e.target.value)}
                  className="w-full rounded-lg border border-[#D8D2C3] bg-white p-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Prescribed Medicines Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="font-bold text-[#1F3D2E] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Pill size={14} /> Prescribed Ayurvedic Medicines & Formulations
              </label>
              <button
                type="button"
                onClick={handleAddMedicine}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#315A46] hover:underline"
              >
                <Plus size={14} /> Add Medicine
              </button>
            </div>

            <div className="space-y-2">
              {prescribedMedicines.map((med, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-6 gap-2 rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-2.5"
                >
                  <input
                    type="text"
                    placeholder="Medicine Name (e.g. Maharasnadi)"
                    value={med.medicineName}
                    onChange={(e) => handleUpdateMedicine(idx, "medicineName", e.target.value)}
                    className="sm:col-span-2 rounded-lg border border-[#D8D2C3] bg-white p-1.5 text-xs font-medium"
                  />
                  <input
                    type="text"
                    placeholder="Formulation (Kashayam, Vati...)"
                    value={med.formulation || ""}
                    onChange={(e) => handleUpdateMedicine(idx, "formulation", e.target.value)}
                    className="rounded-lg border border-[#D8D2C3] bg-white p-1.5 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Dosage (e.g. 15 ml)"
                    value={med.dosage}
                    onChange={(e) => handleUpdateMedicine(idx, "dosage", e.target.value)}
                    className="rounded-lg border border-[#D8D2C3] bg-white p-1.5 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Timing"
                    value={med.timing}
                    onChange={(e) => handleUpdateMedicine(idx, "timing", e.target.value)}
                    className="rounded-lg border border-[#D8D2C3] bg-white p-1.5 text-xs"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      placeholder="Days"
                      value={med.durationDays || ""}
                      onChange={(e) =>
                        handleUpdateMedicine(idx, "durationDays", e.target.value ? Number(e.target.value) : undefined)
                      }
                      className="w-16 rounded-lg border border-[#D8D2C3] bg-white p-1.5 text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveMedicine(idx)}
                      className="p-1.5 text-rose-600 hover:text-rose-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {prescribedMedicines.length === 0 && (
                <p className="text-xs text-[#91897C] italic py-2">
                  No medicines prescribed yet. Click "+ Add Medicine" to prescribe herbal formulations.
                </p>
              )}
            </div>
          </div>

          {/* Section 5: Treatment Recommendations & Dietary Guidelines */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-bold text-[#1F3D2E] mb-1">
                Treatment Plan & Recommended Therapies
              </label>
              <textarea
                rows={3}
                placeholder="Recommended therapies (e.g. Griva Basti, Abhyanga, Nadi Sweda)..."
                value={treatmentRecommendations}
                onChange={(e) => setTreatmentRecommendations(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1F3D2E] mb-1">
                Dietary & Lifestyle Advice (Pathya-Apathya)
              </label>
              <textarea
                rows={3}
                placeholder="Foods to favor/avoid, ergonomic guidelines, sleep adjustments..."
                value={dietaryAdvice}
                onChange={(e) => setDietaryAdvice(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs"
              />
            </div>
          </div>

          {/* Section 6: Follow-up & Confidentiality */}
          <div className="grid gap-4 sm:grid-cols-3 items-end">
            <div>
              <label className="block font-bold text-[#1F3D2E] mb-1">Next Follow-up Date</label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[#1F3D2E] mb-1">Follow-up Instructions</label>
              <input
                type="text"
                placeholder="e.g. Review after 14 days of Kashayam"
                value={followUpInstructions}
                onChange={(e) => setFollowUpInstructions(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2 text-xs"
              />
            </div>

            <div className="flex items-center gap-2 p-2">
              <input
                type="checkbox"
                id="confidential"
                checked={isConfidential}
                onChange={(e) => setIsConfidential(e.target.checked)}
                className="h-4 w-4 rounded border-[#D8D2C3] text-[#1F3D2E] focus:ring-[#1F3D2E]"
              />
              <label htmlFor="confidential" className="text-xs font-semibold text-[#1F3D2E] flex items-center gap-1 cursor-pointer">
                <Lock size={12} /> Confidential Note (Doctors/Admin only)
              </label>
            </div>
          </div>

          {isEdit && (
            <div>
              <label className="block font-bold text-[#1F3D2E] mb-1">
                Reason for Edit (Audit Log)
              </label>
              <input
                type="text"
                placeholder="Reason for modifying this clinical note..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2 text-xs"
              />
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECEFE6]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D8D2C3] bg-white px-4 py-2 text-xs font-semibold text-[#766F63] hover:bg-[#F8F6F0]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#1F3D2E] px-5 py-2 text-xs font-semibold text-white hover:bg-[#315A46] disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : isEdit ? "Update Clinical Note" : "Save Clinical Note"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

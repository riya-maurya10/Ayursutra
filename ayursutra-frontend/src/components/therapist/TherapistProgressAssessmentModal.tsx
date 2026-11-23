import React, { useEffect, useState } from "react";
import {
  X,
  Activity,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";
import {
  createProgressAssessment,
  updateProgressAssessment,
  type PatientProgressRequest,
  type PatientProgressResponse,
} from "../../services/patientProgress/patientProgressService";
import type { TherapySession, PatientResponse } from "../../services/therapist/therapistService";

interface TherapistProgressAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: TherapySession;
  patient: PatientResponse;
  existingAssessment?: PatientProgressResponse | null;
  onSaveSuccess: (saved: PatientProgressResponse) => void;
}

const RESPONSE_OPTIONS = [
  { value: "Well Tolerated - Relaxed & Responsive", label: "Well Tolerated (Relaxed & Responsive)" },
  { value: "Satisfactory - Expected Treatment Response", label: "Satisfactory (Expected Response)" },
  { value: "Mild Discomfort Reported", label: "Mild Discomfort Reported" },
  { value: "Moderate Discomfort / Needs Doctor Review", label: "Moderate Discomfort (Needs Doctor Review)" },
  { value: "Adverse Reaction / Immediate Review Needed", label: "Adverse Reaction (Immediate Review Needed)" },
];

export const TherapistProgressAssessmentModal: React.FC<
  TherapistProgressAssessmentModalProps
> = ({
  isOpen,
  onClose,
  session,
  patient,
  existingAssessment,
  onSaveSuccess,
}) => {
  const [assessmentDate, setAssessmentDate] = useState("");
  const [dayNumber, setDayNumber] = useState<number>(1);
  const [symptoms, setSymptoms] = useState("");
  const [observations, setObservations] = useState("");
  const [therapyResponse, setTherapyResponse] = useState(RESPONSE_OPTIONS[0].value);
  const [discomfortSideEffects, setDiscomfortSideEffects] = useState("");
  const [notesForDoctor, setNotesForDoctor] = useState("");
  const [practitionerNotes, setPractitionerNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (existingAssessment) {
      setAssessmentDate(existingAssessment.assessmentDate || session.sessionDate || "");
      setDayNumber(existingAssessment.dayNumber || session.dayNumber || 1);
      setSymptoms(existingAssessment.symptoms || "");
      setObservations(existingAssessment.observations || "");
      setTherapyResponse(existingAssessment.therapyResponse || RESPONSE_OPTIONS[0].value);
      setDiscomfortSideEffects(existingAssessment.discomfortSideEffects || "");
      setNotesForDoctor(existingAssessment.notesForDoctor || "");
      setPractitionerNotes(existingAssessment.practitionerNotes || "");
    } else {
      const today = new Date().toISOString().split("T")[0];
      setAssessmentDate(session.sessionDate || today);
      setDayNumber(session.dayNumber || 1);
      setSymptoms("");
      setObservations("");
      setTherapyResponse(RESPONSE_OPTIONS[0].value);
      setDiscomfortSideEffects("");
      setNotesForDoctor("");
      setPractitionerNotes("");
    }
    setError("");
    setSuccessMessage("");
  }, [isOpen, session, existingAssessment]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (session.status !== "COMPLETED") {
      setError("Progress assessments can only be submitted for completed therapy sessions.");
      return;
    }

    if (!assessmentDate) {
      setError("Please select an assessment date.");
      return;
    }

    if (!observations.trim()) {
      setError("Please provide therapist clinical observations.");
      return;
    }

    try {
      setSubmitting(true);
      const payload: PatientProgressRequest = {
        patientId: session.patientId || patient.id,
        therapyPlanId: session.therapyPlanId,
        therapySessionId: session.id,
        therapyName: session.therapyName,
        assessmentDate,
        dayNumber: Number(dayNumber) || 1,
        symptoms: symptoms.trim() || undefined,
        observations: observations.trim(),
        therapyResponse,
        discomfortSideEffects: discomfortSideEffects.trim() || undefined,
        notesForDoctor: notesForDoctor.trim() || undefined,
        practitionerNotes: practitionerNotes.trim() || undefined,
      };

      let result: PatientProgressResponse;
      if (existingAssessment?.id) {
        result = await updateProgressAssessment(existingAssessment.id, payload);
        setSuccessMessage("Assessment updated successfully!");
      } else {
        result = await createProgressAssessment(payload);
        setSuccessMessage("Daily progress assessment saved successfully!");
      }

      setTimeout(() => {
        onSaveSuccess(result);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Failed to save progress assessment:", err);
      let msg = "Failed to save assessment. Please try again.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.response?.data?.error) {
        msg = err.response.data.error;
      } else if (Array.isArray(err?.response?.data?.errors) && err.response.data.errors.length > 0) {
        msg = err.response.data.errors.join(", ");
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-[#FFFDF8] shadow-2xl border border-[#D8D2C3]">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#ECEFE6] bg-[#FFFDF8]/95 px-6 py-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1F3D2E] text-white shadow-sm">
              <Activity size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F3D2E]">
                {existingAssessment ? "Edit Daily Progress Assessment" : "Daily Progress Assessment"}
              </h3>
              <p className="text-xs text-[#71834F]">
                Session Day {session.dayNumber} • {session.therapyName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 hover:bg-[#F2ECE1] hover:text-[#1F3D2E] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Doctor Review Banner (if already reviewed) */}
        {existingAssessment?.reviewedByDoctorName && (
          <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl border border-[#3F684F]/30 bg-[#EEF3EA] p-3 text-xs text-[#1F3D2E]">
            <Stethoscope size={18} className="mt-0.5 text-[#3F684F] shrink-0" />
            <div>
              <div className="font-semibold text-[#2F6B46]">
                Reviewed by {existingAssessment.reviewedByDoctorName}
                {existingAssessment.reviewedAt && (
                  <span className="font-normal text-gray-500 ml-1">
                    on {new Date(existingAssessment.reviewedAt).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>
              {existingAssessment.improvementPercentage !== undefined &&
                existingAssessment.improvementPercentage !== null && (
                  <div className="font-medium text-[#1F3D2E] mt-0.5">
                    Improvement:{" "}
                    <span className="font-bold text-[#2F6B46]">
                      {existingAssessment.improvementPercentage}%
                    </span>
                  </div>
                )}
              {existingAssessment.clinicalAssessment && (
                <div className="text-gray-700 mt-1">
                  <span className="font-medium">Doctor's Clinical Assessment:</span>{" "}
                  {existingAssessment.clinicalAssessment}
                </div>
              )}
              {existingAssessment.treatmentAdjustments && (
                <div className="text-gray-700 mt-0.5">
                  <span className="font-medium">Adjustments:</span>{" "}
                  {existingAssessment.treatmentAdjustments}
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 p-3 text-xs text-green-700">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Patient and Session Summary Pill */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-[#F8F6F0] p-3 border border-[#ECEFE6]">
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Patient</span>
              <p className="font-semibold text-gray-800 truncate">{patient.fullName}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Therapy</span>
              <p className="font-semibold text-[#1F3D2E] truncate">{session.therapyName}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Session Date</span>
              <p className="font-semibold text-gray-800">{session.sessionDate}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Session Status</span>
              <p className="font-semibold text-emerald-700">Completed</p>
            </div>
          </div>

          {/* Assessment Date and Day Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Assessment Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={assessmentDate}
                  onChange={(e) => setAssessmentDate(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Therapy Day Number <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={dayNumber}
                onChange={(e) => setDayNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
              />
            </div>
          </div>

          {/* Symptoms Reported */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Symptoms Reported by Patient
            </label>
            <textarea
              rows={2}
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g., Morning stiffness, mild lower back pain reduced from yesterday, sleep was restful..."
              className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
            />
          </div>

          {/* Therapist Observations */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Therapist Clinical Observations <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Describe physical response, sweda (perspiration) quality, skin texture, joint flexibility, breathing pattern..."
              className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
            />
          </div>

          {/* Therapy Response Dropdown */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Therapy Response / Tolerance
            </label>
            <select
              value={therapyResponse}
              onChange={(e) => setTherapyResponse(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
            >
              {RESPONSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Discomfort / Side Effects */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Discomfort / Adverse Reactions / Side Effects (if any)
            </label>
            <textarea
              rows={2}
              value={discomfortSideEffects}
              onChange={(e) => setDiscomfortSideEffects(e.target.value)}
              placeholder="e.g., None reported / Mild heaviness in head / Slight skin erythema after steam..."
              className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
            />
          </div>

          {/* Notes for Doctor */}
          <div>
            <label className="block font-semibold text-[#1F3D2E] mb-1 flex items-center gap-1.5">
              <Stethoscope size={13} />
              Recommendations & Notes for Consulting Doctor
            </label>
            <textarea
              rows={2}
              value={notesForDoctor}
              onChange={(e) => setNotesForDoctor(e.target.value)}
              placeholder="Notes specifically for the doctor's clinical review (e.g., patient reported sensitive skin to kashaya; doctor may adjust temperature or duration)..."
              className="w-full rounded-xl border border-[#C5D1BD] bg-[#FAFDF7] px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
            />
          </div>

          {/* Practitioner Internal Notes */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Internal Practitioner Notes
            </label>
            <textarea
              rows={2}
              value={practitionerNotes}
              onChange={(e) => setPractitionerNotes(e.target.value)}
              placeholder="e.g., Session completed smoothly in 45 mins. Patient advised warm water intake."
              className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEFE6]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-[#D8D2C3] px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-[#F2ECE1] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-[#1F3D2E] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2A523D] transition disabled:opacity-50"
            >
              {submitting ? (
                <>Saving Assessment...</>
              ) : existingAssessment ? (
                "Update Assessment"
              ) : (
                "Submit Daily Assessment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

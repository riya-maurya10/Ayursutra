import React, { useEffect, useState } from "react";
import {
  X,
  Stethoscope,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import {
  doctorReviewProgress,
  type DoctorProgressReviewRequest,
  type PatientProgressResponse,
} from "../../services/patientProgress/patientProgressService";

interface DoctorProgressReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment: PatientProgressResponse | null;
  patientName?: string;
  onReviewSuccess: (updated: PatientProgressResponse) => void;
}

export const DoctorProgressReviewModal: React.FC<DoctorProgressReviewModalProps> = ({
  isOpen,
  onClose,
  assessment,
  patientName,
  onReviewSuccess,
}) => {
  const [improvementPercentage, setImprovementPercentage] = useState<number | string>("");
  const [clinicalAssessment, setClinicalAssessment] = useState("");
  const [treatmentAdjustments, setTreatmentAdjustments] = useState("");
  const [nextRecommendation, setNextRecommendation] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen || !assessment) return;

    setImprovementPercentage(
      assessment.improvementPercentage !== undefined && assessment.improvementPercentage !== null
        ? assessment.improvementPercentage
        : ""
    );
    setClinicalAssessment(assessment.clinicalAssessment || "");
    setTreatmentAdjustments(assessment.treatmentAdjustments || "");
    setNextRecommendation(assessment.nextRecommendation || "");
    setError("");
    setSuccessMessage("");
  }, [isOpen, assessment]);

  if (!isOpen || !assessment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    let impNum: number | undefined = undefined;
    if (improvementPercentage !== "" && improvementPercentage !== null) {
      impNum = Number(improvementPercentage);
      if (isNaN(impNum) || impNum < 0 || impNum > 100) {
        setError("Improvement percentage must be a number between 0 and 100.");
        return;
      }
    }

    try {
      setSubmitting(true);
      const payload: DoctorProgressReviewRequest = {
        improvementPercentage: impNum,
        clinicalAssessment: clinicalAssessment.trim() || undefined,
        treatmentAdjustments: treatmentAdjustments.trim() || undefined,
        nextRecommendation: nextRecommendation.trim() || undefined,
      };

      const updated = await doctorReviewProgress(assessment.id, payload);
      setSuccessMessage("Doctor clinical review recorded successfully!");

      setTimeout(() => {
        onReviewSuccess(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Failed to submit doctor review:", err);
      let msg = "Failed to submit clinical review. Please try again.";
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
              <Stethoscope size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1F3D2E]">
                Doctor Clinical Progress Review
              </h3>
              <p className="text-xs text-[#71834F]">
                {patientName ? `${patientName} • ` : ""}Day {assessment.dayNumber}
                {assessment.therapyName ? ` • ${assessment.therapyName}` : ""}
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

        {/* Therapist Assessment Summary Box */}
        <div className="p-6 pb-2">
          <div className="rounded-xl border border-[#D8D2C3] bg-[#F8F6F0] p-4 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#ECEFE6] pb-2">
              <span className="font-semibold text-[#1F3D2E]">
                Therapist Assessment Record
              </span>
              <span className="text-gray-500">
                Date: {assessment.assessmentDate}
                {assessment.assessedByTherapistName &&
                  ` | By: ${assessment.assessedByTherapistName}`}
              </span>
            </div>

            {assessment.symptoms && (
              <div>
                <span className="font-semibold text-gray-700">Reported Symptoms:</span>
                <p className="text-gray-800 mt-0.5">{assessment.symptoms}</p>
              </div>
            )}

            <div>
              <span className="font-semibold text-gray-700">Therapist Observations:</span>
              <p className="text-gray-800 mt-0.5 whitespace-pre-line">
                {assessment.observations || "None recorded"}
              </p>
            </div>

            {assessment.therapyResponse && (
              <div>
                <span className="font-semibold text-gray-700">Therapy Response:</span>
                <span className="ml-2 inline-block rounded-md bg-[#EEF3EA] px-2 py-0.5 font-medium text-[#2F6B46]">
                  {assessment.therapyResponse}
                </span>
              </div>
            )}

            {assessment.discomfortSideEffects && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-amber-900">
                <span className="font-semibold">Reported Discomfort / Side Effects:</span>
                <p className="mt-0.5">{assessment.discomfortSideEffects}</p>
              </div>
            )}

            {assessment.notesForDoctor && (
              <div className="rounded-lg bg-[#FAFDF7] border border-[#C5D1BD] p-2 text-[#1F3D2E]">
                <span className="font-semibold">Therapist Notes for Doctor:</span>
                <p className="mt-0.5">{assessment.notesForDoctor}</p>
              </div>
            )}
          </div>
        </div>

        {/* Doctor Review Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4 text-xs">
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

          {/* Improvement Percentage Slider / Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-gray-700 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[#3F684F]" />
                Estimated Patient Improvement (%)
              </label>
              <span className="font-bold text-[#1F3D2E]">
                {improvementPercentage !== "" ? `${improvementPercentage}%` : "Not evaluated"}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={improvementPercentage === "" ? 0 : improvementPercentage}
                onChange={(e) => setImprovementPercentage(Number(e.target.value))}
                className="w-full accent-[#1F3D2E]"
              />
              <input
                type="number"
                min="0"
                max="100"
                placeholder="%"
                value={improvementPercentage}
                onChange={(e) => {
                  const v = e.target.value;
                  setImprovementPercentage(v === "" ? "" : Number(v));
                }}
                className="w-20 rounded-xl border border-[#D8D2C3] bg-white px-2 py-1.5 text-center text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Leave blank if improvement percentage cannot be assessed on this day.
            </p>
          </div>

          {/* Doctor Clinical Assessment */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Doctor's Clinical Assessment & Dosha Balance Notes
            </label>
            <textarea
              rows={3}
              value={clinicalAssessment}
              onChange={(e) => setClinicalAssessment(e.target.value)}
              placeholder="e.g., Vata shamana progressing well. Swelling reduced significantly in peripheral joints. Patient exhibits favorable Agni response..."
              className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
            />
          </div>

          {/* Treatment Adjustments */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Treatment & Therapy Adjustments
            </label>
            <textarea
              rows={2}
              value={treatmentAdjustments}
              onChange={(e) => setTreatmentAdjustments(e.target.value)}
              placeholder="e.g., Increase duration of Abhyanga to 50 mins from Day 4. Switch to Ksheerabala taila if mild burning persists..."
              className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-gray-800 focus:border-[#1F3D2E] focus:outline-none focus:ring-1 focus:ring-[#1F3D2E]"
            />
          </div>

          {/* Next Recommendation */}
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Next Clinical Recommendation & Patient Advice
            </label>
            <textarea
              rows={2}
              value={nextRecommendation}
              onChange={(e) => setNextRecommendation(e.target.value)}
              placeholder="e.g., Continue light pathya ahara (khichdi, warm water). Avoid daytime naps. Follow-up consultation scheduled after Day 7."
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
                <>Saving Clinical Review...</>
              ) : (
                "Save Doctor Clinical Review"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

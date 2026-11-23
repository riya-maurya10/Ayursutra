import React, { useState } from "react";
import { X, Sparkles } from "lucide-react";
import type { AddTherapyObservationRequest, DoctorClinicalNote } from "../../types/emr";

interface TherapyObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: DoctorClinicalNote | null;
  onSave: (noteId: string, data: AddTherapyObservationRequest) => Promise<void>;
}

export const TherapyObservationModal: React.FC<TherapyObservationModalProps> = ({
  isOpen,
  onClose,
  note,
  onSave,
}) => {
  const [therapyName, setTherapyName] = useState("");
  const [observation, setObservation] = useState("");
  const [patientFeedback, setPatientFeedback] = useState("");
  const [vitalPulse, setVitalPulse] = useState<number | undefined>(undefined);
  const [vitalBloodPressure, setVitalBloodPressure] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !note) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observation.trim()) {
      setErrorMsg("Observation is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const payload: AddTherapyObservationRequest = {
        therapyName: therapyName || "Panchakarma Session",
        observation,
        patientFeedback,
        vitalPulse,
        vitalBloodPressure,
      };

      await onSave(note.id, payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || "Failed to record observation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ECEFE6] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#1F3D2E] text-white">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-[#173F32] text-sm">
                Add Therapy Session Observation
              </h3>
              <p className="text-xs text-[#766F63]">
                Attaches session observations to note with diagnosis: {note.diagnosis}
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1F3D2E] mb-1">
              Therapy / Procedure Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Abhyanga & Nadi Sweda, Shirodhara, Griva Basti"
              value={therapyName}
              onChange={(e) => setTherapyName(e.target.value)}
              required
              className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1F3D2E] mb-1">
              Clinical Session Observation *
            </label>
            <textarea
              rows={3}
              placeholder="Describe tolerance, skin reaction, oil absorption, stiffness changes, relaxation level..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              required
              className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs focus:outline-[#1F3D2E]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1F3D2E] mb-1">
              Patient Feedback / Subjective Response
            </label>
            <input
              type="text"
              placeholder="e.g. Felt immediate relief from shoulder tension, felt drowsy post-session"
              value={patientFeedback}
              onChange={(e) => setPatientFeedback(e.target.value)}
              className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#766F63] mb-1">
                Post-Session Pulse (bpm)
              </label>
              <input
                type="number"
                placeholder="72"
                value={vitalPulse || ""}
                onChange={(e) =>
                  setVitalPulse(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#766F63] mb-1">
                Post-Session BP
              </label>
              <input
                type="text"
                placeholder="120/80"
                value={vitalBloodPressure}
                onChange={(e) => setVitalBloodPressure(e.target.value)}
                className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2 text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEFE6]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#D8D2C3] bg-white px-4 py-2 text-xs font-semibold text-[#766F63]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#1F3D2E] px-5 py-2 text-xs font-semibold text-white hover:bg-[#315A46] disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Observation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

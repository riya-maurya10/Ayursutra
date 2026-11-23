import React, { useState } from "react";
import {
  Flame,
  Wind,
  Droplets,
  Activity,
  Sparkles,
  RefreshCw,
  X,
  CheckCircle2,
} from "lucide-react";
import type { PatientMedicalRecord, DoshaAssessmentResponse } from "../../types/emr";

interface AyurvedicAssessmentSectionProps {
  medicalRecord?: PatientMedicalRecord;
  patientId?: string;
  onAssessDosha?: (answers: Record<string, string>) => Promise<DoshaAssessmentResponse>;
  canAssess?: boolean;
}

export const AyurvedicAssessmentSection: React.FC<AyurvedicAssessmentSectionProps> = ({
  medicalRecord,
  patientId: _patientId,
  onAssessDosha,
  canAssess = false,
}) => {
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcSuccess, setCalcSuccess] = useState<string>("");

  // Dosha Questionnaire Answers (matches DoshaAssessmentService questions)
  const [answers, setAnswers] = useState<Record<string, string>>({
    bodyFrame: "LEAN",
    skinType: "DRY",
    digestion: "VARIABLE",
    sleepPattern: "LIGHT",
    stressResponse: "ANXIOUS",
  });

  const vata = medicalRecord?.vataPercentage ?? 33;
  const pitta = medicalRecord?.pittaPercentage ?? 33;
  const kapha = medicalRecord?.kaphaPercentage ?? 34;

  const handleRunAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAssessDosha) return;

    try {
      setIsCalculating(true);
      setCalcSuccess("");
      const res = await onAssessDosha(answers);
      setCalcSuccess(
        `Calculated Constitution: ${res.primaryDosha} (V: ${res.vataPercentage}%, P: ${res.pittaPercentage}%, K: ${res.kaphaPercentage}%)`
      );
      setTimeout(() => {
        setIsCalculatorOpen(false);
        setCalcSuccess("");
      }, 1800);
    } catch (err: any) {
      console.error("Assessment failed:", err);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Prakriti Breakdown & Vikriti */}
      <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#ECEFE6] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#1F3D2E]" />
              <h3 className="text-lg font-bold text-[#173F32]">
                Ayurvedic Prakriti & Dosha Constitution
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-[#766F63]">
              Baseline psychosomatic constitutional balance and current Vikriti vitiation.
            </p>
          </div>

          {canAssess && onAssessDosha && (
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F3D2E] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#315A46]"
            >
              <RefreshCw size={13} />
              Assess Prakriti (Dosha Calculator)
            </button>
          )}
        </div>

        {/* Dosha Progress Bars */}
        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          {/* Vata Card */}
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-sky-900 uppercase">
                <Wind size={15} className="text-sky-600" />
                Vata (Air & Ether)
              </span>
              <span className="text-sm font-extrabold text-sky-900">{vata}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-sky-200">
              <div
                className="h-full rounded-full bg-sky-600 transition-all duration-500"
                style={{ width: `${vata}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-sky-800/80">
              Governs movement, nervous system, breath, and circulation.
            </p>
          </div>

          {/* Pitta Card */}
          <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase">
                <Flame size={15} className="text-amber-600" />
                Pitta (Fire & Water)
              </span>
              <span className="text-sm font-extrabold text-amber-900">{pitta}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-amber-200">
              <div
                className="h-full rounded-full bg-amber-600 transition-all duration-500"
                style={{ width: `${pitta}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-amber-800/80">
              Governs digestion, metabolism, body temperature, and intellect.
            </p>
          </div>

          {/* Kapha Card */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 uppercase">
                <Droplets size={15} className="text-emerald-600" />
                Kapha (Earth & Water)
              </span>
              <span className="text-sm font-extrabold text-emerald-900">{kapha}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-emerald-200">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${kapha}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-emerald-800/80">
              Governs structure, lubrication, immunity, and stability.
            </p>
          </div>
        </div>

        {/* Primary Constitution Summary */}
        <div className="mt-5 rounded-xl bg-[#F8F6F0] p-4 border border-[#ECEFE6] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#766F63] tracking-wider block">
              Dominant Prakriti
            </span>
            <span className="text-base font-bold text-[#1F3D2E]">
              {medicalRecord?.prakritiDominant || "Assessment Pending"}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-[#766F63] tracking-wider block">
              Current Vikriti (Imbalance)
            </span>
            <span className="text-xs font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {medicalRecord?.vikritiImbalance || "Balanced (Sama Dosa)"}
            </span>
          </div>
        </div>
      </div>

      {/* Ayurvedic Clinical Examination Attributes: Agni, Ama, Koshtha, Dhatus, Malas */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Agni */}
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#173F32] uppercase tracking-wider border-b border-[#ECEFE6] pb-2">
            <Flame size={15} className="text-amber-600" />
            Agni (Digestive Fire)
          </div>
          <div className="mt-3">
            <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 border border-amber-200 inline-block">
              {medicalRecord?.agniType || "Vishama Agni"}
            </span>
            <p className="mt-2 text-xs text-[#665849] leading-relaxed">
              {medicalRecord?.agniType?.toLowerCase().includes("manda")
                ? "Slow, sluggish metabolism leading to Kapha accumulation."
                : medicalRecord?.agniType?.toLowerCase().includes("tikshna")
                ? "Hyperactive, intense digestion with acidity or Pitta heat."
                : medicalRecord?.agniType?.toLowerCase().includes("vishama")
                ? "Irregular hunger cycles with occasional bloating (Vata)."
                : "Balanced digestive and metabolic equilibrium (Sama Agni)."}
            </p>
          </div>
        </div>

        {/* Ama */}
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#173F32] uppercase tracking-wider border-b border-[#ECEFE6] pb-2">
            <Activity size={15} className="text-rose-600" />
            Ama (Metabolic Toxins)
          </div>
          <div className="mt-3">
            <span
              className={`rounded-lg px-2.5 py-1 text-xs font-bold border inline-block ${
                medicalRecord?.amaStatus?.toLowerCase().includes("sama")
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {medicalRecord?.amaStatus || "Nirama (No toxins)"}
            </span>
            <p className="mt-2 text-xs text-[#665849] leading-relaxed">
              {medicalRecord?.amaStatus?.toLowerCase().includes("sama")
                ? "Evidence of undigested endotoxins in gut or channels requiring Deepana-Pachana."
                : "Clear channels (Srotas) with optimal assimilation and absence of toxic residue."}
            </p>
          </div>
        </div>

        {/* Koshtha */}
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#173F32] uppercase tracking-wider border-b border-[#ECEFE6] pb-2">
            <Droplets size={15} className="text-[#315A46]" />
            Koshtha (Bowel Habit)
          </div>
          <div className="mt-3">
            <span className="rounded-lg bg-[#F8F6F0] px-2.5 py-1 text-xs font-bold text-[#1F3D2E] border border-[#ECEFE6] inline-block">
              {medicalRecord?.koshtha || "Madhyama Koshtha"}
            </span>
            <p className="mt-2 text-xs text-[#665849] leading-relaxed">
              Determines purgation therapy sensitivity (Mrudu, Madhyama, or Krura bowel).
            </p>
          </div>
        </div>

        {/* Dhatus Affected */}
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-5 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-[#173F32] uppercase tracking-wider border-b border-[#ECEFE6] pb-2">
            <Sparkles size={15} className="text-amber-600" />
            Dhatus Imbalanced
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {medicalRecord?.dhatuImbalances && medicalRecord.dhatuImbalances.length > 0 ? (
              medicalRecord.dhatuImbalances.map((d, i) => (
                <span
                  key={i}
                  className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 border border-amber-200"
                >
                  {d}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#91897C] italic">Dhatus in healthy equilibrium</span>
            )}
          </div>
        </div>
      </div>

      {/* Observational Details: Sleep, Digestion, Mala Observations */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
          <h4 className="font-bold text-[#173F32] text-sm border-b border-[#ECEFE6] pb-2">
            Sleep & Appetite Observations
          </h4>
          <div className="mt-4 space-y-3 text-xs">
            <div>
              <span className="font-semibold text-[#766F63] block">Sleep Quality (Nidra):</span>
              <p className="mt-0.5 text-[#4E463D] leading-relaxed">
                {medicalRecord?.sleepQuality || "Normal, uninterrupted 7-hour sleep cycle."}
              </p>
            </div>
            <div>
              <span className="font-semibold text-[#766F63] block">Appetite & Digestion:</span>
              <p className="mt-0.5 text-[#4E463D] leading-relaxed">
                {medicalRecord?.appetiteDigestion || "Regular appetite with smooth digestion."}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
          <h4 className="font-bold text-[#173F32] text-sm border-b border-[#ECEFE6] pb-2">
            Mala Observations (Waste Elimination)
          </h4>
          <div className="mt-4 text-xs text-[#4E463D] leading-relaxed">
            {medicalRecord?.malaObservations || (
              <p className="italic text-[#91897C]">
                Mutra (Urine), Purisha (Stool), and Sweda (Sweat) observations within normal physiological parameters.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* DOSHA CALCULATOR MODAL (REUSING EXISTING MODULE) */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ECEFE6] pb-3">
              <div>
                <h3 className="font-bold text-[#173F32] text-base">
                  Calculate Patient Prakriti & Dosha
                </h3>
                <p className="text-xs text-[#766F63]">
                  Reuses the AyurSutra Dosha Assessment engine to record official Prakriti.
                </p>
              </div>
              <button
                onClick={() => setIsCalculatorOpen(false)}
                className="rounded-lg p-1.5 text-[#766F63] hover:bg-[#F8F6F0]"
              >
                <X size={18} />
              </button>
            </div>

            {calcSuccess && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                {calcSuccess}
              </div>
            )}

            <form onSubmit={handleRunAssessment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1F3D2E] mb-1">
                  1. Body Frame & Bone Structure
                </label>
                <select
                  value={answers.bodyFrame}
                  onChange={(e) => setAnswers({ ...answers, bodyFrame: e.target.value })}
                  className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs"
                >
                  <option value="LEAN">Slender, thin bones, prominent joints (Vata)</option>
                  <option value="MEDIUM">Medium build, well-proportioned, moderate muscles (Pitta)</option>
                  <option value="HEAVY">Broad, sturdy, heavy bone structure, gains weight easily (Kapha)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1F3D2E] mb-1">
                  2. Skin Texture & Complexion
                </label>
                <select
                  value={answers.skinType}
                  onChange={(e) => setAnswers({ ...answers, skinType: e.target.value })}
                  className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs"
                >
                  <option value="DRY">Dry, rough, cool to touch, tends to chap (Vata)</option>
                  <option value="WARM">Warm, reddish/rosy, prone to moles or irritation (Pitta)</option>
                  <option value="OILY">Thick, oily, smooth, cool, fair and radiant (Kapha)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1F3D2E] mb-1">
                  3. Appetite & Digestion (Agni)
                </label>
                <select
                  value={answers.digestion}
                  onChange={(e) => setAnswers({ ...answers, digestion: e.target.value })}
                  className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs"
                >
                  <option value="VARIABLE">Irregular, sometimes hungry sometimes not, bloating (Vata)</option>
                  <option value="STRONG">Intense, sharp hunger, irritable if meal delayed (Pitta)</option>
                  <option value="SLOW">Slow, steady, can easily skip meals without discomfort (Kapha)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1F3D2E] mb-1">
                  4. Sleep Pattern (Nidra)
                </label>
                <select
                  value={answers.sleepPattern}
                  onChange={(e) => setAnswers({ ...answers, sleepPattern: e.target.value })}
                  className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs"
                >
                  <option value="LIGHT">Light, irregular, easily awakened, less than 6 hours (Vata)</option>
                  <option value="MODERATE">Moderate, 6-7 hours, vivid or passionate dreams (Pitta)</option>
                  <option value="DEEP">Heavy, deep, sound sleep 8+ hours, slow to wake (Kapha)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1F3D2E] mb-1">
                  5. Response to Stress & Mental Disposition
                </label>
                <select
                  value={answers.stressResponse}
                  onChange={(e) => setAnswers({ ...answers, stressResponse: e.target.value })}
                  className="w-full rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs"
                >
                  <option value="ANXIOUS">Anxiety, worry, quick mind, indecisiveness (Vata)</option>
                  <option value="IRRITABLE">Irritation, frustration, goal-driven, critical (Pitta)</option>
                  <option value="CALM">Calm, compassionate, slow to anger, resistant to change (Kapha)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#ECEFE6]">
                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(false)}
                  className="rounded-xl border border-[#D8D2C3] bg-white px-4 py-2 text-xs font-semibold text-[#766F63]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCalculating}
                  className="rounded-xl bg-[#1F3D2E] px-5 py-2 text-xs font-semibold text-white hover:bg-[#315A46] disabled:opacity-50"
                >
                  {isCalculating ? "Calculating..." : "Compute & Save to EMR"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

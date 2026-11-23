import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  HeartPulse,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Plus,
  Scale,
} from "lucide-react";
import type {
  PatientMedicalRecord,
  UpsertMedicalRecordRequest,
} from "../../types/emr";

interface EditVitalsAndHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicalRecord?: PatientMedicalRecord;
  onSave: (data: UpsertMedicalRecordRequest) => Promise<void>;
  patientName?: string;
}

export const EditVitalsAndHistoryModal: React.FC<EditVitalsAndHistoryModalProps> = ({
  isOpen,
  onClose,
  medicalRecord,
  onSave,
  patientName,
}) => {
  // Form state
  const [bloodGroup, setBloodGroup] = useState<string>("");
  const [heightCm, setHeightCm] = useState<string>("");
  const [weightKg, setWeightKg] = useState<string>("");
  const [bloodPressure, setBloodPressure] = useState<string>("");
  const [pulseRate, setPulseRate] = useState<string>("");

  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState("");

  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");

  const [familyMedicalHistory, setFamilyMedicalHistory] = useState<string[]>([]);
  const [familyInput, setFamilyInput] = useState("");

  const [lifestyleHabits, setLifestyleHabits] = useState<string[]>([]);
  const [lifestyleInput, setLifestyleInput] = useState("");

  const [dietaryHabits, setDietaryHabits] = useState("");
  const [previousTreatments, setPreviousTreatments] = useState("");
  const [clinicalObservations, setClinicalObservations] = useState("");

  // Feedback & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Pre-fill existing data whenever modal opens or medicalRecord changes
  useEffect(() => {
    if (isOpen) {
      setBloodGroup(medicalRecord?.bloodGroup || "");
      setHeightCm(
        medicalRecord?.heightCm !== undefined && medicalRecord?.heightCm !== null
          ? String(medicalRecord.heightCm)
          : ""
      );
      setWeightKg(
        medicalRecord?.weightKg !== undefined && medicalRecord?.weightKg !== null
          ? String(medicalRecord.weightKg)
          : ""
      );
      setBloodPressure(medicalRecord?.bloodPressure || "");
      setPulseRate(
        medicalRecord?.pulseRate !== undefined && medicalRecord?.pulseRate !== null
          ? String(medicalRecord.pulseRate)
          : ""
      );

      setChronicConditions(medicalRecord?.chronicConditions ? [...medicalRecord.chronicConditions] : []);
      setConditionInput("");

      setAllergies(medicalRecord?.allergies ? [...medicalRecord.allergies] : []);
      setAllergyInput("");

      setFamilyMedicalHistory(
        medicalRecord?.familyMedicalHistory ? [...medicalRecord.familyMedicalHistory] : []
      );
      setFamilyInput("");

      setLifestyleHabits(
        medicalRecord?.lifestyleHabits ? [...medicalRecord.lifestyleHabits] : []
      );
      setLifestyleInput("");

      setDietaryHabits(medicalRecord?.dietaryHabits || "");
      setPreviousTreatments(medicalRecord?.previousTreatments || "");
      setClinicalObservations(medicalRecord?.clinicalObservations || "");

      setErrorMessage("");
      setFieldErrors({});
    }
  }, [isOpen, medicalRecord]);

  // Live BMI calculation
  const bmiInfo = useMemo(() => {
    const h = parseFloat(heightCm);
    const w = parseFloat(weightKg);
    if (!h || !w || h <= 0 || w <= 0) return null;

    const val = w / Math.pow(h / 100, 2);
    const rounded = val.toFixed(1);

    let category = "Normal";
    let colorClass = "bg-emerald-50 text-emerald-800 border-emerald-200";

    if (val < 18.5) {
      category = "Underweight";
      colorClass = "bg-sky-50 text-sky-800 border-sky-200";
    } else if (val >= 25 && val < 30) {
      category = "Overweight";
      colorClass = "bg-amber-50 text-amber-800 border-amber-200";
    } else if (val >= 30) {
      category = "Obese";
      colorClass = "bg-rose-50 text-rose-800 border-rose-200";
    }

    return { val: rounded, category, colorClass };
  }, [heightCm, weightKg]);

  if (!isOpen) return null;

  // Tag Helpers
  const addTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    value: string,
    clearInput: () => void
  ) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed)) {
      setList([...list, trimmed]);
    }
    clearInput();
  };

  const removeTag = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    setList(list.filter((_, idx) => idx !== index));
  };

  // Validation
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (heightCm) {
      const h = parseFloat(heightCm);
      if (isNaN(h) || h < 30 || h > 280) {
        errors.heightCm = "Height must be between 30 and 280 cm.";
      }
    }

    if (weightKg) {
      const w = parseFloat(weightKg);
      if (isNaN(w) || w < 2 || w > 350) {
        errors.weightKg = "Weight must be between 2 and 350 kg.";
      }
    }

    if (pulseRate) {
      const p = parseInt(pulseRate, 10);
      if (isNaN(p) || p < 30 || p > 250) {
        errors.pulseRate = "Pulse rate must be between 30 and 250 bpm.";
      }
    }

    if (bloodPressure) {
      const bpRegex = /^\d{2,3}\/\d{2,3}$/;
      if (!bpRegex.test(bloodPressure.trim())) {
        errors.bloodPressure = "Format should be Systolic/Diastolic (e.g. 120/80).";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: UpsertMedicalRecordRequest = {
        // Updated vitals
        bloodGroup: bloodGroup.trim() || undefined,
        heightCm: heightCm ? parseFloat(heightCm) : undefined,
        weightKg: weightKg ? parseFloat(weightKg) : undefined,
        bloodPressure: bloodPressure.trim() || undefined,
        pulseRate: pulseRate ? parseInt(pulseRate, 10) : undefined,

        // Updated medical history & tags
        chronicConditions,
        allergies,
        familyMedicalHistory,
        lifestyleHabits,
        dietaryHabits: dietaryHabits.trim() || undefined,
        previousTreatments: previousTreatments.trim() || undefined,
        clinicalObservations: clinicalObservations.trim() || undefined,

        // Preserve current medications & surgeries if already present
        currentMedications: medicalRecord?.currentMedications || [],
        pastSurgeries: medicalRecord?.pastSurgeries || [],

        // Preserve existing Ayurvedic profile fields
        prakritiDominant: medicalRecord?.prakritiDominant,
        vataPercentage: medicalRecord?.vataPercentage,
        pittaPercentage: medicalRecord?.pittaPercentage,
        kaphaPercentage: medicalRecord?.kaphaPercentage,
        vikritiImbalance: medicalRecord?.vikritiImbalance,
        agniType: medicalRecord?.agniType,
        amaStatus: medicalRecord?.amaStatus,
        koshtha: medicalRecord?.koshtha,
        dhatuImbalances: medicalRecord?.dhatuImbalances || [],
        malaObservations: medicalRecord?.malaObservations,
        sleepQuality: medicalRecord?.sleepQuality,
        appetiteDigestion: medicalRecord?.appetiteDigestion,
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error("Failed to update medical record:", err);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to save vitals and medical history. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#ECEFE6] bg-[#FAF8F2] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF0E3] text-[#1F3D2E]">
              <HeartPulse size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#173F32]">
                Edit Vitals & Medical History
              </h3>
              <p className="text-xs text-[#766F63]">
                {patientName ? `Patient: ${patientName}` : "Update longitudinal clinical record & vitals"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#766F63] hover:bg-[#EAE6DB] hover:text-[#173F32] transition"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertTriangle size={16} className="shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Vitals & Metrics */}
          <div className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2DDD3] pb-2">
              <span className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-[#1F3D2E]">
                <Activity size={14} /> Basic Vitals & Biometrics
              </span>
              {bmiInfo && (
                <div
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${bmiInfo.colorClass}`}
                >
                  <Scale size={12} />
                  <span>BMI: {bmiInfo.val}</span>
                  <span className="font-normal opacity-80">({bmiInfo.category})</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {/* Blood Pressure */}
              <div>
                <label className="block font-semibold text-[#4E463D] mb-1">
                  Blood Pressure (mmHg)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 120/80"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[#173F32] outline-none transition focus:border-[#1F3D2E] focus:ring-1 focus:ring-[#1F3D2E] ${
                    fieldErrors.bloodPressure ? "border-rose-400 bg-rose-50/50" : "border-[#D8D2C3]"
                  }`}
                />
                {fieldErrors.bloodPressure && (
                  <p className="mt-1 text-[10px] text-rose-600">{fieldErrors.bloodPressure}</p>
                )}
              </div>

              {/* Pulse Rate */}
              <div>
                <label className="block font-semibold text-[#4E463D] mb-1">
                  Pulse Rate (bpm)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 72"
                  value={pulseRate}
                  onChange={(e) => setPulseRate(e.target.value)}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[#173F32] outline-none transition focus:border-[#1F3D2E] focus:ring-1 focus:ring-[#1F3D2E] ${
                    fieldErrors.pulseRate ? "border-rose-400 bg-rose-50/50" : "border-[#D8D2C3]"
                  }`}
                />
                {fieldErrors.pulseRate && (
                  <p className="mt-1 text-[10px] text-rose-600">{fieldErrors.pulseRate}</p>
                )}
              </div>

              {/* Blood Group */}
              <div>
                <label className="block font-semibold text-[#4E463D] mb-1">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full rounded-xl border border-[#D8D2C3] bg-white px-3 py-2 text-xs text-[#173F32] outline-none transition focus:border-[#1F3D2E] focus:ring-1 focus:ring-[#1F3D2E]"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Height (cm) */}
              <div>
                <label className="block font-semibold text-[#4E463D] mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 172"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[#173F32] outline-none transition focus:border-[#1F3D2E] focus:ring-1 focus:ring-[#1F3D2E] ${
                    fieldErrors.heightCm ? "border-rose-400 bg-rose-50/50" : "border-[#D8D2C3]"
                  }`}
                />
                {fieldErrors.heightCm && (
                  <p className="mt-1 text-[10px] text-rose-600">{fieldErrors.heightCm}</p>
                )}
              </div>

              {/* Weight (kg) */}
              <div>
                <label className="block font-semibold text-[#4E463D] mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 68.5"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className={`w-full rounded-xl border bg-white px-3 py-2 text-xs text-[#173F32] outline-none transition focus:border-[#1F3D2E] focus:ring-1 focus:ring-[#1F3D2E] ${
                    fieldErrors.weightKg ? "border-rose-400 bg-rose-50/50" : "border-[#D8D2C3]"
                  }`}
                />
                {fieldErrors.weightKg && (
                  <p className="mt-1 text-[10px] text-rose-600">{fieldErrors.weightKg}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Chronic Conditions & Allergies */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Chronic Conditions */}
            <div className="rounded-xl border border-[#ECEFE6] bg-[#FFFDF8] p-4 space-y-3">
              <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#1F3D2E]">
                <AlertTriangle size={13} className="text-amber-600" />
                Chronic Conditions & Ailments
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Diabetes, Lumbar Spondylosis..."
                  value={conditionInput}
                  onChange={(e) => setConditionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(chronicConditions, setChronicConditions, conditionInput, () =>
                        setConditionInput("")
                      );
                    }
                  }}
                  className="flex-1 rounded-xl border border-[#D8D2C3] bg-white px-3 py-1.5 text-xs text-[#173F32] outline-none focus:border-[#1F3D2E]"
                />
                <button
                  type="button"
                  onClick={() =>
                    addTag(chronicConditions, setChronicConditions, conditionInput, () =>
                      setConditionInput("")
                    )
                  }
                  className="rounded-xl bg-[#1F3D2E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#315A46] transition"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                {chronicConditions.length > 0 ? (
                  chronicConditions.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeTag(chronicConditions, setChronicConditions, idx)}
                        className="text-amber-700 hover:text-amber-950 font-bold"
                        title="Remove condition"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#91897C] italic">No chronic conditions listed</span>
                )}
              </div>
            </div>

            {/* Known Allergies */}
            <div className="rounded-xl border border-[#ECEFE6] bg-[#FFFDF8] p-4 space-y-3">
              <label className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#1F3D2E]">
                <ShieldAlert size={13} className="text-rose-600" />
                Known Allergies (Food / Meds / Dust)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Gluten, Dust, Sulfa..."
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(allergies, setAllergies, allergyInput, () => setAllergyInput(""));
                    }
                  }}
                  className="flex-1 rounded-xl border border-[#D8D2C3] bg-white px-3 py-1.5 text-xs text-[#173F32] outline-none focus:border-[#1F3D2E]"
                />
                <button
                  type="button"
                  onClick={() =>
                    addTag(allergies, setAllergies, allergyInput, () => setAllergyInput(""))
                  }
                  className="rounded-xl bg-[#1F3D2E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#315A46] transition"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                {allergies.length > 0 ? (
                  allergies.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-900"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => removeTag(allergies, setAllergies, idx)}
                        className="text-rose-700 hover:text-rose-950 font-bold"
                        title="Remove allergy"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#91897C] italic">No allergies listed</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Family History & Lifestyle Habits */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Family Medical History */}
            <div className="rounded-xl border border-[#ECEFE6] bg-[#FFFDF8] p-4 space-y-3">
              <label className="block font-bold uppercase tracking-wider text-[11px] text-[#1F3D2E]">
                Family Medical History
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Maternal Type 2 Diabetes, Hypertension..."
                  value={familyInput}
                  onChange={(e) => setFamilyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(
                        familyMedicalHistory,
                        setFamilyMedicalHistory,
                        familyInput,
                        () => setFamilyInput("")
                      );
                    }
                  }}
                  className="flex-1 rounded-xl border border-[#D8D2C3] bg-white px-3 py-1.5 text-xs text-[#173F32] outline-none focus:border-[#1F3D2E]"
                />
                <button
                  type="button"
                  onClick={() =>
                    addTag(
                      familyMedicalHistory,
                      setFamilyMedicalHistory,
                      familyInput,
                      () => setFamilyInput("")
                    )
                  }
                  className="rounded-xl bg-[#1F3D2E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#315A46] transition"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                {familyMedicalHistory.length > 0 ? (
                  familyMedicalHistory.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-900"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          removeTag(familyMedicalHistory, setFamilyMedicalHistory, idx)
                        }
                        className="text-blue-700 hover:text-blue-950 font-bold"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#91897C] italic">No family history listed</span>
                )}
              </div>
            </div>

            {/* Lifestyle & Occupational Habits */}
            <div className="rounded-xl border border-[#ECEFE6] bg-[#FFFDF8] p-4 space-y-3">
              <label className="block font-bold uppercase tracking-wider text-[11px] text-[#1F3D2E]">
                Lifestyle & Occupational Factors
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Desk job, Daily Yoga, High screen time..."
                  value={lifestyleInput}
                  onChange={(e) => setLifestyleInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(
                        lifestyleHabits,
                        setLifestyleHabits,
                        lifestyleInput,
                        () => setLifestyleInput("")
                      );
                    }
                  }}
                  className="flex-1 rounded-xl border border-[#D8D2C3] bg-white px-3 py-1.5 text-xs text-[#173F32] outline-none focus:border-[#1F3D2E]"
                />
                <button
                  type="button"
                  onClick={() =>
                    addTag(
                      lifestyleHabits,
                      setLifestyleHabits,
                      lifestyleInput,
                      () => setLifestyleInput("")
                    )
                  }
                  className="rounded-xl bg-[#1F3D2E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#315A46] transition"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                {lifestyleHabits.length > 0 ? (
                  lifestyleHabits.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#BACBB0] bg-[#EEF2E8] px-2.5 py-1 text-xs font-medium text-[#264E36]"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() =>
                          removeTag(lifestyleHabits, setLifestyleHabits, idx)
                        }
                        className="text-[#264E36] hover:text-[#112318] font-bold"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#91897C] italic">No lifestyle habits listed</span>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Dietary Habits & Treatments Textareas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block font-semibold text-[#4E463D] mb-1">
                Dietary Habits & Agni Details
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Vegetarian, prefers warm & cooked meals, irregular lunchtime..."
                value={dietaryHabits}
                onChange={(e) => setDietaryHabits(e.target.value)}
                className="w-full resize-none rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs text-[#173F32] outline-none focus:border-[#1F3D2E] focus:ring-1 focus:ring-[#1F3D2E]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#4E463D] mb-1">
                Previous Medical & Ayurvedic Treatments
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Previous Kati Basti in 2024, Allopathic pain management..."
                value={previousTreatments}
                onChange={(e) => setPreviousTreatments(e.target.value)}
                className="w-full resize-none rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs text-[#173F32] outline-none focus:border-[#1F3D2E] focus:ring-1 focus:ring-[#1F3D2E]"
              />
            </div>
          </div>

          {/* Clinical Observations */}
          <div>
            <label className="block font-semibold text-[#4E463D] mb-1">
              General Clinical Observations & Medical History Notes
            </label>
            <textarea
              rows={2}
              placeholder="Clinical observations regarding posture, tongue, gait, constitution, or past medical events..."
              value={clinicalObservations}
              onChange={(e) => setClinicalObservations(e.target.value)}
              className="w-full resize-none rounded-xl border border-[#D8D2C3] bg-white p-2.5 text-xs text-[#173F32] outline-none focus:border-[#1F3D2E] focus:ring-1 focus:ring-[#1F3D2E]"
            />
          </div>
        </form>

        {/* Modal Action Buttons Footer */}
        <div className="flex items-center justify-between border-t border-[#ECEFE6] bg-[#FAF8F2] px-6 py-4">
          <span className="text-[11px] text-[#766F63]">
            * Updated vitals and history are instantly reflected across EMR.
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#D8D2C3] bg-white px-4 py-2 text-xs font-semibold text-[#665849] hover:bg-[#F8F6F0] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1F3D2E] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#315A46] transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving Changes...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import {
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  ShieldAlert,
  Flame,
} from "lucide-react";
import type { PatientResponse, PatientMedicalRecord } from "../../types/emr";

interface PatientOverviewBannerProps {
  patient: PatientResponse;
  medicalRecord?: PatientMedicalRecord;
  onEditMedicalHistory?: () => void;
  canEdit?: boolean;
}

export const PatientOverviewBanner: React.FC<PatientOverviewBannerProps> = ({
  patient,
  medicalRecord,
  onEditMedicalHistory,
  canEdit = false,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return "P";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  };

  const bmi =
    medicalRecord?.heightCm && medicalRecord?.weightKg
      ? (
          medicalRecord.weightKg /
          Math.pow(medicalRecord.heightCm / 100, 2)
        ).toFixed(1)
      : null;

  return (
    <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Avatar & Personal Info */}
        <div className="flex items-start sm:items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1F3D2E] text-xl font-bold text-white shadow-sm">
            {getInitials(patient.fullName)}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#EEF2E8] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#315A46]">
                Patient EMR
              </span>
              <span className="rounded-md bg-[#F4F1EA] px-2 py-0.5 text-[11px] font-medium text-[#766F63]">
                ID: {patient.id}
              </span>
              {medicalRecord?.bloodGroup && (
                <span className="rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                  {medicalRecord.bloodGroup}
                </span>
              )}
              {medicalRecord?.prakritiDominant && (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                  <Flame size={12} className="text-amber-600" />
                  {medicalRecord.prakritiDominant}
                </span>
              )}
            </div>

            <h1 className="mt-1 text-2xl font-bold text-[#173F32]">
              {patient.fullName}
            </h1>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#665849]">
              <span className="flex items-center gap-1">
                <Calendar size={13} className="text-[#8B8476]" />
                {patient.age ? `${patient.age} yrs` : "Age —"} • {patient.gender || "Gender —"}
              </span>
              {patient.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={13} className="text-[#8B8476]" />
                  {patient.phone}
                </span>
              )}
              {patient.email && (
                <span className="flex items-center gap-1">
                  <Mail size={13} className="text-[#8B8476]" />
                  {patient.email}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Vitals & Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Baseline Vitals Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-xl bg-[#F8F6F0] p-2.5 border border-[#ECEFE6] text-center">
            <div className="px-3 py-1">
              <span className="block text-[10px] uppercase font-semibold text-[#8B8476]">
                Blood Pressure
              </span>
              <span className="text-sm font-bold text-[#1F3D2E]">
                {medicalRecord?.bloodPressure || "—"}
              </span>
            </div>
            <div className="px-3 py-1 border-l border-[#E2DDD3]">
              <span className="block text-[10px] uppercase font-semibold text-[#8B8476]">
                Pulse
              </span>
              <span className="text-sm font-bold text-[#1F3D2E]">
                {medicalRecord?.pulseRate ? `${medicalRecord.pulseRate} bpm` : "—"}
              </span>
            </div>
            <div className="px-3 py-1 border-l border-[#E2DDD3]">
              <span className="block text-[10px] uppercase font-semibold text-[#8B8476]">
                Weight / Height
              </span>
              <span className="text-sm font-bold text-[#1F3D2E]">
                {medicalRecord?.weightKg ? `${medicalRecord.weightKg}kg` : "—"} /{" "}
                {medicalRecord?.heightCm ? `${medicalRecord.heightCm}cm` : "—"}
              </span>
            </div>
            <div className="px-3 py-1 border-l border-[#E2DDD3]">
              <span className="block text-[10px] uppercase font-semibold text-[#8B8476]">
                BMI
              </span>
              <span className="text-sm font-bold text-[#1F3D2E]">
                {bmi ? `${bmi}` : "—"}
              </span>
            </div>
          </div>

          {canEdit && onEditMedicalHistory && (
            <button
              onClick={onEditMedicalHistory}
              className="rounded-xl border border-[#B8BBA8] bg-[#EEF2E8] px-4 py-2.5 text-xs font-semibold text-[#315A46] transition hover:bg-[#E3EBD9]"
            >
              ✎ Edit Vitals & History
            </button>
          )}
        </div>
      </div>

      {/* Warning Badges: Allergies & Chronic Conditions */}
      {((medicalRecord?.allergies && medicalRecord.allergies.length > 0) ||
        (medicalRecord?.chronicConditions && medicalRecord.chronicConditions.length > 0)) && (
        <div className="mt-4 pt-4 border-t border-[#ECEFE6] flex flex-wrap items-center gap-2">
          {medicalRecord?.allergies && medicalRecord.allergies.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 border border-rose-200">
              <ShieldAlert size={14} className="text-rose-600" />
              <span>Allergies:</span>
              <span className="font-normal">{medicalRecord.allergies.join(", ")}</span>
            </div>
          )}

          {medicalRecord?.chronicConditions && medicalRecord.chronicConditions.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Chronic Conditions:</span>
              <span className="font-normal">{medicalRecord.chronicConditions.join(", ")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

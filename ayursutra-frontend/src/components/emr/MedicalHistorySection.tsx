import React from "react";
import {
  HeartPulse,
  Pill,
  Scissors,
  Users,
  Apple,
} from "lucide-react";
import type {
  PatientMedicalRecord,
  UpsertMedicalRecordRequest,
} from "../../types/emr";

interface MedicalHistorySectionProps {
  medicalRecord?: PatientMedicalRecord;
  onSaveMedicalRecord?: (data: UpsertMedicalRecordRequest) => Promise<void>;
  canEdit?: boolean;
  onOpenEdit?: () => void;
  isEditingOpen?: boolean;
  onCloseEdit?: () => void;
}

export const MedicalHistorySection: React.FC<MedicalHistorySectionProps> = ({
  medicalRecord,
  canEdit = false,
  onOpenEdit,
}) => {
  return (
    <div className="space-y-6">
      {/* Section Header with Edit Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-5 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-[#173F32]">
            Longitudinal Medical History & Baseline Vitals
          </h2>
          <p className="mt-0.5 text-xs text-[#766F63]">
            Comprehensive clinical history, chronic conditions, biometrics and lifestyle parameters.
          </p>
        </div>

        {canEdit && onOpenEdit && (
          <button
            type="button"
            onClick={onOpenEdit}
            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl border border-[#BACBB0] bg-[#EEF2E8] px-4 py-2 text-xs font-semibold text-[#1F3D2E] transition hover:bg-[#DDE7D6]"
          >
            ✎ Edit Vitals & History
          </button>
        )}
      </div>

      {/* 2-Column Grid for History Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card 1: Chronic Conditions & Known Allergies */}
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#ECEFE6] pb-3">
            <HeartPulse size={18} className="text-[#1F3D2E]" />
            <h3 className="font-bold text-[#173F32]">Chronic Conditions & Allergies</h3>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#766F63]">
                Existing Diseases & Chronic Conditions
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {medicalRecord?.chronicConditions && medicalRecord.chronicConditions.length > 0 ? (
                  medicalRecord.chronicConditions.map((cond, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-900 border border-amber-200"
                    >
                      {cond}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#91897C] italic">No chronic conditions recorded</span>
                )}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#766F63]">
                Known Allergies (Food, Meds, Environmental)
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {medicalRecord?.allergies && medicalRecord.allergies.length > 0 ? (
                  medicalRecord.allergies.map((allergy, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-800 border border-rose-200"
                    >
                      ⚠ {allergy}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#91897C] italic">No allergies recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Family History & Lifestyle Habits */}
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#ECEFE6] pb-3">
            <Users size={18} className="text-[#1F3D2E]" />
            <h3 className="font-bold text-[#173F32]">Family History & Lifestyle Habits</h3>
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#766F63]">
                Family Medical History
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {medicalRecord?.familyMedicalHistory && medicalRecord.familyMedicalHistory.length > 0 ? (
                  medicalRecord.familyMedicalHistory.map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-[#F8F6F0] px-2.5 py-1 text-xs font-medium text-[#4D5C4B] border border-[#ECEFE6]"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#91897C] italic">No family medical history recorded</span>
                )}
              </div>
            </div>

            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-[#766F63]">
                Lifestyle & Occupational Habits
              </span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {medicalRecord?.lifestyleHabits && medicalRecord.lifestyleHabits.length > 0 ? (
                  medicalRecord.lifestyleHabits.map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-[#EEF2E8] px-2.5 py-1 text-xs font-medium text-[#315A46] border border-[#D5DCCB]"
                    >
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-[#91897C] italic">No lifestyle habits recorded</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Current Medications Table */}
      <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-[#ECEFE6] pb-3">
          <Pill size={18} className="text-[#1F3D2E]" />
          <h3 className="font-bold text-[#173F32]">Current Medications</h3>
        </div>

        <div className="mt-4 overflow-x-auto">
          {medicalRecord?.currentMedications && medicalRecord.currentMedications.length > 0 ? (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#ECEFE6] text-[#766F63]">
                  <th className="py-2.5 px-3 font-semibold uppercase">Medication</th>
                  <th className="py-2.5 px-3 font-semibold uppercase">Dosage</th>
                  <th className="py-2.5 px-3 font-semibold uppercase">Frequency</th>
                  <th className="py-2.5 px-3 font-semibold uppercase">Purpose</th>
                  <th className="py-2.5 px-3 font-semibold uppercase">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEFE6]">
                {medicalRecord.currentMedications.map((med, idx) => (
                  <tr key={idx} className="hover:bg-[#F8F6F0]/60">
                    <td className="py-2.5 px-3 font-semibold text-[#1F3D2E]">{med.name}</td>
                    <td className="py-2.5 px-3 text-[#4E463D]">{med.dosage || "—"}</td>
                    <td className="py-2.5 px-3 text-[#4E463D]">{med.frequency || "—"}</td>
                    <td className="py-2.5 px-3 text-[#4E463D]">{med.purpose || "—"}</td>
                    <td className="py-2.5 px-3 text-[#766F63]">{med.startDate || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-6 text-center text-xs text-[#91897C] italic">
              No current medications on file
            </div>
          )}
        </div>
      </div>

      {/* Past Surgeries & Dietary/Treatments */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Past Surgeries */}
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#ECEFE6] pb-3">
            <Scissors size={18} className="text-[#1F3D2E]" />
            <h3 className="font-bold text-[#173F32]">Past Surgeries & Procedures</h3>
          </div>

          <div className="mt-4 space-y-3">
            {medicalRecord?.pastSurgeries && medicalRecord.pastSurgeries.length > 0 ? (
              medicalRecord.pastSurgeries.map((surg, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-[#ECEFE6] bg-[#F8F6F0] p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1F3D2E]">{surg.procedureName}</span>
                    <span className="font-medium text-[#766F63]">
                      {surg.year ? `Year ${surg.year}` : "—"}
                    </span>
                  </div>
                  {surg.hospitalOrDoctor && (
                    <p className="mt-1 text-[#665849]">Facility: {surg.hospitalOrDoctor}</p>
                  )}
                  {surg.notes && <p className="mt-0.5 text-[#766F63]">{surg.notes}</p>}
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-xs text-[#91897C] italic">
                No past surgeries or surgical procedures recorded
              </p>
            )}
          </div>
        </div>

        {/* Dietary Habits & Previous Treatments */}
        <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-6 shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#ECEFE6] pb-3">
            <Apple size={18} className="text-[#1F3D2E]" />
            <h3 className="font-bold text-[#173F32]">Dietary Habits & Previous Treatments</h3>
          </div>

          <div className="mt-4 space-y-4 text-xs">
            <div>
              <span className="block font-semibold uppercase tracking-wider text-[#766F63]">
                Dietary Habits
              </span>
              <p className="mt-1 text-[#4E463D] leading-relaxed">
                {medicalRecord?.dietaryHabits || (
                  <span className="italic text-[#91897C]">No specific dietary habits recorded</span>
                )}
              </p>
            </div>

            <div>
              <span className="block font-semibold uppercase tracking-wider text-[#766F63]">
                Previous Ayurvedic Treatments
              </span>
              <p className="mt-1 text-[#4E463D] leading-relaxed">
                {medicalRecord?.previousTreatments || (
                  <span className="italic text-[#91897C]">No previous Ayurvedic treatments recorded</span>
                )}
              </p>
            </div>

            <div>
              <span className="block font-semibold uppercase tracking-wider text-[#766F63]">
                General Clinical Observations
              </span>
              <p className="mt-1 text-[#4E463D] leading-relaxed">
                {medicalRecord?.clinicalObservations || (
                  <span className="italic text-[#91897C]">No clinical observations recorded</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import {
  FileText,
  Calendar,
  Clock,
  History,
  Lock,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit2,
  Stethoscope,
} from "lucide-react";
import type { DoctorClinicalNote } from "../../types/emr";

interface ClinicalNotesTimelineProps {
  notes: DoctorClinicalNote[];
  currentUserId?: string;
  currentUserEmail?: string;
  currentUserName?: string;
  userRole?: string;
  onEditNote?: (note: DoctorClinicalNote) => void;
  onAddObservation?: (note: DoctorClinicalNote) => void;
}

export const ClinicalNotesTimeline: React.FC<ClinicalNotesTimelineProps> = ({
  notes,
  currentUserId,
  currentUserEmail: _currentUserEmail,
  currentUserName,
  userRole,
  onEditNote,
  onAddObservation,
}) => {
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({});
  const [showAuditFor, setShowAuditFor] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedNotes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAudit = (id: string) => {
    setShowAuditFor((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isDoctor = userRole === "DOCTOR";
  const isAdmin = userRole === "ADMIN";
  const isTherapist = userRole === "THERAPIST";

  if (!notes || notes.length === 0) {
    return (
      <div className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] p-10 text-center shadow-sm">
        <FileText size={36} className="mx-auto text-[#B5AEA1]" />
        <h4 className="mt-3 text-base font-bold text-[#173F32]">No Clinical Notes Yet</h4>
        <p className="mt-1 text-xs text-[#766F63]">
          Consultation notes authored by doctors will appear here chronologically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {notes.map((note, index) => {
        const isAuthorOrAdmin =
          isAdmin ||
          (isDoctor &&
            (!currentUserId ||
              currentUserId === note.doctorUserId ||
              (currentUserName &&
                note.doctorName?.toLowerCase().includes(currentUserName.toLowerCase()))));
        const isExpanded = expandedNotes[note.id] ?? (index === 0); // First note expanded by default
        const showAudit = showAuditFor[note.id] ?? false;

        return (
          <div
            key={note.id}
            className="rounded-2xl border border-[#D8D2C3] bg-[#FFFDF8] shadow-sm transition hover:border-[#1F3D2E]/40"
          >
            {/* Note Header */}
            <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-[#ECEFE6]">
              <div className="flex items-start sm:items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EEF2E8] text-[#1F3D2E]">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-[#173F32] text-sm">
                      {note.doctorName || "Consulting Physician"}
                    </span>
                    {note.doctorSpecialization && (
                      <span className="text-[11px] text-[#766F63]">
                        • {note.doctorSpecialization}
                      </span>
                    )}
                    <span className="rounded-md bg-[#F4F1EA] px-2 py-0.5 text-[10px] font-bold uppercase text-[#4D5C4B]">
                      {note.visitType?.replace(/_/g, " ") || "CONSULTATION"}
                    </span>
                    {note.isConfidential && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                        <Lock size={10} /> Confidential
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#766F63]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {note.consultationDate}
                    </span>
                    {note.consultationTime && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {note.consultationTime}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {isAuthorOrAdmin && onEditNote && (
                  <button
                    onClick={() => onEditNote(note)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[#D8D2C3] bg-white px-3 py-1.5 text-xs font-semibold text-[#315A46] hover:bg-[#F8F6F0]"
                  >
                    <Edit2 size={12} /> Edit Note
                  </button>
                )}

                {(isTherapist || isAdmin) && onAddObservation && (
                  <button
                    onClick={() => onAddObservation(note)}
                    className="inline-flex items-center gap-1 rounded-lg bg-[#1F3D2E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#315A46]"
                  >
                    <Plus size={12} /> Add Therapy Observation
                  </button>
                )}

                <button
                  onClick={() => toggleExpand(note.id)}
                  className="rounded-lg p-1.5 text-[#766F63] hover:bg-[#F8F6F0]"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>
            </div>

            {/* Note Content */}
            {isExpanded && (
              <div className="p-6 space-y-5 text-xs">
                {/* Diagnosis Banner */}
                <div className="rounded-xl bg-[#F8F6F0] p-4 border border-[#ECEFE6] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#766F63] tracking-wider block">
                      Diagnosis (Nidana)
                    </span>
                    <span className="text-sm font-bold text-[#1F3D2E]">
                      {note.diagnosis}
                    </span>
                  </div>

                  {note.followUpDate && (
                    <div className="sm:text-right">
                      <span className="text-[10px] uppercase font-bold text-[#766F63] tracking-wider block">
                        Follow-up Visit
                      </span>
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 font-bold text-amber-800 border border-amber-200">
                        {note.followUpDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Chief Complaints & Symptoms */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {note.chiefComplaints && (
                    <div>
                      <span className="font-bold text-[#1F3D2E] uppercase tracking-wider text-[11px] block mb-1">
                        Chief Complaints
                      </span>
                      <p className="text-[#4E463D] leading-relaxed bg-white p-3 rounded-xl border border-[#ECEFE6]">
                        {note.chiefComplaints}
                      </p>
                    </div>
                  )}

                  {note.symptoms && note.symptoms.length > 0 && (
                    <div>
                      <span className="font-bold text-[#1F3D2E] uppercase tracking-wider text-[11px] block mb-1">
                        Reported Symptoms (Lakshanas)
                      </span>
                      <div className="flex flex-wrap gap-1.5 bg-white p-3 rounded-xl border border-[#ECEFE6] min-h-[4rem] items-center">
                        {note.symptoms.map((s, idx) => (
                          <span
                            key={idx}
                            className="rounded-md bg-[#EEF2E8] px-2 py-1 text-xs font-medium text-[#315A46] border border-[#D5DCCB]"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Ayurvedic Examination Findings (Pariksha) */}
                {(note.nadiPariksha || note.jihvaPariksha || note.agniObservation || note.amaObservation) && (
                  <div>
                    <span className="font-bold text-[#1F3D2E] uppercase tracking-wider text-[11px] block mb-2">
                      Ayurvedic Pariksha (Clinical Examination)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {note.nadiPariksha && (
                        <div className="rounded-xl border border-[#ECEFE6] bg-white p-3">
                          <span className="text-[10px] uppercase font-bold text-[#766F63] block">Nadi (Pulse)</span>
                          <span className="text-xs text-[#1F3D2E] font-medium mt-1 block">{note.nadiPariksha}</span>
                        </div>
                      )}
                      {note.jihvaPariksha && (
                        <div className="rounded-xl border border-[#ECEFE6] bg-white p-3">
                          <span className="text-[10px] uppercase font-bold text-[#766F63] block">Jihva (Tongue)</span>
                          <span className="text-xs text-[#1F3D2E] font-medium mt-1 block">{note.jihvaPariksha}</span>
                        </div>
                      )}
                      {note.agniObservation && (
                        <div className="rounded-xl border border-[#ECEFE6] bg-white p-3">
                          <span className="text-[10px] uppercase font-bold text-[#766F63] block">Agni (Digestion)</span>
                          <span className="text-xs text-[#1F3D2E] font-medium mt-1 block">{note.agniObservation}</span>
                        </div>
                      )}
                      {note.amaObservation && (
                        <div className="rounded-xl border border-[#ECEFE6] bg-white p-3">
                          <span className="text-[10px] uppercase font-bold text-[#766F63] block">Ama (Toxins)</span>
                          <span className="text-xs text-[#1F3D2E] font-medium mt-1 block">{note.amaObservation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Prescribed Medicines Table */}
                {note.prescribedMedicines && note.prescribedMedicines.length > 0 && (
                  <div>
                    <span className="font-bold text-[#1F3D2E] uppercase tracking-wider text-[11px] block mb-2">
                      Prescribed Medicines & Formulations
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-[#ECEFE6] bg-white">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#ECEFE6] text-[#766F63] bg-[#F8F6F0]">
                            <th className="py-2.5 px-3 font-semibold uppercase">Medicine</th>
                            <th className="py-2.5 px-3 font-semibold uppercase">Formulation</th>
                            <th className="py-2.5 px-3 font-semibold uppercase">Dosage</th>
                            <th className="py-2.5 px-3 font-semibold uppercase">Timing</th>
                            <th className="py-2.5 px-3 font-semibold uppercase">Duration</th>
                            <th className="py-2.5 px-3 font-semibold uppercase">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#ECEFE6]">
                          {note.prescribedMedicines.map((med, mIdx) => (
                            <tr key={mIdx}>
                              <td className="py-2.5 px-3 font-bold text-[#1F3D2E]">{med.medicineName}</td>
                              <td className="py-2.5 px-3 text-[#4E463D]">{med.formulation || "—"}</td>
                              <td className="py-2.5 px-3 text-[#4E463D]">{med.dosage}</td>
                              <td className="py-2.5 px-3 text-[#4E463D]">{med.timing}</td>
                              <td className="py-2.5 px-3 text-[#4E463D]">{med.durationDays ? `${med.durationDays} days` : "—"}</td>
                              <td className="py-2.5 px-3 text-[#766F63]">{med.instructions || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Treatment Recommendations & Dietary Guidelines */}
                {(note.treatmentRecommendations || note.dietaryAdvice || note.lifestyleInstructions) && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {note.treatmentRecommendations && (
                      <div className="rounded-xl border border-[#ECEFE6] bg-white p-3.5">
                        <span className="font-bold text-[#1F3D2E] uppercase tracking-wider text-[11px] block mb-1">
                          Treatment Plan & Therapies
                        </span>
                        <p className="text-[#4E463D] leading-relaxed">{note.treatmentRecommendations}</p>
                      </div>
                    )}
                    {note.dietaryAdvice && (
                      <div className="rounded-xl border border-[#ECEFE6] bg-white p-3.5">
                        <span className="font-bold text-[#1F3D2E] uppercase tracking-wider text-[11px] block mb-1">
                          Dietary (Pathya-Apathya) Advice
                        </span>
                        <p className="text-[#4E463D] leading-relaxed">{note.dietaryAdvice}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Therapist Observations Attached to this Consultation */}
                {note.therapistNotes && note.therapistNotes.length > 0 && (
                  <div className="rounded-xl border border-[#D5DCCB] bg-[#F1F4EC]/60 p-4">
                    <span className="font-bold text-[#1F3D2E] uppercase tracking-wider text-[11px] block mb-2">
                      Therapy Session Observations (Recorded by Therapist)
                    </span>
                    <div className="space-y-2.5">
                      {note.therapistNotes.map((obs, oIdx) => (
                        <div key={oIdx} className="rounded-lg bg-white p-3 border border-[#D5DCCB]">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#315A46]">
                              {obs.therapyName || "Therapy Session"} • Recorded by {obs.therapistName}
                            </span>
                            <span className="text-[11px] text-[#766F63]">
                              {obs.recordedAt?.split("T")[0]}
                            </span>
                          </div>
                          <p className="mt-1 text-[#4E463D]">{obs.observation}</p>
                          {obs.patientFeedback && (
                            <p className="mt-0.5 text-[#766F63] italic">
                              Patient feedback: "{obs.patientFeedback}"
                            </p>
                          )}
                          {(obs.vitalPulse || obs.vitalBloodPressure) && (
                            <div className="mt-1 flex items-center gap-3 text-[11px] text-[#315A46] font-medium">
                              {obs.vitalPulse && <span>Pulse: {obs.vitalPulse} bpm</span>}
                              {obs.vitalBloodPressure && <span>BP: {obs.vitalBloodPressure}</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Audit Trail Toggle */}
                {note.auditHistory && note.auditHistory.length > 0 && (
                  <div className="pt-2 border-t border-[#ECEFE6]">
                    <button
                      onClick={() => toggleAudit(note.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#766F63] hover:text-[#1F3D2E]"
                    >
                      <History size={12} />
                      {showAudit ? "Hide Audit History" : "View Record Audit History"}
                    </button>

                    {showAudit && (
                      <div className="mt-2 space-y-1.5 rounded-xl bg-[#F8F6F0] p-3 text-[11px] text-[#766F63]">
                        {note.auditHistory.map((item, aIdx) => (
                          <div key={aIdx} className="flex items-center justify-between">
                            <span>
                              <strong>{item.performedByName || item.performedByRole}</strong>: {item.summary}
                            </span>
                            <span className="text-[#91897C]">{item.timestamp?.split("T")[0]}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

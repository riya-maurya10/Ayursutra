package com.ayursutra.dto.response;

import com.ayursutra.entity.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientEMRSummaryResponse {

    private PatientResponse patient;

    private PatientMedicalRecord medicalRecord;

    @Builder.Default
    private List<DoctorClinicalNote> consultationNotes = new ArrayList<>();

    private DoshaAssessmentResponse doshaAssessment;

    @Builder.Default
    private List<TherapyPlan> therapyPlans = new ArrayList<>();

    @Builder.Default
    private List<TherapySession> therapySessions = new ArrayList<>();

    @Builder.Default
    private List<DietPlan> dietPlans = new ArrayList<>();

    @Builder.Default
    private List<PatientProgress> progressRecords = new ArrayList<>();

    @Builder.Default
    private List<Appointment> appointments = new ArrayList<>();

    // Role-based capabilities for the calling user
    private Boolean canEditMedicalRecord;
    private Boolean canAddClinicalNote;
    private Boolean canAddTherapyObservation;
    private Boolean canViewConfidentialNotes;
}

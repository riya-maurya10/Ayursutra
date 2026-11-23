package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientProgressResponse {

    private String id;

    private String patientId;

    private String therapyPlanId;

    private String therapySessionId;

    private String therapyName;

    private LocalDate assessmentDate;

    private Integer dayNumber;

    private String symptoms;

    private String observations;

    private Integer improvementPercentage;

    private String therapyResponse;

    private String discomfortSideEffects;

    private String practitionerNotes;

    private String nextRecommendation;

    private String clinicalAssessment;

    private String treatmentAdjustments;

    private String assessedByTherapistId;

    private String assessedByTherapistName;

    private String reviewedByDoctorId;

    private String reviewedByDoctorName;

    private LocalDateTime reviewedAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    // Backward-compatible 12-argument constructor for any legacy code/tests
    public PatientProgressResponse(
            String id,
            String patientId,
            String therapyPlanId,
            LocalDate assessmentDate,
            Integer dayNumber,
            String symptoms,
            String observations,
            Integer improvementPercentage,
            String therapyResponse,
            String practitionerNotes,
            String nextRecommendation) {
        this.id = id;
        this.patientId = patientId;
        this.therapyPlanId = therapyPlanId;
        this.assessmentDate = assessmentDate;
        this.dayNumber = dayNumber;
        this.symptoms = symptoms;
        this.observations = observations;
        this.improvementPercentage = improvementPercentage;
        this.therapyResponse = therapyResponse;
        this.practitionerNotes = practitionerNotes;
        this.nextRecommendation = nextRecommendation;
    }
}

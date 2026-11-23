package com.ayursutra.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "patient_progress")
public class PatientProgress {

    @Id
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
}

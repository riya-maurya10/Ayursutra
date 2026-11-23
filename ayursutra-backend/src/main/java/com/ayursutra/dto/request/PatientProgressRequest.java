package com.ayursutra.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientProgressRequest {

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Therapy plan ID is required")
    private String therapyPlanId;

    private String therapySessionId;

    private String therapyName;

    @NotNull(message = "Assessment date is required")
    private LocalDate assessmentDate;

    @NotNull(message = "Day number is required")
    @Min(value = 1, message = "Day number must be greater than zero")
    private Integer dayNumber;

    private String symptoms;

    private String observations;

    @Min(value = 0, message = "Improvement percentage must be at least 0")
    @Max(value = 100, message = "Improvement percentage cannot exceed 100")
    private Integer improvementPercentage;

    private String therapyResponse;

    private String discomfortSideEffects;

    private String practitionerNotes;

    private String nextRecommendation;

    private String clinicalAssessment;

    private String treatmentAdjustments;

    private String notesForDoctor;
}

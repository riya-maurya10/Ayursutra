package com.ayursutra.mapper;

import com.ayursutra.dto.request.PatientProgressRequest;
import com.ayursutra.dto.response.PatientProgressResponse;
import com.ayursutra.entity.PatientProgress;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class PatientProgressMapper {

    public PatientProgress toEntity(PatientProgressRequest request) {
        if (request == null) {
            return null;
        }

        String notes = request.getPractitionerNotes();
        if (notes == null || notes.isBlank()) {
            notes = request.getNotesForDoctor();
        }

        return PatientProgress.builder()
                .patientId(request.getPatientId())
                .therapyPlanId(request.getTherapyPlanId())
                .therapySessionId(request.getTherapySessionId())
                .therapyName(request.getTherapyName())
                .assessmentDate(request.getAssessmentDate())
                .dayNumber(request.getDayNumber())
                .symptoms(request.getSymptoms())
                .observations(request.getObservations())
                .improvementPercentage(request.getImprovementPercentage())
                .therapyResponse(request.getTherapyResponse())
                .discomfortSideEffects(request.getDiscomfortSideEffects())
                .practitionerNotes(notes)
                .nextRecommendation(request.getNextRecommendation())
                .clinicalAssessment(request.getClinicalAssessment())
                .treatmentAdjustments(request.getTreatmentAdjustments())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public PatientProgressResponse toResponse(PatientProgress progress) {
        if (progress == null) {
            return null;
        }

        return PatientProgressResponse.builder()
                .id(progress.getId())
                .patientId(progress.getPatientId())
                .therapyPlanId(progress.getTherapyPlanId())
                .therapySessionId(progress.getTherapySessionId())
                .therapyName(progress.getTherapyName())
                .assessmentDate(progress.getAssessmentDate())
                .dayNumber(progress.getDayNumber())
                .symptoms(progress.getSymptoms())
                .observations(progress.getObservations())
                .improvementPercentage(progress.getImprovementPercentage())
                .therapyResponse(progress.getTherapyResponse())
                .discomfortSideEffects(progress.getDiscomfortSideEffects())
                .practitionerNotes(progress.getPractitionerNotes())
                .nextRecommendation(progress.getNextRecommendation())
                .clinicalAssessment(progress.getClinicalAssessment())
                .treatmentAdjustments(progress.getTreatmentAdjustments())
                .assessedByTherapistId(progress.getAssessedByTherapistId())
                .assessedByTherapistName(progress.getAssessedByTherapistName())
                .reviewedByDoctorId(progress.getReviewedByDoctorId())
                .reviewedByDoctorName(progress.getReviewedByDoctorName())
                .reviewedAt(progress.getReviewedAt())
                .createdAt(progress.getCreatedAt())
                .updatedAt(progress.getUpdatedAt())
                .build();
    }
}

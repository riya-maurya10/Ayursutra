package com.ayursutra.service;

import com.ayursutra.dto.request.PatientProgressRequest;
import com.ayursutra.dto.response.PatientProgressResponse;

import java.util.List;

public interface PatientProgressService {

    PatientProgressResponse createProgress(
            PatientProgressRequest request
    );

    List<PatientProgressResponse> getAllProgress();

    List<PatientProgressResponse> getPendingReviewsForDoctor();

    PatientProgressResponse getProgressById(
            String id
    );

    List<PatientProgressResponse> getProgressByPatient(
            String patientId
    );

    List<PatientProgressResponse> getProgressByTherapyPlan(
            String therapyPlanId
    );

    List<PatientProgressResponse> getProgressByPatientAndTherapyPlan(
            String patientId,
            String therapyPlanId
    );

    PatientProgressResponse getProgressByTherapySession(
            String therapySessionId
    );

    PatientProgressResponse updateProgress(
            String id,
            PatientProgressRequest request
    );

    PatientProgressResponse doctorReviewProgress(
            String id,
            PatientProgressRequest request
    );

    void deleteProgress(
            String id
    );
}

package com.ayursutra.repository;

import com.ayursutra.entity.PatientProgress;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientProgressRepository
        extends MongoRepository<PatientProgress, String> {

    List<PatientProgress> findByPatientId(String patientId);

    List<PatientProgress> findByTherapyPlanId(String therapyPlanId);

    List<PatientProgress> findByPatientIdAndTherapyPlanId(String patientId, String therapyPlanId);

    Optional<PatientProgress> findByTherapySessionId(String therapySessionId);

    boolean existsByTherapySessionId(String therapySessionId);

    List<PatientProgress> findByPatientIdOrderByAssessmentDateDescDayNumberDesc(String patientId);

    List<PatientProgress> findByTherapyPlanIdInAndReviewedAtIsNull(
        List<String> therapyPlanIds
);
}

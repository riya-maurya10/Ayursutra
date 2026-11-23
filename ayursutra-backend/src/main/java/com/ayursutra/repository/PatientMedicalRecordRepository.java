package com.ayursutra.repository;

import com.ayursutra.entity.PatientMedicalRecord;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientMedicalRecordRepository extends MongoRepository<PatientMedicalRecord, String> {

    Optional<PatientMedicalRecord> findByPatientId(String patientId);

    List<PatientMedicalRecord> findByClinicId(String clinicId);
}

package com.ayursutra.repository;

import com.ayursutra.entity.DoctorClinicalNote;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DoctorClinicalNoteRepository extends MongoRepository<DoctorClinicalNote, String> {

    List<DoctorClinicalNote> findByPatientIdOrderByConsultationDateDescConsultationTimeDesc(String patientId);

    List<DoctorClinicalNote> findByDoctorIdOrderByConsultationDateDesc(String doctorId);

    List<DoctorClinicalNote> findByAppointmentId(String appointmentId);

    List<DoctorClinicalNote> findByClinicId(String clinicId);
}

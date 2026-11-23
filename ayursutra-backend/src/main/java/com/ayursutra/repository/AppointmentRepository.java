package com.ayursutra.repository;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.entity.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    List<Appointment> findByClinicIdOrderByAppointmentDateDescStartTimeDesc(String clinicId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(String doctorId);

    List<Appointment> findByDoctorUserIdOrderByAppointmentDateDescStartTimeDesc(String doctorUserId);

    List<Appointment> findByPatientIdOrderByAppointmentDateDescStartTimeDesc(String patientId);

    List<Appointment> findByPatientEmailOrderByAppointmentDateDescStartTimeDesc(String patientEmail);

    List<Appointment> findByTherapistIdOrderByAppointmentDateDescStartTimeDesc(String therapistId);

    List<Appointment> findByAppointmentDateOrderByStartTimeAsc(LocalDate appointmentDate);

    List<Appointment> findByDoctorIdAndAppointmentDate(String doctorId, LocalDate appointmentDate);

    List<Appointment> findByDoctorIdAndAppointmentDateAndStatusNotIn(
            String doctorId,
            LocalDate appointmentDate,
            List<AppointmentStatus> excludedStatuses
    );

    List<Appointment> findByAppointmentDateAndStatusAndReminderSentFalse(
            LocalDate appointmentDate,
            AppointmentStatus status
    );

    List<Appointment> findByAppointmentDateAndStatusInAndArrivalRecordedFalseAndMissedReminderSentFalse(
            LocalDate appointmentDate,
            List<AppointmentStatus> statuses
    );

    long countByClinicId(String clinicId);

    long countByClinicIdAndStatus(String clinicId, AppointmentStatus status);

    long countByClinicIdAndAppointmentDate(String clinicId, LocalDate appointmentDate);

    long countByDoctorIdAndStatus(String doctorId, AppointmentStatus status);

    long countByDoctorIdAndAppointmentDate(String doctorId, LocalDate appointmentDate);
}

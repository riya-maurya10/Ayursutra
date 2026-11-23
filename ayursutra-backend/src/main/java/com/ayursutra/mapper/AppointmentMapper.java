package com.ayursutra.mapper;

import com.ayursutra.dto.response.AppointmentResponse;
import com.ayursutra.entity.Appointment;
import org.springframework.stereotype.Component;

@Component
public class AppointmentMapper {

    public AppointmentResponse toResponse(Appointment entity) {
        if (entity == null) {
            return null;
        }

        return AppointmentResponse.builder()
                .id(entity.getId())
                .clinicId(entity.getClinicId())
                .patientId(entity.getPatientId())
                .patientName(entity.getPatientName())
                .patientEmail(entity.getPatientEmail())
                .patientPhone(entity.getPatientPhone())
                .doctorId(entity.getDoctorId())
                .doctorUserId(entity.getDoctorUserId())
                .doctorName(entity.getDoctorName())
                .doctorSpecialization(entity.getDoctorSpecialization())
                .therapistId(entity.getTherapistId())
                .therapistName(entity.getTherapistName())
                .appointmentType(entity.getAppointmentType())
                .appointmentDate(entity.getAppointmentDate())
                .startTime(entity.getStartTime())
                .endTime(entity.getEndTime())
                .durationMinutes(entity.getDurationMinutes())
                .status(entity.getStatus())
                .notes(entity.getNotes())
                .chiefComplaints(entity.getChiefComplaints())
                .cancellationReason(entity.getCancellationReason())
                .rejectionReason(entity.getRejectionReason())
                .arrivalRecorded(entity.getArrivalRecorded())
                .arrivalTime(entity.getArrivalTime())
                .reminderSent(entity.getReminderSent())
                .bookedByRole(entity.getBookedByRole())
                .bookedByUserId(entity.getBookedByUserId())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

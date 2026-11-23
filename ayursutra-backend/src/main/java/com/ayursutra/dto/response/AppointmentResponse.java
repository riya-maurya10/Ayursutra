package com.ayursutra.dto.response;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.constant.AppointmentType;
import com.ayursutra.constant.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private String id;

    private String clinicId;

    private String patientId;

    private String patientName;

    private String patientEmail;

    private String patientPhone;

    private String doctorId;

    private String doctorUserId;

    private String doctorName;

    private String doctorSpecialization;

    private String therapistId;

    private String therapistName;

    private AppointmentType appointmentType;

    private LocalDate appointmentDate;

    private LocalTime startTime;

    private LocalTime endTime;

    private Integer durationMinutes;

    private AppointmentStatus status;

    private String notes;

    private String chiefComplaints;

    private String cancellationReason;

    private String rejectionReason;

    private Boolean arrivalRecorded;

    private LocalDateTime arrivalTime;

    private Boolean reminderSent;

    private Role bookedByRole;

    private String bookedByUserId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}

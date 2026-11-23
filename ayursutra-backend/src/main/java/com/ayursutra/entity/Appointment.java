package com.ayursutra.entity;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.constant.AppointmentType;
import com.ayursutra.constant.Role;
import lombok.*;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection = "appointments")
public class Appointment extends BaseEntity {

    @Indexed
    @Builder.Default
    private String clinicId = "CLINIC-MAIN";

    @Indexed
    private String patientId;

    private String patientName;

    private String patientEmail;

    private String patientPhone;

    @Indexed
    private String doctorId;

    private String doctorUserId;

    private String doctorName;

    private String doctorSpecialization;

    @Indexed
    private String therapistId;

    private String therapistName;

    private AppointmentType appointmentType;

    @Indexed
    private LocalDate appointmentDate;

    private LocalTime startTime;

    private LocalTime endTime;

    @Builder.Default
    private Integer durationMinutes = 30;

    @Indexed
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.PENDING;

    private String notes;

    private String chiefComplaints;

    private String cancellationReason;

    private String rejectionReason;

    @Builder.Default
    private Boolean arrivalRecorded = false;

    private LocalDateTime arrivalTime;

    @Builder.Default
    private Boolean reminderSent = false;

    @Builder.Default
    private Boolean missedReminderSent = false;

    private Role bookedByRole;

    private String bookedByUserId;
}

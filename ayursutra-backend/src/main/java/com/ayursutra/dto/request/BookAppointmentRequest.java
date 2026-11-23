package com.ayursutra.dto.request;

import com.ayursutra.constant.AppointmentType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookAppointmentRequest {

    private String patientId;

    private String patientName;

    private String patientEmail;

    private String patientPhone;

    @NotNull(message = "Doctor ID is required")
    private String doctorId;

    private String therapistId;

    private String clinicId;

    @NotNull(message = "Appointment type is required")
    private AppointmentType appointmentType;

    @NotNull(message = "Appointment date is required")
    private LocalDate appointmentDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    private Integer durationMinutes;

    private String chiefComplaints;

    private String notes;
}

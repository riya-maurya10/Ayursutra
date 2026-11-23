package com.ayursutra.service;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.dto.request.BookAppointmentRequest;
import com.ayursutra.dto.request.CancelAppointmentRequest;
import com.ayursutra.dto.request.RescheduleAppointmentRequest;
import com.ayursutra.dto.request.UpdateAppointmentStatusRequest;
import com.ayursutra.dto.response.AppointmentResponse;
import com.ayursutra.dto.response.AppointmentStatsResponse;
import com.ayursutra.dto.response.DoctorSlotResponse;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {

    AppointmentResponse bookAppointment(BookAppointmentRequest request);

    AppointmentResponse rescheduleAppointment(String id, RescheduleAppointmentRequest request);

    AppointmentResponse cancelAppointment(String id, CancelAppointmentRequest request);

    AppointmentResponse confirmAppointment(String id);

    AppointmentResponse rejectAppointment(String id, String reason);

    AppointmentResponse recordArrival(String id);

    AppointmentResponse updateStatus(String id, UpdateAppointmentStatusRequest request);

    AppointmentResponse getAppointmentById(String id);

    List<AppointmentResponse> getAppointments(
            String clinicId,
            String doctorId,
            String patientId,
            LocalDate date,
            AppointmentStatus status
    );

    List<AppointmentResponse> getMyAppointments();

    List<DoctorSlotResponse> getAvailableSlots(String doctorId, LocalDate date);

    AppointmentStatsResponse getAppointmentStats(String clinicId);
}

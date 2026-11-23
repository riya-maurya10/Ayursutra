package com.ayursutra.controller;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.dto.request.BookAppointmentRequest;
import com.ayursutra.dto.request.CancelAppointmentRequest;
import com.ayursutra.dto.request.RescheduleAppointmentRequest;
import com.ayursutra.dto.request.UpdateAppointmentStatusRequest;
import com.ayursutra.dto.response.AppointmentResponse;
import com.ayursutra.dto.response.AppointmentStatsResponse;
import com.ayursutra.dto.response.DoctorSlotResponse;
import com.ayursutra.service.AppointmentService;
import com.ayursutra.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;

    @PostMapping
    public ApiResponse<AppointmentResponse> bookAppointment(
            @Valid @RequestBody BookAppointmentRequest request) {

        return new ApiResponse<>(
                true,
                "Appointment booked successfully",
                appointmentService.bookAppointment(request)
        );
    }

    @GetMapping
    public ApiResponse<List<AppointmentResponse>> getAppointments(
            @RequestParam(required = false) String clinicId,
            @RequestParam(required = false) String doctorId,
            @RequestParam(required = false) String patientId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) AppointmentStatus status) {

        return new ApiResponse<>(
                true,
                "Appointments fetched successfully",
                appointmentService.getAppointments(clinicId, doctorId, patientId, date, status)
        );
    }

    @GetMapping("/my")
    public ApiResponse<List<AppointmentResponse>> getMyAppointments() {
        return new ApiResponse<>(
                true,
                "User appointments fetched successfully",
                appointmentService.getMyAppointments()
        );
    }

    @GetMapping("/available-slots")
    public ApiResponse<List<DoctorSlotResponse>> getAvailableSlots(
            @RequestParam String doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        return new ApiResponse<>(
                true,
                "Doctor availability slots fetched successfully",
                appointmentService.getAvailableSlots(doctorId, date)
        );
    }

    @GetMapping("/stats")
    public ApiResponse<AppointmentStatsResponse> getAppointmentStats(
            @RequestParam(required = false) String clinicId) {

        return new ApiResponse<>(
                true,
                "Appointment statistics fetched successfully",
                appointmentService.getAppointmentStats(clinicId)
        );
    }

    @GetMapping("/{id}")
    public ApiResponse<AppointmentResponse> getAppointmentById(
            @PathVariable String id) {

        return new ApiResponse<>(
                true,
                "Appointment details fetched successfully",
                appointmentService.getAppointmentById(id)
        );
    }

    @PutMapping("/{id}/reschedule")
    public ApiResponse<AppointmentResponse> rescheduleAppointment(
            @PathVariable String id,
            @Valid @RequestBody RescheduleAppointmentRequest request) {

        return new ApiResponse<>(
                true,
                "Appointment rescheduled successfully",
                appointmentService.rescheduleAppointment(id, request)
        );
    }

    @PutMapping("/{id}/cancel")
    public ApiResponse<AppointmentResponse> cancelAppointment(
            @PathVariable String id,
            @Valid @RequestBody CancelAppointmentRequest request) {

        return new ApiResponse<>(
                true,
                "Appointment cancelled successfully",
                appointmentService.cancelAppointment(id, request)
        );
    }

    @PutMapping("/{id}/confirm")
    public ApiResponse<AppointmentResponse> confirmAppointment(
            @PathVariable String id) {

        return new ApiResponse<>(
                true,
                "Appointment confirmed successfully",
                appointmentService.confirmAppointment(id)
        );
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<AppointmentResponse> rejectAppointment(
            @PathVariable String id,
            @RequestParam(required = false) String reason) {

        return new ApiResponse<>(
                true,
                "Appointment rejected successfully",
                appointmentService.rejectAppointment(id, reason)
        );
    }

    @PutMapping("/{id}/arrival")
    public ApiResponse<AppointmentResponse> recordArrival(
            @PathVariable String id) {

        return new ApiResponse<>(
                true,
                "Patient arrival recorded successfully",
                appointmentService.recordArrival(id)
        );
    }

    @PutMapping("/{id}/status")
    public ApiResponse<AppointmentResponse> updateStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request) {

        return new ApiResponse<>(
                true,
                "Appointment status updated successfully",
                appointmentService.updateStatus(id, request)
        );
    }
}

package com.ayursutra.service.impl;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.constant.AppointmentType;
import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.BookAppointmentRequest;
import com.ayursutra.dto.request.CancelAppointmentRequest;
import com.ayursutra.dto.request.RescheduleAppointmentRequest;
import com.ayursutra.dto.request.UpdateAppointmentStatusRequest;
import com.ayursutra.dto.response.AppointmentResponse;
import com.ayursutra.dto.response.AppointmentStatsResponse;
import com.ayursutra.dto.response.DoctorSlotResponse;
import com.ayursutra.entity.*;
import com.ayursutra.mapper.AppointmentMapper;
import com.ayursutra.repository.*;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.AppointmentService;
import com.ayursutra.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final TherapistRepository therapistRepository;
    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final ClinicSettingsRepository clinicSettingsRepository;
    private final AppointmentMapper appointmentMapper;
    private final NotificationService notificationService;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            throw new RuntimeException("User is not authenticated");
        }
        return principal.getUser();
    }

    private ClinicSettings getClinicSettings(String clinicId) {
        String targetClinic = (clinicId != null && !clinicId.isBlank()) ? clinicId : "CLINIC-MAIN";
        return clinicSettingsRepository.findByClinicId(targetClinic)
                .orElse(ClinicSettings.builder()
                        .clinicId(targetClinic)
                        .appointmentSlotDurationMinutes(30)
                        .autoConfirmAppointments(false)
                        .build());
    }

    // =========================================================
    // 1. BOOK APPOINTMENT
    // =========================================================
    @Override
    public AppointmentResponse bookAppointment(BookAppointmentRequest request) {
        User currentUser = getAuthenticatedUser();
        Role userRole = currentUser.getRole();

        // 1. Validate Doctor
        Doctor doctor = doctorRepository.findById(request.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + request.getDoctorId()));

        if (!doctor.isAvailable()) {
            throw new RuntimeException("Dr. " + doctor.getFullName() + " is currently unavailable for appointments.");
        }

        // 2. Validate Date
        LocalDate apptDate = request.getAppointmentDate();
        if (apptDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Cannot book appointments in the past.");
        }

        // 3. Resolve Doctor Working Hours & Days
        UserSettings docSettings = doctor.getUserId() != null
                ? userSettingsRepository.findByUserId(doctor.getUserId()).orElse(null)
                : null;

        LocalTime workStart = (docSettings != null && docSettings.getWorkingHoursStart() != null)
                ? LocalTime.parse(docSettings.getWorkingHoursStart())
                : LocalTime.of(9, 0);

        LocalTime workEnd = (docSettings != null && docSettings.getWorkingHoursEnd() != null)
                ? LocalTime.parse(docSettings.getWorkingHoursEnd())
                : LocalTime.of(18, 0);

        List<String> workingDays = (docSettings != null && docSettings.getWorkingDays() != null)
                ? docSettings.getWorkingDays()
                : List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY");

        String dayName = apptDate.getDayOfWeek().name();
        boolean isWorkingDay = workingDays.stream().anyMatch(d -> d.equalsIgnoreCase(dayName));
        if (!isWorkingDay) {
            throw new RuntimeException("Dr. " + doctor.getFullName() + " does not take appointments on " + dayName + "s.");
        }

        // 4. Resolve Duration & End Time
        ClinicSettings clinicSettings = getClinicSettings(request.getClinicId() != null ? request.getClinicId() : doctor.getClinicId());
        int duration = (request.getDurationMinutes() != null && request.getDurationMinutes() > 0)
                ? request.getDurationMinutes()
                : (clinicSettings.getAppointmentSlotDurationMinutes() != null ? clinicSettings.getAppointmentSlotDurationMinutes() : 30);

        LocalTime startTime = request.getStartTime();
        LocalTime endTime = startTime.plusMinutes(duration);

        if (startTime.isBefore(workStart) || endTime.isAfter(workEnd)) {
            throw new RuntimeException("Requested time (" + startTime + " - " + endTime + ") is outside doctor's practicing hours (" + workStart + " - " + workEnd + ").");
        }

        if (apptDate.isEqual(LocalDate.now()) && startTime.isBefore(LocalTime.now())) {
            throw new RuntimeException("Selected appointment time has already passed for today.");
        }

        // 5. Backend Conflict & Overlap Prevention
        List<Appointment> existingAppointments = appointmentRepository.findByDoctorIdAndAppointmentDateAndStatusNotIn(
                doctor.getId(),
                apptDate,
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW)
        );

        for (Appointment existing : existingAppointments) {
            if (startTime.isBefore(existing.getEndTime()) && endTime.isAfter(existing.getStartTime())) {
                throw new RuntimeException("Time slot (" + startTime + " - " + endTime + ") conflicts with an existing appointment (" + existing.getStartTime() + " - " + existing.getEndTime() + "). Please select another slot.");
            }
        }

        // 6. Resolve Patient Information
        String patientId = request.getPatientId();
        String patientName = request.getPatientName();
        String patientEmail = request.getPatientEmail();
        String patientPhone = request.getPatientPhone();

        if (userRole == Role.PATIENT) {
            patientEmail = currentUser.getEmail();
            patientName = currentUser.getFullName();
            patientPhone = currentUser.getPhone();

            // Match or assign patient profile
            Optional<Patient> matchedPatient = patientRepository.findByEmail(currentUser.getEmail())
                    .or(() -> patientRepository.findByUserId(currentUser.getId()));
            if (matchedPatient.isPresent()) {
                patientId = matchedPatient.get().getId();
            } else {
                patientId = currentUser.getId();
            }
        } else if (patientId != null && !patientId.isBlank()) {
            patientRepository.findById(patientId).ifPresent(p -> {
                // If details missing from request, fill from patient record
            });
        }

        if (patientName == null || patientName.isBlank()) {
            patientName = "Guest Patient";
        }

        // 7. Resolve Therapist if assigned
        String therapistName = null;
        if (request.getTherapistId() != null && !request.getTherapistId().isBlank()) {
            therapistName = therapistRepository.findById(request.getTherapistId())
                    .map(Therapist::getFullName)
                    .orElse(null);
        }

        // 8. Auto-confirm logic
        boolean autoConfirm = Boolean.TRUE.equals(clinicSettings.getAutoConfirmAppointments())
                || userRole == Role.ADMIN
                || userRole == Role.RECEPTIONIST;

        AppointmentStatus initialStatus = autoConfirm ? AppointmentStatus.CONFIRMED : AppointmentStatus.PENDING;

        // 9. Create Appointment Entity
        Appointment appointment = Appointment.builder()
                .clinicId(clinicSettings.getClinicId())
                .patientId(patientId)
                .patientName(patientName)
                .patientEmail(patientEmail)
                .patientPhone(patientPhone)
                .doctorId(doctor.getId())
                .doctorUserId(doctor.getUserId())
                .doctorName(doctor.getFullName())
                .doctorSpecialization(doctor.getSpecialization())
                .therapistId(request.getTherapistId())
                .therapistName(therapistName)
                .appointmentType(request.getAppointmentType())
                .appointmentDate(apptDate)
                .startTime(startTime)
                .endTime(endTime)
                .durationMinutes(duration)
                .status(initialStatus)
                .notes(request.getNotes())
                .chiefComplaints(request.getChiefComplaints())
                .arrivalRecorded(false)
                .reminderSent(false)
                .missedReminderSent(false)
                .bookedByRole(userRole)
                .bookedByUserId(currentUser.getId())
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // 10. Notifications
        if (initialStatus == AppointmentStatus.CONFIRMED) {
            // Patient notification
            if (patientId != null) {
                notificationService.sendNotificationToUser(
                        patientId,
                        "Appointment Confirmed",
                        "Your appointment with Dr. " + doctor.getFullName() + " on " + apptDate + " at " + startTime + " is confirmed.",
                        NotificationType.APPOINTMENT_CONFIRMED,
                        "/patient/appointments"
                );
            }
            // Doctor notification
            if (doctor.getUserId() != null) {
                notificationService.sendNotificationToUser(
                        doctor.getUserId(),
                        "New Confirmed Appointment",
                        "Appointment with " + patientName + " confirmed for " + apptDate + " at " + startTime + ".",
                        NotificationType.APPOINTMENT_BOOKED,
                        "/doctor/appointments"
                );
            }
        } else {
            // Pending confirmation
            if (patientId != null) {
                notificationService.sendNotificationToUser(
                        patientId,
                        "Appointment Request Received",
                        "Your appointment request for " + apptDate + " at " + startTime + " is pending confirmation.",
                        NotificationType.APPOINTMENT_BOOKED,
                        "/patient/appointments"
                );
            }
            // Doctor notification
            if (doctor.getUserId() != null) {
                notificationService.sendNotificationToUser(
                        doctor.getUserId(),
                        "New Appointment Request",
                        "New request from " + patientName + " for " + apptDate + " at " + startTime + ".",
                        NotificationType.APPOINTMENT_BOOKED,
                        "/doctor/appointments"
                );
            }
            // Receptionist notification
            notificationService.sendNotificationToRole(
                    Role.RECEPTIONIST,
                    "New Appointment Pending",
                    "Appointment request for Dr. " + doctor.getFullName() + " by " + patientName + " on " + apptDate + ".",
                    NotificationType.APPOINTMENT_BOOKED,
                    "/receptionist/appointments"
            );
        }

        return appointmentMapper.toResponse(saved);
    }

    // =========================================================
    // 2. RESCHEDULE APPOINTMENT
    // =========================================================
    @Override
    public AppointmentResponse rescheduleAppointment(String id, RescheduleAppointmentRequest request) {
        User currentUser = getAuthenticatedUser();
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Completed appointments cannot be rescheduled.");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Cancelled appointments cannot be rescheduled. Please book a new appointment.");
        }

        // Verify authorization
        verifyAppointmentAccess(appointment, currentUser);

        LocalDate newDate = request.getNewDate();
        LocalTime newStartTime = request.getNewStartTime();

        if (newDate.isBefore(LocalDate.now())) {
            throw new RuntimeException("Cannot reschedule to a past date.");
        }

        // Resolve doctor hours & conflict
        Doctor doctor = doctorRepository.findById(appointment.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found for appointment"));

        UserSettings docSettings = doctor.getUserId() != null
                ? userSettingsRepository.findByUserId(doctor.getUserId()).orElse(null)
                : null;

        LocalTime workStart = (docSettings != null && docSettings.getWorkingHoursStart() != null)
                ? LocalTime.parse(docSettings.getWorkingHoursStart())
                : LocalTime.of(9, 0);

        LocalTime workEnd = (docSettings != null && docSettings.getWorkingHoursEnd() != null)
                ? LocalTime.parse(docSettings.getWorkingHoursEnd())
                : LocalTime.of(18, 0);

        int duration = (request.getDurationMinutes() != null && request.getDurationMinutes() > 0)
                ? request.getDurationMinutes()
                : (appointment.getDurationMinutes() != null ? appointment.getDurationMinutes() : 30);

        LocalTime newEndTime = newStartTime.plusMinutes(duration);

        if (newStartTime.isBefore(workStart) || newEndTime.isAfter(workEnd)) {
            throw new RuntimeException("Requested time (" + newStartTime + " - " + newEndTime + ") is outside doctor's practicing hours (" + workStart + " - " + workEnd + ").");
        }

        // Conflict check excluding current appointment
        List<Appointment> existingAppointments = appointmentRepository.findByDoctorIdAndAppointmentDateAndStatusNotIn(
                doctor.getId(),
                newDate,
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW)
        );

        for (Appointment existing : existingAppointments) {
            if (!existing.getId().equals(appointment.getId())) {
                if (newStartTime.isBefore(existing.getEndTime()) && newEndTime.isAfter(existing.getStartTime())) {
                    throw new RuntimeException("New slot conflicts with another appointment (" + existing.getStartTime() + " - " + existing.getEndTime() + ").");
                }
            }
        }

        appointment.setAppointmentDate(newDate);
        appointment.setStartTime(newStartTime);
        appointment.setEndTime(newEndTime);
        appointment.setDurationMinutes(duration);
        appointment.setStatus(AppointmentStatus.RESCHEDULED);
        appointment.setReminderSent(false);
        appointment.setMissedReminderSent(false);

        if (request.getReason() != null && !request.getReason().isBlank()) {
            String existingNotes = appointment.getNotes();
            appointment.setNotes((existingNotes == null || existingNotes.isBlank())
                    ? "Rescheduled: " + request.getReason()
                    : existingNotes + " | Rescheduled: " + request.getReason());
        }

        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient
        if (saved.getPatientId() != null) {
            notificationService.sendNotificationToUser(
                    saved.getPatientId(),
                    "Appointment Rescheduled",
                    "Your appointment with Dr. " + saved.getDoctorName() + " has been rescheduled to " + newDate + " at " + newStartTime + ".",
                    NotificationType.APPOINTMENT_RESCHEDULED,
                    "/patient/appointments"
            );
        }

        // Notify doctor
        if (saved.getDoctorUserId() != null) {
            notificationService.sendNotificationToUser(
                    saved.getDoctorUserId(),
                    "Appointment Rescheduled",
                    "Appointment with " + saved.getPatientName() + " rescheduled to " + newDate + " at " + newStartTime + ".",
                    NotificationType.APPOINTMENT_RESCHEDULED,
                    "/doctor/appointments"
            );
        }

        return appointmentMapper.toResponse(saved);
    }

    // =========================================================
    // 3. CANCEL APPOINTMENT
    // =========================================================
    @Override
    public AppointmentResponse cancelAppointment(String id, CancelAppointmentRequest request) {
        User currentUser = getAuthenticatedUser();
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Completed appointments cannot be cancelled.");
        }

        verifyAppointmentAccess(appointment, currentUser);

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancellationReason(request.getReason());
        Appointment saved = appointmentRepository.save(appointment);

        // Notify patient
        if (saved.getPatientId() != null && !currentUser.getId().equals(saved.getPatientId())) {
            notificationService.sendNotificationToUser(
                    saved.getPatientId(),
                    "Appointment Cancelled",
                    "Your appointment on " + saved.getAppointmentDate() + " with Dr. " + saved.getDoctorName() + " was cancelled. Reason: " + request.getReason(),
                    NotificationType.APPOINTMENT_CANCELLED,
                    "/patient/appointments"
            );
        }

        // Notify doctor
        if (saved.getDoctorUserId() != null && !currentUser.getId().equals(saved.getDoctorUserId())) {
            notificationService.sendNotificationToUser(
                    saved.getDoctorUserId(),
                    "Appointment Cancelled",
                    "Appointment with " + saved.getPatientName() + " on " + saved.getAppointmentDate() + " was cancelled. Reason: " + request.getReason(),
                    NotificationType.APPOINTMENT_CANCELLED,
                    "/doctor/appointments"
            );
        }

        return appointmentMapper.toResponse(saved);
    }

    // =========================================================
    // 4. CONFIRM APPOINTMENT
    // =========================================================
    @Override
    public AppointmentResponse confirmAppointment(String id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        appointment.setStatus(AppointmentStatus.CONFIRMED);
        Appointment saved = appointmentRepository.save(appointment);

        if (saved.getPatientId() != null) {
            notificationService.sendNotificationToUser(
                    saved.getPatientId(),
                    "Appointment Confirmed",
                    "Your appointment with Dr. " + saved.getDoctorName() + " on " + saved.getAppointmentDate() + " at " + saved.getStartTime() + " is confirmed.",
                    NotificationType.APPOINTMENT_CONFIRMED,
                    "/patient/appointments"
            );
        }

        return appointmentMapper.toResponse(saved);
    }

    // =========================================================
    // 5. REJECT APPOINTMENT
    // =========================================================
    @Override
    public AppointmentResponse rejectAppointment(String id, String reason) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setRejectionReason(reason != null && !reason.isBlank() ? reason : "Declined by clinic.");
        Appointment saved = appointmentRepository.save(appointment);

        if (saved.getPatientId() != null) {
            notificationService.sendNotificationToUser(
                    saved.getPatientId(),
                    "Appointment Request Declined",
                    "Your appointment request for " + saved.getAppointmentDate() + " was declined. Reason: " + saved.getRejectionReason(),
                    NotificationType.APPOINTMENT_REJECTED,
                    "/patient/appointments"
            );
        }

        return appointmentMapper.toResponse(saved);
    }

    // =========================================================
    // 6. RECORD PATIENT ARRIVAL
    // =========================================================
    @Override
    public AppointmentResponse recordArrival(String id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        appointment.setArrivalRecorded(true);
        appointment.setArrivalTime(LocalDateTime.now());
        Appointment saved = appointmentRepository.save(appointment);

        if (saved.getDoctorUserId() != null) {
            notificationService.sendNotificationToUser(
                    saved.getDoctorUserId(),
                    "Patient Arrived",
                    "Patient " + saved.getPatientName() + " has arrived at clinic for the " + saved.getStartTime() + " consultation.",
                    NotificationType.PATIENT_ARRIVAL,
                    "/doctor/appointments"
            );
        }

        return appointmentMapper.toResponse(saved);
    }

    // =========================================================
    // 7. UPDATE STATUS (COMPLETED / NO_SHOW)
    // =========================================================
    @Override
    public AppointmentResponse updateStatus(String id, UpdateAppointmentStatusRequest request) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));

        appointment.setStatus(request.getStatus());

        if (request.getNotes() != null && !request.getNotes().isBlank()) {
            String existingNotes = appointment.getNotes();
            appointment.setNotes((existingNotes == null || existingNotes.isBlank())
                    ? request.getNotes()
                    : existingNotes + " | " + request.getNotes());
        }

        if (request.getRejectionReason() != null) {
            appointment.setRejectionReason(request.getRejectionReason());
        }

        Appointment saved = appointmentRepository.save(appointment);
        return appointmentMapper.toResponse(saved);
    }

    // =========================================================
    // 8. GET APPOINTMENT BY ID
    // =========================================================
    @Override
    public AppointmentResponse getAppointmentById(String id) {
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found with ID: " + id));
        return appointmentMapper.toResponse(appointment);
    }

    // =========================================================
    // 9. GET ALL WITH FILTERS
    // =========================================================
    @Override
    public List<AppointmentResponse> getAppointments(
            String clinicId,
            String doctorId,
            String patientId,
            LocalDate date,
            AppointmentStatus status) {

        List<Appointment> list = appointmentRepository.findAll();

        return list.stream()
                .filter(a -> clinicId == null || clinicId.isBlank() || Objects.equals(a.getClinicId(), clinicId))
                .filter(a -> doctorId == null || doctorId.isBlank() || Objects.equals(a.getDoctorId(), doctorId))
                .filter(a -> patientId == null || patientId.isBlank() || Objects.equals(a.getPatientId(), patientId))
                .filter(a -> date == null || Objects.equals(a.getAppointmentDate(), date))
                .filter(a -> status == null || a.getStatus() == status)
                .sorted(Comparator.comparing(Appointment::getAppointmentDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Appointment::getStartTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    // =========================================================
    // 10. GET MY APPOINTMENTS (ROLE-BASED SCOPING)
    // =========================================================
    @Override
    public List<AppointmentResponse> getMyAppointments() {
        User currentUser = getAuthenticatedUser();
        Role role = currentUser.getRole();

        List<Appointment> results;

        if (role == Role.PATIENT) {
            // Find by patientId or patient email
            List<Appointment> byId = appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(currentUser.getId());
            List<Appointment> byEmail = appointmentRepository.findByPatientEmailOrderByAppointmentDateDescStartTimeDesc(currentUser.getEmail());

            Map<String, Appointment> dedup = new LinkedHashMap<>();
            byId.forEach(a -> dedup.put(a.getId(), a));
            byEmail.forEach(a -> dedup.put(a.getId(), a));

            // Also check Patient entity if patientId differs
            patientRepository.findByEmail(currentUser.getEmail()).ifPresent(p -> {
                appointmentRepository.findByPatientIdOrderByAppointmentDateDescStartTimeDesc(p.getId())
                        .forEach(a -> dedup.put(a.getId(), a));
            });

            results = new ArrayList<>(dedup.values());
            results.sort(Comparator.comparing(Appointment::getAppointmentDate, Comparator.nullsLast(Comparator.reverseOrder()))
                    .thenComparing(Appointment::getStartTime, Comparator.nullsLast(Comparator.reverseOrder())));

        } else if (role == Role.DOCTOR) {
            Doctor doc = doctorRepository.findByUserId(currentUser.getId())
                    .or(() -> doctorRepository.findByEmail(currentUser.getEmail()))
                    .orElse(null);

            if (doc != null) {
                results = appointmentRepository.findByDoctorIdOrderByAppointmentDateDescStartTimeDesc(doc.getId());
            } else {
                results = appointmentRepository.findByDoctorUserIdOrderByAppointmentDateDescStartTimeDesc(currentUser.getId());
            }

        } else if (role == Role.THERAPIST) {
            Therapist th = therapistRepository.findByUserId(currentUser.getId())
                    .or(() -> therapistRepository.findByEmail(currentUser.getEmail()))
                    .orElse(null);

            if (th != null) {
                results = appointmentRepository.findByTherapistIdOrderByAppointmentDateDescStartTimeDesc(th.getId());
            } else {
                results = Collections.emptyList();
            }

        } else {
            // ADMIN or RECEPTIONIST: view clinic appointments
            results = appointmentRepository.findByClinicIdOrderByAppointmentDateDescStartTimeDesc("CLINIC-MAIN");
            if (results.isEmpty()) {
                results = appointmentRepository.findAll();
            }
        }

        return results.stream().map(appointmentMapper::toResponse).toList();
    }

    // =========================================================
    // 11. GET AVAILABLE SLOTS FOR DOCTOR ON GIVEN DATE
    // =========================================================
    @Override
    public List<DoctorSlotResponse> getAvailableSlots(String doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with ID: " + doctorId));

        if (!doctor.isAvailable()) {
            return Collections.emptyList();
        }

        UserSettings docSettings = doctor.getUserId() != null
                ? userSettingsRepository.findByUserId(doctor.getUserId()).orElse(null)
                : null;

        LocalTime workStart = (docSettings != null && docSettings.getWorkingHoursStart() != null)
                ? LocalTime.parse(docSettings.getWorkingHoursStart())
                : LocalTime.of(9, 0);

        LocalTime workEnd = (docSettings != null && docSettings.getWorkingHoursEnd() != null)
                ? LocalTime.parse(docSettings.getWorkingHoursEnd())
                : LocalTime.of(18, 0);

        List<String> workingDays = (docSettings != null && docSettings.getWorkingDays() != null)
                ? docSettings.getWorkingDays()
                : List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY");

        String dayName = date.getDayOfWeek().name();
        boolean isWorkingDay = workingDays.stream().anyMatch(d -> d.equalsIgnoreCase(dayName));

        ClinicSettings clinicSettings = getClinicSettings(doctor.getClinicId());
        int slotDuration = (clinicSettings.getAppointmentSlotDurationMinutes() != null && clinicSettings.getAppointmentSlotDurationMinutes() > 0)
                ? clinicSettings.getAppointmentSlotDurationMinutes()
                : 30;

        List<Appointment> activeBookings = appointmentRepository.findByDoctorIdAndAppointmentDateAndStatusNotIn(
                doctorId,
                date,
                List.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW)
        );

        List<DoctorSlotResponse> slots = new ArrayList<>();
        LocalTime current = workStart;
        LocalDate today = LocalDate.now();
        LocalTime nowTime = LocalTime.now();

        while (current.plusMinutes(slotDuration).isBefore(workEnd) || current.plusMinutes(slotDuration).equals(workEnd)) {
            LocalTime slotStart = current;
            LocalTime slotEnd = current.plusMinutes(slotDuration);

            boolean isAvailable = true;
            String reason = "Available";

            if (!isWorkingDay) {
                isAvailable = false;
                reason = "Doctor off-duty on " + dayName + "s";
            } else if (date.isBefore(today)) {
                isAvailable = false;
                reason = "Past date";
            } else if (date.isEqual(today) && slotStart.isBefore(nowTime)) {
                isAvailable = false;
                reason = "Time passed";
            } else {
                // Check booking collision
                boolean booked = activeBookings.stream().anyMatch(b ->
                        slotStart.isBefore(b.getEndTime()) && slotEnd.isAfter(b.getStartTime())
                );
                if (booked) {
                    isAvailable = false;
                    reason = "Booked";
                }
            }

            slots.add(DoctorSlotResponse.builder()
                    .startTime(slotStart)
                    .endTime(slotEnd)
                    .available(isAvailable)
                    .reason(reason)
                    .build());

            current = current.plusMinutes(slotDuration);
        }

        return slots;
    }

    // =========================================================
    // 12. APPOINTMENT STATISTICS
    // =========================================================
    @Override
    public AppointmentStatsResponse getAppointmentStats(String clinicId) {
        String targetClinic = (clinicId != null && !clinicId.isBlank()) ? clinicId : "CLINIC-MAIN";

        long total = appointmentRepository.countByClinicId(targetClinic);
        if (total == 0) {
            total = appointmentRepository.count();
        }

        long pending = appointmentRepository.countByClinicIdAndStatus(targetClinic, AppointmentStatus.PENDING);
        long confirmed = appointmentRepository.countByClinicIdAndStatus(targetClinic, AppointmentStatus.CONFIRMED);
        long completed = appointmentRepository.countByClinicIdAndStatus(targetClinic, AppointmentStatus.COMPLETED);
        long cancelled = appointmentRepository.countByClinicIdAndStatus(targetClinic, AppointmentStatus.CANCELLED);
        long rescheduled = appointmentRepository.countByClinicIdAndStatus(targetClinic, AppointmentStatus.RESCHEDULED);
        long noShow = appointmentRepository.countByClinicIdAndStatus(targetClinic, AppointmentStatus.NO_SHOW);
        long todayCount = appointmentRepository.countByClinicIdAndAppointmentDate(targetClinic, LocalDate.now());

        return AppointmentStatsResponse.builder()
                .total(total)
                .pending(pending)
                .confirmed(confirmed)
                .completed(completed)
                .cancelled(cancelled)
                .rescheduled(rescheduled)
                .noShow(noShow)
                .todayCount(todayCount)
                .build();
    }

    private void verifyAppointmentAccess(Appointment appointment, User user) {
        Role role = user.getRole();
        if (role == Role.ADMIN || role == Role.RECEPTIONIST) {
            return;
        }

        if (role == Role.DOCTOR) {
            if (Objects.equals(appointment.getDoctorUserId(), user.getId())) {
                return;
            }
            Doctor doc = doctorRepository.findByUserId(user.getId()).orElse(null);
            if (doc != null && Objects.equals(appointment.getDoctorId(), doc.getId())) {
                return;
            }
        }

        if (role == Role.PATIENT) {
            if (Objects.equals(appointment.getPatientId(), user.getId())
                    || Objects.equals(appointment.getPatientEmail(), user.getEmail())) {
                return;
            }
            Patient p = patientRepository.findByEmail(user.getEmail()).orElse(null);
            if (p != null && Objects.equals(appointment.getPatientId(), p.getId())) {
                return;
            }
        }

        throw new RuntimeException("Unauthorized: You do not have permission to modify this appointment.");
    }
}

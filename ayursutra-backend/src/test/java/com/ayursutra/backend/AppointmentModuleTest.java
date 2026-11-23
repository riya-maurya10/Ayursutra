package com.ayursutra.backend;

import com.ayursutra.constant.AppointmentStatus;
import com.ayursutra.constant.AppointmentType;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.BookAppointmentRequest;
import com.ayursutra.dto.request.CancelAppointmentRequest;
import com.ayursutra.dto.request.RescheduleAppointmentRequest;
import com.ayursutra.dto.response.AppointmentResponse;
import com.ayursutra.dto.response.DoctorSlotResponse;
import com.ayursutra.entity.*;
import com.ayursutra.mapper.AppointmentMapper;
import com.ayursutra.repository.*;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.NotificationService;
import com.ayursutra.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentModuleTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private TherapistRepository therapistRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserSettingsRepository userSettingsRepository;
    @Mock
    private ClinicSettingsRepository clinicSettingsRepository;
    @Mock
    private NotificationService notificationService;

    private AppointmentMapper appointmentMapper;
    private AppointmentServiceImpl appointmentService;

    private final String PATIENT_USER_ID = "USR-PATIENT-1";
    private final String DOCTOR_ID = "DOC-1";
    private final String DOCTOR_USER_ID = "USR-DOC-1";

    @BeforeEach
    void setUp() {
        appointmentMapper = new AppointmentMapper();
        appointmentService = new AppointmentServiceImpl(
                appointmentRepository,
                doctorRepository,
                patientRepository,
                therapistRepository,
                userRepository,
                userSettingsRepository,
                clinicSettingsRepository,
                appointmentMapper,
                notificationService
        );

        User patientUser = new User();
        patientUser.setId(PATIENT_USER_ID);
        patientUser.setEmail("patient@ayursutra.com");
        patientUser.setFullName("Rahul Sharma");
        patientUser.setRole(Role.PATIENT);
        patientUser.setPhone("+91 98765 43210");

        UserPrincipal principal = new UserPrincipal(patientUser);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("bookAppointment succeeds when slot is valid and no conflicts exist")
    void testBookAppointment_Success() {
        Doctor doc = new Doctor();
        doc.setId(DOCTOR_ID);
        doc.setUserId(DOCTOR_USER_ID);
        doc.setFullName("Dr. Rajesh Sharma");
        doc.setSpecialization("Panchakarma Specialist");
        doc.setAvailable(true);
        doc.setClinicId("CLINIC-MAIN");

        when(doctorRepository.findById(DOCTOR_ID)).thenReturn(Optional.of(doc));
        when(clinicSettingsRepository.findByClinicId("CLINIC-MAIN")).thenReturn(Optional.empty());
        when(userSettingsRepository.findByUserId(DOCTOR_USER_ID)).thenReturn(Optional.empty());
        when(appointmentRepository.findByDoctorIdAndAppointmentDateAndStatusNotIn(any(), any(), any()))
                .thenReturn(List.of());
        when(appointmentRepository.save(any(Appointment.class)))
                .thenAnswer(inv -> {
                    Appointment a = inv.getArgument(0);
                    a.setId("APPT-100");
                    return a;
                });

        LocalDate targetDate = LocalDate.now().plusDays(2);
        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .doctorId(DOCTOR_ID)
                .appointmentType(AppointmentType.INITIAL_CONSULTATION)
                .appointmentDate(targetDate)
                .startTime(LocalTime.of(10, 0))
                .durationMinutes(30)
                .chiefComplaints("Back pain")
                .build();

        AppointmentResponse response = appointmentService.bookAppointment(request);

        assertNotNull(response);
        assertEquals("APPT-100", response.getId());
        assertEquals("Rahul Sharma", response.getPatientName());
        assertEquals("Dr. Rajesh Sharma", response.getDoctorName());
        assertEquals(LocalTime.of(10, 0), response.getStartTime());
        assertEquals(LocalTime.of(10, 30), response.getEndTime());
        assertEquals(AppointmentStatus.PENDING, response.getStatus());
        verify(appointmentRepository, times(1)).save(any(Appointment.class));
    }

    @Test
    @DisplayName("bookAppointment rejects booking when doctor has overlapping appointment")
    void testBookAppointment_ConflictRejected() {
        Doctor doc = new Doctor();
        doc.setId(DOCTOR_ID);
        doc.setUserId(DOCTOR_USER_ID);
        doc.setFullName("Dr. Rajesh Sharma");
        doc.setAvailable(true);

        when(doctorRepository.findById(DOCTOR_ID)).thenReturn(Optional.of(doc));
        when(clinicSettingsRepository.findByClinicId(any())).thenReturn(Optional.empty());

        LocalDate targetDate = LocalDate.now().plusDays(2);

        Appointment conflict = new Appointment();
        conflict.setId("EXISTING-1");
        conflict.setStartTime(LocalTime.of(10, 0));
        conflict.setEndTime(LocalTime.of(10, 30));
        conflict.setStatus(AppointmentStatus.CONFIRMED);

        when(appointmentRepository.findByDoctorIdAndAppointmentDateAndStatusNotIn(any(), any(), any()))
                .thenReturn(List.of(conflict));

        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .doctorId(DOCTOR_ID)
                .appointmentType(AppointmentType.FOLLOW_UP)
                .appointmentDate(targetDate)
                .startTime(LocalTime.of(10, 15)) // overlaps 10:00 - 10:30!
                .durationMinutes(30)
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                appointmentService.bookAppointment(request)
        );

        assertTrue(ex.getMessage().contains("conflicts with an existing appointment"));
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("bookAppointment rejects booking when doctor is unavailable")
    void testBookAppointment_DoctorUnavailable() {
        Doctor doc = new Doctor();
        doc.setId(DOCTOR_ID);
        doc.setAvailable(false); // marked unavailable

        when(doctorRepository.findById(DOCTOR_ID)).thenReturn(Optional.of(doc));

        BookAppointmentRequest request = BookAppointmentRequest.builder()
                .doctorId(DOCTOR_ID)
                .appointmentType(AppointmentType.INITIAL_CONSULTATION)
                .appointmentDate(LocalDate.now().plusDays(1))
                .startTime(LocalTime.of(10, 0))
                .build();

        assertThrows(RuntimeException.class, () ->
                appointmentService.bookAppointment(request)
        );
        verify(appointmentRepository, never()).save(any());
    }

    @Test
    @DisplayName("getAvailableSlots marks overlapping slots as booked")
    void testGetAvailableSlots() {
        Doctor doc = new Doctor();
        doc.setId(DOCTOR_ID);
        doc.setUserId(DOCTOR_USER_ID);
        doc.setAvailable(true);

        when(doctorRepository.findById(DOCTOR_ID)).thenReturn(Optional.of(doc));
        when(clinicSettingsRepository.findByClinicId(any())).thenReturn(Optional.empty());

        LocalDate futureDate = LocalDate.now().plusDays(3);

        Appointment booked = new Appointment();
        booked.setStartTime(LocalTime.of(11, 0));
        booked.setEndTime(LocalTime.of(11, 30));
        booked.setStatus(AppointmentStatus.CONFIRMED);

        when(appointmentRepository.findByDoctorIdAndAppointmentDateAndStatusNotIn(any(), any(), any()))
                .thenReturn(List.of(booked));

        List<DoctorSlotResponse> slots = appointmentService.getAvailableSlots(DOCTOR_ID, futureDate);

        assertNotNull(slots);
        assertFalse(slots.isEmpty());

        DoctorSlotResponse slot10 = slots.stream()
                .filter(s -> s.getStartTime().equals(LocalTime.of(10, 0)))
                .findFirst().orElse(null);
        assertNotNull(slot10);
        assertTrue(slot10.getAvailable());

        DoctorSlotResponse slot11 = slots.stream()
                .filter(s -> s.getStartTime().equals(LocalTime.of(11, 0)))
                .findFirst().orElse(null);
        assertNotNull(slot11);
        assertFalse(slot11.getAvailable());
        assertEquals("Booked", slot11.getReason());
    }

    @Test
    @DisplayName("cancelAppointment updates status and records cancellation reason")
    void testCancelAppointment() {
        Appointment appt = new Appointment();
        appt.setId("APPT-200");
        appt.setPatientId(PATIENT_USER_ID);
        appt.setDoctorUserId(DOCTOR_USER_ID);
        appt.setStatus(AppointmentStatus.CONFIRMED);
        appt.setAppointmentDate(LocalDate.now().plusDays(1));

        when(appointmentRepository.findById("APPT-200")).thenReturn(Optional.of(appt));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        CancelAppointmentRequest req = CancelAppointmentRequest.builder()
                .reason("Schedule conflict")
                .build();

        AppointmentResponse response = appointmentService.cancelAppointment("APPT-200", req);

        assertNotNull(response);
        assertEquals(AppointmentStatus.CANCELLED, response.getStatus());
        assertEquals("Schedule conflict", response.getCancellationReason());
        verify(appointmentRepository, times(1)).save(appt);
    }

    @Test
    @DisplayName("recordArrival sets arrival flag and timestamp")
    void testRecordArrival() {
        Appointment appt = new Appointment();
        appt.setId("APPT-300");
        appt.setArrivalRecorded(false);
        appt.setDoctorUserId(DOCTOR_USER_ID);

        when(appointmentRepository.findById("APPT-300")).thenReturn(Optional.of(appt));
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(inv -> inv.getArgument(0));

        AppointmentResponse response = appointmentService.recordArrival("APPT-300");

        assertNotNull(response);
        assertTrue(response.getArrivalRecorded());
        assertNotNull(response.getArrivalTime());
        verify(appointmentRepository, times(1)).save(appt);
    }
}

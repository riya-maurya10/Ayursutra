package com.ayursutra.backend;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.TherapySessionStatus;
import com.ayursutra.dto.request.PatientProgressRequest;
import com.ayursutra.dto.response.PatientProgressResponse;
import com.ayursutra.entity.*;
import com.ayursutra.mapper.PatientProgressMapper;
import com.ayursutra.repository.*;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.impl.PatientProgressServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TherapistPatientProgressIntegrationTest {

    @Mock
    private PatientProgressRepository patientProgressRepository;

    private PatientProgressMapper patientProgressMapper = new PatientProgressMapper();

    @Mock
    private PatientRepository patientRepository;

    @Mock
    private TherapyPlanRepository therapyPlanRepository;

    @Mock
    private TherapySessionRepository therapySessionRepository;

    @Mock
    private TherapistRepository therapistRepository;

    @Mock
    private DoctorRepository doctorRepository;

    @Mock
    private UserRepository userRepository;

    private PatientProgressServiceImpl progressService;

    private Patient patient;
    private TherapyPlan plan;
    private TherapySession completedSession;
    private TherapySession scheduledSession;
    private Therapist therapist;
    private User therapistUser;
    private Doctor doctor;
    private User doctorUser;
    private User patientUser;

    @BeforeEach
    void setUp() {
        progressService = new PatientProgressServiceImpl(
                patientProgressRepository,
                patientProgressMapper,
                patientRepository,
                therapyPlanRepository,
                therapySessionRepository,
                therapistRepository,
                doctorRepository,
                userRepository
        );

        patient = new Patient();
        patient.setId("PAT-001");
        patient.setUserId("USR-PAT-001");
        patient.setFullName("Rahul Sharma");
        patient.setEmail("rahul.sharma@example.com");

        plan = new TherapyPlan();
        plan.setId("PLAN-001");
        plan.setPatientId("PAT-001");
        plan.setPlanName("Panchakarma Detox 7 Days");

        therapist = new Therapist();
        therapist.setId("THER-001");
        therapist.setUserId("USR-THER-001");
        therapist.setFullName("Ankit Verma");
        therapist.setEmail("ankit.therapist@ayursutra.com");

        therapistUser = new User();
        therapistUser.setId("USR-THER-001");
        therapistUser.setEmail("ankit.therapist@ayursutra.com");
        therapistUser.setFullName("Ankit Verma");
        therapistUser.setRole(Role.THERAPIST);
        therapistUser.setEnabled(true);

        doctor = new Doctor();
        doctor.setId("DOC-001");
        doctor.setUserId("USR-DOC-001");
        doctor.setFullName("Dr. Rajesh Sharma");
        doctor.setEmail("dr.rajesh@ayursutra.com");

        doctorUser = new User();
        doctorUser.setId("USR-DOC-001");
        doctorUser.setEmail("dr.rajesh@ayursutra.com");
        doctorUser.setFullName("Dr. Rajesh Sharma");
        doctorUser.setRole(Role.DOCTOR);
        doctorUser.setEnabled(true);

        patientUser = new User();
        patientUser.setId("USR-PAT-001");
        patientUser.setEmail("rahul.sharma@example.com");
        patientUser.setFullName("Rahul Sharma");
        patientUser.setRole(Role.PATIENT);
        patientUser.setEnabled(true);

        completedSession = new TherapySession();
        completedSession.setId("SESS-001");
        completedSession.setPatientId("PAT-001");
        completedSession.setTherapyPlanId("PLAN-001");
        completedSession.setTherapistId("THER-001");
        completedSession.setTherapyName("Abhyanga & Swedana");
        completedSession.setDayNumber(1);
        completedSession.setSessionDate(LocalDate.now());
        completedSession.setStatus(TherapySessionStatus.COMPLETED);

        scheduledSession = new TherapySession();
        scheduledSession.setId("SESS-002");
        scheduledSession.setPatientId("PAT-001");
        scheduledSession.setTherapyPlanId("PLAN-001");
        scheduledSession.setTherapistId("THER-001");
        scheduledSession.setTherapyName("Shirodhara");
        scheduledSession.setDayNumber(2);
        scheduledSession.setSessionDate(LocalDate.now().plusDays(1));
        scheduledSession.setStatus(TherapySessionStatus.SCHEDULED);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateUser(User user) {
        UserPrincipal principal = new UserPrincipal(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @Test
    @DisplayName("Therapist adds progress assessment for COMPLETED session successfully")
    void testTherapistAddsAssessmentForCompletedSession() {
        authenticateUser(therapistUser);

        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(therapyPlanRepository.findById("PLAN-001")).thenReturn(Optional.of(plan));
        when(therapySessionRepository.findById("SESS-001")).thenReturn(Optional.of(completedSession));
        when(patientProgressRepository.findByTherapySessionId("SESS-001")).thenReturn(Optional.empty());
        when(therapistRepository.findByUserId("USR-THER-001")).thenReturn(Optional.of(therapist));
        when(patientProgressRepository.save(any(PatientProgress.class))).thenAnswer(invocation -> {
            PatientProgress p = invocation.getArgument(0);
            p.setId("PROG-001");
            return p;
        });

        PatientProgressRequest req = PatientProgressRequest.builder()
                .patientId("PAT-001")
                .therapyPlanId("PLAN-001")
                .therapySessionId("SESS-001")
                .assessmentDate(LocalDate.now())
                .dayNumber(1)
                .symptoms("Mild lower back stiffness")
                .observations("Patient relaxed during sesame oil massage, good perspiration")
                .therapyResponse("Positive, stiffness reduced by 50%")
                .discomfortSideEffects("None reported")
                .practitionerNotes("Recommend continuing with Swedana temperature at 40C")
                .build();

        PatientProgressResponse res = progressService.createProgress(req);

        assertNotNull(res);
        assertEquals("PROG-001", res.getId());
        assertEquals("SESS-001", res.getTherapySessionId());
        assertEquals("Abhyanga & Swedana", res.getTherapyName());
        assertEquals("THER-001", res.getAssessedByTherapistId());
        assertEquals("Ankit Verma", res.getAssessedByTherapistName());
        assertNull(res.getImprovementPercentage(), "Therapist does not set clinical improvement percentage");
    }

    @Test
    @DisplayName("Therapist cannot assess an incomplete (SCHEDULED) session")
    void testTherapistCannotAssessIncompleteSession() {
        authenticateUser(therapistUser);

        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(therapyPlanRepository.findById("PLAN-001")).thenReturn(Optional.of(plan));
        when(therapySessionRepository.findById("SESS-002")).thenReturn(Optional.of(scheduledSession));

        PatientProgressRequest req = PatientProgressRequest.builder()
                .patientId("PAT-001")
                .therapyPlanId("PLAN-001")
                .therapySessionId("SESS-002")
                .assessmentDate(LocalDate.now())
                .dayNumber(2)
                .symptoms("None")
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> progressService.createProgress(req));
        assertTrue(ex.getMessage().contains("completed therapy sessions"));
    }

    @Test
    @DisplayName("Therapist cannot assess session assigned to another therapist")
    void testTherapistCannotAssessAnotherTherapistsSession() {
        authenticateUser(therapistUser);

        completedSession.setTherapistId("OTHER-THERAPIST-999");

        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(therapyPlanRepository.findById("PLAN-001")).thenReturn(Optional.of(plan));
        when(therapySessionRepository.findById("SESS-001")).thenReturn(Optional.of(completedSession));
        when(therapistRepository.findByUserId("USR-THER-001")).thenReturn(Optional.of(therapist));

        PatientProgressRequest req = PatientProgressRequest.builder()
                .patientId("PAT-001")
                .therapyPlanId("PLAN-001")
                .therapySessionId("SESS-001")
                .assessmentDate(LocalDate.now())
                .dayNumber(1)
                .build();

        assertThrows(AccessDeniedException.class, () -> progressService.createProgress(req));
    }

    @Test
    @DisplayName("Therapist cannot assess unassigned session (therapistId is null or empty)")
    void testTherapistCannotAssessUnassignedSession() {
        authenticateUser(therapistUser);

        completedSession.setTherapistId(null);

        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(therapyPlanRepository.findById("PLAN-001")).thenReturn(Optional.of(plan));
        when(therapySessionRepository.findById("SESS-001")).thenReturn(Optional.of(completedSession));
        when(therapistRepository.findByUserId("USR-THER-001")).thenReturn(Optional.of(therapist));

        PatientProgressRequest req = PatientProgressRequest.builder()
                .patientId("PAT-001")
                .therapyPlanId("PLAN-001")
                .therapySessionId("SESS-001")
                .assessmentDate(LocalDate.now())
                .dayNumber(1)
                .build();

        assertThrows(AccessDeniedException.class, () -> progressService.createProgress(req));
    }

    @Test
    @DisplayName("Therapist assigned via userId matches successfully")
    void testTherapistAssignedByUserIdMatchesSuccessfully() {
        authenticateUser(therapistUser);

        // Session stores userId instead of therapist document ID
        completedSession.setTherapistId("USR-THER-001");

        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(therapyPlanRepository.findById("PLAN-001")).thenReturn(Optional.of(plan));
        when(therapySessionRepository.findById("SESS-001")).thenReturn(Optional.of(completedSession));
        when(patientProgressRepository.findByTherapySessionId("SESS-001")).thenReturn(Optional.empty());
        when(therapistRepository.findByUserId("USR-THER-001")).thenReturn(Optional.of(therapist));
        when(patientProgressRepository.save(any(PatientProgress.class))).thenAnswer(invocation -> {
            PatientProgress p = invocation.getArgument(0);
            p.setId("PROG-002");
            return p;
        });

        PatientProgressRequest req = PatientProgressRequest.builder()
                .patientId("PAT-001")
                .therapyPlanId("PLAN-001")
                .therapySessionId("SESS-001")
                .assessmentDate(LocalDate.now())
                .dayNumber(1)
                .observations("Patient tolerated treatment well")
                .build();

        PatientProgressResponse res = progressService.createProgress(req);
        assertNotNull(res);
        assertEquals("PROG-002", res.getId());
    }

    @Test
    @DisplayName("Duplicate assessment for the same therapy session is rejected")
    void testDuplicateAssessmentRejected() {
        authenticateUser(therapistUser);

        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(therapyPlanRepository.findById("PLAN-001")).thenReturn(Optional.of(plan));
        when(therapySessionRepository.findById("SESS-001")).thenReturn(Optional.of(completedSession));

        PatientProgress existingProgress = new PatientProgress();
        existingProgress.setId("EXISTING-PROG");
        existingProgress.setTherapySessionId("SESS-001");
        when(patientProgressRepository.findByTherapySessionId("SESS-001")).thenReturn(Optional.of(existingProgress));

        PatientProgressRequest req = PatientProgressRequest.builder()
                .patientId("PAT-001")
                .therapyPlanId("PLAN-001")
                .therapySessionId("SESS-001")
                .assessmentDate(LocalDate.now())
                .dayNumber(1)
                .build();

        RuntimeException ex = assertThrows(RuntimeException.class, () -> progressService.createProgress(req));
        assertTrue(ex.getMessage().contains("already been created"));
    }

    @Test
    @DisplayName("Doctor reviews progress assessment and updates improvement percentage and clinical recommendation")
    void testDoctorReviewsProgressAssessment() {
        authenticateUser(doctorUser);

        PatientProgress progress = new PatientProgress();
        progress.setId("PROG-001");
        progress.setPatientId("PAT-001");
        progress.setTherapyPlanId("PLAN-001");
        progress.setTherapySessionId("SESS-001");
        progress.setTherapyName("Abhyanga & Swedana");
        progress.setDayNumber(1);
        progress.setSymptoms("Lower back pain");
        progress.setObservations("Good sweat response");

        when(patientProgressRepository.findById("PROG-001")).thenReturn(Optional.of(progress));
        when(doctorRepository.findByUserId("USR-DOC-001")).thenReturn(Optional.of(doctor));
        when(patientProgressRepository.save(any(PatientProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PatientProgressRequest reviewReq = PatientProgressRequest.builder()
                .improvementPercentage(45)
                .clinicalAssessment("Vata pacification progressing well, good tissue softening")
                .nextRecommendation("Continue scheduled Shirodhara tomorrow, add warm herbal tea")
                .treatmentAdjustments("Increase Swedana duration by 5 minutes if tolerated")
                .build();

        PatientProgressResponse reviewed = progressService.doctorReviewProgress("PROG-001", reviewReq);

        assertNotNull(reviewed);
        assertEquals(45, reviewed.getImprovementPercentage());
        assertEquals("Vata pacification progressing well, good tissue softening", reviewed.getClinicalAssessment());
        assertEquals("Continue scheduled Shirodhara tomorrow, add warm herbal tea", reviewed.getNextRecommendation());
        assertEquals("Increase Swedana duration by 5 minutes if tolerated", reviewed.getTreatmentAdjustments());
        assertEquals("DOC-001", reviewed.getReviewedByDoctorId());
        assertEquals("Dr. Rajesh Sharma", reviewed.getReviewedByDoctorName());
        assertNotNull(reviewed.getReviewedAt());
    }

    @Test
    @DisplayName("Patient can view only their own progress and cannot access another patient's progress")
    void testPatientAccessIsolation() {
        authenticateUser(patientUser);

        Patient otherPatient = new Patient();
        otherPatient.setId("OTHER-PATIENT");
        otherPatient.setUserId("OTHER-USER");
        otherPatient.setEmail("other@test.com");

        when(patientRepository.findById("OTHER-PATIENT")).thenReturn(Optional.of(otherPatient));

        assertThrows(AccessDeniedException.class, () -> progressService.getProgressByPatient("OTHER-PATIENT"));
    }

    @Test
    @DisplayName("Backward compatibility: Older progress records without therapySessionId continue to work")
    void testLegacyProgressWithoutSessionId() {
        when(patientRepository.findById("PAT-001")).thenReturn(Optional.of(patient));
        when(therapyPlanRepository.findById("PLAN-001")).thenReturn(Optional.of(plan));
        when(patientProgressRepository.save(any(PatientProgress.class))).thenAnswer(invocation -> {
            PatientProgress p = invocation.getArgument(0);
            p.setId("LEGACY-001");
            return p;
        });

        PatientProgressRequest req = PatientProgressRequest.builder()
                .patientId("PAT-001")
                .therapyPlanId("PLAN-001")
                .therapySessionId(null) // legacy
                .assessmentDate(LocalDate.now())
                .dayNumber(1)
                .symptoms("Digestive weakness")
                .observations("Ama signs visible on tongue")
                .improvementPercentage(20)
                .build();

        PatientProgressResponse res = progressService.createProgress(req);

        assertNotNull(res);
        assertEquals("LEGACY-001", res.getId());
        assertNull(res.getTherapySessionId());
    }
}

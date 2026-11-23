package com.ayursutra.backend;

import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.*;
import com.ayursutra.dto.response.DoshaAssessmentResponse;
import com.ayursutra.dto.response.PatientEMRSummaryResponse;
import com.ayursutra.entity.*;
import com.ayursutra.mapper.PatientMapper;
import com.ayursutra.repository.*;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.AuditService;
import com.ayursutra.service.DoshaAssessmentService;
import com.ayursutra.service.NotificationService;
import com.ayursutra.service.impl.EMRServiceImpl;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class EMRModuleTest {

    @Mock
    private PatientMedicalRecordRepository medicalRecordRepository;
    @Mock
    private DoctorClinicalNoteRepository clinicalNoteRepository;
    @Mock
    private PatientRepository patientRepository;
    @Mock
    private DoctorRepository doctorRepository;
    @Mock
    private TherapistRepository therapistRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private TherapyPlanRepository therapyPlanRepository;
    @Mock
    private TherapySessionRepository therapySessionRepository;
    @Mock
    private DietPlanRepository dietPlanRepository;
    @Mock
    private PatientProgressRepository patientProgressRepository;
    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private DoshaAssessmentService doshaAssessmentService;
    @Mock
    private AuditService auditService;
    @Mock
    private NotificationService notificationService;

    private PatientMapper patientMapper;
    private EMRServiceImpl emrService;

    private final String PATIENT_ID = "PATIENT-100";
    private final String PATIENT_USER_ID = "USR-PATIENT-1";
    private final String DOCTOR_ID = "DOC-100";
    private final String DOCTOR_USER_ID = "USR-DOC-1";

    @BeforeEach
    void setUp() {
        patientMapper = new PatientMapper();
        emrService = new EMRServiceImpl(
                medicalRecordRepository,
                clinicalNoteRepository,
                patientRepository,
                doctorRepository,
                therapistRepository,
                userRepository,
                therapyPlanRepository,
                therapySessionRepository,
                dietPlanRepository,
                patientProgressRepository,
                appointmentRepository,
                doshaAssessmentService,
                auditService,
                notificationService,
                patientMapper
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String userId, String name, String email, Role role) {
        User user = new User();
        user.setId(userId);
        user.setFullName(name);
        user.setEmail(email);
        user.setRole(role);

        UserPrincipal principal = new UserPrincipal(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
    }

    @Test
    @DisplayName("Patient retrieves their own EMR summary and connected clinical history")
    void testPatientEMR_RetrievalAndScoping() {
        authenticateAs(PATIENT_USER_ID, "Rahul Sharma", "patient@ayursutra.com", Role.PATIENT);

        Patient patient = new Patient();
        patient.setId(PATIENT_ID);
        patient.setUserId(PATIENT_USER_ID);
        patient.setFullName("Rahul Sharma");
        patient.setEmail("patient@ayursutra.com");
        patient.setPhone("+91 98765 43210");

        when(patientRepository.findById(PATIENT_ID)).thenReturn(Optional.of(patient));

        PatientMedicalRecord record = PatientMedicalRecord.builder()
                .id("PMR-1")
                .patientId(PATIENT_ID)
                .bloodGroup("O+")
                .chronicConditions(List.of("Mild Spondylosis"))
                .allergies(List.of("Dust"))
                .prakritiDominant("Vata-Pitta")
                .vataPercentage(50)
                .pittaPercentage(35)
                .kaphaPercentage(15)
                .build();

        when(medicalRecordRepository.findByPatientId(PATIENT_ID)).thenReturn(Optional.of(record));

        DoctorClinicalNote note1 = DoctorClinicalNote.builder()
                .id("NOTE-1")
                .patientId(PATIENT_ID)
                .doctorName("Dr. Rajesh Sharma")
                .diagnosis("Cervical Spondylosis")
                .isConfidential(false)
                .build();

        DoctorClinicalNote confidentialNote = DoctorClinicalNote.builder()
                .id("NOTE-2")
                .patientId(PATIENT_ID)
                .doctorName("Dr. Rajesh Sharma")
                .diagnosis("Sensitive Doctor Internal Note")
                .isConfidential(true)
                .build();

        when(clinicalNoteRepository.findByPatientIdOrderByConsultationDateDescConsultationTimeDesc(PATIENT_ID))
                .thenReturn(List.of(note1, confidentialNote));

        when(therapyPlanRepository.findAll()).thenReturn(List.of());
        when(therapySessionRepository.findAll()).thenReturn(List.of());
        when(dietPlanRepository.findAll()).thenReturn(List.of());
        when(patientProgressRepository.findAll()).thenReturn(List.of());
        when(appointmentRepository.findAll()).thenReturn(List.of());

        PatientEMRSummaryResponse summary = emrService.getPatientEMR(PATIENT_ID);

        assertNotNull(summary);
        assertEquals("Rahul Sharma", summary.getPatient().getFullName());
        assertEquals("O+", summary.getMedicalRecord().getBloodGroup());
        // Confidential note must be filtered out for Patient!
        assertEquals(1, summary.getConsultationNotes().size());
        assertEquals("Cervical Spondylosis", summary.getConsultationNotes().get(0).getDiagnosis());
        assertFalse(summary.getCanEditMedicalRecord());
        assertFalse(summary.getCanAddClinicalNote());
    }

    @Test
    @DisplayName("Patient is blocked from viewing another patient's EMR")
    void testPatientEMR_AccessDeniedForOtherPatient() {
        authenticateAs(PATIENT_USER_ID, "Rahul Sharma", "patient@ayursutra.com", Role.PATIENT);

        Patient otherPatient = new Patient();
        otherPatient.setId("OTHER-PATIENT-2");
        otherPatient.setUserId("OTHER-USER-2");
        otherPatient.setEmail("other@ayursutra.com");
        otherPatient.setFullName("Priya Patel");

        when(patientRepository.findById("OTHER-PATIENT-2")).thenReturn(Optional.of(otherPatient));

        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                emrService.getPatientEMR("OTHER-PATIENT-2")
        );

        assertTrue(ex.getMessage().contains("Access Denied"));
        verify(medicalRecordRepository, never()).findByPatientId(any());
    }

    @Test
    @DisplayName("Doctor updates patient longitudinal medical record, vitals, and chronic conditions")
    void testDoctorUpsertMedicalRecord_Success() {
        authenticateAs(DOCTOR_USER_ID, "Dr. Rajesh Sharma", "doctor@ayursutra.com", Role.DOCTOR);

        Patient patient = new Patient();
        patient.setId(PATIENT_ID);
        patient.setFullName("Rahul Sharma");

        when(patientRepository.findById(PATIENT_ID)).thenReturn(Optional.of(patient));

        PatientMedicalRecord existing = PatientMedicalRecord.builder()
                .id("PMR-1")
                .patientId(PATIENT_ID)
                .bloodGroup("O+")
                .chronicConditions(new ArrayList<>(List.of("Mild Spondylosis")))
                .allergies(new ArrayList<>())
                .auditHistory(new ArrayList<>())
                .build();

        when(medicalRecordRepository.findByPatientId(PATIENT_ID)).thenReturn(Optional.of(existing));
        when(medicalRecordRepository.save(any(PatientMedicalRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        UpsertMedicalRecordRequest request = UpsertMedicalRecordRequest.builder()
                .bloodPressure("122/80")
                .pulseRate(72)
                .chronicConditions(List.of("Mild Spondylosis", "Lumbar Strain"))
                .allergies(List.of("NSAIDs"))
                .prakritiDominant("Vata-Pitta")
                .vataPercentage(50)
                .pittaPercentage(35)
                .kaphaPercentage(15)
                .clinicalObservations("Neck and lumbar paraspinal tenderness")
                .build();

        PatientMedicalRecord updated = emrService.upsertMedicalRecord(PATIENT_ID, request);

        assertNotNull(updated);
        assertEquals("122/80", updated.getBloodPressure());
        assertEquals(72, updated.getPulseRate());
        assertEquals(2, updated.getChronicConditions().size());
        assertEquals("Vata-Pitta", updated.getPrakritiDominant());
        assertFalse(updated.getAuditHistory().isEmpty());
        verify(patientRepository, times(1)).save(patient);
        assertEquals("Vata-Pitta", patient.getPrimaryDosha());
    }

    @Test
    @DisplayName("Doctor authors a clinical consultation note with diagnosis and prescriptions")
    void testCreateClinicalNote_DoctorSuccess() {
        authenticateAs(DOCTOR_USER_ID, "Dr. Rajesh Sharma", "doctor@ayursutra.com", Role.DOCTOR);

        Doctor doc = new Doctor();
        doc.setId(DOCTOR_ID);
        doc.setUserId(DOCTOR_USER_ID);
        doc.setFullName("Rajesh Sharma");
        doc.setSpecialization("Panchakarma Specialist");

        when(doctorRepository.findByUserId(DOCTOR_USER_ID)).thenReturn(Optional.of(doc));

        Patient patient = new Patient();
        patient.setId(PATIENT_ID);
        patient.setUserId(PATIENT_USER_ID);
        patient.setFullName("Rahul Sharma");

        when(patientRepository.findById(PATIENT_ID)).thenReturn(Optional.of(patient));

        when(clinicalNoteRepository.save(any(DoctorClinicalNote.class))).thenAnswer(inv -> {
            DoctorClinicalNote n = inv.getArgument(0);
            n.setId("NOTE-100");
            return n;
        });

        CreateClinicalNoteRequest request = CreateClinicalNoteRequest.builder()
                .patientId(PATIENT_ID)
                .diagnosis("Griva Sandhigata Vata")
                .chiefComplaints("Severe stiffness in neck")
                .symptoms(List.of("Cervical spasm", "Reduced rotation"))
                .treatmentRecommendations("Griva Basti followed by Nadi Sweda")
                .prescribedMedicines(List.of(
                        PrescribedMedicineItem.builder()
                                .medicineName("Maharasnadi Kashayam")
                                .formulation("Kashayam")
                                .dosage("15 ml with warm water")
                                .timing("Twice daily before food")
                                .durationDays(14)
                                .build()
                ))
                .followUpDate(LocalDate.now().plusDays(14))
                .build();

        DoctorClinicalNote created = emrService.createClinicalNote(request);

        assertNotNull(created);
        assertEquals("NOTE-100", created.getId());
        assertEquals("Dr. Rajesh Sharma", created.getDoctorName());
        assertEquals("Griva Sandhigata Vata", created.getDiagnosis());
        assertEquals(1, created.getPrescribedMedicines().size());
        assertEquals("Maharasnadi Kashayam", created.getPrescribedMedicines().get(0).getMedicineName());
        verify(clinicalNoteRepository, times(1)).save(any(DoctorClinicalNote.class));
    }

    @Test
    @DisplayName("Therapist attaches a therapy session observation to clinical note")
    void testAddTherapyObservation_TherapistSuccess() {
        authenticateAs("USR-TH-1", "Kavita Nair", "therapist@ayursutra.com", Role.THERAPIST);

        Therapist therapist = new Therapist();
        therapist.setId("TH-01");
        therapist.setUserId("USR-TH-1");
        therapist.setFullName("Kavita Nair");

        when(therapistRepository.findByUserId("USR-TH-1")).thenReturn(Optional.of(therapist));

        DoctorClinicalNote existingNote = DoctorClinicalNote.builder()
                .id("NOTE-100")
                .patientId(PATIENT_ID)
                .doctorId(DOCTOR_ID)
                .doctorUserId(DOCTOR_USER_ID)
                .doctorName("Dr. Rajesh Sharma")
                .diagnosis("Griva Sandhigata Vata")
                .therapistNotes(new ArrayList<>())
                .auditHistory(new ArrayList<>())
                .build();

        when(clinicalNoteRepository.findById("NOTE-100")).thenReturn(Optional.of(existingNote));
        when(clinicalNoteRepository.save(any(DoctorClinicalNote.class))).thenAnswer(inv -> inv.getArgument(0));

        AddTherapyObservationRequest request = AddTherapyObservationRequest.builder()
                .therapyName("Griva Basti")
                .observation("Patient tolerated 30-min session well. Eased neck stiffness.")
                .patientFeedback("Feels much lighter and relaxed")
                .vitalPulse(74)
                .vitalBloodPressure("122/82")
                .build();

        DoctorClinicalNote updated = emrService.addTherapyObservation("NOTE-100", request);

        assertNotNull(updated);
        assertEquals(1, updated.getTherapistNotes().size());
        TherapyObservationItem obs = updated.getTherapistNotes().get(0);
        assertEquals("Kavita Nair", obs.getTherapistName());
        assertEquals("Griva Basti", obs.getTherapyName());
        assertEquals(74, obs.getVitalPulse());
        verify(clinicalNoteRepository, times(1)).save(existingNote);
    }

    @Test
    @DisplayName("EMR reuses existing DoshaAssessmentService and attaches results to medical record")
    void testDoshaAssessmentIntegration_ReusesExistingModule() {
        authenticateAs(DOCTOR_USER_ID, "Dr. Rajesh Sharma", "doctor@ayursutra.com", Role.DOCTOR);

        Patient patient = new Patient();
        patient.setId(PATIENT_ID);
        patient.setFullName("Rahul Sharma");

        when(patientRepository.findById(PATIENT_ID)).thenReturn(Optional.of(patient));

        PatientMedicalRecord record = PatientMedicalRecord.builder()
                .id("PMR-1")
                .patientId(PATIENT_ID)
                .auditHistory(new ArrayList<>())
                .build();

        when(medicalRecordRepository.findByPatientId(PATIENT_ID)).thenReturn(Optional.of(record));

        DoshaAssessmentResponse calcResponse = DoshaAssessmentResponse.builder()
                .primaryDosha("Pitta-Vata")
                .secondaryDosha("Kapha")
                .vataPercentage(40)
                .pittaPercentage(45)
                .kaphaPercentage(15)
                .characteristics("Moderate frame with sharp digestion")
                .build();

        when(doshaAssessmentService.assessDosha(any(DoshaAssessmentRequest.class)))
                .thenReturn(calcResponse);

        DoshaAssessmentRequest req = new DoshaAssessmentRequest();

        DoshaAssessmentResponse result = emrService.calculateAndAttachDosha(PATIENT_ID, req);

        assertNotNull(result);
        assertEquals("Pitta-Vata", result.getPrimaryDosha());
        verify(doshaAssessmentService, times(1)).assessDosha(req);
        verify(medicalRecordRepository, times(1)).save(record);
        assertEquals("Pitta-Vata", record.getPrakritiDominant());
        assertEquals(45, record.getPittaPercentage());
        verify(patientRepository, times(1)).save(patient);
        assertEquals("Pitta-Vata", patient.getPrimaryDosha());
    }
}

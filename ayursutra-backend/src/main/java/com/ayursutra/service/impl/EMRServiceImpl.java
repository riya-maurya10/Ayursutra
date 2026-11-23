package com.ayursutra.service.impl;

import com.ayursutra.constant.AuditAction;
import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.AddTherapyObservationRequest;
import com.ayursutra.dto.request.CreateClinicalNoteRequest;
import com.ayursutra.dto.request.DoshaAssessmentRequest;
import com.ayursutra.dto.request.UpdateClinicalNoteRequest;
import com.ayursutra.dto.request.UpsertMedicalRecordRequest;
import com.ayursutra.dto.response.DoshaAssessmentResponse;
import com.ayursutra.dto.response.PatientEMRSummaryResponse;
import com.ayursutra.dto.response.PatientResponse;
import com.ayursutra.entity.*;
import com.ayursutra.mapper.PatientMapper;
import com.ayursutra.repository.*;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.AuditService;
import com.ayursutra.service.DoshaAssessmentService;
import com.ayursutra.service.EMRService;
import com.ayursutra.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EMRServiceImpl implements EMRService {

    private final PatientMedicalRecordRepository medicalRecordRepository;
    private final DoctorClinicalNoteRepository clinicalNoteRepository;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final TherapistRepository therapistRepository;
    private final UserRepository userRepository;
    private final TherapyPlanRepository therapyPlanRepository;
    private final TherapySessionRepository therapySessionRepository;
    private final DietPlanRepository dietPlanRepository;
    private final PatientProgressRepository patientProgressRepository;
    private final AppointmentRepository appointmentRepository;
    private final DoshaAssessmentService doshaAssessmentService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final PatientMapper patientMapper;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new RuntimeException("Unauthorized: No authenticated user found.");
        }
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return principal.getUser();
    }

    // =========================================================
    // 1. GET PATIENT EMR (LONGITUDINAL SUMMARY)
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public PatientEMRSummaryResponse getPatientEMR(String patientId) {
        User currentUser = getAuthenticatedUser();
        Role userRole = currentUser.getRole();

        // 1. Resolve Patient
        Patient patient = patientRepository.findById(patientId)
                .or(() -> patientRepository.findByUserId(patientId))
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));

        // 2. Security & Access Check
        if (userRole == Role.PATIENT) {
            boolean isOwnRecord = (patient.getUserId() != null && patient.getUserId().equals(currentUser.getId()))
                    || (patient.getEmail() != null && patient.getEmail().equalsIgnoreCase(currentUser.getEmail()))
                    || patient.getId().equals(currentUser.getId());
            if (!isOwnRecord) {
                throw new RuntimeException("Access Denied: You are not authorized to view another patient's medical records.");
            }
        }

        // 3. Fetch or Initialize Longitudinal Medical Record
        PatientMedicalRecord medicalRecord = medicalRecordRepository.findByPatientId(patient.getId())
                .orElseGet(() -> {
                    PatientMedicalRecord initial = PatientMedicalRecord.builder()
                            .patientId(patient.getId())
                            .clinicId("CLINIC-MAIN")
                            .chronicConditions(new ArrayList<>())
                            .allergies(new ArrayList<>())
                            .currentMedications(new ArrayList<>())
                            .pastSurgeries(new ArrayList<>())
                            .familyMedicalHistory(new ArrayList<>())
                            .lifestyleHabits(new ArrayList<>())
                            .dhatuImbalances(new ArrayList<>())
                            .auditHistory(new ArrayList<>())
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();

                    // Seed from Patient entity if available
                    if (patient.getMedicalHistory() != null && !patient.getMedicalHistory().isBlank()) {
                        initial.setClinicalObservations(patient.getMedicalHistory());
                    }
                    if (patient.getPrimaryDosha() != null) {
                        initial.setPrakritiDominant(patient.getPrimaryDosha());
                        initial.setVataPercentage(patient.getVataPercentage());
                        initial.setPittaPercentage(patient.getPittaPercentage());
                        initial.setKaphaPercentage(patient.getKaphaPercentage());
                    }
                    return medicalRecordRepository.save(initial);
                });

        // 4. Fetch Clinical Notes with Confidentiality Filtering
        List<DoctorClinicalNote> allNotes = clinicalNoteRepository
                .findByPatientIdOrderByConsultationDateDescConsultationTimeDesc(patient.getId());

        List<DoctorClinicalNote> filteredNotes;
        boolean canViewConfidential = (userRole == Role.ADMIN || userRole == Role.DOCTOR);

        if (userRole == Role.RECEPTIONIST) {
            // Receptionists cannot see detailed doctor clinical notes
            filteredNotes = Collections.emptyList();
        } else if (canViewConfidential) {
            filteredNotes = allNotes;
        } else {
            // Patient and Therapist: filter out confidential notes
            filteredNotes = allNotes.stream()
                    .filter(n -> n.getIsConfidential() == null || !n.getIsConfidential())
                    .collect(Collectors.toList());
        }

        // 5. Connected Therapy & Treatment History
        List<TherapyPlan> therapyPlans = therapyPlanRepository.findAll().stream()
                .filter(p -> Objects.equals(p.getPatientId(), patient.getId()))
                .collect(Collectors.toList());

        List<TherapySession> therapySessions = therapySessionRepository.findAll().stream()
                .filter(s -> Objects.equals(s.getPatientId(), patient.getId()))
                .sorted(Comparator.comparing(TherapySession::getSessionDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(TherapySession::getStartTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        List<DietPlan> dietPlans = dietPlanRepository.findAll().stream()
                .filter(d -> Objects.equals(d.getPatientId(), patient.getId()))
                .collect(Collectors.toList());

        List<PatientProgress> progressRecords = patientProgressRepository.findAll().stream()
                .filter(pr -> Objects.equals(pr.getPatientId(), patient.getId()))
                .sorted(Comparator.comparing(PatientProgress::getAssessmentDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        List<Appointment> appointments = appointmentRepository.findAll().stream()
                .filter(a -> Objects.equals(a.getPatientId(), patient.getId()) ||
                        (patient.getEmail() != null && Objects.equals(a.getPatientEmail(), patient.getEmail())))
                .sorted(Comparator.comparing(Appointment::getAppointmentDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(Appointment::getStartTime, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        // 6. Build Dosha Snapshot
        DoshaAssessmentResponse doshaResponse = null;
        if (medicalRecord.getPrakritiDominant() != null) {
            doshaResponse = DoshaAssessmentResponse.builder()
                    .primaryDosha(medicalRecord.getPrakritiDominant())
                    .secondaryDosha(medicalRecord.getVikritiImbalance())
                    .vataPercentage(medicalRecord.getVataPercentage() != null ? medicalRecord.getVataPercentage() : 0)
                    .pittaPercentage(medicalRecord.getPittaPercentage() != null ? medicalRecord.getPittaPercentage() : 0)
                    .kaphaPercentage(medicalRecord.getKaphaPercentage() != null ? medicalRecord.getKaphaPercentage() : 0)
                    .characteristics("Prakriti constitution: " + medicalRecord.getPrakritiDominant() +
                            (medicalRecord.getAgniType() != null ? " with " + medicalRecord.getAgniType() : ""))
                    .build();
        }

        PatientResponse patientResponse = patientMapper.toResponse(patient);

        // 7. Role-Based Capabilities
        boolean canEditMedical = (userRole == Role.ADMIN || userRole == Role.DOCTOR);
        boolean canAddNote = (userRole == Role.ADMIN || userRole == Role.DOCTOR);
        boolean canAddObservation = (userRole == Role.ADMIN || userRole == Role.THERAPIST);

        return PatientEMRSummaryResponse.builder()
                .patient(patientResponse)
                .medicalRecord(medicalRecord)
                .consultationNotes(filteredNotes)
                .doshaAssessment(doshaResponse)
                .therapyPlans(therapyPlans)
                .therapySessions(therapySessions)
                .dietPlans(dietPlans)
                .progressRecords(progressRecords)
                .appointments(appointments)
                .canEditMedicalRecord(canEditMedical)
                .canAddClinicalNote(canAddNote)
                .canAddTherapyObservation(canAddObservation)
                .canViewConfidentialNotes(canViewConfidential)
                .build();
    }

    // =========================================================
    // 2. GET MY EMR (PATIENT SELF-SERVICE)
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public PatientEMRSummaryResponse getMyEMR() {
        User currentUser = getAuthenticatedUser();
        if (currentUser.getRole() != Role.PATIENT) {
            throw new RuntimeException("Only patients can access their personal EMR via /me endpoint.");
        }

        Patient patient = patientRepository.findByUserId(currentUser.getId())
                .or(() -> patientRepository.findByEmail(currentUser.getEmail()))
                .orElseGet(() -> {
                    // Create minimal Patient record if absent
                    Patient newP = new Patient();
                    newP.setUserId(currentUser.getId());
                    newP.setFullName(currentUser.getFullName());
                    newP.setEmail(currentUser.getEmail());
                    newP.setPhone(currentUser.getPhone());
                    return patientRepository.save(newP);
                });

        return getPatientEMR(patient.getId());
    }

    // =========================================================
    // 3. UPSERT MEDICAL RECORD (DOCTOR / ADMIN)
    // =========================================================
    @Override
    @Transactional
    public PatientMedicalRecord upsertMedicalRecord(String patientId, UpsertMedicalRecordRequest request) {
        User currentUser = getAuthenticatedUser();
        Role userRole = currentUser.getRole();

        if (userRole != Role.ADMIN && userRole != Role.DOCTOR) {
            throw new RuntimeException("Access Denied: Only doctors and administrators can modify patient medical history.");
        }

        Patient patient = patientRepository.findById(patientId)
                .or(() -> patientRepository.findByUserId(patientId))
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));

        PatientMedicalRecord record = medicalRecordRepository.findByPatientId(patient.getId())
                .orElseGet(() -> PatientMedicalRecord.builder()
                        .patientId(patient.getId())
                        .clinicId("CLINIC-MAIN")
                        .auditHistory(new ArrayList<>())
                        .createdAt(LocalDateTime.now())
                        .build());

        // Update vitals
        if (request.getBloodGroup() != null) record.setBloodGroup(request.getBloodGroup());
        if (request.getHeightCm() != null) record.setHeightCm(request.getHeightCm());
        if (request.getWeightKg() != null) record.setWeightKg(request.getWeightKg());
        if (request.getBloodPressure() != null) record.setBloodPressure(request.getBloodPressure());
        if (request.getPulseRate() != null) record.setPulseRate(request.getPulseRate());

        // Update medical history lists
        if (request.getChronicConditions() != null) record.setChronicConditions(request.getChronicConditions());
        if (request.getAllergies() != null) record.setAllergies(request.getAllergies());
        if (request.getCurrentMedications() != null) record.setCurrentMedications(request.getCurrentMedications());
        if (request.getPastSurgeries() != null) record.setPastSurgeries(request.getPastSurgeries());
        if (request.getFamilyMedicalHistory() != null) record.setFamilyMedicalHistory(request.getFamilyMedicalHistory());
        if (request.getLifestyleHabits() != null) record.setLifestyleHabits(request.getLifestyleHabits());
        if (request.getDietaryHabits() != null) record.setDietaryHabits(request.getDietaryHabits());
        if (request.getPreviousTreatments() != null) record.setPreviousTreatments(request.getPreviousTreatments());
        if (request.getClinicalObservations() != null) record.setClinicalObservations(request.getClinicalObservations());

        // Update Ayurvedic profile
        if (request.getPrakritiDominant() != null) record.setPrakritiDominant(request.getPrakritiDominant());
        if (request.getVataPercentage() != null) record.setVataPercentage(request.getVataPercentage());
        if (request.getPittaPercentage() != null) record.setPittaPercentage(request.getPittaPercentage());
        if (request.getKaphaPercentage() != null) record.setKaphaPercentage(request.getKaphaPercentage());
        if (request.getVikritiImbalance() != null) record.setVikritiImbalance(request.getVikritiImbalance());
        if (request.getAgniType() != null) record.setAgniType(request.getAgniType());
        if (request.getAmaStatus() != null) record.setAmaStatus(request.getAmaStatus());
        if (request.getKoshtha() != null) record.setKoshtha(request.getKoshtha());
        if (request.getDhatuImbalances() != null) record.setDhatuImbalances(request.getDhatuImbalances());
        if (request.getMalaObservations() != null) record.setMalaObservations(request.getMalaObservations());
        if (request.getSleepQuality() != null) record.setSleepQuality(request.getSleepQuality());
        if (request.getAppetiteDigestion() != null) record.setAppetiteDigestion(request.getAppetiteDigestion());

        record.setUpdatedAt(LocalDateTime.now());

        // Append audit trail item
        if (record.getAuditHistory() == null) {
            record.setAuditHistory(new ArrayList<>());
        }
        record.getAuditHistory().add(MedicalRecordAuditItem.builder()
                .action("MEDICAL_RECORD_UPDATED")
                .performedByUserId(currentUser.getId())
                .performedByName(currentUser.getFullName())
                .performedByRole(userRole.name())
                .summary("Updated longitudinal history, vitals, or Ayurvedic profile")
                .timestamp(LocalDateTime.now())
                .build());

        PatientMedicalRecord saved = medicalRecordRepository.save(record);

        // Synchronize with Patient entity
        if (record.getPrakritiDominant() != null) {
            patient.setPrimaryDosha(record.getPrakritiDominant());
            patient.setVataPercentage(record.getVataPercentage());
            patient.setPittaPercentage(record.getPittaPercentage());
            patient.setKaphaPercentage(record.getKaphaPercentage());
        }
        if (record.getClinicalObservations() != null) {
            patient.setMedicalHistory(record.getClinicalObservations());
        }
        patientRepository.save(patient);

        auditService.log(
                AuditAction.UPDATE,
                "PATIENT_MEDICAL_RECORD",
                patient.getId(),
                patient.getFullName(),
                "Patient medical record and Ayurvedic history updated by " + currentUser.getFullName()
        );

        return saved;
    }

    // =========================================================
    // 4. CREATE DOCTOR CLINICAL NOTE
    // =========================================================
    @Override
    @Transactional
    public DoctorClinicalNote createClinicalNote(CreateClinicalNoteRequest request) {
        User currentUser = getAuthenticatedUser();
        Role userRole = currentUser.getRole();

        if (userRole != Role.ADMIN && userRole != Role.DOCTOR) {
            throw new RuntimeException("Access Denied: Only doctors and clinic administrators can author clinical consultation notes.");
        }

        Patient patient = patientRepository.findById(request.getPatientId())
                .or(() -> patientRepository.findByUserId(request.getPatientId()))
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + request.getPatientId()));

        // Resolve Doctor identity
        String doctorId = request.getDoctorId();
        String doctorUserId = currentUser.getId();
        String doctorName = currentUser.getFullName();
        String doctorSpec = "Ayurvedic Physician";

        if (userRole == Role.DOCTOR) {
            Doctor doc = doctorRepository.findByUserId(currentUser.getId())
                    .orElse(null);
            if (doc != null) {
                doctorId = doc.getId();
                doctorName = "Dr. " + doc.getFullName();
                if (doc.getSpecialization() != null) {
                    doctorSpec = doc.getSpecialization();
                }
            }
        }

        DoctorClinicalNote note = DoctorClinicalNote.builder()
                .patientId(patient.getId())
                .clinicId("CLINIC-MAIN")
                .appointmentId(request.getAppointmentId())
                .doctorId(doctorId)
                .doctorUserId(doctorUserId)
                .doctorName(doctorName)
                .doctorSpecialization(doctorSpec)
                .consultationDate(request.getConsultationDate() != null ? request.getConsultationDate() : LocalDate.now())
                .consultationTime(request.getConsultationTime() != null ? request.getConsultationTime() : LocalTime.now())
                .visitType(request.getVisitType() != null ? request.getVisitType() : "CONSULTATION")
                .chiefComplaints(request.getChiefComplaints())
                .symptoms(request.getSymptoms() != null ? request.getSymptoms() : new ArrayList<>())
                .clinicalObservations(request.getClinicalObservations())
                .diagnosis(request.getDiagnosis())
                .prakritiObservation(request.getPrakritiObservation())
                .vikritiObservation(request.getVikritiObservation())
                .nadiPariksha(request.getNadiPariksha())
                .jihvaPariksha(request.getJihvaPariksha())
                .netraPariksha(request.getNetraPariksha())
                .agniObservation(request.getAgniObservation())
                .amaObservation(request.getAmaObservation())
                .treatmentRecommendations(request.getTreatmentRecommendations())
                .prescribedMedicines(request.getPrescribedMedicines() != null ? request.getPrescribedMedicines() : new ArrayList<>())
                .recommendedTherapies(request.getRecommendedTherapies() != null ? request.getRecommendedTherapies() : new ArrayList<>())
                .dietaryAdvice(request.getDietaryAdvice())
                .lifestyleInstructions(request.getLifestyleInstructions())
                .followUpDate(request.getFollowUpDate())
                .followUpInstructions(request.getFollowUpInstructions())
                .isConfidential(request.getIsConfidential() != null ? request.getIsConfidential() : false)
                .therapistNotes(new ArrayList<>())
                .auditHistory(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        note.getAuditHistory().add(MedicalRecordAuditItem.builder()
                .action("NOTE_CREATED")
                .performedByUserId(currentUser.getId())
                .performedByName(currentUser.getFullName())
                .performedByRole(userRole.name())
                .summary("Initial clinical note created with diagnosis: " + request.getDiagnosis())
                .timestamp(LocalDateTime.now())
                .build());

        DoctorClinicalNote savedNote = clinicalNoteRepository.save(note);

        auditService.log(
                AuditAction.CREATE,
                "CLINICAL_NOTE",
                savedNote.getId(),
                "Consultation for " + patient.getFullName(),
                "Clinical note created by " + doctorName + " (Diagnosis: " + request.getDiagnosis() + ")"
        );

        // Notify patient if available
        if (patient.getUserId() != null && (savedNote.getIsConfidential() == null || !savedNote.getIsConfidential())) {
            notificationService.sendNotificationToUser(
                    patient.getUserId(),
                    "New Consultation Summary",
                    doctorName + " recorded a new consultation summary and recommendations for your visit.",
                    NotificationType.GENERAL,
                    "/patient/medical-record"
            );
        }

        return savedNote;
    }

    // =========================================================
    // 5. UPDATE DOCTOR CLINICAL NOTE
    // =========================================================
    @Override
    @Transactional
    public DoctorClinicalNote updateClinicalNote(String noteId, UpdateClinicalNoteRequest request) {
        User currentUser = getAuthenticatedUser();
        Role userRole = currentUser.getRole();

        if (userRole != Role.ADMIN && userRole != Role.DOCTOR) {
            throw new RuntimeException("Access Denied: Only doctors and administrators can modify clinical notes.");
        }

        DoctorClinicalNote note = clinicalNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Clinical note not found with ID: " + noteId));

        // Author or Admin check
        if (userRole == Role.DOCTOR && !currentUser.getId().equals(note.getDoctorUserId())) {
            throw new RuntimeException("Access Denied: You cannot modify a clinical note authored by another doctor.");
        }

        if (request.getChiefComplaints() != null) note.setChiefComplaints(request.getChiefComplaints());
        if (request.getSymptoms() != null) note.setSymptoms(request.getSymptoms());
        if (request.getClinicalObservations() != null) note.setClinicalObservations(request.getClinicalObservations());
        if (request.getDiagnosis() != null) note.setDiagnosis(request.getDiagnosis());
        if (request.getPrakritiObservation() != null) note.setPrakritiObservation(request.getPrakritiObservation());
        if (request.getVikritiObservation() != null) note.setVikritiObservation(request.getVikritiObservation());
        if (request.getNadiPariksha() != null) note.setNadiPariksha(request.getNadiPariksha());
        if (request.getJihvaPariksha() != null) note.setJihvaPariksha(request.getJihvaPariksha());
        if (request.getNetraPariksha() != null) note.setNetraPariksha(request.getNetraPariksha());
        if (request.getAgniObservation() != null) note.setAgniObservation(request.getAgniObservation());
        if (request.getAmaObservation() != null) note.setAmaObservation(request.getAmaObservation());
        if (request.getTreatmentRecommendations() != null) note.setTreatmentRecommendations(request.getTreatmentRecommendations());
        if (request.getPrescribedMedicines() != null) note.setPrescribedMedicines(request.getPrescribedMedicines());
        if (request.getRecommendedTherapies() != null) note.setRecommendedTherapies(request.getRecommendedTherapies());
        if (request.getDietaryAdvice() != null) note.setDietaryAdvice(request.getDietaryAdvice());
        if (request.getLifestyleInstructions() != null) note.setLifestyleInstructions(request.getLifestyleInstructions());
        if (request.getFollowUpDate() != null) note.setFollowUpDate(request.getFollowUpDate());
        if (request.getFollowUpInstructions() != null) note.setFollowUpInstructions(request.getFollowUpInstructions());
        if (request.getIsConfidential() != null) note.setIsConfidential(request.getIsConfidential());

        note.setUpdatedAt(LocalDateTime.now());

        if (note.getAuditHistory() == null) {
            note.setAuditHistory(new ArrayList<>());
        }
        note.getAuditHistory().add(MedicalRecordAuditItem.builder()
                .action("NOTE_EDITED")
                .performedByUserId(currentUser.getId())
                .performedByName(currentUser.getFullName())
                .performedByRole(userRole.name())
                .summary("Clinical note updated: " + (request.getEditReason() != null ? request.getEditReason() : "Clinical details updated"))
                .timestamp(LocalDateTime.now())
                .build());

        DoctorClinicalNote saved = clinicalNoteRepository.save(note);

        auditService.log(
                AuditAction.UPDATE,
                "CLINICAL_NOTE",
                saved.getId(),
                "Consultation " + saved.getId(),
                "Clinical note updated by " + currentUser.getFullName() + (request.getEditReason() != null ? " (" + request.getEditReason() + ")" : "")
        );

        return saved;
    }

    // =========================================================
    // 6. ADD THERAPY OBSERVATION (THERAPIST / ADMIN)
    // =========================================================
    @Override
    @Transactional
    public DoctorClinicalNote addTherapyObservation(String noteId, AddTherapyObservationRequest request) {
        User currentUser = getAuthenticatedUser();
        Role userRole = currentUser.getRole();

        if (userRole != Role.THERAPIST && userRole != Role.ADMIN) {
            throw new RuntimeException("Access Denied: Only therapists and administrators can submit therapy session observations.");
        }

        DoctorClinicalNote note = clinicalNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Clinical note not found with ID: " + noteId));

        String therapistId = "TH-" + currentUser.getId();
        String therapistName = currentUser.getFullName();

        if (userRole == Role.THERAPIST) {
            Therapist therapist = therapistRepository.findByUserId(currentUser.getId()).orElse(null);
            if (therapist != null) {
                therapistId = therapist.getId();
                therapistName = therapist.getFullName();
            }
        }

        TherapyObservationItem observationItem = TherapyObservationItem.builder()
                .id(UUID.randomUUID().toString())
                .therapistId(therapistId)
                .therapistUserId(currentUser.getId())
                .therapistName(therapistName)
                .therapySessionId(request.getTherapySessionId())
                .therapyName(request.getTherapyName())
                .observation(request.getObservation())
                .patientFeedback(request.getPatientFeedback())
                .vitalPulse(request.getVitalPulse())
                .vitalBloodPressure(request.getVitalBloodPressure())
                .recordedAt(LocalDateTime.now())
                .build();

        if (note.getTherapistNotes() == null) {
            note.setTherapistNotes(new ArrayList<>());
        }
        note.getTherapistNotes().add(observationItem);

        if (note.getAuditHistory() == null) {
            note.setAuditHistory(new ArrayList<>());
        }
        note.getAuditHistory().add(MedicalRecordAuditItem.builder()
                .action("OBSERVATION_ADDED")
                .performedByUserId(currentUser.getId())
                .performedByName(currentUser.getFullName())
                .performedByRole(userRole.name())
                .summary("Therapy observation attached by " + therapistName + " for session " + (request.getTherapyName() != null ? request.getTherapyName() : ""))
                .timestamp(LocalDateTime.now())
                .build());

        note.setUpdatedAt(LocalDateTime.now());
        DoctorClinicalNote saved = clinicalNoteRepository.save(note);

        auditService.log(
                AuditAction.UPDATE,
                "CLINICAL_NOTE_OBSERVATION",
                saved.getId(),
                "Observation by " + therapistName,
                "Therapy observation recorded for patient note " + saved.getId()
        );

        // Notify consulting doctor
        if (saved.getDoctorUserId() != null) {
            notificationService.sendNotificationToUser(
                    saved.getDoctorUserId(),
                    "Therapy Session Observation Added",
                    therapistName + " added an observation for your consultation record with diagnosis: " + saved.getDiagnosis(),
                    NotificationType.PATIENT_PROGRESS,
                    "/doctor/patients/" + saved.getPatientId()
            );
        }

        return saved;
    }

    // =========================================================
    // 7. CALCULATE & ATTACH DOSHA (REUSING DOSHA ASSESSMENT MODULE)
    // =========================================================
    @Override
    @Transactional
    public DoshaAssessmentResponse calculateAndAttachDosha(String patientId, DoshaAssessmentRequest request) {
        User currentUser = getAuthenticatedUser();
        Role userRole = currentUser.getRole();

        if (userRole != Role.ADMIN && userRole != Role.DOCTOR) {
            throw new RuntimeException("Access Denied: Only doctors and administrators can record official Ayurvedic Prakriti assessments.");
        }

        Patient patient = patientRepository.findById(patientId)
                .or(() -> patientRepository.findByUserId(patientId))
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));

        // Delegate directly to existing Dosha Assessment calculation service!
        DoshaAssessmentResponse assessment = doshaAssessmentService.assessDosha(request);

        // Persist findings to PatientMedicalRecord
        PatientMedicalRecord record = medicalRecordRepository.findByPatientId(patient.getId())
                .orElseGet(() -> PatientMedicalRecord.builder()
                        .patientId(patient.getId())
                        .clinicId("CLINIC-MAIN")
                        .auditHistory(new ArrayList<>())
                        .createdAt(LocalDateTime.now())
                        .build());

        record.setPrakritiDominant(assessment.getPrimaryDosha());
        record.setVataPercentage(assessment.getVataPercentage());
        record.setPittaPercentage(assessment.getPittaPercentage());
        record.setKaphaPercentage(assessment.getKaphaPercentage());
        record.setVikritiImbalance(assessment.getSecondaryDosha());
        record.setUpdatedAt(LocalDateTime.now());

        if (record.getAuditHistory() == null) {
            record.setAuditHistory(new ArrayList<>());
        }
        record.getAuditHistory().add(MedicalRecordAuditItem.builder()
                .action("DOSHA_ASSESSED")
                .performedByUserId(currentUser.getId())
                .performedByName(currentUser.getFullName())
                .performedByRole(userRole.name())
                .summary("Calculated Prakriti & Dosha constitution: " + assessment.getPrimaryDosha())
                .timestamp(LocalDateTime.now())
                .build());

        medicalRecordRepository.save(record);

        // Sync with Patient entity
        patient.setPrimaryDosha(assessment.getPrimaryDosha());
        patient.setVataPercentage(assessment.getVataPercentage());
        patient.setPittaPercentage(assessment.getPittaPercentage());
        patient.setKaphaPercentage(assessment.getKaphaPercentage());
        patientRepository.save(patient);

        auditService.log(
                AuditAction.UPDATE,
                "DOSHA_ASSESSMENT",
                patient.getId(),
                patient.getFullName(),
                "Dosha & Prakriti assessment recorded for " + patient.getFullName() + ": " + assessment.getPrimaryDosha()
        );

        return assessment;
    }

    // =========================================================
    // 8. SEARCH MEDICAL RECORDS
    // =========================================================
    @Override
    @Transactional(readOnly = true)
    public List<PatientMedicalRecord> searchMedicalRecords(String query) {
        User currentUser = getAuthenticatedUser();
        Role userRole = currentUser.getRole();

        if (userRole == Role.PATIENT) {
            throw new RuntimeException("Patients are not permitted to search across clinic records.");
        }

        List<PatientMedicalRecord> all = medicalRecordRepository.findAll();
        if (query == null || query.isBlank()) {
            return all;
        }

        String q = query.toLowerCase();
        return all.stream()
                .filter(r -> (r.getPrakritiDominant() != null && r.getPrakritiDominant().toLowerCase().contains(q))
                        || (r.getChronicConditions() != null && r.getChronicConditions().stream().anyMatch(c -> c.toLowerCase().contains(q)))
                        || (r.getAllergies() != null && r.getAllergies().stream().anyMatch(a -> a.toLowerCase().contains(q)))
                        || (r.getBloodGroup() != null && r.getBloodGroup().toLowerCase().contains(q))
                        || (r.getClinicalObservations() != null && r.getClinicalObservations().toLowerCase().contains(q)))
                .collect(Collectors.toList());
    }
}

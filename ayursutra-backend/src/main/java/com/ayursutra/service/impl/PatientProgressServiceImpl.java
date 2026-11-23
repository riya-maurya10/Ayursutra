package com.ayursutra.service.impl;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.TherapySessionStatus;
import com.ayursutra.dto.request.PatientProgressRequest;
import com.ayursutra.dto.response.PatientProgressResponse;
import com.ayursutra.entity.*;
import com.ayursutra.mapper.PatientProgressMapper;
import com.ayursutra.repository.*;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.PatientProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.Set;
import java.util.Objects;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PatientProgressServiceImpl implements PatientProgressService {

    private final PatientProgressRepository patientProgressRepository;
    private final PatientProgressMapper patientProgressMapper;
    private final PatientRepository patientRepository;
    private final TherapyPlanRepository therapyPlanRepository;
    private final TherapySessionRepository therapySessionRepository;
    private final TherapistRepository therapistRepository;
    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal)) {
            return null;
        }
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        return principal.getUser();
    }

    @Override
    public PatientProgressResponse createProgress(PatientProgressRequest request) {
        validateRequest(request, null);

        PatientProgress progress = patientProgressMapper.toEntity(request);

        User currentUser = getAuthenticatedUser();
        if (currentUser != null) {
            Role role = currentUser.getRole();
            if (role == Role.THERAPIST) {
                Therapist therapist = therapistRepository.findByUserId(currentUser.getId())
                        .or(() -> therapistRepository.findByEmail(currentUser.getEmail()))
                        .orElse(null);
                if (therapist != null) {
                    progress.setAssessedByTherapistId(therapist.getId());
                    progress.setAssessedByTherapistName(therapist.getFullName());
                } else {
                    progress.setAssessedByTherapistId(currentUser.getId());
                    progress.setAssessedByTherapistName(currentUser.getFullName());
                }
            } else if (role == Role.DOCTOR) {
                Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                        .or(() -> doctorRepository.findByEmail(currentUser.getEmail()))
                        .orElse(null);
                if (doctor != null) {
                    progress.setReviewedByDoctorId(doctor.getId());
                    progress.setReviewedByDoctorName(doctor.getFullName());
                } else {
                    progress.setReviewedByDoctorId(currentUser.getId());
                    progress.setReviewedByDoctorName(currentUser.getFullName());
                }
                progress.setReviewedAt(LocalDateTime.now());
            }
        }

        // If therapySessionId is provided, enrich therapyName if missing
        if (request.getTherapySessionId() != null && !request.getTherapySessionId().isBlank()) {
            therapySessionRepository.findById(request.getTherapySessionId().trim()).ifPresent(session -> {
                if (progress.getTherapyName() == null || progress.getTherapyName().isBlank()) {
                    progress.setTherapyName(session.getTherapyName());
                }
            });
        }

        progress.setCreatedAt(LocalDateTime.now());
        progress.setUpdatedAt(LocalDateTime.now());

        PatientProgress savedProgress = patientProgressRepository.save(progress);
        return patientProgressMapper.toResponse(savedProgress);
    }

    @Override
    public List<PatientProgressResponse> getAllProgress() {
        User currentUser = getAuthenticatedUser();
        if (currentUser != null && currentUser.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(currentUser.getId())
                    .or(() -> patientRepository.findByEmail(currentUser.getEmail()))
                    .orElse(null);
            if (patient != null) {
                return patientProgressRepository.findByPatientIdOrderByAssessmentDateDescDayNumberDesc(patient.getId())
                        .stream()
                        .map(patientProgressMapper::toResponse)
                        .toList();
            }
        }

        return patientProgressRepository.findAll()
                .stream()
                .sorted((a, b) -> {
                    if (a.getAssessmentDate() == null || b.getAssessmentDate() == null) return 0;
                    int cmp = b.getAssessmentDate().compareTo(a.getAssessmentDate());
                    if (cmp == 0 && a.getDayNumber() != null && b.getDayNumber() != null) {
                        return b.getDayNumber().compareTo(a.getDayNumber());
                    }
                    return cmp;
                })
                .map(patientProgressMapper::toResponse)
                .toList();
    }

    @Override
public List<PatientProgressResponse> getPendingReviewsForDoctor() {

    // Get logged-in user
    User currentUser = getAuthenticatedUser();

    // Only doctors can access their pending reviews
    if (currentUser == null || currentUser.getRole() != Role.DOCTOR) {
        throw new AccessDeniedException(
                "Access Denied: Only doctors can view their pending progress reviews."
        );
    }

    // Find the doctor's profile
    Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
            .or(() -> doctorRepository.findByEmail(currentUser.getEmail()))
            .orElse(null);

    // Collect doctor IDs for compatibility
    Set<String> doctorIds = new HashSet<>();

    if (doctor != null && doctor.getId() != null) {
        doctorIds.add(doctor.getId());
    }

    doctorIds.add(currentUser.getId());

    // Get all therapy plan IDs belonging to this doctor
    Set<String> therapyPlanIds = new HashSet<>();

    for (String doctorId : doctorIds) {
        therapyPlanRepository.findByDoctorId(doctorId)
                .forEach(plan -> therapyPlanIds.add(plan.getId()));
    }

    // Return empty list if doctor has no therapy plans
    if (therapyPlanIds.isEmpty()) {
        return List.of();
    }

    // Fetch only assessments that have not been reviewed
    return patientProgressRepository
            .findByTherapyPlanIdInAndReviewedAtIsNull(
                    new ArrayList<>(therapyPlanIds)
            )
            .stream()
            .sorted(
                    Comparator.comparing(
                            PatientProgress::getAssessmentDate,
                            Comparator.nullsLast(Comparator.reverseOrder())
                    )
            )
            .map(patientProgressMapper::toResponse)
            .toList();
}

    @Override
    public PatientProgressResponse getProgressById(String id) {
        PatientProgress progress = patientProgressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient progress assessment not found with ID: " + id));

        User currentUser = getAuthenticatedUser();
        if (currentUser != null && currentUser.getRole() == Role.PATIENT) {
            Patient patient = patientRepository.findByUserId(currentUser.getId())
                    .or(() -> patientRepository.findByEmail(currentUser.getEmail()))
                    .orElse(null);
            if (patient != null && !progress.getPatientId().equals(patient.getId()) && !progress.getPatientId().equals(patient.getUserId())) {
                throw new AccessDeniedException("Access Denied: You are not authorized to view another patient's progress.");
            }
        }

        return patientProgressMapper.toResponse(progress);
    }

    @Override
    public List<PatientProgressResponse> getProgressByPatient(String patientId) {
        // Resolve patient by id or userId
        Patient patient = patientRepository.findById(patientId)
                .or(() -> patientRepository.findByUserId(patientId))
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));

        User currentUser = getAuthenticatedUser();
        if (currentUser != null && currentUser.getRole() == Role.PATIENT) {
            boolean isOwn = (patient.getUserId() != null && patient.getUserId().equals(currentUser.getId()))
                    || (patient.getEmail() != null && patient.getEmail().equalsIgnoreCase(currentUser.getEmail()))
                    || java.util.Objects.equals(patient.getId(), currentUser.getId());
            if (!isOwn) {
                throw new AccessDeniedException("Access Denied: You are not authorized to view another patient's progress.");
            }
        }

        List<PatientProgress> progressList = patientProgressRepository
                .findByPatientIdOrderByAssessmentDateDescDayNumberDesc(patient.getId());

        // If empty by patient.getId(), also check if records were saved with patient.getUserId()
        if (progressList.isEmpty() && patient.getUserId() != null && !patient.getUserId().equals(patient.getId())) {
            progressList = patientProgressRepository
                    .findByPatientIdOrderByAssessmentDateDescDayNumberDesc(patient.getUserId());
        }

        return progressList.stream()
                .map(patientProgressMapper::toResponse)
                .toList();
    }

    @Override
    public List<PatientProgressResponse> getProgressByTherapyPlan(String therapyPlanId) {
        if (!therapyPlanRepository.existsById(therapyPlanId)) {
            throw new RuntimeException("Therapy plan not found with ID: " + therapyPlanId);
        }

        return patientProgressRepository.findByTherapyPlanId(therapyPlanId)
                .stream()
                .sorted((a, b) -> {
                    if (a.getAssessmentDate() == null || b.getAssessmentDate() == null) return 0;
                    return b.getAssessmentDate().compareTo(a.getAssessmentDate());
                })
                .map(patientProgressMapper::toResponse)
                .toList();
    }

    @Override
    public List<PatientProgressResponse> getProgressByPatientAndTherapyPlan(String patientId, String therapyPlanId) {
        Patient patient = patientRepository.findById(patientId)
                .or(() -> patientRepository.findByUserId(patientId))
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + patientId));

        if (!therapyPlanRepository.existsById(therapyPlanId)) {
            throw new RuntimeException("Therapy plan not found with ID: " + therapyPlanId);
        }

        User currentUser = getAuthenticatedUser();
        if (currentUser != null && currentUser.getRole() == Role.PATIENT) {
            boolean isOwn = (patient.getUserId() != null && patient.getUserId().equals(currentUser.getId()))
                    || (patient.getEmail() != null && patient.getEmail().equalsIgnoreCase(currentUser.getEmail()))
                    || java.util.Objects.equals(patient.getId(), currentUser.getId());
            if (!isOwn) {
                throw new AccessDeniedException("Access Denied: You are not authorized to view another patient's progress.");
            }
        }

        return patientProgressRepository.findByPatientIdAndTherapyPlanId(patient.getId(), therapyPlanId)
                .stream()
                .sorted((a, b) -> {
                    if (a.getAssessmentDate() == null || b.getAssessmentDate() == null) return 0;
                    return b.getAssessmentDate().compareTo(a.getAssessmentDate());
                })
                .map(patientProgressMapper::toResponse)
                .toList();
    }

    @Override
    public PatientProgressResponse getProgressByTherapySession(String therapySessionId) {
        if (therapySessionId == null || therapySessionId.isBlank()) {
            throw new RuntimeException("Therapy session ID is required.");
        }

        PatientProgress progress = patientProgressRepository.findByTherapySessionId(therapySessionId.trim())
                .orElseThrow(() -> new RuntimeException("No progress assessment found for therapy session: " + therapySessionId));

        return patientProgressMapper.toResponse(progress);
    }

    @Override
    public PatientProgressResponse updateProgress(String id, PatientProgressRequest request) {
        PatientProgress progress = patientProgressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient progress assessment not found with ID: " + id));

        validateRequest(request, progress);

        User currentUser = getAuthenticatedUser();
        if (currentUser != null) {
            Role role = currentUser.getRole();
            if (role == Role.THERAPIST) {
                Therapist therapist = therapistRepository.findByUserId(currentUser.getId())
                        .or(() -> therapistRepository.findByEmail(currentUser.getEmail()))
                        .orElse(null);
                if (therapist != null && progress.getAssessedByTherapistId() != null) {
                    if (!progress.getAssessedByTherapistId().equals(therapist.getId())
                            && !progress.getAssessedByTherapistId().equals(therapist.getUserId())) {
                        throw new AccessDeniedException("Access Denied: You cannot modify an assessment recorded by another therapist.");
                    }
                }
            } else if (role == Role.DOCTOR) {
                Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                        .or(() -> doctorRepository.findByEmail(currentUser.getEmail()))
                        .orElse(null);
                if (doctor != null) {
                    progress.setReviewedByDoctorId(doctor.getId());
                    progress.setReviewedByDoctorName(doctor.getFullName());
                } else {
                    progress.setReviewedByDoctorId(currentUser.getId());
                    progress.setReviewedByDoctorName(currentUser.getFullName());
                }
                progress.setReviewedAt(LocalDateTime.now());
            }
        }

        progress.setPatientId(request.getPatientId());
        progress.setTherapyPlanId(request.getTherapyPlanId());

        // Rule: Preserve existing therapySessionId if request does not send it
        if (request.getTherapySessionId() != null && !request.getTherapySessionId().isBlank()) {
            progress.setTherapySessionId(request.getTherapySessionId().trim());
        }

        if (request.getTherapyName() != null && !request.getTherapyName().isBlank()) {
            progress.setTherapyName(request.getTherapyName());
        } else if (progress.getTherapySessionId() != null) {
            therapySessionRepository.findById(progress.getTherapySessionId()).ifPresent(s -> {
                if (progress.getTherapyName() == null || progress.getTherapyName().isBlank()) {
                    progress.setTherapyName(s.getTherapyName());
                }
            });
        }

        progress.setAssessmentDate(request.getAssessmentDate());
        progress.setDayNumber(request.getDayNumber());

        if (request.getSymptoms() != null) progress.setSymptoms(request.getSymptoms());
        if (request.getObservations() != null) progress.setObservations(request.getObservations());
        if (request.getTherapyResponse() != null) progress.setTherapyResponse(request.getTherapyResponse());
        if (request.getDiscomfortSideEffects() != null) progress.setDiscomfortSideEffects(request.getDiscomfortSideEffects());

        String notes = request.getPractitionerNotes();
        if (notes == null || notes.isBlank()) {
            notes = request.getNotesForDoctor();
        }
        if (notes != null) progress.setPractitionerNotes(notes);

        if (request.getImprovementPercentage() != null) {
            progress.setImprovementPercentage(request.getImprovementPercentage());
        }
        if (request.getNextRecommendation() != null) {
            progress.setNextRecommendation(request.getNextRecommendation());
        }
        if (request.getClinicalAssessment() != null) {
            progress.setClinicalAssessment(request.getClinicalAssessment());
        }
        if (request.getTreatmentAdjustments() != null) {
            progress.setTreatmentAdjustments(request.getTreatmentAdjustments());
        }

        progress.setUpdatedAt(LocalDateTime.now());

        PatientProgress updated = patientProgressRepository.save(progress);
        return patientProgressMapper.toResponse(updated);
    }

    @Override
    public PatientProgressResponse doctorReviewProgress(String id, PatientProgressRequest request) {
        PatientProgress progress = patientProgressRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient progress assessment not found with ID: " + id));

        User currentUser = getAuthenticatedUser();
        if (currentUser != null && currentUser.getRole() != Role.DOCTOR && currentUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Access Denied: Only doctors or administrators can submit clinical progress reviews.");
        }

        if (request.getImprovementPercentage() != null) {
            if (request.getImprovementPercentage() < 0 || request.getImprovementPercentage() > 100) {
                throw new RuntimeException("Improvement percentage must be between 0 and 100.");
            }
            progress.setImprovementPercentage(request.getImprovementPercentage());
        }

        if (request.getClinicalAssessment() != null && !request.getClinicalAssessment().isBlank()) {
            progress.setClinicalAssessment(request.getClinicalAssessment().trim());
        }

        if (request.getNextRecommendation() != null && !request.getNextRecommendation().isBlank()) {
            progress.setNextRecommendation(request.getNextRecommendation().trim());
        }

        if (request.getTreatmentAdjustments() != null && !request.getTreatmentAdjustments().isBlank()) {
            progress.setTreatmentAdjustments(request.getTreatmentAdjustments().trim());
        }

        if (currentUser != null) {
            Doctor doctor = doctorRepository.findByUserId(currentUser.getId())
                    .or(() -> doctorRepository.findByEmail(currentUser.getEmail()))
                    .orElse(null);
            if (doctor != null) {
                progress.setReviewedByDoctorId(doctor.getId());
                progress.setReviewedByDoctorName(doctor.getFullName());
            } else {
                progress.setReviewedByDoctorId(currentUser.getId());
                progress.setReviewedByDoctorName(currentUser.getFullName());
            }
            progress.setReviewedAt(LocalDateTime.now());
        }

        progress.setUpdatedAt(LocalDateTime.now());

        PatientProgress updated = patientProgressRepository.save(progress);
        return patientProgressMapper.toResponse(updated);
    }

    @Override
    public void deleteProgress(String id) {
        if (!patientProgressRepository.existsById(id)) {
            throw new RuntimeException("Patient progress assessment not found with ID: " + id);
        }

        User currentUser = getAuthenticatedUser();
        if (currentUser != null && currentUser.getRole() == Role.PATIENT) {
            throw new AccessDeniedException("Access Denied: Patients cannot delete clinical progress assessments.");
        }

        patientProgressRepository.deleteById(id);
    }

    private void validateRequest(PatientProgressRequest request, PatientProgress existing) {
        if (request == null) {
            throw new RuntimeException("Request body cannot be null.");
        }

        // 1. Patient must exist
        Patient patient = patientRepository.findById(request.getPatientId())
                .or(() -> patientRepository.findByUserId(request.getPatientId()))
                .orElseThrow(() -> new RuntimeException("Patient not found with ID: " + request.getPatientId()));

        // 2. Therapy plan must exist
        TherapyPlan plan = therapyPlanRepository.findById(request.getTherapyPlanId())
                .orElseThrow(() -> new RuntimeException("Therapy plan not found with ID: " + request.getTherapyPlanId()));

        // 3. Therapy plan must belong to the selected patient
        boolean planMatchesPatient = Objects.equals(plan.getPatientId(), patient.getId())
                || (patient.getUserId() != null && Objects.equals(plan.getPatientId(), patient.getUserId()));
        if (!planMatchesPatient) {
            throw new RuntimeException("Therapy plan " + plan.getId() + " does not belong to patient " + patient.getId());
        }

        if (request.getAssessmentDate() == null) {
            throw new RuntimeException("Assessment date is required.");
        }

        if (request.getDayNumber() == null || request.getDayNumber() <= 0) {
            throw new RuntimeException("Day number must be greater than zero.");
        }

        if (request.getImprovementPercentage() != null) {
            if (request.getImprovementPercentage() < 0 || request.getImprovementPercentage() > 100) {
                throw new RuntimeException("Improvement percentage must be between 0 and 100.");
            }
        }

        // 4. Validate Therapy Session (if provided)
        String sessionId = request.getTherapySessionId();
        if (sessionId != null && !sessionId.isBlank()) {
            TherapySession session = therapySessionRepository.findById(sessionId.trim())
                    .orElseThrow(() -> new RuntimeException("Therapy session not found with ID: " + sessionId));

            // Session must belong to the same patient
            boolean sessionMatchesPatient = Objects.equals(session.getPatientId(), patient.getId())
                    || (patient.getUserId() != null && Objects.equals(session.getPatientId(), patient.getUserId()));
            if (!sessionMatchesPatient) {
                throw new RuntimeException("Therapy session does not belong to the selected patient.");
            }

            // Session must belong to the same therapy plan
            if (!Objects.equals(session.getTherapyPlanId(), plan.getId())) {
                throw new RuntimeException("Therapy session does not belong to the selected therapy plan.");
            }

            // Session must have COMPLETED status
            if (session.getStatus() != TherapySessionStatus.COMPLETED) {
                throw new RuntimeException("Progress assessment can only be submitted for completed therapy sessions. Current session status is: " + session.getStatus());
            }

            // Prevent duplicate progress assessments for the same therapy session
            Optional<PatientProgress> duplicate = patientProgressRepository.findByTherapySessionId(sessionId.trim());
            if (duplicate.isPresent()) {
                if (existing == null || !duplicate.get().getId().equals(existing.getId())) {
                    throw new RuntimeException("A progress assessment has already been created for therapy session: " + sessionId);
                }
            }

            // Security check: If current user is a THERAPIST, ensure session is assigned to them
            User currentUser = getAuthenticatedUser();
            if (currentUser != null && currentUser.getRole() == Role.THERAPIST) {
                Therapist therapist = therapistRepository.findByUserId(currentUser.getId())
                        .or(() -> therapistRepository.findByEmail(currentUser.getEmail()))
                        .orElse(null);
                if (therapist == null) {
                    throw new AccessDeniedException("Access Denied: Therapist profile not found for authenticated user.");
                }
                if (session.getTherapistId() == null || session.getTherapistId().isBlank()) {
                    throw new AccessDeniedException("Access Denied: You can only record progress assessments for therapy sessions assigned to you.");
                }
                boolean isAssigned = session.getTherapistId().equals(therapist.getId())
                        || session.getTherapistId().equals(therapist.getUserId());
                if (!isAssigned) {
                    throw new AccessDeniedException("Access Denied: You can only record progress assessments for therapy sessions assigned to you.");
                }
            }
        }
    }
}

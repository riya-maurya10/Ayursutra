package com.ayursutra.service.impl;

import com.ayursutra.constant.AuditAction;
import com.ayursutra.constant.InvitationStatus;
import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import com.ayursutra.dto.request.CreateStaffInvitationRequest;
import com.ayursutra.dto.request.StaffRegistrationRequest;
import com.ayursutra.dto.response.StaffInvitationResponse;
import com.ayursutra.entity.*;
import com.ayursutra.repository.*;
import com.ayursutra.service.AuditService;
import com.ayursutra.service.NotificationService;
import com.ayursutra.service.StaffInvitationService;
import com.ayursutra.constant.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffInvitationServiceImpl implements StaffInvitationService {

    private final StaffInvitationRepository staffInvitationRepository;
    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final TherapistRepository therapistRepository;
    private final ReceptionistRepository receptionistRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final NotificationService notificationService;

    private static final String DEFAULT_FRONTEND_URL = "http://localhost:5173";

    private String generateSecureToken() {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private StaffInvitationResponse toResponse(StaffInvitation invitation) {
        boolean isExpired = invitation.isExpired();
        String link = DEFAULT_FRONTEND_URL + "/staff/register?token=" + invitation.getInvitationToken();

        return StaffInvitationResponse.builder()
                .id(invitation.getId())
                .invitationToken(invitation.getInvitationToken())
                .email(invitation.getEmail())
                .fullName(invitation.getFullName())
                .phone(invitation.getPhone())
                .role(invitation.getRole())
                .clinicId(invitation.getClinicId() != null ? invitation.getClinicId() : "CLINIC-MAIN")
                .clinicName(invitation.getClinicName() != null ? invitation.getClinicName() : "AyurSutra Central Clinic")
                .status(isExpired && invitation.getStatus() == InvitationStatus.PENDING ? InvitationStatus.EXPIRED : invitation.getStatus())
                .expiresAt(invitation.getExpiresAt())
                .invitationLink(link)
                .invitedByEmail(invitation.getInvitedByEmail())
                .registeredUserId(invitation.getRegisteredUserId())
                .createdAt(invitation.getCreatedAt())
                .expired(isExpired)
                .build();
    }

    @Override
    public StaffInvitationResponse createInvitation(CreateStaffInvitationRequest request, String adminEmail) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            User existing = userRepository.findByEmail(email).orElse(null);
            if (existing != null && existing.getEffectiveVerificationStatus() == VerificationStatus.APPROVED) {
                throw new RuntimeException("An approved staff or user account already exists with email: " + email);
            }
        }

        // Check if pending invitation already exists for this email
        staffInvitationRepository.findByEmailAndStatus(email, InvitationStatus.PENDING)
                .ifPresent(inv -> {
                    inv.setStatus(InvitationStatus.REVOKED);
                    staffInvitationRepository.save(inv);
                });

        StaffInvitation invitation = new StaffInvitation();
        invitation.setEmail(email);
        invitation.setFullName(request.getFullName() != null ? request.getFullName().trim() : null);
        invitation.setPhone(request.getPhone() != null ? request.getPhone().trim() : null);
        invitation.setRole(request.getRole());
        invitation.setClinicId(request.getClinicId() != null ? request.getClinicId().trim() : "CLINIC-MAIN");
        invitation.setClinicName("AyurSutra Central Clinic");
        invitation.setStatus(InvitationStatus.PENDING);
        invitation.setInvitationToken(generateSecureToken());

        int days = (request.getExpiryDays() != null && request.getExpiryDays() > 0) ? request.getExpiryDays() : 7;
        invitation.setExpiresAt(LocalDateTime.now().plusDays(days));
        invitation.setInvitedByEmail(adminEmail != null ? adminEmail : "admin@ayursutra.com");

        StaffInvitation saved = staffInvitationRepository.save(invitation);

        auditService.log(
                AuditAction.CREATE,
                "StaffInvitation",
                saved.getId(),
                email,
                "Created staff invitation for " + email + " with role " + saved.getRole()
        );

        return toResponse(saved);
    }

    @Override
    public List<StaffInvitationResponse> getAllInvitations(String clinicId, Role role, InvitationStatus status) {
        String activeClinicId = (clinicId != null && !clinicId.isBlank()) ? clinicId : "CLINIC-MAIN";
        List<StaffInvitation> invitations = staffInvitationRepository.findByClinicIdOrderByCreatedAtDesc(activeClinicId);

        List<StaffInvitationResponse> responses = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (StaffInvitation inv : invitations) {
            // Check expiry and update if needed
            if (inv.getStatus() == InvitationStatus.PENDING && inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(now)) {
                inv.setStatus(InvitationStatus.EXPIRED);
                staffInvitationRepository.save(inv);
            }

            if (role != null && inv.getRole() != role) {
                continue;
            }
            if (status != null && inv.getStatus() != status) {
                continue;
            }

            responses.add(toResponse(inv));
        }

        return responses;
    }

    @Override
    public StaffInvitationResponse getInvitationByToken(String token) {
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Invitation token is required.");
        }

        StaffInvitation invitation = staffInvitationRepository.findByInvitationToken(token.trim())
                .orElseThrow(() -> new RuntimeException("Invalid or unrecognized invitation link."));

        if (invitation.getStatus() == InvitationStatus.REVOKED) {
            throw new RuntimeException("This invitation has been revoked by the clinic administration.");
        }

        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
            throw new RuntimeException("This invitation has already been used to complete registration.");
        }

        if (invitation.isExpired()) {
            invitation.setStatus(InvitationStatus.EXPIRED);
            staffInvitationRepository.save(invitation);
            throw new RuntimeException("This invitation link has expired. Please contact the clinic administrator for a new invitation.");
        }

        return toResponse(invitation);
    }

    @Override
    public StaffInvitationResponse resendInvitation(String invitationId, String adminEmail) {
        StaffInvitation invitation = staffInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found with ID: " + invitationId));

        invitation.setExpiresAt(LocalDateTime.now().plusDays(7));
        invitation.setStatus(InvitationStatus.PENDING);
        // refresh token if desired
        invitation.setInvitationToken(generateSecureToken());
        StaffInvitation saved = staffInvitationRepository.save(invitation);

        auditService.log(
                AuditAction.UPDATE,
                "StaffInvitation",
                saved.getId(),
                saved.getEmail(),
                "Resent/extended staff invitation for " + saved.getEmail()
        );

        return toResponse(saved);
    }

    @Override
    public StaffInvitationResponse revokeInvitation(String invitationId, String adminEmail) {
        StaffInvitation invitation = staffInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found with ID: " + invitationId));

        invitation.setStatus(InvitationStatus.REVOKED);
        StaffInvitation saved = staffInvitationRepository.save(invitation);

        auditService.log(
                AuditAction.DELETE,
                "StaffInvitation",
                saved.getId(),
                saved.getEmail(),
                "Revoked staff invitation for " + saved.getEmail()
        );

        return toResponse(saved);
    }

    @Override
    public String registerStaff(StaffRegistrationRequest request) {
        String rawToken = request.getToken();
        if (rawToken == null || rawToken.isBlank()) {
            throw new RuntimeException("Invitation token is required.");
        }

        StaffInvitation invitation = staffInvitationRepository.findByInvitationToken(rawToken.trim())
                .orElseThrow(() -> new RuntimeException("Invalid invitation token."));

        if (invitation.getStatus() != InvitationStatus.PENDING || invitation.isExpired()) {
            throw new RuntimeException("This invitation is no longer valid or has expired.");
        }

        String email = (request.getEmail() != null && !request.getEmail().isBlank())
                ? request.getEmail().trim().toLowerCase()
                : invitation.getEmail().trim().toLowerCase();

        if (!email.equalsIgnoreCase(invitation.getEmail().trim().toLowerCase())) {
            throw new RuntimeException("Registration email does not match the invitation email (" + invitation.getEmail() + ").");
        }

        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("An account already exists with email: " + email);
        }

        // Role and clinic are strictly derived from the verified invitation - applicant cannot alter role!
        Role assignedRole = invitation.getRole();
        String clinicId = invitation.getClinicId() != null ? invitation.getClinicId() : "CLINIC-MAIN";

        // 1. Create User
        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPhone(request.getPhone().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(assignedRole);
        user.setClinicId(clinicId);
        user.setEnabled(false); // Account inactive until verified by admin!
        user.setVerificationStatus(VerificationStatus.PENDING_VERIFICATION);

        User savedUser = userRepository.save(user);

        // 2. Create Role Profile
        if (assignedRole == Role.DOCTOR) {
            Doctor doctor = new Doctor();
            doctor.setUserId(savedUser.getId());
            doctor.setFullName(savedUser.getFullName());
            doctor.setEmail(savedUser.getEmail());
            doctor.setPhone(savedUser.getPhone());
            doctor.setQualification(request.getQualification() != null ? request.getQualification().trim() : "BAMS");
            doctor.setSpecialization(request.getSpecialization() != null ? request.getSpecialization().trim() : "Ayurveda & Panchakarma");
            doctor.setLicenseNumber(request.getMedicalRegistrationNumber() != null ? request.getMedicalRegistrationNumber().trim() : "REG-PENDING");
            doctor.setStateCouncil(request.getStateCouncil() != null ? request.getStateCouncil().trim() : "");
            doctor.setExperienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0);
            doctor.setAddress(request.getAddress());
            doctor.setDegreeCertificateUrl(request.getDegreeCertificateUrl());
            doctor.setRegistrationCertificateUrl(request.getRegistrationCertificateUrl());
            doctor.setAdditionalCertificatesUrl(request.getAdditionalCertificatesUrl());
            doctor.setClinicId(clinicId);
            doctor.setAvailable(false);
            doctorRepository.save(doctor);
        } else if (assignedRole == Role.THERAPIST) {
            Therapist therapist = new Therapist();
            therapist.setUserId(savedUser.getId());
            therapist.setFullName(savedUser.getFullName());
            therapist.setEmail(savedUser.getEmail());
            therapist.setPhone(savedUser.getPhone());
            therapist.setQualification(request.getQualification() != null ? request.getQualification().trim() : "Ayurvedic Therapy Diploma");
            therapist.setSpecialization(request.getSpecialization() != null ? request.getSpecialization().trim() : (request.getTherapistType() != null ? request.getTherapistType() : "Panchakarma"));
            therapist.setTherapistType(request.getTherapistType() != null ? request.getTherapistType() : "Panchakarma Therapist");
            therapist.setExperienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : 0);
            therapist.setTherapySkills(request.getTherapySkills() != null ? request.getTherapySkills() : List.of("Abhyanga", "Shirodhara", "Swedana"));
            therapist.setTrainingCertifications(request.getTrainingCertifications());
            therapist.setQualificationCertificateUrl(request.getQualificationCertificateUrl());
            therapist.setTrainingCertificateUrl(request.getTrainingCertificateUrl());
            therapist.setAddress(request.getAddress());
            therapist.setClinicId(clinicId);
            therapist.setAvailable(false);
            therapistRepository.save(therapist);
        } else if (assignedRole == Role.RECEPTIONIST) {
            Receptionist receptionist = new Receptionist();
            receptionist.setUserId(savedUser.getId());
            receptionist.setFullName(savedUser.getFullName());
            receptionist.setEmail(savedUser.getEmail());
            receptionist.setPhone(savedUser.getPhone());
            receptionist.setAddress(request.getAddress());
            receptionist.setIdProofDocumentUrl(request.getIdProofDocumentUrl());
            receptionist.setClinicId(clinicId);
            receptionist.setAvailable(false);
            receptionistRepository.save(receptionist);
        }

        // 3. Mark Invitation Accepted
        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitation.setRegisteredUserId(savedUser.getId());
        staffInvitationRepository.save(invitation);

        auditService.log(
                AuditAction.CREATE,
                "StaffRegistration",
                savedUser.getId(),
                savedUser.getEmail(),
                "Staff member " + savedUser.getFullName() + " completed registration as " + assignedRole + " (Pending Verification)"
        );

        notificationService.sendNotificationToRole(
                Role.ADMIN,
                "New Staff Registration",
                "Staff member " + savedUser.getFullName() + " registered as " + assignedRole + " and is pending verification.",
                NotificationType.STAFF_REGISTRATION,
                "/admin/staff-verifications"
        );

        return "Registration submitted successfully! Your account is now pending verification by the clinic administrator.";
    }
}

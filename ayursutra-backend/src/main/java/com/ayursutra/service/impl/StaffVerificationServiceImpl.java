package com.ayursutra.service.impl;

import com.ayursutra.constant.AuditAction;
import com.ayursutra.constant.NotificationType;
import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import com.ayursutra.dto.response.StaffVerificationApplicationResponse;
import com.ayursutra.entity.Doctor;
import com.ayursutra.entity.Receptionist;
import com.ayursutra.entity.Therapist;
import com.ayursutra.entity.User;
import com.ayursutra.repository.DoctorRepository;
import com.ayursutra.repository.ReceptionistRepository;
import com.ayursutra.repository.TherapistRepository;
import com.ayursutra.repository.UserRepository;
import com.ayursutra.service.AuditService;
import com.ayursutra.service.NotificationService;
import com.ayursutra.service.StaffVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class StaffVerificationServiceImpl implements StaffVerificationService {

    private final UserRepository userRepository;
    private final DoctorRepository doctorRepository;
    private final TherapistRepository therapistRepository;
    private final ReceptionistRepository receptionistRepository;
    private final AuditService auditService;
    private final NotificationService notificationService;

    private static final Set<Role> STAFF_ROLES = Set.of(Role.DOCTOR, Role.THERAPIST, Role.RECEPTIONIST);

    private StaffVerificationApplicationResponse buildApplicationResponse(User user) {
        StaffVerificationApplicationResponse.StaffVerificationApplicationResponseBuilder builder =
                StaffVerificationApplicationResponse.builder()
                        .userId(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .role(user.getRole())
                        .clinicId(user.getClinicId())
                        .verificationStatus(user.getEffectiveVerificationStatus())
                        .rejectionReason(user.getRejectionReason())
                        .enabled(user.isEnabled())
                        .registeredAt(user.getCreatedAt());

        Map<String, String> uploadedDocs = new LinkedHashMap<>();

        if (user.getRole() == Role.DOCTOR) {
            Doctor doc = doctorRepository.findByUserId(user.getId())
                    .or(() -> doctorRepository.findByEmail(user.getEmail()))
                    .orElse(null);

            if (doc != null) {
                builder.qualification(doc.getQualification())
                        .specialization(doc.getSpecialization())
                        .medicalRegistrationNumber(doc.getLicenseNumber())
                        .stateCouncil(doc.getStateCouncil())
                        .experienceYears(doc.getExperienceYears())
                        .address(doc.getAddress());

                if (doc.getDegreeCertificateUrl() != null && !doc.getDegreeCertificateUrl().isBlank()) {
                    uploadedDocs.put("Degree Certificate", doc.getDegreeCertificateUrl());
                }
                if (doc.getRegistrationCertificateUrl() != null && !doc.getRegistrationCertificateUrl().isBlank()) {
                    uploadedDocs.put("Medical Registration Certificate", doc.getRegistrationCertificateUrl());
                }
                if (doc.getAdditionalCertificatesUrl() != null && !doc.getAdditionalCertificatesUrl().isBlank()) {
                    uploadedDocs.put("Additional Qualifications", doc.getAdditionalCertificatesUrl());
                }
            }
        } else if (user.getRole() == Role.THERAPIST) {
            Therapist therapist = therapistRepository.findByUserId(user.getId())
                    .or(() -> therapistRepository.findByEmail(user.getEmail()))
                    .orElse(null);

            if (therapist != null) {
                builder.qualification(therapist.getQualification() != null ? therapist.getQualification() : therapist.getSpecialization())
                        .specialization(therapist.getSpecialization())
                        .therapistType(therapist.getTherapistType())
                        .therapySkills(therapist.getTherapySkills())
                        .trainingCertifications(therapist.getTrainingCertifications())
                        .experienceYears(therapist.getExperienceYears())
                        .address(therapist.getAddress());

                if (therapist.getQualificationCertificateUrl() != null && !therapist.getQualificationCertificateUrl().isBlank()) {
                    uploadedDocs.put("Qualification Certificate", therapist.getQualificationCertificateUrl());
                }
                if (therapist.getTrainingCertificateUrl() != null && !therapist.getTrainingCertificateUrl().isBlank()) {
                    uploadedDocs.put("Training Certificate", therapist.getTrainingCertificateUrl());
                }
            }
        } else if (user.getRole() == Role.RECEPTIONIST) {
            Receptionist rec = receptionistRepository.findByUserId(user.getId())
                    .or(() -> receptionistRepository.findByEmail(user.getEmail()))
                    .orElse(null);

            if (rec != null) {
                builder.address(rec.getAddress());
                if (rec.getIdProofDocumentUrl() != null && !rec.getIdProofDocumentUrl().isBlank()) {
                    uploadedDocs.put("Identity / Supporting Document", rec.getIdProofDocumentUrl());
                }
            }
        }

        builder.uploadedDocuments(uploadedDocs);
        return builder.build();
    }

    @Override
    public List<StaffVerificationApplicationResponse> getPendingApplications(String clinicId, Role role) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> STAFF_ROLES.contains(u.getRole()))
                .filter(u -> u.getEffectiveVerificationStatus() == VerificationStatus.PENDING_VERIFICATION)
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> clinicId == null || clinicId.isBlank() || Objects.equals(u.getClinicId(), clinicId))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        return users.stream().map(this::buildApplicationResponse).collect(Collectors.toList());
    }

    @Override
    public List<StaffVerificationApplicationResponse> getAllApplications(String clinicId, Role role, VerificationStatus status) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> STAFF_ROLES.contains(u.getRole()))
                .filter(u -> role == null || u.getRole() == role)
                .filter(u -> status == null || u.getEffectiveVerificationStatus() == status)
                .filter(u -> clinicId == null || clinicId.isBlank() || Objects.equals(u.getClinicId(), clinicId))
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .collect(Collectors.toList());

        return users.stream().map(this::buildApplicationResponse).collect(Collectors.toList());
    }

    @Override
    public StaffVerificationApplicationResponse getApplicationDetails(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User application not found with ID: " + userId));

        if (!STAFF_ROLES.contains(user.getRole())) {
            throw new RuntimeException("Requested user is not a staff member: " + user.getRole());
        }

        return buildApplicationResponse(user);
    }

    @Override
    public StaffVerificationApplicationResponse approveApplication(String userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User application not found with ID: " + userId));

        user.setVerificationStatus(VerificationStatus.APPROVED);
        user.setEnabled(true);
        user.setRejectionReason(null);
        userRepository.save(user);

        // Enable availability in role entity
        if (user.getRole() == Role.DOCTOR) {
            doctorRepository.findByUserId(user.getId())
                    .or(() -> doctorRepository.findByEmail(user.getEmail()))
                    .ifPresent(doc -> {
                        doc.setAvailable(true);
                        doctorRepository.save(doc);
                    });
        } else if (user.getRole() == Role.THERAPIST) {
            therapistRepository.findByUserId(user.getId())
                    .or(() -> therapistRepository.findByEmail(user.getEmail()))
                    .ifPresent(th -> {
                        th.setAvailable(true);
                        therapistRepository.save(th);
                    });
        } else if (user.getRole() == Role.RECEPTIONIST) {
            receptionistRepository.findByUserId(user.getId())
                    .or(() -> receptionistRepository.findByEmail(user.getEmail()))
                    .ifPresent(rec -> {
                        rec.setAvailable(true);
                        receptionistRepository.save(rec);
                    });
        }

        auditService.log(
                AuditAction.ACTIVATE,
                "USER",
                user.getId(),
                user.getFullName(),
                "Admin (" + adminEmail + ") approved staff application for " + user.getRole()
        );

        notificationService.sendNotificationToUser(
                user.getId(),
                "Staff Application Approved",
                "Congratulations! Your staff profile as " + user.getRole() + " has been approved by the Clinic Administrator.",
                NotificationType.STAFF_VERIFICATION,
                "/login"
        );

        notificationService.sendNotificationToRole(
                Role.ADMIN,
                "Staff Application Approved",
                "Staff member " + user.getFullName() + " (" + user.getRole() + ") was approved by " + adminEmail + ".",
                NotificationType.STAFF_VERIFICATION,
                "/admin/staff-verifications"
        );

        return buildApplicationResponse(user);
    }

    @Override
    public StaffVerificationApplicationResponse rejectApplication(String userId, String reason, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User application not found with ID: " + userId));

        user.setVerificationStatus(VerificationStatus.REJECTED);
        user.setEnabled(false);
        user.setRejectionReason(reason != null && !reason.isBlank() ? reason : "Application rejected by clinic administration.");
        userRepository.save(user);

        if (user.getRole() == Role.DOCTOR) {
            doctorRepository.findByUserId(user.getId())
                    .or(() -> doctorRepository.findByEmail(user.getEmail()))
                    .ifPresent(doc -> {
                        doc.setAvailable(false);
                        doctorRepository.save(doc);
                    });
        } else if (user.getRole() == Role.THERAPIST) {
            therapistRepository.findByUserId(user.getId())
                    .or(() -> therapistRepository.findByEmail(user.getEmail()))
                    .ifPresent(th -> {
                        th.setAvailable(false);
                        therapistRepository.save(th);
                    });
        } else if (user.getRole() == Role.RECEPTIONIST) {
            receptionistRepository.findByUserId(user.getId())
                    .or(() -> receptionistRepository.findByEmail(user.getEmail()))
                    .ifPresent(rec -> {
                        rec.setAvailable(false);
                        receptionistRepository.save(rec);
                    });
        }

        notificationService.sendNotificationToUser(
                user.getId(),
                "Staff Application Status Update",
                "Your application for " + user.getRole() + " was not approved. Reason: " + user.getRejectionReason(),
                NotificationType.STAFF_VERIFICATION,
                "/login"
        );

        notificationService.sendNotificationToRole(
                Role.ADMIN,
                "Staff Application Rejected",
                "Staff application for " + user.getFullName() + " (" + user.getRole() + ") was rejected.",
                NotificationType.STAFF_VERIFICATION,
                "/admin/staff-verifications"
        );

        auditService.log(
                AuditAction.DEACTIVATE,
                "USER",
                user.getId(),
                user.getFullName(),
                "Admin (" + adminEmail + ") rejected staff application: " + user.getRejectionReason()
        );

        return buildApplicationResponse(user);
    }

    @Override
    public StaffVerificationApplicationResponse suspendStaff(String userId, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User application not found with ID: " + userId));

        user.setVerificationStatus(VerificationStatus.SUSPENDED);
        user.setEnabled(false);
        userRepository.save(user);

        if (user.getRole() == Role.DOCTOR) {
            doctorRepository.findByUserId(user.getId())
                    .or(() -> doctorRepository.findByEmail(user.getEmail()))
                    .ifPresent(doc -> {
                        doc.setAvailable(false);
                        doctorRepository.save(doc);
                    });
        } else if (user.getRole() == Role.THERAPIST) {
            therapistRepository.findByUserId(user.getId())
                    .or(() -> therapistRepository.findByEmail(user.getEmail()))
                    .ifPresent(th -> {
                        th.setAvailable(false);
                        therapistRepository.save(th);
                    });
        } else if (user.getRole() == Role.RECEPTIONIST) {
            receptionistRepository.findByUserId(user.getId())
                    .or(() -> receptionistRepository.findByEmail(user.getEmail()))
                    .ifPresent(rec -> {
                        rec.setAvailable(false);
                        receptionistRepository.save(rec);
                    });
        }

        auditService.log(
                AuditAction.DEACTIVATE,
                "USER",
                user.getId(),
                user.getFullName(),
                "Admin (" + adminEmail + ") suspended staff account (" + user.getRole() + ")"
        );

        return buildApplicationResponse(user);
    }
}

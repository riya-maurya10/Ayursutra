package com.ayursutra.dto.response;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffVerificationApplicationResponse {

    private String userId;

    private String fullName;

    private String email;

    private String phone;

    private Role role;

    private String clinicId;

    private VerificationStatus verificationStatus;

    private String rejectionReason;

    private boolean enabled;

    private LocalDateTime registeredAt;

    private String address;

    // Doctor specific info
    private String qualification;

    private String specialization;

    private String medicalRegistrationNumber;

    private String stateCouncil;

    private Integer experienceYears;

    // Therapist specific info
    private String therapistType;

    private List<String> therapySkills;

    private String trainingCertifications;

    // Document links and previews (Name -> URL)
    private Map<String, String> uploadedDocuments;

}

package com.ayursutra.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class StaffRegistrationRequest {

    private String token;

    private String invitationToken;

    public String getToken() {
        if (token != null && !token.isBlank()) {
            return token;
        }
        return invitationToken;
    }

    @NotBlank(message = "Full name is required")
    private String fullName;

    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;

    private String address;

    // Doctor specific fields
    private String qualification;

    private String specialization;

    private String medicalRegistrationNumber; // licenseNumber

    private String stateCouncil;

    private Integer experienceYears;

    private String degreeCertificateUrl;

    private String registrationCertificateUrl;

    private String additionalCertificatesUrl;

    // Therapist specific fields
    private String therapistType;

    private List<String> therapySkills;

    private String trainingCertifications;

    private String qualificationCertificateUrl;

    private String trainingCertificateUrl;

    // Receptionist specific fields
    private String idProofDocumentUrl;

}

package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DoctorResponse {

    private String id;

    private String userId;

    private String fullName;

    private String email;

    private String phone;

    private String specialization;

    private String qualification;

    private int experienceYears;

    private String licenseNumber;

    private String stateCouncil;

    private String address;

    private String degreeCertificateUrl;

    private String registrationCertificateUrl;

    private String additionalCertificatesUrl;

    private String clinicId;

    private boolean available;

    private String profilePictureUrl;

    private String gender;

    private java.time.LocalDate dateOfBirth;

    public DoctorResponse(String id, String userId, String fullName, String email, String phone,
                          String specialization, String qualification, int experienceYears,
                          String licenseNumber, boolean available) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.specialization = specialization;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
        this.licenseNumber = licenseNumber;
        this.available = available;
    }
}
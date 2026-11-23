package com.ayursutra.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TherapistResponse {

    private String id;

    private String userId;

    private String fullName;

    private String email;

    private String phone;

    private String specialization;

    private String qualification;

    private int experienceYears;

    private String therapistType;

    private List<String> therapySkills;

    private String trainingCertifications;

    private String qualificationCertificateUrl;

    private String trainingCertificateUrl;

    private String address;

    private String clinicId;

    private boolean available;

    private String profilePictureUrl;

    private String gender;

    private java.time.LocalDate dateOfBirth;

    public TherapistResponse(String id, String userId, String fullName, String email, String phone,
                             String specialization, String qualification, int experienceYears,
                             String therapistType, boolean available) {
        this.id = id;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.specialization = specialization;
        this.qualification = qualification;
        this.experienceYears = experienceYears;
        this.therapistType = therapistType;
        this.available = available;
    }
}
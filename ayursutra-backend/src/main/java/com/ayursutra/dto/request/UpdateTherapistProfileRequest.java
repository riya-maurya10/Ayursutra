package com.ayursutra.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class UpdateTherapistProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String specialization;

    private String qualification;

    private Integer experienceYears;

    private String therapistType;

    private List<String> therapySkills;

    private String trainingCertifications;

    private String address;

    private Boolean available;

    private String profilePictureUrl;

    private String gender;

    private LocalDate dateOfBirth;
}

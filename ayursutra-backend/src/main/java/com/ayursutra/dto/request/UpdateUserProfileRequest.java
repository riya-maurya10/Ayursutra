package com.ayursutra.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateUserProfileRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    private String gender;

    private LocalDate dateOfBirth;

    private String profilePictureUrl;

    private String emergencyContact;

    private String bloodGroup;

    private String address;
}

package com.ayursutra.dto.request;

import com.ayursutra.constant.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateStaffInvitationRequest {

    @NotBlank(message = "Staff email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String fullName;

    private String phone;

    @NotNull(message = "Role is required")
    private Role role; // DOCTOR, THERAPIST, or RECEPTIONIST

    private Integer expiryDays = 7;

    private String clinicId = "CLINIC-MAIN";

}

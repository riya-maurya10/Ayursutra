package com.ayursutra.dto.response;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private String id;

    private String fullName;

    private String email;

    private String phone;

    private Role role;

    private boolean enabled;

    private VerificationStatus verificationStatus;

    private String rejectionReason;

    private String clinicId;

    private String profilePictureUrl;

    private String gender;

    private java.time.LocalDate dateOfBirth;

    private String emergencyContact;

    private String bloodGroup;

    private String address;

    private java.time.LocalDateTime lastLogin;

    private java.time.LocalDateTime createdAt;

    public UserResponse(String id, String fullName, String email, String phone, Role role, boolean enabled) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.enabled = enabled;
        this.verificationStatus = enabled ? VerificationStatus.APPROVED : VerificationStatus.PENDING_VERIFICATION;
        this.clinicId = "CLINIC-MAIN";
    }
}
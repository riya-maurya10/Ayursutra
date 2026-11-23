package com.ayursutra.entity;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document(collection = "users")
public class User extends BaseEntity {

    private String fullName;

    private String email;

    private String password;

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

    private String resetPasswordToken;

    private java.time.LocalDateTime resetPasswordTokenExpiry;

    private Integer resetPasswordAttempts;

    private java.time.LocalDateTime lastResetPasswordRequestAt;

    private Boolean resetPasswordVerified;

    public VerificationStatus getEffectiveVerificationStatus() {
        if (role == Role.PATIENT || role == Role.ADMIN) {
            return VerificationStatus.APPROVED;
        }
        if (verificationStatus != null) {
            return verificationStatus;
        }
        return isEnabled() ? VerificationStatus.APPROVED : VerificationStatus.PENDING_VERIFICATION;
    }

}
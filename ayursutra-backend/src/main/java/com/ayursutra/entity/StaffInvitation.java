package com.ayursutra.entity;

import com.ayursutra.constant.InvitationStatus;
import com.ayursutra.constant.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@Document(collection = "staff_invitations")
public class StaffInvitation extends BaseEntity {

    private String invitationToken;

    private String email;

    private String fullName;

    private String phone;

    private Role role; // DOCTOR, THERAPIST, RECEPTIONIST

    private String clinicId;

    private String clinicName;

    private InvitationStatus status = InvitationStatus.PENDING;

    private LocalDateTime expiresAt;

    private String invitedByEmail;

    private String registeredUserId;

    public boolean isExpired() {
        if (status == InvitationStatus.EXPIRED) {
            return true;
        }
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

}

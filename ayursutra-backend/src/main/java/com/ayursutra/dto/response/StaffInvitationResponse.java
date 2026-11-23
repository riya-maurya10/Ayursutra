package com.ayursutra.dto.response;

import com.ayursutra.constant.InvitationStatus;
import com.ayursutra.constant.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffInvitationResponse {

    private String id;

    private String invitationToken;

    private String email;

    private String fullName;

    private String phone;

    private Role role;

    private String clinicId;

    private String clinicName;

    private InvitationStatus status;

    private LocalDateTime expiresAt;

    private String invitationLink;

    private String invitedByEmail;

    private String registeredUserId;

    private LocalDateTime createdAt;

    private boolean expired;

}

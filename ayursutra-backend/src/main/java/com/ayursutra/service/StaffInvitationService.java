package com.ayursutra.service;

import com.ayursutra.constant.InvitationStatus;
import com.ayursutra.constant.Role;
import com.ayursutra.dto.request.CreateStaffInvitationRequest;
import com.ayursutra.dto.request.StaffRegistrationRequest;
import com.ayursutra.dto.response.StaffInvitationResponse;

import java.util.List;

public interface StaffInvitationService {

    StaffInvitationResponse createInvitation(CreateStaffInvitationRequest request, String adminEmail);

    List<StaffInvitationResponse> getAllInvitations(String clinicId, Role role, InvitationStatus status);

    StaffInvitationResponse getInvitationByToken(String token);

    StaffInvitationResponse resendInvitation(String invitationId, String adminEmail);

    StaffInvitationResponse revokeInvitation(String invitationId, String adminEmail);

    String registerStaff(StaffRegistrationRequest request);

}

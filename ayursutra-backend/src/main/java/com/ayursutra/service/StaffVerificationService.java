package com.ayursutra.service;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import com.ayursutra.dto.response.StaffVerificationApplicationResponse;

import java.util.List;

public interface StaffVerificationService {

    List<StaffVerificationApplicationResponse> getPendingApplications(String clinicId, Role role);

    List<StaffVerificationApplicationResponse> getAllApplications(String clinicId, Role role, VerificationStatus status);

    StaffVerificationApplicationResponse getApplicationDetails(String userId);

    StaffVerificationApplicationResponse approveApplication(String userId, String adminEmail);

    StaffVerificationApplicationResponse rejectApplication(String userId, String reason, String adminEmail);

    StaffVerificationApplicationResponse suspendStaff(String userId, String adminEmail);

}

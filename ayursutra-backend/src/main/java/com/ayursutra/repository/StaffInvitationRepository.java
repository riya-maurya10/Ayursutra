package com.ayursutra.repository;

import com.ayursutra.constant.InvitationStatus;
import com.ayursutra.constant.Role;
import com.ayursutra.entity.StaffInvitation;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface StaffInvitationRepository extends MongoRepository<StaffInvitation, String> {

    Optional<StaffInvitation> findByInvitationToken(String invitationToken);

    Optional<StaffInvitation> findByEmailAndStatus(String email, InvitationStatus status);

    List<StaffInvitation> findByClinicId(String clinicId);

    List<StaffInvitation> findByRole(Role role);

    List<StaffInvitation> findByClinicIdAndRole(String clinicId, Role role);

    List<StaffInvitation> findByClinicIdOrderByCreatedAtDesc(String clinicId);

}

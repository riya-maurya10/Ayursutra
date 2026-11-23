package com.ayursutra.repository;

import com.ayursutra.constant.Role;
import com.ayursutra.constant.VerificationStatus;
import com.ayursutra.entity.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByResetPasswordToken(String resetPasswordToken);

    boolean existsByEmail(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByVerificationStatus(VerificationStatus verificationStatus);

    List<User> findByClinicId(String clinicId);

    List<User> findByRole(Role role);

}
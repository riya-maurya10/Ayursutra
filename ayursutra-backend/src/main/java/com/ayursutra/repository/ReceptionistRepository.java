package com.ayursutra.repository;

import com.ayursutra.entity.Receptionist;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReceptionistRepository extends MongoRepository<Receptionist, String> {

    Optional<Receptionist> findByUserId(String userId);

    Optional<Receptionist> findByEmail(String email);

    List<Receptionist> findByClinicId(String clinicId);

    boolean existsByEmail(String email);

}

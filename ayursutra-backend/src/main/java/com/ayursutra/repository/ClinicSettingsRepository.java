package com.ayursutra.repository;

import com.ayursutra.entity.ClinicSettings;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ClinicSettingsRepository extends MongoRepository<ClinicSettings, String> {
    Optional<ClinicSettings> findByClinicId(String clinicId);
}

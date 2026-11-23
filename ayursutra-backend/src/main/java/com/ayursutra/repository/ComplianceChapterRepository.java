package com.ayursutra.repository;

import com.ayursutra.entity.ComplianceChapter;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ComplianceChapterRepository
        extends MongoRepository<ComplianceChapter, String> {

    List<ComplianceChapter> findByActiveTrueOrderByDisplayOrderAsc();

    Optional<ComplianceChapter> findByCode(String code);

    boolean existsByCode(String code);
}
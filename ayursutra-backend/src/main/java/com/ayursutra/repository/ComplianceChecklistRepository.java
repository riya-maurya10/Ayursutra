package com.ayursutra.repository;

import com.ayursutra.constant.ComplianceStatus;
import com.ayursutra.entity.ComplianceChecklistItem;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ComplianceChecklistRepository
        extends MongoRepository<ComplianceChecklistItem, String> {

    List<ComplianceChecklistItem>
    findByChapterCodeOrderByCreatedAtAsc(String chapterCode);

    long countByChapterCode(String chapterCode);

    long countByChapterCodeAndStatus(
            String chapterCode,
            ComplianceStatus status
    );
    boolean existsByObjectiveElementCode(String objectiveElementCode);
}
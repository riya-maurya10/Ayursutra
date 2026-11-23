package com.ayursutra.service.impl;

import com.ayursutra.constant.ComplianceStatus;
import com.ayursutra.dto.request.ComplianceUpdateRequest;
import com.ayursutra.dto.response.ComplianceChapterResponse;
import com.ayursutra.entity.ComplianceChapter;
import com.ayursutra.entity.ComplianceChecklistItem;
import com.ayursutra.repository.ComplianceChapterRepository;
import com.ayursutra.repository.ComplianceChecklistRepository;
import com.ayursutra.service.ComplianceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ComplianceServiceImpl
        implements ComplianceService {

    private final ComplianceChapterRepository
            chapterRepository;

    private final ComplianceChecklistRepository
            checklistRepository;


    @Override
    public List<ComplianceChapterResponse>
    getChapterSummary() {

        return chapterRepository
                .findByActiveTrueOrderByDisplayOrderAsc()
                .stream()
                .map(this::buildChapterSummary)
                .toList();
    }


    private ComplianceChapterResponse
    buildChapterSummary(
            ComplianceChapter chapter) {

        String code = chapter.getCode();

        long total =
                checklistRepository
                        .countByChapterCode(code);

        long compliant =
                checklistRepository
                        .countByChapterCodeAndStatus(
                                code,
                                ComplianceStatus.COMPLIANT
                        );

        long partial =
                checklistRepository
                        .countByChapterCodeAndStatus(
                                code,
                                ComplianceStatus.PARTIAL
                        );

        long notStarted =
                checklistRepository
                        .countByChapterCodeAndStatus(
                                code,
                                ComplianceStatus.NOT_STARTED
                        );

        long notApplicable =
                checklistRepository
                        .countByChapterCodeAndStatus(
                                code,
                                ComplianceStatus.NOT_APPLICABLE
                        );


        long applicableItems =
                total - notApplicable;


        double readiness = 0;


        if (applicableItems > 0) {

            double score =
                    compliant + (partial * 0.5);

            readiness =
                    (score / applicableItems) * 100;
        }


        return new ComplianceChapterResponse(

                chapter.getCode(),

                chapter.getName(),

                chapter.getDescription(),

                chapter.getDisplayOrder(),

                total,

                compliant,

                partial,

                notStarted,

                notApplicable,

                Math.round(
                        readiness * 100.0
                ) / 100.0
        );
    }


    @Override
    public List<ComplianceChecklistItem>
    getChecklist(String chapterCode) {

        chapterRepository
                .findByCode(chapterCode)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Compliance chapter not found"
                        )
                );

        return checklistRepository
                .findByChapterCodeOrderByCreatedAtAsc(
                        chapterCode
                );
    }


    @Override
    public ComplianceChecklistItem
    updateChecklistItem(
            String id,
            ComplianceUpdateRequest request) {

        ComplianceChecklistItem item =
                checklistRepository
                        .findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Compliance checklist item not found"
                                )
                        );


        item.setStatus(
                request.getStatus()
        );

        item.setNotes(
                request.getNotes()
        );

        item.setLastReviewedAt(
                LocalDateTime.now()
        );


        return checklistRepository.save(item);
    }


    @Override
    public double getOverallReadiness() {

        List<ComplianceChapterResponse>
                chapters =
                getChapterSummary();


        if (chapters.isEmpty()) {
            return 0;
        }


        return Math.round(
                chapters.stream()
                        .mapToDouble(
                                ComplianceChapterResponse
                                        ::getReadinessPercentage
                        )
                        .average()
                        .orElse(0)
                        * 100
        ) / 100.0;
    }
}
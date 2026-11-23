package com.ayursutra.config;

import com.ayursutra.constant.ComplianceLevel;
import com.ayursutra.constant.ComplianceStatus;
import com.ayursutra.entity.ComplianceChapter;
import com.ayursutra.entity.ComplianceChecklistItem;
import com.ayursutra.repository.ComplianceChapterRepository;
import com.ayursutra.repository.ComplianceChecklistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ComplianceDataInitializer implements CommandLineRunner {

    private final ComplianceChapterRepository chapterRepository;
    private final ComplianceChecklistRepository checklistRepository;

    @Override
    public void run(String... args) {

        seedChapters();

        /*
         * IMPORTANT:
         * AAC already has 19 objective elements in your database.
         * Therefore we DO NOT seed AAC again.
         *
         * The remaining chapters are registered here so the
         * Compliance module knows about the complete NABH structure.
         */
        seedStandards();
    }

    private void seedChapters() {

        if (chapterRepository.count() > 0) {
            return;
        }

        List<ComplianceChapter> chapters = List.of(

                new ComplianceChapter(
                        "AAC",
                        "Access, Assessment and Continuity of Care",
                        "Defines access, registration, assessment, referral, continuity and discharge processes.",
                        1,
                        true
                ),

                new ComplianceChapter(
                        "COP",
                        "Care of Patients",
                        "Ensures uniform, safe and consistent patient care and treatment.",
                        2,
                        true
                ),

                new ComplianceChapter(
                        "MOM",
                        "Management of Medication",
                        "Ensures safe and organized medication management.",
                        3,
                        true
                ),

                new ComplianceChapter(
                        "PRE",
                        "Patient Rights and Education",
                        "Ensures patient rights, information, consent, privacy and education.",
                        4,
                        true
                ),

                new ComplianceChapter(
                        "IPC",
                        "Infection Prevention and Control",
                        "Establishes systems for prevention and control of infections.",
                        5,
                        true
                ),

                new ComplianceChapter(
                        "PSQ",
                        "Patient Safety and Quality Improvement",
                        "Establishes patient safety and continuous quality improvement systems.",
                        6,
                        true
                ),

                new ComplianceChapter(
                        "ROM",
                        "Responsibilities of Management",
                        "Defines leadership, governance and management responsibilities.",
                        7,
                        true
                ),

                new ComplianceChapter(
                        "FMS",
                        "Facility Management and Safety",
                        "Ensures safe, functional and well-managed facilities.",
                        8,
                        true
                ),

                new ComplianceChapter(
                        "HRM",
                        "Human Resource Management",
                        "Ensures appropriate staffing, competency and development of personnel.",
                        9,
                        true
                ),

                new ComplianceChapter(
                        "IMS",
                        "Information Management System",
                        "Ensures secure, accurate and timely management of information.",
                        10,
                        true
                )
        );

        chapterRepository.saveAll(chapters);
    }

    private void seedStandards() {

        /*
         * We intentionally keep this method idempotent.
         *
         * Existing AAC objective elements remain untouched.
         * The objective-element records for the remaining chapters
         * should be populated from the verified NABH source dataset.
         */

        seedChapterStandards(
                "COP",
                List.of(
                        "COP.1",
                        "COP.2",
                        "COP.3",
                        "COP.4",
                        "COP.5",
                        "COP.6"
                )
        );

        seedChapterStandards(
                "MOM",
                List.of(
                        "MOM.1",
                        "MOM.2",
                        "MOM.3",
                        "MOM.4",
                        "MOM.5",
                        "MOM.6",
                        "MOM.7"
                )
        );

        seedChapterStandards(
                "PRE",
                List.of(
                        "PRE.1",
                        "PRE.2",
                        "PRE.3",
                        "PRE.4",
                        "PRE.5"
                )
        );

        seedChapterStandards(
                "IPC",
                List.of(
                        "IPC.1",
                        "IPC.2"
                )
        );

        seedChapterStandards(
                "PSQ",
                List.of(
                        "PSQ.1",
                        "PSQ.2"
                )
        );

        seedChapterStandards(
                "ROM",
                List.of(
                        "ROM.1",
                        "ROM.2",
                        "ROM.3",
                        "ROM.4"
                )
        );

        seedChapterStandards(
                "FMS",
                List.of(
                        "FMS.1",
                        "FMS.2",
                        "FMS.3"
                )
        );

        seedChapterStandards(
                "HRM",
                List.of(
                        "HRM.1",
                        "HRM.2",
                        "HRM.3"
                )
        );

        seedChapterStandards(
                "IMS",
                List.of(
                        "IMS.1",
                        "IMS.2"
                )
        );
    }

    private void seedChapterStandards(
            String chapterCode,
            List<String> standardCodes
    ) {

        /*
         * Standards are currently represented by their codes.
         *
         * Do not create fake objective elements here.
         * The actual objective-element wording and level must come
         * from the official NABH document.
         */
        for (String standardCode : standardCodes) {

            String markerCode = standardCode + ".STANDARD";

            boolean alreadyExists =
                    checklistRepository
                            .findByChapterCodeOrderByCreatedAtAsc(chapterCode)
                            .stream()
                            .anyMatch(item ->
                                    markerCode.equals(
                                            item.getObjectiveElementCode()
                                    )
                            );

            if (alreadyExists) {
                continue;
            }

            ComplianceChecklistItem item =
                    new ComplianceChecklistItem();

            item.setChapterCode(chapterCode);
            item.setStandardCode(standardCode);
            item.setObjectiveElementCode(markerCode);

            item.setTitle(
                    "NABH standard " + standardCode
            );

            item.setDescription(
                    "Standard reference for " + standardCode +
                            ". Objective elements will be maintained " +
                            "against the official NABH ATWC standard."
            );

            item.setLevel(ComplianceLevel.COMMITMENT);
            item.setStatus(ComplianceStatus.NOT_STARTED);
            item.setOwnerRole("ADMIN");

            checklistRepository.save(item);
        }
    }
}
package com.ayursutra.service.impl;

import com.ayursutra.dto.request.DoshaAssessmentRequest;
import com.ayursutra.dto.response.DoshaAssessmentResponse;
import com.ayursutra.entity.Patient;
import com.ayursutra.repository.PatientRepository;
import com.ayursutra.security.UserPrincipal;
import com.ayursutra.service.DoshaAssessmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DoshaAssessmentServiceImpl implements DoshaAssessmentService {

    private final PatientRepository patientRepository;

    @Override
    public DoshaAssessmentResponse assessDosha(DoshaAssessmentRequest request) {
        Map<String, String> answers = request.getAnswers();

        int vataCount = 0;
        int pittaCount = 0;
        int kaphaCount = 0;

        if (answers != null && !answers.isEmpty()) {
            for (String val : answers.values()) {
                if (val == null) continue;
                String normalized = val.trim().toUpperCase();
                if (normalized.contains("VATA")) {
                    vataCount++;
                } else if (normalized.contains("PITTA")) {
                    pittaCount++;
                } else if (normalized.contains("KAPHA")) {
                    kaphaCount++;
                }
            }
        }

        int total = vataCount + pittaCount + kaphaCount;
        if (total == 0) {
            total = 3;
            vataCount = 1;
            pittaCount = 1;
            kaphaCount = 1;
        }

        int vataPct = Math.round(((float) vataCount / total) * 100);
        int pittaPct = Math.round(((float) pittaCount / total) * 100);
        int kaphaPct = 100 - (vataPct + pittaPct);
        if (kaphaPct < 0) {
            kaphaPct = 0;
        }

        String primaryDosha = "Vata";
        String secondaryDosha = "Pitta";

        if (vataPct >= pittaPct && vataPct >= kaphaPct) {
            primaryDosha = "Vata";
            secondaryDosha = pittaPct >= kaphaPct ? "Pitta" : "Kapha";
        } else if (pittaPct >= vataPct && pittaPct >= kaphaPct) {
            primaryDosha = "Pitta";
            secondaryDosha = vataPct >= kaphaPct ? "Vata" : "Kapha";
        } else {
            primaryDosha = "Kapha";
            secondaryDosha = pittaPct >= vataPct ? "Pitta" : "Vata";
        }

        String combinedDosha = primaryDosha + "-" + secondaryDosha;

        String characteristics;
        List<String> therapies = new ArrayList<>();
        List<String> diets = new ArrayList<>();
        List<String> lifestyles = new ArrayList<>();

        if ("Vata".equalsIgnoreCase(primaryDosha)) {
            characteristics = "Creative, energetic, adaptable, with dry skin tendency, variable appetite, and susceptibility to restlessness or joint tension.";
            therapies.addAll(List.of("Abhyanga with Warm Sesame/Mahanarayana Oil", "Shirodhara for Nervous Calming", "Kati Basti for Spine & Joint Support", "Snigdha Swedana"));
            diets.addAll(List.of("Warm, freshly cooked unctuous meals", "Naturally sweet, sour, and grounding foods", "Spices like ginger, cinnamon, cumin, and hing", "Avoid raw, dry, cold salads and carbonated drinks"));
            lifestyles.addAll(List.of("Consistent sleep schedule before 10 PM", "Daily self-abhyanga with warm oil", "Gentle grounding Hatha Yoga & Nadi Shodhana Pranayama", "Warm herbal foot bath before bed"));
        } else if ("Pitta".equalsIgnoreCase(primaryDosha)) {
            characteristics = "Sharp intellect, ambitious, strong metabolic fire (Agni), warm body temperature, with a tendency toward acidity, inflammation, and heat sensitivity.";
            therapies.addAll(List.of("Takradhara (Cooling Buttermilk stream)", "Sheetali Swedana", "Virechana (Therapeutic Purgation)", "Netra Tarpana with medicated ghee"));
            diets.addAll(List.of("Cooling foods with sweet, bitter, and astringent tastes", "Cow's Ghee, coconut water, fresh sweet fruits like melons & pomegranates", "Mild digestive herbs like fennel, coriander, cardamom", "Avoid spicy chilies, fried oily dishes, garlic, and vinegar"));
            lifestyles.addAll(List.of("Avoid intense sun exposure during peak noon hours", "Sheetali & Sheetkari cooling breathing techniques", "Evening walks in nature or near serene water bodies", "Listening to relaxing ambient flute and water sounds"));
        } else {
            characteristics = "Calm, affectionate, loyal, strong physical endurance, with a tendency toward slow metabolism, heaviness, congestion, and water retention.";
            therapies.addAll(List.of("Udwarthanam (Herbal dry powder scrub)", "Bashpa Sweda (Herbal Steam bath)", "Nasya with Anu Taila", "Vamana Therapy for deep Kapha detox"));
            diets.addAll(List.of("Light, warm, dry foods with pungent, bitter, and astringent tastes", "Raw honey with warm water and fresh ginger", "Barley, quinoa, mung dal, and steamed greens", "Avoid cold dairy, heavy sweets, ice cream, and excess wheat"));
            lifestyles.addAll(List.of("Wake up early before sunrise (around 6 AM)", "Vigorous aerobic exercise or Surya Namaskar", "Dry body brushing (Garshana) before morning shower", "Avoid sleeping during daytime"));
        }

        final String finalPrimary = primaryDosha;
        final String finalSecondary = secondaryDosha;
        final String finalCombined = combinedDosha;
        final int finalVata = vataPct;
        final int finalPitta = pittaPct;
        final int finalKapha = kaphaPct;

        // Link with patient if available
        String patientId = request.getPatientId();
        if (patientId == null || patientId.isBlank()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof UserPrincipal principal) {
                patientRepository.findByUserId(principal.getUser().getId()).ifPresent(p -> {
                    p.setPrimaryDosha(finalCombined);
                    p.setVataPercentage(finalVata);
                    p.setPittaPercentage(finalPitta);
                    p.setKaphaPercentage(finalKapha);
                    p.setPrakritiNotes("Primary: " + finalPrimary + ", Secondary: " + finalSecondary);
                    patientRepository.save(p);
                });
            }
        } else {
            patientRepository.findById(patientId).ifPresent(p -> {
                p.setPrimaryDosha(finalCombined);
                p.setVataPercentage(finalVata);
                p.setPittaPercentage(finalPitta);
                p.setKaphaPercentage(finalKapha);
                p.setPrakritiNotes("Primary: " + finalPrimary + ", Secondary: " + finalSecondary);
                patientRepository.save(p);
            });
        }

        return DoshaAssessmentResponse.builder()
                .primaryDosha(primaryDosha)
                .secondaryDosha(secondaryDosha)
                .vataPercentage(vataPct)
                .pittaPercentage(pittaPct)
                .kaphaPercentage(kaphaPct)
                .characteristics(characteristics)
                .recommendedTherapies(therapies)
                .dietaryGuidelines(diets)
                .lifestyleRecommendations(lifestyles)
                .build();
    }
}

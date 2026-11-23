import { useState } from "react";
import { Sparkles, CheckCircle2, ChevronRight, RotateCcw, X, ShieldAlert, Heart, Flame, Wind, Droplets } from "lucide-react";
import apiClient from "../../services/api/client";

interface DoshaQuestion {
  id: string;
  category: string;
  question: string;
  options: {
    dosha: "VATA" | "PITTA" | "KAPHA";
    label: string;
    sublabel: string;
  }[];
}

const QUESTIONS: DoshaQuestion[] = [
  {
    id: "body_frame",
    category: "Physical Constitution",
    question: "How would you describe your natural body frame and weight?",
    options: [
      { dosha: "VATA", label: "Slender & Light", sublabel: "Thin bone structure, prominent joints, difficult to gain weight" },
      { dosha: "PITTA", label: "Medium & Athletic", sublabel: "Moderate frame, well-proportioned, easy to maintain muscle" },
      { dosha: "KAPHA", label: "Broad & Sturdy", sublabel: "Solid bone structure, heavy-set, gains weight quickly and loses slowly" },
    ],
  },
  {
    id: "skin",
    category: "Skin & Complexion",
    question: "What is your typical skin texture and sensitivity?",
    options: [
      { dosha: "VATA", label: "Dry & Thin", sublabel: "Cool to touch, prone to roughness, cracks, or dryness in winter" },
      { dosha: "PITTA", label: "Warm & Sensitive", sublabel: "Fair or reddish, prone to flushing, acne, moles, or sunburns" },
      { dosha: "KAPHA", label: "Thick & Moist", sublabel: "Soft, smooth, well-hydrated, cool, and occasionally oily" },
    ],
  },
  {
    id: "digestion",
    category: "Agni (Digestive Fire)",
    question: "How is your appetite and digestion usually?",
    options: [
      { dosha: "VATA", label: "Irregular & Variable", sublabel: "Appetite fluctuates, prone to gas, bloating, or constipation" },
      { dosha: "PITTA", label: "Strong & Sharp", sublabel: "Intense hunger, gets 'hangry' if meals are missed, prone to acidity" },
      { dosha: "KAPHA", label: "Slow & Steady", sublabel: "Can skip meals easily without discomfort, digestion feels heavy or slow" },
    ],
  },
  {
    id: "sleep",
    category: "Sleep Quality",
    question: "How do you typically sleep at night?",
    options: [
      { dosha: "VATA", label: "Light & Interrupted", sublabel: "Less than 6-7 hours, easily awakened by noise, active dreams" },
      { dosha: "PITTA", label: "Moderate & Focused", sublabel: "6-7 hours of sound sleep, wake up alert, vivid or colorful dreams" },
      { dosha: "KAPHA", label: "Deep & Heavy", sublabel: "8+ hours, heavy sleeper, difficult to awaken early in the morning" },
    ],
  },
  {
    id: "weather",
    category: "Thermal Preference",
    question: "Which weather or climate bothers you the most?",
    options: [
      { dosha: "VATA", label: "Cold & Windy", sublabel: "Craves sunlight, warmth, hot baths, and covered layers" },
      { dosha: "PITTA", label: "Hot & Sunny", sublabel: "Craves air conditioning, cold water, shade, and dislikes humidity" },
      { dosha: "KAPHA", label: "Damp & Foggy", sublabel: "Craves dry, warm, breezy conditions and dislikes wet, stagnant cold" },
    ],
  },
  {
    id: "temperament",
    category: "Mind & Stress Response",
    question: "Under stress or deadlines, what is your emotional reaction?",
    options: [
      { dosha: "VATA", label: "Anxiety & Restlessness", sublabel: "Mind races with worry, indecision, overthinking, or fear" },
      { dosha: "PITTA", label: "Frustration & Irritability", sublabel: "Sharp temper, perfectionism, impatience, or critical judgment" },
      { dosha: "KAPHA", label: "Withdrawal & Stubbornness", sublabel: "Avoids conflict, procrastinates, becomes sluggish or sentimental" },
    ],
  },
  {
    id: "speech",
    category: "Communication Style",
    question: "How would friends describe your speech style?",
    options: [
      { dosha: "VATA", label: "Fast & Spontaneous", sublabel: "Talkative, expressive, leaps rapidly from topic to topic" },
      { dosha: "PITTA", label: "Clear & Direct", sublabel: "Articulate, persuasive, commanding, gets straight to the point" },
      { dosha: "KAPHA", label: "Calm & Gentle", sublabel: "Slow, resonant voice, good listener, speaks only when necessary" },
    ],
  },
];

interface DoshaResult {
  primaryDosha: string;
  secondaryDosha: string;
  vataPercentage: number;
  pittaPercentage: number;
  kaphaPercentage: number;
  characteristics: string;
  recommendedTherapies: string[];
  dietaryGuidelines: string[];
  lifestyleRecommendations: string[];
}

interface DoshaAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId?: string;
  onAssessmentCompleted?: (result: DoshaResult) => void;
}

export default function DoshaAssessmentModal({
  isOpen,
  onClose,
  patientId,
  onAssessmentCompleted,
}: DoshaAssessmentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DoshaResult | null>(null);

  if (!isOpen) return null;

  const currentQ = QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / QUESTIONS.length) * 100);

  const handleSelectOption = (dosha: string) => {
    const updated = { ...answers, [currentQ.id]: dosha };
    setAnswers(updated);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitQuiz(updated);
    }
  };

  const submitQuiz = async (submissionAnswers: Record<string, string>) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/dosha-assessment/calculate", {
        patientId: patientId || undefined,
        answers: submissionAnswers,
      });

      const data = res.data?.data as DoshaResult;
      setResult(data);
      if (onAssessmentCompleted) {
        onAssessmentCompleted(data);
      }
    } catch (err) {
      console.error("Failed to calculate dosha assessment", err);
    } finally {
      setLoading(false);
    }
  };

  const restartQuiz = () => {
    setAnswers({});
    setCurrentStep(0);
    setResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl border border-[#D5DDD2] bg-white p-6 md:p-8 shadow-2xl transition-all my-8 max-h-[90vh] overflow-y-auto">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F6F2] text-[#556353] hover:bg-[#E2E8DE] transition-colors"
        >
          <X size={18} />
        </button>

        {!result ? (
          <div>
            {/* QUIZ HEADER */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAF1E7] text-[#356B4B]">
                <Sparkles size={24} />
              </div>
              <div>
                <span className="text-xs font-semibold tracking-wider uppercase text-[#71834F]">
                  Panchakarma Diagnostics
                </span>
                <h2 className="text-xl md:text-2xl font-bold text-[#173D2D]">
                  Prakriti & Dosha Assessment
                </h2>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="mb-6">
              <div className="flex justify-between text-xs font-medium text-[#7A8A78] mb-1.5">
                <span>
                  Question {currentStep + 1} of {QUESTIONS.length}
                </span>
                <span>{progressPercent}% Completed</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#EAEFE8]">
                <div
                  className="h-full bg-gradient-to-r from-[#71834F] to-[#2E5B3D] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* QUESTION CARD */}
            <div className="rounded-2xl border border-[#E3EAE0] bg-[#FAFBF9] p-5 mb-5">
              <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-[#EAF1E7] text-[#356B4B] mb-2">
                {currentQ.category}
              </span>
              <h3 className="text-lg font-semibold text-[#173D2D] leading-snug">
                {currentQ.question}
              </h3>
            </div>

            {/* OPTIONS */}
            <div className="space-y-3">
              {currentQ.options.map((opt) => {
                const isSelected = answers[currentQ.id] === opt.dosha;
                return (
                  <button
                    key={opt.dosha}
                    onClick={() => handleSelectOption(opt.dosha)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                      isSelected
                        ? "border-[#356B4B] bg-[#F1F7EE] shadow-sm ring-1 ring-[#356B4B]"
                        : "border-[#E1E7DF] bg-white hover:border-[#356B4B]/50 hover:bg-[#F9FAF8]"
                    }`}
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#EAF1E7] text-[#356B4B]">
                      {opt.dosha === "VATA" && <Wind size={16} />}
                      {opt.dosha === "PITTA" && <Flame size={16} />}
                      {opt.dosha === "KAPHA" && <Droplets size={16} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-[#173D2D]">
                          {opt.label}
                        </span>
                        <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#EAF1E7] text-[#356B4B]">
                          {opt.dosha}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6F7D6D] leading-relaxed">
                        {opt.sublabel}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* BACK & NAVIGATION */}
            <div className="mt-6 flex justify-between items-center pt-2">
              <button
                type="button"
                disabled={currentStep === 0}
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="text-xs font-semibold text-[#667765] hover:text-[#173D2D] disabled:opacity-30 disabled:pointer-events-none"
              >
                ← Previous Question
              </button>
              {loading && (
                <span className="text-xs font-medium text-[#356B4B] animate-pulse">
                  Analyzing Ayurvedic constitution...
                </span>
              )}
            </div>
          </div>
        ) : (
          /* RESULT VIEW */
          <div className="space-y-6">
            <div className="text-center pb-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF1E7] text-[#356B4B] text-xs font-semibold mb-2">
                <CheckCircle2 size={14} /> Analysis Complete
              </div>
              <h2 className="text-2xl font-bold text-[#173D2D]">
                Your Ayurvedic Prakriti: {result.primaryDosha}-{result.secondaryDosha}
              </h2>
              <p className="text-xs text-[#7A8A78] max-w-md mx-auto mt-1">
                Dominant Dosha: <span className="font-semibold text-[#173D2D]">{result.primaryDosha}</span> with secondary influence of <span className="font-semibold text-[#173D2D]">{result.secondaryDosha}</span>.
              </p>
            </div>

            {/* DOSHA BREAKDOWN METERS */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[#D5E3F0] bg-[#F4F8FC] p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-[#2B527A] mb-1">
                  <Wind size={14} /> Vata
                </div>
                <div className="text-2xl font-bold text-[#1E3B59]">{result.vataPercentage}%</div>
                <div className="h-1.5 w-full bg-[#D7E4F2] rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-[#3B72A4] rounded-full" style={{ width: `${result.vataPercentage}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#FAD7D2] bg-[#FDF3F1] p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-[#963F32] mb-1">
                  <Flame size={14} /> Pitta
                </div>
                <div className="text-2xl font-bold text-[#7A2A20]">{result.pittaPercentage}%</div>
                <div className="h-1.5 w-full bg-[#F5CDC7] rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-[#C24B3B] rounded-full" style={{ width: `${result.pittaPercentage}%` }} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#D7EAD7] bg-[#F2F8F2] p-3 text-center">
                <div className="flex items-center justify-center gap-1 text-xs font-semibold text-[#2E6B32] mb-1">
                  <Droplets size={14} /> Kapha
                </div>
                <div className="text-2xl font-bold text-[#1E4D21]">{result.kaphaPercentage}%</div>
                <div className="h-1.5 w-full bg-[#CCE2CC] rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-[#3C8C41] rounded-full" style={{ width: `${result.kaphaPercentage}%` }} />
                </div>
              </div>
            </div>

            {/* CHARACTERISTICS */}
            <div className="rounded-2xl border border-[#E3EAE0] bg-[#FAFBF9] p-4 text-xs text-[#4F5E4E] leading-relaxed">
              <span className="font-semibold text-[#173D2D] block mb-1">Prakriti Characteristics:</span>
              {result.characteristics}
            </div>

            {/* RECOMMENDATIONS ACCORDION / TABS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="rounded-2xl border border-[#E5E9E2] bg-white p-3.5 shadow-sm">
                <h4 className="font-semibold text-[#173D2D] mb-2 flex items-center gap-1.5 text-xs">
                  <Sparkles size={14} className="text-[#356B4B]" /> Recommended Panchakarma
                </h4>
                <ul className="space-y-1.5 text-[#5F6E5E]">
                  {result.recommendedTherapies.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#356B4B] font-bold">•</span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#E5E9E2] bg-white p-3.5 shadow-sm">
                <h4 className="font-semibold text-[#173D2D] mb-2 flex items-center gap-1.5 text-xs">
                  <Heart size={14} className="text-[#A25E34]" /> Dietary (Pathya)
                </h4>
                <ul className="space-y-1.5 text-[#5F6E5E]">
                  {result.dietaryGuidelines.map((d, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#A25E34] font-bold">•</span>
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-[#E5E9E2] bg-white p-3.5 shadow-sm">
                <h4 className="font-semibold text-[#173D2D] mb-2 flex items-center gap-1.5 text-xs">
                  <ShieldAlert size={14} className="text-[#326284]" /> Daily Dinacharya
                </h4>
                <ul className="space-y-1.5 text-[#5F6E5E]">
                  {result.lifestyleRecommendations.map((l, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#326284] font-bold">•</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={restartQuiz}
                className="flex items-center justify-center gap-1.5 w-1/3 rounded-xl border border-[#D5DDD2] bg-[#F7F9F6] px-3 py-2.5 text-xs font-semibold text-[#546252] hover:bg-[#EAEFE8] transition"
              >
                <RotateCcw size={14} /> Retake Quiz
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 w-2/3 rounded-xl bg-[#173D2D] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#24533F] transition"
              >
                Done / Save to Profile <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

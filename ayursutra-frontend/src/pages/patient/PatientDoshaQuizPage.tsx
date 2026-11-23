
import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Activity,
  Heart,
  ShieldCheck,
} from "lucide-react";

import DoshaAssessmentModal from "../../components/dosha/DoshaAssessmentModal";

export default function PatientDoshaQuizPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [completedResult, setCompletedResult] = useState<any>(null);

  return (
    <div className="min-h-full bg-[#F6F8F5]">
      <main className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto w-full">

        {/* PAGE HEADING */}
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#173D2D]">
            Prakriti & Dosha Constitution
          </h1>
          <p className="mt-1 text-sm text-[#6F7D6D]">
            Discover your Ayurvedic constitution and understand your wellness needs.
          </p>
        </div>

        {/* HERO BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#173D2D] to-[#2D5A42] p-8 md:p-10 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl">

            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
              <Sparkles size={14} className="text-[#C5E8CF]" />
              Ancient Ayurvedic Diagnostic
            </span>

            <h2 className="mt-3 text-2xl md:text-4xl font-extrabold tracking-tight leading-tight">
              Discover Your Unique Ayurvedic Dosha & Prakriti
            </h2>

            <p className="mt-3 text-xs md:text-sm text-[#D7E8DC] leading-relaxed">
              In classical Ayurveda, your Prakriti is your inherent biological
              fingerprint. Knowing your balance of Vata (Wind), Pitta (Fire),
              and Kapha (Earth & Water) unlocks tailored diet, sleep routines,
              and Panchakarma therapies designed specifically for your constitution.
            </p>

            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#173D2D] shadow-lg hover:bg-[#F2F6F0] transition hover:scale-105 active:scale-95"
            >
              {completedResult
                ? "Retake Assessment"
                : "Start 2-Minute Diagnostic Quiz"}

              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* THREE DOSHAS EXPLANATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          {/* VATA */}
          <div className="rounded-3xl border border-[#D5E3F0] bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0F5FA] text-[#2C5985] mb-4">
              <Activity size={22} />
            </div>

            <h3 className="text-base font-bold text-[#173D2D]">
              Vata Dosha (Air & Ether)
            </h3>

            <p className="mt-2 text-xs text-[#6F7D6D] leading-relaxed">
              Governs all movement, respiration, nerve impulses, and circulation.
              Balanced Vata brings vitality and creativity; aggravated Vata
              causes dry skin, anxiety, and joint stiffness.
            </p>

            <span className="inline-block mt-3 text-[11px] font-semibold text-[#2C5985]">
              Therapies: Shirodhara, Warm Abhyanga
            </span>
          </div>

          {/* PITTA */}
          <div className="rounded-3xl border border-[#FAD7D2] bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FDF3F1] text-[#A63C2E] mb-4">
              <Heart size={22} />
            </div>

            <h3 className="text-base font-bold text-[#173D2D]">
              Pitta Dosha (Fire & Water)
            </h3>

            <p className="mt-2 text-xs text-[#6F7D6D] leading-relaxed">
              Governs digestion, metabolism, body warmth, and intelligence.
              Balanced Pitta brings courage and sharp focus; excess Pitta
              causes inflammation, acidity, and heat intolerance.
            </p>

            <span className="inline-block mt-3 text-[11px] font-semibold text-[#A63C2E]">
              Therapies: Takradhara, Sheetali Swedana
            </span>
          </div>

          {/* KAPHA */}
          <div className="rounded-3xl border border-[#D7EAD7] bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F2F8F2] text-[#2E6B32] mb-4">
              <ShieldCheck size={22} />
            </div>

            <h3 className="text-base font-bold text-[#173D2D]">
              Kapha Dosha (Water & Earth)
            </h3>

            <p className="mt-2 text-xs text-[#6F7D6D] leading-relaxed">
              Governs physical structure, immunity, lubrication, and emotional
              calmness. Balanced Kapha brings endurance and peace; excess Kapha
              causes heaviness, lethargy, and fluid retention.
            </p>

            <span className="inline-block mt-3 text-[11px] font-semibold text-[#2E6B32]">
              Therapies: Udwarthanam, Herbal Steam
            </span>
          </div>

        </div>
      </main>

      {/* QUIZ MODAL */}
      <DoshaAssessmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAssessmentCompleted={(res) => setCompletedResult(res)}
      />
    </div>
  );
}

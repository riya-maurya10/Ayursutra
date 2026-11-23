import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Layers,
  Info,
  Check,
  Plus,
  Trash2,
  Activity,
  Compass,
  CheckCircle2,
  X,
  Send,
} from "lucide-react";
import {
  ANATOMICAL_REGIONS,
  MARMA_POINTS,
  REGION_THERAPY_MAPPING,
  type BodyAnatomicalRegion,
} from "../../data/anatomyAndMarmaData";
import { getAllTherapies, type Therapy } from "../../services/therapy/therapyService";

export interface PrescribedTherapyItem {
  id: string;
  name: string;
  durationMinutes: number;
  sourceRegionOrMarma: string;
}

export interface BodyMapSelectorProps {
  initialSelectedRegions?: string[];
  initialSelectedMarmas?: string[];
  onSelectRegion?: (region: BodyAnatomicalRegion) => void;
  onAddTherapyToPlan?: (therapyName: string) => void;
  onConfirmSelection?: (data: {
    selectedRegions: string[];
    selectedMarmas: string[];
    confirmedTherapies: PrescribedTherapyItem[];
  }) => void;
  compact?: boolean;
}

export default function BodyMapSelector({
  initialSelectedRegions = [],
  initialSelectedMarmas = [],
  onSelectRegion,
  onAddTherapyToPlan,
  onConfirmSelection,
  compact: _compact = false,
}: BodyMapSelectorProps) {
  // Mode: ANATOMY (Regions) vs MARMA (Marma points)
  const [selectorMode, setSelectorMode] = useState<"ANATOMY" | "MARMA">("ANATOMY");
  const [view, setView] = useState<"FRONT" | "BACK">("FRONT");

  // Selections
  const [selectedRegionIds, setSelectedRegionIds] = useState<string[]>(
    initialSelectedRegions.length > 0 ? initialSelectedRegions : ["lower_back"]
  );
  const [selectedMarmaIds, setSelectedMarmaIds] = useState<string[]>(
    initialSelectedMarmas.length > 0 ? initialSelectedMarmas : []
  );

  // Active highlighted item for detailed preview panel
  const [activeRegionId, setActiveRegionId] = useState<string>(
    initialSelectedRegions[0] || "lower_back"
  );
  const [activeMarmaId, setActiveMarmaId] = useState<string | null>(
    initialSelectedMarmas[0] || null
  );

  // Hover state for tooltip
  const [hoveredItem, setHoveredItem] = useState<{
    type: "REGION" | "MARMA";
    name: string;
    sanskrit: string;
    x: number;
    y: number;
  } | null>(null);

  // Master Therapies
  const [masterTherapies, setMasterTherapies] = useState<Therapy[]>([]);
  const [customTherapyName, setCustomTherapyName] = useState("");
  const [customTherapyDuration, setCustomTherapyDuration] = useState<number>(45);

  // Confirmed therapies cart / list
  const [confirmedTherapies, setConfirmedTherapies] = useState<PrescribedTherapyItem[]>([]);
  const [confirmationNotice, setConfirmationNotice] = useState<string>("");

  useEffect(() => {
    const fetchMasterTherapies = async () => {
      try {
        const list = await getAllTherapies();
        setMasterTherapies(list.filter((t) => t.active));
      } catch (err) {
        console.warn("Could not load master therapies list for mapping:", err);
      }
    };
    fetchMasterTherapies();
  }, []);

  // Update if initial props change
  useEffect(() => {
    if (initialSelectedRegions.length > 0) {
      setSelectedRegionIds(initialSelectedRegions);
      setActiveRegionId(initialSelectedRegions[0]);
    }
  }, [initialSelectedRegions]);

  useEffect(() => {
    if (initialSelectedMarmas.length > 0) {
      setSelectedMarmaIds(initialSelectedMarmas);
      setActiveMarmaId(initialSelectedMarmas[0]);
    }
  }, [initialSelectedMarmas]);

  // Active Region & Marma Objects
  const activeRegion = useMemo(() => {
    return (
      ANATOMICAL_REGIONS.find((r) => r.id === activeRegionId) ||
      ANATOMICAL_REGIONS[0]
    );
  }, [activeRegionId]);

  const activeMarma = useMemo(() => {
    if (!activeMarmaId) return null;
    return MARMA_POINTS.find((m) => m.id === activeMarmaId) || null;
  }, [activeMarmaId]);

  // Filtered marmas based on active view (FRONT / BACK)
  const visibleMarmas = useMemo(() => {
    return MARMA_POINTS.filter((m) => m.view === "BOTH" || m.view === view);
  }, [view]);

  // Handle region toggle
  const handleToggleRegion = (regionId: string) => {
    const reg = ANATOMICAL_REGIONS.find((r) => r.id === regionId);
    if (!reg) return;

    setActiveRegionId(regionId);
    setActiveMarmaId(null);
    if (onSelectRegion) onSelectRegion(reg);

    setSelectedRegionIds((prev) => {
      if (prev.includes(regionId)) {
        // Keep at least one or toggle
        return prev.filter((id) => id !== regionId);
      } else {
        return [...prev, regionId];
      }
    });
  };

  // Handle marma toggle
  const handleToggleMarma = (marmaId: string) => {
    const marma = MARMA_POINTS.find((m) => m.id === marmaId);
    if (!marma) return;

    setActiveMarmaId(marmaId);
    // Also select its parent anatomical region for therapy context
    if (marma.bodyRegionId && !selectedRegionIds.includes(marma.bodyRegionId)) {
      setSelectedRegionIds((prev) => [...prev, marma.bodyRegionId]);
      setActiveRegionId(marma.bodyRegionId);
    }

    setSelectedMarmaIds((prev) => {
      if (prev.includes(marmaId)) {
        return prev.filter((id) => id !== marmaId);
      } else {
        return [...prev, marmaId];
      }
    });
  };

  // Therapy recommendations combining active region & marma
  const therapySuggestions = useMemo(() => {
    const set = new Set<string>();

    if (selectorMode === "MARMA" && activeMarma) {
      activeMarma.recommendedTherapies.forEach((t) => set.add(t));
    }

    if (activeRegion) {
      activeRegion.recommendedTherapies.forEach((t) => set.add(t));
      const mapped = REGION_THERAPY_MAPPING[activeRegion.id] || [];
      mapped.forEach((t) => set.add(t));
    }

    return Array.from(set);
  }, [selectorMode, activeMarma, activeRegion]);

  // Add therapy to confirmed cart
  const handleAddTherapy = (therapyName: string) => {
    const matchedMaster = masterTherapies.find(
      (m) => m.name.toLowerCase() === therapyName.toLowerCase()
    );

    const sourceLabel =
      selectorMode === "MARMA" && activeMarma
        ? `${activeMarma.name} (${activeRegion.name})`
        : activeRegion.name;

    const newItem: PrescribedTherapyItem = {
      id: `${therapyName}-${Date.now()}`,
      name: matchedMaster ? matchedMaster.name : therapyName,
      durationMinutes: matchedMaster ? matchedMaster.durationMinutes : 45,
      sourceRegionOrMarma: sourceLabel,
    };

    setConfirmedTherapies((prev) => {
      if (prev.some((item) => item.name.toLowerCase() === newItem.name.toLowerCase())) {
        return prev;
      }
      return [...prev, newItem];
    });

    if (onAddTherapyToPlan) {
      onAddTherapyToPlan(newItem.name);
    }

    setConfirmationNotice(`"${newItem.name}" added to plan selections.`);
    setTimeout(() => setConfirmationNotice(""), 3500);
  };

  // Add custom therapy
  const handleAddCustomTherapy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTherapyName.trim()) return;

    const sourceLabel =
      selectorMode === "MARMA" && activeMarma
        ? activeMarma.name
        : activeRegion.name;

    const newItem: PrescribedTherapyItem = {
      id: `custom-${Date.now()}`,
      name: customTherapyName.trim(),
      durationMinutes: Number(customTherapyDuration) || 45,
      sourceRegionOrMarma: sourceLabel,
    };

    setConfirmedTherapies((prev) => [...prev, newItem]);
    if (onAddTherapyToPlan) {
      onAddTherapyToPlan(newItem.name);
    }
    setCustomTherapyName("");
    setConfirmationNotice(`Custom therapy "${newItem.name}" added.`);
    setTimeout(() => setConfirmationNotice(""), 3500);
  };

  // Remove confirmed therapy
  const handleRemoveConfirmedTherapy = (id: string) => {
    setConfirmedTherapies((prev) => prev.filter((item) => item.id !== id));
  };

  // Final confirmation to emit to parent
  const handleEmitConfirmation = () => {
    if (onConfirmSelection) {
      onConfirmSelection({
        selectedRegions: selectedRegionIds,
        selectedMarmas: selectedMarmaIds,
        confirmedTherapies,
      });
    }
  };

  return (
    <div className="rounded-3xl border border-[#D5DDD2] bg-white p-6 shadow-sm">
      {/* ====================================================
          HEADER: Title, Mode Toggle & View (Front/Back) Toggle
          ==================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EAEFE8]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#356B4B] flex items-center gap-1.5">
            <Compass size={14} className="text-[#356B4B]" />
            Ayurvedic Body & Marma Point Selector
          </span>
          <h3 className="text-xl font-bold text-[#173D2D] mt-0.5">
            {selectorMode === "ANATOMY"
              ? "Human Anatomy & Therapy Mapping"
              : "Marma Point Localization & Prescription"}
          </h3>
          <p className="text-xs text-[#6F7D6D] mt-0.5">
            Select affected anatomical regions or traditional vital Marma points to generate precision Panchakarma prescriptions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Selector */}
          <div className="flex rounded-xl bg-[#F0F4EE] p-1 text-xs font-semibold text-[#5B6B58]">
            <button
              type="button"
              onClick={() => {
                setSelectorMode("ANATOMY");
                setActiveMarmaId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectorMode === "ANATOMY"
                  ? "bg-white text-[#173D2D] shadow-sm font-bold"
                  : "hover:text-[#173D2D]"
              }`}
            >
              <Layers size={13} /> Body Regions ({selectedRegionIds.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectorMode("MARMA")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                selectorMode === "MARMA"
                  ? "bg-white text-[#173D2D] shadow-sm font-bold"
                  : "hover:text-[#173D2D]"
              }`}
            >
              <Activity size={13} /> Marma Points ({selectedMarmaIds.length})
            </button>
          </div>

          {/* Front / Back View Toggle */}
          <div className="flex rounded-xl bg-[#F0F4EE] p-1 text-xs font-semibold text-[#5B6B58]">
            <button
              type="button"
              onClick={() => setView("FRONT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                view === "FRONT"
                  ? "bg-[#173D2D] text-white shadow-sm font-bold"
                  : "hover:text-[#173D2D]"
              }`}
            >
              Anterior (Front)
            </button>
            <button
              type="button"
              onClick={() => setView("BACK")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                view === "BACK"
                  ? "bg-[#173D2D] text-white shadow-sm font-bold"
                  : "hover:text-[#173D2D]"
              }`}
            >
              Posterior (Back)
            </button>
          </div>
        </div>
      </div>

      {/* ====================================================
          ACTIVE SELECTIONS CHIPS BAR
          ==================================================== */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-[#F7F9F5] p-3 border border-[#E3ECE0]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#356B4B] mr-1">
          Active Selection:
        </span>

        {selectedRegionIds.length === 0 && selectedMarmaIds.length === 0 && (
          <span className="text-xs text-[#828F80] italic">
            No regions or marma points currently selected. Click on the body map below to begin.
          </span>
        )}

        {/* Selected Regions Chips */}
        {selectedRegionIds.map((id) => {
          const reg = ANATOMICAL_REGIONS.find((r) => r.id === id);
          if (!reg) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-[#E5ECE2] px-3 py-1 text-xs font-semibold text-[#173D2D] border border-[#CCD8C8]"
            >
              <Layers size={11} className="text-[#356B4B]" />
              {reg.name}
              <button
                type="button"
                onClick={() => handleToggleRegion(id)}
                className="ml-1 rounded-full p-0.5 hover:bg-[#CFDEC9] text-[#4F634E]"
                title="Remove region"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}

        {/* Selected Marma Chips */}
        {selectedMarmaIds.map((id) => {
          const marma = MARMA_POINTS.find((m) => m.id === id);
          if (!marma) return null;
          return (
            <span
              key={id}
              className="inline-flex items-center gap-1 rounded-full bg-[#E6F0FA] px-3 py-1 text-xs font-semibold text-[#1E4B75] border border-[#C5DCF2]"
            >
              <Activity size={11} className="text-[#2B6CB0]" />
              {marma.name}
              <button
                type="button"
                onClick={() => handleToggleMarma(id)}
                className="ml-1 rounded-full p-0.5 hover:bg-[#D0E4F7] text-[#1E4B75]"
                title="Remove marma"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
      </div>

      {/* Confirmation notification banner */}
      {confirmationNotice && (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 border border-emerald-200 animate-fadeIn">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={15} className="text-emerald-600" />
            {confirmationNotice}
          </span>
          <button
            type="button"
            onClick={() => setConfirmationNotice("")}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ====================================================
          MAIN GRID: SVG Body Map (Left) + Details & Therapies (Right)
          ==================================================== */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Interactive SVG Human Body Map */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-[#F8FAF7] to-[#ECF2EA] border border-[#DCE6DA] relative shadow-inner">
          <div className="w-full flex items-center justify-between mb-3 text-[11px] font-semibold text-[#5B6B58] uppercase tracking-wider">
            <span>{view} Body View</span>
            <span className="text-[#356B4B]">
              Mode: {selectorMode === "ANATOMY" ? "Anatomical Regions" : "Marma Points"}
            </span>
          </div>

          <div className="relative w-64 h-[470px] select-none">
            <svg
              viewBox="0 0 240 470"
              className="w-full h-full drop-shadow-md select-none"
            >
              <defs>
                <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#DFE7DC" />
                  <stop offset="100%" stopColor="#CCD7C8" />
                </linearGradient>
                <linearGradient id="selectedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2F6B46" />
                  <stop offset="100%" stopColor="#173D2D" />
                </linearGradient>
                <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* ==============================================
                  BASE ANATOMICAL SILHOUETTES
                  ============================================== */}
              {/* Background silhouette structure */}
              <g className="transition-all duration-300">
                {/* Arms */}
                <path
                  d="M 68 88 L 44 145 L 36 215 Q 32 225 42 225 Q 50 220 54 206 L 68 145 L 80 94 Z"
                  fill="#CCD7C8"
                  opacity="0.85"
                />
                <path
                  d="M 172 88 L 196 145 L 204 215 Q 208 225 198 225 Q 190 220 186 206 L 172 145 L 160 94 Z"
                  fill="#CCD7C8"
                  opacity="0.85"
                />
                {/* Thighs */}
                <path
                  d="M 100 236 L 86 310 L 106 310 L 115 238 Z"
                  fill="#CCD7C8"
                  opacity="0.85"
                />
                <path
                  d="M 140 236 L 154 310 L 134 310 L 125 238 Z"
                  fill="#CCD7C8"
                  opacity="0.85"
                />
              </g>

              {/* ==============================================
                  CLICKABLE ANATOMICAL REGIONS
                  ============================================== */}
              {/* 1. Head (Crown/Vault) */}
              <g
                onClick={() => handleToggleRegion("head")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Head (Shira)",
                    sanskrit: "Shiro Desha",
                    x: 120,
                    y: 20,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <circle
                  cx="120"
                  cy="40"
                  r="23"
                  fill={
                    selectedRegionIds.includes("head")
                      ? "url(#selectedGrad)"
                      : "#D3DDCF"
                  }
                  stroke={
                    selectedRegionIds.includes("head")
                      ? "#356B4B"
                      : "#AEBFAB"
                  }
                  strokeWidth={selectedRegionIds.includes("head") ? "2.5" : "1.5"}
                  className="hover:opacity-90"
                />
              </g>

              {/* 2. Forehead (Front View only) */}
              {view === "FRONT" && (
                <g
                  onClick={() => handleToggleRegion("forehead")}
                  onMouseEnter={() =>
                    setHoveredItem({
                      type: "REGION",
                      name: "Forehead (Lalata)",
                      sanskrit: "Lalata Marma Region",
                      x: 120,
                      y: 34,
                    })
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                  className="cursor-pointer transition-all duration-200"
                >
                  <path
                    d="M 105 28 Q 120 22 135 28 L 134 42 Q 120 45 106 42 Z"
                    fill={
                      selectedRegionIds.includes("forehead")
                        ? "#1F4E34"
                        : "#C2D2BD"
                    }
                    stroke={
                      selectedRegionIds.includes("forehead")
                        ? "#FFFFFF"
                        : "#9EB499"
                    }
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* 3. Neck & Cervical Spine */}
              <g
                onClick={() => handleToggleRegion("neck")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Neck (Greeva)",
                    sanskrit: "Cervical & Manya",
                    x: 120,
                    y: 72,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <rect
                  x="110"
                  y="63"
                  width="20"
                  height="19"
                  rx="4"
                  fill={
                    selectedRegionIds.includes("neck")
                      ? "url(#selectedGrad)"
                      : "#C8D6C4"
                  }
                  stroke={
                    selectedRegionIds.includes("neck")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* 4. Left Shoulder */}
              <g
                onClick={() => handleToggleRegion("left_shoulder")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Left Shoulder (Amsa)",
                    sanskrit: "Vama Amsa",
                    x: 68,
                    y: 92,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <path
                  d="M 60 88 C 60 76, 90 76, 95 86 C 88 100, 68 104, 60 88 Z"
                  fill={
                    selectedRegionIds.includes("left_shoulder")
                      ? "url(#selectedGrad)"
                      : "#D1DED0"
                  }
                  stroke={
                    selectedRegionIds.includes("left_shoulder")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* 5. Right Shoulder */}
              <g
                onClick={() => handleToggleRegion("right_shoulder")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Right Shoulder (Amsa)",
                    sanskrit: "Dakshina Amsa",
                    x: 172,
                    y: 92,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <path
                  d="M 180 88 C 180 76, 150 76, 145 86 C 152 100, 172 104, 180 88 Z"
                  fill={
                    selectedRegionIds.includes("right_shoulder")
                      ? "url(#selectedGrad)"
                      : "#D1DED0"
                  }
                  stroke={
                    selectedRegionIds.includes("right_shoulder")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* FRONT VIEW: Chest & Abdomen */}
              {view === "FRONT" && (
                <>
                  {/* 6. Chest */}
                  <g
                    onClick={() => handleToggleRegion("chest")}
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: "REGION",
                        name: "Chest & Cardiac (Uras)",
                        sanskrit: "Hridaya Desha",
                        x: 120,
                        y: 110,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 94 82 Q 120 80 146 82 L 144 136 Q 120 140 96 136 Z"
                      fill={
                        selectedRegionIds.includes("chest")
                          ? "url(#selectedGrad)"
                          : "#CFDDD0"
                      }
                      stroke={
                        selectedRegionIds.includes("chest")
                          ? "#356B4B"
                          : "#A6B8A2"
                      }
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* 7. Abdomen */}
                  <g
                    onClick={() => handleToggleRegion("abdomen")}
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: "REGION",
                        name: "Abdomen (Udara)",
                        sanskrit: "Nabhi Desha / Agni",
                        x: 120,
                        y: 165,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 96 138 Q 120 142 144 138 L 140 196 Q 120 200 100 196 Z"
                      fill={
                        selectedRegionIds.includes("abdomen")
                          ? "url(#selectedGrad)"
                          : "#C8D8C9"
                      }
                      stroke={
                        selectedRegionIds.includes("abdomen")
                          ? "#356B4B"
                          : "#A6B8A2"
                      }
                      strokeWidth="1.5"
                    />
                  </g>
                </>
              )}

              {/* BACK VIEW: Upper Back & Lower Back */}
              {view === "BACK" && (
                <>
                  {/* 8. Upper Back */}
                  <g
                    onClick={() => handleToggleRegion("upper_back")}
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: "REGION",
                        name: "Upper Back (Prishta)",
                        sanskrit: "Urdhva Prishta",
                        x: 120,
                        y: 115,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 94 82 Q 120 80 146 82 L 144 145 Q 120 148 96 145 Z"
                      fill={
                        selectedRegionIds.includes("upper_back")
                          ? "url(#selectedGrad)"
                          : "#CFDDD0"
                      }
                      stroke={
                        selectedRegionIds.includes("upper_back")
                          ? "#356B4B"
                          : "#A6B8A2"
                      }
                      strokeWidth="1.5"
                    />
                  </g>

                  {/* 9. Lower Back */}
                  <g
                    onClick={() => handleToggleRegion("lower_back")}
                    onMouseEnter={() =>
                      setHoveredItem({
                        type: "REGION",
                        name: "Lower Back (Kati)",
                        sanskrit: "Lumbo-Sacral Spine",
                        x: 120,
                        y: 175,
                      })
                    }
                    onMouseLeave={() => setHoveredItem(null)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    <path
                      d="M 96 147 Q 120 150 144 147 L 140 202 Q 120 206 100 202 Z"
                      fill={
                        selectedRegionIds.includes("lower_back")
                          ? "url(#selectedGrad)"
                          : "#C5D6C7"
                      }
                      stroke={
                        selectedRegionIds.includes("lower_back")
                          ? "#356B4B"
                          : "#A6B8A2"
                      }
                      strokeWidth="1.5"
                    />
                  </g>
                </>
              )}

              {/* 10. Pelvic Region */}
              <g
                onClick={() => handleToggleRegion("pelvic")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Pelvic Region (Vasti)",
                    sanskrit: "Shroni & Bladder Meridian",
                    x: 120,
                    y: 215,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <path
                  d="M 98 198 Q 120 202 142 198 L 136 236 Q 120 242 104 236 Z"
                  fill={
                    selectedRegionIds.includes("pelvic")
                      ? "url(#selectedGrad)"
                      : "#C0D2C3"
                  }
                  stroke={
                    selectedRegionIds.includes("pelvic")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* 11. Left Knee */}
              <g
                onClick={() => handleToggleRegion("left_knee")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Left Knee (Janu)",
                    sanskrit: "Vama Janu Sandhi",
                    x: 95,
                    y: 320,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <rect
                  x="83"
                  y="310"
                  width="24"
                  height="22"
                  rx="7"
                  fill={
                    selectedRegionIds.includes("left_knee")
                      ? "url(#selectedGrad)"
                      : "#C9D8C8"
                  }
                  stroke={
                    selectedRegionIds.includes("left_knee")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* 12. Right Knee */}
              <g
                onClick={() => handleToggleRegion("right_knee")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Right Knee (Janu)",
                    sanskrit: "Dakshina Janu Sandhi",
                    x: 145,
                    y: 320,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <rect
                  x="133"
                  y="310"
                  width="24"
                  height="22"
                  rx="7"
                  fill={
                    selectedRegionIds.includes("right_knee")
                      ? "url(#selectedGrad)"
                      : "#C9D8C8"
                  }
                  stroke={
                    selectedRegionIds.includes("right_knee")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* 13. Left Leg / Calf */}
              <g
                onClick={() => handleToggleRegion("left_leg")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Left Leg (Jangha)",
                    sanskrit: "Vama Jangha",
                    x: 92,
                    y: 375,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <path
                  d="M 85 334 L 81 406 L 102 406 L 105 334 Z"
                  fill={
                    selectedRegionIds.includes("left_leg")
                      ? "url(#selectedGrad)"
                      : "#CCD8CC"
                  }
                  stroke={
                    selectedRegionIds.includes("left_leg")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* 14. Right Leg / Calf */}
              <g
                onClick={() => handleToggleRegion("right_leg")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Right Leg (Jangha)",
                    sanskrit: "Dakshina Jangha",
                    x: 148,
                    y: 375,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <path
                  d="M 155 334 L 159 406 L 138 406 L 135 334 Z"
                  fill={
                    selectedRegionIds.includes("right_leg")
                      ? "url(#selectedGrad)"
                      : "#CCD8CC"
                  }
                  stroke={
                    selectedRegionIds.includes("right_leg")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* 15. Left Foot */}
              <g
                onClick={() => handleToggleRegion("left_foot")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Left Foot (Pada)",
                    sanskrit: "Vama Pada / Sole",
                    x: 86,
                    y: 430,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <path
                  d="M 78 408 L 70 440 Q 90 446 103 440 L 100 408 Z"
                  fill={
                    selectedRegionIds.includes("left_foot")
                      ? "url(#selectedGrad)"
                      : "#D1DED0"
                  }
                  stroke={
                    selectedRegionIds.includes("left_foot")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* 16. Right Foot */}
              <g
                onClick={() => handleToggleRegion("right_foot")}
                onMouseEnter={() =>
                  setHoveredItem({
                    type: "REGION",
                    name: "Right Foot (Pada)",
                    sanskrit: "Dakshina Pada / Sole",
                    x: 154,
                    y: 430,
                  })
                }
                onMouseLeave={() => setHoveredItem(null)}
                className="cursor-pointer transition-all duration-200"
              >
                <path
                  d="M 140 408 L 137 440 Q 150 446 170 440 L 162 408 Z"
                  fill={
                    selectedRegionIds.includes("right_foot")
                      ? "url(#selectedGrad)"
                      : "#D1DED0"
                  }
                  stroke={
                    selectedRegionIds.includes("right_foot")
                      ? "#356B4B"
                      : "#A6B8A2"
                  }
                  strokeWidth="1.5"
                />
              </g>

              {/* ==============================================
                  MARMA POINTS OVERLAY (In MARMA Mode)
                  ============================================== */}
              {selectorMode === "MARMA" &&
                visibleMarmas.map((marma) => {
                  const isSelected = selectedMarmaIds.includes(marma.id);
                  const isActive = activeMarmaId === marma.id;

                  return (
                    <g
                      key={marma.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleMarma(marma.id);
                      }}
                      onMouseEnter={() =>
                        setHoveredItem({
                          type: "MARMA",
                          name: marma.name,
                          sanskrit: marma.sanskritName,
                          x: marma.coords.cx,
                          y: marma.coords.cy,
                        })
                      }
                      onMouseLeave={() => setHoveredItem(null)}
                      className="cursor-pointer"
                    >
                      {/* Pulse ring when selected */}
                      {(isSelected || isActive) && (
                        <circle
                          cx={marma.coords.cx}
                          cy={marma.coords.cy}
                          r={marma.coords.r + 5}
                          fill="none"
                          stroke="#2B6CB0"
                          strokeWidth="2"
                          opacity="0.6"
                          className="animate-ping origin-center"
                        />
                      )}

                      {/* Main Marma Dot */}
                      <circle
                        cx={marma.coords.cx}
                        cy={marma.coords.cy}
                        r={marma.coords.r}
                        fill={
                          isSelected
                            ? "#1A365D"
                            : isActive
                            ? "#2B6CB0"
                            : "#3182CE"
                        }
                        stroke="#FFFFFF"
                        strokeWidth="1.8"
                        className="hover:scale-125 transition-transform duration-150 origin-center"
                      />

                      {/* Small Center Pin */}
                      <circle
                        cx={marma.coords.cx}
                        cy={marma.coords.cy}
                        r="2"
                        fill="#FFFFFF"
                      />
                    </g>
                  );
                })}
            </svg>

            {/* Floating Tooltip */}
            {hoveredItem && (
              <div
                className="absolute pointer-events-none rounded-lg bg-[#173D2D] text-white px-2.5 py-1 text-[11px] font-medium shadow-lg z-20 whitespace-nowrap transform -translate-x-1/2 -translate-y-full mb-2"
                style={{
                  left: `${(hoveredItem.x / 240) * 100}%`,
                  top: `${(hoveredItem.y / 470) * 100}%`,
                }}
              >
                <div className="font-bold flex items-center gap-1">
                  {hoveredItem.type === "MARMA" ? (
                    <Activity size={10} className="text-sky-300" />
                  ) : (
                    <Layers size={10} className="text-emerald-300" />
                  )}
                  {hoveredItem.name}
                </div>
                <div className="text-[10px] text-gray-300">{hoveredItem.sanskrit}</div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 text-[11px] text-[#6F7D6D]">
            <Info size={13} className="text-[#356B4B]" />
            <span>Click any body region or marma point to inspect details and therapies.</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Region/Marma Details & Classical Therapy Recommendations */}
        <div className="lg:col-span-7 space-y-5">
          {/* Active Card: Detailed Information */}
          <div className="rounded-2xl border border-[#D7E2D5] bg-[#F7FAF6] p-5 shadow-xs">
            {selectorMode === "MARMA" && activeMarma ? (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#2B6CB0] flex items-center gap-1">
                      <Activity size={12} /> {activeMarma.sanskritName}
                    </span>
                    <h4 className="text-xl font-bold text-[#173D2D] mt-0.5">
                      {activeMarma.name}
                    </h4>
                    <p className="text-xs text-[#526451] font-medium mt-0.5">
                      Location: {activeMarma.anatomicalLocation}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="rounded-full bg-[#EBF3FB] px-3 py-1 text-[11px] font-bold text-[#2B6CB0] border border-[#CDE1F5]">
                      {activeMarma.classification}
                    </span>
                    <span className="text-[10px] text-[#657A64] font-medium">
                      Dosha Affinity: {activeMarma.doshaAffinity}
                    </span>
                  </div>
                </div>

                <p className="mt-3 text-xs text-[#4F604E] leading-relaxed border-t border-[#E5EFE2] pt-2.5">
                  <strong>Clinical Reference:</strong> {activeMarma.clinicalNote}
                </p>
                <p className="mt-1 text-[11px] text-[#788876] italic">
                  Classical Source: {activeMarma.classicalReference}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#356B4B] flex items-center gap-1">
                      <Layers size={12} /> {activeRegion.sanskritName}
                    </span>
                    <h4 className="text-xl font-bold text-[#173D2D] mt-0.5">
                      {activeRegion.name}
                    </h4>
                    <p className="text-xs text-[#526451] font-medium mt-0.5">
                      Anatomy: {activeRegion.anatomicalLocation}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#EAF1E7] px-3 py-1 text-xs font-bold text-[#356B4B] border border-[#CCE0C8]">
                    Dosha: {activeRegion.doshaAffinity}
                  </span>
                </div>

                <p className="mt-3 text-xs text-[#4F604E] leading-relaxed border-t border-[#E5EFE2] pt-2.5">
                  {activeRegion.description}
                </p>
              </div>
            )}
          </div>

          {/* Targeted Therapy Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h5 className="text-xs font-bold uppercase tracking-wider text-[#356B4B] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#356B4B]" />
                Targeted Classical Therapies for Selected Focus
              </h5>
              <span className="text-[11px] text-[#71826F]">
                Click <Plus size={11} className="inline" /> to add to plan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {therapySuggestions.map((therapyName) => {
                const isAlreadyConfirmed = confirmedTherapies.some(
                  (c) => c.name.toLowerCase() === therapyName.toLowerCase()
                );
                const matchedMaster = masterTherapies.find(
                  (m) => m.name.toLowerCase() === therapyName.toLowerCase()
                );

                return (
                  <div
                    key={therapyName}
                    className={`rounded-xl border p-3.5 transition-all flex items-center justify-between ${
                      isAlreadyConfirmed
                        ? "border-[#2F6B46] bg-[#F1F7F0] shadow-xs"
                        : "border-[#E1ECE0] bg-white hover:border-[#356B4B] shadow-xs"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-[#173D2D] truncate">
                          {therapyName}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#6F7F6E]">
                        {matchedMaster
                          ? `${matchedMaster.durationMinutes} mins • Master master data`
                          : "Classical Panchakarma"}
                      </p>
                    </div>

                    {isAlreadyConfirmed ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800">
                        <Check size={12} /> Added
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAddTherapy(therapyName)}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#173D2D] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#2A523D] transition shadow-xs"
                      >
                        <Plus size={12} /> Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Therapy Addition */}
          <form
            onSubmit={handleAddCustomTherapy}
            className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl bg-[#FAFBF9] p-3 border border-[#E3ECE0]"
          >
            <input
              type="text"
              value={customTherapyName}
              onChange={(e) => setCustomTherapyName(e.target.value)}
              placeholder="Add custom or specialized therapy..."
              className="flex-1 rounded-lg border border-[#D5DDD2] bg-white px-3 py-1.5 text-xs text-[#173D2D] placeholder-[#9AA898] outline-none focus:border-[#356B4B]"
            />
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="15"
                max="180"
                step="5"
                value={customTherapyDuration}
                onChange={(e) => setCustomTherapyDuration(Number(e.target.value))}
                className="w-16 rounded-lg border border-[#D5DDD2] bg-white px-2 py-1.5 text-xs text-center text-[#173D2D] outline-none focus:border-[#356B4B]"
                title="Duration in minutes"
              />
              <span className="text-[11px] text-[#71826F]">min</span>
            </div>
            <button
              type="submit"
              disabled={!customTherapyName.trim()}
              className="rounded-lg bg-[#356B4B] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#285339] disabled:opacity-50 transition"
            >
              + Add
            </button>
          </form>

          {/* Confirmed Prescriptions List */}
          <div className="rounded-2xl border border-[#D8E3D6] bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-[#EAF0E8] pb-2.5">
              <h5 className="text-xs font-bold text-[#173D2D] flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-[#356B4B]" />
                Selected Therapies To Include In Treatment Plan ({confirmedTherapies.length})
              </h5>
              {confirmedTherapies.length > 0 && (
                <button
                  type="button"
                  onClick={() => setConfirmedTherapies([])}
                  className="text-[11px] text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {confirmedTherapies.length > 0 ? (
              <div className="space-y-2">
                {confirmedTherapies.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#F8FAF7] px-3.5 py-2 border border-[#E4ECE1]"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#173D2D]">
                        {item.name}
                      </span>
                      <p className="text-[10px] text-[#7A8A78]">
                        Suggested via: <strong>{item.sourceRegionOrMarma}</strong> • {item.durationMinutes} mins
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveConfirmedTherapy(item.id)}
                      className="rounded p-1 text-gray-400 hover:text-red-600 transition"
                      title="Remove therapy"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}

                {onConfirmSelection && (
                  <button
                    type="button"
                    onClick={handleEmitConfirmation}
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#173D2D] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#25523D] transition"
                  >
                    <Send size={13} /> Confirm & Apply {confirmedTherapies.length} Therapies To Plan
                  </button>
                )}
              </div>
            ) : (
              <p className="text-center py-4 text-xs text-[#8A9A88] italic">
                No therapies confirmed yet. Select recommended therapies above to prepare your prescription.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

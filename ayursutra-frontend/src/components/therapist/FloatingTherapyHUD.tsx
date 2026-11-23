import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  Activity,
  Droplet
} from "lucide-react";
import apiClient from "../../services/api/client";

interface ActiveSessionProps {
  sessionId: string;
  therapyName: string;
  patientName: string;
  roomName?: string;
  plannedMinutes?: number;
  onClose: () => void;
  onSessionCompleted?: () => void;
}

type Phase = "PREP" | "MAIN" | "REST";

export default function FloatingTherapyHUD({
  sessionId,
  therapyName,
  patientName,
  roomName = "Panchakarma Suite 1",
  plannedMinutes = 45,
  onClose,
  onSessionCompleted,
}: ActiveSessionProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [phase, setPhase] = useState<Phase>("MAIN");
  const [secondsRemaining, setSecondsRemaining] = useState(plannedMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [oilWarm, setOilWarm] = useState(true);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0) {
      setIsRunning(false);
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsRemaining]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handlePhaseChange = (newPhase: Phase) => {
    setPhase(newPhase);
    if (newPhase === "PREP") setSecondsRemaining(10 * 60);
    if (newPhase === "MAIN") setSecondsRemaining(plannedMinutes * 60);
    if (newPhase === "REST") setSecondsRemaining(15 * 60);
    setIsRunning(true);
  };

  const addPresetNote = (preset: string) => {
    setNotes((prev) => (prev ? `${prev}, ${preset}` : preset));
  };

  const handleCompleteSession = async () => {
    setSaving(true);
    try {
      await apiClient.patch(`/therapy-sessions/${sessionId}/status`, {
        status: "COMPLETED",
        notes: notes || "Session completed smoothly via Active Therapy HUD.",
      });
      setCompleted(true);
      setTimeout(() => {
        if (onSessionCompleted) onSessionCompleted();
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Failed to complete session", err);
    } finally {
      setSaving(false);
    }
  };

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full border border-[#C8D6C4] bg-white/95 px-5 py-3 shadow-2xl backdrop-blur-md transition-all hover:scale-105">
        <div className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#356B4B] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#356B4B]"></span>
        </div>
        <div>
          <p className="text-xs font-bold text-[#173D2D]">{therapyName}</p>
          <p className="text-[10px] text-[#6E7B6C]">{formatTime(secondsRemaining)} remaining</p>
        </div>
        <button
          onClick={() => setIsMinimized(false)}
          className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#EAF1E7] text-[#356B4B] hover:bg-[#D5E4D1]"
        >
          <ChevronUp size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-3xl border border-[#D5DDD2] bg-white/98 shadow-2xl backdrop-blur-lg transition-all animate-fade-in overflow-hidden">
      {/* HEADER */}
      <div className="bg-[#173D2D] px-5 py-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-[#A7D1B5]">
            <Activity size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-tight">{therapyName}</h3>
            <p className="text-[11px] text-[#C5D9CB]">{patientName} • {roomName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsMinimized(true)}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
          >
            <ChevronDown size={16} />
          </button>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* PHASE SELECTOR */}
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F0F4EE] p-1 text-[11px] font-semibold text-[#5B6B58]">
          <button
            onClick={() => handlePhaseChange("PREP")}
            className={`py-1.5 rounded-lg transition-all ${
              phase === "PREP" ? "bg-white text-[#173D2D] shadow-sm" : "hover:text-[#173D2D]"
            }`}
          >
            1. Prep (10m)
          </button>
          <button
            onClick={() => handlePhaseChange("MAIN")}
            className={`py-1.5 rounded-lg transition-all ${
              phase === "MAIN" ? "bg-white text-[#173D2D] shadow-sm" : "hover:text-[#173D2D]"
            }`}
          >
            2. Main Flow
          </button>
          <button
            onClick={() => handlePhaseChange("REST")}
            className={`py-1.5 rounded-lg transition-all ${
              phase === "REST" ? "bg-white text-[#173D2D] shadow-sm" : "hover:text-[#173D2D]"
            }`}
          >
            3. Rest (15m)
          </button>
        </div>

        {/* TIMER DISPLAY */}
        <div className="rounded-2xl border border-[#E3EAE0] bg-[#FAFBF9] p-4 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-[#7A8A78] mb-1">
            <Clock size={14} className="text-[#356B4B]" />
            {phase === "PREP" && "Patient & Oil Preparation"}
            {phase === "MAIN" && "Active Classical Therapy"}
            {phase === "REST" && "Post-Treatment Sweating / Rest"}
          </div>
          <div className="text-4xl font-mono font-bold tracking-tight text-[#173D2D]">
            {formatTime(secondsRemaining)}
          </div>

          {/* TIMER CONTROLS */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-sm transition-all ${
                isRunning ? "bg-[#B44C3D] hover:bg-[#973E31]" : "bg-[#356B4B] hover:bg-[#28553B]"
              }`}
            >
              {isRunning ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Start</>}
            </button>
            <button
              onClick={() => setSecondsRemaining(plannedMinutes * 60)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D5DDD2] bg-white text-xs font-semibold text-[#5B6B58] hover:bg-[#F3F6F1]"
            >
              <RotateCcw size={13} /> Reset
            </button>
          </div>
        </div>

        {/* QUICK STATUS TOGGLES */}
        <div className="flex items-center justify-between text-xs px-1">
          <button
            onClick={() => setOilWarm(!oilWarm)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
              oilWarm
                ? "border-[#FAD7D2] bg-[#FDF3F1] text-[#963F32]"
                : "border-[#D7E2D5] bg-[#F4F6F3] text-[#718070]"
            }`}
          >
            <Flame size={13} />
            Oil Warmth: {oilWarm ? "Optimal (Warm)" : "Needs Heating"}
          </button>
          <span className="text-[11px] text-[#7A8A78] flex items-center gap-1">
            <Droplet size={13} className="text-[#356B4B]" />
            Continuous Stream
          </span>
        </div>

        {/* OBSERVATION NOTES & PRESETS */}
        <div>
          <label className="block text-[11px] font-semibold text-[#5B6B58] mb-1 flex items-center gap-1">
            <FileText size={12} /> Clinical Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Patient relaxed deeply, mild sweat observed"
            className="w-full text-xs rounded-xl border border-[#D5DDD2] bg-white px-3 py-2 text-[#173D2D] outline-none focus:border-[#356B4B]"
          />
          <div className="flex flex-wrap gap-1 mt-1.5">
            {["Relaxed deeply", "Good sweat", "Oil temp steady", "Pulse normal"].map((preset) => (
              <button
                key={preset}
                onClick={() => addPresetNote(preset)}
                className="text-[10px] rounded-md bg-[#F2F6F0] px-2 py-0.5 text-[#4E624B] hover:bg-[#E1EADF]"
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {/* COMPLETE BUTTON */}
        <button
          onClick={handleCompleteSession}
          disabled={saving || completed}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#173D2D] py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#23533E] transition disabled:opacity-60"
        >
          {completed ? (
            <><CheckCircle2 size={15} /> Session Marked Completed!</>
          ) : saving ? (
            "Updating Session..."
          ) : (
            <><CheckCircle2 size={15} /> Finish & Mark Completed</>
          )}
        </button>
      </div>
    </div>
  );
}

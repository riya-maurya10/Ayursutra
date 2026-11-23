import { useEffect, useState } from "react";
import {
  Bell,
  Clock,
  Globe,
  Loader2,
  Moon,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Video,
} from "lucide-react";
import { getUserSettings, updateUserSettings } from "../../services/settings/settingsService";
import type { UserSettings, UpdateUserSettingsPayload } from "../../types/settings";

interface UserSettingsFormProps {
  role?: string;
}

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function UserSettingsForm({ role }: UserSettingsFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState<UserSettings>({
    userId: "",
    theme: "light",
    language: "en",
    dateFormat: "DD/MM/YYYY",
    timeZone: "Asia/Kolkata",
    emailNotifications: true,
    appointmentAlerts: true,
    therapyReminders: true,
    billingAlerts: true,
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    teleconsultationEnabled: true,
    profileVisibility: "CLINIC_WIDE",
  });

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserSettings();
        if (data) {
          setSettings(data);
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Could not load your preferences. Using defaults.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const handleDayToggle = (day: string) => {
    const current = settings.workingDays || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day];
    setSettings({ ...settings, workingDays: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: UpdateUserSettingsPayload = {
        theme: settings.theme,
        language: settings.language,
        dateFormat: settings.dateFormat,
        timeZone: settings.timeZone,
        emailNotifications: settings.emailNotifications,
        appointmentAlerts: settings.appointmentAlerts,
        therapyReminders: settings.therapyReminders,
        billingAlerts: settings.billingAlerts,
        workingHoursStart: settings.workingHoursStart,
        workingHoursEnd: settings.workingHoursEnd,
        workingDays: settings.workingDays,
        teleconsultationEnabled: settings.teleconsultationEnabled,
        profileVisibility: settings.profileVisibility,
      };

      const updated = await updateUserSettings(payload);
      setSettings(updated);
      setSuccess("Your preferences have been saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save preferences. Please try again.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 flex flex-col items-center justify-center text-center">
        <Loader2 size={32} className="animate-spin text-[#1F3D2E] mb-3" />
        <p className="text-sm font-medium text-[#4D5C4B]">Loading your preferences...</p>
      </div>
    );
  }

  const isStaffRole = ["ADMIN", "DOCTOR", "THERAPIST", "RECEPTIONIST"].includes(
    role?.toUpperCase() || ""
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 1. Regional & Display Preferences */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
          <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
            <Globe size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1F3D2E]">Regional & Display Settings</h3>
            <p className="text-xs text-[#7A806F]">Customize language, date formats and time zones</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Theme */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-2">
              Interface Theme
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSettings({ ...settings, theme: "light" })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                  settings.theme === "light"
                    ? "border-[#1F3D2E] bg-[#1F3D2E]/10 text-[#1F3D2E] ring-1 ring-[#1F3D2E]"
                    : "border-[#D9DDCE] text-[#7A806F] hover:bg-[#F8F6F0]"
                }`}
              >
                <span>Light (Warm Cream)</span>
              </button>
              <button
                type="button"
                onClick={() => setSettings({ ...settings, theme: "dark" })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition ${
                  settings.theme === "dark"
                    ? "border-[#1F3D2E] bg-[#1F3D2E]/10 text-[#1F3D2E] ring-1 ring-[#1F3D2E]"
                    : "border-[#D9DDCE] text-[#7A806F] hover:bg-[#F8F6F0]"
                }`}
              >
                <Moon size={14} />
                <span>Dark Mode</span>
              </button>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-2">
              Language
            </label>
            <select
              value={settings.language || "en"}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            >
              <option value="en">English (India)</option>
              <option value="hi">Hindi (हिन्दी)</option>
            </select>
          </div>

          {/* Date Format */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-2">
              Date Format
            </label>
            <select
              value={settings.dateFormat || "DD/MM/YYYY"}
              onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 15/11/2026)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-11-15)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 11/15/2026)</option>
            </select>
          </div>

          {/* Time Zone */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-2">
              Time Zone
            </label>
            <select
              value={settings.timeZone || "Asia/Kolkata"}
              onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (+0:00)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Notification Preferences */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
          <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
            <Bell size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1F3D2E]">Notification Preferences</h3>
            <p className="text-xs text-[#7A806F]">Control how and when you receive automated updates</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#F0F2EB] hover:bg-[#F8F6F0]/60 transition cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-[#1F3D2E]">Email Notifications</p>
              <p className="text-xs text-[#7A806F]">Receive important clinic announcements and summary emails</p>
            </div>
            <input
              type="checkbox"
              checked={settings.emailNotifications ?? true}
              onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
              className="w-4 h-4 text-[#1F3D2E] rounded border-[#D9DDCE] focus:ring-[#1F3D2E]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#F0F2EB] hover:bg-[#F8F6F0]/60 transition cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-[#1F3D2E]">Appointment Alerts</p>
              <p className="text-xs text-[#7A806F]">Get notified about upcoming consultations and schedule bookings</p>
            </div>
            <input
              type="checkbox"
              checked={settings.appointmentAlerts ?? true}
              onChange={(e) => setSettings({ ...settings, appointmentAlerts: e.target.checked })}
              className="w-4 h-4 text-[#1F3D2E] rounded border-[#D9DDCE] focus:ring-[#1F3D2E]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#F0F2EB] hover:bg-[#F8F6F0]/60 transition cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-[#1F3D2E]">Therapy Session Reminders</p>
              <p className="text-xs text-[#7A806F]">Daily reminders for scheduled Panchakarma therapy treatments</p>
            </div>
            <input
              type="checkbox"
              checked={settings.therapyReminders ?? true}
              onChange={(e) => setSettings({ ...settings, therapyReminders: e.target.checked })}
              className="w-4 h-4 text-[#1F3D2E] rounded border-[#D9DDCE] focus:ring-[#1F3D2E]"
            />
          </label>

          <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#F0F2EB] hover:bg-[#F8F6F0]/60 transition cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-[#1F3D2E]">Billing & Invoice Alerts</p>
              <p className="text-xs text-[#7A806F]">Notifications for payment receipts, invoices and billing status</p>
            </div>
            <input
              type="checkbox"
              checked={settings.billingAlerts ?? true}
              onChange={(e) => setSettings({ ...settings, billingAlerts: e.target.checked })}
              className="w-4 h-4 text-[#1F3D2E] rounded border-[#D9DDCE] focus:ring-[#1F3D2E]"
            />
          </label>
        </div>
      </div>

      {/* 3. Schedule & Availability (Doctors / Staff) */}
      {isStaffRole && (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
            <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
              <Clock size={18} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#1F3D2E]">Practice Schedule & Working Hours</h3>
              <p className="text-xs text-[#7A806F]">Define your standard working shifts and consulting availability</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                  Working Hours Start
                </label>
                <input
                  type="time"
                  value={settings.workingHoursStart || "09:00"}
                  onChange={(e) => setSettings({ ...settings, workingHoursStart: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                  Working Hours End
                </label>
                <input
                  type="time"
                  value={settings.workingHoursEnd || "18:00"}
                  onChange={(e) => setSettings({ ...settings, workingHoursEnd: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                />
              </div>
            </div>

            {/* Working Days */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-2">
                Active Working Days
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map((day) => {
                  const active = settings.workingDays?.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDayToggle(day)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                        active
                          ? "bg-[#1F3D2E] text-white border-[#1F3D2E] shadow-2xs"
                          : "bg-white text-[#4D5C4B] border-[#D9DDCE] hover:bg-[#F8F6F0]"
                      }`}
                    >
                      {day.substring(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Teleconsultation & Visibility */}
            <div className="pt-2 border-t border-[#F0F2EB] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex items-center justify-between p-3.5 rounded-xl border border-[#F0F2EB] hover:bg-[#F8F6F0]/60 transition cursor-pointer">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-[#1F3D2E]">
                    <Video size={15} />
                    <span>Teleconsultation</span>
                  </div>
                  <p className="text-xs text-[#7A806F]">Enable remote video consultations</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.teleconsultationEnabled ?? true}
                  onChange={(e) =>
                    setSettings({ ...settings, teleconsultationEnabled: e.target.checked })
                  }
                  className="w-4 h-4 text-[#1F3D2E] rounded border-[#D9DDCE] focus:ring-[#1F3D2E]"
                />
              </label>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                  <span className="flex items-center gap-1">
                    <ShieldCheck size={14} /> Profile Visibility
                  </span>
                </label>
                <select
                  value={settings.profileVisibility || "CLINIC_WIDE"}
                  onChange={(e) => setSettings({ ...settings, profileVisibility: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                >
                  <option value="CLINIC_WIDE">Clinic Wide (All Staff & Patients)</option>
                  <option value="DOCTORS_ONLY">Clinical Staff Only</option>
                  <option value="PRIVATE">Private (Administration Only)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#1F3D2E] text-white text-xs font-semibold hover:bg-[#173D2D] transition shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Saving Preferences...</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

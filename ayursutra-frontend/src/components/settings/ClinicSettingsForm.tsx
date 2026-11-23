import { useEffect, useState } from "react";
import {
  Building2,
  CreditCard,
  Package,
  Calendar,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  MapPin,
  Globe,
  BellRing,
} from "lucide-react";
import {
  getClinicSettings,
  updateClinicSettings,
} from "../../services/settings/settingsService";
import type { ClinicSettings, UpdateClinicSettingsPayload } from "../../types/settings";

const STANDARD_PAYMENT_METHODS = ["CASH", "UPI", "CARD", "NET_BANKING"];

export default function ClinicSettingsForm() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [settings, setSettings] = useState<ClinicSettings>({
    clinicId: "CLINIC-MAIN",
    clinicName: "AyurSutra Ayurvedic Clinic",
    tagline: "Holistic Healing & Traditional Panchakarma Care",
    contactEmail: "contact@ayursutra.clinic",
    contactPhone: "+91 98765 43210",
    address: "Sector 62, Noida, Uttar Pradesh, India",
    website: "https://ayursutra.clinic",
    logoUrl: "",
    currency: "INR",
    taxRate: 18.0,
    invoicePrefix: "INV-",
    invoiceNumberFormat: "INV-{YEAR}-{SEQ}",
    paymentMethods: ["CASH", "UPI", "CARD", "NET_BANKING"],
    lowStockThreshold: 10,
    defaultStockUnits: ["ml", "grams", "bottles", "tablets", "packs"],
    alertOnLowStock: true,
    appointmentSlotDurationMinutes: 30,
    autoConfirmAppointments: false,
    sendSmsNotifications: false,
    sendEmailNotifications: true,
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);
        const data = await getClinicSettings("CLINIC-MAIN");
        if (data) {
          setSettings(data);
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Could not load clinic settings.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handlePaymentToggle = (method: string) => {
    const current = settings.paymentMethods || [];
    const updated = current.includes(method)
      ? current.filter((m) => m !== method)
      : [...current, method];
    setSettings({ ...settings, paymentMethods: updated });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: UpdateClinicSettingsPayload = {
        clinicName: settings.clinicName,
        tagline: settings.tagline,
        contactEmail: settings.contactEmail,
        contactPhone: settings.contactPhone,
        address: settings.address,
        website: settings.website,
        logoUrl: settings.logoUrl,
        currency: settings.currency,
        taxRate: Number(settings.taxRate),
        invoicePrefix: settings.invoicePrefix,
        invoiceNumberFormat: settings.invoiceNumberFormat,
        paymentMethods: settings.paymentMethods,
        lowStockThreshold: Number(settings.lowStockThreshold),
        defaultStockUnits: settings.defaultStockUnits,
        alertOnLowStock: settings.alertOnLowStock,
        appointmentSlotDurationMinutes: Number(settings.appointmentSlotDurationMinutes),
        autoConfirmAppointments: settings.autoConfirmAppointments,
        sendSmsNotifications: settings.sendSmsNotifications,
        sendEmailNotifications: settings.sendEmailNotifications,
      };

      const updated = await updateClinicSettings(payload, "CLINIC-MAIN");
      setSettings(updated);
      setSuccess("Clinic configurations updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update clinic configurations.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 flex flex-col items-center justify-center text-center">
        <Loader2 size={32} className="animate-spin text-[#1F3D2E] mb-3" />
        <p className="text-sm font-medium text-[#4D5C4B]">Loading clinic settings...</p>
      </div>
    );
  }

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

      {/* 1. Clinic Information */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
          <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
            <Building2 size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1F3D2E]">Clinic Identity & Contact</h3>
            <p className="text-xs text-[#7A806F]">General details printed on patient invoices and reports</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              Clinic Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={settings.clinicName || ""}
              onChange={(e) => setSettings({ ...settings, clinicName: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              Tagline / Subheading
            </label>
            <input
              type="text"
              value={settings.tagline || ""}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Mail size={13} /> Official Contact Email
              </span>
            </label>
            <input
              type="email"
              value={settings.contactEmail || ""}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Phone size={13} /> Official Contact Phone
              </span>
            </label>
            <input
              type="text"
              value={settings.contactPhone || ""}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Globe size={13} /> Official Website
              </span>
            </label>
            <input
              type="url"
              value={settings.website || ""}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin size={13} /> Physical Clinic Address
              </span>
            </label>
            <input
              type="text"
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
          </div>
        </div>
      </div>

      {/* 2. Billing & Invoices */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
          <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
            <CreditCard size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1F3D2E]">Billing & Invoicing Configuration</h3>
            <p className="text-xs text-[#7A806F]">Currency, tax calculations, and invoice sequence structure</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              Currency Code
            </label>
            <input
              type="text"
              value={settings.currency || "INR"}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              GST / Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.5"
              value={settings.taxRate ?? 18}
              onChange={(e) => setSettings({ ...settings, taxRate: parseFloat(e.target.value) || 0 })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              Invoice Prefix
            </label>
            <input
              type="text"
              value={settings.invoicePrefix || "INV-"}
              onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
          </div>
        </div>

        {/* Accepted Payment Modes */}
        <div className="mt-5 pt-4 border-t border-[#F0F2EB]">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-2.5">
            Accepted Payment Methods
          </label>
          <div className="flex flex-wrap gap-2.5">
            {STANDARD_PAYMENT_METHODS.map((method) => {
              const active = settings.paymentMethods?.includes(method);
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => handlePaymentToggle(method)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                    active
                      ? "bg-[#1F3D2E] text-white border-[#1F3D2E] shadow-2xs"
                      : "bg-white text-[#4D5C4B] border-[#D9DDCE] hover:bg-[#F8F6F0]"
                  }`}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Clinical & Inventory Controls */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
          <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
            <Package size={18} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#1F3D2E]">Inventory & Scheduling Operations</h3>
            <p className="text-xs text-[#7A806F]">Stock alert thresholds and default appointment durations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              Low Stock Warning Threshold
            </label>
            <input
              type="number"
              min="1"
              value={settings.lowStockThreshold ?? 10}
              onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value, 10) || 10 })}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            />
            <p className="mt-1 text-[11px] text-[#7A806F]">
              Triggers notifications when medicine stock falls below this quantity.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Default Appointment Slot (Minutes)
              </span>
            </label>
            <select
              value={settings.appointmentSlotDurationMinutes ?? 30}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  appointmentSlotDurationMinutes: parseInt(e.target.value, 10) || 30,
                })
              }
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
            >
              <option value="15">15 Minutes</option>
              <option value="30">30 Minutes</option>
              <option value="45">45 Minutes</option>
              <option value="60">60 Minutes (1 Hour)</option>
              <option value="90">90 Minutes (Panchakarma Procedure)</option>
            </select>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-[#F0F2EB] space-y-3">
          <label className="flex items-center justify-between p-3 rounded-xl border border-[#F0F2EB] hover:bg-[#F8F6F0]/60 transition cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-[#1F3D2E]">Inventory Low-Stock Alerts</p>
              <p className="text-[11px] text-[#7A806F]">Send automated administrative alerts when herbal oils/medicines reach threshold</p>
            </div>
            <input
              type="checkbox"
              checked={settings.alertOnLowStock ?? true}
              onChange={(e) => setSettings({ ...settings, alertOnLowStock: e.target.checked })}
              className="w-4 h-4 text-[#1F3D2E] rounded border-[#D9DDCE] focus:ring-[#1F3D2E]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-[#F0F2EB] hover:bg-[#F8F6F0]/60 transition cursor-pointer">
            <div>
              <p className="text-xs font-semibold text-[#1F3D2E]">Auto-confirm Appointments</p>
              <p className="text-[11px] text-[#7A806F]">Automatically approve booking requests without manual front-desk review</p>
            </div>
            <input
              type="checkbox"
              checked={settings.autoConfirmAppointments ?? false}
              onChange={(e) => setSettings({ ...settings, autoConfirmAppointments: e.target.checked })}
              className="w-4 h-4 text-[#1F3D2E] rounded border-[#D9DDCE] focus:ring-[#1F3D2E]"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl border border-[#F0F2EB] hover:bg-[#F8F6F0]/60 transition cursor-pointer">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F3D2E]">
                <BellRing size={13} />
                <span>System Notification Dispatch</span>
              </div>
              <p className="text-[11px] text-[#7A806F]">Enable transactional email notification dispatch for clinic events</p>
            </div>
            <input
              type="checkbox"
              checked={settings.sendEmailNotifications ?? true}
              onChange={(e) => setSettings({ ...settings, sendEmailNotifications: e.target.checked })}
              className="w-4 h-4 text-[#1F3D2E] rounded border-[#D9DDCE] focus:ring-[#1F3D2E]"
            />
          </label>
        </div>
      </div>

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
              <span>Saving Configurations...</span>
            </>
          ) : (
            <>
              <Save size={15} />
              <span>Save Clinic Configurations</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

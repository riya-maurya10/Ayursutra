import { useState } from "react";
import {
  Building2,
  SlidersHorizontal,
  Settings,
  Sparkles,
  ShieldCheck,
  Building,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import ClinicSettingsForm from "../../components/settings/ClinicSettingsForm";
import UserSettingsForm from "../../components/settings/UserSettingsForm";

type SettingsTab = "clinic" | "preferences";

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>("clinic");

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]">
      {/* Sidebar */}
      <Sidebar
        role="ADMIN"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <Topbar
          title="Admin Settings"
          subtitle="Configure institutional clinic parameters, billing policies, and individual administrator preferences"
          userName={user?.fullName}
          role={user?.role}
          userEmail={user?.email}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-5 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-[#1F3D2E] text-white shadow-xs">
                    <Settings size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[#1F3D2E]">
                        Clinic & System Configuration
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <ShieldCheck size={12} />
                        Admin Access
                      </span>
                    </div>
                    <p className="text-xs text-[#7A806F] mt-1">
                      Manage institutional clinic workflows, invoices, inventory alerts, and personal display settings.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-medium text-[#4D5C4B] bg-[#F8F6F0] px-3.5 py-2 rounded-xl border border-[#D9DDCE]">
                  <Building size={14} className="text-[#1F3D2E]" />
                  <span>Clinic ID: <strong>CLINIC-MAIN</strong></span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 mt-6 pt-5 border-t border-[#F0F2EB]">
                <button
                  type="button"
                  onClick={() => setActiveTab("clinic")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === "clinic"
                      ? "bg-[#1F3D2E] text-white shadow-xs"
                      : "bg-[#F8F6F0] text-[#4D5C4B] hover:text-[#1F3D2E] hover:bg-[#EFF2E6] border border-[#D9DDCE]"
                  }`}
                >
                  <Building2 size={15} />
                  <span>Clinic Settings</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === "clinic"
                        ? "bg-white/20 text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    Global
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("preferences")}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    activeTab === "preferences"
                      ? "bg-[#1F3D2E] text-white shadow-xs"
                      : "bg-[#F8F6F0] text-[#4D5C4B] hover:text-[#1F3D2E] hover:bg-[#EFF2E6] border border-[#D9DDCE]"
                  }`}
                >
                  <SlidersHorizontal size={15} />
                  <span>My Preferences</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      activeTab === "preferences"
                        ? "bg-white/20 text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    Personal
                  </span>
                </button>
              </div>
            </div>

            {/* Tab 1: Clinic Settings */}
            {activeTab === "clinic" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-xs text-emerald-900 flex items-start gap-2.5">
                  <Sparkles size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Clinic-Wide Scope:</span> Changes saved here apply across all billing invoices, stock alerts, and patient notification communications for the clinic.
                  </div>
                </div>

                <ClinicSettingsForm />
              </div>
            )}

            {/* Tab 2: Personal Preferences */}
            {activeTab === "preferences" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/70 text-xs text-purple-900 flex items-start gap-2.5">
                  <SlidersHorizontal size={16} className="text-purple-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Personal Scope:</span> These preferences (theme, language, date format, and personal alert subscriptions) apply strictly to your authenticated administrator account.
                  </div>
                </div>

                <UserSettingsForm role="ADMIN" />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

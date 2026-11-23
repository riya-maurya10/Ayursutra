import { useState } from "react";
import {
  Lock,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import UserSettingsForm from "../../components/settings/UserSettingsForm";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";

export default function ReceptionistSettingsPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]">
      {/* Sidebar */}
      <Sidebar
        role="RECEPTIONIST"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <Topbar
          title="Receptionist Settings"
          subtitle="Configure front desk alert subscriptions, notification preferences, and personal account display formats"
          userName={user?.fullName}
          role={user?.role}
          userEmail={user?.email}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-5 md:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Banner */}
            <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="p-3 rounded-2xl bg-[#1F3D2E] text-white shadow-xs">
                    <UserRound size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-[#1F3D2E]">
                        Front Desk & Alert Preferences
                      </h2>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        <ShieldCheck size={12} />
                        Receptionist Access
                      </span>
                    </div>
                    <p className="text-xs text-[#7A806F] mt-1">
                      Manage patient registration alerts, billing invoice notifications, desk working schedule, and display themes.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9DDCE] text-xs font-semibold text-[#1F3D2E] bg-[#F8F6F0] hover:bg-[#EFF2E6] transition cursor-pointer self-start sm:self-auto"
                >
                  <Lock size={14} className="text-[#1F3D2E]" />
                  <span>Change Password</span>
                </button>
              </div>
            </div>

            {/* User Settings Form for Receptionist */}
            <UserSettingsForm role="RECEPTIONIST" />
          </div>
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}

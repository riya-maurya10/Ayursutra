import { useEffect, useState } from "react";
import {
  Building2,
  Calendar,
  CheckCircle2,
  Edit3,
  Heart,
  IdCard,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  ShieldCheck,
  UserRound,
  X,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import ProfileHeaderCard from "../../components/profile/ProfileHeaderCard";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import {
  getMyUserProfile,
  updateMyUserProfile,
} from "../../services/profile/profileService";
import type { BaseUserProfile, UpdateUserProfileRequest } from "../../types/profile";

export default function AdminProfilePage() {
  const { user, updateUserSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<BaseUserProfile | null>(null);

  // Editable Form State
  const [formData, setFormData] = useState<UpdateUserProfileRequest>({
    fullName: "",
    phone: "",
    gender: "",
    dateOfBirth: "",
    address: "",
    emergencyContact: "",
    bloodGroup: "",
    profilePictureUrl: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyUserProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || "",
        phone: data.phone || "",
        gender: data.gender || "",
        dateOfBirth: data.dateOfBirth || "",
        address: data.address || "",
        emergencyContact: data.emergencyContact || "",
        bloodGroup: data.bloodGroup || "",
        profilePictureUrl: data.profilePictureUrl || "",
      });
      // Synchronize AuthContext session
      if (data.fullName) {
        updateUserSession(data.fullName, data.profilePictureUrl);
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to load administrative profile.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handlePictureUploaded = async (url: string) => {
    if (!profile) return;
    try {
      const updated = await updateMyUserProfile({
        ...formData,
        fullName: formData.fullName || profile.fullName,
        phone: formData.phone || profile.phone,
        profilePictureUrl: url,
      });
      setProfile(updated);
      setFormData((prev) => ({ ...prev, profilePictureUrl: url }));
      updateUserSession(updated.fullName, url);
      setSuccess("Profile picture updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save uploaded profile picture.";
      setError(msg);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        gender: profile.gender || "",
        dateOfBirth: profile.dateOfBirth || "",
        address: profile.address || "",
        emergencyContact: profile.emergencyContact || "",
        bloodGroup: profile.bloodGroup || "",
        profilePictureUrl: profile.profilePictureUrl || "",
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload: UpdateUserProfileRequest = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        gender: formData.gender?.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        address: formData.address?.trim() || undefined,
        emergencyContact: formData.emergencyContact?.trim() || undefined,
        bloodGroup: formData.bloodGroup?.trim() || undefined,
        profilePictureUrl: formData.profilePictureUrl || undefined,
      };

      const updated = await updateMyUserProfile(payload);
      setProfile(updated);
      updateUserSession(updated.fullName, updated.profilePictureUrl);
      setIsEditing(false);
      setSuccess("Administrative profile updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to update profile. Please verify all fields.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const formatCreationDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]">
      {/* Sidebar */}
      <Sidebar
        role="ADMIN"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <Topbar
          title="Admin Profile"
          subtitle="System administrator credentials, contact information and account security"
          userName={user?.fullName}
          role={user?.role}
          userEmail={user?.email}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-5 md:p-8">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 flex flex-col items-center justify-center text-center">
              <Loader2 size={36} className="animate-spin text-[#1F3D2E] mb-3" />
              <p className="text-sm font-medium text-[#4D5C4B]">Loading administrator profile...</p>
            </div>
          ) : profile ? (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Profile Header Banner */}
              <ProfileHeaderCard
                fullName={profile.fullName}
                email={profile.email}
                phone={profile.phone}
                role="ADMIN"
                status={profile.enabled ? "APPROVED" : "DISABLED"}
                lastLogin={profile.lastLogin}
                profilePictureUrl={profile.profilePictureUrl}
                onPictureUploaded={handlePictureUploaded}
                metadataChips={[
                  {
                    label: "Account Role",
                    value: "Clinic Administrator",
                    icon: ShieldCheck,
                  },
                  {
                    label: "Clinic Organization",
                    value: profile.clinicId || "AyurSutra Main",
                    icon: Building2,
                  },
                  {
                    label: "Security Level",
                    value: "Full Administrative",
                    icon: Shield,
                  },
                  {
                    label: "Member Since",
                    value: formatCreationDate(profile.createdAt),
                    icon: Calendar,
                  },
                ]}
              />

              {/* Status Notifications */}
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

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Personal & Contact Information */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 md:p-7">
                    <div className="flex items-center justify-between pb-4 border-b border-[#F0F2EB] mb-6">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
                          <UserRound size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[#1F3D2E]">
                            Personal & Contact Details
                          </h3>
                          <p className="text-xs text-[#7A806F]">
                            Primary personal information and communication details
                          </p>
                        </div>
                      </div>

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9DDCE] text-xs font-semibold text-[#1F3D2E] hover:bg-[#F8F6F0] transition shadow-2xs"
                        >
                          <Edit3 size={14} />
                          <span>Edit Details</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCancel}
                            disabled={saving}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D9DDCE] text-xs font-medium text-[#4D5C4B] hover:text-[#1F3D2E] hover:bg-[#F8F6F0] transition"
                          >
                            <X size={13} />
                            <span>Cancel</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1F3D2E] text-white text-xs font-semibold hover:bg-[#173D2D] transition shadow-2xs disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 size={13} className="animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <>
                                <Save size={13} />
                                <span>Save Changes</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* View vs Edit Mode */}
                    {!isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Full Name
                          </p>
                          <p className="font-semibold text-[#1F3D2E]">
                            {profile.fullName || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Phone Number
                          </p>
                          <p className="font-semibold text-[#1F3D2E] flex items-center gap-1.5">
                            <Phone size={14} className="text-[#7A806F]" />
                            {profile.phone || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Gender
                          </p>
                          <p className="font-medium text-[#1F3D2E] capitalize">
                            {profile.gender || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Date of Birth
                          </p>
                          <p className="font-medium text-[#1F3D2E] flex items-center gap-1.5">
                            <Calendar size={14} className="text-[#7A806F]" />
                            {profile.dateOfBirth || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Blood Group
                          </p>
                          <p className="font-medium text-[#1F3D2E] flex items-center gap-1.5">
                            <Heart size={14} className="text-red-500" />
                            {profile.bloodGroup || "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Emergency Contact
                          </p>
                          <p className="font-medium text-[#1F3D2E]">
                            {profile.emergencyContact || "Not specified"}
                          </p>
                        </div>

                        <div className="sm:col-span-2 pt-2 border-t border-[#F0F2EB]">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Residential / Office Address
                          </p>
                          <p className="font-medium text-[#1F3D2E] flex items-start gap-1.5">
                            <MapPin size={15} className="text-[#7A806F] shrink-0 mt-0.5" />
                            <span>{profile.address || "Not specified"}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.fullName}
                              onChange={(e) =>
                                setFormData({ ...formData, fullName: e.target.value })
                              }
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Phone Number <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.phone}
                              onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                              }
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Gender
                            </label>
                            <select
                              value={formData.gender || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, gender: e.target.value })
                              }
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Date of Birth
                            </label>
                            <input
                              type="date"
                              value={formData.dateOfBirth || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, dateOfBirth: e.target.value })
                              }
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Blood Group
                            </label>
                            <select
                              value={formData.bloodGroup || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, bloodGroup: e.target.value })
                              }
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            >
                              <option value="">Select Blood Group</option>
                              <option value="A+">A+</option>
                              <option value="A-">A-</option>
                              <option value="B+">B+</option>
                              <option value="B-">B-</option>
                              <option value="AB+">AB+</option>
                              <option value="AB-">AB-</option>
                              <option value="O+">O+</option>
                              <option value="O-">O-</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Emergency Contact
                            </label>
                            <input
                              type="text"
                              value={formData.emergencyContact || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, emergencyContact: e.target.value })
                              }
                              placeholder="Name & Contact number"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Residential / Office Address
                            </label>
                            <textarea
                              rows={2}
                              value={formData.address || ""}
                              onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                              }
                              placeholder="Full postal address"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>
                        </div>
                      </form>
                    )}
                  </div>
                </div>

                {/* Right Col: Read-Only Account Security & Identity Card */}
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
                      <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                        <IdCard size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#1F3D2E]">
                          Account Credential Details
                        </h3>
                        <p className="text-[11px] text-[#7A806F]">
                          Immutable system identification records
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">Admin User ID</span>
                        <span className="font-mono font-medium text-[#1F3D2E] bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 text-[11px]">
                          {profile.id}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">Account Role</span>
                        <span className="font-bold text-[#1F3D2E] bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                          {profile.role}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">Login Email</span>
                        <span className="font-semibold text-[#1F3D2E] flex items-center gap-1">
                          <Mail size={12} className="text-[#7A806F]" />
                          {profile.email}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">Verification Status</span>
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 size={11} />
                          {profile.verificationStatus}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">Account State</span>
                        <span className="font-semibold text-emerald-700">
                          {profile.enabled ? "Active & Authorized" : "Disabled"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[#7A806F]">Account Created</span>
                        <span className="font-medium text-[#1F3D2E]">
                          {formatCreationDate(profile.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#F0F2EB]">
                      <button
                        type="button"
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D9DDCE] text-xs font-semibold text-[#1F3D2E] hover:bg-[#F8F6F0] hover:border-[#1F3D2E] transition shadow-2xs"
                      >
                        <Lock size={14} className="text-[#1F3D2E]" />
                        <span>Change Account Password</span>
                      </button>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="p-4 rounded-2xl bg-[#1F3D2E]/5 border border-[#1F3D2E]/10 text-xs text-[#1F3D2E] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Shield size={14} />
                      <span>Security & Role Protection</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#4D5C4B]">
                      Administrative roles, primary login emails and system IDs are immutable.
                      Password modifications must be performed via authenticated token exchange.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-sm text-[#7A806F]">
              No administrator profile data could be retrieved.
            </div>
          )}
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

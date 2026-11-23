import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
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
  Sparkles,
  User,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import ProfileHeaderCard from "../../components/profile/ProfileHeaderCard";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import apiClient from "../../services/api/client";
import {
  getMyPatientProfile,
  updateMyPatientProfile,
} from "../../services/profile/profileService";
import type { PatientProfile } from "../../types/profile";

export default function PatientProfilePage() {
  const { user, updateUserSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<PatientProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    fullName: string;
    phone: string;
    age: number | string;
    gender: string;
    address: string;
    medicalHistory: string;
    bloodGroup: string;
    emergencyContact: string;
  }>({
    fullName: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
    medicalHistory: "",
    bloodGroup: "",
    emergencyContact: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyPatientProfile();
      setProfile(data);
      setProfileExists(true);
      setFormData({
        fullName: data.fullName || user?.fullName || "",
        phone: data.phone || "",
        age: data.age ?? "",
        gender: data.gender || "",
        address: data.address || "",
        medicalHistory: data.medicalHistory || "",
        bloodGroup: data.bloodGroup || "",
        emergencyContact: data.emergencyContact || "",
      });

      if (data.fullName && user && (user.fullName !== data.fullName || user.profilePictureUrl !== data.profilePictureUrl)) {
        updateUserSession(data.fullName, data.profilePictureUrl);
      }
    } catch (err: unknown) {
      setProfileExists(false);
      const fallback: PatientProfile = {
        id: "",
        userId: "",
        fullName: user?.fullName || "",
        email: user?.email || "",
        phone: "",
        age: undefined,
        gender: "",
        address: "",
        medicalHistory: "",
        profilePictureUrl: user?.profilePictureUrl || "",
      };
      setProfile(fallback);
      setFormData({
        fullName: fallback.fullName,
        phone: "",
        age: "",
        gender: "",
        address: "",
        medicalHistory: "",
        bloodGroup: "",
        emergencyContact: "",
      });
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "";
      if (msg && !msg.toLowerCase().includes("not found")) {
        setError(msg);
      }
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
      // Update User profile avatar
      await apiClient.put("/users/me", {
        fullName: formData.fullName || profile.fullName,
        phone: formData.phone || profile.phone,
        profilePictureUrl: url,
      });

      setProfile((prev) => (prev ? { ...prev, profilePictureUrl: url } : null));
      updateUserSession(formData.fullName || profile.fullName, url);
      setSuccess("Profile picture updated successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save profile picture.";
      setError(msg);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        age: profile.age ?? "",
        gender: profile.gender || "",
        address: profile.address || "",
        medicalHistory: profile.medicalHistory || "",
        bloodGroup: profile.bloodGroup || "",
        emergencyContact: profile.emergencyContact || "",
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

      const parsedAge = formData.age ? Number(formData.age) : undefined;

      const payload = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        age: parsedAge,
        gender: formData.gender.trim() || undefined,
        address: formData.address.trim() || undefined,
        medicalHistory: formData.medicalHistory.trim() || undefined,
      };

      let updatedData: PatientProfile;

      if (!profileExists) {
        const res = await apiClient.post("/patients/me", payload);
        updatedData = res.data.data;
        setProfileExists(true);
      } else {
        updatedData = await updateMyPatientProfile(payload);
      }

      setProfile(updatedData);
      updateUserSession(updatedData.fullName, updatedData.profilePictureUrl);
      setIsEditing(false);
      setSuccess("Patient profile saved successfully.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to save profile. Please verify your details.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]">
      {/* Sidebar */}
      <Sidebar
        role="PATIENT"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <Topbar
          title="Patient Profile"
          subtitle="Personal health records, Ayurvedic Dosha constitution, and clinical contact details"
          userName={user?.fullName}
          role={user?.role}
          userEmail={user?.email}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-5 md:p-8">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 flex flex-col items-center justify-center text-center">
              <Loader2 size={36} className="animate-spin text-[#1F3D2E] mb-3" />
              <p className="text-sm font-medium text-[#4D5C4B]">Loading your patient profile...</p>
            </div>
          ) : profile ? (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Profile Header Banner */}
              <ProfileHeaderCard
                fullName={profile.fullName || user?.fullName || "Patient"}
                email={profile.email || user?.email || ""}
                phone={profile.phone || ""}
                role="PATIENT"
                status="APPROVED"
                profilePictureUrl={profile.profilePictureUrl}
                onPictureUploaded={handlePictureUploaded}
                metadataChips={[
                  {
                    label: "Primary Dosha",
                    value: profile.primaryDosha || "Prakriti Assessment",
                    icon: Sparkles,
                  },
                  {
                    label: "Age & Gender",
                    value: profile.age ? `${profile.age} Yrs, ${profile.gender || "—"}` : (profile.gender || "Patient"),
                    icon: User,
                  },
                  {
                    label: "Blood Group",
                    value: profile.bloodGroup || "Not recorded",
                    icon: Heart,
                  },
                  {
                    label: "Patient Care",
                    value: "Active Care Journey",
                    icon: ShieldCheck,
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

              {/* Main Profile Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Personal & Clinical Information */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Personal & Health Details Card */}
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
                            Primary personal profile, emergency contact and clinical history
                          </p>
                        </div>
                      </div>

                      {!isEditing ? (
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#D9DDCE] text-xs font-semibold text-[#1F3D2E] hover:bg-[#F8F6F0] transition shadow-2xs cursor-pointer"
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
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#D9DDCE] text-xs font-medium text-[#4D5C4B] hover:text-[#1F3D2E] hover:bg-[#F8F6F0] transition cursor-pointer"
                          >
                            <X size={13} />
                            <span>Cancel</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1F3D2E] text-white text-xs font-semibold hover:bg-[#173D2D] transition shadow-2xs disabled:opacity-50 cursor-pointer"
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
                            Age
                          </p>
                          <p className="font-medium text-[#1F3D2E]">
                            {profile.age ? `${profile.age} Years` : "Not specified"}
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
                            Blood Group
                          </p>
                          <p className="font-medium text-[#1F3D2E] flex items-center gap-1.5">
                            <Heart size={14} className="text-rose-500" />
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

                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Medical History & Pre-existing Conditions
                          </p>
                          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed">
                            {profile.medicalHistory || "No previous clinical conditions or allergies reported."}
                          </div>
                        </div>

                        <div className="sm:col-span-2 pt-2 border-t border-[#F0F2EB]">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Residential Address
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
                              Age
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={120}
                              value={formData.age}
                              onChange={(e) =>
                                setFormData({ ...formData, age: e.target.value })
                              }
                              placeholder="e.g. 32"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Gender
                            </label>
                            <select
                              value={formData.gender}
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

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Medical History & Known Allergies
                            </label>
                            <textarea
                              rows={3}
                              value={formData.medicalHistory}
                              onChange={(e) =>
                                setFormData({ ...formData, medicalHistory: e.target.value })
                              }
                              placeholder="Mention any past surgeries, chronic ailments, medication allergies or health concerns..."
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Residential Address
                            </label>
                            <textarea
                              rows={2}
                              value={formData.address}
                              onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                              }
                              placeholder="Full residential postal address"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Ayurvedic Prakriti & Dosha Constitution Card */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 md:p-7">
                    <div className="flex items-center justify-between pb-4 border-b border-[#F0F2EB] mb-5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-amber-100 text-amber-800">
                          <Sparkles size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[#1F3D2E]">
                            Ayurvedic Prakriti & Dosha Profile
                          </h3>
                          <p className="text-xs text-[#7A806F]">
                            Body-mind constitutional balance determined by Ayurvedic diagnosis
                          </p>
                        </div>
                      </div>

                      <Link
                        to="/patient/dosha-quiz"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1F3D2E] text-white text-xs font-semibold hover:bg-[#173D2D] transition shadow-2xs"
                      >
                        <Sparkles size={13} />
                        <span>{profile.primaryDosha ? "Retake Quiz" : "Take Dosha Quiz"}</span>
                      </Link>
                    </div>

                    {profile.primaryDosha ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                              Dominant Prakriti
                            </span>
                            <p className="text-base font-bold text-amber-950 mt-0.5">
                              {profile.primaryDosha}
                            </p>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-amber-200/60 text-amber-900 text-xs font-bold">
                            Assessed
                          </span>
                        </div>

                        {/* Dosha Distribution Progress Bars */}
                        {(profile.vataPercentage !== undefined ||
                          profile.pittaPercentage !== undefined ||
                          profile.kaphaPercentage !== undefined) && (
                          <div className="space-y-3 pt-2">
                            <div>
                              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                                <span>Vata (Air & Ether)</span>
                                <span>{profile.vataPercentage ?? 0}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                  className="h-full bg-blue-500 rounded-full"
                                  style={{ width: `${profile.vataPercentage ?? 0}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                                <span>Pitta (Fire & Water)</span>
                                <span>{profile.pittaPercentage ?? 0}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 rounded-full"
                                  style={{ width: `${profile.pittaPercentage ?? 0}%` }}
                                />
                              </div>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                                <span>Kapha (Earth & Water)</span>
                                <span>{profile.kaphaPercentage ?? 0}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${profile.kaphaPercentage ?? 0}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {profile.prakritiNotes && (
                          <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                            {profile.prakritiNotes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 text-center space-y-2">
                        <Sparkles className="w-8 h-8 text-amber-600 mx-auto opacity-70" />
                        <p className="text-sm font-semibold text-stone-800">
                          Prakriti Assessment Pending
                        </p>
                        <p className="text-xs text-stone-500 max-w-sm mx-auto">
                          Take the comprehensive 3-minute Ayurvedic Dosha assessment to discover your unique constitution and personalize your therapy treatments.
                        </p>
                        <div className="pt-2">
                          <Link
                            to="/patient/dosha-quiz"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1F3D2E] text-white text-xs font-semibold hover:bg-[#173D2D] transition shadow-2xs"
                          >
                            <Sparkles size={13} />
                            <span>Start Dosha Assessment</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Col: Account Security & Identification */}
                <div className="space-y-6">
                  {/* Account Identification Card */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
                      <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                        <IdCard size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#1F3D2E]">
                          Patient Identification Card
                        </h3>
                        <p className="text-[11px] text-[#7A806F]">
                          Official clinic registry and account identifiers
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      {profile.id ? (
                        <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                          <span className="text-[#7A806F]">Patient Record ID</span>
                          <span className="font-mono text-[#7A806F] text-[11px]">
                            {profile.id}
                          </span>
                        </div>
                      ) : null}

                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">User ID</span>
                        <span className="font-mono text-[#7A806F] text-[11px]">
                          {profile.userId || "—"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">Email Address</span>
                        <span className="font-semibold text-[#1F3D2E] flex items-center gap-1">
                          <Mail size={12} className="text-[#7A806F]" />
                          {profile.email || user?.email}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[#7A806F]">Account Role</span>
                        <span className="font-bold text-[#1F3D2E] bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          PATIENT
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#F0F2EB]">
                      <button
                        type="button"
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#D9DDCE] text-xs font-semibold text-[#1F3D2E] hover:bg-[#F8F6F0] hover:border-[#1F3D2E] transition shadow-2xs cursor-pointer"
                      >
                        <Lock size={14} className="text-[#1F3D2E]" />
                        <span>Change Account Password</span>
                      </button>
                    </div>
                  </div>

                  {/* Privacy & Health Data Notice */}
                  <div className="p-4 rounded-2xl bg-[#1F3D2E]/5 border border-[#1F3D2E]/10 text-xs text-[#1F3D2E] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Shield size={14} />
                      <span>Confidential Health Records</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#4D5C4B]">
                      Your diagnostic history, Panchakarma progress and clinical records are protected under clinical health privacy policies and shared strictly with your assigned doctors and therapists.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-sm text-[#7A806F]">
              No patient profile record could be retrieved.
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

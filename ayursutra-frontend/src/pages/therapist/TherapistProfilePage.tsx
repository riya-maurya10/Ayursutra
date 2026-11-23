import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileText,
  HeartPulse,
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
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import ProfileHeaderCard from "../../components/profile/ProfileHeaderCard";
import ChangePasswordModal from "../../components/profile/ChangePasswordModal";
import {
  getMyTherapistProfile,
  updateMyTherapistProfile,
} from "../../services/profile/profileService";
import { resolveDocumentUrl } from "../../services/admin/staffInvitationService";
import type { TherapistProfile, UpdateTherapistProfileRequest } from "../../types/profile";

export default function TherapistProfilePage() {
  const { user, updateUserSession } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<TherapistProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    fullName: string;
    phone: string;
    specialization: string;
    qualification: string;
    experienceYears: number;
    therapistType: string;
    therapySkillsInput: string;
    trainingCertifications: string;
    address: string;
    available: boolean;
    gender: string;
    dateOfBirth: string;
    profilePictureUrl: string;
  }>({
    fullName: "",
    phone: "",
    specialization: "",
    qualification: "",
    experienceYears: 0,
    therapistType: "",
    therapySkillsInput: "",
    trainingCertifications: "",
    address: "",
    available: true,
    gender: "",
    dateOfBirth: "",
    profilePictureUrl: "",
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMyTherapistProfile();
      setProfile(data);
      setFormData({
        fullName: data.fullName || "",
        phone: data.phone || "",
        specialization: data.specialization || "",
        qualification: data.qualification || "",
        experienceYears: data.experienceYears ?? 0,
        therapistType: data.therapistType || "Senior Therapist",
        therapySkillsInput: (data.therapySkills || []).join(", "),
        trainingCertifications: data.trainingCertifications || "",
        address: data.address || "",
        available: data.available ?? true,
        gender: data.gender || "",
        dateOfBirth: data.dateOfBirth || "",
        profilePictureUrl: data.profilePictureUrl || "",
      });

      if (data.fullName && user && (user.fullName !== data.fullName || user.profilePictureUrl !== data.profilePictureUrl)) {
        updateUserSession(data.fullName, data.profilePictureUrl);
      }
    } catch (err: unknown) {
      const fallback: TherapistProfile = {
        id: "",
        userId: "",
        fullName: user?.fullName || "",
        email: user?.email || "",
        phone: "",
        available: true,
        gender: "",
        dateOfBirth: "",
        profilePictureUrl: user?.profilePictureUrl || "",
        specialization: "Panchakarma",
        qualification: "Certified Ayurvedic Therapist",
        therapistType: "Senior Therapist",
        therapySkills: ["Abhyanga", "Swedana", "Shirodhara"],
      };
      setProfile(fallback);
      setFormData({
        fullName: fallback.fullName,
        phone: "",
        specialization: fallback.specialization || "",
        qualification: fallback.qualification || "",
        experienceYears: 0,
        therapistType: fallback.therapistType || "Senior Therapist",
        therapySkillsInput: "Abhyanga, Swedana, Shirodhara",
        trainingCertifications: "",
        address: "",
        available: true,
        gender: "",
        dateOfBirth: "",
        profilePictureUrl: fallback.profilePictureUrl || "",
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
      const skillsArray = formData.therapySkillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await updateMyTherapistProfile({
        fullName: formData.fullName || profile.fullName,
        phone: formData.phone || profile.phone,
        specialization: formData.specialization || profile.specialization,
        qualification: formData.qualification || profile.qualification,
        experienceYears: Number(formData.experienceYears) || 0,
        therapistType: formData.therapistType || profile.therapistType,
        therapySkills: skillsArray,
        trainingCertifications: formData.trainingCertifications,
        address: formData.address,
        available: formData.available,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
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
        specialization: profile.specialization || "",
        qualification: profile.qualification || "",
        experienceYears: profile.experienceYears ?? 0,
        therapistType: profile.therapistType || "Senior Therapist",
        therapySkillsInput: (profile.therapySkills || []).join(", "),
        trainingCertifications: profile.trainingCertifications || "",
        address: profile.address || "",
        available: profile.available ?? true,
        gender: profile.gender || "",
        dateOfBirth: profile.dateOfBirth || "",
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
    if (!formData.qualification.trim()) {
      setError("Therapy qualification is required.");
      return;
    }
    if (!formData.specialization.trim()) {
      setError("Therapy specialization is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const skillsArray = formData.therapySkillsInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: UpdateTherapistProfileRequest = {
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        specialization: formData.specialization.trim(),
        qualification: formData.qualification.trim(),
        experienceYears: Number(formData.experienceYears) || 0,
        therapistType: formData.therapistType.trim(),
        therapySkills: skillsArray,
        trainingCertifications: formData.trainingCertifications.trim() || undefined,
        address: formData.address.trim() || undefined,
        available: formData.available,
        gender: formData.gender.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        profilePictureUrl: formData.profilePictureUrl || undefined,
      };

      const updated = await updateMyTherapistProfile(payload);
      setProfile(updated);
      updateUserSession(updated.fullName, updated.profilePictureUrl);
      setIsEditing(false);
      setSuccess("Therapist profile updated successfully.");
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

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]">
      {/* Sidebar */}
      <Sidebar
        role="THERAPIST"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <Topbar
          title="Therapist Profile"
          subtitle="Panchakarma qualifications, therapy specializations, skills and practice credentials"
          userName={user?.fullName}
          role={user?.role}
          userEmail={user?.email}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-5 md:p-8">
          {loading ? (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-16 flex flex-col items-center justify-center text-center">
              <Loader2 size={36} className="animate-spin text-[#1F3D2E] mb-3" />
              <p className="text-sm font-medium text-[#4D5C4B]">Loading therapist profile...</p>
            </div>
          ) : profile ? (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Profile Header Banner */}
              <ProfileHeaderCard
                fullName={profile.fullName}
                email={profile.email}
                phone={profile.phone}
                role="THERAPIST"
                status="APPROVED"
                profilePictureUrl={profile.profilePictureUrl}
                onPictureUploaded={handlePictureUploaded}
                metadataChips={[
                  {
                    label: "Therapist Type",
                    value: profile.therapistType || "Senior Therapist",
                    icon: HeartPulse,
                  },
                  {
                    label: "Specialization",
                    value: profile.specialization || "Panchakarma Care",
                    icon: Sparkles,
                  },
                  {
                    label: "Experience",
                    value: `${profile.experienceYears ?? 0} Years Experience`,
                    icon: Calendar,
                  },
                  {
                    label: "Therapy Skills",
                    value: `${profile.therapySkills?.length || 0} Procedures`,
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

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left 2 Cols: Therapy Credentials & Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Credentials & Personal Details */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6 md:p-7">
                    <div className="flex items-center justify-between pb-4 border-b border-[#F0F2EB] mb-6">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
                          <HeartPulse size={18} />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-[#1F3D2E]">
                            Therapist Qualifications & Details
                          </h3>
                          <p className="text-xs text-[#7A806F]">
                            Professional therapeutic credentials, clinical skills and contact details
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
                            Qualification
                          </p>
                          <p className="font-semibold text-[#1F3D2E]">
                            {profile.qualification || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Specialization
                          </p>
                          <p className="font-semibold text-[#1F3D2E]">
                            {profile.specialization || "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Therapist Designation
                          </p>
                          <p className="font-medium text-[#1F3D2E]">
                            {profile.therapistType || "Senior Therapist"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Years of Experience
                          </p>
                          <p className="font-medium text-[#1F3D2E]">
                            {profile.experienceYears ?? 0} Years
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Therapy Availability
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                              profile.available
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                profile.available ? "bg-emerald-600" : "bg-amber-600"
                              }`}
                            />
                            {profile.available ? "Available for Sessions" : "Currently Unavailable"}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Gender
                          </p>
                          <p className="font-medium text-[#1F3D2E] capitalize">
                            {profile.gender || "Not specified"}
                          </p>
                        </div>

                        <div className="sm:col-span-2">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Therapy Skills & Panchakarma Procedures
                          </p>
                          {profile.therapySkills && profile.therapySkills.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {profile.therapySkills.map((skill, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-900 border border-emerald-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-stone-400 italic">No specific therapy skills listed.</p>
                          )}
                        </div>

                        {profile.trainingCertifications && (
                          <div className="sm:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                              Training & Accreditations
                            </p>
                            <p className="font-medium text-[#1F3D2E]">
                              {profile.trainingCertifications}
                            </p>
                          </div>
                        )}

                        <div className="sm:col-span-2 pt-2 border-t border-[#F0F2EB]">
                          <p className="text-xs font-semibold uppercase tracking-wider text-[#7A806F] mb-1">
                            Address
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
                              Qualification <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.qualification}
                              onChange={(e) =>
                                setFormData({ ...formData, qualification: e.target.value })
                              }
                              placeholder="e.g. Diploma in Ayurvedic Panchakarma Therapy (DAPT)"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Specialization <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.specialization}
                              onChange={(e) =>
                                setFormData({ ...formData, specialization: e.target.value })
                              }
                              placeholder="e.g. Abhyanga, Shirodhara, Swedana"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Therapist Designation
                            </label>
                            <input
                              type="text"
                              value={formData.therapistType}
                              onChange={(e) =>
                                setFormData({ ...formData, therapistType: e.target.value })
                              }
                              placeholder="e.g. Senior Panchakarma Therapist"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Years of Experience
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={60}
                              value={formData.experienceYears ?? 0}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  experienceYears: parseInt(e.target.value, 10) || 0,
                                })
                              }
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Therapy Skills (Comma separated)
                            </label>
                            <input
                              type="text"
                              value={formData.therapySkillsInput}
                              onChange={(e) =>
                                setFormData({ ...formData, therapySkillsInput: e.target.value })
                              }
                              placeholder="e.g. Abhyanga, Shirodhara, Swedana, Pizhichil, Kizhi"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Training & Certifications
                            </label>
                            <input
                              type="text"
                              value={formData.trainingCertifications}
                              onChange={(e) =>
                                setFormData({ ...formData, trainingCertifications: e.target.value })
                              }
                              placeholder="e.g. Certified Kerala Panchakarma Practitioner"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Availability Status
                            </label>
                            <select
                              value={formData.available ? "true" : "false"}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  available: e.target.value === "true",
                                })
                              }
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] bg-white focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            >
                              <option value="true">Available for Sessions</option>
                              <option value="false">Currently Unavailable</option>
                            </select>
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

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-[#4D5C4B] mb-1.5">
                              Address
                            </label>
                            <textarea
                              rows={2}
                              value={formData.address}
                              onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                              }
                              placeholder="Residential address"
                              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-[#D9DDCE] focus:outline-none focus:ring-2 focus:ring-[#1F3D2E]/20 focus:border-[#1F3D2E] transition"
                            />
                          </div>
                        </div>
                      </form>
                    )}
                  </div>

                  {/* Verification Certificates */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-4">
                      <div className="p-2 rounded-xl bg-[#1F3D2E]/10 text-[#1F3D2E]">
                        <FileText size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#1F3D2E]">
                          Accreditation & Training Certificates
                        </h3>
                        <p className="text-[11px] text-[#7A806F]">
                          Official therapeutic verification documents on record
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {profile.qualificationCertificateUrl ? (
                        <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#1F3D2E]" />
                            <span className="font-semibold text-stone-800 text-xs">Qualification Certificate</span>
                          </div>
                          <a
                            href={resolveDocumentUrl(profile.qualificationCertificateUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1F3D2E] text-white text-xs hover:bg-[#173D2D] font-medium transition"
                          >
                            <ExternalLink size={13} />
                            <span>View Document</span>
                          </a>
                        </div>
                      ) : null}

                      {profile.trainingCertificateUrl ? (
                        <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#1F3D2E]" />
                            <span className="font-semibold text-stone-800 text-xs">Training / Specialization Certificate</span>
                          </div>
                          <a
                            href={resolveDocumentUrl(profile.trainingCertificateUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1F3D2E] text-white text-xs hover:bg-[#173D2D] font-medium transition"
                          >
                            <ExternalLink size={13} />
                            <span>View Document</span>
                          </a>
                        </div>
                      ) : null}

                      {!profile.qualificationCertificateUrl && !profile.trainingCertificateUrl && (
                        <p className="text-xs text-stone-400 italic py-2">
                          No verification documents attached to this therapist profile.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Col: Account Security & Identification */}
                <div className="space-y-6">
                  {/* Account Identification Card */}
                  <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-6">
                    <div className="flex items-center gap-2.5 pb-4 border-b border-[#F0F2EB] mb-5">
                      <div className="p-2 rounded-xl bg-purple-100 text-purple-800">
                        <IdCard size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#1F3D2E]">
                          Therapist Credential Summary
                        </h3>
                        <p className="text-[11px] text-[#7A806F]">
                          System identification and account status
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">Therapist ID</span>
                        <span className="font-mono text-[#7A806F] text-[11px]">
                          {profile.id}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5 border-b border-[#F0F2EB]">
                        <span className="text-[#7A806F]">User Account ID</span>
                        <span className="font-mono text-[#7A806F] text-[11px]">
                          {profile.userId}
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
                        <span className="text-[#7A806F]">Clinic ID</span>
                        <span className="font-semibold text-[#1F3D2E]">
                          {profile.clinicId || "CLINIC-MAIN"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-[#7A806F]">Account Role</span>
                        <span className="font-bold text-[#1F3D2E] bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
                          THERAPIST
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

                  {/* Security Notice */}
                  <div className="p-4 rounded-2xl bg-[#1F3D2E]/5 border border-[#1F3D2E]/10 text-xs text-[#1F3D2E] space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Shield size={14} />
                      <span>Role & Credential Security</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#4D5C4B]">
                      Therapist staff accounts, clinic assignments and primary system IDs are secured and managed in accordance with clinic administration policies.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-12 text-center text-sm text-[#7A806F]">
              No therapist profile data could be retrieved.
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

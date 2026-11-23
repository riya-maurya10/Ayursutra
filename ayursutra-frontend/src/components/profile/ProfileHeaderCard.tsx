import { useRef, useState } from "react";
import { Camera, CheckCircle2, Clock, KeyRound, Loader2, Shield, AlertCircle } from "lucide-react";
import { uploadProfilePicture } from "../../services/profile/profileService";
import ChangePasswordModal from "./ChangePasswordModal";

interface MetadataChip {
  label: string;
  value: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

interface ProfileHeaderCardProps {
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  status?: string;
  lastLogin?: string;
  profilePictureUrl?: string;
  metadataChips?: MetadataChip[];
  onPictureUploaded?: (url: string) => void;
  readOnly?: boolean;
}

export default function ProfileHeaderCard({
  fullName,
  email,
  phone,
  role,
  status = "APPROVED",
  lastLogin,
  profilePictureUrl,
  metadataChips = [],
  onPictureUploaded,
  readOnly = false,
}: ProfileHeaderCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const initial = (fullName?.trim().charAt(0) || role?.charAt(0) || "U").toUpperCase();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    try {
      setUploading(true);
      const uploadedUrl = await uploadProfilePicture(file);
      if (onPictureUploaded) {
        onPictureUploaded(uploadedUrl);
      }
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to upload profile picture.");
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatLastLogin = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const getRoleBadgeClasses = (r: string) => {
    switch (r?.toUpperCase()) {
      case "ADMIN":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DOCTOR":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "THERAPIST":
        return "bg-teal-100 text-teal-800 border-teal-200";
      case "RECEPTIONIST":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PATIENT":
        return "bg-amber-100 text-amber-800 border-amber-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Left: Avatar + Identity */}
          <div className="flex items-start md:items-center gap-5">
            {/* Avatar with upload trigger */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 md:w-24 md:d-24 rounded-2xl bg-[#1F3D2E] text-white flex items-center justify-center font-bold text-2xl md:text-3xl overflow-hidden shadow-inner border-2 border-white ring-2 ring-[#1F3D2E]/10">
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl.startsWith("http") ? profilePictureUrl : `http://localhost:9999${profilePictureUrl}`}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      // Fallback if image fails to load
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span>{initial}</span>
                )}
              </div>

              {!readOnly && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-medium backdrop-blur-[1px]"
                    title="Upload profile picture (Max 2MB, JPEG/PNG/WebP)"
                  >
                    {uploading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Camera size={18} className="mb-0.5" />
                        <span>Change</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
            </div>

            {/* Basic Info */}
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold text-[#1F3D2E] truncate">
                  {fullName || "User Profile"}
                </h1>
                <span
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeClasses(
                    role
                  )}`}
                >
                  {role}
                </span>
                {status && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={12} />
                    {status === "APPROVED" ? "Active Account" : status}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#7A806F]">
                <span className="truncate">{email}</span>
                {phone && (
                  <>
                    <span className="text-[#D9DDCE]">•</span>
                    <span>{phone}</span>
                  </>
                )}
                {lastLogin && (
                  <>
                    <span className="text-[#D9DDCE]">•</span>
                    <span className="inline-flex items-center gap-1 text-[#4D5C4B]">
                      <Clock size={12} />
                      Last login: {formatLastLogin(lastLogin)}
                    </span>
                  </>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-1.5 text-xs text-red-600 pt-1">
                  <AlertCircle size={13} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Security & Quick Action */}
          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setPasswordModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#D9DDCE] bg-white text-xs font-semibold text-[#1F3D2E] hover:bg-[#F8F6F0] hover:border-[#1F3D2E] transition shadow-xs"
            >
              <KeyRound size={15} />
              <span>Change Password</span>
            </button>
          </div>
        </div>

        {/* Metadata Chips (Role specific summary) */}
        {metadataChips && metadataChips.length > 0 && (
          <div className="mt-6 pt-5 border-t border-[#F0F2EB] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {metadataChips.map((chip, idx) => {
              const Icon = chip.icon || Shield;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#F8F6F0]/80 border border-[#EBEFE5]"
                >
                  <div className="p-2 rounded-lg bg-white text-[#1F3D2E] shadow-2xs">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7A806F] truncate">
                      {chip.label}
                    </p>
                    <p className="text-xs font-bold text-[#1F3D2E] truncate">{chip.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
      />
    </>
  );
}

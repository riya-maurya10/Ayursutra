import React, { useState } from "react";
import {
  AlertCircle,
  Building,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  Phone,
  Send,
  Stethoscope,
  User,
  UserCheck,
  X,
} from "lucide-react";
import {
  createStaffInvitation,
} from "../../services/admin/staffInvitationService";
import type {
  Role,
  StaffInvitationResponse,
} from "../../services/admin/staffInvitationService";

interface InviteStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role;
  onSuccess?: () => void;
}

export default function InviteStaffModal({
  isOpen,
  onClose,
  role,
  onSuccess,
}: InviteStaffModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [expiryDays, setExpiryDays] = useState(7);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdInvitation, setCreatedInvitation] =
    useState<StaffInvitationResponse | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    setFullName("");
    setEmail("");
    setPhone("");
    setExpiryDays(7);
    setError("");
    setCreatedInvitation(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    try {
      setLoading(true);
      const res = await createStaffInvitation({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim() || undefined,
        phone: phone.trim() || undefined,
        role,
        expiryDays,
      });

      setCreatedInvitation(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to create invitation. Please verify the email and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (createdInvitation?.invitationLink) {
      navigator.clipboard.writeText(createdInvitation.invitationLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-6 bg-[#F8F6F0] border-b border-stone-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              {role === "DOCTOR" && <Stethoscope className="w-5 h-5" />}
              {role === "THERAPIST" && <UserCheck className="w-5 h-5" />}
              {role === "RECEPTIONIST" && <Building className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">
                Invite New {role.charAt(0) + role.slice(1).toLowerCase()}
              </h3>
              <p className="text-xs text-stone-500">
                Generate an onboarding self-registration invitation link
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {createdInvitation ? (
            /* Success & Copy Link State */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-emerald-950 text-sm">
                  Invitation Created Successfully!
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  Share this unique onboarding link with the candidate. They will fill out their credentials and submit for verification.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                  Self-Registration Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={createdInvitation.invitationLink}
                    className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-stone-50 text-xs text-stone-700 focus:outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium transition ${
                      copied
                        ? "bg-emerald-700 text-white"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 space-y-1">
                <p>
                  <strong>Role:</strong> {createdInvitation.role}
                </p>
                <p>
                  <strong>Invited Email:</strong> {createdInvitation.email}
                </p>
                <p>
                  <strong>Expires:</strong>{" "}
                  {new Date(createdInvitation.expiresAt).toLocaleDateString()}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Invitation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="candidate@example.com"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1">
                  The candidate must use this exact email when completing registration.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Candidate Name (Optional)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Dr. Ananya Sharma"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Invitation Validity Period
                </label>
                <select
                  value={expiryDays}
                  onChange={(e) => setExpiryDays(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                >
                  <option value={3}>3 Days</option>
                  <option value={7}>7 Days (Standard)</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white font-medium text-xs transition flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      Generate Invitation Link
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

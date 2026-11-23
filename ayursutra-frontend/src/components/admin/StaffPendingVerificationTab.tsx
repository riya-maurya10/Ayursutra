import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Stethoscope,
  UserCheck,
  X,
} from "lucide-react";
import {
  approveApplication,
  getPendingApplications,
  rejectApplication,
  resolveDocumentUrl,
} from "../../services/admin/staffInvitationService";
import type {
  Role,
  StaffVerificationApplicationResponse,
} from "../../services/admin/staffInvitationService";

interface StaffPendingVerificationTabProps {
  role?: Role;
  onRefreshParent?: () => void;
}

export default function StaffPendingVerificationTab({
  role,
  onRefreshParent,
}: StaffPendingVerificationTabProps) {
  const [applications, setApplications] = useState<
    StaffVerificationApplicationResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [selectedApp, setSelectedApp] =
    useState<StaffVerificationApplicationResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const fetchPending = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getPendingApplications(role);
      setApplications(data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || "Failed to load pending applications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [role]);

  const filtered = applications.filter((app) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      app.fullName.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      (app.specialization && app.specialization.toLowerCase().includes(q))
    );
  });

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(true);
      setError("");
      const updated = await approveApplication(userId);
      setSuccess(`Application for ${updated.fullName} approved successfully. Workspace access granted.`);
      setSelectedApp(null);
      fetchPending();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to approve application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectReason.trim()) {
      setError("Please provide a reason for rejecting the application.");
      return;
    }
    try {
      setActionLoading(true);
      setError("");
      const updated = await rejectApplication(userId, rejectReason.trim());
      setSuccess(`Application for ${updated.fullName} was rejected.`);
      setSelectedApp(null);
      setShowRejectBox(false);
      setRejectReason("");
      fetchPending();
      if (onRefreshParent) onRefreshParent();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reject application.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Refresh */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search pending applicants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs text-stone-800"
          />
        </div>

        <button
          onClick={fetchPending}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#F2EFE8] text-[11px] uppercase tracking-wider text-[#63744D] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Applicant</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Credentials & Specialization</th>
                <th className="py-3 px-4 font-semibold">Documents</th>
                <th className="py-3 px-4 font-semibold">Submitted</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Checking for pending applications...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-stone-400">
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2 opacity-50" />
                    No applications currently pending verification for this role.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => {
                  const docCount = Object.keys(app.uploadedDocuments || {}).length;
                  return (
                    <tr key={app.userId} className="hover:bg-amber-50/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-900">{app.fullName}</div>
                        <div className="text-[11px] text-stone-500">{app.email}</div>
                        {app.phone && <div className="text-[11px] text-stone-400">{app.phone}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {app.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-stone-800">{app.qualification || "—"}</div>
                        <div className="text-[11px] text-stone-500">
                          {app.specialization || app.address || "—"}
                          {app.medicalRegistrationNumber && ` • Reg: ${app.medicalRegistrationNumber}`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-stone-100 text-stone-700">
                          <FileText className="w-3 h-3 text-emerald-600" />
                          {docCount} docs
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                        {app.registeredAt
                          ? new Date(app.registeredAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "Recently"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setShowRejectBox(false);
                            setRejectReason("");
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium transition shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Review & Verify
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 bg-[#F8F6F0] border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-stone-900">{selectedApp.fullName}</h3>
                <p className="text-xs text-stone-500">
                  Review submitted credentials for {selectedApp.role}
                </p>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-700">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Email</span>
                  <p className="font-semibold text-stone-900 mt-0.5">{selectedApp.email}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Phone</span>
                  <p className="font-semibold text-stone-900 mt-0.5">{selectedApp.phone || "—"}</p>
                </div>
                {selectedApp.address && (
                  <div className="col-span-2">
                    <span className="text-[10px] text-stone-400 uppercase font-semibold">Address</span>
                    <p className="font-medium text-stone-800 mt-0.5">{selectedApp.address}</p>
                  </div>
                )}
              </div>

              {selectedApp.role === "DOCTOR" && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2">
                  <h4 className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                    <Stethoscope className="w-4 h-4 text-blue-700" />
                    Doctor Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-500">Qualification:</span>
                      <p className="font-semibold">{selectedApp.qualification || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500">Specialization:</span>
                      <p className="font-semibold">{selectedApp.specialization || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500">Medical Reg No:</span>
                      <p className="font-semibold">{selectedApp.medicalRegistrationNumber || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500">State Council:</span>
                      <p className="font-semibold">{selectedApp.stateCouncil || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500">Experience:</span>
                      <p className="font-semibold">{selectedApp.experienceYears ?? 0} years</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedApp.role === "THERAPIST" && (
                <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 space-y-2">
                  <h4 className="font-bold text-purple-900 flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-purple-700" />
                    Therapist Qualifications & Skills
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-stone-500">Qualification:</span>
                      <p className="font-semibold">{selectedApp.qualification || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500">Therapist Type:</span>
                      <p className="font-semibold">{selectedApp.therapistType || "General"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500">Experience:</span>
                      <p className="font-semibold">{selectedApp.experienceYears ?? 0} years</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-stone-500">Skills:</span>
                      <p className="font-semibold">
                        {selectedApp.therapySkills && selectedApp.therapySkills.length > 0
                          ? selectedApp.therapySkills.join(", ")
                          : "General"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Documents */}
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block mb-2">
                  Submitted Documents
                </span>
                {selectedApp.uploadedDocuments && Object.keys(selectedApp.uploadedDocuments).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(selectedApp.uploadedDocuments).map(([title, url]) => (
                      <div
                        key={title}
                        className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-stone-400" />
                          <span className="font-medium text-stone-800 text-xs">{title}</span>
                        </div>
                        <a
                          href={resolveDocumentUrl(url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-900 text-white text-[11px] hover:bg-stone-800 font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 italic">No verification documents attached.</p>
                )}
              </div>

              {/* Reject Box */}
              {showRejectBox && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
                  <label className="block text-xs font-bold text-rose-900">
                    Rejection Reason <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejecting the applicant..."
                    className="w-full p-2 rounded-lg border border-rose-300 text-xs bg-white focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-1 rounded-lg border border-stone-300 bg-white text-stone-600 text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedApp.userId)}
                      className="px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {!showRejectBox && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setShowRejectBox(true)}
                    className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-medium"
                  >
                    Reject Application
                  </button>
                )}
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => handleApprove(selectedApp.userId)}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-700/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Activate Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

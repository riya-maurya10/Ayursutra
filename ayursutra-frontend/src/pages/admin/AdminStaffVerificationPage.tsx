import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  Filter,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import { useAuth } from "../../context/AuthContext";
import {
  approveApplication,
  getAllApplications,
  rejectApplication,
  suspendStaff,
  resolveDocumentUrl,
} from "../../services/admin/staffInvitationService";
import type {
  Role,
  StaffVerificationApplicationResponse,
  VerificationStatus,
} from "../../services/admin/staffInvitationService";

export default function AdminStaffVerificationPage() {
  const { user } = useAuth();

  const [applications, setApplications] = useState<StaffVerificationApplicationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Review modal
  const [selectedApp, setSelectedApp] = useState<StaffVerificationApplicationResponse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const roleParam = roleFilter !== "ALL" ? (roleFilter as Role) : undefined;
      const statusParam = statusFilter !== "ALL" ? (statusFilter as VerificationStatus) : undefined;
      const data = await getAllApplications(roleParam, statusParam);
      setApplications(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load staff applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [roleFilter, statusFilter]);

  const filteredApplications = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return applications;

    return applications.filter((app) =>
      [
        app.fullName,
        app.email,
        app.phone,
        app.specialization,
        app.qualification,
        app.medicalRegistrationNumber,
      ]
        .filter(Boolean)
        .some((val) => val!.toLowerCase().includes(q))
    );
  }, [applications, search]);

  const counts = useMemo(() => {
    return {
      pending: applications.filter((a) => a.verificationStatus === "PENDING_VERIFICATION").length,
      approved: applications.filter((a) => a.verificationStatus === "APPROVED").length,
      rejected: applications.filter((a) => a.verificationStatus === "REJECTED").length,
      suspended: applications.filter((a) => a.verificationStatus === "SUSPENDED").length,
      total: applications.length,
    };
  }, [applications]);

  const handleApprove = async (userId: string) => {
    try {
      setActionLoading(true);
      setError("");
      const updated = await approveApplication(userId);
      setSuccess(`Application for ${updated.fullName} has been approved. Staff account is now active.`);
      if (selectedApp?.userId === userId) {
        setSelectedApp(updated);
      }
      fetchApplications();
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
      setShowRejectBox(false);
      setRejectReason("");
      if (selectedApp?.userId === userId) {
        setSelectedApp(updated);
      }
      fetchApplications();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reject application.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async (userId: string) => {
    try {
      setActionLoading(true);
      setError("");
      const updated = await suspendStaff(userId);
      setSuccess(`Staff account for ${updated.fullName} has been suspended.`);
      if (selectedApp?.userId === userId) {
        setSelectedApp(updated);
      }
      fetchApplications();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to suspend staff member.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F6F0]">
      <Sidebar role="ADMIN" />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <Topbar
          title="Staff Verification & Onboarding"
          userName={user?.fullName || "Clinic Administrator"}
          role="ADMIN"
        />

        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto max-w-[1450px]">
            {/* Page Header */}
            <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7C8B82]">
                  Clinical Governance & Staff Verification
                </p>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#26362E]">
                  Staff Verification Center
                </h1>
                <p className="mt-1 text-sm text-[#718078]">
                  Review medical credentials, training certificates, and approve clinic onboarding applications.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={fetchApplications}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#DCD7C9] bg-white text-xs font-semibold text-[#40534C] hover:bg-[#F2EFE8] transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </div>
                <button onClick={() => setSuccess("")} className="text-emerald-500 hover:text-emerald-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div
                onClick={() => setStatusFilter("PENDING_VERIFICATION")}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  statusFilter === "PENDING_VERIFICATION"
                    ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400"
                    : "bg-white border-[#E5E1D7] hover:border-amber-200"
                }`}
              >
                <div className="flex items-center justify-between text-amber-700 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-amber-900">{counts.pending}</div>
                <p className="text-[11px] text-stone-500 mt-1">Awaiting credentials check</p>
              </div>

              <div
                onClick={() => setStatusFilter("APPROVED")}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  statusFilter === "APPROVED"
                    ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400"
                    : "bg-white border-[#E5E1D7] hover:border-emerald-200"
                }`}
              >
                <div className="flex items-center justify-between text-emerald-700 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Approved Staff</span>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-emerald-900">{counts.approved}</div>
                <p className="text-[11px] text-stone-500 mt-1">Active verified workspace access</p>
              </div>

              <div
                onClick={() => setStatusFilter("REJECTED")}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  statusFilter === "REJECTED"
                    ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400"
                    : "bg-white border-[#E5E1D7] hover:border-rose-200"
                }`}
              >
                <div className="flex items-center justify-between text-rose-700 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Rejected</span>
                  <UserX className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-rose-900">{counts.rejected}</div>
                <p className="text-[11px] text-stone-500 mt-1">Ineligible or rejected profiles</p>
              </div>

              <div
                onClick={() => setStatusFilter("ALL")}
                className={`p-4 rounded-2xl border transition cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-stone-100 border-stone-300 ring-2 ring-stone-400"
                    : "bg-white border-[#E5E1D7] hover:border-stone-200"
                }`}
              >
                <div className="flex items-center justify-between text-stone-700 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">All Applications</span>
                  <Filter className="w-4 h-4" />
                </div>
                <div className="text-2xl font-bold text-stone-900">{counts.total}</div>
                <p className="text-[11px] text-stone-500 mt-1">Total applications submitted</p>
              </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="mb-6 rounded-2xl border border-[#E5E1D7] bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by name, email, license..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs text-stone-800"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Role Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-stone-500">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="DOCTOR">Doctors</option>
                    <option value="THERAPIST">Therapists</option>
                    <option value="RECEPTIONIST">Receptionists</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium text-stone-500">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Applications Table */}
            <div className="rounded-2xl border border-[#E5E1D7] bg-white shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-[#F2EFE8] text-[11px] uppercase tracking-wider text-[#63744D] border-b border-[#E5E1D7]">
                    <tr>
                      <th className="py-3.5 px-4 font-semibold">Applicant</th>
                      <th className="py-3.5 px-4 font-semibold">Role</th>
                      <th className="py-3.5 px-4 font-semibold">Credentials & Specialization</th>
                      <th className="py-3.5 px-4 font-semibold">Documents</th>
                      <th className="py-3.5 px-4 font-semibold">Status</th>
                      <th className="py-3.5 px-4 font-semibold">Submission Date</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-400">
                          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Loading applications...
                        </td>
                      </tr>
                    ) : filteredApplications.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-stone-400">
                          No staff applications found matching your criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredApplications.map((app) => {
                        const docsCount = Object.keys(app.uploadedDocuments || {}).length;
                        return (
                          <tr key={app.userId} className="hover:bg-stone-50/80 transition">
                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-stone-900 text-sm">{app.fullName}</div>
                              <div className="text-[11px] text-stone-500">{app.email}</div>
                              <div className="text-[11px] text-stone-400">{app.phone}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                  app.role === "DOCTOR"
                                    ? "bg-blue-100 text-blue-800"
                                    : app.role === "THERAPIST"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-teal-100 text-teal-800"
                                }`}
                              >
                                {app.role === "DOCTOR" && <Stethoscope className="w-3 h-3" />}
                                {app.role === "THERAPIST" && <UserCheck className="w-3 h-3" />}
                                {app.role === "RECEPTIONIST" && <Building className="w-3 h-3" />}
                                {app.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {app.role === "DOCTOR" && (
                                <>
                                  <div className="font-medium text-stone-800">{app.qualification || "—"}</div>
                                  <div className="text-[11px] text-stone-500">
                                    {app.specialization} • Reg #{app.medicalRegistrationNumber}
                                  </div>
                                </>
                              )}
                              {app.role === "THERAPIST" && (
                                <>
                                  <div className="font-medium text-stone-800">{app.qualification || "Therapist"}</div>
                                  <div className="text-[11px] text-stone-500">
                                    {app.therapySkills && app.therapySkills.length > 0
                                      ? app.therapySkills.slice(0, 3).join(", ") + (app.therapySkills.length > 3 ? "..." : "")
                                      : "General Panchakarma"}
                                  </div>
                                </>
                              )}
                              {app.role === "RECEPTIONIST" && (
                                <div className="text-stone-600">{app.address || "Front Desk Staff"}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                  docsCount > 0 ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-400"
                                }`}
                              >
                                <FileText className="w-3 h-3" />
                                {docsCount} uploaded
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                                  app.verificationStatus === "APPROVED"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : app.verificationStatus === "PENDING_VERIFICATION"
                                    ? "bg-amber-100 text-amber-800"
                                    : app.verificationStatus === "REJECTED"
                                    ? "bg-rose-100 text-rose-800"
                                    : "bg-stone-200 text-stone-800"
                                }`}
                              >
                                {app.verificationStatus === "APPROVED" && <CheckCircle className="w-3 h-3" />}
                                {app.verificationStatus === "PENDING_VERIFICATION" && <Clock className="w-3 h-3" />}
                                {app.verificationStatus === "REJECTED" && <ShieldAlert className="w-3 h-3" />}
                                {app.verificationStatus}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                              {app.registeredAt
                                ? new Date(app.registeredAt).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "—"}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedApp(app);
                                  setShowRejectBox(false);
                                  setRejectReason("");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCD7C9] bg-white text-xs font-medium text-[#40534C] hover:bg-[#F2EFE8] transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Review
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
          </div>
        </main>
      </div>

      {/* Review Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-[#F8F6F0] border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  {selectedApp.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{selectedApp.fullName}</h3>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>Role: <strong className="text-emerald-800">{selectedApp.role}</strong></span>
                    <span>•</span>
                    <span>Status: <strong className="text-amber-800">{selectedApp.verificationStatus}</strong></span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-stone-700">
              {/* Personal Info Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Email</span>
                  <p className="font-medium text-stone-900 text-sm mt-0.5">{selectedApp.email}</p>
                </div>
                <div>
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Phone</span>
                  <p className="font-medium text-stone-900 text-sm mt-0.5">{selectedApp.phone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Address</span>
                  <p className="font-medium text-stone-900 text-sm mt-0.5">{selectedApp.address || "—"}</p>
                </div>
              </div>

              {/* Role-Specific Professional Credentials */}
              {selectedApp.role === "DOCTOR" && (
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200 space-y-3">
                  <h4 className="font-semibold text-blue-900 flex items-center gap-1.5 text-xs">
                    <Stethoscope className="w-4 h-4 text-blue-700" />
                    Doctor Professional Credentials
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">Qualification</span>
                      <p className="font-semibold text-stone-900">{selectedApp.qualification || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">Specialization</span>
                      <p className="font-semibold text-stone-900">{selectedApp.specialization || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">License / Reg. Number</span>
                      <p className="font-semibold text-stone-900">{selectedApp.medicalRegistrationNumber || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">State Medical Council</span>
                      <p className="font-semibold text-stone-900">{selectedApp.stateCouncil || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">Experience</span>
                      <p className="font-semibold text-stone-900">{selectedApp.experienceYears ?? 0} years</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedApp.role === "THERAPIST" && (
                <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200 space-y-3">
                  <h4 className="font-semibold text-purple-900 flex items-center gap-1.5 text-xs">
                    <UserCheck className="w-4 h-4 text-purple-700" />
                    Therapist Qualifications & Skills
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">Qualification</span>
                      <p className="font-semibold text-stone-900">{selectedApp.qualification || "—"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">Therapist Type</span>
                      <p className="font-semibold text-stone-900">{selectedApp.therapistType || "General"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">Experience</span>
                      <p className="font-semibold text-stone-900">{selectedApp.experienceYears ?? 0} years</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 uppercase">Certifications</span>
                      <p className="font-semibold text-stone-900">{selectedApp.trainingCertifications || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-stone-500 uppercase">Therapy Skills</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedApp.therapySkills && selectedApp.therapySkills.length > 0 ? (
                          selectedApp.therapySkills.map((sk, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-medium">
                              {sk}
                            </span>
                          ))
                        ) : (
                          <span className="text-stone-400">None specified</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              <div>
                <h4 className="font-semibold text-stone-900 mb-2 flex items-center gap-1.5 text-xs">
                  <FileCheck className="w-4 h-4 text-emerald-700" />
                  Uploaded Verification Documents
                </h4>
                {selectedApp.uploadedDocuments && Object.keys(selectedApp.uploadedDocuments).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(selectedApp.uploadedDocuments).map(([docTitle, docUrl]) => (
                      <div
                        key={docTitle}
                        className="p-3 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-4 h-4 text-stone-400 flex-shrink-0" />
                          <span className="font-medium text-stone-800 truncate text-[11px]">{docTitle}</span>
                        </div>
                        <a
                          href={resolveDocumentUrl(docUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-medium text-[11px] hover:bg-emerald-800 transition flex-shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-stone-400 italic">No verification documents attached.</p>
                )}
              </div>

              {/* Rejection notice if already rejected */}
              {selectedApp.verificationStatus === "REJECTED" && selectedApp.rejectionReason && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  <strong>Rejection Reason:</strong> {selectedApp.rejectionReason}
                </div>
              )}

              {/* Reject Reason Input Area */}
              {showRejectBox && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in">
                  <label className="block text-xs font-semibold text-rose-900">
                    Reason for Rejection <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Provide specific feedback or reason (e.g. Incomplete license documentation or credentials mismatch)..."
                    className="w-full p-2.5 rounded-xl border border-rose-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-600 text-xs hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleReject(selectedApp.userId)}
                      className="px-4 py-1.5 rounded-lg bg-rose-600 text-white font-medium text-xs hover:bg-rose-700 transition"
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Decision Buttons */}
            <div className="p-6 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-600 hover:bg-stone-100"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                {selectedApp.verificationStatus === "APPROVED" ? (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => handleSuspend(selectedApp.userId)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs transition"
                  >
                    Suspend Staff
                  </button>
                ) : (
                  <>
                    {!showRejectBox && (
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => setShowRejectBox(true)}
                        className="px-4 py-2 rounded-xl border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 font-medium text-xs transition"
                      >
                        Reject Application
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => handleApprove(selectedApp.userId)}
                      className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-md shadow-emerald-700/20 flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve & Grant Workspace Access
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

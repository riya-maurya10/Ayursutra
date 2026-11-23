import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Ban,
  Check,
  CheckCircle,
  Clock,
  Copy,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  X,
} from "lucide-react";
import {
  getAllStaffInvitations,
  resendStaffInvitation,
  revokeStaffInvitation,
} from "../../services/admin/staffInvitationService";
import type {
  InvitationStatus,
  Role,
  StaffInvitationResponse,
} from "../../services/admin/staffInvitationService";

interface StaffInvitationsTabProps {
  role?: Role;
  onOpenInviteModal?: () => void;
}

export default function StaffInvitationsTab({
  role,
  onOpenInviteModal,
}: StaffInvitationsTabProps) {
  const [invitations, setInvitations] = useState<StaffInvitationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError("");
      const statusParam =
        statusFilter !== "ALL" ? (statusFilter as InvitationStatus) : undefined;
      const data = await getAllStaffInvitations(role, statusParam);
      setInvitations(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load invitations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [role, statusFilter]);

  const filteredInvitations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invitations;

    return invitations.filter((inv) =>
      [inv.email, inv.fullName, inv.phone]
        .filter(Boolean)
        .some((val) => val!.toLowerCase().includes(q))
    );
  }, [invitations, search]);

  const handleCopy = (id: string, link: string) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleResend = async (id: string) => {
    try {
      setError("");
      await resendStaffInvitation(id);
      setSuccess("Invitation resent successfully with renewed expiration period.");
      fetchInvitations();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend invitation.");
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this invitation?")) return;
    try {
      setError("");
      await revokeStaffInvitation(id);
      setSuccess("Invitation revoked.");
      fetchInvitations();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to revoke invitation.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Alert Messages */}
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

      {/* Controls Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-xs text-stone-800"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-stone-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="EXPIRED">Expired</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>

          <button
            onClick={fetchInvitations}
            className="p-2 rounded-xl border border-stone-300 bg-white text-stone-600 hover:bg-stone-50 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {onOpenInviteModal && (
            <button
              onClick={onOpenInviteModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs transition shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              Send New Invitation
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-[#F2EFE8] text-[11px] uppercase tracking-wider text-[#63744D] border-b border-stone-200">
              <tr>
                <th className="py-3 px-4 font-semibold">Invited Candidate</th>
                <th className="py-3 px-4 font-semibold">Role</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Expiration Date</th>
                <th className="py-3 px-4 font-semibold">Invitation Link</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-400">
                    <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Loading invitations...
                  </td>
                </tr>
              ) : filteredInvitations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-stone-400">
                    No invitations found.
                  </td>
                </tr>
              ) : (
                filteredInvitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-900">{inv.fullName || "Candidate"}</div>
                      <div className="text-[11px] text-stone-500">{inv.email}</div>
                      {inv.phone && <div className="text-[11px] text-stone-400">{inv.phone}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">
                        {inv.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          inv.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : inv.status === "ACCEPTED"
                            ? "bg-emerald-100 text-emerald-800"
                            : inv.status === "EXPIRED"
                            ? "bg-stone-200 text-stone-700"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {inv.status === "PENDING" && <Clock className="w-3 h-3" />}
                        {inv.status === "ACCEPTED" && <Check className="w-3 h-3" />}
                        {inv.status === "REVOKED" && <Ban className="w-3 h-3" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                      {inv.expiresAt
                        ? new Date(inv.expiresAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {inv.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => handleCopy(inv.id, inv.invitationLink)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition ${
                            copiedId === inv.id
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                              : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          {copiedId === inv.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-stone-400" />
                              Copy Link
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="text-stone-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResend(inv.id)}
                              title="Resend / Renew Invitation"
                              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 transition"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevoke(inv.id)}
                              title="Revoke Invitation"
                              className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-600 transition"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {inv.status === "EXPIRED" && (
                          <button
                            type="button"
                            onClick={() => handleResend(inv.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-[11px]"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Re-invite
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

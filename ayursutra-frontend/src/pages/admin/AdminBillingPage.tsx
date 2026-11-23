import { useEffect, useState, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  X,
} from "lucide-react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import apiClient from "../../services/api/client";

interface BillingRecord {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  packageName: string;
  planId?: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: "PAID" | "PARTIALLY_PAID" | "PENDING";
  paymentMethod?: string;
  transactionRef?: string;
  invoiceDate?: string;
  notes?: string;
}

const PRESET_PACKAGES = [
  { name: "7-Day Rejuvenation Panchakarma", amount: 18500 },
  { name: "14-Day Chronic Joint & Spine Detox", amount: 34000 },
  { name: "21-Day Classical Shodhana Panchakarma", amount: 52000 },
  { name: "Single Shirodhara & Abhyanga Session", amount: 4500 },
  { name: "Ayurvedic Diet & Doctor Consultation Package", amount: 2500 },
];

export default function AdminBillingPage() {
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillingRecord | null>(null);

  // Payment recording form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState("UPI");
  const [payTxnRef, setPayTxnRef] = useState("");

  // Create Bill Form
  const [form, setForm] = useState({
    patientName: "",
    patientPhone: "",
    packageName: PRESET_PACKAGES[0].name,
    totalAmount: PRESET_PACKAGES[0].amount,
    discountAmount: 1000,
    paidAmount: 5000,
    paymentMethod: "UPI",
    notes: "Panchakarma admission package",
  });

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/billing");
      setBills(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load billing records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchSearch =
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.packageName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || b.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bills, searchTerm, statusFilter]);

  const totalRevenue = useMemo(() => {
    return bills.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
  }, [bills]);

  const totalReceivables = useMemo(() => {
    return bills.reduce((acc, b) => acc + (b.balanceAmount || 0), 0);
  }, [bills]);

  const handleSelectPackage = (name: string) => {
    const pkg = PRESET_PACKAGES.find((p) => p.name === name);
    if (pkg) {
      setForm((prev) => ({
        ...prev,
        packageName: pkg.name,
        totalAmount: pkg.amount,
      }));
    }
  };

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/billing", {
        ...form,
        patientId: "PAT-" + Math.floor(1000 + Math.random() * 9000),
        taxAmount: Math.round(form.totalAmount * 0.05),
      });
      setShowCreateModal(false);
      fetchBills();
    } catch (err) {
      console.error("Failed to generate bill", err);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    try {
      await apiClient.patch(`/billing/${selectedBill.id}/payment`, {
        paymentAmount: payAmount,
        paymentMethod: payMethod,
        transactionRef: payTxnRef,
      });
      setShowPaymentModal(false);
      fetchBills();
    } catch (err) {
      console.error("Failed to record payment", err);
    }
  };

  const printReceipt = (bill: BillingRecord) => {
    const w = window.open("", "_blank", "width=650,height=750");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Receipt - ${bill.invoiceNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #173d2d; }
            .header { border-bottom: 2px solid #24533f; padding-bottom: 12px; margin-bottom: 16px; }
            .title { font-size: 20px; font-weight: bold; }
            .meta { font-size: 12px; color: #556e5f; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
            th, td { border: 1px solid #d8e2d4; padding: 8px 12px; text-align: left; }
            th { background: #f0f4ee; }
            .total { text-align: right; font-weight: bold; font-size: 15px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">AyurSutra Wellness Hospital</div>
            <div class="meta">Panchakarma Treatment Receipt • ${bill.invoiceNumber}</div>
            <div class="meta">Date: ${bill.invoiceDate || new Date().toISOString().split("T")[0]}</div>
          </div>
          <p><strong>Patient Name:</strong> ${bill.patientName} (${bill.patientPhone || "—"})</p>
          <p><strong>Package:</strong> ${bill.packageName}</p>
          <table>
            <tr><th>Description</th><th>Amount (₹)</th></tr>
            <tr><td>Package Base Cost</td><td>₹${bill.totalAmount.toLocaleString()}</td></tr>
            <tr><td>Package Discount</td><td>- ₹${bill.discountAmount.toLocaleString()}</td></tr>
            <tr><td>Taxes (GST 5%)</td><td>₹${bill.taxAmount.toLocaleString()}</td></tr>
            <tr><td><strong>Total Payable</strong></td><td><strong>₹${bill.finalAmount.toLocaleString()}</strong></td></tr>
            <tr><td>Amount Received</td><td>₹${bill.paidAmount.toLocaleString()}</td></tr>
            <tr><td><strong>Balance Remaining</strong></td><td><strong>₹${bill.balanceAmount.toLocaleString()}</strong></td></tr>
          </table>
          <p><strong>Payment Status:</strong> ${bill.paymentStatus} via ${bill.paymentMethod || "UPI"}</p>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8F5]">
  <Sidebar role="ADMIN" />

  <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
    <Topbar title="Panchakarma Package Billing & Invoicing" />

    <main className="flex-1 p-5 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71834F]">
                Accounts & Package Billing
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-[#173D2D]">
                Billing & Patient Invoices
              </h1>
              <p className="text-xs text-[#6F7D6D] mt-1">
                Manage Panchakarma packages, track advance tokens, and issue GST receipts.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#173D2D] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#25523E] transition"
            >
              <Plus size={16} /> Create New Package Bill
            </button>
          </div>

          {/* METRICS TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#DFE7DD] bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-[#7A8A78]">Total Collected Revenue</span>
              <div className="mt-2 text-2xl font-bold text-[#173D2D]">
                ₹{totalRevenue.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#71834F]">Received across all packages</span>
            </div>

            <div className="rounded-2xl border border-[#FAD7D2] bg-[#FDF4F2] p-5 shadow-sm">
              <span className="text-xs font-medium text-[#963F32]">Pending Receivables</span>
              <div className="mt-2 text-2xl font-bold text-[#8A2B1D]">
                ₹{totalReceivables.toLocaleString()}
              </div>
              <span className="text-[11px] text-[#A64B3B]">Due from active treatments</span>
            </div>

            <div className="rounded-2xl border border-[#DFE7DD] bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-[#7A8A78]">Total Invoices Issued</span>
              <div className="mt-2 text-2xl font-bold text-[#173D2D]">{bills.length}</div>
              <span className="text-[11px] text-[#71834F]">Verified billing accounts</span>
            </div>

            <div className="rounded-2xl border border-[#DFE7DD] bg-white p-5 shadow-sm">
              <span className="text-xs font-medium text-[#7A8A78]">Settled Ratio</span>
              <div className="mt-2 text-2xl font-bold text-[#173D2D]">
                {bills.length > 0
                  ? Math.round((bills.filter((b) => b.paymentStatus === "PAID").length / bills.length) * 100)
                  : 100}
                %
              </div>
              <span className="text-[11px] text-[#71834F]">Fully paid invoices</span>
            </div>
          </div>

          {/* TABLE CONTAINER */}
          <div className="rounded-3xl border border-[#DFE7DD] bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A88]" />
                <input
                  type="text"
                  placeholder="Search invoice number, patient..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-[#D5DDD2] bg-[#FAFBF9] pl-10 pr-4 py-2.5 text-xs text-[#173D2D] outline-none focus:border-[#356B4B]"
                />
              </div>

              <div className="flex gap-2">
                {["ALL", "PAID", "PARTIALLY_PAID", "PENDING"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      statusFilter === st
                        ? "bg-[#173D2D] text-white"
                        : "bg-[#F0F4EE] text-[#556652] hover:bg-[#E3ECE0]"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAEFE8] text-[#7A8A78] uppercase text-[11px] font-semibold">
                    <th className="pb-3 pl-2">Invoice #</th>
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Package Treatment</th>
                    <th className="pb-3">Total (₹)</th>
                    <th className="pb-3">Paid (₹)</th>
                    <th className="pb-3">Balance (₹)</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4EE]">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#7A8A78]">
                        Loading billing records...
                      </td>
                    </tr>
                  ) : filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#7A8A78]">
                        No billing records found.
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-[#FAFBF9] transition">
                        <td className="py-3.5 pl-2 font-mono font-bold text-[#173D2D]">
                          {bill.invoiceNumber}
                        </td>
                        <td className="py-3.5 font-semibold text-[#173D2D]">
                          {bill.patientName}
                          <span className="block text-[10px] font-normal text-[#7A8A78]">
                            {bill.patientPhone || "—"}
                          </span>
                        </td>
                        <td className="py-3.5 text-[#4E5C4B] max-w-xs truncate">
                          {bill.packageName}
                        </td>
                        <td className="py-3.5 font-semibold text-[#173D2D]">
                          ₹{bill.finalAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 font-semibold text-[#2D5A27]">
                          ₹{bill.paidAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5 font-semibold text-[#8A2B1D]">
                          ₹{bill.balanceAmount.toLocaleString()}
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              bill.paymentStatus === "PAID"
                                ? "bg-[#EAF5E9] text-[#24612E]"
                                : bill.paymentStatus === "PARTIALLY_PAID"
                                ? "bg-[#FFF4E5] text-[#9A621E]"
                                : "bg-[#FDF2F0] text-[#B83E2D]"
                            }`}
                          >
                            {bill.paymentStatus === "PAID" && <CheckCircle2 size={11} />}
                            {bill.paymentStatus === "PARTIALLY_PAID" && <Clock size={11} />}
                            {bill.paymentStatus.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 pr-2 text-right space-x-1.5">
                          {bill.balanceAmount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setPayAmount(bill.balanceAmount);
                                setShowPaymentModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#EAF1E7] px-2.5 py-1 text-[11px] font-semibold text-[#356B4B] hover:bg-[#D5E4D1] transition"
                            >
                              <CreditCard size={12} /> Pay
                            </button>
                          )}
                          <button
                            onClick={() => printReceipt(bill)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#D5DDD2] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#556652] hover:bg-[#F3F6F1] transition"
                          >
                            <Printer size={12} /> Receipt
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* CREATE PACKAGE BILL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#D5DDD2] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F6F2] text-[#556353] hover:bg-[#E2E8DE]"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-bold text-[#173D2D] mb-4">Create Panchakarma Package Bill</h3>

            <form onSubmit={handleCreateBill} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Patient Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smt. Meenakshi Sundaram"
                    value={form.patientName}
                    onChange={(e) => setForm({ ...form, patientName: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Patient Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98765 43210"
                    value={form.patientPhone}
                    onChange={(e) => setForm({ ...form, patientPhone: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Panchakarma Package Type</label>
                <select
                  value={form.packageName}
                  onChange={(e) => handleSelectPackage(e.target.value)}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none font-medium"
                >
                  {PRESET_PACKAGES.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} (₹{p.amount.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Base Amount (₹)</label>
                  <input
                    type="number"
                    value={form.totalAmount}
                    onChange={(e) => setForm({ ...form, totalAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Discount (₹)</label>
                  <input
                    type="number"
                    value={form.discountAmount}
                    onChange={(e) => setForm({ ...form, discountAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Advance Paid (₹)</label>
                  <input
                    type="number"
                    value={form.paidAmount}
                    onChange={(e) => setForm({ ...form, paidAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none font-bold text-[#2D5A27]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Payment Method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                >
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="CASH">Cash at Reception Desk</option>
                  <option value="NET_BANKING">Net Banking / NEFT</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Admission Notes</label>
                <input
                  type="text"
                  placeholder="Notes on treatment days, oil charges included..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 rounded-xl bg-[#173D2D] py-3 text-xs font-semibold text-white shadow-md hover:bg-[#23533E] transition"
              >
                Generate Package Invoice
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {showPaymentModal && selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#D5DDD2] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowPaymentModal(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F6F2] text-[#556353] hover:bg-[#E2E8DE]"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-[#173D2D]">Record Package Payment</h3>
            <p className="text-xs text-[#6F7D6D] mt-0.5 mb-4">
              {selectedBill.patientName} • Remaining Due: ₹{selectedBill.balanceAmount.toLocaleString()}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none font-bold text-center text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Payment Mode</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="CARD">Card POS</option>
                  <option value="CASH">Cash Received</option>
                  <option value="NET_BANKING">Net Banking Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Transaction Ref # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. UPI-99882244"
                  value={payTxnRef}
                  onChange={(e) => setPayTxnRef(e.target.value)}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#173D2D] py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#23533E] transition"
              >
                Confirm Payment Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

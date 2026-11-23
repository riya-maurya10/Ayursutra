import { useEffect, useState, useMemo } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Droplet,
  ArrowUpDown,
  CheckCircle2,
  Trash2,
  X
} from "lucide-react";
import Sidebar from "../../components/dashboard/Sidebar";
import Topbar from "../../components/dashboard/Topbar";
import apiClient from "../../services/api/client";

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  unit: string;
  minimumThreshold: number;
  pricePerUnit: number;
  batchNumber?: string;
  expiryDate?: string;
  supplier?: string;
  storageLocation?: string;
}

export default function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [stockDelta, setStockDelta] = useState<number>(0);
  const [stockReason, setStockReason] = useState("Restock shipment");

  // Form State for Add Item
  const [formData, setFormData] = useState({
    name: "",
    category: "MEDICATED_OIL",
    currentStock: 1000,
    unit: "ml",
    minimumThreshold: 200,
    pricePerUnit: 1.5,
    batchNumber: "",
    expiryDate: "",
    supplier: "",
    storageLocation: "Pharmacy Rack A1",
  });

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/inventory");
      setItems(res.data?.data || []);
    } catch (err) {
      console.error("Failed to load inventory items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.supplier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.batchNumber || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "ALL" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategory]);

  const lowStockCount = useMemo(() => {
    return items.filter((item) => item.currentStock <= item.minimumThreshold).length;
  }, [items]);

  const oilsCount = useMemo(() => {
    return items.filter((item) => item.category === "MEDICATED_OIL").length;
  }, [items]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post("/inventory", formData);
      setShowAddModal(false);
      fetchInventory();
      setFormData({
        name: "",
        category: "MEDICATED_OIL",
        currentStock: 1000,
        unit: "ml",
        minimumThreshold: 200,
        pricePerUnit: 1.5,
        batchNumber: "",
        expiryDate: "",
        supplier: "",
        storageLocation: "Pharmacy Rack A1",
      });
    } catch (err) {
      console.error("Failed to create inventory item", err);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      await apiClient.patch(`/inventory/${selectedItem.id}/stock`, {
        changeAmount: stockDelta,
        reason: stockReason,
      });
      setShowStockModal(false);
      fetchInventory();
    } catch (err) {
      console.error("Failed to adjust stock", err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this item from the pharmacy inventory?")) return;
    try {
      await apiClient.delete(`/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      console.error("Failed to delete inventory item", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F6F8F5]">
      <Sidebar role="ADMIN" />
      <div className="flex min-w-0 flex-1 flex-col lg:ml-72">
        <Topbar title="Ayurvedic Pharmacy & Herb Inventory" />

        <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* HEADER BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#71834F]">
                Supply Chain & Pharmacy
              </p>
              <h1 className="text-2xl md:text-3xl font-bold text-[#173D2D]">
                Therapy Oils & Herbal Stock
              </h1>
              <p className="text-xs text-[#6F7D6D] mt-1">
                Monitor medicated oils, decoctions, dry churna scrubs, and Panchakarma consumables.
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 rounded-2xl bg-[#173D2D] px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#25523E] transition"
            >
              <Plus size={16} /> Add New Herb / Oil
            </button>
          </div>

          {/* STATS TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#DFE7DD] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#7A8A78]">Total Inventory Items</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF1E7] text-[#356B4B]">
                  <Package size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-[#173D2D]">{items.length}</div>
              <span className="text-[11px] text-[#71834F]">Across all pharmacy racks</span>
            </div>

            <div className="rounded-2xl border border-[#FAD7D2] bg-[#FDF4F2] p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#963F32]">Low Stock Alerts</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FBE7E4] text-[#B83E2D]">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-[#8A2B1D]">{lowStockCount}</div>
              <span className="text-[11px] text-[#A64B3B]">Below minimum threshold</span>
            </div>

            <div className="rounded-2xl border border-[#DFE7DD] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#7A8A78]">Medicated Oils (Tailas)</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF1E7] text-[#356B4B]">
                  <Droplet size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-[#173D2D]">{oilsCount}</div>
              <span className="text-[11px] text-[#71834F]">Shirodhara & Abhyanga oils</span>
            </div>

            <div className="rounded-2xl border border-[#DFE7DD] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#7A8A78]">Inventory Health</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF1E7] text-[#356B4B]">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="mt-2 text-2xl font-bold text-[#173D2D]">
                {items.length > 0 ? Math.round(((items.length - lowStockCount) / items.length) * 100) : 100}%
              </div>
              <span className="text-[11px] text-[#71834F]">Stocked above safety margin</span>
            </div>
          </div>

          {/* FILTER & SEARCH BAR */}
          <div className="rounded-3xl border border-[#DFE7DD] bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9A88]" />
                <input
                  type="text"
                  placeholder="Search item, batch, or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-[#D5DDD2] bg-[#FAFBF9] pl-10 pr-4 py-2.5 text-xs text-[#173D2D] outline-none focus:border-[#356B4B]"
                />
              </div>

              {/* CATEGORY PILLS */}
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {["ALL", "MEDICATED_OIL", "HERBAL_POWDER", "KWATHA", "GHEE", "CONSUMABLE", "LINEN"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedCategory === cat
                        ? "bg-[#173D2D] text-white shadow-sm"
                        : "bg-[#F0F4EE] text-[#556652] hover:bg-[#E3ECE0]"
                    }`}
                  >
                    {cat.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAEFE8] text-[#7A8A78] uppercase text-[11px] font-semibold">
                    <th className="pb-3 pl-2">Herb / Product</th>
                    <th className="pb-3">Category</th>
                    <th className="pb-3">Current Stock</th>
                    <th className="pb-3">Threshold</th>
                    <th className="pb-3">Batch & Expiry</th>
                    <th className="pb-3">Location</th>
                    <th className="pb-3 pr-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F4EE]">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#7A8A78]">
                        Loading pharmacy inventory...
                      </td>
                    </tr>
                  ) : filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#7A8A78]">
                        No inventory items matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => {
                      const isLow = item.currentStock <= item.minimumThreshold;
                      return (
                        <tr key={item.id} className="hover:bg-[#FAFBF9] transition">
                          <td className="py-3.5 pl-2 font-semibold text-[#173D2D]">
                            {item.name}
                            <span className="block text-[10px] font-normal text-[#7A8A78]">
                              {item.supplier || "In-house Ayurvedic Pharmacy"}
                            </span>
                          </td>
                          <td className="py-3.5">
                            <span className="inline-block rounded-full bg-[#EAF1E7] px-2.5 py-0.5 text-[10px] font-semibold text-[#356B4B]">
                              {item.category.replace("_", " ")}
                            </span>
                          </td>
                          <td className="py-3.5 font-bold">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                                isLow
                                  ? "bg-[#FDF2F0] text-[#B83E2D]"
                                  : "bg-[#F0F7EE] text-[#2D5A27]"
                              }`}
                            >
                              {item.currentStock} {item.unit}
                              {isLow && <AlertTriangle size={12} />}
                            </span>
                          </td>
                          <td className="py-3.5 text-[#6E7B6C]">
                            {item.minimumThreshold} {item.unit}
                          </td>
                          <td className="py-3.5 text-[#6E7B6C]">
                            <span className="font-mono text-[10px]">{item.batchNumber || "—"}</span>
                            <span className="block text-[10px] text-[#8A9A88]">
                              Exp: {item.expiryDate || "—"}
                            </span>
                          </td>
                          <td className="py-3.5 text-[#6E7B6C]">
                            {item.storageLocation || "Main Cabinet"}
                          </td>
                          <td className="py-3.5 pr-2 text-right space-x-1.5">
                            <button
                              onClick={() => {
                                setSelectedItem(item);
                                setStockDelta(100);
                                setShowStockModal(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg bg-[#EAF1E7] px-2.5 py-1 text-[11px] font-semibold text-[#356B4B] hover:bg-[#D5E4D1] transition"
                            >
                              <ArrowUpDown size={12} /> Stock
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="inline-flex items-center justify-center h-6 w-6 rounded-lg text-[#963F32] hover:bg-[#FDF2F0] transition"
                            >
                              <Trash2 size={13} />
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
        </main>
      </div>

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#D5DDD2] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F6F2] text-[#556353] hover:bg-[#E2E8DE]"
            >
              <X size={16} />
            </button>

            <h3 className="text-lg font-bold text-[#173D2D] mb-4">Add Pharmacy Herb / Consumable</h3>

            <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mahanarayana Taila"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 text-[#173D2D] outline-none focus:border-[#356B4B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 text-[#173D2D] outline-none"
                  >
                    <option value="MEDICATED_OIL">Medicated Oil</option>
                    <option value="HERBAL_POWDER">Herbal Powder (Churna)</option>
                    <option value="KWATHA">Decoction (Kwatha)</option>
                    <option value="GHEE">Medicated Ghee</option>
                    <option value="CONSUMABLE">Consumable (Varti, Cotton)</option>
                    <option value="LINEN">Therapy Linen (Droni sheets)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ml, gm, kg, pieces"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Current Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Low Stock Threshold</label>
                  <input
                    type="number"
                    required
                    value={formData.minimumThreshold}
                    onChange={(e) => setFormData({ ...formData, minimumThreshold: parseFloat(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Batch Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MN-2026-X"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#4E5C4B] mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Supplier / Pharmacy Location</label>
                <input
                  type="text"
                  placeholder="e.g. Kottakkal Arya Vaidya Sala • Pharmacy Rack A1"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 rounded-xl bg-[#173D2D] py-3 text-xs font-semibold text-white shadow-md hover:bg-[#23533E] transition"
              >
                Save Herb to Inventory
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {showStockModal && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-[#D5DDD2] bg-white p-6 shadow-2xl">
            <button
              onClick={() => setShowStockModal(false)}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F4F6F2] text-[#556353] hover:bg-[#E2E8DE]"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-bold text-[#173D2D]">Adjust Stock Quantity</h3>
            <p className="text-xs text-[#6F7D6D] mt-0.5 mb-4">
              {selectedItem.name} (Current: {selectedItem.currentStock} {selectedItem.unit})
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Quantity Change (+ to Add, - to Deduct)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={stockDelta}
                  onChange={(e) => setStockDelta(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none font-bold text-center text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#4E5C4B] mb-1">Reason for Adjustment</label>
                <select
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  className="w-full rounded-xl border border-[#D5DDD2] p-2.5 outline-none"
                >
                  <option value="Restock shipment received">Restock shipment received</option>
                  <option value="Session consumption">Session consumption</option>
                  <option value="Damage / Spillage">Damage / Spillage</option>
                  <option value="Annual audit reconciliation">Annual audit reconciliation</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#173D2D] py-2.5 text-xs font-semibold text-white shadow-md hover:bg-[#23533E] transition"
              >
                Apply Stock Update
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

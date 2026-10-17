import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StockItem, MinStockProposal } from '../types/inventory';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Filter,
  Check,
  X,
  TrendingDown,
  Layers,
  ArrowRight,
  Info,
  Building2,
  MapPin,
  Calendar,
  User,
  FileText,
  AlertCircle,
  HelpCircle,
  Package,
} from 'lucide-react';

interface MinStockManagementViewProps {
  onNavigateToLPB?: () => void;
  onNavigateToStockMaster?: () => void;
}

export const MinStockManagementView: React.FC<MinStockManagementViewProps> = ({
  onNavigateToLPB,
  onNavigateToStockMaster,
}) => {
  const {
    currentUser,
    stockItems,
    minStockProposals,
    createMinStockProposal,
    approveMinStockProposal,
    rejectMinStockProposal,
    lowStockItems,
    nearMinStockItems,
  } = useInventory();

  const isAdmin = currentUser?.role === 'admin';

  // Navigation tabs: 'monitor' (Table & Alerts) vs 'proposals' (Proposals & Admin ACC)
  const [activeMainTab, setActiveMainTab] = useState<'monitor' | 'proposals'>('monitor');

  // Filter state for Tab 1 (Monitor)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'SAFE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state for Tab 2 (Proposals)
  const [proposalStatusFilter, setProposalStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');

  // Modal State for New Proposal
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [selectedItemIdForProposal, setSelectedItemIdForProposal] = useState<string>('');
  const [proposedMinStockInput, setProposedMinStockInput] = useState<number>(10);
  const [proposalReasonInput, setProposalReasonInput] = useState<string>('');
  const [proposalError, setProposalError] = useState<string>('');

  // Modal State for Admin Rejection Notes
  const [rejectingProposal, setRejectingProposal] = useState<MinStockProposal | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState('');

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(stockItems.map((i) => i.category));
    return ['ALL', ...Array.from(set)];
  }, [stockItems]);

  // Evaluated stock items with warning level
  const evaluatedItems = useMemo(() => {
    return stockItems.map((item) => {
      const isCritical = item.currentStock <= item.minStock;
      const warningThreshold = item.minStock + Math.max(3, Math.round(item.minStock * 0.35));
      const isWarning = !isCritical && item.currentStock <= warningThreshold;
      const isSafe = !isCritical && !isWarning;
      const deficit = item.currentStock - item.minStock;

      return {
        ...item,
        isCritical,
        isWarning,
        isSafe,
        warningThreshold,
        deficit,
      };
    });
  }, [stockItems]);

  // Filtered items for Monitor Table
  const filteredItems = useMemo(() => {
    return evaluatedItems.filter((item) => {
      // Status filter
      if (statusFilter === 'CRITICAL' && !item.isCritical) return false;
      if (statusFilter === 'WARNING' && !item.isWarning) return false;
      if (statusFilter === 'SAFE' && !item.isSafe) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchName = item.name.toLowerCase().includes(q);
        const matchLoc = (item.location || '').toLowerCase().includes(q);
        return matchSku || matchName || matchLoc;
      }

      return true;
    });
  }, [evaluatedItems, statusFilter, categoryFilter, searchQuery]);

  // Filtered proposals
  const filteredProposals = useMemo(() => {
    return minStockProposals.filter((prop) => {
      if (proposalStatusFilter !== 'ALL' && prop.status !== proposalStatusFilter) return false;
      return true;
    });
  }, [minStockProposals, proposalStatusFilter]);

  // Pending proposals count for badge
  const pendingProposalsCount = useMemo(() => {
    return minStockProposals.filter((p) => p.status === 'PENDING').length;
  }, [minStockProposals]);

  // Handler to open proposal modal for specific item
  const handleOpenProposalForItem = (item: StockItem) => {
    setSelectedItemIdForProposal(item.id);
    setProposedMinStockInput(Math.max(1, Math.round(item.minStock * 1.5)));
    setProposalReasonInput('');
    setProposalError('');
    setIsProposalModalOpen(true);
  };

  // Handler to submit new proposal
  const handleSubmitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemIdForProposal) {
      setProposalError('Silakan pilih item barang terlebih dahulu.');
      return;
    }
    if (proposedMinStockInput <= 0) {
      setProposalError('Batas stok minimal baru harus lebih dari 0.');
      return;
    }
    if (!proposalReasonInput.trim()) {
      setProposalError('Alasan atau justifikasi perubahan stok minimal wajib diisi.');
      return;
    }

    const res = createMinStockProposal({
      itemId: selectedItemIdForProposal,
      proposedMinStock: proposedMinStockInput,
      reason: proposalReasonInput.trim(),
    });

    if (res.success) {
      setIsProposalModalOpen(false);
      setSelectedItemIdForProposal('');
      setProposalReasonInput('');
      setProposalError('');
      setActiveMainTab('proposals'); // Switch to proposals tab to show the new submission
    } else {
      setProposalError(res.error || 'Gagal mengirim pengajuan.');
    }
  };

  // Admin ACC handler
  const handleApproveProposal = (proposalId: string) => {
    if (window.confirm('Setujui pengajuan batas stok minimal ini? Batas stok minimal baru akan langsung berlaku ke sistem.')) {
      approveMinStockProposal(proposalId, 'Disetujui oleh Administrator');
    }
  };

  // Admin Reject confirmation handler
  const handleConfirmReject = () => {
    if (!rejectingProposal) return;
    if (!rejectionNotes.trim()) {
      alert('Mohon cantumkan alasan penolakan agar pemohon memahaminya.');
      return;
    }

    rejectMinStockProposal(rejectingProposal.id, rejectionNotes.trim());
    setRejectingProposal(null);
    setRejectionNotes('');
  };

  const selectedItemObj = stockItems.find((i) => i.id === selectedItemIdForProposal);

  return (
    <div className="space-y-6">
      
      {/* 1. HEADER BANNER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Tabel Batas Stok Minimal &amp; Peringatan Dini
                </h1>
                <span className="hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  Buffer &amp; Safety Stock
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Pantau barang yang mendekati atau melampaui stok minimal. User dapat mengajukan penyesuaian batas minimal yang langsung berlaku saat di-ACC Admin.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              onClick={() => {
                setSelectedItemIdForProposal(stockItems[0]?.id || '');
                setProposedMinStockInput(stockItems[0]?.minStock ? Math.round(stockItems[0].minStock * 1.5) : 10);
                setProposalReasonInput('');
                setProposalError('');
                setIsProposalModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Ajukan Perubahan Stok Minimal</span>
            </button>
          </div>
        </div>

        {/* 2. STAT CARDS / RINGKASAN STOK MINIMAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-100">
          
          {/* Card 1: Total SKU Master */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Master Barang
              </span>
              <span className="text-xl font-black text-slate-900 font-mono">
                {stockItems.length} SKU
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-2xs">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Kritis / Melampaui Batas Min */}
          <button
            onClick={() => {
              setActiveMainTab('monitor');
              setStatusFilter('CRITICAL');
            }}
            className={`rounded-xl p-3.5 border text-left flex items-center justify-between transition-all ${
              statusFilter === 'CRITICAL' && activeMainTab === 'monitor'
                ? 'bg-red-500 text-white border-red-600 shadow-sm'
                : 'bg-red-50 hover:bg-red-100/80 border-red-200 text-red-950'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                statusFilter === 'CRITICAL' && activeMainTab === 'monitor' ? 'text-red-100' : 'text-red-700'
              }`}>
                Melampaui / Kritis (Stok &le; Min)
              </span>
              <span className="text-xl font-black font-mono">
                {lowStockItems.length} Barang
              </span>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-2xs ${
              statusFilter === 'CRITICAL' && activeMainTab === 'monitor'
                ? 'bg-red-600 text-white'
                : 'bg-red-500 text-white'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </button>

          {/* Card 3: Mendekati Batas Min */}
          <button
            onClick={() => {
              setActiveMainTab('monitor');
              setStatusFilter('WARNING');
            }}
            className={`rounded-xl p-3.5 border text-left flex items-center justify-between transition-all ${
              statusFilter === 'WARNING' && activeMainTab === 'monitor'
                ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 hover:bg-amber-100/80 border-amber-200 text-amber-950'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                statusFilter === 'WARNING' && activeMainTab === 'monitor' ? 'text-amber-100' : 'text-amber-800'
              }`}>
                Mendekati Batas Minimal
              </span>
              <span className="text-xl font-black font-mono">
                {nearMinStockItems.length} Barang
              </span>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-2xs ${
              statusFilter === 'WARNING' && activeMainTab === 'monitor'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-500 text-white'
            }`}>
              <TrendingDown className="w-5 h-5" />
            </div>
          </button>

          {/* Card 4: Pengajuan Pending */}
          <button
            onClick={() => {
              setActiveMainTab('proposals');
              setProposalStatusFilter('PENDING');
            }}
            className={`rounded-xl p-3.5 border text-left flex items-center justify-between transition-all ${
              activeMainTab === 'proposals' && proposalStatusFilter === 'PENDING'
                ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                : 'bg-blue-50 hover:bg-blue-100/80 border-blue-200 text-blue-950'
            }`}
          >
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                activeMainTab === 'proposals' && proposalStatusFilter === 'PENDING' ? 'text-blue-100' : 'text-blue-700'
              }`}>
                Pengajuan Menunggu ACC
              </span>
              <span className="text-xl font-black font-mono">
                {pendingProposalsCount} Usulan
              </span>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shadow-2xs ${
              activeMainTab === 'proposals' && proposalStatusFilter === 'PENDING'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-500 text-white'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
          </button>
        </div>
      </div>

      {/* 3. MAIN NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-2xs">
        <button
          onClick={() => setActiveMainTab('monitor')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeMainTab === 'monitor'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Tabel Pantauan Stok Minimal &amp; Peringatan ({stockItems.length})</span>
          {(lowStockItems.length > 0 || nearMinStockItems.length > 0) && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-red-600 text-white">
              {lowStockItems.length + nearMinStockItems.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveMainTab('proposals')}
          className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeMainTab === 'proposals'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-600" />
          <span>Daftar Pengajuan Perubahan Batas ({minStockProposals.length})</span>
          {pendingProposalsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
              {pendingProposalsCount} Menunggu ACC
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: TABEL PANTAUAN STOK MINIMAL & PERINGATAN */}
      {activeMainTab === 'monitor' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
          
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            {/* Alert Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua Barang ({stockItems.length})
              </button>

              <button
                onClick={() => setStatusFilter('CRITICAL')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'CRITICAL'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Melampaui / Kritis ({lowStockItems.length})</span>
              </button>

              <button
                onClick={() => setStatusFilter('WARNING')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'WARNING'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Mendekati Minimal ({nearMinStockItems.length})</span>
              </button>

              <button
                onClick={() => setStatusFilter('SAFE')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'SAFE'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Stok Aman</span>
              </button>
            </div>

            {/* Category Dropdown & Search Input */}
            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'Semua Kategori' : c}
                  </option>
                ))}
              </select>

              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari SKU, nama barang, rak..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                <tr>
                  <th className="px-4 py-3">Barang &amp; SKU</th>
                  <th className="px-4 py-3">Kategori &amp; Rak</th>
                  <th className="px-4 py-3 text-right">Stok Fisik Saat Ini</th>
                  <th className="px-4 py-3 text-right">Batas Stok Minimal</th>
                  <th className="px-4 py-3 text-center">Status Peringatan</th>
                  <th className="px-4 py-3 text-right">Selisih Buffer</th>
                  <th className="px-4 py-3 text-center">Aksi Pengajuan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-medium">
                      Tidak ada data barang yang cocok dengan kriteria filter saat ini.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/70 transition-colors ${
                          item.isCritical
                            ? 'bg-red-50/40'
                            : item.isWarning
                            ? 'bg-amber-50/30'
                            : ''
                        }`}
                      >
                        {/* 1. Item Name & SKU */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="font-mono text-[11px] text-slate-500 font-semibold mt-0.5">
                            {item.sku}
                          </div>
                        </td>

                        {/* 2. Category & Location */}
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-semibold">{item.category}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{item.location || '-'}</span>
                          </div>
                        </td>

                        {/* 3. Current Stock */}
                        <td className="px-4 py-3 text-right font-mono font-black text-sm">
                          <span
                            className={
                              item.isCritical
                                ? 'text-red-700'
                                : item.isWarning
                                ? 'text-amber-700'
                                : 'text-slate-900'
                            }
                          >
                            {item.currentStock.toLocaleString('id-ID')} {item.unit}
                          </span>
                        </td>

                        {/* 4. Min Stock */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800">
                          <span>{item.minStock.toLocaleString('id-ID')} {item.unit}</span>
                        </td>

                        {/* 5. Warning Badge */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {item.isCritical ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-black bg-red-100 text-red-800 border border-red-300 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                              <span>MELAMPAUI / KRITIS</span>
                            </span>
                          ) : item.isWarning ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <TrendingDown className="w-3.5 h-3.5 text-amber-700" />
                              <span>MENDEKATI MINIMAL</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Stok Aman</span>
                            </span>
                          )}
                        </td>

                        {/* 6. Deficit / Buffer */}
                        <td className="px-4 py-3 text-right font-mono font-bold text-xs whitespace-nowrap">
                          {item.deficit < 0 ? (
                            <span className="text-red-600">
                              Kurang {Math.abs(item.deficit)} {item.unit}
                            </span>
                          ) : item.deficit === 0 ? (
                            <span className="text-red-600">
                              Pas Batas Min
                            </span>
                          ) : item.isWarning ? (
                            <span className="text-amber-700">
                              Sisa +{item.deficit} {item.unit}
                            </span>
                          ) : (
                            <span className="text-emerald-700">
                              +{item.deficit} {item.unit} (Aman)
                            </span>
                          )}
                        </td>

                        {/* 7. Action Button */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleOpenProposalForItem(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-colors"
                            title="Ajukan perubahan batas stok minimal baru untuk barang ini"
                          >
                            <Plus className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Ajukan Perubahan</span>
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
      )}

      {/* TAB 2: DAFTAR PENGAJUAN PERUBAHAN BATAS (APPROVAL ADMIN) */}
      {activeMainTab === 'proposals' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
          
          {/* Proposal Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setProposalStatusFilter('ALL')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors ${
                  proposalStatusFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ({minStockProposals.length})
              </button>
              <button
                onClick={() => setProposalStatusFilter('PENDING')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  proposalStatusFilter === 'PENDING'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-2xs'
                    : 'text-amber-800 hover:bg-amber-50'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Menunggu ACC Admin ({pendingProposalsCount})</span>
              </button>
              <button
                onClick={() => setProposalStatusFilter('APPROVED')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  proposalStatusFilter === 'APPROVED'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Disetujui (Berlaku)</span>
              </button>
              <button
                onClick={() => setProposalStatusFilter('REJECTED')}
                className={`px-3 py-1.5 font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  proposalStatusFilter === 'REJECTED'
                    ? 'bg-red-600 text-white shadow-2xs'
                    : 'text-red-700 hover:bg-red-50'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Ditolak</span>
              </button>
            </div>

            <div className="text-xs text-slate-500">
              {isAdmin ? (
                <span className="font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  Anda Login sebagai Admin (Berwenang meng-ACC / Menolak usulan)
                </span>
              ) : (
                <span>Sebagai Staf/User, usulan Anda akan masuk ke antrean ACC Admin.</span>
              )}
            </div>
          </div>

          {/* Proposals List Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10.5px]">
                <tr>
                  <th className="px-4 py-3">No. Pengajuan &amp; Tgl</th>
                  <th className="px-4 py-3">Item Barang</th>
                  <th className="px-4 py-3 text-center">Batas Min Lama &rarr; Usulan Baru</th>
                  <th className="px-4 py-3">Pemohon &amp; Alasan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Persetujuan Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProposals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium">
                      Belum ada pengajuan batas stok minimal dalam status ini.
                    </td>
                  </tr>
                ) : (
                  filteredProposals.map((prop) => {
                    const isPending = prop.status === 'PENDING';
                    const isApproved = prop.status === 'APPROVED';
                    const isRejected = prop.status === 'REJECTED';

                    return (
                      <tr key={prop.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Doc Number & Date */}
                        <td className="px-4 py-3 font-mono">
                          <div className="font-bold text-slate-900">{prop.proposalNumber}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {new Date(prop.requestDate).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        {/* 2. Item */}
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{prop.itemName}</div>
                          <div className="font-mono text-[11px] text-slate-500">{prop.sku}</div>
                        </td>

                        {/* 3. Old vs Proposed */}
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100 rounded-lg font-mono font-bold text-xs">
                            <span className="text-slate-600 line-through">
                              {prop.currentMinStock} {prop.unit}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-emerald-700 text-sm font-black">
                              {prop.proposedMinStock} {prop.unit}
                            </span>
                          </div>
                        </td>

                        {/* 4. Requester & Reason */}
                        <td className="px-4 py-3 max-w-xs">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{prop.requestedBy}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 italic bg-slate-50 p-1.5 rounded-md border border-slate-200">
                            &ldquo;{prop.reason}&rdquo;
                          </div>
                        </td>

                        {/* 5. Status Badge */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Menunggu ACC</span>
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Disetujui (Aktif)</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-red-100 text-red-800 border border-red-300">
                              <X className="w-3 h-3 text-red-600" />
                              <span>Ditolak</span>
                            </span>
                          )}
                        </td>

                        {/* 6. Admin Actions / Review Notes */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isPending ? (
                            isAdmin ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleApproveProposal(prop.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs transition-colors"
                                  title="Setujui pengajuan ini dan langsung terapkan ke master stok sistem"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>ACC / Setujui</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingProposal(prop);
                                    setRejectionNotes('');
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-semibold rounded-lg transition-colors"
                                  title="Tolak pengajuan dengan catatan"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">
                                Menunggu verifikasi admin
                              </span>
                            )
                          ) : isApproved ? (
                            <div className="text-[10.5px] text-emerald-900 font-medium">
                              <div>Di-ACC oleh: <strong>{prop.reviewedByAdmin}</strong></div>
                              <div className="text-[9.5px] text-slate-500">
                                {prop.reviewedAt &&
                                  new Date(prop.reviewedAt).toLocaleDateString('id-ID', {
                                    day: '2-digit',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                              </div>
                            </div>
                          ) : (
                            <div className="text-[10.5px] text-red-900 font-medium max-w-[180px] truncate" title={prop.adminNotes}>
                              <div>Ditolak: {prop.reviewedByAdmin}</div>
                              <div className="text-[9.5px] text-slate-500 italic truncate">
                                Alasan: {prop.adminNotes || '-'}
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: AJUKAN PERUBAHAN BATAS STOK MINIMAL */}
      {isProposalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-2xl border border-slate-200 w-full max-w-lg animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Form Pengajuan Batas Stok Minimal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Batas stok minimal baru akan langsung berlaku di sistem setelah di-ACC oleh Admin.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsProposalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitProposal} className="space-y-4 text-xs">
              
              {/* Item Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Pilih Item Master Barang:
                </label>
                <select
                  value={selectedItemIdForProposal}
                  onChange={(e) => {
                    setSelectedItemIdForProposal(e.target.value);
                    const itm = stockItems.find((i) => i.id === e.target.value);
                    if (itm) {
                      setProposedMinStockInput(Math.max(1, Math.round(itm.minStock * 1.5)));
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">-- Pilih Barang --</option>
                  {stockItems.map((itm) => (
                    <option key={itm.id} value={itm.id}>
                      {itm.sku} - {itm.name} (Min saat ini: {itm.minStock} {itm.unit} | Fisik: {itm.currentStock} {itm.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Status Box if item selected */}
              {selectedItemObj && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Stok Fisik di Rak:</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {selectedItemObj.currentStock} {selectedItemObj.unit}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px] block">Batas Min Saat Ini:</span>
                    <strong className="text-slate-900 font-mono text-sm">
                      {selectedItemObj.minStock} {selectedItemObj.unit}
                    </strong>
                  </div>
                </div>
              )}

              {/* Proposed Min Stock Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Usulan Batas Stok Minimal Baru:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={proposedMinStockInput}
                    onChange={(e) => setProposedMinStockInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-black font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                  />
                  <span className="text-xs font-bold text-slate-700 shrink-0">
                    {selectedItemObj?.unit || 'Unit'}
                  </span>
                </div>
              </div>

              {/* Reason / Justification */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Alasan &amp; Justifikasi Kebutuhan Perubahan:
                </label>
                <textarea
                  rows={3}
                  value={proposalReasonInput}
                  onChange={(e) => setProposalReasonInput(e.target.value)}
                  placeholder="Misal: Lead time pengiriman dari vendor meningkat dari 3 hari menjadi 10 hari; frekuensi pergantian bearing pada line produksi meningkat tajam saat musim giling."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
                />
              </div>

              {/* Error Notice */}
              {proposalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span>{proposalError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProposalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                >
                  Kirim Pengajuan ke Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN REJECTION NOTES */}
      {rejectingProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 w-full max-w-md animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-sm mb-1">
              Tolak Pengajuan Batas Stok Minimal
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Cantumkan alasan penolakan untuk pengajuan #{rejectingProposal.proposalNumber} ({rejectingProposal.itemName}):
            </p>

            <textarea
              rows={3}
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              placeholder="Misal: Kapasitas rak gudang terbatas, atau buffer saat ini masih mencukupi evaluasi historis."
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-hidden"
              autoFocus
            />

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setRejectingProposal(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg border border-slate-200"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Tolak Pengajuan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

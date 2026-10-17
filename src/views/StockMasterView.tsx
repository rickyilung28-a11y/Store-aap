import React, { useState, useMemo } from 'react';
import { StockItem, UserAccount } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import {
  Search,
  Plus,
  Layers,
  AlertTriangle,
  MapPin,
  X,
  ClipboardList,
  Edit,
  Trash2,
  CheckCircle,
  Package,
  RotateCcw,
  Boxes,
  FileSpreadsheet,
  Barcode,
  Printer,
  TrendingDown,
  ShieldAlert,
} from 'lucide-react';
import { ImportStockItemsModal } from '../components/ImportStockItemsModal';
import { ThermalLabelDesignerModal } from '../components/ThermalLabelDesignerModal';

interface StockMasterViewProps {
  currentUser: UserAccount;
  stockItems: StockItem[];
  onAddNewItem: (item: Omit<StockItem, 'id' | 'allocatedStock' | 'updatedAt'>) => void;
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
  onDeleteItem: (id: string) => { success: boolean; error?: string };
  onViewLedgerItem: (sku: string) => void;
  onOpenCreateLPB: () => void;
  onNavigateToLocations?: () => void;
}

export const StockMasterView: React.FC<StockMasterViewProps> = ({
  currentUser,
  stockItems,
  onAddNewItem,
  onUpdateItem,
  onDeleteItem,
  onViewLedgerItem,
  onOpenCreateLPB,
  onNavigateToLocations,
}) => {
  const { storageLocations } = useInventory();
  const isAdmin = currentUser.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals for Excel Import & Thermal Barcode Printing
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBarcodeThermalOpen, setIsBarcodeThermalOpen] = useState(false);
  const [itemsToPrintBarcode, setItemsToPrintBarcode] = useState<StockItem[]>([]);

  // Modal Create State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Sparepart Mesin');
  const [newUnit, setNewUnit] = useState('Pcs');
  const [newLocation, setNewLocation] = useState(storageLocations[0]?.code || 'Rak A-01');
  const [newMinStock, setNewMinStock] = useState<number>(10);
  const [newInitialStock, setNewInitialStock] = useState<number>(20);
  const [newDescription, setNewDescription] = useState('');

  // Modal Edit State
  const [itemToEdit, setItemToEdit] = useState<StockItem | null>(null);
  const [editSku, setEditSku] = useState('');
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editMinStock, setEditMinStock] = useState<number>(10);
  const [editDescription, setEditDescription] = useState('');

  // Delete Confirmation State
  const [itemToDelete, setItemToDelete] = useState<StockItem | null>(null);
  const [deleteError, setDeleteError] = useState('');

  // Extract unique categories
  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(stockItems.map((i) => i.category)))],
    [stockItems]
  );

  // Filtered Items logic
  const filteredItems = useMemo(() => {
    return stockItems.filter((item) => {
      // Category filter
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    });
  }, [stockItems, selectedCategory, searchQuery]);

  // Open Edit Modal
  const handleOpenEdit = (item: StockItem) => {
    setItemToEdit(item);
    setEditSku(item.sku);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditUnit(item.unit);
    setEditLocation(item.location);
    setEditMinStock(item.minStock);
    setEditDescription(item.description || '');
  };

  // Submit Edit Form
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemToEdit || !editName.trim()) return;

    onUpdateItem(itemToEdit.id, {
      sku: editSku.trim().toUpperCase(),
      name: editName.trim(),
      category: editCategory,
      unit: editUnit.trim(),
      location: editLocation.trim(),
      minStock: Number(editMinStock) || 0,
      description: editDescription.trim(),
    });

    setItemToEdit(null);
  };

  // Submit Create Form
  const handleCreateNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName) return;

    onAddNewItem({
      sku: newSku.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      unit: newUnit,
      location: newLocation.trim(),
      minStock: Number(newMinStock) || 0,
      currentStock: Number(newInitialStock) || 0,
      description: newDescription.trim(),
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewSku('');
    setNewName('');
    setNewDescription('');
    setNewInitialStock(20);
    setNewMinStock(10);
  };

  // Confirm Delete Item
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    setDeleteError('');
    const res = onDeleteItem(itemToDelete.id);
    if (!res.success) {
      setDeleteError(res.error || 'Gagal menghapus barang.');
    } else {
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Katalog Master Inventaris Gudang</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Master Data Stok Barang & Posisi Rak
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Kelola penambahan SKU baru, edit spesifikasi & batas safety stock, serta pantau ketersediaan fisik barang secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Clabel Thermal Barcode Print Button */}
            <button
              onClick={() => {
                setItemsToPrintBarcode(filteredItems);
                setIsBarcodeThermalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
              title="Cetak barcode stiker thermal untuk item barang ke printer Clabel"
            >
              <Barcode className="w-4 h-4 text-slate-950" />
              <span>Cetak Barcode (Clabel)</span>
            </button>

            {/* Import Items via Excel Button */}
            {isAdmin && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
                title="Impor daftar barang baru dari file Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Import Excel</span>
              </button>
            )}

            {/* Manage Storage Locations shortcut */}
            {onNavigateToLocations && (
              <button
                onClick={onNavigateToLocations}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
                title="Buka menu manajemen lokasi dan rak penyimpanan"
              >
                <MapPin className="w-4 h-4 text-slate-500" />
                <span>Lokasi Rak ({storageLocations.length})</span>
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={onOpenCreateLPB}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
                >
                  <Package className="w-4 h-4 text-emerald-600" />
                  <span>Input SJ Masuk (LPB)</span>
                </button>

                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>+ Tambah Barang Baru</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filter & Search Bar (Slider Removed) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'ALL' ? 'Semua Kategori' : cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari SKU, nama barang, lokasi rak..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white focus:outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Items Presentation */}
      {/* 1. Desktop Tabular Grid (Hidden on Mobile) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Kode SKU</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3 text-center">Lokasi Rak</th>
                <th className="px-4 py-3 text-right">Stok Fisik di Rak</th>
                <th className="px-4 py-3 text-right">Dialokasikan (Pending)</th>
                <th className="px-4 py-3 text-right">Stok Siap Diambil</th>
                <th className="px-4 py-3 text-center">Stok Minimum</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    Tidak ada barang yang cocok dengan kriteria filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const available = item.currentStock - item.allocatedStock;
                  const isLow = item.currentStock <= item.minStock;
                  const isOutOfStock = available <= 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.location}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {item.currentStock.toLocaleString('id-ID')} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-amber-700 tabular-nums">
                        {item.allocatedStock > 0 ? `${item.allocatedStock} ${item.unit}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                        <span
                          className={
                            available > item.minStock
                              ? 'text-emerald-700'
                              : available > 0
                              ? 'text-amber-700'
                              : 'text-red-600'
                          }
                        >
                          {available.toLocaleString('id-ID')} {item.unit}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-500 tabular-nums">
                        {item.minStock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-black bg-red-100 text-red-800 border border-red-300">
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            <span>Habis</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
                            <ShieldAlert className="w-3 h-3 text-red-600" />
                            <span>&le; Batas Min</span>
                          </span>
                        ) : item.currentStock <= item.minStock + Math.max(3, Math.round(item.minStock * 0.35)) ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                            <TrendingDown className="w-3 h-3 text-amber-700" />
                            <span>Mendekati Min</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-emerald-100 text-emerald-800">
                            <span>Aman</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Cetak Barcode Stiker Thermal Clabel */}
                          <button
                            onClick={() => {
                              setItemsToPrintBarcode([item]);
                              setIsBarcodeThermalOpen(true);
                            }}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                            title="Cetak Barcode Stiker Clabel"
                          >
                            <Barcode className="w-4 h-4" />
                          </button>

                          {/* Mutasi Ledger */}
                          <button
                            onClick={() => onViewLedgerItem(item.sku)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                            title="Kartu Stok Mutasi"
                          >
                            <ClipboardList className="w-4 h-4" />
                          </button>

                          {/* Admin Edit */}
                          {isAdmin && (
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Data Barang & Safety Stock"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Admin Delete */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setItemToDelete(item);
                                setDeleteError('');
                              }}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              title="Hapus SKU Barang"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Mobile Card List (Optimized for Phones & Tablets, md:hidden) */}
      <div className="md:hidden space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Tidak ada barang yang cocok dengan filter atau pencarian.
          </div>
        ) : (
          filteredItems.map((item) => {
            const available = item.currentStock - item.allocatedStock;
            const isLow = item.currentStock <= item.minStock;
            const isOutOfStock = available <= 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3"
              >
                {/* Top Row: SKU, Category & Status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs bg-slate-100 text-slate-900 px-2 py-0.5 rounded">
                        {item.sku}
                      </span>
                      <span className="text-[11px] text-slate-500">{item.category}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">{item.name}</h3>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    {isOutOfStock ? (
                      <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Habis
                      </span>
                    ) : isLow ? (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Menipis
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Aman
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle Grid: Stock Quantities */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500">Stok Fisik</div>
                    <div className="font-mono font-bold text-slate-900 mt-0.5">
                      {item.currentStock} {item.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-amber-700">Dialokasikan</div>
                    <div className="font-mono font-semibold text-amber-800 mt-0.5">
                      {item.allocatedStock > 0 ? `${item.allocatedStock} ${item.unit}` : '0'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-emerald-700">Siap Diambil</div>
                    <div
                      className={`font-mono font-bold mt-0.5 ${
                        available > item.minStock
                          ? 'text-emerald-700'
                          : available > 0
                          ? 'text-amber-700'
                          : 'text-red-600'
                      }`}
                    >
                      {available} {item.unit}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold">Stok Minimum</div>
                    <div className="font-mono font-bold text-slate-800 mt-0.5">
                      {item.minStock} {item.unit}
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Location & Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="text-slate-600 font-mono flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {item.location}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onViewLedgerItem(item.sku)}
                      className="px-2.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1"
                    >
                      <ClipboardList className="w-3.5 h-3.5 text-slate-500" />
                      <span>Kartu Stok</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-[11px] font-medium flex items-center gap-1"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-600" />
                        <span>Edit</span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setItemToDelete(item);
                          setDeleteError('');
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        title="Hapus barang"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* MODAL 1: Tambah Master SKU Baru (Create) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-emerald-400" />
                <h2 className="text-base font-semibold">Tambah SKU Master Barang Baru</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewItem} className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                    placeholder="Contoh: BRG-007"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Barang
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden bg-white"
                  >
                    <option value="Sparepart Mesin">Sparepart Mesin</option>
                    <option value="Bahan Kimia & Pelumas">Bahan Kimia & Pelumas</option>
                    <option value="Peralatan Workshop">Peralatan Workshop</option>
                    <option value="Komponen Elektrikal">Komponen Elektrikal</option>
                    <option value="Kemasan & Logistik">Kemasan & Logistik</option>
                    <option value="Peralatan Keselamatan (APD)">Peralatan Keselamatan (APD)</option>
                    <option value="Umum & Konsumsi Gudang">Umum & Konsumsi Gudang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Barang Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Seal O-Ring Viton 40mm High Temp"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan Pengukuran (Unit)
                  </label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="Pcs, Unit, Box, Liter..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lokasi Rak Penyimpanan
                  </label>
                  <select
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  >
                    {storageLocations.map((loc) => (
                      <option key={loc.id} value={loc.code}>
                        {loc.code} - {loc.name}
                      </option>
                    ))}
                    {!storageLocations.some((l) => l.code === newLocation) && (
                      <option value={newLocation}>{newLocation} (Kustom)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Exact Numerical Inputs (No Sliders) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Safety Stock (Batas Min)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newMinStock}
                    onChange={(e) => setNewMinStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Peringatan stok menipis ({newUnit})
                  </p>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Saldo Stok Awal Fisik
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Jumlah fisik terdaftar ({newUnit})
                  </p>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Spesifikasi Tambahan
                </label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Keterangan spesifikasi teknis atau nomor part manufaktur..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  Simpan SKU Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Master SKU Barang (Update) */}
      {itemToEdit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-semibold">
                  Edit Data Master Barang ({itemToEdit.sku})
                </h2>
              </div>
              <button
                onClick={() => setItemToEdit(null)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Barang
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden bg-white"
                  >
                    <option value="Sparepart Mesin">Sparepart Mesin</option>
                    <option value="Bahan Kimia & Pelumas">Bahan Kimia & Pelumas</option>
                    <option value="Peralatan Workshop">Peralatan Workshop</option>
                    <option value="Komponen Elektrikal">Komponen Elektrikal</option>
                    <option value="Kemasan & Logistik">Kemasan & Logistik</option>
                    <option value="Peralatan Keselamatan (APD)">Peralatan Keselamatan (APD)</option>
                    <option value="Umum & Konsumsi Gudang">Umum & Konsumsi Gudang</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Satuan Pengukuran (Unit)
                  </label>
                  <input
                    type="text"
                    required
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lokasi Rak Penyimpanan
                  </label>
                  <select
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                  >
                    {storageLocations.map((loc) => (
                      <option key={loc.id} value={loc.code}>
                        {loc.code} - {loc.name}
                      </option>
                    ))}
                    {!storageLocations.some((l) => l.code === editLocation) && (
                      <option value={editLocation}>{editLocation} (Kustom)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Exact Numerical Input for Edit (No Slider) */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label className="block font-semibold text-slate-700 mb-1">
                  Safety Stock (Batas Minimum Stok)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold text-xs bg-white focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
                <p className="text-[10.5px] text-slate-500 mt-1">
                  Batas ambang peringatan ketika stok barang menipis ({editUnit}).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi / Catatan Barang
                </label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setItemToEdit(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Konfirmasi Hapus Barang (Delete) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 text-center">
              Hapus SKU Barang "{itemToDelete.name}"?
            </h3>
            <p className="text-xs text-slate-600 text-center mt-2 leading-relaxed">
              Anda akan menghapus SKU <strong className="font-mono">{itemToDelete.sku}</strong> dari katalog master.
              {itemToDelete.currentStock > 0 && (
                <span className="block text-amber-700 font-semibold mt-1">
                  Catatan: Barang ini masih memiliki saldo fisik sebanyak {itemToDelete.currentStock} {itemToDelete.unit}.
                </span>
              )}
            </p>

            {deleteError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
              >
                Batalkan
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
              >
                Ya, Hapus Barang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Import Excel Barang Master */}
      {isImportModalOpen && (
        <ImportStockItemsModal onClose={() => setIsImportModalOpen(false)} />
      )}

      {/* Modal Desainer & Cetak Barcode Stiker Thermal Clabel (Dengan Simpan Template & Ukuran Kertas) */}
      {isBarcodeThermalOpen && (
        <ThermalLabelDesignerModal
          items={itemsToPrintBarcode}
          initialMode="items"
          onClose={() => {
            setIsBarcodeThermalOpen(false);
            setItemsToPrintBarcode([]);
          }}
        />
      )}
    </div>
  );
};

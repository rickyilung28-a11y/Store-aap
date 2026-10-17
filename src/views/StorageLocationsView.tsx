import React, { useState, useMemo } from 'react';
import { useInventory } from '../context/InventoryContext';
import { StorageLocation } from '../types/inventory';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Search,
  Layers,
  Package,
  AlertTriangle,
  X,
  CheckCircle2,
  Boxes,
  Info,
  Barcode,
  Printer,
} from 'lucide-react';
import { ThermalLabelDesignerModal } from '../components/ThermalLabelDesignerModal';

interface StorageLocationsViewProps {
  onSelectRackForFilter?: (rackCode: string) => void;
}

export const StorageLocationsView: React.FC<StorageLocationsViewProps> = ({
  onSelectRackForFilter,
}) => {
  const {
    currentUser,
    stockItems,
    storageLocations,
    addStorageLocation,
    updateStorageLocation,
    deleteStorageLocation,
  } = useInventory();

  const isAdmin = currentUser?.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('ALL');

  // Barcode Printing State
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [barcodePreselectedId, setBarcodePreselectedId] = useState<string | undefined>(undefined);

  // Modal Create
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formZone, setFormZone] = useState('Zona A - Sparepart Mesin');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');

  // Modal Edit
  const [editingLocation, setEditingLocation] = useState<StorageLocation | null>(null);

  // Extract unique zones
  const zones = useMemo(() => {
    const list = storageLocations.map((s) => s.zone || 'Zona Umum').filter(Boolean);
    return ['ALL', ...Array.from(new Set(list))];
  }, [storageLocations]);

  // Compute item count per rack
  const itemCountPerRack = useMemo(() => {
    const map = new Map<string, number>();
    stockItems.forEach((item) => {
      const locKey = item.location.trim().toLowerCase();
      map.set(locKey, (map.get(locKey) || 0) + 1);
    });
    return map;
  }, [stockItems]);

  const getRackItemCount = (loc: StorageLocation) => {
    const c1 = itemCountPerRack.get(loc.code.toLowerCase()) || 0;
    const c2 = itemCountPerRack.get(loc.name.toLowerCase()) || 0;
    return Math.max(c1, c2);
  };

  const filteredLocations = useMemo(() => {
    return storageLocations.filter((loc) => {
      if (selectedZone !== 'ALL' && (loc.zone || 'Zona Umum') !== selectedZone) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        loc.code.toLowerCase().includes(q) ||
        loc.name.toLowerCase().includes(q) ||
        (loc.zone && loc.zone.toLowerCase().includes(q)) ||
        (loc.description && loc.description.toLowerCase().includes(q))
      );
    });
  }, [storageLocations, selectedZone, searchQuery]);

  const handleOpenAdd = () => {
    setFormCode('');
    setFormName('');
    setFormZone('Zona A - Sparepart Mesin');
    setFormDesc('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const res = addStorageLocation({
      code: formCode,
      name: formName,
      zone: formZone,
      description: formDesc,
    });

    if (res.success) {
      setIsAddModalOpen(false);
    } else {
      setFormError(res.error || 'Gagal menambahkan lokasi penyimpanan.');
    }
  };

  const handleOpenEdit = (loc: StorageLocation) => {
    setEditingLocation(loc);
    setFormCode(loc.code);
    setFormName(loc.name);
    setFormZone(loc.zone || 'Zona A - Sparepart Mesin');
    setFormDesc(loc.description || '');
    setFormError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;
    setFormError('');

    const res = updateStorageLocation(editingLocation.id, {
      code: formCode,
      name: formName,
      zone: formZone,
      description: formDesc,
    });

    if (res.success) {
      setEditingLocation(null);
    } else {
      setFormError(res.error || 'Gagal memperbarui lokasi penyimpanan.');
    }
  };

  const handleDelete = (loc: StorageLocation) => {
    const itemsCount = getRackItemCount(loc);
    if (itemsCount > 0) {
      alert(
        `Lokasi "${loc.code}" tidak dapat dihapus karena saat ini terdapat ${itemsCount} macam barang yang tersimpan di rak ini.`
      );
      return;
    }

    if (window.confirm(`Hapus rak / lokasi penyimpanan "${loc.code} - ${loc.name}"?`)) {
      const res = deleteStorageLocation(loc.id);
      if (!res.success) {
        alert(res.error || 'Gagal menghapus lokasi penyimpanan.');
      }
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Manajemen Lokasi &amp; Rak Penyimpanan Gudang
            </h2>
            <p className="text-xs text-slate-500">
              Daftar rak penyimpanan resmi yang dapat dipilih saat penambahan barang baru &amp; penerimaan barang (LPB)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setBarcodePreselectedId(undefined);
              setIsBarcodeModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-xs"
            title="Cetak label barcode stiker rak untuk printer thermal Clabel"
          >
            <Barcode className="w-4 h-4 text-slate-950" />
            <span>Cetak Barcode Rak (Clabel)</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ Tambah Lokasi / Rak Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Zone Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <span className="font-semibold text-slate-500 mr-1 shrink-0">Filter Zona:</span>
          {zones.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                selectedZone === z
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {z === 'ALL' ? 'Semua Zona' : z}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kode rak, nama, atau zona..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* Table / Cards of Storage Locations */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3 w-32">Kode Rak</th>
                <th className="px-4 py-3">Nama Lokasi / Rak</th>
                <th className="px-4 py-3">Zona Wilayah</th>
                <th className="px-4 py-3 hidden md:table-cell">Keterangan / Spesifikasi</th>
                <th className="px-4 py-3 text-center w-32">Barang Tersimpan</th>
                {isAdmin && <th className="px-4 py-3 text-right w-24">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada lokasi rak yang sesuai dengan pencarian "{searchQuery}".
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => {
                  const itemCount = getRackItemCount(loc);
                  return (
                    <tr key={loc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 rounded text-slate-900 border border-slate-200">
                          {loc.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {loc.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {loc.zone || 'Zona Umum'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {loc.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            itemCount > 0
                              ? 'bg-blue-100 text-blue-900'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Boxes className="w-3 h-3" />
                          <span>{itemCount} Item</span>
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setBarcodePreselectedId(loc.id);
                                setIsBarcodeModalOpen(true);
                              }}
                              className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Cetak Barcode Stiker untuk Rak ini (Clabel)"
                            >
                              <Barcode className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(loc)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Rak"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(loc)}
                              disabled={itemCount > 0}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              title={
                                itemCount > 0
                                  ? 'Tidak dapat dihapus karena ada barang tersimpan'
                                  : 'Hapus Rak'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Storage Location */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">Tambah Lokasi / Rak Baru</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode / Nomor Rak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder="Contoh: Rak A-03 atau PALLET-03"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-slate-900 focus:outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lokasi / Rak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Contoh: Rak A-03 (Kompresor & Selang Angin)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Zona / Area Wilayah Gudang
                </label>
                <input
                  type="text"
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  placeholder="Contoh: Zona A - Sparepart Mesin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan / Posisi Fisik (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Contoh: Baris ketiga dekat pintu keluar timur"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Simpan Rak Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Storage Location */}
      {editingLocation && (
        <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm sm:text-base">Edit Lokasi / Rak Penyimpanan</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingLocation(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 font-medium">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode / Nomor Rak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:ring-1 focus:ring-slate-900 focus:outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lokasi / Rak <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Zona / Area Wilayah Gudang
                </label>
                <input
                  type="text"
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keterangan / Posisi Fisik
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLocation(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cetak Barcode Stiker Thermal Rak (Clabel & Saved Templates) */}
      {isBarcodeModalOpen && (
        <ThermalLabelDesignerModal
          locations={
            barcodePreselectedId
              ? storageLocations.filter((l) => l.id === barcodePreselectedId)
              : storageLocations
          }
          initialMode="locations"
          onClose={() => {
            setIsBarcodeModalOpen(false);
            setBarcodePreselectedId(undefined);
          }}
        />
      )}
    </div>
  );
};

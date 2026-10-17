import React, { useState } from 'react';
import { useInventory } from '../context/InventoryContext';
import { CostCenterEntry, GLAccountEntry } from '../types/inventory';
import {
  Building2,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  ArrowRight,
  Info,
  FileSpreadsheet,
} from 'lucide-react';
import { ImportExcelModal } from '../components/ImportExcelModal';

export const CostCenterGLView: React.FC = () => {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const {
    currentUser,
    costCenters,
    glAccounts,
    addCostCenter,
    updateCostCenter,
    deleteCostCenter,
    addGLAccount,
    updateGLAccount,
    deleteGLAccount,
  } = useInventory();

  const [activeTab, setActiveTab] = useState<'cost-centers' | 'gl-accounts'>('cost-centers');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    type: 'CC' | 'GL';
    oldCode: string;
    code: string;
    name: string;
    description: string;
  } | null>(null);

  // Form state for add
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formError, setFormError] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // Filtered lists
  const filteredCostCenters = costCenters.filter(
    (c) =>
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredGLAccounts = glAccounts.filter(
    (g) =>
      g.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description && g.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setFormCode('');
    setFormName('');
    setFormDesc('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (activeTab === 'cost-centers') {
      const res = addCostCenter({
        code: formCode,
        name: formName,
        description: formDesc,
      });
      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setFormError(res.error || 'Gagal menambahkan Cost Center.');
      }
    } else {
      const res = addGLAccount({
        code: formCode,
        name: formName,
        description: formDesc,
      });
      if (res.success) {
        setIsAddModalOpen(false);
      } else {
        setFormError(res.error || 'Gagal menambahkan GL Account.');
      }
    }
  };

  const handleOpenEdit = (type: 'CC' | 'GL', item: CostCenterEntry | GLAccountEntry) => {
    setEditingItem({
      type,
      oldCode: item.code,
      code: item.code,
      name: item.name,
      description: item.description || '',
    });
    setFormError('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setFormError('');

    if (editingItem.type === 'CC') {
      const res = updateCostCenter(editingItem.oldCode, {
        code: editingItem.code,
        name: editingItem.name,
        description: editingItem.description,
      });
      if (res.success) {
        setEditingItem(null);
      } else {
        setFormError(res.error || 'Gagal memperbarui Cost Center.');
      }
    } else {
      const res = updateGLAccount(editingItem.oldCode, {
        code: editingItem.code,
        name: editingItem.name,
        description: editingItem.description,
      });
      if (res.success) {
        setEditingItem(null);
      } else {
        setFormError(res.error || 'Gagal memperbarui GL Account.');
      }
    }
  };

  const handleDelete = (type: 'CC' | 'GL', code: string, name: string) => {
    if (window.confirm(`Hapus ${type === 'CC' ? 'Cost Center' : 'GL Account'} "${code} - ${name}"?`)) {
      if (type === 'CC') {
        deleteCostCenter(code);
      } else {
        deleteGLAccount(code);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Master Cost Center & GL Account
              </h1>
              <p className="text-xs text-slate-500">
                Pusat Biaya & Nomor Perkiraan Akuntansi untuk Nota Pengambilan Barang (SIV)
              </p>
            </div>
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors shadow-2xs"
                title="Impor daftar Cost Center dan GL Account dari file Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Import Excel</span>
              </button>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>
                  Tambah {activeTab === 'cost-centers' ? 'Cost Center Baru' : 'GL Account Baru'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Info Callout */}
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Daftar Cost Center dan GL Account ini akan tampil sebagai pilihan dropdown (lengkap dengan nomor dan keterangannya) saat staf mengisi formulir pengajuan Nota Pengambilan Barang. Pada hasil cetak dan ekspor dokumen PDF, <strong>hanya nomor kodenya saja</strong> yang dicetak di kolom tabel sesuai format blanko fisik resmi.
          </p>
        </div>

        {/* Tab & Search Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('cost-centers')}
              className={`px-3.5 py-1.5 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'cost-centers'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cost Center ({costCenters.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('gl-accounts')}
              className={`px-3.5 py-1.5 font-medium rounded-md transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'gl-accounts'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>GL Account ({glAccounts.length})</span>
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari ${activeTab === 'cost-centers' ? 'kode / divisi...' : 'nomor / akun...'}`}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {activeTab === 'cost-centers' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-28">Nomor / Kode</th>
                  <th className="px-4 py-3">Nama Divisi / Cost Center</th>
                  <th className="px-4 py-3 hidden md:table-cell">Keterangan Pemakaian</th>
                  {isAdmin && <th className="px-4 py-3 text-right w-28">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCostCenters.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada Cost Center yang cocok dengan pencarian "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredCostCenters.map((cc) => (
                    <tr key={cc.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 rounded text-slate-800 border border-slate-200">
                          {cc.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {cc.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {cc.description || '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit('CC', cc)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Cost Center"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete('CC', cc.code, cc.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Cost Center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3 w-32">Nomor GL Account</th>
                  <th className="px-4 py-3">Nama Akun / Klasifikasi Biaya</th>
                  <th className="px-4 py-3 hidden md:table-cell">Keterangan Alokasi</th>
                  {isAdmin && <th className="px-4 py-3 text-right w-28">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGLAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 4 : 3} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada GL Account yang cocok dengan pencarian "{searchQuery}".
                    </td>
                  </tr>
                ) : (
                  filteredGLAccounts.map((gl) => (
                    <tr key={gl.code} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-900 rounded border border-blue-200">
                          {gl.code}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {gl.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                        {gl.description || '-'}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenEdit('GL', gl)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit GL Account"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete('GL', gl.code, gl.name)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus GL Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Add */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <h3 className="font-semibold text-sm">
                  Tambah {activeTab === 'cost-centers' ? 'Cost Center' : 'GL Account'} Baru
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  {activeTab === 'cost-centers' ? 'Nomor / Kode Cost Center' : 'Nomor GL Account'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  placeholder={activeTab === 'cost-centers' ? 'Misal: 60, 10, CC-05' : 'Misal: 51010, 51020'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Nomor ini yang akan tampil di kolom tabel cetak PDF.
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama / Keterangan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={activeTab === 'cost-centers' ? 'Misal: Bagging Plant 2 & Pemuatan' : 'Misal: Biaya Sparepart Mesin'}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Deskripsi Alokasi (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Catatan tambahan alokasi..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editingItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4">
            <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <h3 className="font-semibold text-sm">
                  Edit {editingItem.type === 'CC' ? 'Cost Center' : 'GL Account'}
                </h3>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nomor / Kode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.code}
                  onChange={(e) => setEditingItem({ ...editingItem, code: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama / Keterangan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Deskripsi Alokasi
                </label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  Perbarui Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel Cost Center & GL Account */}
      {isImportModalOpen && (
        <ImportExcelModal
          initialTarget={activeTab === 'cost-centers' ? 'cost-centers' : 'gl-accounts'}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
};

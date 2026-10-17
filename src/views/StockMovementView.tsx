import React, { useState } from 'react';
import { StockMovement, StockItem } from '../types/inventory';
import {
  ClipboardList,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  Filter,
  FileText,
} from 'lucide-react';
import { PrintStockLedgerModal } from '../components/PrintStockLedgerModal';

interface StockMovementViewProps {
  stockMovements: StockMovement[];
  stockItems: StockItem[];
  preselectedSku?: string;
}

export const StockMovementView: React.FC<StockMovementViewProps> = ({
  stockMovements,
  stockItems,
  preselectedSku = '',
}) => {
  const [selectedSku, setSelectedSku] = useState(preselectedSku);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const filteredMovements = stockMovements.filter((mov) => {
    if (selectedSku && mov.sku !== selectedSku) return false;
    if (typeFilter !== 'ALL' && mov.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        mov.sku.toLowerCase().includes(q) ||
        mov.itemName.toLowerCase().includes(q) ||
        mov.referenceNumber.toLowerCase().includes(q) ||
        (mov.secondaryRef && mov.secondaryRef.toLowerCase().includes(q)) ||
        mov.actor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return iso;
    }
  };

  const exportCSV = () => {
    const headers = ['Waktu', 'Kode SKU', 'Nama Barang', 'Tipe', 'Referensi', 'Pihak Terkait', 'Qty', 'Saldo Awal', 'Saldo Akhir', 'Petugas', 'Keterangan'];
    const rows = filteredMovements.map((m) => [
      m.date,
      m.sku,
      `"${m.itemName.replace(/"/g, '""')}"`,
      m.type,
      m.referenceNumber,
      `"${(m.secondaryRef || '').replace(/"/g, '""')}"`,
      m.quantity,
      m.balanceBefore,
      m.balanceAfter,
      m.actor,
      `"${(m.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kartu_stok_mutasi_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              <ClipboardList className="w-4 h-4" />
              <span>Buku Mutasi & Jejak Audit (Audit Trail)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Kartu Stok & Riwayat Mutasi Barang
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Rekap historis aliran keluar masuk barang: penerimaan dari Surat Jalan Supplier (LPB) dan pengeluaran dari Nota Pengambilan Barang (SIV) yang telah di-ACC.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-2xs"
              title="Cetak atau Unduh Laporan Mutasi Stok ke PDF"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Ekspor / Cetak PDF</span>
            </button>

            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="Ekspor data dalam format spreadsheet CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by SKU */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700 focus:bg-white focus:outline-hidden"
              >
                <option value="">Semua Barang Master</option>
                {stockItems.map((s) => (
                  <option key={s.id} value={s.sku}>
                    {s.sku} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  typeFilter === 'ALL' ? 'bg-white shadow-2xs text-slate-900' : 'text-slate-600'
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setTypeFilter('IN')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 ${
                  typeFilter === 'IN' ? 'bg-white shadow-2xs text-emerald-900' : 'text-slate-600'
                }`}
              >
                <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                Masuk (SJ/LPB)
              </button>
              <button
                onClick={() => setTypeFilter('OUT')}
                className={`px-2.5 py-1 rounded-md font-medium flex items-center gap-1 ${
                  typeFilter === 'OUT' ? 'bg-white shadow-2xs text-amber-900' : 'text-slate-600'
                }`}
              >
                <ArrowUpRight className="w-3 h-3 text-amber-600" />
                Keluar (Nota SIV)
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari referensi, no nota, aktor..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Movement Table on Desktop (hidden md:block) */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Waktu Transaksi</th>
                <th className="px-4 py-3">Kode SKU</th>
                <th className="px-4 py-3">Nama Barang</th>
                <th className="px-4 py-3 text-center">Tipe Aliran</th>
                <th className="px-4 py-3">No. Referensi Dokumen</th>
                <th className="px-4 py-3">Pihak / Keterangan</th>
                <th className="px-4 py-3 text-right">Mutasi Qty</th>
                <th className="px-4 py-3 text-right">Saldo Akhir</th>
                <th className="px-4 py-3">Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    Tidak ada riwayat mutasi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isIn = mov.type === 'IN';
                  return (
                    <tr key={mov.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {formatDateTime(mov.date)}
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-800">
                        {mov.sku}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {mov.itemName}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isIn ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            MASUK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            KELUAR
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {mov.referenceNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="font-medium text-slate-800">{mov.secondaryRef || '-'}</div>
                        {mov.notes && (
                          <div className="text-[11px] text-slate-400">{mov.notes}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                        {isIn ? (
                          <span className="text-emerald-700">+{mov.quantity}</span>
                        ) : (
                          <span className="text-amber-700">-{mov.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold tabular-nums text-slate-900">
                        {mov.balanceAfter}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {mov.actor}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Cards on Mobile (md:hidden) */}
      <div className="md:hidden space-y-3">
        {filteredMovements.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-xs">
            Tidak ada riwayat mutasi yang cocok dengan filter.
          </div>
        ) : (
          filteredMovements.map((mov) => {
            const isIn = mov.type === 'IN';
            return (
              <div
                key={mov.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-900">
                        {mov.sku}
                      </span>
                      <span className="text-slate-400 text-[11px] font-mono">
                        {formatDateTime(mov.date)}
                      </span>
                    </div>
                    <div className="font-bold text-slate-900 mt-1">{mov.itemName}</div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded text-[10px] ${
                      isIn
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {isIn ? (
                      <>
                        <ArrowDownLeft className="w-3 h-3 text-emerald-600" /> MASUK
                      </>
                    ) : (
                      <>
                        <ArrowUpRight className="w-3 h-3 text-amber-600" /> KELUAR
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg text-slate-700">
                  <div>
                    <div className="text-[10px] text-slate-500">No. Referensi:</div>
                    <div className="font-mono font-bold text-slate-900">{mov.referenceNumber}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Keterangan:</div>
                    <div className="truncate font-medium">{mov.secondaryRef || '-'}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-600">
                  <span>Petugas: <strong>{mov.actor}</strong></span>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm">
                      {isIn ? (
                        <span className="text-emerald-700">+{mov.quantity}</span>
                      ) : (
                        <span className="text-amber-700">-{mov.quantity}</span>
                      )}
                    </span>{' '}
                    <span className="text-slate-400 text-[11px]">
                      (Sisa: {mov.balanceAfter})
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Printable / PDF Export Modal for Stock Ledger */}
      <PrintStockLedgerModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        stockMovements={filteredMovements}
        stockItems={stockItems}
        selectedSku={selectedSku}
        typeFilter={typeFilter}
      />
    </div>
  );
};

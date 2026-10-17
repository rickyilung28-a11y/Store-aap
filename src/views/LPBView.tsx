import React, { useState } from 'react';
import { LPBDocument, UserAccount } from '../types/inventory';
import {
  Search,
  Printer,
  Plus,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Building2,
} from 'lucide-react';

interface LPBViewProps {
  currentUser: UserAccount;
  lpbDocuments: LPBDocument[];
  onOpenCreateLPB: () => void;
  onPrintLPB: (doc: LPBDocument) => void;
}

export const LPBView: React.FC<LPBViewProps> = ({
  currentUser,
  lpbDocuments,
  onOpenCreateLPB,
  onPrintLPB,
}) => {
  const isAdmin = currentUser.role === 'admin';
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredDocs = lpbDocuments.filter((doc) => {
    const q = searchQuery.toLowerCase();
    return (
      doc.lpbNumber.toLowerCase().includes(q) ||
      doc.sjNumber.toLowerCase().includes(q) ||
      doc.supplierName.toLowerCase().includes(q) ||
      (doc.poNumber && doc.poNumber.toLowerCase().includes(q))
    );
  });

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Inbound / Penambahan Stok Gudang</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Laporan Penerimaan Barang (LPB) dari SJ Supplier
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Dokumentasi resmi barang masuk berdasarkan Surat Jalan (SJ) Supplier. Setiap penerimaan otomatis menambah saldo stok fisik dan siap dicetak.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {isAdmin ? (
              <button
                onClick={onOpenCreateLPB}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                Input SJ Supplier Baru
              </button>
            ) : (
              <div className="text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                Penerimaan SJ dilakukan oleh <strong>Admin Gudang</strong>
              </div>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan No. LPB, No. Surat Jalan, atau Nama Supplier..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>
          <span className="text-xs text-slate-500 shrink-0 font-mono">
            {filteredDocs.length} Dokumen
          </span>
        </div>
      </div>

      {/* LPB Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ditemukan dokumen penerimaan barang yang cocok.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredDocs.map((doc) => {
              const isExpanded = expandedId === doc.id;
              const totalItemsCount = doc.items.reduce((a, b) => a + b.quantity, 0);

              return (
                <div key={doc.id} className="transition-colors hover:bg-slate-50/50">
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {doc.lpbNumber}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {doc.supplierName}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span className="font-mono text-slate-700">
                          No. SJ: <strong>{doc.sjNumber}</strong>
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3.5 h-3.5" />
                          Terima: {formatDate(doc.receivedDate)}
                        </span>
                        <span>·</span>
                        <span className="text-slate-500">
                          Admin: <strong>{doc.receivedByAdmin}</strong>
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500">
                        Total {totalItemsCount} unit barang ({doc.items.length} macam SKU) diterima dalam kondisi baik.
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onPrintLPB(doc)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
                        title="Cetak atau Unduh Dokumen LPB Penerimaan Barang (PDF)"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cetak / Unduh PDF</span>
                      </button>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : doc.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Tutup rincian' : 'Lihat rincian item'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Item Details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 bg-slate-50/70 border-t border-slate-100">
                      <div className="border border-slate-200 rounded-lg overflow-x-auto bg-white">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 text-center w-10">No</th>
                              <th className="px-3 py-2">Kode SKU</th>
                              <th className="px-3 py-2">Nama Barang</th>
                              <th className="px-3 py-2 text-center">Kondisi</th>
                              <th className="px-3 py-2 text-right">Qty Diterima</th>
                              <th className="px-3 py-2">Lot / Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {doc.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-center tabular-nums text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-2 font-mono text-slate-700">{item.sku}</td>
                                <td className="px-3 py-2 font-medium text-slate-900">{item.itemName}</td>
                                <td className="px-3 py-2 text-center">
                                  <span className="text-emerald-700 font-semibold">{item.condition}</span>
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-emerald-700">
                                  +{item.quantity} {item.unit}
                                </td>
                                <td className="px-3 py-2 text-slate-500">
                                  {item.batchNo && item.batchNo !== '-' ? `Lot: ${item.batchNo} ` : ''}
                                  {item.notes}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {doc.notes && (
                        <p className="mt-2 text-xs text-slate-600">
                          <strong>Catatan Tambahan:</strong> {doc.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

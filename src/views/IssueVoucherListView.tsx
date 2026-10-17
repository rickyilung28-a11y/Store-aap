import React, { useState } from 'react';
import { IssueVoucherDocument, UserAccount } from '../types/inventory';
import {
  Search,
  Printer,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  UserCheck,
  Building,
  Info,
} from 'lucide-react';

interface IssueVoucherListViewProps {
  currentUser: UserAccount;
  issueVouchers: IssueVoucherDocument[];
  onOpenCreateVoucher: () => void;
  onOpenEditVoucher: (voucher: IssueVoucherDocument) => void;
  onOpenApproval: (voucher: IssueVoucherDocument) => void;
  onDeleteVoucher: (voucherId: string) => void;
  onPrintVoucher: (doc: IssueVoucherDocument) => void;
}

export const IssueVoucherListView: React.FC<IssueVoucherListViewProps> = ({
  currentUser,
  issueVouchers,
  onOpenCreateVoucher,
  onOpenEditVoucher,
  onOpenApproval,
  onDeleteVoucher,
  onPrintVoucher,
}) => {
  const isAdmin = currentUser.role === 'admin';

  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const pendingCount = issueVouchers.filter((v) => v.status === 'PENDING').length;
  const approvedCount = issueVouchers.filter((v) => v.status === 'APPROVED').length;
  const rejectedCount = issueVouchers.filter((v) => v.status === 'REJECTED').length;

  const filteredVouchers = issueVouchers.filter((v) => {
    // Tab filter
    if (activeTab === 'PENDING' && v.status !== 'PENDING') return false;
    if (activeTab === 'APPROVED' && v.status !== 'APPROVED') return false;
    if (activeTab === 'REJECTED' && v.status !== 'REJECTED') return false;

    // Search query
    const q = searchQuery.toLowerCase();
    return (
      v.voucherNumber.toLowerCase().includes(q) ||
      v.requestedBy.toLowerCase().includes(q) ||
      v.department.toLowerCase().includes(q) ||
      v.purpose.toLowerCase().includes(q)
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

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-700 mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>Outbound / Nota Pengeluaran Stok</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Nota Pengambilan Barang (Store Issue Voucher)
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Permintaan barang dari departemen/karyawan. Stok tidak langsung keluar saat terbit nota, melainkan menunggu persetujuan & serah terima fisik dari Admin Gudang.
            </p>
          </div>

          <button
            onClick={onOpenCreateVoucher}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            Buat Nota Pengambilan Baru
          </button>
        </div>

        {/* Status Filter Tabs (Interactive filter buttons) */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Nota ({issueVouchers.length})
            </button>

            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Menunggu ACC Admin ({pendingCount})
            </button>

            <button
              onClick={() => setActiveTab('APPROVED')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'APPROVED'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Disetujui & Keluar ({approvedCount})
            </button>

            <button
              onClick={() => setActiveTab('REJECTED')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'REJECTED'
                  ? 'bg-white text-red-900 shadow-2xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-red-500" />
              Ditolak ({rejectedCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari No. Nota, pemohon, tujuan..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Rules Notice Box */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Peraturan Sistem:</strong> Nota yang baru terbit tidak langsung memotong stok gudang. Hanya Admin Gudang yang dapat meng-ACC & menyerahkan barang secara fisik. 
          <span className="font-semibold text-slate-800"> Setelah di-approve, nota terkunci permanen (tidak dapat diedit/dihapus)</span> dan notifikasi real-time seketika terkirim ke user pemohon.
        </p>
      </div>

      {/* Voucher List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        {filteredVouchers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Tidak ada nota pengambilan barang dalam kategori ini.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredVouchers.map((voucher) => {
              const isExpanded = expandedId === voucher.id;
              const isApproved = voucher.status === 'APPROVED';
              const isPending = voucher.status === 'PENDING';
              const isRejected = voucher.status === 'REJECTED';
              const totalItems = voucher.items.reduce((a, b) => a + b.requestedQty, 0);

              return (
                <div key={voucher.id} className="transition-colors hover:bg-slate-50/50">
                  <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Voucher Details */}
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {voucher.voucherNumber}
                        </span>
                        <span className="text-slate-300">·</span>

                        {/* Status Label (Clean, accessible, anti-pill style) */}
                        {isPending && (
                          <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Menunggu ACC Admin (Stok Fisik Belum Berkurang)
                          </span>
                        )}
                        {isApproved && (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Disetujui & Barang Telah Diserahkan (Stok Resmi Keluar)
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-xs font-semibold text-red-700 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            Ditolak
                          </span>
                        )}
                      </div>

                      {/* Purpose */}
                      <p className="text-xs font-semibold text-slate-900">
                        {voucher.purpose}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {voucher.department} ({voucher.requestedBy})
                        </span>
                        <span>·</span>
                        <span>Tgl Pengajuan: {formatDate(voucher.requestDate)}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          Total Permintaan: {totalItems} unit ({voucher.items.length} item)
                        </span>

                        {isApproved && voucher.approvedAt && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-medium">
                              Di-ACC oleh {voucher.approvedByAdmin} ({formatDateTime(voucher.approvedAt)})
                            </span>
                          </>
                        )}
                      </div>

                      {isRejected && voucher.rejectionReason && (
                        <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                          <strong>Alasan Ditolak:</strong> {voucher.rejectionReason}
                        </div>
                      )}
                    </div>

                    {/* Actions Group */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Print & PDF Button (Always accessible after issuance) */}
                      <button
                        onClick={() => onPrintVoucher(voucher)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-2xs"
                        title="Cetak atau Unduh Dokumen Nota Pengambilan Barang (PDF)"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Cetak / Unduh PDF</span>
                      </button>

                      {/* Admin ACC Button */}
                      {isAdmin && isPending && (
                        <button
                          onClick={() => onOpenApproval(voucher)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-2xs"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>ACC & Serahkan</span>
                        </button>
                      )}

                      {/* Edit Button (Sistem Edit dinonaktifkan jika APPROVED) */}
                      {isApproved ? (
                        <button
                          onClick={() => onOpenEditVoucher(voucher)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                          title="Lihat rincian nota terkunci (Sistem hapus, edit, dan tambah item dinonaktifkan permanen)"
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Terkunci</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenEditVoucher(voucher)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                          title="Edit item, tambah barang, atau hapus barang pada nota"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Edit Item</span>
                        </button>
                      )}

                      {/* Delete Button (LOCKED IF APPROVED) */}
                      {isApproved ? (
                        <button
                          disabled
                          className="p-1.5 text-slate-300 bg-slate-100 rounded-lg cursor-not-allowed border border-slate-200"
                          title="Nota sudah di-approve. Dokumen resmi tidak dapat dihapus!"
                        >
                          <Lock className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm(`Batalkan dan hapus nota #${voucher.voucherNumber}?`)) {
                              onDeleteVoucher(voucher.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
                          title="Hapus / Batalkan Nota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Expand / Details */}
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : voucher.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                        title={isExpanded ? 'Tutup rincian' : 'Lihat rincian item'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
                              <th className="px-3 py-2 text-right">Qty Diminta</th>
                              <th className="px-3 py-2 text-right">Qty Diserahkan</th>
                              <th className="px-3 py-2 text-center">Status Fisik</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {voucher.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-center tabular-nums text-slate-500">
                                  {idx + 1}
                                </td>
                                <td className="px-3 py-2 font-mono text-slate-700">{item.sku}</td>
                                <td className="px-3 py-2 font-medium text-slate-900">{item.itemName}</td>
                                <td className="px-3 py-2 text-right font-mono font-medium text-slate-900 tabular-nums">
                                  {item.requestedQty} {item.unit}
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold tabular-nums">
                                  {isApproved ? (
                                    <span className="text-emerald-700">-{item.requestedQty} {item.unit}</span>
                                  ) : (
                                    <span className="text-slate-400">0 (Pending)</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {isApproved ? (
                                    <span className="text-emerald-700 font-semibold">Telah Keluar Gudang</span>
                                  ) : (
                                    <span className="text-amber-700 font-medium">Tersimpan di Rak</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {voucher.handoverOfficer && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white p-3 rounded-lg border border-slate-200">
                          <div>
                            <span className="text-slate-500">Petugas Penyerah: </span>
                            <span className="font-semibold text-slate-900">{voucher.handoverOfficer}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Penerima Fisik: </span>
                            <span className="font-semibold text-slate-900">{voucher.recipientName || voucher.requestedBy}</span>
                          </div>
                        </div>
                      )}

                      {voucher.notes && (
                        <p className="mt-2 text-xs text-slate-600">
                          <strong>Catatan Tambahan:</strong> {voucher.notes}
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

import React, { useState } from 'react';
import { IssueVoucherDocument, StockItem } from '../types/inventory';
import { CheckCircle2, XCircle, AlertCircle, PackageCheck, UserCheck, ShieldAlert, X } from 'lucide-react';

interface ApprovalModalProps {
  voucher: IssueVoucherDocument | null;
  stockItems: StockItem[];
  currentAdminName: string;
  onClose: () => void;
  onApprove: (handoverData: { handoverOfficer: string; recipientName: string; notes?: string }) => void;
  onReject: (reason: string) => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  voucher,
  stockItems,
  currentAdminName,
  onClose,
  onApprove,
  onReject,
}) => {
  if (!voucher) return null;

  const [handoverOfficer, setHandoverOfficer] = useState(currentAdminName || 'Admin Gudang');
  const [recipientName, setRecipientName] = useState(voucher.requestedBy);
  const [handoverNotes, setHandoverNotes] = useState('');
  
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirmApproval = () => {
    if (!handoverOfficer.trim()) {
      setErrorMsg('Nama petugas gudang yang menyerahkan wajib diisi.');
      return;
    }
    if (!recipientName.trim()) {
      setErrorMsg('Nama penerima fisik barang wajib diisi.');
      return;
    }

    onApprove({
      handoverOfficer,
      recipientName,
      notes: handoverNotes,
    });
  };

  const handleConfirmRejection = () => {
    if (!rejectionReason.trim()) {
      setErrorMsg('Alasan penolakan nota wajib diisi.');
      return;
    }
    onReject(rejectionReason);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <PackageCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm sm:text-base font-semibold">Verifikasi & Approval Penyerahan Barang</h2>
              <p className="text-[11px] sm:text-xs text-slate-300 font-mono">Nota Pengambilan #{voucher.voucherNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Information summary */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">Pemohon:</span>
              <span className="font-semibold text-slate-900">{voucher.requestedBy}</span>
              <span className="text-slate-500 block mt-0.5">({voucher.department})</span>
            </div>
            <div>
              <span className="text-slate-500 block">Tanggal Pengajuan:</span>
              <span className="font-medium text-slate-900">{voucher.requestDate}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Tujuan / Keperluan Pemakaian:</span>
              <span className="text-slate-800 font-medium">{voucher.purpose}</span>
            </div>
            {voucher.notes && (
              <div className="col-span-2 text-slate-600 bg-white p-2 rounded border border-slate-200">
                <span className="font-medium text-slate-700">Catatan Pemohon: </span>
                {voucher.notes}
              </div>
            )}
          </div>

          {/* Requested Items Verification */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
              <span>Daftar Barang & Ketersediaan Stok Fisik</span>
            </h3>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Barang</th>
                    <th className="px-3 py-2.5 text-center">Lokasi Rak</th>
                    <th className="px-3 py-2.5 text-right">Stok Fisik Saat Ini</th>
                    <th className="px-3 py-2.5 text-right">Qty Diminta</th>
                    <th className="px-3 py-2.5 text-right">Sisa Setelah ACC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {voucher.items.map((item, idx) => {
                    const currentItem = stockItems.find((s) => s.id === item.itemId);
                    const currentStock = currentItem ? currentItem.currentStock : 0;
                    const remaining = Math.max(0, currentStock - item.requestedQty);
                    const isEnough = currentStock >= item.requestedQty;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5">
                          <div className="font-medium text-slate-900">{item.itemName}</div>
                          <div className="text-[11px] font-mono text-slate-500">{item.sku}</div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-600 font-mono text-[11px]">
                          {currentItem?.location || '-'}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono tabular-nums text-slate-700">
                          {currentStock} {item.unit}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold tabular-nums text-slate-900">
                          {item.requestedQty} {item.unit}
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">
                          {isEnough ? (
                            <span className="text-emerald-700">{remaining} {item.unit}</span>
                          ) : (
                            <span className="text-red-600 flex items-center justify-end gap-1">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Kurang ({remaining})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Approval Handover */}
          {!isRejecting ? (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Konfirmasi Serah Terima Barang & Pemotongan Stok
                </div>
                <p className="text-[11px] text-emerald-700">
                  Setelah Anda menekan tombol setujui, <strong>stok fisik di rak gudang akan langsung resmi dipotong</strong>, status nota terkunci (user tidak dapat mengedit/menghapus), dan notifikasi real-time seketika terkirim ke {voucher.requestedBy}.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Petugas Gudang yang Menyerahkan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={handoverOfficer}
                    onChange={(e) => setHandoverOfficer(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    placeholder="Contoh: Hendra Gunawan (Gudang)"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Nama Penerima Fisik Barang <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    placeholder="Contoh: Budi Santoso (Produksi)"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">
                    Catatan Serah Terima / Kondisi Fisik (Opsional)
                  </label>
                  <input
                    type="text"
                    value={handoverNotes}
                    onChange={(e) => setHandoverNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-slate-900 focus:outline-hidden"
                    placeholder="Contoh: Barang diserahkan dalam kondisi baik dan diuji fungsi di lokasi"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Rejection Form */
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-900">
                <div className="font-semibold flex items-center gap-1.5 text-red-800 mb-1">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Form Penolakan Nota Pengambilan
                </div>
                <p className="text-[11px] text-red-700">
                  Stok yang sebelumnya dialokasikan akan dikembalikan menjadi tersedia kembali untuk pemohon lain.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alasan Penolakan <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-red-600 focus:outline-hidden"
                  placeholder="Contoh: Stok fisik di rak sedang dalam masa karantina / Belum ada memo otorisasi manajer departemen."
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {!isRejecting ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsRejecting(true);
                  setErrorMsg('');
                }}
                className="px-3.5 py-2 text-xs font-medium text-red-700 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                Tolak Nota
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmApproval}
                  className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-xs"
                >
                  <UserCheck className="w-4 h-4" />
                  ACC & Serahkan Barang (Potong Stok)
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsRejecting(false);
                  setErrorMsg('');
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Kembali ke Form ACC
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRejection}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors shadow-xs"
                >
                  <XCircle className="w-4 h-4" />
                  Konfirmasi Tolak Nota
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

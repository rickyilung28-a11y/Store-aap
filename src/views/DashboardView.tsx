import React from 'react';
import {
  StockItem,
  LPBDocument,
  IssueVoucherDocument,
  StockMovement,
  UserAccount,
} from '../types/inventory';
import {
  Boxes,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  FileText,
  Printer,
  UserCheck,
  CheckCircle2,
  ChevronRight,
  Shield,
  Layers,
  Users,
} from 'lucide-react';
import { AnnouncementSlider } from '../components/AnnouncementSlider';

interface DashboardViewProps {
  currentUser: UserAccount;
  stockItems: StockItem[];
  lpbDocuments: LPBDocument[];
  issueVouchers: IssueVoucherDocument[];
  stockMovements: StockMovement[];
  onOpenCreateLPB: () => void;
  onOpenCreateVoucher: () => void;
  onOpenApproval: (voucher: IssueVoucherDocument) => void;
  onPrintDocument: (type: 'LPB' | 'NPB', doc: LPBDocument | IssueVoucherDocument) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  stockItems,
  lpbDocuments,
  issueVouchers,
  stockMovements,
  onOpenCreateLPB,
  onOpenCreateVoucher,
  onOpenApproval,
  onPrintDocument,
  onNavigateTab,
}) => {
  const isAdmin = currentUser.role === 'admin';

  // Metrics
  const totalSKU = stockItems.length;
  const pendingVouchers = issueVouchers.filter((v) => v.status === 'PENDING');
  const approvedVouchers = issueVouchers.filter((v) => v.status === 'APPROVED');
  const lowStockItems = stockItems.filter(
    (item) => item.currentStock <= item.minStock
  );

  const totalPhysicalStock = stockItems.reduce((acc, i) => acc + i.currentStock, 0);

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
      {/* Welcome & Role Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              <span>Gudang Manufaktur & Distribusi</span>
              <span aria-hidden="true">·</span>
              <span className={isAdmin ? 'text-emerald-700' : 'text-amber-700'}>
                {isAdmin ? 'Akses Administrator Gudang' : `Akses Pemohon (${currentUser.department})`}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Selamat datang, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              {isAdmin
                ? 'Kelola penerimaan barang dari Surat Jalan (SJ) Supplier, review dan setujui nota pengambilan barang, serta pantau kartu stok mutasi.'
                : 'Ajukan nota pengambilan barang (SIV) untuk kebutuhan divisi Anda. Pantau status persetujuan secara real-time.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={() => onNavigateTab('users')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs"
                >
                  <Users className="w-4 h-4 text-emerald-600" />
                  Kelola User & Password
                </button>

                <button
                  onClick={onOpenCreateLPB}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                >
                  <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                  Input SJ Supplier (LPB)
                </button>
              </>
            )}

            <button
              onClick={onOpenCreateVoucher}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors shadow-xs"
            >
              <ArrowUpRight className="w-4 h-4" />
              Buat Nota Pengambilan (SIV)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Announcement & SOP Carousel Slider */}
      <AnnouncementSlider
        isAdmin={isAdmin}
        onOpenCreateLPB={onOpenCreateLPB}
        onOpenCreateVoucher={onOpenCreateVoucher}
        onNavigateTab={onNavigateTab}
        pendingCount={pendingVouchers.length}
        lowStockCount={lowStockItems.length}
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Total Katalog SKU</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {totalSKU}
            </span>
            <span className="text-xs text-slate-500">item</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono tabular-nums">
            Total fisik: {totalPhysicalStock.toLocaleString('id-ID')} unit
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Menunggu ACC Admin</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-600 tabular-nums">
              {pendingVouchers.length}
            </span>
            <span className="text-xs text-amber-700 font-medium">Nota Pending</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {pendingVouchers.length > 0 ? 'Stok fisik belum dipotong' : 'Semua permohonan tuntas'}
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Nota Selesai Diserahkan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">
              {approvedVouchers.length}
            </span>
            <span className="text-xs text-emerald-700 font-medium">Approved & Keluar</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Terkunci & siap dicetak</div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Peringatan Stok Tipis</span>
            <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${lowStockItems.length > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {lowStockItems.length}
            </span>
            <span className="text-xs text-slate-500">dibawah safety stock</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-mono">
            {lowStockItems.length > 0 ? 'Perlu dibuat PO Supplier' : 'Level stok aman'}
          </div>
        </div>
      </div>

      {/* Workflow Reminder Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-5 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono tracking-wider uppercase text-emerald-400 font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              STANDAR OPERASIONAL PROSEDUR (SOP) GUDANG
            </span>
            <h3 className="text-sm font-semibold text-white">
              Prinsip Approval & Pemotongan Stok Fisik
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              1. <strong>SJ Supplier &rarr; LPB</strong>: Admin memasukkan barang masuk, stok langsung bertambah & LPB bisa dicetak.<br />
              2. <strong>User &rarr; Nota SIV</strong>: User menerbitkan nota, <strong>stok belum berkurang</strong> sampai Admin melakukan ACC.<br />
              3. <strong>ACC Admin & Penyerahan</strong>: Admin memverifikasi & menekan tombol setujui &rarr; stok fisik dipotong & user menerima <strong>notifikasi real-time</strong>. Nota langsung terkunci.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('vouchers')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
            >
              Lihat Daftar Nota &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Approvals & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Urgent Pending Approvals (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold text-slate-900">
                Antrean Persetujuan Nota Pengambilan ({pendingVouchers.length})
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('vouchers')}
              className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
            >
              Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            {pendingVouchers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Tidak ada nota yang menunggu persetujuan saat ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingVouchers.map((voucher) => (
                  <div key={voucher.id} className="p-4 hover:bg-slate-50/60 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-mono font-bold text-slate-900">
                            {voucher.voucherNumber}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-600 font-medium">{voucher.department}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500">{formatDate(voucher.requestDate)}</span>
                        </div>

                        <p className="text-xs font-medium text-slate-800 mt-1">
                          {voucher.purpose}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span>Pemohon: <strong>{voucher.requestedBy}</strong></span>
                          <span>·</span>
                          <span>
                            Total: <strong>{voucher.items.reduce((a, b) => a + b.requestedQty, 0)} unit</strong> ({voucher.items.length} macam barang)
                          </span>
                          <span>·</span>
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">
                            Stok Belum Keluar
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onPrintDocument('NPB', voucher)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Pratinjau / Cetak Nota"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Cetak</span>
                        </button>

                        {isAdmin ? (
                          <button
                            onClick={() => onOpenApproval(voucher)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-2xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>ACC & Serahkan</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-amber-700 font-medium px-2 py-1 bg-amber-50 rounded border border-amber-200">
                            Menunggu ACC Admin
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Stock In / LPB */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Penerimaan Barang Terkini (LPB Supplier)
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('lpb')}
                className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                Lihat Semua <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="divide-y divide-slate-100">
                {lpbDocuments.slice(0, 3).map((lpb) => (
                  <div key={lpb.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono font-bold text-slate-900">{lpb.lpbNumber}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 font-mono">SJ: {lpb.sjNumber}</span>
                      </div>
                      <div className="text-xs text-slate-800 font-medium mt-0.5">
                        {lpb.supplierName}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Diterima {formatDate(lpb.receivedDate)} · {lpb.items.length} item barang
                      </div>
                    </div>

                    <button
                      onClick={() => onPrintDocument('LPB', lpb)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Cetak LPB
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Low Stock Alerts & Quick Guide */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-slate-900">Peringatan Stok Kritis</h2>
            </div>
            <button
              onClick={() => onNavigateTab('min-stock')}
              className="text-xs text-red-700 hover:text-red-900 font-semibold"
            >
              Lihat Tabel Stok Minimal &rarr;
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            {lowStockItems.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">
                Semua stok barang berada di atas batas aman minimal.
              </p>
            ) : (
              lowStockItems.map((item) => (
                <div key={item.id} className="p-3 bg-red-50/50 rounded-lg border border-red-200/60 text-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] font-mono text-slate-500">{item.sku} · {item.location}</span>
                    </div>
                    <span className="text-xs font-bold text-red-600 font-mono tabular-nums">
                      {item.currentStock} {item.unit}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-red-700 flex justify-between">
                    <span>Batas Min: {item.minStock} {item.unit}</span>
                    {isAdmin && (
                      <button
                        onClick={onOpenCreateLPB}
                        className="font-semibold underline hover:text-red-900"
                      >
                        + Tambah via SJ
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Ledger Movements */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              Aktivitas Mutasi Terakhir
            </h3>

            <div className="space-y-3">
              {stockMovements.slice(0, 4).map((mov) => {
                const isIncoming = mov.type === 'IN';
                return (
                  <div key={mov.id} className="text-xs border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-900 truncate max-w-[170px]">
                        {mov.itemName}
                      </span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          isIncoming ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isIncoming ? '+' : '-'}{mov.quantity}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 flex items-center justify-between">
                      <span className="font-mono">{mov.referenceNumber}</span>
                      <span>Saldo: {mov.balanceAfter}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

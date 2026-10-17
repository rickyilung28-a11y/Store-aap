import React, { useState, useRef } from 'react';
import { LPBDocument, IssueVoucherDocument } from '../types/inventory';
import { useInventory } from '../context/InventoryContext';
import {
  Printer,
  X,
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  Scissors,
  Copy,
  Building2,
} from 'lucide-react';
import { exportElementToPdf, printElementDirectly } from '../utils/exportPdf';

interface PrintDocumentModalProps {
  documentData: {
    type: 'LPB' | 'NPB';
    doc: LPBDocument | IssueVoucherDocument;
  } | null;
  onClose: () => void;
}

// Logo Tunas Tanaman PT. Abadi Agrosindo Persada
const AapSproutLogo = ({ className = 'w-10 h-10' }: { className?: string }) => (
  <svg
    className={`${className} shrink-0 text-slate-900`}
    viewBox="0 0 64 64"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M28 32C24 20 13 15 8 17C8 26 18 31 28 32Z" />
    <path d="M32 30C36 17 48 12 53 14C53 24 42 29 32 30Z" />
    <path d="M28 32C30 39 30 45 31 48H34C33 44 33 37 32 30" fill="currentColor" />
    <rect x="10" y="48" width="44" height="3.5" rx="1" />
    <rect x="14" y="53" width="36" height="2.5" rx="1" />
    <rect x="20" y="57" width="24" height="2" rx="1" />
  </svg>
);

// Stempel / Badge ACC Digital Resmi dengan Tanggal & Jam (untuk SIV)
const DigitalAccStamp: React.FC<{
  badge?: string;
  title: string;
  date: string;
  time: string;
  officerRole?: string;
  authCode?: string;
  colorScheme?: 'blue' | 'emerald' | 'amber';
  compact?: boolean;
}> = ({
  badge = 'ACC DIGITAL',
  title,
  date,
  time,
  officerRole,
  authCode,
  colorScheme = 'blue',
  compact = true,
}) => {
  const styles = {
    blue: {
      border: 'border-blue-900',
      bg: 'bg-blue-50/70',
      badgeBg: 'bg-blue-900 text-white',
      titleColor: 'text-blue-950',
      textColor: 'text-blue-900',
      subColor: 'text-blue-800',
    },
    emerald: {
      border: 'border-emerald-900',
      bg: 'bg-emerald-50/70',
      badgeBg: 'bg-emerald-900 text-white',
      titleColor: 'text-emerald-950',
      textColor: 'text-emerald-900',
      subColor: 'text-emerald-800',
    },
    amber: {
      border: 'border-amber-900',
      bg: 'bg-amber-50/70',
      badgeBg: 'bg-amber-900 text-white',
      titleColor: 'text-amber-950',
      textColor: 'text-amber-900',
      subColor: 'text-amber-800',
    },
  }[colorScheme];

  return (
    <div
      className={`border ${styles.border} ${styles.bg} rounded p-1 text-center w-full select-none shadow-2xs`}
    >
      <div
        className={`inline-block ${styles.badgeBg} font-mono ${
          compact ? 'text-[7.5px]' : 'text-[8.5px]'
        } font-extrabold px-1.5 py-0.2 rounded-xs uppercase tracking-wider`}
      >
        {badge}
      </div>
      <div
        className={`${
          compact ? 'text-[8.5px]' : 'text-[9.5px]'
        } font-bold uppercase tracking-tight mt-0.5 leading-tight ${styles.titleColor}`}
      >
        {title}
      </div>
      <div
        className={`mt-0.5 font-mono ${
          compact ? 'text-[8px]' : 'text-[8.5px]'
        } font-semibold leading-tight border-t border-b border-dashed border-slate-300 py-0.5 ${
          styles.textColor
        }`}
      >
        <div>Tgl : {date}</div>
        <div>Jam : {time}</div>
      </div>
      {officerRole && (
        <div
          className={`text-[7.5px] font-medium uppercase tracking-tight mt-0.5 ${styles.subColor}`}
        >
          {officerRole}
        </div>
      )}
      {authCode && (
        <div className="text-[7px] font-mono text-slate-500 tracking-tighter mt-0.5">
          {authCode}
        </div>
      )}
    </div>
  );
};

// Helper ekstraksi hanya nomor / kode dari Cost Center dan GL Acc
const cleanCodeOnly = (val?: string) => {
  if (!val) return '-';
  const trimmed = val.trim();
  const match = trimmed.match(/^([A-Za-z0-9_.-]+)/);
  return match ? match[1] : trimmed;
};

// =========================================================================
// 1. KOMPONEN BLOK TUNGGAL NOTA PENGAMBILAN BARANG (SIV SETENGAH A4)
// =========================================================================
interface SingleNotaBlockProps {
  npb: IssueVoucherDocument;
  copyLabel: string;
  copyBadgeColor: 'blue' | 'emerald' | 'amber';
  paperCopyColorNote: string;
  formatShortDate: (dateStr: string) => string;
  reqApprovalStamp: { date: string; time: string };
  handoverStamp: { date: string; time: string };
  whLeaderStamp: { date: string; time: string };
  isCompact?: boolean;
  companyName: string;
  companyCity: string;
  companyAddress: string;
  logoUrl?: string;
  docCode: string;
}

const SingleNotaBlock: React.FC<SingleNotaBlockProps> = ({
  npb,
  copyLabel,
  copyBadgeColor,
  paperCopyColorNote,
  formatShortDate,
  reqApprovalStamp,
  handoverStamp,
  whLeaderStamp,
  isCompact = true,
  companyName,
  companyCity,
  companyAddress,
  logoUrl,
  docCode,
}) => {
  const badgeClasses = {
    blue: 'border-blue-900 bg-blue-50 text-blue-900',
    emerald: 'border-emerald-900 bg-emerald-50 text-emerald-900',
    amber: 'border-amber-900 bg-amber-50 text-amber-900',
  }[copyBadgeColor];

  const minRows = isCompact ? Math.max(npb.items.length, 3) : Math.max(npb.items.length, 6);
  const emptyRowCount = Math.max(0, minRows - npb.items.length);

  return (
    <div className="bg-white text-slate-900 select-text">
      {/* Header Nota: Logo, Nama Perusahaan, Form Code, Tanggal, No. Doc, Label Arsip */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-1.5 mb-1.5">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className={isCompact ? 'w-9 h-9 object-contain' : 'w-11 h-11 object-contain'} />
          ) : (
            <AapSproutLogo className={isCompact ? 'w-9 h-9' : 'w-11 h-11'} />
          )}
          <div>
            <h1
              className={`${
                isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
              } font-extrabold text-slate-900 tracking-tight leading-tight uppercase`}
            >
              {companyName}
            </h1>
            <p className="text-[10px] font-bold text-slate-700">
              {companyCity} &middot; {companyAddress ? companyAddress.split(',')[0] : 'Jawa Timur'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 mb-0.5">
            <span
              className={`inline-block border px-1.5 py-0.2 font-bold text-[8.5px] uppercase tracking-wider rounded-xs ${badgeClasses}`}
            >
              {copyLabel}
            </span>
            <div className="inline-block border border-slate-900 px-1.5 py-0.2 font-bold text-[8.5px] font-mono text-slate-900 tracking-wider bg-slate-50">
              {docCode || 'FR/AAP/G-STR/23/001'}
            </div>
          </div>
          <div className="text-[10px] space-y-0.2 font-mono">
            <div className="flex justify-end gap-1.5">
              <span className="text-slate-600 font-sans font-medium">Tanggal :</span>
              <span className="font-bold text-slate-900">{formatShortDate(npb.requestDate)}</span>
            </div>
            <div className="flex justify-end gap-1.5">
              <span className="text-slate-600 font-sans font-medium">No. Doc :</span>
              <span className="font-bold text-slate-900 underline underline-offset-2">
                {npb.voucherNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Title Center */}
      <div className="text-center my-1">
        <h2
          className={`${
            isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          } font-black uppercase tracking-wider text-slate-900`}
        >
          NOTA PENGAMBILAN BARANG
        </h2>
        <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-700 -mt-0.5">
          STORE ISSUE VOUCHER
        </p>
      </div>

      {/* Bagian / Pemohon */}
      <div className="flex items-center justify-between text-[10.5px] mb-1.5 px-0.5 font-medium text-slate-800">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-slate-700">Bagian / Pemohon :</span>
          <span className="font-bold text-slate-900 border-b border-dotted border-slate-700 px-1">
            {npb.department || 'Workshop & Maintenance'} &mdash; {npb.requestedBy}
          </span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-slate-700">Keperluan :</span>
          <span className="text-slate-900 border-b border-dotted border-slate-700 px-1 max-w-[240px] truncate">
            {npb.purpose || 'Kebutuhan Operasional'}
          </span>
        </div>
      </div>

      {/* Table Item: No, Banyaknya, Satuan, Nama Barang, Cost Center, GL Acc, Keterangan */}
      <div className="border border-slate-900 overflow-hidden">
        <table className="w-full border-collapse text-[10.5px]">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-100 font-bold text-slate-900 text-center uppercase text-[9.5px]">
              <th className="border-r border-slate-900 py-1 px-1.5 w-7 text-center">No</th>
              <th className="border-r border-slate-900 py-1 px-2 w-16 text-center">Banyaknya</th>
              <th className="border-r border-slate-900 py-1 px-2 w-14 text-center">Satuan</th>
              <th className="border-r border-slate-900 py-1 px-2 text-left">Nama Barang</th>
              <th className="border-r border-slate-900 py-1 px-1.5 w-14 text-center">
                Cost Center
              </th>
              <th className="border-r border-slate-900 py-1 px-1.5 w-14 text-center">GL Acc</th>
              <th className="py-1 px-2 w-20 text-center">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {npb.items.map((item, idx) => (
              <tr key={idx} className={`${isCompact ? 'h-5 sm:h-5.5' : 'h-6 sm:h-7'} text-slate-900`}>
                <td className="border-r border-slate-900 px-1 text-center font-bold tabular-nums">
                  {idx + 1}
                </td>
                <td className="border-r border-slate-900 px-1.5 text-center font-bold font-mono tabular-nums">
                  {item.approvedQty ?? item.requestedQty}
                </td>
                <td className="border-r border-slate-900 px-1.5 text-center font-medium">
                  {item.unit || 'Pcs'}
                </td>
                <td className="border-r border-slate-900 px-2 font-semibold">
                  <div className="truncate max-w-[280px]">{item.itemName}</div>
                </td>
                <td className="border-r border-slate-900 px-1 text-center font-mono font-bold text-slate-950">
                  {cleanCodeOnly(item.costCenter) || '60'}
                </td>
                <td className="border-r border-slate-900 px-1 text-center font-mono font-bold text-slate-950">
                  {cleanCodeOnly(item.glAcc) || '-'}
                </td>
                <td className="px-1.5 text-center text-slate-600 font-mono text-[9px] truncate">
                  {item.sku || '-'}
                </td>
              </tr>
            ))}

            {Array.from({ length: emptyRowCount }).map((_, emptyIdx) => (
              <tr
                key={`empty-${emptyIdx}`}
                className={`${isCompact ? 'h-5 sm:h-5.5' : 'h-6 sm:h-7'} text-slate-400`}
              >
                <td className="border-r border-slate-900 px-1 text-center font-mono tabular-nums">
                  {npb.items.length + emptyIdx + 1}
                </td>
                <td className="border-r border-slate-900 px-1.5">&nbsp;</td>
                <td className="border-r border-slate-900 px-1.5">&nbsp;</td>
                <td className="border-r border-slate-900 px-2">&nbsp;</td>
                <td className="border-r border-slate-900 px-1 text-center">&nbsp;</td>
                <td className="border-r border-slate-900 px-1 text-center">&nbsp;</td>
                <td className="px-1.5 text-center">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 3-Column Signatures Block (SIV Setengah A4) */}
      <div className="border border-slate-900 border-t-0 text-slate-900">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-slate-900 font-bold text-center bg-slate-100 uppercase text-[9.5px]">
              <th className="border-r border-slate-900 py-1 px-2 w-1/3">Yang Menyerahkan,</th>
              <th className="border-r border-slate-900 py-1 px-2 w-1/3">Penerima,</th>
              <th className="py-1 px-2 w-1/3">Disetujui Oleh,</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* 1. Yang Menyerahkan: ACC DIGITAL Tanggal & Jam */}
              <td
                className={`border-r border-slate-900 p-1.5 text-center align-top ${
                  isCompact ? 'h-20 sm:h-22' : 'h-24 sm:h-26'
                }`}
              >
                <div className="flex flex-col justify-between items-center h-full">
                  <div className="w-full flex-1 flex items-center justify-center py-0.2">
                    <DigitalAccStamp
                      badge="ACC DIGITAL"
                      title="DISERAHKAN RESMI"
                      date={handoverStamp.date}
                      time={handoverStamp.time}
                      officerRole="Petugas Gudang"
                      authCode={`ID: #AAP-WH-${npb.voucherNumber.slice(-4)}`}
                      colorScheme="blue"
                      compact={isCompact}
                    />
                  </div>
                  <div className="w-full pt-0.5 border-t border-dotted border-slate-300">
                    <div className="font-bold text-[9.5px] text-slate-900 truncate">
                      ( {npb.handoverOfficer || 'Petugas Gudang AAP'} )
                    </div>
                    <div className="text-[8.5px] text-slate-600 font-medium">Petugas Gudang</div>
                  </div>
                </div>
              </td>

              {/* 2. Penerima: KOSONGAN UNTUK TTD BASAH MANUAL */}
              <td
                className={`border-r border-slate-900 p-1.5 text-center align-top ${
                  isCompact ? 'h-20 sm:h-22' : 'h-24 sm:h-26'
                }`}
              >
                <div className="flex flex-col justify-between items-center h-full">
                  <div className="flex-1 w-full flex items-center justify-center">
                    <span className="text-[8px] text-slate-400 italic select-none">
                      ( Ruang Tanda Tangan Basah )
                    </span>
                  </div>
                  <div className="w-full pt-0.5 border-t border-dotted border-slate-300">
                    <div className="font-bold text-[9.5px] text-slate-900 truncate">
                      ( ........................................ )
                    </div>
                    <div className="text-[8.5px] text-slate-600 font-medium truncate">
                      {npb.recipientName || npb.requestedBy}
                    </div>
                  </div>
                </div>
              </td>

              {/* 3. Disetujui Oleh: ACC DIGITAL Tanggal & Jam */}
              <td
                className={`p-1.5 text-center align-top ${
                  isCompact ? 'h-20 sm:h-22' : 'h-24 sm:h-26'
                }`}
              >
                <div className="flex flex-col justify-between items-center h-full">
                  <div className="w-full flex-1 flex items-center justify-center py-0.2">
                    {npb.status === 'APPROVED' ? (
                      <DigitalAccStamp
                        badge="ACC DIGITAL"
                        title="DISETUJUI KEPALA GUDANG"
                        date={whLeaderStamp.date}
                        time={whLeaderStamp.time}
                        officerRole="Kepala Gudang"
                        authCode={`ID: #AAP-WH-${npb.voucherNumber.slice(-4)}`}
                        colorScheme="emerald"
                        compact={isCompact}
                      />
                    ) : (
                      <div className="border border-dashed border-amber-600 bg-amber-50/70 rounded px-1.5 py-1 text-center text-amber-900 w-full">
                        <span className="text-[8px] font-mono font-bold block">
                          [ PENDING ACC GUDANG ]
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="w-full pt-0.5 border-t border-dotted border-slate-300">
                    <div className="font-bold text-[9.5px] text-slate-900 truncate">
                      ( {npb.approvedByAdmin || 'Kepala Gudang'} )
                    </div>
                    <div className="text-[8.5px] text-slate-600 font-medium">Kepala Gudang</div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Paper Copies Footnote */}
      <div className="flex items-center justify-between text-[9px] font-semibold text-slate-800 mt-1 px-0.5">
        <div className="flex items-center gap-3">
          <span>Putih : Akunting</span>
          <span>Kuning : Gudang</span>
          <span className="text-slate-500 font-normal">Merah : Pemohon</span>
        </div>
        <div className="text-[8.5px] text-slate-500 font-mono italic">
          {paperCopyColorNote}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// 2. KOMPONEN BLOK TUNGGAL LAPORAN PENERIMAAN BARANG (LPB SETENGAH A4)
// =========================================================================
interface SingleLpbBlockProps {
  lpb: LPBDocument;
  copyLabel: string;
  copyBadgeColor: 'blue' | 'emerald';
  paperCopyColorNote: string;
  formatShortDate: (dateStr: string) => string;
  isCompact?: boolean;
  companyName: string;
  companyCity: string;
  companyAddress: string;
  logoUrl?: string;
  docCode: string;
}

const SingleLpbBlock: React.FC<SingleLpbBlockProps> = ({
  lpb,
  copyLabel,
  copyBadgeColor,
  paperCopyColorNote,
  formatShortDate,
  isCompact = true,
  companyName,
  companyCity,
  companyAddress,
  logoUrl,
  docCode,
}) => {
  const badgeClasses = {
    blue: 'border-blue-900 bg-blue-50 text-blue-900',
    emerald: 'border-emerald-900 bg-emerald-50 text-emerald-900',
  }[copyBadgeColor];

  const minRows = isCompact ? Math.max(lpb.items.length, 4) : Math.max(lpb.items.length, 8);
  const emptyRowCount = Math.max(0, minRows - lpb.items.length);

  return (
    <div className="bg-white text-slate-900 select-text">
      {/* Header LPB: Logo, Nama Perusahaan, Form Code, Tanggal, No. LPB */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-1.5 mb-1.5">
        <div className="flex items-center gap-2.5">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className={isCompact ? 'w-9 h-9 object-contain' : 'w-11 h-11 object-contain'} />
          ) : (
            <AapSproutLogo className={isCompact ? 'w-9 h-9' : 'w-11 h-11'} />
          )}
          <div>
            <h1
              className={`${
                isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
              } font-extrabold text-slate-900 tracking-tight leading-tight uppercase`}
            >
              {companyName}
            </h1>
            <p className="text-[10px] font-bold text-slate-700">
              {companyCity} &middot; {companyAddress ? companyAddress.split(',')[0] : 'Jawa Timur'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center justify-end gap-1.5 mb-0.5">
            <span
              className={`inline-block border px-1.5 py-0.2 font-bold text-[8.5px] uppercase tracking-wider rounded-xs ${badgeClasses}`}
            >
              {copyLabel}
            </span>
            <div className="inline-block border border-slate-900 px-1.5 py-0.2 font-bold text-[8.5px] font-mono text-slate-900 tracking-wider bg-slate-50">
              {docCode || 'FR/AAP/G-LPB/23/002'}
            </div>
          </div>
          <div className="text-[10px] space-y-0.2 font-mono">
            <div className="flex justify-end gap-1.5">
              <span className="text-slate-600 font-sans font-medium">Tanggal :</span>
              <span className="font-bold text-slate-900">{formatShortDate(lpb.receivedDate)}</span>
            </div>
            <div className="flex justify-end gap-1.5">
              <span className="text-slate-600 font-sans font-medium">No. LPB :</span>
              <span className="font-bold text-slate-900 underline underline-offset-2">
                {lpb.lpbNumber}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Document Title Center */}
      <div className="text-center my-1">
        <h2
          className={`${
            isCompact ? 'text-xs sm:text-sm' : 'text-sm sm:text-base'
          } font-black uppercase tracking-wider text-slate-900`}
        >
          LAPORAN PENERIMAAN BARANG
        </h2>
        <p className="text-[8.5px] font-bold uppercase tracking-widest text-slate-700 -mt-0.5">
          GOODS RECEIPT REPORT (SETENGAH A4)
        </p>
      </div>

      <p className="text-[9.5px] text-slate-800 mb-1 font-medium">
        Barang - barang yang tertera di bawah ini kami terima dengan baik, sbb :
      </p>

      {/* Meta Grid LPB */}
      <div className="text-[10px] text-slate-900 border border-slate-900 p-1.5 mb-1.5 bg-slate-50/60">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-baseline">
            <span className="w-24 text-slate-700 shrink-0 font-medium">No. PO</span>
            <span className="mr-1 font-bold">:</span>
            <span className="font-mono font-semibold text-slate-900 border-b border-dotted border-slate-600 flex-1 truncate">
              {lpb.poNumber || '-'}
            </span>
          </div>

          <div className="flex items-baseline">
            <span className="w-24 text-slate-700 shrink-0 font-medium">No. Surat Jalan</span>
            <span className="mr-1 font-bold">:</span>
            <span className="font-mono font-bold text-slate-900 border-b border-dotted border-slate-600 flex-1 truncate">
              {lpb.sjNumber}
            </span>
          </div>

          <div className="flex items-baseline">
            <span className="w-24 text-slate-700 shrink-0 font-medium">Nama Supplier</span>
            <span className="mr-1 font-bold">:</span>
            <span className="font-semibold text-slate-900 border-b border-dotted border-slate-600 flex-1 truncate">
              {lpb.supplierName}
            </span>
          </div>

          <div className="flex items-baseline">
            <span className="w-24 text-slate-700 shrink-0 font-medium">Pembawa / Plat</span>
            <span className="mr-1 font-bold">:</span>
            <span className="text-slate-800 border-b border-dotted border-slate-600 flex-1 truncate">
              {lpb.driverName || 'Expedisi'} {lpb.vehiclePlate ? `(${lpb.vehiclePlate})` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Table Items LPB */}
      <div className="border border-slate-900 overflow-hidden">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-slate-900 bg-slate-100 font-bold text-slate-900 text-center uppercase text-[9px]">
              <th className="border-r border-slate-900 py-1 px-1 w-7 text-center">No</th>
              <th className="border-r border-slate-900 py-1 px-2 text-left">Nama Barang</th>
              <th className="border-r border-slate-900 py-1 px-1.5 w-16 text-center">Kualitas</th>
              <th className="border-r border-slate-900 py-1 px-1.5 w-16 text-center">Satuan</th>
              <th className="border-r border-slate-900 py-1 px-1.5 w-14 text-center">Jumlah</th>
              <th className="py-1 px-2 w-24 text-center">No. Lot / Batch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-900">
            {lpb.items.map((item, idx) => (
              <tr key={idx} className={`${isCompact ? 'h-5 sm:h-5.5' : 'h-6 sm:h-7'} text-slate-900`}>
                <td className="border-r border-slate-900 px-1 text-center font-bold tabular-nums">
                  {idx + 1}
                </td>
                <td className="border-r border-slate-900 px-2 font-semibold">
                  <div className="truncate max-w-[280px]">
                    {item.itemName}{' '}
                    <span className="font-mono text-slate-500 text-[9px]">({item.sku})</span>
                  </div>
                </td>
                <td className="border-r border-slate-900 px-1 text-center font-medium">
                  {item.condition || 'Baik'}
                </td>
                <td className="border-r border-slate-900 px-1 text-center font-medium">
                  {item.unit || 'Pcs'}
                </td>
                <td className="border-r border-slate-900 px-1.5 text-center font-bold font-mono tabular-nums">
                  {item.quantity}
                </td>
                <td className="px-1 text-center font-mono text-[9px] text-slate-700">
                  {item.batchNo || '-'}
                </td>
              </tr>
            ))}

            {Array.from({ length: emptyRowCount }).map((_, emptyIdx) => (
              <tr
                key={`empty-lpb-${emptyIdx}`}
                className={`${isCompact ? 'h-5 sm:h-5.5' : 'h-6 sm:h-7'} text-slate-400`}
              >
                <td className="border-r border-slate-900 px-1 text-center font-mono tabular-nums">
                  {lpb.items.length + emptyIdx + 1}
                </td>
                <td className="border-r border-slate-900 px-2">&nbsp;</td>
                <td className="border-r border-slate-900 px-1">&nbsp;</td>
                <td className="border-r border-slate-900 px-1">&nbsp;</td>
                <td className="border-r border-slate-900 px-1.5 text-center">&nbsp;</td>
                <td className="px-1 text-center">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Usage Purpose & Storage Location Box */}
      <div className="border border-slate-900 border-t-0 p-1.5 text-[9.5px] space-y-0.5 bg-white text-slate-900">
        <div className="flex items-baseline">
          <span className="shrink-0 text-slate-700 font-medium">
            Dipergunakan untuk :
          </span>
          <span className="ml-1 font-semibold border-b border-dotted border-slate-600 flex-1 truncate">
            {lpb.usagePurpose || lpb.notes || 'Persediaan Gudang & Produksi'}
          </span>
          <span className="ml-3 shrink-0 text-slate-700 font-medium">
            Disimpan di Rak :
          </span>
          <span className="ml-1 font-mono font-bold text-slate-950 border-b border-dotted border-slate-600 flex-1 truncate">
            {lpb.storageLocation || 'Rak A-01 (Gudang Utama)'}
          </span>
        </div>
      </div>

      {/* 3 TANDA TANGAN MANUAL (Semua TTD Manual Basah untuk LPB) */}
      <div className="border border-slate-900 border-t-0 text-slate-900">
        <table className="w-full border-collapse text-[9.5px]">
          <thead>
            <tr className="border-b border-slate-900 font-bold text-center bg-slate-100 uppercase text-[9px]">
              <th className="border-r border-slate-900 py-1 px-2 w-1/3">Pengirim / Sopir,</th>
              <th className="border-r border-slate-900 py-1 px-2 w-1/3">Diperiksa Oleh,</th>
              <th className="py-1 px-2 w-1/3">Diterima Oleh,</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* 1. Pengirim / Sopir (Manual) */}
              <td
                className={`border-r border-slate-900 p-1 text-center align-bottom ${
                  isCompact ? 'h-16 sm:h-18' : 'h-22 sm:h-24'
                }`}
              >
                <div className="flex flex-col justify-between items-center h-full">
                  <div className="flex-1 w-full flex items-center justify-center">
                    <span className="text-[7.5px] text-slate-400 italic select-none">
                      ( Tanda Tangan Basah )
                    </span>
                  </div>
                  <div className="w-full pt-0.5 border-t border-dotted border-slate-400">
                    <div className="font-bold text-[9px] text-slate-900 truncate">
                      ( {lpb.driverName || '................................'} )
                    </div>
                    <div className="text-[8px] text-slate-500 font-medium">Pengirim / Ekspedisi</div>
                  </div>
                </div>
              </td>

              {/* 2. Diperiksa Oleh (Staff Gudang Manual) */}
              <td
                className={`border-r border-slate-900 p-1 text-center align-bottom ${
                  isCompact ? 'h-16 sm:h-18' : 'h-22 sm:h-24'
                }`}
              >
                <div className="flex flex-col justify-between items-center h-full">
                  <div className="flex-1 w-full flex items-center justify-center">
                    <span className="text-[7.5px] text-slate-400 italic select-none">
                      ( Tanda Tangan Basah )
                    </span>
                  </div>
                  <div className="w-full pt-0.5 border-t border-dotted border-slate-400">
                    <div className="font-bold text-[9px] text-slate-900 truncate">
                      ( ........................................ )
                    </div>
                    <div className="text-[8px] text-slate-500 font-medium">Pemeriksa Barang</div>
                  </div>
                </div>
              </td>

              {/* 3. Diterima Oleh (Kepala Gudang Manual) */}
              <td
                className={`p-1 text-center align-bottom ${
                  isCompact ? 'h-16 sm:h-18' : 'h-22 sm:h-24'
                }`}
              >
                <div className="flex flex-col justify-between items-center h-full">
                  <div className="flex-1 w-full flex items-center justify-center">
                    <span className="text-[7.5px] text-slate-400 italic select-none">
                      ( Tanda Tangan Basah )
                    </span>
                  </div>
                  <div className="w-full pt-0.5 border-t border-dotted border-slate-400">
                    <div className="font-bold text-[9px] text-slate-900 truncate">
                      ( {lpb.receivedByAdmin || 'Kepala Gudang AAP'} )
                    </div>
                    <div className="text-[8px] text-slate-500 font-medium">Kepala Gudang</div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Paper Copies Footnote */}
      <div className="flex items-center justify-between text-[8.5px] font-semibold text-slate-800 mt-1 px-0.5">
        <div className="flex items-center gap-3">
          <span>Putih : Gudang</span>
          <span>Kuning : Pembelian (Purchasing)</span>
          <span className="text-slate-500 font-normal">Merah : Vendor/Supplier</span>
        </div>
        <div className="text-[8px] text-slate-500 font-mono italic">
          {paperCopyColorNote}
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// MAIN EXPORT MODAL COMPONENT
// =========================================================================
export const PrintDocumentModal: React.FC<PrintDocumentModalProps> = ({
  documentData,
  onClose,
}) => {
  const { companyProfile } = useInventory();
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Default to 2 nota/LPB per paper as requested by user (Setengah A4 x 2)
  const [copiesMode, setCopiesMode] = useState<'two' | 'one'>('two');
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!documentData) return null;

  const { type, doc } = documentData;
  const isLPB = type === 'LPB';
  const lpb = isLPB ? (doc as LPBDocument) : null;
  const npb = !isLPB ? (doc as IssueVoucherDocument) : null;

  const docTitle = isLPB
    ? `LPB_Setengah_A4_${lpb?.lpbNumber}`
    : `Nota_SIV_Setengah_A4_${npb?.voucherNumber}`;

  const handlePrint = () => {
    if (printAreaRef.current) {
      printElementDirectly(printAreaRef.current, docTitle);
    } else {
      window.print();
    }
  };

  const handleDownloadPdf = async () => {
    if (!printAreaRef.current || isExporting) return;
    setIsExporting(true);
    setExportNotice(null);

    const safeFilename = isLPB
      ? `LPB_${lpb?.lpbNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_SETENGAH_A4.pdf`
      : `NOTA_${npb?.voucherNumber.replace(/[^a-zA-Z0-9_-]/g, '_')}_SETENGAH_A4.pdf`;

    const result = await exportElementToPdf(printAreaRef.current, {
      filename: safeFilename,
      title: docTitle,
      orientation: 'portrait',
      format: 'a4',
      marginMm: 6,
    });

    setIsExporting(false);

    if (result.success) {
      setExportNotice('File PDF Setengah A4 berhasil diekspor dan diunduh!');
      setTimeout(() => setExportNotice(null), 4000);
    } else {
      setExportNotice(result.error || 'Gagal membuat file PDF. Silakan coba kembali.');
      setTimeout(() => setExportNotice(null), 5000);
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatDigitalAccTimestamp = (
    timestamp?: string,
    fallbackDate?: string,
    defaultHour = 9,
    defaultMinute = 15
  ) => {
    let dateObj: Date | null = null;
    if (timestamp) {
      const parsed = new Date(timestamp);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
      }
    }
    if (!dateObj && fallbackDate) {
      const parsed = new Date(fallbackDate);
      if (!isNaN(parsed.getTime())) {
        dateObj = parsed;
        if (!fallbackDate.includes('T') && !fallbackDate.includes(':')) {
          dateObj.setHours(defaultHour, defaultMinute, 0, 0);
        }
      }
    }
    if (!dateObj) {
      dateObj = new Date();
    }

    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds} WIB`,
      shortTime: `${hours}:${minutes} WIB`,
    };
  };

  const reqApprovalStamp = formatDigitalAccTimestamp(
    npb?.createdAt || npb?.requestDate,
    npb?.requestDate,
    9,
    30
  );

  const handoverStamp = formatDigitalAccTimestamp(
    npb?.approvedAt || npb?.updatedAt || npb?.createdAt,
    npb?.requestDate,
    14,
    15
  );

  const whLeaderStamp = formatDigitalAccTimestamp(
    npb?.approvedAt || npb?.updatedAt || npb?.createdAt,
    npb?.requestDate,
    14,
    20
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="print-modal-container relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-3 sm:my-6 max-h-[92vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3 bg-slate-900 text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2 truncate mr-2">
            <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-xs sm:text-sm block truncate">
                Pratinjau Dokumen Setengah A4: {isLPB ? `LPB (${lpb?.lpbNumber})` : `Nota (${npb?.voucherNumber})`}
              </span>
              <span className="text-[10px] text-slate-300 hidden sm:block">
                {companyProfile.companyName || 'PT. Abadi Agrosindo Persada'} &middot; Standar Setengah A4 (2 in 1 Arsip)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Toggle 2 Nota / LPB per Kertas vs 1 Single Setengah A4 */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setCopiesMode('two')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-colors flex items-center gap-1.5 ${
                  copiesMode === 'two'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Cetak 2 Lembar dalam 1 Kertas A4 (Arsip Gudang & Arsip Penerima/Purchasing)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>2 {isLPB ? 'LPB' : 'Nota'} / Kertas A4</span>
              </button>
              <button
                type="button"
                onClick={() => setCopiesMode('one')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  copiesMode === 'one'
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Cetak 1 Lembar Setengah A4 Tunggal"
              >
                <span>1 Setengah A4</span>
              </button>
            </div>

            {/* Download PDF button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-700/60 rounded-lg transition-colors shadow-xs"
              title="Unduh langsung sebagai file dokumen PDF"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Membuat PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Unduh PDF</span>
                </>
              )}
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors shadow-2xs"
              title="Buka dialog cetak browser"
            >
              <Printer className="w-4 h-4 text-slate-400" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Download notification banner */}
        {exportNotice && (
          <div className="no-print px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportNotice}</span>
            </div>
            <button
              onClick={() => setExportNotice(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Informative Guidance Banner */}
        <div className="no-print px-4 sm:px-6 py-2 bg-slate-100 border-b border-slate-200 text-xs text-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              {isLPB ? (
                copiesMode === 'two' ? (
                  <>
                    Format <strong>LPB Setengah A4 (2 dalam 1 Kertas A4)</strong>: Atas untuk <strong>Arsip Gudang</strong> &amp; Bawah untuk <strong>Arsip Purchasing / Supplier</strong>.
                  </>
                ) : (
                  <>
                    Format <strong>LPB 1 Lembar Setengah A4</strong> aktif: Ukuran ringkas A5 siap arsip.
                  </>
                )
              ) : (
                copiesMode === 'two' ? (
                  <>
                    Format <strong>SIV Setengah A4 (2 dalam 1 Kertas A4)</strong>: Atas untuk <strong>Arsip Admin/Gudang</strong> &amp; Bawah untuk <strong>Arsip Penerima</strong>.
                  </>
                ) : (
                  <>
                    Format <strong>SIV 1 Lembar Setengah A4</strong> aktif.
                  </>
                )
              )}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
            Ukuran Kertas: A4 Portrait (210 &times; 297 mm)
          </span>
        </div>

        {/* Printable Sheet Viewport */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 bg-slate-200/80">
          <div
            ref={printAreaRef}
            className="print-container bg-white text-slate-900 shadow-md mx-auto p-4 sm:p-6"
            style={{ width: '100%', maxWidth: '210mm' }}
          >
            {/* 1. NOTA PENGAMBILAN BARANG (SIV SETENGAH A4) */}
            {!isLPB && npb && (
              <div>
                {copiesMode === 'two' ? (
                  <>
                    {/* LEMBAR 1: ARSIP GUDANG / ADMIN */}
                    <div className="border border-slate-900 p-2.5 sm:p-3 bg-white">
                      <SingleNotaBlock
                        npb={npb}
                        copyLabel="LEMBAR 1 : ARSIP GUDANG / ADMIN"
                        copyBadgeColor="blue"
                        paperCopyColorNote="Lembar 1: Arsip Resmi Logistik & Gudang"
                        formatShortDate={formatShortDate}
                        reqApprovalStamp={reqApprovalStamp}
                        handoverStamp={handoverStamp}
                        whLeaderStamp={whLeaderStamp}
                        isCompact={true}
                        companyName={companyProfile.companyName || 'PT. Abadi Agrosindo Persada'}
                        companyCity={companyProfile.city || 'Sidoarjo'}
                        companyAddress={companyProfile.address || 'Kawasan Industri Pergudangan'}
                        logoUrl={companyProfile.logoUrl}
                        docCode={companyProfile.sivDocCode || 'FR/AAP/G-STR/23/001'}
                      />
                    </div>

                    {/* Perforated Cutting Line */}
                    <div className="my-2 py-0.5 flex items-center justify-center text-slate-500 text-[9px] font-mono border-t border-b border-dashed border-slate-400 bg-slate-50 select-none">
                      <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-slate-600">
                        <Scissors className="w-3 h-3 text-slate-600" />
                        <span>POTONG DI SINI &mdash; PISAHKAN ARSIP ADMIN DAN PENERIMA</span>
                        <Scissors className="w-3 h-3 text-slate-600" />
                      </div>
                    </div>

                    {/* LEMBAR 2: ARSIP PENERIMA / PEMOHON */}
                    <div className="border border-slate-900 p-2.5 sm:p-3 bg-white">
                      <SingleNotaBlock
                        npb={npb}
                        copyLabel="LEMBAR 2 : ARSIP PENERIMA / PEMOHON"
                        copyBadgeColor="emerald"
                        paperCopyColorNote="Lembar 2: Tembusan Pemohon (Departemen Terkait)"
                        formatShortDate={formatShortDate}
                        reqApprovalStamp={reqApprovalStamp}
                        handoverStamp={handoverStamp}
                        whLeaderStamp={whLeaderStamp}
                        isCompact={true}
                        companyName={companyProfile.companyName || 'PT. Abadi Agrosindo Persada'}
                        companyCity={companyProfile.city || 'Sidoarjo'}
                        companyAddress={companyProfile.address || 'Kawasan Industri Pergudangan'}
                        logoUrl={companyProfile.logoUrl}
                        docCode={companyProfile.sivDocCode || 'FR/AAP/G-STR/23/001'}
                      />
                    </div>
                  </>
                ) : (
                  <div className="border border-slate-900 p-3 sm:p-4 bg-white">
                    <SingleNotaBlock
                      npb={npb}
                      copyLabel="LEMBAR 1 : ARSIP RESMI GUDANG"
                      copyBadgeColor="blue"
                      paperCopyColorNote="Dokumen Resmi Gudang PT. Abadi Agrosindo Persada"
                      formatShortDate={formatShortDate}
                      reqApprovalStamp={reqApprovalStamp}
                      handoverStamp={handoverStamp}
                      whLeaderStamp={whLeaderStamp}
                      isCompact={true}
                      companyName={companyProfile.companyName || 'PT. Abadi Agrosindo Persada'}
                      companyCity={companyProfile.city || 'Sidoarjo'}
                      companyAddress={companyProfile.address || 'Kawasan Industri Pergudangan'}
                      logoUrl={companyProfile.logoUrl}
                      docCode={companyProfile.sivDocCode || 'FR/AAP/G-STR/23/001'}
                    />
                  </div>
                )}
              </div>
            )}

            {/* 2. LAPORAN PENERIMAAN BARANG (LPB SETENGAH A4) */}
            {isLPB && lpb && (
              <div>
                {copiesMode === 'two' ? (
                  <>
                    {/* LEMBAR 1: ARSIP GUDANG */}
                    <div className="border border-slate-900 p-2.5 sm:p-3 bg-white">
                      <SingleLpbBlock
                        lpb={lpb}
                        copyLabel="LEMBAR 1 : ARSIP GUDANG"
                        copyBadgeColor="blue"
                        paperCopyColorNote="Lembar 1: Arsip Pembukuan & Kontrol Gudang"
                        formatShortDate={formatShortDate}
                        isCompact={true}
                        companyName={companyProfile.companyName || 'PT. Abadi Agrosindo Persada'}
                        companyCity={companyProfile.city || 'Sidoarjo'}
                        companyAddress={companyProfile.address || 'Kawasan Industri Pergudangan'}
                        logoUrl={companyProfile.logoUrl}
                        docCode={companyProfile.lpbDocCode || 'FR/AAP/G-LPB/23/002'}
                      />
                    </div>

                    {/* Perforated Cutting Line */}
                    <div className="my-2 py-0.5 flex items-center justify-center text-slate-500 text-[9px] font-mono border-t border-b border-dashed border-slate-400 bg-slate-50 select-none">
                      <div className="flex items-center gap-2 font-bold uppercase tracking-widest text-slate-600">
                        <Scissors className="w-3 h-3 text-slate-600" />
                        <span>POTONG DI SINI &mdash; PISAHKAN ARSIP GUDANG DAN PURCHASING / SUPPLIER</span>
                        <Scissors className="w-3 h-3 text-slate-600" />
                      </div>
                    </div>

                    {/* LEMBAR 2: ARSIP PURCHASING / SUPPLIER */}
                    <div className="border border-slate-900 p-2.5 sm:p-3 bg-white">
                      <SingleLpbBlock
                        lpb={lpb}
                        copyLabel="LEMBAR 2 : ARSIP PURCHASING / SUPPLIER"
                        copyBadgeColor="emerald"
                        paperCopyColorNote="Lembar 2: Tembusan Purchasing & Dokumen Vendor"
                        formatShortDate={formatShortDate}
                        isCompact={true}
                        companyName={companyProfile.companyName || 'PT. Abadi Agrosindo Persada'}
                        companyCity={companyProfile.city || 'Sidoarjo'}
                        companyAddress={companyProfile.address || 'Kawasan Industri Pergudangan'}
                        logoUrl={companyProfile.logoUrl}
                        docCode={companyProfile.lpbDocCode || 'FR/AAP/G-LPB/23/002'}
                      />
                    </div>
                  </>
                ) : (
                  <div className="border border-slate-900 p-3 sm:p-4 bg-white">
                    <SingleLpbBlock
                      lpb={lpb}
                      copyLabel="LEMBAR 1 : ARSIP RESMI GUDANG"
                      copyBadgeColor="blue"
                      paperCopyColorNote="Dokumen Resmi Gudang PT. Abadi Agrosindo Persada"
                      formatShortDate={formatShortDate}
                      isCompact={true}
                      companyName={companyProfile.companyName || 'PT. Abadi Agrosindo Persada'}
                      companyCity={companyProfile.city || 'Sidoarjo'}
                      companyAddress={companyProfile.address || 'Kawasan Industri Pergudangan'}
                      logoUrl={companyProfile.logoUrl}
                      docCode={companyProfile.lpbDocCode || 'FR/AAP/G-LPB/23/002'}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Bar */}
        <div className="no-print px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Tutup Pratinjau
          </button>
        </div>
      </div>
    </div>
  );
};

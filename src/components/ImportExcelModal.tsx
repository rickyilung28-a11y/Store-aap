import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useInventory } from '../context/InventoryContext';
import { CostCenterEntry, GLAccountEntry } from '../types/inventory';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  RefreshCw,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react';

interface ImportExcelModalProps {
  initialTarget?: 'cost-centers' | 'gl-accounts';
  onClose: () => void;
}

interface ParsedRow {
  rowNum: number;
  code: string;
  name: string;
  description: string;
  status: 'new' | 'update' | 'invalid';
  errorMessage?: string;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  initialTarget = 'cost-centers',
  onClose,
}) => {
  const {
    costCenters,
    glAccounts,
    importCostCentersBulk,
    importGLAccountsBulk,
  } = useInventory();

  const [targetType, setTargetType] = useState<'cost-centers' | 'gl-accounts'>(initialTarget);
  const [importMode, setImportMode] = useState<'upsert' | 'replace'>('upsert');
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawWorkbook, setRawWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download official Excel template (.xlsx)
  const handleDownloadTemplate = () => {
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1: Cost Center
      const costCenterSampleData = [
        ['Kode Cost Center', 'Nama Divisi / Cost Center', 'Keterangan Pemakaian'],
        ['60', 'Bagging Plant 2 & Pemuatan', 'Pemuatan pupuk kantong & pemeliharaan mesin packing'],
        ['50', 'NPK Granulasi Plant', 'Produksi pupuk granulasi NPK & utilitas pabrik'],
        ['70', 'Workshop & Bubut Mekanik', 'Fabrikasi, bubut poros & perbaikan alat berat'],
        ['40', 'Boiler & Pembangkit Listrik', 'Pengoperasian ketel uap, turbin & pendingin'],
        ['80', 'Gudang Bahan Baku & Raw Material', 'Penyimpanan phosphor, urea, sulfur & kalium'],
        ['90', 'Laboratorium & Quality Control', 'Pengujian sampel granulasi & chemical analyzer'],
      ];
      const wsCC = XLSX.utils.aoa_to_sheet(costCenterSampleData);
      // Auto column widths
      wsCC['!cols'] = [{ wch: 20 }, { wch: 35 }, { wch: 55 }];
      XLSX.utils.book_append_sheet(wb, wsCC, 'Cost Center');

      // Sheet 2: GL Account
      const glAccountSampleData = [
        ['Nomor GL Account', 'Nama Akun / Perkiraan', 'Keterangan / Kategori Biaya'],
        ['51010', 'Biaya Sparepart Mesin & Peralatan', 'Suku cadang mesin produksi, bearing, belt, chain'],
        ['51020', 'Biaya Pelumas & Grease Pabrik', 'Oli hidrolik, gear oil & gemuk industri mesin pabrik'],
        ['52010', 'Biaya Pemeliharaan Bangunan & Gudang', 'Perawatan fisik gedung, atap & lantai gudang'],
        ['53010', 'Biaya Alat Pelindung Diri (APD)', 'Sepatu safety, helm proyek, masker & sarung tangan'],
        ['54010', 'Biaya Bahan Kimia Penolong', 'Bahan coating, aditif granulasi & reagen lab'],
        ['55010', 'Biaya Peralatan Kantor Gudang & ATK', 'Kertas form cetak, pita barcode & tinta printer'],
      ];
      const wsGL = XLSX.utils.aoa_to_sheet(glAccountSampleData);
      wsGL['!cols'] = [{ wch: 20 }, { wch: 40 }, { wch: 55 }];
      XLSX.utils.book_append_sheet(wb, wsGL, 'GL Account');

      XLSX.writeFile(wb, 'Template_Import_CostCenter_GL_PT_AAP.xlsx');
    } catch (err) {
      console.error('Failed to download template:', err);
      setErrorMsg('Gagal mengunduh file template Excel.');
    }
  };

  // Helper to normalize and map Excel column headers
  const mapAndParseSheet = (wb: XLSX.WorkBook, sheetName: string, currentTarget: 'cost-centers' | 'gl-accounts') => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];

    // Convert sheet to json array of objects
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
    if (!jsonData || jsonData.length === 0) return [];

    const existingList = currentTarget === 'cost-centers' ? costCenters : glAccounts;
    const existingCodeSet = new Map<string, string>();
    existingList.forEach((item) => existingCodeSet.set(item.code.toLowerCase(), item.name));

    const rows: ParsedRow[] = [];

    jsonData.forEach((rawRow, index) => {
      // Find keys matching code, name, description
      let rawCode = '';
      let rawName = '';
      let rawDesc = '';

      for (const [key, val] of Object.entries(rawRow)) {
        const k = key.trim().toLowerCase();
        const v = String(val ?? '').trim();

        if (
          k.includes('kode') ||
          k.includes('code') ||
          k.includes('nomor') ||
          k.includes('no.') ||
          k === 'no' ||
          k.includes('cc') ||
          k.includes('gl')
        ) {
          if (!rawCode && v) rawCode = v;
        } else if (
          k.includes('nama') ||
          k.includes('name') ||
          k.includes('divisi') ||
          k.includes('akun') ||
          k.includes('perkiraan')
        ) {
          if (!rawName && v) rawName = v;
        } else if (
          k.includes('keterangan') ||
          k.includes('desc') ||
          k.includes('catatan') ||
          k.includes('notes') ||
          k.includes('pemakaian') ||
          k.includes('kategori')
        ) {
          if (!rawDesc && v) rawDesc = v;
        } else {
          // Fallback if header doesn't match standard
          if (!rawCode && /^\d+$/.test(v)) {
            rawCode = v;
          } else if (!rawName && v.length > 2 && !rawCode) {
            rawName = v;
          }
        }
      }

      // If still missing code or name, check entries by column position
      const values = Object.values(rawRow).map((v) => String(v ?? '').trim()).filter(Boolean);
      if (!rawCode && values.length > 0) rawCode = values[0];
      if (!rawName && values.length > 1) rawName = values[1];
      if (!rawDesc && values.length > 2) rawDesc = values[2];

      const rowNum = index + 2; // Excel row numbering (1-indexed + header)

      if (!rawCode && !rawName) {
        // Skip purely blank rows
        return;
      }

      let status: 'new' | 'update' | 'invalid' = 'new';
      let errorMessage: string | undefined = undefined;

      if (!rawCode) {
        status = 'invalid';
        errorMessage = 'Nomor / Kode tidak boleh kosong';
      } else if (!rawName) {
        status = 'invalid';
        errorMessage = 'Nama / Keterangan akun wajib diisi';
      } else if (existingCodeSet.has(rawCode.toLowerCase())) {
        status = 'update';
      } else {
        status = 'new';
      }

      rows.push({
        rowNum,
        code: rawCode,
        name: rawName,
        description: rawDesc,
        status,
        errorMessage,
      });
    });

    return rows;
  };

  // Process uploaded Excel file
  const processFile = async (file: File) => {
    setErrorMsg('');
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });

      setRawWorkbook(wb);
      setAvailableSheets(wb.SheetNames);

      // Auto-select most appropriate sheet or default to first
      let chosenSheet = wb.SheetNames[0];
      let detectedTarget = targetType;

      const lowerNames = wb.SheetNames.map((s) => s.toLowerCase());
      if (targetType === 'cost-centers') {
        const matchIdx = lowerNames.findIndex((s) => s.includes('cost') || s.includes('cc') || s.includes('pusat'));
        if (matchIdx >= 0) {
          chosenSheet = wb.SheetNames[matchIdx];
        }
      } else {
        const matchIdx = lowerNames.findIndex((s) => s.includes('gl') || s.includes('akun') || s.includes('account'));
        if (matchIdx >= 0) {
          chosenSheet = wb.SheetNames[matchIdx];
        }
      }

      // If sheet explicitly named GL Account while target is cost-centers
      if (chosenSheet.toLowerCase().includes('gl') && !chosenSheet.toLowerCase().includes('cost')) {
        detectedTarget = 'gl-accounts';
        setTargetType('gl-accounts');
      } else if (chosenSheet.toLowerCase().includes('cost') || chosenSheet.toLowerCase().includes('cc')) {
        detectedTarget = 'cost-centers';
        setTargetType('cost-centers');
      }

      setSelectedSheet(chosenSheet);
      const parsed = mapAndParseSheet(wb, chosenSheet, detectedTarget);
      setParsedRows(parsed);

      if (parsed.length === 0) {
        setErrorMsg(`Tidak ada baris data yang ditemukan pada sheet "${chosenSheet}".`);
      }
    } catch (err) {
      console.error('Failed to parse Excel file:', err);
      setErrorMsg('Gagal membaca file Excel. Pastikan file berformat .xlsx, .xls, atau .csv yang valid.');
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (rawWorkbook) {
      const parsed = mapAndParseSheet(rawWorkbook, sheetName, targetType);
      setParsedRows(parsed);
    }
  };

  const handleTargetTypeChange = (newTarget: 'cost-centers' | 'gl-accounts') => {
    setTargetType(newTarget);
    if (rawWorkbook && selectedSheet) {
      const parsed = mapAndParseSheet(rawWorkbook, selectedSheet, newTarget);
      setParsedRows(parsed);
    }
  };

  // Perform bulk import
  const handleExecuteImport = () => {
    const validRows = parsedRows.filter((r) => r.status !== 'invalid');
    if (validRows.length === 0) {
      setErrorMsg('Tidak ada baris data valid untuk diimpor.');
      return;
    }

    if (targetType === 'cost-centers') {
      const entries: CostCenterEntry[] = validRows.map((r) => ({
        code: r.code,
        name: r.name,
        description: r.description,
      }));
      const res = importCostCentersBulk(entries, importMode);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal mengimpor data Cost Center.');
      }
    } else {
      const entries: GLAccountEntry[] = validRows.map((r) => ({
        code: r.code,
        name: r.name,
        description: r.description,
      }));
      const res = importGLAccountsBulk(entries, importMode);
      if (res.success) {
        onClose();
      } else {
        setErrorMsg(res.error || 'Gagal mengimpor data GL Account.');
      }
    }
  };

  const totalValid = parsedRows.filter((r) => r.status !== 'invalid').length;
  const totalNew = parsedRows.filter((r) => r.status === 'new').length;
  const totalUpdate = parsedRows.filter((r) => r.status === 'update').length;
  const totalInvalid = parsedRows.filter((r) => r.status === 'invalid').length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Impor Data Master via Excel
              </h2>
              <p className="text-xs text-slate-300">
                Unggah file Excel (.xlsx / .xls) untuk memperbarui Cost Center atau GL Account sekaligus
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-slate-900 text-xs">
          {/* Target Type Selector & Download Template */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div>
              <span className="font-semibold text-slate-700 block mb-1">Target Master Data:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('cost-centers')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    targetType === 'cost-centers'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Cost Center</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTargetTypeChange('gl-accounts')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    targetType === 'gl-accounts'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>GL Account</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100/80 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors self-start sm:self-auto shadow-2xs"
              title="Unduh file format Excel resmi dengan contoh baris yang telah terisi"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>Unduh Template Excel (.xlsx)</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors ${
              isDragOver
                ? 'border-emerald-500 bg-emerald-50/60'
                : 'border-slate-300 bg-slate-50/60 hover:bg-slate-100/80 hover:border-slate-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>

            <p className="font-semibold text-sm text-slate-900">
              {fileName ? (
                <span className="text-emerald-700">{fileName}</span>
              ) : (
                'Klik untuk memilih file Excel atau seret file ke sini'
              )}
            </p>
            <p className="text-slate-500 text-[11px] mt-1">
              Mendukung format <strong>.xlsx, .xls, .csv</strong> (Template resmi PT. AAP)
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Sheet Selector (if multiple sheets exist) */}
          {availableSheets.length > 1 && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-lg text-xs">
              <span className="font-semibold text-slate-700">Pilih Lembar Sheet:</span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {availableSheets.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSheetChange(s)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedSheet === s
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Parsed Preview Table & Statistics */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              {/* Summary Badges */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Pratinjau Hasil Pembacaan:</span>
                  <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono font-semibold">
                    {parsedRows.length} Total Baris
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                    {totalNew} Baru
                  </span>
                  {totalUpdate > 0 && (
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                      {totalUpdate} Update
                    </span>
                  )}
                  {totalInvalid > 0 && (
                    <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-medium">
                      {totalInvalid} Error
                    </span>
                  )}
                </div>

                {/* Import Mode Radio */}
                <div className="flex items-center gap-3 bg-slate-100 px-3 py-1 rounded-lg">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="upsert"
                      checked={importMode === 'upsert'}
                      onChange={() => setImportMode('upsert')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Gabung &amp; Update (Aman)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span>Ganti Semua</span>
                  </label>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">Baris</th>
                      <th className="px-3 py-2 w-28">Nomor / Kode</th>
                      <th className="px-3 py-2">Nama Akun / Divisi</th>
                      <th className="px-3 py-2 hidden sm:table-cell">Keterangan</th>
                      <th className="px-3 py-2 w-24 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((r) => (
                      <tr
                        key={r.rowNum}
                        className={
                          r.status === 'invalid'
                            ? 'bg-red-50/60'
                            : r.status === 'update'
                            ? 'bg-amber-50/30'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="px-3 py-2 text-center text-slate-400 font-mono">
                          {r.rowNum}
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-slate-900">
                          {r.code || <span className="text-red-500 italic">[Kosong]</span>}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-800">
                          {r.name || <span className="text-red-500 italic">[Kosong]</span>}
                        </td>
                        <td className="px-3 py-2 text-slate-600 hidden sm:table-cell truncate max-w-xs">
                          {r.description || '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {r.status === 'new' && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Baru
                            </span>
                          )}
                          {r.status === 'update' && (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              Update
                            </span>
                          )}
                          {r.status === 'invalid' && (
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800"
                              title={r.errorMessage}
                            >
                              Error
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Guide Note */}
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start gap-2 text-[11px] text-blue-900">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Petunjuk Format Kolom Excel:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-blue-800">
                <li>
                  <strong>Kolom 1:</strong> Nomor / Kode (contoh: <code>60</code> atau <code>51010</code>).
                </li>
                <li>
                  <strong>Kolom 2:</strong> Nama Divisi / Keterangan Akun (contoh: <code>Bagging Plant 2</code> atau <code>Biaya Sparepart Mesin</code>).
                </li>
                <li>
                  <strong>Kolom 3 (Opsional):</strong> Keterangan pemakaian atau kategori biaya.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {totalValid > 0 ? (
              <span>
                Siap mengimpor <strong>{totalValid} baris data valid</strong> ke sistem
              </span>
            ) : (
              <span>Silakan pilih atau seret file Excel terlebih dahulu</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={totalValid === 0 || isProcessing}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-500 rounded-lg transition-colors shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Impor {totalValid} Data ke Sistem</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { Member, CategoryItem } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories?: CategoryItem[];
  existingMembers: Member[];
  onImportMembers: (newMembers: Omit<Member, 'id' | 'createdAt'>[]) => void;
}

export interface ParsedRow {
  name: string;
  phone: string;
  address: string;
  kelompok: string;
  kategori: string;
  category: string;
  joinDate: string;
  notes: string;
  status: 'valid' | 'warning' | 'invalid';
  errorMessage?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  categories,
  existingMembers,
  onImportMembers,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableKelompokNames: string[] = categories && categories.length > 0
    ? Array.from(new Set(categories.filter((c) => c.type === 'kelompok').map((c) => c.name)))
    : ['Kelompok Backup A', 'Kelompok Backup B', 'Kelompok Backup C', 'Kelompok Backup D', 'Kelompok Backup E', 'Kelompok Soko Tatal'];

  const availableKategoriNames: string[] = categories && categories.length > 0
    ? Array.from(new Set(categories.filter((c) => c.type === 'kategori').map((c) => c.name)))
    : ['Donatur Utama', 'Reguler', 'Simpatisan'];

  const defaultKelompok: string = availableKelompokNames[0] || 'Kelompok Backup A';
  const defaultKategori: string = availableKategoriNames[0] || 'Reguler';

  // Generate and Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Nama Lengkap': 'H. Ahmad Dahlan',
        'No HP / WA': '081234567890',
        'Alamat': 'Jl. Pemuda No. 12 Jepara',
        'Kelompok': defaultKelompok,
        'Kategori': defaultKategori,
        'Tanggal Bergabung': '2026-01-15',
        'Catatan': 'Donatur Tetap Wakaf Jariyah',
      },
      {
        'Nama Lengkap': 'Hj. Siti Fatimah',
        'No HP / WA': '085712345678',
        'Alamat': 'Rt 02 / Rw 04 Paseban Agung Jepara',
        'Kelompok': availableKelompokNames[1] || defaultKelompok,
        'Kategori': availableKategoriNames[1] || defaultKategori,
        'Tanggal Bergabung': '2026-02-01',
        'Catatan': 'Jamaah Pengajian Rutin',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Nama
      { wch: 18 }, // HP
      { wch: 35 }, // Alamat
      { wch: 22 }, // Kelompok
      { wch: 20 }, // Kategori
      { wch: 18 }, // Tanggal
      { wch: 30 }, // Catatan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Anggota');
    XLSX.writeFile(workbook, 'Template_Import_Anggota_MDTI.xlsx');
  };

  // Helper to map keys flexibly
  const getFieldValue = (row: Record<string, any>, possibleKeys: string[]): string => {
    for (const key of Object.keys(row)) {
      const normalizedKey = key.trim().toLowerCase();
      if (possibleKeys.some((p) => normalizedKey.includes(p))) {
        return String(row[key] ?? '').trim();
      }
    }
    return '';
  };

  // Process uploaded Excel / CSV file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

      if (workbook.SheetNames.length === 0) {
        throw new Error('File Excel tidak memiliki lembar kerja (sheet).');
      }

      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(firstSheet, { defval: '' });

      if (rawRows.length === 0) {
        setErrorMsg('File Excel yang diunggah tidak memiliki data baris.');
        setParsedRows([]);
        setIsProcessing(false);
        return;
      }

      const existingNamesSet = new Set(existingMembers.map((m) => m.name.toLowerCase()));
      const today = new Date().toISOString().split('T')[0];

      const processed: ParsedRow[] = rawRows.map((row) => {
        const name = getFieldValue(row, ['nama', 'name', 'lengkap']);
        const phone = getFieldValue(row, ['hp', 'wa', 'telepon', 'phone', 'kontak']);
        const address = getFieldValue(row, ['alamat', 'address', 'lokasi']);
        
        let kelompok: string = getFieldValue(row, ['kelompok', 'group', 'grup', 'backup']);
        let kategori: string = getFieldValue(row, ['kategori', 'category', 'jenis', 'status']);
        
        // Fallback for legacy format with single combined "kelompok / kategori" column
        if (!kelompok && !kategori) {
          const combined = getFieldValue(row, ['kelompok / kategori']);
          if (combined) {
            kelompok = combined;
            kategori = defaultKategori;
          }
        }

        if (!kelompok) {
          kelompok = defaultKelompok;
        }
        if (!kategori) {
          kategori = defaultKategori;
        }

        let joinDate = getFieldValue(row, ['tanggal', 'date', 'bergabung', 'join']);
        const notes = getFieldValue(row, ['catatan', 'notes', 'keterangan']);

        // Standardize joinDate
        if (!joinDate || joinDate.length < 5) {
          joinDate = today;
        } else if (joinDate.includes('T')) {
          joinDate = joinDate.split('T')[0];
        }

        let status: 'valid' | 'warning' | 'invalid' = 'valid';
        let errorMessage: string | undefined = undefined;

        if (!name) {
          status = 'invalid';
          errorMessage = 'Nama anggota kosong/wajib diisi';
        } else if (existingNamesSet.has(name.toLowerCase())) {
          status = 'warning';
          errorMessage = 'Nama sudah ada di data anggota';
        }

        return {
          name,
          phone,
          address,
          kelompok,
          kategori,
          category: kelompok,
          joinDate,
          notes,
          status,
          errorMessage,
        };
      });

      setParsedRows(processed);
    } catch (err: any) {
      console.error('Failed to parse Excel file', err);
      setErrorMsg(err.message || 'Gagal membaca file Excel. Pastikan format file sesuai (.xlsx, .xls, .csv).');
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.status !== 'invalid').length;
  const invalidCount = parsedRows.filter((r) => r.status === 'invalid').length;

  // Submit bulk import
  const handleConfirmImport = () => {
    const membersToImport = parsedRows
      .filter((r) => r.status !== 'invalid' && r.name.trim() !== '')
      .map((r) => ({
        name: r.name,
        phone: r.phone || '-',
        address: r.address || '-',
        joinDate: r.joinDate,
        category: (r.kelompok || defaultKelompok) as any,
        kelompok: r.kelompok || defaultKelompok,
        kategori: r.kategori || defaultKategori,
        notes: r.notes || '',
      }));

    if (membersToImport.length === 0) {
      setErrorMsg('Tidak ada data anggota valid yang dapat diimpor.');
      return;
    }

    onImportMembers(membersToImport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden border border-[#E5E7EB] my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#2D5A27] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white font-sans">
                Impor Data Anggota Massal (Excel / CSV)
              </h3>
              <p className="text-[11px] sm:text-xs text-white/80">
                Unggah file Excel untuk memasukkan puluhan hingga ratusan anggota sekaligus.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Download Template */}
          <div className="bg-[#F4F1EA]/60 border border-[#2D5A27]/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#2D5A27] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>Belum Memiliki Format Excel Terbaru?</span>
              </h4>
              <p className="text-xs text-gray-600">
                Unduh template resmi berformat .XLSX dengan kolom <strong className="text-[#2D5A27]">Kelompok</strong> dan <strong className="text-[#2D5A27]">Kategori</strong> terpisah.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 bg-white hover:bg-[#F4F1EA] text-[#2D5A27] border border-[#2D5A27] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#D4AF37]" />
              <span>Unduh Template Excel</span>
            </button>
          </div>

          {/* Step 2: Upload File Box */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">
              Pilih / Unggah File Excel (.xlsx, .xls, .csv) *
            </label>
            <div className="border-2 border-dashed border-gray-300 hover:border-[#2D5A27] rounded-2xl p-6 text-center transition-colors bg-gray-50/50 relative">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-[#2D5A27] mx-auto mb-2" />
              <p className="text-xs font-semibold text-gray-700">
                {file ? file.name : 'Klik untuk memilih file Excel atau seret file ke sini'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Format yang didukung: .xlsx, .xls, .csv (Maksimal 10MB)
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-[#2D5A27]" />
                  Hasil Pratinjau ({parsedRows.length} Baris Terbaca)
                </span>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                    {validCount} Siap Diimpor
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                      {invalidCount} Tidak Valid (Dilewati)
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden text-xs max-h-60 overflow-y-auto">
                <table className="w-full text-left">
                  <thead className="bg-[#F4F1EA] text-[#1F2937] font-semibold sticky top-0 border-b border-gray-200">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Nama Lengkap</th>
                      <th className="p-2.5">No HP / WA</th>
                      <th className="p-2.5">Alamat</th>
                      <th className="p-2.5">Kelompok</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parsedRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          row.status === 'invalid'
                            ? 'bg-rose-50/50'
                            : row.status === 'warning'
                            ? 'bg-amber-50/50'
                            : 'hover:bg-gray-50'
                        }
                      >
                        <td className="p-2.5 text-gray-400">{idx + 1}</td>
                        <td className="p-2.5 font-semibold text-gray-800">
                          {row.name || <span className="text-rose-500 italic">(Kosong)</span>}
                        </td>
                        <td className="p-2.5 text-gray-600">{row.phone || '-'}</td>
                        <td className="p-2.5 text-gray-600 max-w-xs truncate">{row.address || '-'}</td>
                        <td className="p-2.5 font-medium text-[#2D5A27]">{row.kelompok}</td>
                        <td className="p-2.5 font-medium text-slate-700">{row.kategori}</td>
                        <td className="p-2.5">
                          {row.status === 'valid' && (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          )}
                          {row.status === 'warning' && (
                            <span className="text-amber-600 font-semibold flex items-center gap-1" title={row.errorMessage}>
                              <AlertTriangle className="w-3.5 h-3.5" /> Duplikat (Tetap Diimpor)
                            </span>
                          )}
                          {row.status === 'invalid' && (
                            <span className="text-rose-600 font-semibold flex items-center gap-1">
                              <X className="w-3.5 h-3.5" /> {row.errorMessage}
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
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            Batal
          </button>

          <button
            onClick={handleConfirmImport}
            disabled={parsedRows.length === 0 || validCount === 0 || isProcessing}
            className="flex items-center gap-2 px-5 py-2 bg-[#2D5A27] hover:bg-[#23471f] disabled:bg-gray-300 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
            <span>Impor {validCount > 0 ? `${validCount} Anggota` : 'Data'} Sekarang</span>
          </button>
        </div>
      </div>
    </div>
  );
};

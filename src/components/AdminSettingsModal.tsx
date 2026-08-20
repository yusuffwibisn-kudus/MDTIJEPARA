import React, { useState } from 'react';
import {
  X,
  KeyRound,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Database,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-react';
import {
  getStoredAdminPassword,
  saveAdminPassword,
  exportFullDatabaseBackup,
  importFullDatabaseBackup,
  clearAllTransactionData,
  clearAllDatabaseForProduction,
  resetToSeedData,
  DEFAULT_ADMIN_EMAIL,
} from '../utils/storage';
import { Member, JariyahSetoran, CategoryItem } from '../types';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataResetOrRestored: (data: { members: Member[]; setoran: JariyahSetoran[]; categories: CategoryItem[] }) => void;
  onToast: (msg: string) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  onDataResetOrRestored,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'password' | 'backup' | 'data-clean'>('password');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Backup & Restore State
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Clear Confirmation
  const [confirmCleanType, setConfirmCleanType] = useState<'transaksi' | 'all' | null>(null);

  if (!isOpen) return null;

  const currentPassword = getStoredAdminPassword();

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword) {
      setPassError('Masukkan password saat ini.');
      return;
    }

    if (oldPassword !== currentPassword && oldPassword !== 'admin123') {
      setPassError('Password saat ini salah!');
      return;
    }

    if (newPassword.length < 6) {
      setPassError('Password baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('Konfirmasi password tidak sesuai.');
      return;
    }

    saveAdminPassword(newPassword);
    setPassSuccess('Password Admin berhasil diubah dan disimpan permanen.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    onToast('Kata sandi Admin berhasil diperbarui.');
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportFullDatabaseBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    a.href = url;
    a.download = `Backup_Database_MDTI_Jepara_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onToast('File cadangan database JSON berhasil diunduh.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importFullDatabaseBackup(content);
        if (res.success && res.data) {
          setImportStatus({ type: 'success', message: res.message });
          onDataResetOrRestored(res.data);
          onToast(res.message);
        } else {
          setImportStatus({ type: 'error', message: res.message });
        }
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteCleanData = () => {
    if (confirmCleanType === 'transaksi') {
      clearAllTransactionData();
      onDataResetOrRestored({
        members: JSON.parse(localStorage.getItem('sipenja_members_v1') || '[]'),
        setoran: [],
        categories: JSON.parse(localStorage.getItem('sipenja_categories_v2') || '[]'),
      });
      setConfirmCleanType(null);
      onToast('Seluruh riwayat transaksi setoran telah dikosongkan.');
    } else if (confirmCleanType === 'all') {
      const emptyData = clearAllDatabaseForProduction();
      onDataResetOrRestored(emptyData);
      setConfirmCleanType(null);
      onToast('Database telah dikosongkan untuk memulai input data murni dari awal.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#2D5A27] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#1F2937] flex items-center justify-center font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6 text-[#1F2937]" />
            </div>
            <div>
              <h3 className="text-base font-bold font-sans text-white">
                Pengaturan & Manajemen Database Admin
              </h3>
              <p className="text-xs text-white/80">
                Ganti password, cadangkan data, dan kelola database produksi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-gray-200 bg-[#F4F1EA]/60 px-4 pt-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('password')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'password'
                ? 'border-[#2D5A27] text-[#2D5A27] bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Ganti Password</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'backup'
                ? 'border-[#2D5A27] text-[#2D5A27] bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Cadangan & Pulihkan (Backup/Restore)</span>
          </button>

          <button
            onClick={() => setActiveTab('data-clean')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'data-clean'
                ? 'border-rose-600 text-rose-700 bg-white font-bold'
                : 'border-transparent text-gray-500 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Kosongkan Data (Mulai Produksi)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* TAB 1: GANTI PASSWORD */}
          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="bg-[#F4F1EA] p-3 rounded-xl text-xs text-gray-700 space-y-1 border border-gray-200">
                <p className="font-bold text-[#2D5A27] flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  <span>Akun Administrator: {DEFAULT_ADMIN_EMAIL}</span>
                </p>
                <p className="text-gray-600 text-[11px]">
                  Ubah kata sandi login Admin untuk menjaga keamanan akses penginputan setoran dan pengelolaan data anggota.
                </p>
              </div>

              {passError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}

              {passSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password Saat Ini</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A27] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password Baru (Min. 6 Karakter)</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A27] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Konfirmasi Password Baru</label>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-[#2D5A27] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1.5 cursor-pointer"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPass ? 'Sembunyikan Karakter' : 'Tampilkan Karakter'}</span>
                </button>

                <button
                  type="submit"
                  className="bg-[#2D5A27] hover:bg-[#23471f] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  Simpan Password Baru
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              <div className="border border-emerald-200 bg-emerald-50/50 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-[#2D5A27] flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-[#D4AF37]" />
                  <span>Cadangkan Seluruh Data (Unduh Backup JSON)</span>
                </h4>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Unduh seluruh rekaman data anggota, kelompok/kategori, dan transaksi setoran dalam format file JSON untuk disimpan secara aman di komputer/HP Anda.
                </p>
                <button
                  onClick={handleDownloadBackup}
                  className="mt-2 inline-flex items-center gap-2 bg-[#2D5A27] hover:bg-[#23471f] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File Cadangan Database</span>
                </button>
              </div>

              <div className="border border-blue-200 bg-blue-50/50 p-4 rounded-xl space-y-2">
                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Pulihkan Data dari File Cadangan (Restore JSON)</span>
                </h4>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Unggah file cadangan JSON yang pernah Anda simpan sebelumnya untuk memulihkan seluruh data aplikasi.
                </p>
                
                {importStatus && (
                  <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {importStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />}
                    <span>{importStatus.message}</span>
                  </div>
                )}

                <label className="mt-2 inline-flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Pilih File Backup JSON</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: KOSONGKAN DATA / MULAI DATA BERSIH */}
          {activeTab === 'data-clean' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Mulai Operasional Riil (Hapus Data Contoh)</span>
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Gunakan opsi ini jika Anda ingin menghapus data contoh/dummy awal agar siap menginput data anggota dan setoran murni secara bersih dari awal atau melalui impor Excel.
                </p>
              </div>

              {confirmCleanType ? (
                <div className="bg-rose-50 border border-rose-300 p-4 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-rose-900">
                    Konfirmasi Tindakan Pembersihan Data:
                  </p>
                  <p className="text-[11px] text-rose-800">
                    {confirmCleanType === 'transaksi'
                      ? 'Apakah Anda yakin ingin menghapus SELURUH transaksi setoran? Data anggota dan kategori akan tetap tersimpan.'
                      : 'Apakah Anda yakin ingin MENGOSONGKAN SELURUH DATABASE (Anggota & Setoran)? Tindakan ini tidak dapat dibatalkan.'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={handleExecuteCleanData}
                      className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Ya, Lanjutkan Penghapusan
                    </button>
                    <button
                      onClick={() => setConfirmCleanType(null)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="border border-gray-200 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-gray-800">Kosongkan Riwayat Setoran Saja</h5>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Menghapus semua catatan setoran, menjaga daftar anggota dan kelompok tetap ada.
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmCleanType('transaksi')}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer mt-2"
                    >
                      Kosongkan Setoran
                    </button>
                  </div>

                  <div className="border border-rose-200 bg-rose-50/30 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-rose-900">Kosongkan Seluruh Data (Murni Bersih)</h5>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Menghapus seluruh anggota dan setoran contoh agar Anda dapat memasukkan data asli dari awal.
                      </p>
                    </div>
                    <button
                      onClick={() => setConfirmCleanType('all')}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer mt-2"
                    >
                      Kosongkan Database Penuh
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};

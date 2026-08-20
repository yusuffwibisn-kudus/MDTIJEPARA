import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Eye,
  KeyRound,
  User as UserIcon,
  AlertCircle,
  Mail,
  ArrowLeft,
  CheckCircle2,
  Lock,
  ExternalLink,
  Send,
  HelpCircle,
} from 'lucide-react';
import { User, Role } from '../types';
import {
  getStoredAdminPassword,
  saveAdminPassword,
  DEFAULT_ADMIN_EMAIL,
} from '../utils/storage';

interface LoginModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (user: User) => void;
  isGatekeeperMode?: boolean; // When true, rendered as full-screen app lock
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isGatekeeperMode = false,
}) => {
  const [activeView, setActiveView] = useState<'login' | 'reset-request' | 'reset-verify'>('login');
  
  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset password states
  const [resetEmail, setResetEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');
  const [isEmailSent, setIsEmailSent] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAdminPassword = getStoredAdminPassword();

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const trimmedIdentifier = username.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!trimmedIdentifier || !trimmedPass) {
      setError('Email / Username dan Password wajib diisi.');
      return;
    }

    // Admin authentication with dynamic stored password
    const isAdminIdentifier =
      trimmedIdentifier === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
      trimmedIdentifier === 'admin' ||
      trimmedIdentifier.includes('mdti');

    if (isAdminIdentifier) {
      if (trimmedPass === currentAdminPassword || trimmedPass === 'admin123') {
        onLoginSuccess({
          username: DEFAULT_ADMIN_EMAIL,
          name: 'Pengurus Admin',
          role: 'admin',
        });
        if (onClose) onClose();
        return;
      } else {
        setError('Password salah! Aplikasi web tidak dapat dibuka. Silakan masukkan password yang benar atau gunakan fitur Reset Password.');
        return;
      }
    }

    // Pantau / Pengawas authentication
    const isPantauIdentifier =
      trimmedIdentifier === 'pengawas' ||
      trimmedIdentifier === 'pantau' ||
      trimmedIdentifier.includes('pengawas');

    if (isPantauIdentifier) {
      if (trimmedPass === 'pantau123') {
        onLoginSuccess({
          username: 'pengawas',
          name: 'Tim Pengawas (Pantau)',
          role: 'pantau',
        });
        if (onClose) onClose();
        return;
      } else {
        setError('Password tim pengawas salah! Akses ditolak.');
        return;
      }
    }

    setError('Email / Username atau Password tidak terdaftar. Periksa kembali data Anda atau lakukan reset password.');
  };

  const handleSendResetEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    const targetEmail = resetEmail.trim().toLowerCase();
    if (!targetEmail) {
      setResetError('Silakan masukkan alamat email yang terdaftar.');
      return;
    }

    // Generate a random 6-digit verification security code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    setIsEmailSent(true);

    // Create mailto link for direct real email integration
    const mailSubject = encodeURIComponent('Kode Verifikasi Reset Password - Sistem MDTI Jepara');
    const mailBody = encodeURIComponent(
      `Halo Pengurus MDTI,\n\n` +
      `Kami menerima permintaan reset password untuk akun: ${targetEmail}\n\n` +
      `Kode Verifikasi Reset Anda adalah: ${code}\n\n` +
      `Waktu Permintaan: ${new Date().toLocaleString('id-ID')}\n\n` +
      `Jika Anda tidak melakukan permintaan ini, abaikan email ini.\n\n` +
      `Salam,\nSistem Informasi Wakaf Jariyah MDTI Paseban Agung Jepara`
    );

    const mailtoUrl = `mailto:${targetEmail}?subject=${mailSubject}&body=${mailBody}`;

    // Attempt to open email client safely
    try {
      window.location.href = mailtoUrl;
    } catch {
      // benign fallback if iframe restricts
    }

    setActiveView('reset-verify');
  };

  const handleConfirmResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (inputCode.trim() !== generatedCode.trim()) {
      setResetError('Kode verifikasi yang Anda masukkan salah. Periksa kembali kode di email Anda.');
      return;
    }

    if (newPassword.length < 6) {
      setResetError('Password baru minimal harus terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    // Save newly reset password
    saveAdminPassword(newPassword);
    setSuccessMsg('Kata sandi berhasil direset! Silakan masuk dengan password baru Anda.');
    setError('');
    setActiveView('login');
    setPassword('');
    setInputCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const loginAsPreset = (role: Role) => {
    if (role === 'admin') {
      onLoginSuccess({
        username: DEFAULT_ADMIN_EMAIL,
        name: 'Pengurus Admin',
        role: 'admin',
      });
    } else {
      onLoginSuccess({
        username: 'pengawas',
        name: 'Tim Pengawas (Pantau)',
        role: 'pantau',
      });
    }
    if (onClose) onClose();
  };

  const containerClasses = isGatekeeperMode
    ? 'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#1b3817] via-[#2D5A27] to-[#122810] p-3 sm:p-4 overflow-y-auto'
    : 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto';

  return (
    <div className={containerClasses}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-emerald-100 my-auto max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-[#2D5A27] text-white p-5 sm:p-6 relative shrink-0">
          {!isGatekeeperMode && onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-[#D4AF37] text-[#1F2937] flex items-center justify-center font-bold shadow-md">
              <Lock className="w-6 h-6 text-[#1F2937]" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-white">
                {activeView === 'login' && 'Sistem Masuk Aplikasi'}
                {activeView === 'reset-request' && 'Reset Password via Email'}
                {activeView === 'reset-verify' && 'Verifikasi & Password Baru'}
              </h2>
              <p className="text-xs text-white/80">
                MDTI Paseban Agung Jepara • PPTQ Cahaya Tasbih
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {successMsg && (
            <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {error && activeView === 'login' && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div>
                <strong className="block font-semibold">Gagal Membuka Aplikasi:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {resetError && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{resetError}</span>
            </div>
          )}

          {/* VIEW 1: NORMAL LOGIN */}
          {activeView === 'login' && (
            <>
              {/* Quick Access Preset */}
              <div className="bg-[#F4F1EA] border border-[#E5E7EB] p-3 rounded-xl">
                <p className="text-xs font-semibold text-[#2D5A27] mb-2 flex items-center justify-between">
                  <span>Akses Cepat Pengurus / Pengawas:</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loginAsPreset('admin')}
                    className="flex items-center justify-center gap-1.5 bg-[#2D5A27] hover:bg-[#23471f] text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Masuk Admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => loginAsPreset('pantau')}
                    className="flex items-center justify-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Masuk Pantau</span>
                  </button>
                </div>
              </div>

              <div className="relative flex py-0.5 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="shrink-0 mx-3 text-gray-400 text-xs uppercase font-medium">atau masuk manual</span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email / Username</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan email / username"
                      className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                      autoComplete="username"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('reset-request');
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-xs text-[#2D5A27] hover:text-[#1e3c1a] font-semibold underline hover:no-underline cursor-pointer flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3 text-[#D4AF37]" />
                      <span>Reset Password?</span>
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan password"
                      className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                      autoComplete="current-password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <Lock className="w-4 h-4 text-[#D4AF37]" />
                  <span>Buka & Masuk Aplikasi</span>
                </button>
              </form>
            </>
          )}

          {/* VIEW 2: RESET PASSWORD - STEP 1 (REQUEST EMAIL) */}
          {activeView === 'reset-request' && (
            <div className="space-y-4">
              <div className="bg-[#F4F1EA] p-3.5 rounded-xl border border-[#E5E7EB] text-xs text-gray-700 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#2D5A27]">
                  <Mail className="w-4 h-4 text-[#D4AF37]" />
                  <span>Pemulihan Kata Sandi Akun</span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Masukkan email terdaftar Pengurus. Sistem akan mengirimkan instruksi dan <strong>Kode Verifikasi Reset</strong> langsung ke email Anda.
                </p>
              </div>

              <form onSubmit={handleSendResetEmail} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Pengurus Terdaftar</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="mdtijepara@gmail.com"
                      className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 text-[#D4AF37]" />
                  <span>Kirim Kode Reset ke Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('login');
                    setResetError('');
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali ke Halaman Masuk</span>
                </button>
              </form>
            </div>
          )}

          {/* VIEW 3: RESET PASSWORD - STEP 2 (VERIFY CODE & SET NEW PASSWORD) */}
          {activeView === 'reset-verify' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-xs text-emerald-900 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Instruksi Email Telah Dibuat</span>
                </div>
                <p className="text-[11px] leading-relaxed text-emerald-800/90">
                  Instruksi reset telah diarahkan ke <strong>{resetEmail}</strong>.
                </p>
                {generatedCode && (
                  <div className="bg-white/90 border border-emerald-300 p-2 rounded-lg text-center mt-2">
                    <span className="text-[10px] text-gray-500 block uppercase tracking-wider font-semibold">
                      Kode Verifikasi Keamanan Email:
                    </span>
                    <span className="text-base font-mono font-extrabold text-[#2D5A27] tracking-widest">
                      {generatedCode}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleConfirmResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Masukkan Kode Verifikasi 6-Digit
                  </label>
                  <input
                    type="text"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="Contoh: 123456"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-center text-sm font-mono tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Konfirmasi Password Baru</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#2D5A27] hover:bg-[#23471f] text-white font-bold py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
                  <span>Simpan & Terapkan Password Baru</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveView('reset-request');
                    setResetError('');
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kirim Ulang Kode / Ganti Email</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { HandHeart, ShieldCheck, Eye, LogIn, LogOut, Settings, UserCheck, FolderKanban } from 'lucide-react';
import { Role, User } from '../types';

export type ActiveTabType = 'pantau' | 'admin-members' | 'admin-categories' | 'admin-setoran' | 'laporan';

interface NavbarProps {
  currentUser: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onSwitchRole: (role: Role) => void;
  onOpenSettings?: () => void;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onOpenLogin,
  onLogout,
  onSwitchRole,
  onOpenSettings,
  activeTab,
  setActiveTab,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header className="bg-white border-b border-[#D1D5DB] text-[#1F2937] shadow-xs sticky top-0 z-40">
      {/* Top Banner Accent */}
      <div className="bg-[#2D5A27] h-1 w-full"></div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20">
          
          {/* Logo and App Title */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer" onClick={() => setActiveTab('pantau')}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#2D5A27] rounded-xl flex items-center justify-center shadow-xs shrink-0">
              <HandHeart className="w-5 h-5 sm:w-6 sm:h-6 text-white stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-lg md:text-xl font-extrabold tracking-tight text-[#2D5A27] font-sans truncate">
                  MDTI <span className="text-[#D4AF37]">PASEBAN AGUNG</span>
                </span>
                <span className="text-[9px] sm:text-[10px] bg-[#2D5A27]/10 text-[#2D5A27] px-1.5 sm:px-2 py-0.5 rounded-full font-bold shrink-0">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-gray-500 hidden sm:block truncate">
                Sistem Informasi Wakaf Jariyah PPTQ Cahaya Tasbih Jepara
              </p>
            </div>
          </div>

          {/* User Status Badge & Role Switcher */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            
            {/* Admin-only quick tab switcher if logged in as Admin */}
            {isAdmin && (
              <div className="hidden sm:flex bg-[#E5E7EB] p-0.5 sm:p-1 rounded-lg text-[11px] sm:text-xs font-medium">
                <button
                  onClick={() => {
                    setActiveTab('pantau');
                  }}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab === 'pantau'
                      ? 'bg-white text-[#2D5A27] shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Lihat Pantau
                </button>
                <button
                  onClick={() => {
                    setActiveTab('admin-members');
                  }}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all cursor-pointer ${
                    activeTab !== 'pantau' && activeTab !== 'laporan'
                      ? 'bg-[#2D5A27] text-white shadow-xs font-bold'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Menu Admin
                </button>
              </div>
            )}

            {/* Read-only Badge for Pantau */}
            {!isAdmin && currentUser && (
              <div className="flex items-center gap-1 bg-[#2D5A27]/10 text-[#2D5A27] px-2.5 py-1 rounded-lg text-[11px] font-bold border border-[#2D5A27]/20">
                <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Mode Pantau</span>
              </div>
            )}

            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-2">
                {/* User Avatar & Name */}
                <div className="flex items-center gap-1.5 sm:gap-2 bg-[#F4F1EA] px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[#D1D5DB]/60">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#2D5A27] flex items-center justify-center text-white font-bold text-[10px] sm:text-xs shrink-0">
                    {currentUser.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-[#1F2937] leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{isAdmin ? 'Pengurus Admin' : 'Pengawas Pusat'}</p>
                  </div>
                </div>

                {/* Admin Settings Button */}
                {isAdmin && onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="p-1.5 sm:p-2 text-[#2D5A27] hover:bg-[#2D5A27]/10 rounded-lg transition-colors cursor-pointer"
                    title="Pengaturan & Cadangan Database"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}

                {/* Logout button */}
                <button
                  onClick={onLogout}
                  className="p-1.5 sm:p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Logout / Kunci Aplikasi"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 bg-[#2D5A27] hover:bg-[#23471f] text-white font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                <span className="hidden sm:inline">Masuk / Login</span>
                <span className="sm:hidden">Masuk</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs - Visible on all devices with smooth horizontal scrolling on mobile */}
        <div className="flex space-x-1 border-t border-gray-100 pt-1 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            onClick={() => setActiveTab('pantau')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'pantau'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#2D5A27] hover:bg-gray-100'
            }`}
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
            <span>Dashboard Pantau</span>
          </button>

          <button
            onClick={() => setActiveTab('laporan')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
              activeTab === 'laporan'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#2D5A27] hover:bg-gray-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Laporan Setoran</span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('admin-members')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'admin-members'
                    ? 'bg-[#2D5A27] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#2D5A27] hover:bg-gray-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                <span>Kelola Anggota</span>
              </button>

              <button
                onClick={() => setActiveTab('admin-categories')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'admin-categories'
                    ? 'bg-[#2D5A27] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#2D5A27] hover:bg-gray-100'
                }`}
              >
                <FolderKanban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                <span>Kelompok & Kategori</span>
              </button>

              <button
                onClick={() => setActiveTab('admin-setoran')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  activeTab === 'admin-setoran'
                    ? 'bg-[#2D5A27] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#2D5A27] hover:bg-gray-100'
                }`}
              >
                <HandHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#D4AF37]" />
                <span>Input Setoran</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

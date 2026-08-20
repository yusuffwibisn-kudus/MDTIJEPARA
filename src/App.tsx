import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTabType } from './components/Navbar';
import { LoginModal } from './components/LoginModal';
import { MemberManagement } from './components/MemberManagement';
import { CategoryManagement } from './components/CategoryManagement';
import { InputSetoranModal } from './components/InputSetoranModal';
import { MemberReport } from './components/MemberReport';
import { PantauDashboard } from './components/PantauDashboard';
import { MemberDetailModal } from './components/MemberDetailModal';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { Member, JariyahSetoran, User, Role, CategoryItem } from './types';
import {
  getStoredMembers,
  saveMembers,
  getStoredSetoran,
  saveSetoran,
  getStoredCategories,
  saveCategories,
  getStoredAuthUser,
  saveStoredAuthUser,
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_PANTAU_USER,
  resetToSeedData,
} from './utils/storage';
import {
  subscribeToMembers,
  subscribeToSetoran,
  subscribeToCategories,
  subscribeToAdminConfig,
  syncAddMember,
  syncAddBulkMembers,
  syncUpdateMember,
  syncDeleteMember,
  syncSaveSetoran,
  syncDeleteSetoran,
  syncAddCategory,
  syncUpdateCategory,
  syncDeleteCategory,
} from './services/firestoreSync';
import { CheckCircle2, AlertCircle, Lock, Eye, UserCheck, Users, FolderKanban, HandHeart, Plus } from 'lucide-react';

export default function App() {
  // Application State
  const [members, setMembers] = useState<Member[]>(() => getStoredMembers());
  const [setoranList, setSetoranList] = useState<JariyahSetoran[]>(() => getStoredSetoran());
  const [categories, setCategories] = useState<CategoryItem[]>(() => getStoredCategories());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  
  // Auth State - Defaults to Pengawas/Pantau, persists if logged in as Admin
  const [currentUser, setCurrentUser] = useState<User>(() => getStoredAuthUser());

  const [activeTab, setActiveTab] = useState<ActiveTabType>('pantau');

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isInputModalOpen, setIsInputModalOpen] = useState<boolean>(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState<boolean>(false);

  // Selected Data for Modals
  const [selectedMemberForSetoran, setSelectedMemberForSetoran] = useState<Member | null>(null);
  const [selectedMemberForDetail, setSelectedMemberForDetail] = useState<Member | null>(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Cloud Synchronization with Firestore across all Devices (HP, Laptop, PC)
  useEffect(() => {
    // 1. Subscribe to Members collection real-time
    const unsubMembers = subscribeToMembers(
      (updatedMembers) => {
        setMembers(updatedMembers);
        setIsCloudConnected(true);
      },
      () => setIsCloudConnected(false)
    );

    // 2. Subscribe to Setoran collection real-time
    const unsubSetoran = subscribeToSetoran((updatedSetoran) => {
      setSetoranList(updatedSetoran);
    });

    // 3. Subscribe to Categories collection real-time
    const unsubCategories = subscribeToCategories((updatedCats) => {
      setCategories(updatedCats);
    });

    // 4. Subscribe to Admin Configuration
    const unsubAdmin = subscribeToAdminConfig((_password) => {
      // synced to local storage
    });

    return () => {
      unsubMembers();
      unsubSetoran();
      unsubCategories();
      unsubAdmin();
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    saveStoredAuthUser(user);
    setIsLoginModalOpen(false);
    showToast(`Berhasil masuk sebagai ${user.name} (${user.role.toUpperCase()})`);
  };

  const handleLogout = () => {
    setCurrentUser(DEFAULT_PANTAU_USER);
    saveStoredAuthUser(DEFAULT_PANTAU_USER);
    setActiveTab('pantau');
    showToast('Anda telah keluar dari akun Admin. Kembali ke Mode Pantau.');
  };

  const handleSwitchRole = (newRole: Role) => {
    if (newRole === 'admin') {
      const adminUser: User = {
        username: DEFAULT_ADMIN_EMAIL,
        name: 'Pengurus Admin',
        role: 'admin',
      };
      setCurrentUser(adminUser);
      saveStoredAuthUser(adminUser);
      showToast('Beralih ke Hak Akses: Admin');
    } else {
      const pantauUser: User = {
        username: 'pengawas',
        name: 'Tim Pengawas (Pantau)',
        role: 'pantau',
      };
      setCurrentUser(pantauUser);
      saveStoredAuthUser(pantauUser);
      setActiveTab('pantau');
      showToast('Beralih ke Hak Akses: Pengawas (Pantau)');
    }
  };

  // Member Handlers (Optimistic local update + Real-time Cloud Sync)
  const handleAddMember = async (newMemberData: Omit<Member, 'id' | 'createdAt'>) => {
    const newMember: Member = {
      ...newMemberData,
      id: `mbr-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [newMember, ...members];
    setMembers(updated);
    saveMembers(updated);
    await syncAddMember(newMember);
    showToast(`Anggota "${newMember.name}" berhasil ditambahkan & disinkronkan ke Cloud.`);
  };

  const handleAddBulkMembers = async (newMembersData: Omit<Member, 'id' | 'createdAt'>[]) => {
    const timestamp = Date.now();
    const createdIso = new Date().toISOString();
    const newMembersList: Member[] = newMembersData.map((m, idx) => ({
      ...m,
      id: `mbr-${timestamp}-${idx}`,
      createdAt: createdIso,
    }));
    const updated = [...newMembersList, ...members];
    setMembers(updated);
    saveMembers(updated);
    await syncAddBulkMembers(newMembersList);
    showToast(`Berhasil mengimpor ${newMembersList.length} data anggota baru (Tersinkron ke Cloud).`);
  };

  const handleEditMember = async (updatedMember: Member) => {
    const updated = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    setMembers(updated);
    saveMembers(updated);
    await syncUpdateMember(updatedMember);
    showToast(`Data anggota "${updatedMember.name}" berhasil diperbarui.`);
  };

  const handleDeleteMember = async (id: string) => {
    const memberObj = members.find((m) => m.id === id);
    const updatedMembers = members.filter((m) => m.id !== id);
    const updatedSetoran = setoranList.filter((s) => s.memberId !== id);

    setMembers(updatedMembers);
    saveMembers(updatedMembers);
    setSetoranList(updatedSetoran);
    saveSetoran(updatedSetoran);

    await syncDeleteMember(id);
    showToast(`Data anggota "${memberObj?.name || 'Anggota'}" telah dihapus dari Cloud.`);
  };

  // Category Handlers
  const handleAddCategory = async (catData: Omit<CategoryItem, 'id' | 'createdAt'>) => {
    const newCat: CategoryItem = {
      ...catData,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    saveCategories(updated);
    await syncAddCategory(newCat);
    showToast(`Kelompok "${newCat.name}" berhasil ditambahkan.`);
  };

  const handleEditCategory = async (oldName: string, updatedCat: CategoryItem) => {
    const updatedCategories = categories.map((c) => (c.id === updatedCat.id ? updatedCat : c));
    setCategories(updatedCategories);
    saveCategories(updatedCategories);

    let updatedMembers = members;
    if (oldName !== updatedCat.name) {
      updatedMembers = members.map((m) =>
        m.category === oldName ? { ...m, category: updatedCat.name } : m
      );
      setMembers(updatedMembers);
      saveMembers(updatedMembers);
    }
    await syncUpdateCategory(oldName, updatedCat, members);
    showToast(`Kelompok "${updatedCat.name}" berhasil diperbarui.`);
  };

  const handleDeleteCategory = async (catId: string, catName: string, fallbackCatName?: string) => {
    const updatedCategories = categories.filter((c) => c.id !== catId);
    setCategories(updatedCategories);
    saveCategories(updatedCategories);

    if (fallbackCatName) {
      const updatedMembers = members.map((m) =>
        m.category === catName ? { ...m, category: fallbackCatName } : m
      );
      setMembers(updatedMembers);
      saveMembers(updatedMembers);
    }
    await syncDeleteCategory(catId, catName, fallbackCatName, members);
    showToast(`Kelompok "${catName}" telah dihapus.`);
  };

  // Setoran Handlers
  const handleSaveSetoran = async (
    setoranData: Omit<JariyahSetoran, 'id'>,
    existingId?: string
  ) => {
    let savedRecord: JariyahSetoran;
    let updatedSetoran: JariyahSetoran[];
    const member = members.find((m) => m.id === setoranData.memberId);

    if (existingId) {
      savedRecord = { ...setoranData, id: existingId };
      updatedSetoran = setoranList.map((s) => (s.id === existingId ? savedRecord : s));
      showToast(`Setoran bulan ${setoranData.month}/${setoranData.year} untuk "${member?.name}" berhasil diperbarui!`);
    } else {
      savedRecord = {
        ...setoranData,
        id: `set-${Date.now()}`,
      };
      updatedSetoran = [savedRecord, ...setoranList];
      showToast(`Setoran bulan ${setoranData.month}/${setoranData.year} untuk "${member?.name}" berhasil dicatat!`);
    }

    setSetoranList(updatedSetoran);
    saveSetoran(updatedSetoran);
    await syncSaveSetoran(savedRecord);
  };

  const handleDeleteSetoran = async (id: string) => {
    const updated = setoranList.filter((s) => s.id !== id);
    setSetoranList(updated);
    saveSetoran(updated);
    await syncDeleteSetoran(id);
    showToast('Catatan setoran telah dihapus dari Cloud.');
  };

  // Reset Demo Data
  const handleResetData = () => {
    if (window.confirm('Apakah Anda yakin ingin mengembalikan data ke contoh awal (seed data)?')) {
      const { members: seedMembers, setoran: seedSetoran, categories: seedCategories } = resetToSeedData();
      setMembers(seedMembers);
      setSetoranList(seedSetoran);
      setCategories(seedCategories);
      showToast('Data berhasil di-reset ke data demo awal.');
    }
  };

  // Open Modals
  const handleOpenInputForMember = (member: Member) => {
    setSelectedMemberForSetoran(member);
    setIsInputModalOpen(true);
  };

  const handleOpenDetailModal = (member: Member) => {
    setSelectedMemberForDetail(member);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1F2937] flex flex-col font-sans antialiased">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-[#2D5A27] text-white border border-[#D4AF37]/60 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Navbar */}
      <Navbar
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onSwitchRole={handleSwitchRole}
        onOpenSettings={() => setIsAdminSettingsOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Container with responsive padding for mobile bottom bar */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        
        {/* Pantau View */}
        {activeTab === 'pantau' && (
          <PantauDashboard
            members={members}
            categories={categories}
            setoranList={setoranList}
            onOpenMemberDetail={handleOpenDetailModal}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            isAdmin={currentUser?.role === 'admin'}
            onDeleteSetoran={handleDeleteSetoran}
          />
        )}

        {/* Member Management View (Admin only) */}
        {activeTab === 'admin-members' && currentUser?.role === 'admin' && (
          <MemberManagement
            members={members}
            categories={categories}
            onAddMember={handleAddMember}
            onAddBulkMembers={handleAddBulkMembers}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onOpenInputSetoran={handleOpenInputForMember}
          />
        )}

        {/* Category / Kelompok Management View (Admin only) */}
        {activeTab === 'admin-categories' && currentUser?.role === 'admin' && (
          <CategoryManagement
            categories={categories}
            members={members}
            setoranList={setoranList}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}

        {/* Input Setoran Shortcut View (Admin only) */}
        {activeTab === 'admin-setoran' && currentUser?.role === 'admin' && (
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB] shadow-xs space-y-4 max-w-xl mx-auto text-center">
            <h2 className="text-xl font-bold font-serif text-[#2D5A27]">
              Input Setoran Jariyah Bulanan
            </h2>
            <p className="text-xs text-gray-500">
              Pilih anggota dari daftar untuk mencatat atau memperbarui setoran infak bulanan. Sistem akan mengecek duplikasi secara otomatis.
            </p>
            <button
              onClick={() => {
                setSelectedMemberForSetoran(null);
                setIsInputModalOpen(true);
              }}
              className="bg-[#2D5A27] hover:bg-[#23471f] text-white px-5 py-2.5 rounded-xl font-semibold text-xs shadow-md transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <span>Buka Formulir Input Setoran</span>
            </button>
          </div>
        )}

        {/* Per-Member Report View */}
        {activeTab === 'laporan' && (
          <MemberReport
            members={members}
            setoranList={setoranList}
            categories={categories}
            onOpenDetailModal={handleOpenDetailModal}
            onOpenInputModal={handleOpenInputForMember}
            onDeleteSetoran={handleDeleteSetoran}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (Optimized for all Smartphones/HP) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1.5 shadow-2xl flex items-center justify-around">
        <button
          onClick={() => setActiveTab('pantau')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activeTab === 'pantau'
              ? 'text-[#2D5A27] font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'pantau' ? 'bg-[#2D5A27]/10' : ''}`}>
            <Eye className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Pantau</span>
        </button>

        <button
          onClick={() => setActiveTab('laporan')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activeTab === 'laporan'
              ? 'text-[#2D5A27] font-bold'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'laporan' ? 'bg-[#2D5A27]/10' : ''}`}>
            <UserCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Laporan</span>
        </button>

        {currentUser?.role === 'admin' && (
          <>
            <button
              onClick={() => {
                setSelectedMemberForSetoran(null);
                setIsInputModalOpen(true);
              }}
              className="flex flex-col items-center justify-center -mt-5"
            >
              <div className="w-12 h-12 rounded-full bg-[#2D5A27] text-white flex items-center justify-center shadow-lg border-2 border-white hover:bg-[#23471f] transition-transform active:scale-95">
                <Plus className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <span className="text-[10px] font-bold text-[#2D5A27] mt-0.5 whitespace-nowrap">Setor</span>
            </button>

            <button
              onClick={() => setActiveTab('admin-members')}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                activeTab === 'admin-members'
                  ? 'text-[#2D5A27] font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'admin-members' ? 'bg-[#2D5A27]/10' : ''}`}>
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Anggota</span>
            </button>

            <button
              onClick={() => setActiveTab('admin-categories')}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                activeTab === 'admin-categories'
                  ? 'text-[#2D5A27] font-bold'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'admin-categories' ? 'bg-[#2D5A27]/10' : ''}`}>
                <FolderKanban className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Kelompok</span>
            </button>
          </>
        )}
      </nav>

      {/* Footer - Desktop / Tablet view */}
      <footer className="hidden md:block bg-[#2D5A27] text-white/70 py-4 px-8 border-t border-emerald-900 text-center text-[10px] uppercase tracking-[0.2em] font-medium">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MDTI PASEBAN AGUNG JEPARA • Sistem Informasi Wakaf Jariyah PPTQ Cahaya Tasbih • v2.4.0</p>
          <p className="text-white/50">
            Responsif untuk Smartphone, Tablet, dan Komputer Laptop
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <InputSetoranModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        members={members}
        setoranList={setoranList}
        preselectedMember={selectedMemberForSetoran}
        onSaveSetoran={handleSaveSetoran}
        currentUser={currentUser}
      />

      <MemberDetailModal
        member={selectedMemberForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        setoranList={setoranList}
        currentUser={currentUser}
        onOpenInputForMember={handleOpenInputForMember}
        onDeleteSetoran={handleDeleteSetoran}
      />

      <AdminSettingsModal
        isOpen={isAdminSettingsOpen}
        onClose={() => setIsAdminSettingsOpen(false)}
        onDataResetOrRestored={(newData) => {
          setMembers(newData.members);
          setSetoranList(newData.setoran);
          setCategories(newData.categories);
        }}
        onToast={showToast}
      />
    </div>
  );
}

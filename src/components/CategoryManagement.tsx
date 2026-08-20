import React, { useState } from 'react';
import { CategoryItem, Member, JariyahSetoran } from '../types';
import {
  FolderKanban,
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  X,
  AlertTriangle,
  Layers,
  Tag,
  CheckCircle2,
  Eye,
  Phone,
  MapPin,
  User,
} from 'lucide-react';
import { formatRupiah, getMemberKelompok, getMemberKategori } from '../utils/formatters';

interface CategoryManagementProps {
  categories: CategoryItem[];
  members: Member[];
  setoranList: JariyahSetoran[];
  onAddCategory: (cat: Omit<CategoryItem, 'id' | 'createdAt'>) => void;
  onEditCategory: (oldName: string, updatedCat: CategoryItem) => void;
  onDeleteCategory: (catId: string, catName: string, fallbackCatName?: string) => void;
}

export const CategoryManagement: React.FC<CategoryManagementProps> = ({
  categories,
  members,
  setoranList,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTabFilter, setActiveTabFilter] = useState<'all' | 'kelompok' | 'kategori'>('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form State
  const [itemType, setItemType] = useState<'kelompok' | 'kategori'>('kelompok');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal state
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [fallbackCatName, setFallbackCatName] = useState<string>('');

  // Viewing members list modal state
  const [viewingMembersCat, setViewingMembersCat] = useState<CategoryItem | null>(null);

  const currentYear = new Date().getFullYear();

  // Helper to determine item type if not explicitly set
  const getItemType = (cat: CategoryItem): 'kelompok' | 'kategori' => {
    if (cat.type) return cat.type;
    if (cat.name.toLowerCase().includes('kelompok')) return 'kelompok';
    return 'kategori';
  };

  // Open add modal for Kelompok
  const handleOpenAddKelompok = () => {
    setEditingCategory(null);
    setItemType('kelompok');
    setName('');
    setDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open add modal for Kategori
  const handleOpenAddKategori = () => {
    setEditingCategory(null);
    setItemType('kategori');
    setName('');
    setDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setItemType(getItemType(cat));
    setName(cat.name);
    setDescription(cat.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit Add / Edit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError(`Nama ${itemType === 'kelompok' ? 'kelompok' : 'kategori'} wajib diisi.`);
      return;
    }

    // Check duplicate name
    const isDuplicate = categories.some(
      (c) => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== editingCategory?.id
    );

    if (isDuplicate) {
      setFormError(`Nama ${itemType === 'kelompok' ? 'kelompok' : 'kategori'} sudah digunakan, silakan gunakan nama lain.`);
      return;
    }

    if (editingCategory) {
      onEditCategory(editingCategory.name, {
        ...editingCategory,
        name: trimmedName,
        type: itemType,
        description: description.trim(),
      });
    } else {
      onAddCategory({
        name: trimmedName,
        type: itemType,
        description: description.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Open delete confirm
  const handleOpenDelete = (cat: CategoryItem) => {
    setDeletingCategory(cat);
    // Find first other category as default fallback
    const other = categories.find((c) => c.id !== cat.id);
    setFallbackCatName(other ? other.name : 'Reguler');
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    onDeleteCategory(deletingCategory.id, deletingCategory.name, fallbackCatName);
    setDeletingCategory(null);
  };

  // Calculate stats for a category/kelompok
  const getCategoryStats = (cat: CategoryItem) => {
    const type = getItemType(cat);
    const categoryMembers = members.filter((m) => {
      if (type === 'kelompok') {
        const mKelompok = getMemberKelompok(m);
        return (
          mKelompok === cat.name ||
          m.kelompok === cat.name ||
          m.category === cat.name
        );
      } else {
        const mKategori = getMemberKategori(m);
        return (
          mKategori === cat.name ||
          m.kategori === cat.name ||
          m.category === cat.name
        );
      }
    });

    const memberIds = new Set(categoryMembers.map((m) => m.id));

    const totalSetoranYear = setoranList
      .filter((s) => s.year === currentYear && memberIds.has(s.memberId))
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      memberCount: categoryMembers.length,
      categoryMembers,
      totalSetoranYear,
    };
  };

  // Filter categories by type tab and search query
  const filteredCategories = categories.filter((cat) => {
    const type = getItemType(cat);
    if (activeTabFilter !== 'all' && type !== activeTabFilter) return false;

    const matchesSearch =
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cat.description && cat.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSearch;
  });

  const kelompokCount = categories.filter((c) => getItemType(c) === 'kelompok').length;
  const kategoriCount = categories.filter((c) => getItemType(c) === 'kategori').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Separate Action Buttons */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] font-sans flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-[#2D5A27]" />
            <span>Kelola Kelompok & Kategori Anggota</span>
          </h2>
          <p className="text-xs text-gray-500">
            Kelompok (binaan/wilayah) dan Kategori (status donatur) adalah dua hal berbeda. Atur keduanya secara terpisah di bawah ini.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleOpenAddKelompok}
            className="flex items-center justify-center gap-2 bg-[#2D5A27] hover:bg-[#23471f] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span>Tambah Kelompok Baru</span>
          </button>

          <button
            onClick={handleOpenAddKategori}
            className="flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#c4a02d] text-slate-900 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4 text-slate-900" />
            <span>Tambah Kategori Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Type Filter Tabs */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTabFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTabFilter === 'all'
                ? 'bg-white text-[#2D5A27] shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Semua</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-gray-200 text-gray-700">
              {categories.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTabFilter('kelompok')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTabFilter === 'kelompok'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Kelompok</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTabFilter === 'kelompok' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'}`}>
              {kelompokCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTabFilter('kategori')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTabFilter === 'kategori'
                ? 'bg-[#D4AF37] text-slate-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Kategori</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTabFilter === 'kategori' ? 'bg-slate-900/15 text-slate-900' : 'bg-gray-200 text-gray-700'}`}>
              {kategoriCount}
            </span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama kelompok atau kategori..."
            className="w-full pl-9 pr-3 py-1.5 border border-[#D1D5DB] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
          />
        </div>
      </div>

      {/* Category / Kelompok Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCategories.map((cat) => {
          const stats = getCategoryStats(cat);
          const type = getItemType(cat);
          const isKelompok = type === 'kelompok';

          return (
            <div
              key={cat.id}
              className={`bg-white rounded-2xl p-5 border shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                isKelompok ? 'border-emerald-100 hover:border-emerald-300' : 'border-amber-100 hover:border-amber-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isKelompok ? 'bg-emerald-100 text-[#2D5A27]' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isKelompok ? <Users className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                            isKelompok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {isKelompok ? 'Kelompok' : 'Kategori'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-[#1F2937] mt-0.5">
                        {cat.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => setViewingMembersCat(cat)}
                    className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#F4F1EA] hover:bg-emerald-100 text-[#2D5A27] border border-[#2D5A27]/20 transition-all cursor-pointer shrink-0 flex items-center gap-1"
                    title="Klik untuk melihat daftar anggota"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{stats.memberCount} Anggota</span>
                  </button>
                </div>

                <p className="text-xs text-gray-600 mb-4 min-h-[36px]">
                  {cat.description || <span className="text-gray-400 italic">Tidak ada deskripsi</span>}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Total Setoran {currentYear}</span>
                  <span className="text-sm font-bold text-[#2D5A27]">
                    {formatRupiah(stats.totalSetoranYear)}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setViewingMembersCat(cat)}
                    className="p-1.5 text-gray-600 hover:text-[#2D5A27] hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
                    title="Lihat Daftar Anggota"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cat)}
                    className="p-1.5 text-gray-600 hover:text-[#2D5A27] hover:bg-gray-100 rounded-lg transition-colors"
                    title={isKelompok ? 'Edit Kelompok' : 'Edit Kategori'}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(cat)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title={isKelompok ? 'Hapus Kelompok' : 'Hapus Kategori'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="bg-white rounded-2xl p-10 text-center border border-[#E5E7EB] text-gray-400 text-xs">
          Tidak ada {activeTabFilter === 'kelompok' ? 'kelompok' : activeTabFilter === 'kategori' ? 'kategori' : 'data'} ditemukan dengan kata kunci ini.
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-[#E5E7EB] my-auto max-h-[92vh] flex flex-col">
            <div className={`p-4 sm:p-5 flex items-center justify-between text-white shrink-0 ${itemType === 'kelompok' ? 'bg-[#2D5A27]' : 'bg-[#D4AF37] text-slate-900'}`}>
              <h3 className="text-sm sm:text-base font-bold font-sans flex items-center gap-2">
                {itemType === 'kelompok' ? <Users className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                <span>
                  {editingCategory
                    ? `Edit ${itemType === 'kelompok' ? 'Kelompok' : 'Kategori'}`
                    : `Tambah ${itemType === 'kelompok' ? 'Kelompok Baru' : 'Kategori Baru'}`}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="hover:opacity-80 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}


              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nama {itemType === 'kelompok' ? 'Kelompok' : 'Kategori'} *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    itemType === 'kelompok'
                      ? 'Misal: Kelompok Backup F, Kelompok RT 02, Kelompok Soko Tatal'
                      : 'Misal: Donatur Utama, Simpatisan Rutin, Donatur Insidental'
                  }
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:ring-2 focus:ring-[#2D5A27] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Deskripsi / Keterangan (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    itemType === 'kelompok'
                      ? 'Penjelasan wilayah / karakteristik anggota kelompok ini...'
                      : 'Kriteria atau keterangan khusus kategori donatur ini...'
                  }
                  className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:ring-2 focus:ring-[#2D5A27] focus:outline-none resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                    itemType === 'kelompok'
                      ? 'bg-[#2D5A27] hover:bg-[#23471f] text-white'
                      : 'bg-[#D4AF37] hover:bg-[#c4a02d] text-slate-900'
                  }`}
                >
                  {editingCategory
                    ? 'Simpan Perubahan'
                    : `Tambah ${itemType === 'kelompok' ? 'Kelompok' : 'Kategori'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 border border-[#E5E7EB] space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-800">
                Hapus {getItemType(deletingCategory) === 'kelompok' ? 'Kelompok' : 'Kategori'} "{deletingCategory.name}"?
              </h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus {getItemType(deletingCategory) === 'kelompok' ? 'kelompok' : 'kategori'} ini?
            </p>

            {/* Check if members belong to this category */}
            {getCategoryStats(deletingCategory).memberCount > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs space-y-2">
                <p className="font-bold">
                  ⚠️ Terdapat {getCategoryStats(deletingCategory).memberCount} anggota dalam {getItemType(deletingCategory) === 'kelompok' ? 'kelompok' : 'kategori'} ini.
                </p>
                <p className="text-[11px]">
                  Pilih kelompok/kategori pengganti untuk memindahkan anggota-anggota tersebut:
                </p>
                <select
                  value={fallbackCatName}
                  onChange={(e) => setFallbackCatName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium focus:outline-none"
                >
                  {categories
                    .filter((c) => c.id !== deletingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.name}>
                        Pindahkan ke: {c.name} ({getItemType(c) === 'kelompok' ? 'Kelompok' : 'Kategori'})
                      </option>
                    ))}
                </select>
              </div>
            )}

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                Hapus & Pindahkan Anggota
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Members Modal */}
      {viewingMembersCat && (() => {
        const catStats = getCategoryStats(viewingMembersCat);
        const isKel = getItemType(viewingMembersCat) === 'kelompok';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden border border-[#E5E7EB] max-h-[90vh] flex flex-col">
              <div className={`p-5 flex items-center justify-between text-white shrink-0 ${isKel ? 'bg-[#2D5A27]' : 'bg-[#D4AF37] text-slate-900'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold font-sans">
                      Daftar Anggota: {viewingMembersCat.name}
                    </h3>
                    <p className={`text-xs ${isKel ? 'text-emerald-100' : 'text-slate-800'}`}>
                      Terdeteksi {catStats.memberCount} anggota terdaftar dalam {isKel ? 'kelompok' : 'kategori'} ini
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewingMembersCat(null)}
                  className="hover:opacity-80 p-1.5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-3 flex-1">
                {catStats.categoryMembers.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 text-xs">
                    <User className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    Belum ada anggota yang terdaftar pada {isKel ? 'kelompok' : 'kategori'} ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {catStats.categoryMembers.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-emerald-200 hover:shadow-xs transition-all flex flex-col justify-between space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#2D5A27]/10 text-[#2D5A27] font-bold text-xs flex items-center justify-center shrink-0">
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-800 leading-tight">{m.name}</h4>
                              <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                                <span>{m.phone || '-'}</span>
                              </p>
                            </div>
                          </div>
                        </div>

                        {m.address && (
                          <div className="text-[10px] text-gray-500 flex items-center gap-1 pt-1 border-t border-gray-200/60">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{m.address}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                <span className="text-xs font-semibold text-gray-500">
                  Total: {catStats.memberCount} Anggota
                </span>
                <button
                  onClick={() => setViewingMembersCat(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

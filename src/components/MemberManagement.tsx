import React, { useState } from 'react';
import {
  UserPlus,
  Search,
  Filter,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  X,
  PlusCircle,
  HandHeart,
  CheckCircle,
  UserCheck,
  FileSpreadsheet,
  Users,
  Tag,
} from 'lucide-react';
import { Member, MemberCategory, CategoryItem } from '../types';
import { INDONESIAN_CATEGORIES, formatDateID, getMemberKelompok, getMemberKategori } from '../utils/formatters';
import { ExcelImportModal } from './ExcelImportModal';

interface MemberManagementProps {
  members: Member[];
  categories?: CategoryItem[];
  onAddMember: (member: Omit<Member, 'id' | 'createdAt'>) => void;
  onAddBulkMembers?: (newMembers: Omit<Member, 'id' | 'createdAt'>[]) => void;
  onEditMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onOpenInputSetoran: (member: Member) => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  categories,
  onAddMember,
  onAddBulkMembers,
  onEditMember,
  onDeleteMember,
  onOpenInputSetoran,
}) => {
  // Extract separate options for Kelompok and Kategori
  const kelompokList = categories && categories.length > 0
    ? Array.from(new Set(categories.filter((c) => c.type === 'kelompok').map((c) => c.name)))
    : ['Kelompok Backup A', 'Kelompok Backup B', 'Kelompok Backup C', 'Kelompok Backup D', 'Kelompok Backup E', 'Kelompok Soko Tatal'];

  const kategoriList = categories && categories.length > 0
    ? Array.from(new Set(categories.filter((c) => c.type === 'kategori').map((c) => c.name)))
    : [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKelompok, setSelectedKelompok] = useState<string>('all');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Delete Confirmation State
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    address: string;
    joinDate: string;
    kelompok: string;
    kategori: string;
    notes: string;
  }>({
    name: '',
    phone: '',
    address: '',
    joinDate: new Date().toISOString().split('T')[0],
    kelompok: kelompokList[0] || '',
    kategori: kategoriList[0] || '',
    notes: '',
  });

  const [formError, setFormError] = useState('');

  // Open modal for Adding
  const handleOpenAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      joinDate: new Date().toISOString().split('T')[0],
      kelompok: kelompokList[0] || 'Kelompok Backup A',
      kategori: kategoriList[0] || 'Reguler',
      notes: '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for Editing
  const handleOpenEditModal = (member: Member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone,
      address: member.address,
      joinDate: member.joinDate,
      kelompok: getMemberKelompok(member),
      kategori: getMemberKategori(member),
      notes: member.notes || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Nama Lengkap wajib diisi.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Nomor HP wajib diisi.');
      return;
    }
    if (!formData.address.trim()) {
      setFormError('Alamat wajib diisi.');
      return;
    }

    if (editingMember) {
      onEditMember({
        ...editingMember,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        joinDate: formData.joinDate,
        category: formData.kelompok as MemberCategory,
        kelompok: formData.kelompok,
        kategori: formData.kategori,
        notes: formData.notes.trim(),
      });
    } else {
      onAddMember({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        joinDate: formData.joinDate,
        category: formData.kelompok as MemberCategory,
        kelompok: formData.kelompok,
        kategori: formData.kategori,
        notes: formData.notes.trim(),
      });
    }

    setIsModalOpen(false);
  };

  // Filtered members list
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.phone.includes(searchQuery) ||
      member.address.toLowerCase().includes(searchQuery.toLowerCase());

    const mKelompok = getMemberKelompok(member);
    const mKategori = getMemberKategori(member);

    const matchesKelompok =
      selectedKelompok === 'all' || mKelompok === selectedKelompok || member.category === selectedKelompok;

    const matchesKategori =
      selectedKategori === 'all' || mKategori === selectedKategori;

    return matchesSearch && matchesKelompok && matchesKategori;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] font-sans flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#2D5A27]" />
            <span>Manajemen Data Anggota Jariyah</span>
          </h2>
          <p className="text-xs text-gray-500">
            Kelola profil, nomor kontak, kategori kelompok, dan riwayat pendaftaran anggota.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-[#F4F1EA] hover:bg-[#e9e4d7] text-[#2D5A27] border border-[#2D5A27]/30 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#2D5A27]" />
            <span>Impor Excel (Massal)</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 bg-[#2D5A27] hover:bg-[#23471f] text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-[#D4AF37]" />
            <span>Tambah Anggota Baru</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari berdasarkan nama, HP, atau alamat..."
            className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
          />
        </div>

        {/* Kelompok Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <select
            value={selectedKelompok}
            onChange={(e) => setSelectedKelompok(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27] bg-white font-medium text-slate-700"
          >
            <option value="all">Semua Kelompok</option>
            {kelompokList.map((k) => (
              <option key={k} value={k}>
                {k} ({members.filter((m) => getMemberKelompok(m) === k || m.category === k).length})
              </option>
            ))}
          </select>
        </div>

        {/* Kategori Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <select
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2D5A27] bg-white font-medium text-slate-700"
          >
            <option value="all">Semua Kategori Donatur</option>
            {kategoriList.map((kat) => (
              <option key={kat} value={kat}>
                {kat} ({members.filter((m) => getMemberKategori(m) === kat).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members List Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F4F1EA] border-b border-[#E5E7EB] text-gray-500 font-medium uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Nama Anggota</th>
                <th className="py-3.5 px-4">Kelompok</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">No. HP</th>
                <th className="py-3.5 px-4">Alamat</th>
                <th className="py-3.5 px-4">Tgl Bergabung</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 text-xs">
                    {members.length === 0 ? (
                      <div className="space-y-2 py-4">
                        <Users className="w-10 h-10 text-gray-300 mx-auto" />
                        <p className="font-semibold text-gray-700 text-sm">Belum Ada Data Anggota</p>
                        <p className="text-gray-400 text-xs max-w-sm mx-auto">
                          Mulai input data anggota secara manual dengan tombol <strong>"Tambah Anggota Baru"</strong> di atas atau unggah file data lewat tombol <strong>"Impor Excel"</strong>.
                        </p>
                      </div>
                    ) : (
                      'Tidak ada anggota ditemukan dengan kata kunci atau filter ini.'
                    )}
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#F4F1EA]/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#1F2937]">
                      <div>{member.name}</div>
                      {member.notes && (
                        <div className="text-[11px] font-normal text-gray-400 italic">
                          {member.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{getMemberKelompok(member)}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                        <Tag className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{getMemberKategori(member)}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{member.phone}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-600 max-w-xs truncate">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span title={member.address}>{member.address}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span>{formatDateID(member.joinDate)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onOpenInputSetoran(member)}
                          className="flex items-center gap-1 bg-[#2D5A27] hover:bg-[#23471f] text-white font-semibold px-2.5 py-1.5 rounded-lg text-xs transition-colors shadow-xs"
                          title="Input Setoran Jariyah"
                        >
                          <HandHeart className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>Input</span>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(member)}
                          className="p-1.5 text-gray-600 hover:text-[#2D5A27] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit Data Anggota"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(member.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Anggota"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-[#E5E7EB] my-auto max-h-[92vh] flex flex-col">
            <div className="bg-[#2D5A27] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <h3 className="text-sm sm:text-base font-bold font-sans text-white">
                {editingMember ? 'Edit Data Anggota' : 'Tambah Anggota Jariyah Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs border border-rose-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: H. Ahmad Dahlan"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor HP / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* SEPARATED KELOMPOK AND KATEGORI DROPDOWNS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Kelompok Anggota *</span>
                  </label>
                  <select
                    value={formData.kelompok}
                    onChange={(e) =>
                      setFormData({ ...formData, kelompok: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    {kelompokList.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-purple-700" />
                    <span>Kategori Donatur *</span>
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) =>
                      setFormData({ ...formData, kategori: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                  >
                    {kategoriList.map((kat) => (
                      <option key={kat} value={kat}>
                        {kat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Lengkap *
                </label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Jl. Masjid No. 12, Kel. Mangkubumen..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={formData.joinDate}
                    onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Opsional
                  </label>
                  <input
                    type="text"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan khusus..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2D5A27] hover:bg-[#23471f] text-white rounded-xl text-xs font-semibold transition-all shadow-md"
                >
                  {editingMember ? 'Simpan Perubahan' : 'Tambah Anggota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2">Konfirmasi Hapus Anggota</h3>
            <p className="text-xs text-slate-600 mb-6">
              Apakah Anda yakin ingin menghapus data anggota ini? Semua riwayat setoran jariyah anggota ini juga dapat terpengaruh.
            </p>
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onDeleteMember(deleteId);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        categories={categories}
        existingMembers={members}
        onImportMembers={(newMembers) => {
          if (onAddBulkMembers) {
            onAddBulkMembers(newMembers);
          } else {
            newMembers.forEach((m) => onAddMember(m));
          }
        }}
      />
    </div>
  );
};

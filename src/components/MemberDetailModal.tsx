import React, { useState } from 'react';
import { X, Calendar, CheckCircle2, Clock, Phone, MapPin, Trash2, Edit, Plus, AlertTriangle, ArrowLeft } from 'lucide-react';
import { Member, JariyahSetoran, User } from '../types';
import { formatRupiah, INDONESIAN_MONTHS, formatDateID, getMonthName, isSetoranLunas, getMemberKelompok } from '../utils/formatters';

interface MemberDetailModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
  setoranList: JariyahSetoran[];
  currentUser: User | null;
  onOpenInputForMember: (member: Member) => void;
  onDeleteSetoran?: (id: string) => void;
}

export const MemberDetailModal: React.FC<MemberDetailModalProps> = ({
  member,
  isOpen,
  onClose,
  setoranList,
  currentUser,
  onOpenInputForMember,
  onDeleteSetoran,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [setoranToDelete, setSetoranToDelete] = useState<JariyahSetoran | null>(null);

  if (!isOpen || !member) return null;

  const isAdmin = currentUser?.role === 'admin';

  // Filter setoran for this member
  const memberSetoranAll = setoranList.filter((s) => s.memberId === member.id);
  const memberSetoranYear = memberSetoranAll.filter((s) => s.year === selectedYear);

  const totalYearAmount = memberSetoranYear.reduce((acc, s) => acc + s.amount, 0);
  const totalAllTimeAmount = memberSetoranAll.reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-[#2D5A27] text-white p-4 sm:p-6 relative shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#D4AF37] text-[#1F2937] px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">
                  {member.category}
                </span>
                <span className="text-xs text-white/80">
                  Gabung: {formatDateID(member.joinDate)}
                </span>
              </div>
              <h2 className="text-xl font-bold font-sans text-white">
                {member.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/90 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {member.phone}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  {member.address}
                </span>
              </div>
            </div>

            {isAdmin && (
              <button
                onClick={() => {
                  onClose();
                  onOpenInputForMember(member);
                }}
                className="flex items-center gap-1.5 bg-[#D4AF37] hover:bg-[#c4a02e] text-[#1F2937] px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Input Setoran</span>
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#F4F1EA] p-4 rounded-xl border border-[#E5E7EB]">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Total Jariyah {selectedYear}
              </span>
              <span className="text-lg font-bold text-[#2D5A27]">
                {formatRupiah(totalYearAmount)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Total Jariyah Semua
              </span>
              <span className="text-lg font-bold text-[#1F2937]">
                {formatRupiah(totalAllTimeAmount)}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                Bulan Terbayar ({selectedYear})
              </span>
              <span className="text-lg font-bold text-[#2D5A27]">
                {memberSetoranYear.length} dari 12 Bulan
              </span>
            </div>
          </div>

          {/* Year Selector Tabs */}
          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
            <h3 className="text-sm font-bold text-[#1F2937]">
              Rincian Setoran Per Bulan
            </h3>
            <div className="flex space-x-1">
              {[2024, 2025, 2026, 2027].map((y) => (
                <button
                  key={y}
                  onClick={() => setSelectedYear(y)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedYear === y
                      ? 'bg-[#2D5A27] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>

          {/* 12-Month Matrix Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {INDONESIAN_MONTHS.map((mName, idx) => {
              const monthNum = idx + 1;
              const monthSetorans = memberSetoranYear.filter((s) => s.month === monthNum);
              const hasSetoran = monthSetorans.length > 0;
              const monthTotal = monthSetorans.reduce((acc, s) => acc + s.amount, 0);
              const monthBackup = monthSetorans
                .filter((s) => !s.jenisJariyah || s.jenisJariyah === 'Jariyah Backup')
                .reduce((acc, s) => acc + s.amount, 0);
              const kelompokName = getMemberKelompok(member);
              const isLunas = isSetoranLunas(member, monthBackup, monthTotal);

              return (
                <div
                  key={monthNum}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isLunas
                      ? 'bg-[#2D5A27]/10 border-[#2D5A27]/30'
                      : hasSetoran
                      ? 'bg-amber-50/80 border-amber-200'
                      : 'bg-gray-50/70 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#1F2937]">
                      {mName}
                    </span>
                    {isLunas ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-[#2D5A27] bg-[#2D5A27]/15 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-[#2D5A27]" />
                        Lunas
                      </span>
                    ) : hasSetoran ? (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Belum Lunas
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                        <Clock className="w-3 h-3 text-gray-400" />
                        Belum
                      </span>
                    )}
                  </div>

                  {hasSetoran ? (
                    <div className="space-y-2">
                      <div className="text-base font-bold text-[#2D5A27]">
                        {formatRupiah(monthTotal)}
                      </div>

                      <div className="space-y-1.5 border-t border-[#2D5A27]/20 pt-1.5">
                        {monthSetorans.map((st) => {
                          const jenis = st.jenisJariyah || 'Jariyah Backup';
                          let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                          if (jenis === 'Wakaf') badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
                          if (jenis === 'Wull') badgeClass = 'bg-teal-100 text-teal-800 border-teal-300';

                          return (
                            <div key={st.id} className="bg-white/80 p-1.5 rounded-lg border border-slate-200/80 text-[11px] space-y-0.5">
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${badgeClass}`}>
                                  {jenis}
                                </span>
                                <span className="font-bold text-slate-700">
                                  {formatRupiah(st.amount)}
                                </span>
                              </div>
                              <div className="text-[10px] text-gray-500">
                                Tgl: {formatDateID(st.dateSubmitted)}
                              </div>
                              {st.notes && (
                                <div className="text-[10px] text-gray-400 italic truncate">
                                  "{st.notes}"
                                </div>
                              )}
                              {isAdmin && onDeleteSetoran && (
                                <div className="pt-0.5 text-right">
                                  <button
                                    onClick={() => setSetoranToDelete(st)}
                                    className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold hover:underline"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 py-1">
                      Belum ada catatan setoran
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali</span>
          </button>
          {isAdmin && (
            <button
              onClick={() => {
                onClose();
                onOpenInputForMember(member);
              }}
              className="flex items-center gap-1.5 bg-[#2D5A27] hover:bg-[#23471f] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#D4AF37]" />
              <span>Input Setoran</span>
            </button>
          )}
        </div>

      </div>

      {/* Confirmation Delete Setoran Modal in Detail View */}
      {setoranToDelete && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-rose-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    Konfirmasi Hapus Setoran
                  </h3>
                  <p className="text-xs text-white/80">
                    Sistem Laporan Setoran Wakaf Jariyah
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSetoranToDelete(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus data setoran bulan <strong className="text-gray-800">{getMonthName(setoranToDelete.month)} {setoranToDelete.year}</strong> untuk anggota <strong className="text-gray-800">{member.name}</strong>?
              </p>

              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Periode Setoran:</span>
                  <span className="font-semibold text-emerald-800">
                    {getMonthName(setoranToDelete.month)} {setoranToDelete.year}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Nominal:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {formatRupiah(setoranToDelete.amount)}
                  </span>
                </div>
                {setoranToDelete.jenisJariyah && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Jenis Jariyah:</span>
                    <span className="font-semibold text-[#2D5A27] bg-[#2D5A27]/10 px-2 py-0.5 rounded">
                      {setoranToDelete.jenisJariyah}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Tanggal Setor:</span>
                  <span className="text-gray-700">{formatDateID(setoranToDelete.dateSubmitted)}</span>
                </div>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Data setoran yang dihapus tidak dapat dikembalikan.</span>
              </div>
            </div>

            <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setSetoranToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (onDeleteSetoran) {
                    onDeleteSetoran(setoranToDelete.id);
                  }
                  setSetoranToDelete(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Setoran</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

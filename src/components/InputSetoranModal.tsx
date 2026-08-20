import React, { useState, useEffect } from 'react';
import { X, HandHeart, AlertTriangle, CheckCircle, RefreshCw, Calendar, Coins } from 'lucide-react';
import { Member, JariyahSetoran, User, JenisJariyah } from '../types';
import { INDONESIAN_MONTHS, formatRupiah, getMonthName, formatDateID } from '../utils/formatters';

interface InputSetoranModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  setoranList: JariyahSetoran[];
  preselectedMember?: Member | null;
  onSaveSetoran: (setoran: Omit<JariyahSetoran, 'id'>, existingId?: string) => void;
  currentUser: User | null;
}

export const InputSetoranModal: React.FC<InputSetoranModalProps> = ({
  isOpen,
  onClose,
  members,
  setoranList,
  preselectedMember,
  onSaveSetoran,
  currentUser,
}) => {
  const currentDate = new Date();
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [dateSubmitted, setDateSubmitted] = useState<string>(
    currentDate.toISOString().split('T')[0]
  );
  const [month, setMonth] = useState<number>(currentDate.getMonth() + 1);
  const [year, setYear] = useState<number>(currentDate.getFullYear());
  const [amount, setAmount] = useState<string>('0');
  const [jenisJariyah, setJenisJariyah] = useState<JenisJariyah>('Jariyah Backup');
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Existing setoran if duplicate detected
  const [existingSetoran, setExistingSetoran] = useState<JariyahSetoran | null>(null);
  const [saveMode, setSaveMode] = useState<'new' | 'update'>('new');

  const handleDateChange = (val: string) => {
    setDateSubmitted(val);
    if (val) {
      const parts = val.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        if (!isNaN(y) && !isNaN(m)) {
          setYear(y);
          setMonth(m);
        }
      }
    }
  };

  useEffect(() => {
    if (preselectedMember) {
      setSelectedMemberId(preselectedMember.id);
    } else if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0].id);
    }
  }, [preselectedMember, members]);

  // Check for existing setoran matching member, month, year, and specific jenisJariyah
  useEffect(() => {
    if (isOpen && selectedMemberId && month && year && jenisJariyah) {
      const match = setoranList.find(
        (s) =>
          s.memberId === selectedMemberId &&
          s.month === Number(month) &&
          s.year === Number(year) &&
          (s.jenisJariyah || 'Jariyah Backup') === jenisJariyah
      );
      if (match) {
        setExistingSetoran(match);
        setNotes(match.notes || '');
      } else {
        setExistingSetoran(null);
        setNotes('');
      }
      // Always default amount to '0' so input is zero and no chip is pre-selected
      setAmount('0');
    }
  }, [selectedMemberId, month, year, jenisJariyah, setoranList, isOpen]);

  if (!isOpen) return null;

  const selectedMemberObj = members.find((m) => m.id === selectedMemberId);

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedMemberId) {
      setError('Harap pilih anggota.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Nominal setoran harus berupa angka positif.');
      return;
    }

    onSaveSetoran(
      {
        memberId: selectedMemberId,
        month: Number(month),
        year: Number(year),
        amount: numAmount,
        jenisJariyah,
        dateSubmitted: dateSubmitted || new Date().toISOString().split('T')[0],
        recordedBy: currentUser?.username || 'admin',
        notes: notes.trim(),
      },
      saveMode === 'update' && existingSetoran ? existingSetoran.id : undefined
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-emerald-100 my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-[#2D5A27] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D4AF37] text-[#1F2937] flex items-center justify-center font-bold shrink-0">
              <HandHeart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold font-sans text-white">
                Catat Setoran Jariyah Bulanan
              </h3>
              <p className="text-[11px] sm:text-xs text-white/80">
                Input setoran infak/sedekah rutin per anggota
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

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* Duplicate Warning Banner & Save Mode Toggle */}
          {existingSetoran && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-start gap-2 text-amber-900 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p>Terdapat Setoran {jenisJariyah} Pada Bulan Ini!</p>
                  <p className="font-normal text-amber-800 text-[11px] mt-0.5">
                    <strong>{selectedMemberObj?.name}</strong> sudah memiliki setoran <strong>{jenisJariyah}</strong> pada{' '}
                    <strong>{getMonthName(existingSetoran.month)} {existingSetoran.year}</strong> sebesar{' '}
                    <strong>{formatRupiah(existingSetoran.amount)}</strong>.
                  </p>
                </div>
              </div>
              
              <div className="pt-1 flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-amber-950">Pilih Opsi Penyimpanan:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSaveMode('new')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center text-center ${
                      saveMode === 'new'
                        ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>➕ Tambah Transaksi Baru</span>
                    <span className="text-[9px] font-normal opacity-90 mt-0.5">Catat sebagai setoran ke-2/ke-3 dst.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSaveMode('update')}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all flex flex-col items-center justify-center text-center ${
                      saveMode === 'update'
                        ? 'bg-amber-700 text-white border-amber-800 shadow-xs ring-2 ring-amber-500/20'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span>✏️ Update Transaksi Lama</span>
                    <span className="text-[9px] font-normal opacity-90 mt-0.5">Gantikan nominal setoran yang ada</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Select Member */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pilih Anggota Jariyah *
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-medium text-slate-800"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.category} - {m.phone})
                </option>
              ))}
            </select>
          </div>

          {/* Select Jenis Jariyah */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jenis Jariyah *
            </label>
            <select
              value={jenisJariyah}
              onChange={(e) => setJenisJariyah(e.target.value as JenisJariyah)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white font-semibold text-emerald-900"
            >
              <option value="Jariyah Backup">Jariyah Backup</option>
              <option value="Wakaf">Wakaf</option>
              <option value="Wull">Wull</option>
            </select>
          </div>

          {/* Select Tanggal & Bulan Setoran */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2D5A27]" />
                Tanggal & Bulan Setoran *
              </span>
              <span className="text-[11px] font-semibold text-[#2D5A27]">
                Periode: {getMonthName(month)} {year}
              </span>
            </label>
            <input
              type="date"
              required
              value={dateSubmitted}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            />
            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 pt-0.5">
              <span>
                Format Tanggal: <strong className="text-gray-800">{formatDateID(dateSubmitted)}</strong>
              </span>
              <span>
                Bulan Ke-{month} Tahun {year}
              </span>
            </div>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nominal Jariyah (Rp) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-[#2D5A27]">
                Rp
              </span>
              <input
                type="number"
                min="0"
                step="1000"
                required
                value={amount}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.length > 1 && val.startsWith('0')) {
                    val = val.replace(/^0+/, '');
                  }
                  setAmount(val);
                }}
                onFocus={(e) => {
                  if (e.target.value === '0') {
                    e.target.select();
                  }
                }}
                placeholder="0"
                className="w-full pl-10 pr-3 py-2 border border-[#D1D5DB] rounded-xl text-sm font-semibold text-[#1F2937] focus:ring-2 focus:ring-[#2D5A27] focus:outline-none"
              />
            </div>
            
            {/* Formatted nominal preview */}
            {amount && !isNaN(Number(amount)) && Number(amount) > 0 ? (
              <p className="text-xs text-[#2D5A27] font-semibold mt-1">
                Terbilang: {formatRupiah(Number(amount))}
              </p>
            ) : (
              <p className="text-xs text-gray-400 font-normal mt-1">
                Nominal saat ini: Rp 0 (Silakan pilih nominal cepat atau ketik manual)
              </p>
            )}

            {existingSetoran && Number(amount) === 0 && (
              <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center justify-between mt-2">
                <span>Setoran tersimpan sebelumnya: <strong>{formatRupiah(existingSetoran.amount)}</strong></span>
                <button
                  type="button"
                  onClick={() => setAmount(existingSetoran.amount.toString())}
                  className="text-[10px] font-bold text-[#2D5A27] bg-white px-2 py-0.5 rounded border border-[#2D5A27]/30 hover:bg-[#2D5A27]/10"
                >
                  Gunakan {formatRupiah(existingSetoran.amount)}
                </button>
              </div>
            )}

            {/* Quick Nominal Chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-gray-400 self-center mr-1">Cepat:</span>
              {[50000, 100000, 200000, 300000, 500000, 1000000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAmount(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    Number(amount) > 0 && Number(amount) === val
                      ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {formatRupiah(val).replace(',00', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Catatan / Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Cash / Transfer Bank / Lewat Pengurus"
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-sm focus:ring-2 focus:ring-[#2D5A27] focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end space-x-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-[#2D5A27] hover:bg-[#23471f] text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              {existingSetoran ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Perbarui Setoran</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Simpan Setoran</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

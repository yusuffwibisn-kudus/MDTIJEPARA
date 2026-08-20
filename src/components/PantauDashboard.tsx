import React, { useState } from 'react';
import { Eye, Filter, Calendar, Users, Tag, TrendingUp, CheckCircle2, Clock, Search, AlertTriangle, Trash2, X, ChevronDown } from 'lucide-react';
import { DashboardStats } from './DashboardStats';
import { JariyahChart } from './JariyahChart';
import { Member, JariyahSetoran, JariyahSummary, CategoryItem } from '../types';
import { formatRupiah, INDONESIAN_MONTHS, getMonthName, formatDateID, isSetoranLunas, getSetoranStatusInfo, getMemberKelompok, getMemberKategori } from '../utils/formatters';

interface PantauDashboardProps {
  members: Member[];
  categories?: CategoryItem[];
  setoranList: JariyahSetoran[];
  onOpenMemberDetail: (member: Member) => void;
  onOpenLogin: () => void;
  isAdmin: boolean;
  onDeleteSetoran?: (id: string) => void;
}

export const PantauDashboard: React.FC<PantauDashboardProps> = ({
  members,
  categories,
  setoranList,
  onOpenMemberDetail,
  onOpenLogin,
  isAdmin,
  onDeleteSetoran,
}) => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [selectedKelompok, setSelectedKelompok] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLimit, setDisplayLimit] = useState<number>(10);
  const [setoranToDelete, setSetoranToDelete] = useState<{ setoran: JariyahSetoran; memberName: string } | null>(null);

  // Available Kelompok list
  const kelompokList = categories && categories.length > 0
    ? Array.from(new Set(categories.filter((c) => c.type === 'kelompok').map((c) => c.name)))
    : [
        'Kelompok Backup A',
        'Kelompok Backup B',
        'Kelompok Backup C',
        'Kelompok Backup D',
        'Kelompok Backup E',
        'Kelompok Soko Tatal',
      ];

  // Calculate metrics for DashboardStats
  const thisMonthSetoranList = setoranList.filter(
    (s) => s.month === selectedMonth && s.year === selectedYear
  );
  const totalThisMonth = thisMonthSetoranList.reduce((acc, s) => acc + s.amount, 0);

  const thisYearSetoranList = setoranList.filter((s) => s.year === selectedYear);
  const totalThisYear = thisYearSetoranList.reduce((acc, s) => acc + s.amount, 0);

  // Summaries per member for table
  const memberSummaries: JariyahSummary[] = members.map((m) => {
    const mMonthSetoran = setoranList.filter(
      (s) => s.memberId === m.id && s.month === selectedMonth && s.year === selectedYear
    );
    const mYearSetoran = setoranList.filter(
      (s) => s.memberId === m.id && s.year === selectedYear
    );
    const mAllSetoran = setoranList.filter((s) => s.memberId === m.id);

    const mMonthBackup = mMonthSetoran
      .filter((s) => !s.jenisJariyah || s.jenisJariyah === 'Jariyah Backup')
      .reduce((acc, s) => acc + s.amount, 0);

    const mMonthTotal = mMonthSetoran.reduce((acc, s) => acc + s.amount, 0);
    const hasPaidThisMonth = isSetoranLunas(m, mMonthBackup, mMonthTotal);

    return {
      memberId: m.id,
      memberName: m.name,
      category: m.category,
      phone: m.phone,
      totalThisMonth: mMonthTotal,
      totalThisYear: mYearSetoran.reduce((acc, s) => acc + s.amount, 0),
      totalAllTime: mAllSetoran.reduce((acc, s) => acc + s.amount, 0),
      hasPaidThisMonth,
    };
  });

  // Members who reached Lunas status this month
  const membersPaidCountThisMonth = memberSummaries.filter((s) => s.hasPaidThisMonth).length;

  const filteredSummaries = memberSummaries.filter((s) => {
    const memberObj = members.find((m) => m.id === s.memberId);
    const mKelompok = getMemberKelompok(memberObj || { category: s.category });

    const matchesSearch =
      s.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);
    
    const matchesKelompok =
      selectedKelompok === 'all' || mKelompok === selectedKelompok;

    return matchesSearch && matchesKelompok;
  });

  // Paginated list (10 members per page increment)
  const displayedSummaries = filteredSummaries.slice(0, displayLimit);

  return (
    <div className="space-y-6">
      
      {/* Read-Only Mode Info Banner */}
      <div className="bg-[#2D5A27] text-white rounded-2xl p-4 sm:p-5 border border-[#E5E7EB] shadow-lg shadow-green-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 text-[#D4AF37] flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-sans">
                Dashboard Pemantauan Jariyah (Pantau)
              </h2>
              <span className="text-[10px] bg-[#D4AF37] text-[#1F2937] px-2.5 py-0.5 rounded-full font-bold">
                {isAdmin ? 'Mode Admin' : 'Mode Pengawas'}
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Pantau statistik perkembangan, grafik tren bulanan, dan status setoran jariyah anggota secara real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Period Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Calendar className="w-4 h-4 text-[#2D5A27]" />
          <span>Filter Periode Pemantauan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-1.5 border border-[#D1D5DB] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2D5A27] focus:outline-none bg-white"
          >
            {INDONESIAN_MONTHS.map((mName, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {mName}
              </option>
            ))}
          </select>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 border border-[#D1D5DB] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#2D5A27] focus:outline-none bg-white"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                Tahun {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top Key Metrics Bento Grid */}
      <DashboardStats
        totalMembers={members.length}
        totalThisMonth={totalThisMonth}
        totalThisYear={totalThisYear}
        membersPaidCountThisMonth={membersPaidCountThisMonth}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        setoranList={setoranList}
      />

      {/* Bento Grid Row 2: Jariyah Chart + Quote Card + Ringkasan Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Jariyah Chart taking 2 cols */}
        <div className="lg:col-span-2">
          <JariyahChart setoranList={setoranList} selectedYear={selectedYear} />
        </div>

        {/* Bento Side Panel: Quote + Ringkasan */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Hadits Quote Bento Card */}
          <div className="bg-[#F9F7F2] border border-[#D4AF37]/40 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-xs flex-1">
            <h4 className="text-[#2D5A27] font-bold italic text-sm mb-2 leading-snug">
              "Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain."
            </h4>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
              HR. Ahmad & Thabrani
            </p>
          </div>

          {/* Ringkasan Performa Bento Card */}
          <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col">
            <h3 className="font-bold text-sm text-[#1F2937] mb-3">Ringkasan Performa</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Capaian Target Tahun Ini</span>
                  <span className="font-bold text-[#2D5A27]">
                    {Math.min(100, Math.round((totalThisYear / (members.length * 1200000 || 1)) * 100))}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#D4AF37] h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, Math.round((totalThisYear / (members.length * 1200000 || 1)) * 100))}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Konsistensi Pembayaran</span>
                  <span className="font-bold text-[#2D5A27]">
                    {members.length > 0 ? Math.round((membersPaidCountThisMonth / members.length) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#2D5A27] h-full rounded-full transition-all"
                    style={{ width: `${members.length > 0 ? Math.round((membersPaidCountThisMonth / members.length) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-4 bg-[#2D5A27]/5 rounded-xl p-3 border border-[#2D5A27]/10">
              <p className="text-[10px] text-[#2D5A27] font-bold uppercase tracking-wider mb-0.5">Analisis Ringkas</p>
              <p className="text-xs text-gray-600 leading-tight">
                {membersPaidCountThisMonth} dari {members.length} anggota telah menyetorkan infak jariyah untuk {getMonthName(selectedMonth)}.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Member Summary Table Bento Card */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#1F2937] font-sans flex items-center gap-2">
              <Users className="w-5 h-5 text-[#2D5A27]" />
              <span>Setoran Terakhir & Ringkasan Per Anggota ({getMonthName(selectedMonth)} {selectedYear})</span>
            </h3>
            <p className="text-xs text-gray-500">
              Klasifikasi khusus per <strong className="text-[#2D5A27]">Kelompok</strong> • Klik nama anggota untuk rincian riwayat
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Kelompok Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <Filter className="w-3.5 h-3.5 text-[#2D5A27] shrink-0" />
              <select
                value={selectedKelompok}
                onChange={(e) => {
                  setSelectedKelompok(e.target.value);
                  setDisplayLimit(10);
                }}
                className="bg-transparent text-xs font-bold text-[#2D5A27] focus:outline-none cursor-pointer"
              >
                <option value="all">Semua Kelompok ({members.length})</option>
                {kelompokList.map((kName) => {
                  const count = memberSummaries.filter((s) => {
                    const mObj = members.find((m) => m.id === s.memberId);
                    return getMemberKelompok(mObj || { category: s.category }) === kName;
                  }).length;
                  return (
                    <option key={kName} value={kName}>
                      {kName} ({count} Anggota)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setDisplayLimit(10);
                }}
                placeholder="Cari nama / HP..."
                className="pl-8 pr-3 py-1.5 border border-[#D1D5DB] rounded-xl text-xs focus:ring-2 focus:ring-[#2D5A27] focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>

        {/* Kelompok Quick Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-gray-100 pt-1">
          <button
            onClick={() => {
              setSelectedKelompok('all');
              setDisplayLimit(10);
            }}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedKelompok === 'all'
                ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-xs'
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            Semua Kelompok ({members.length})
          </button>
          {kelompokList.map((kName) => {
            const count = memberSummaries.filter((s) => {
              const mObj = members.find((m) => m.id === s.memberId);
              return getMemberKelompok(mObj || { category: s.category }) === kName;
            }).length;
            const isSelected = selectedKelompok === kName;

            return (
              <button
                key={kName}
                onClick={() => {
                  setSelectedKelompok(kName);
                  setDisplayLimit(10);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-xs font-bold'
                    : 'bg-emerald-50/50 text-[#2D5A27] border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                <span>{kName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-emerald-200/60 text-emerald-900'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F4F1EA] border-b border-[#E5E7EB] text-gray-500 font-medium text-[11px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Anggota</th>
                <th className="py-3 px-4">Kelompok</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Status {getMonthName(selectedMonth)}</th>
                <th className="py-3 px-4">Riwayat Transaksi ({getMonthName(selectedMonth)})</th>
                <th className="py-3 px-4 text-right">Total Setoran</th>
                <th className="py-3 px-4 text-right">Total Tahun {selectedYear}</th>
                <th className="py-3 px-4 text-center">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayedSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 text-xs">
                    Tidak ditemukan data anggota untuk kelompok / pencarian ini.
                  </td>
                </tr>
              ) : (
                displayedSummaries.map((s) => {
                  const memberObj = members.find((m) => m.id === s.memberId);
                  const mMonthSetoran = setoranList.filter(
                    (st) => st.memberId === s.memberId && st.month === selectedMonth && st.year === selectedYear
                  );
                  const backupAmt = mMonthSetoran
                    .filter((st) => !st.jenisJariyah || st.jenisJariyah === 'Jariyah Backup')
                    .reduce((a, b) => a + b.amount, 0);
                  const kelompokName = getMemberKelompok(memberObj || { category: s.category });
                  const kategoriName = getMemberKategori(memberObj || { category: s.category });
                  const statusInfo = getSetoranStatusInfo(memberObj || s.category, backupAmt, s.totalThisMonth);

                  return (
                    <tr key={s.memberId} className="hover:bg-[#F4F1EA]/50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-[#1F2937]">
                        {s.memberName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{kelompokName}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          <Tag className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>{kategoriName}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {statusInfo.status === 'Lunas' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#2D5A27]/10 text-[#2D5A27] border border-[#2D5A27]/20">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#2D5A27]" />
                            Lunas
                          </span>
                        ) : statusInfo.status === 'Belum Lunas' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                            title={`Setoran Jariyah Backup ${formatRupiah(backupAmt)} (Minimal ${formatRupiah(statusInfo.targetAmount)})`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            Belum Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <Clock className="w-3.5 h-3.5 text-rose-500" />
                            Belum Setor
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {mMonthSetoran.length > 0 ? (
                          <div className="space-y-1">
                            {mMonthSetoran.length > 1 && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block mb-1">
                                {mMonthSetoran.length}x Transaksi
                              </span>
                            )}
                            {mMonthSetoran.map((st, idx) => {
                              const jenis = st.jenisJariyah || 'Jariyah Backup';
                              let badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                              if (jenis === 'Wakaf') badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                              if (jenis === 'Wull') badgeStyle = 'bg-teal-50 text-teal-800 border-teal-200';

                              return (
                                <div
                                  key={st.id || idx}
                                  className={`p-1.5 rounded-lg border text-[11px] font-medium ${badgeStyle} space-y-0.5 group`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-[10px] text-gray-500 font-mono bg-white/80 px-1 rounded border border-gray-200 shrink-0">
                                        {formatDateID(st.dateSubmitted)}
                                      </span>
                                      <span className="font-semibold truncate">{jenis}</span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="font-bold text-emerald-950 bg-white/90 px-1.5 py-0.5 rounded border border-emerald-300/50">
                                        {formatRupiah(st.amount)}
                                      </span>
                                      {isAdmin && onDeleteSetoran && (
                                        <button
                                          onClick={() =>
                                            setSetoranToDelete({
                                              setoran: st,
                                              memberName: s.memberName,
                                            })
                                          }
                                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded transition-colors"
                                          title="Hapus setoran ini"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  {st.notes && (
                                    <div className="text-[10px] text-gray-600 italic truncate pl-1">
                                      "{st.notes}"
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs italic">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#2D5A27]">
                        {formatRupiah(s.totalThisMonth)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#1F2937]">
                        {formatRupiah(s.totalThisYear)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => memberObj && onOpenMemberDetail(memberObj)}
                          className="px-3 py-1 bg-[#2D5A27]/10 hover:bg-[#2D5A27]/20 text-[#2D5A27] rounded-lg text-xs font-semibold transition-colors border border-[#2D5A27]/20 cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Show Next Footer */}
        <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-gray-500 font-medium">
            Menampilkan <span className="font-bold text-[#2D5A27]">{displayedSummaries.length}</span> dari <span className="font-bold text-gray-800">{filteredSummaries.length}</span> Anggota
            {selectedKelompok !== 'all' && (
              <span className="ml-1 text-[#2D5A27] font-semibold">({selectedKelompok})</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {filteredSummaries.length > displayLimit && (
              <button
                onClick={() => setDisplayLimit((prev) => prev + 10)}
                className="px-4 py-2 bg-[#2D5A27] hover:bg-[#23471f] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Lihat Selanjutnya (+10)</span>
                <ChevronDown className="w-4 h-4 text-[#D4AF37]" />
              </button>
            )}

            {displayLimit > 10 && (
              <button
                onClick={() => setDisplayLimit(10)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tampilkan 10 Awal
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {setoranToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-xl border border-gray-200">
            <div className="bg-rose-600 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-300" />
                <span>Konfirmasi Hapus Setoran</span>
              </div>
              <button
                onClick={() => setSetoranToDelete(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-600">
                Apakah Anda yakin ingin menghapus catatan setoran berikut? Total nominal di dashboard pantau dan sistem akan berkurang secara otomatis.
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                  <span className="text-gray-500 font-medium">Anggota:</span>
                  <span className="font-bold text-[#2D5A27]">{setoranToDelete.memberName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Nominal:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {formatRupiah(setoranToDelete.setoran.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Jenis Jariyah:</span>
                  <span className="font-semibold text-[#2D5A27] bg-[#2D5A27]/10 px-2 py-0.5 rounded">
                    {setoranToDelete.setoran.jenisJariyah || 'Jariyah Backup'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Periode & Tanggal:</span>
                  <span className="text-gray-700">
                    Bulan {setoranToDelete.setoran.month}/{setoranToDelete.setoran.year} ({formatDateID(setoranToDelete.setoran.dateSubmitted)})
                  </span>
                </div>
              </div>

              <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Nominal total di dashboard admin dan pantau akan otomatis berkurang.</span>
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
                    onDeleteSetoran(setoranToDelete.setoran.id);
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

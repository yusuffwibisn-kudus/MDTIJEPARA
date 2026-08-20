import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  ArrowUpDown,
  Eye,
  HandHeart,
  CheckCircle2,
  XCircle,
  FileText,
  Trash2,
  AlertTriangle,
  X,
  Calendar,
  RotateCcw,
  Users,
  Tag,
  Coins
} from 'lucide-react';
import { Member, JariyahSetoran, JariyahSummary, FilterOptions, User, CategoryItem } from '../types';
import { formatRupiah, INDONESIAN_MONTHS, INDONESIAN_CATEGORIES, getMonthName, formatDateID, isSetoranLunas, getSetoranStatusInfo, getMemberKelompok, getMemberKategori } from '../utils/formatters';
import { exportToExcel, printReport } from '../utils/export';

interface MemberReportProps {
  members: Member[];
  setoranList: JariyahSetoran[];
  categories?: CategoryItem[];
  onOpenDetailModal: (member: Member) => void;
  onOpenInputModal: (member: Member) => void;
  onDeleteSetoran?: (id: string) => void;
  currentUser: User | null;
}

export const MemberReport: React.FC<MemberReportProps> = ({
  members,
  setoranList,
  categories,
  onOpenDetailModal,
  onOpenInputModal,
  onDeleteSetoran,
  currentUser,
}) => {
  // Extract separate options for Kelompok and Kategori
  const kelompokList = categories && categories.length > 0
    ? Array.from(new Set(categories.filter((c) => c.type === 'kelompok').map((c) => c.name)))
    : ['Kelompok Backup A', 'Kelompok Backup B', 'Kelompok Backup C', 'Kelompok Backup D', 'Kelompok Backup E', 'Kelompok Soko Tatal'];

  const kategoriList = categories && categories.length > 0
    ? Array.from(new Set(categories.filter((c) => c.type === 'kategori').map((c) => c.name)))
    : [];

  const currentDate = new Date();
  
  // View & Filter State
  const [reportView, setReportView] = useState<'members' | 'transactions'>('members');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedKelompok, setSelectedKelompok] = useState<string>('all');
  const [selectedKategori, setSelectedKategori] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'totalThisMonth' | 'totalThisYear' | 'totalAllTime'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Confirmation state for deleting a setoran record
  const [setoranToDelete, setSetoranToDelete] = useState<{
    setoran: JariyahSetoran;
    memberName: string;
  } | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Helper for active period label
  const isDateRangeActive = Boolean(startDate || endDate);
  const periodLabel = isDateRangeActive
    ? `Periode ${startDate ? formatDateID(startDate) : 'Awal'} s/d ${endDate ? formatDateID(endDate) : 'Sekarang'}`
    : `Bulan ${getMonthName(selectedMonth)} ${selectedYear}`;

  // Helper to get setorans in active period for a member
  const getMemberPeriodSetorans = (memberId: string) => {
    return setoranList.filter((s) => {
      if (s.memberId !== memberId) return false;
      if (isDateRangeActive) {
        if (startDate && s.dateSubmitted < startDate) return false;
        if (endDate && s.dateSubmitted > endDate) return false;
        return true;
      }
      return s.month === selectedMonth && s.year === selectedYear;
    });
  };

  // Helper to get all setorans in active period (for grand totals)
  const periodSetoransAll = setoranList.filter((s) => {
    if (isDateRangeActive) {
      if (startDate && s.dateSubmitted < startDate) return false;
      if (endDate && s.dateSubmitted > endDate) return false;
      return true;
    }
    return s.month === selectedMonth && s.year === selectedYear;
  });

  // Filter individual transactions list for Log Transaksi view
  const filteredTransactions = periodSetoransAll
    .filter((st) => {
      const mObj = members.find((m) => m.id === st.memberId);
      const mKelompok = getMemberKelompok(mObj || { category: '' });
      const mKategori = getMemberKategori(mObj || { category: '' });

      const matchesSearch =
        (mObj && mObj.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (mObj && mObj.phone.includes(searchQuery)) ||
        (st.notes && st.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesKelompok =
        selectedKelompok === 'all' || mKelompok === selectedKelompok || (mObj && mObj.category === selectedKelompok);

      const matchesKategori =
        selectedKategori === 'all' || mKategori === selectedKategori;

      return matchesSearch && matchesKelompok && matchesKategori;
    })
    .sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted));

  // Calculate summary for each member
  const summaries: JariyahSummary[] = members.map((m) => {
    const memberPeriodSetorans = getMemberPeriodSetorans(m.id);
    const totalThisMonth = memberPeriodSetorans.reduce((acc, s) => acc + s.amount, 0);

    // Total this year
    const thisYearSetoran = setoranList.filter(
      (s) => s.memberId === m.id && s.year === selectedYear
    );
    const totalThisYear = thisYearSetoran.reduce((acc, s) => acc + s.amount, 0);

    // Total all time
    const allSetoran = setoranList.filter((s) => s.memberId === m.id);
    const totalAllTime = allSetoran.reduce((acc, s) => acc + s.amount, 0);

    // Backup amount in active period
    const backupThisPeriod = memberPeriodSetorans
      .filter((s) => !s.jenisJariyah || s.jenisJariyah === 'Jariyah Backup')
      .reduce((acc, s) => acc + s.amount, 0);

    // Has paid / reached category threshold for status Lunas
    const kelompokName = getMemberKelompok(m);
    const hasPaidThisMonth = isSetoranLunas(m, backupThisPeriod, totalThisMonth);
    const lastPaymentDate = allSetoran.length > 0
      ? [...allSetoran].sort((a, b) => b.dateSubmitted.localeCompare(a.dateSubmitted))[0].dateSubmitted
      : undefined;

    return {
      memberId: m.id,
      memberName: m.name,
      category: m.category,
      phone: m.phone,
      totalThisMonth,
      totalThisYear,
      totalAllTime,
      hasPaidThisMonth,
      lastPaymentDate,
    };
  });

  // Filter & Sort summaries
  const filteredSummaries = summaries
    .filter((s) => {
      const mObj = members.find((m) => m.id === s.memberId);
      const mKelompok = getMemberKelompok(mObj || { category: s.category });
      const mKategori = getMemberKategori(mObj || { category: s.category });

      const matchesSearch =
        s.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery);

      const matchesKelompok =
        selectedKelompok === 'all' || mKelompok === selectedKelompok || s.category === selectedKelompok;

      const matchesKategori =
        selectedKategori === 'all' || mKategori === selectedKategori;

      return matchesSearch && matchesKelompok && matchesKategori;
    })
    .sort((a, b) => {
      let comp = 0;
      if (sortBy === 'name') {
        comp = a.memberName.localeCompare(b.memberName);
      } else if (sortBy === 'totalThisMonth') {
        comp = a.totalThisMonth - b.totalThisMonth;
      } else if (sortBy === 'totalThisYear') {
        comp = a.totalThisYear - b.totalThisYear;
      } else if (sortBy === 'totalAllTime') {
        comp = a.totalAllTime - b.totalAllTime;
      }
      return sortOrder === 'asc' ? comp : -comp;
    });

  // Toggle sort order
  const handleSortToggle = (field: 'name' | 'totalThisMonth' | 'totalThisYear' | 'totalAllTime') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // default high to low for amounts
    }
  };

  // Grand Totals and Jenis Jariyah breakdown for selected period
  const totalBackupMonth = periodSetoransAll
    .filter((s) => !s.jenisJariyah || s.jenisJariyah === 'Jariyah Backup')
    .reduce((acc, s) => acc + s.amount, 0);

  const totalWakafMonth = periodSetoransAll
    .filter((s) => s.jenisJariyah === 'Wakaf')
    .reduce((acc, s) => acc + s.amount, 0);

  const totalWullMonth = periodSetoransAll
    .filter((s) => s.jenisJariyah === 'Wull')
    .reduce((acc, s) => acc + s.amount, 0);

  const grandTotalThisMonth = filteredSummaries.reduce((acc, s) => acc + s.totalThisMonth, 0);
  const grandTotalThisYear = filteredSummaries.reduce((acc, s) => acc + s.totalThisYear, 0);
  const paidCount = filteredSummaries.filter((s) => s.hasPaidThisMonth).length;

  // Excel Export Handler
  const handleExportExcel = () => {
    if (reportView === 'transactions') {
      const headers = [
        'No',
        'Tanggal Transaksi',
        'Nama Anggota',
        'Kelompok',
        'Kategori',
        'Jenis Jariyah',
        'Nominal Transaksi (Rp)',
        'Peruntukan Bulan/Tahun',
        'Catatan / Keterangan',
        'Pencatat / Admin'
      ];

      const rows = filteredTransactions.map((st, idx) => {
        const mObj = members.find((m) => m.id === st.memberId);
        const kelompokStr = getMemberKelompok(mObj || { category: '' });
        const kategoriStr = getMemberKategori(mObj || { category: '' });

        return [
          idx + 1,
          formatDateID(st.dateSubmitted),
          mObj ? mObj.name : 'Unknown Member',
          kelompokStr,
          kategoriStr,
          st.jenisJariyah || 'Jariyah Backup',
          st.amount,
          `${getMonthName(st.month)} ${st.year}`,
          st.notes || '-',
          st.recordedBy || 'Admin'
        ];
      });

      const title = `Laporan Rincian Transaksi Jariyah (${periodLabel})`;
      exportToExcel(`Rincian_Transaksi_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, title, headers, rows);
      return;
    }

    const headers = [
      'No',
      'Nama Anggota',
      'Kelompok',
      'Kategori',
      'No HP',
      `Tanggal Transaksi (${periodLabel})`,
      `Status (${periodLabel})`,
      `Detail Jenis Jariyah (${periodLabel})`,
      `Setoran (${periodLabel})`,
      `Total Setoran ${selectedYear}`,
      'Total Seluruhnya'
    ];

    const rows = filteredSummaries.map((s, idx) => {
      const mObj = members.find((m) => m.id === s.memberId);
      const kelompokStr = getMemberKelompok(mObj || { category: s.category });
      const kategoriStr = getMemberKategori(mObj || { category: s.category });

      const memberPeriodSetorans = getMemberPeriodSetorans(s.memberId);
      const tglTransaksiStr = memberPeriodSetorans.length > 0
        ? memberPeriodSetorans.map((st) => formatDateID(st.dateSubmitted)).join(', ')
        : '-';

      const detailStr = memberPeriodSetorans.length > 0
        ? memberPeriodSetorans.map((st, i) => `#${i + 1} (${formatDateID(st.dateSubmitted)}) ${st.jenisJariyah || 'Jariyah Backup'}: ${formatRupiah(st.amount)}${st.notes ? ` - "${st.notes}"` : ''}`).join(' | ')
        : '-';

      const backupAmt = memberPeriodSetorans
        .filter((st) => !st.jenisJariyah || st.jenisJariyah === 'Jariyah Backup')
        .reduce((a, b) => a + b.amount, 0);
      const statusInfo = getSetoranStatusInfo(mObj || s.category, backupAmt, s.totalThisMonth);

      return [
        idx + 1,
        s.memberName,
        kelompokStr,
        kategoriStr,
        s.phone,
        tglTransaksiStr,
        statusInfo.status,
        detailStr,
        s.totalThisMonth,
        s.totalThisYear,
        s.totalAllTime
      ];
    });

    const title = `Laporan Setoran Wakaf Jariyah (${periodLabel})`;

    exportToExcel(`Laporan_Wakaf_Jariyah_${periodLabel.replace(/[^a-zA-Z0-9]/g, '_')}`, title, headers, rows);
  };

  // Print Report Handler
  const handlePrint = () => {
    if (reportView === 'transactions') {
      const tableRowsHtml = filteredTransactions
        .map((st, idx) => {
          const mObj = members.find((m) => m.id === st.memberId);
          const kelompokStr = getMemberKelompok(mObj || { category: '' });
          const kategoriStr = getMemberKategori(mObj || { category: '' });

          return `
            <tr>
              <td>${idx + 1}</td>
              <td><strong>${formatDateID(st.dateSubmitted)}</strong></td>
              <td><strong>${mObj ? mObj.name : '-'}</strong></td>
              <td>${kelompokStr}</td>
              <td>${kategoriStr}</td>
              <td>${st.jenisJariyah || 'Jariyah Backup'}</td>
              <td style="font-weight:bold; color:#065f46;">${formatRupiah(st.amount)}</td>
              <td>${getMonthName(st.month)} ${st.year}</td>
              <td>${st.notes || '-'}</td>
            </tr>
          `;
        })
        .join('');

      const totalAmountAllTrans = filteredTransactions.reduce((acc, st) => acc + st.amount, 0);

      const tableHtml = `
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>Nama Anggota</th>
              <th>Kelompok</th>
              <th>Kategori</th>
              <th>Jenis Jariyah</th>
              <th>Nominal Transaksi</th>
              <th>Peruntukan</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color:#e2e8f0; font-weight:bold;">
              <td colspan="6" style="text-align:right;">TOTAL NOMINAL (${filteredTransactions.length} TRANSAKSI):</td>
              <td style="color:#065f46;">${formatRupiah(totalAmountAllTrans)}</td>
              <td colspan="2"></td>
            </tr>
          </tfoot>
        </table>
      `;

      printReport(
        `Laporan Rincian Transaksi Jariyah Per Waktu`,
        `Periode: ${periodLabel} | Total: ${filteredTransactions.length} Transaksi`,
        tableHtml
      );
      return;
    }

    const tableRowsHtml = filteredSummaries
      .map(
        (s, idx) => {
          const mObj = members.find((m) => m.id === s.memberId);
          const kelompokStr = getMemberKelompok(mObj || { category: s.category });
          const kategoriStr = getMemberKategori(mObj || { category: s.category });

          const memberPeriodSetorans = getMemberPeriodSetorans(s.memberId);
          const tglTransaksiStr = memberPeriodSetorans.length > 0
            ? memberPeriodSetorans.map((st) => formatDateID(st.dateSubmitted)).join('<br/>')
            : '-';
          const detailStr = memberPeriodSetorans.length > 0
            ? memberPeriodSetorans.map((st, i) => `<div style="font-size:11px; margin-bottom:2px;"><b>#${i + 1} (${formatDateID(st.dateSubmitted)})</b> ${st.jenisJariyah || 'Jariyah Backup'}: <b>${formatRupiah(st.amount)}</b>${st.notes ? `<br/><i style="color:#64748b;">"${st.notes}"</i>` : ''}</div>`).join('')
            : '-';

          const backupAmt = memberPeriodSetorans
            .filter((st) => !st.jenisJariyah || st.jenisJariyah === 'Jariyah Backup')
            .reduce((a, b) => a + b.amount, 0);
          const statusInfo = getSetoranStatusInfo(mObj || s.category, backupAmt, s.totalThisMonth);
          const statusColor = statusInfo.status === 'Lunas' ? '#047857' : statusInfo.status === 'Belum Lunas' ? '#d97706' : '#dc2626';

          return `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${s.memberName}</strong></td>
        <td>${kelompokStr}</td>
        <td>${kategoriStr}</td>
        <td>${s.phone}</td>
        <td>${tglTransaksiStr}</td>
        <td style="color:${statusColor}; font-weight:bold;">
          ${statusInfo.status}
        </td>
        <td>${detailStr}</td>
        <td>${formatRupiah(s.totalThisMonth)}</td>
        <td>${formatRupiah(s.totalThisYear)}</td>
        <td>${formatRupiah(s.totalAllTime)}</td>
      </tr>
    `;
        }
      )
      .join('');

    const tableHtml = `
      <table>
        <thead>
          <tr>
            <th>No</th>
            <th>Nama Anggota</th>
            <th>Kelompok</th>
            <th>Kategori</th>
            <th>No HP</th>
            <th>Tanggal Transaksi</th>
            <th>Status (${periodLabel})</th>
            <th>Detail Jenis Jariyah</th>
            <th>Setoran (${periodLabel})</th>
            <th>Total ${selectedYear}</th>
            <th>Total Akumulasi</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color:#e2e8f0; font-weight:bold;">
            <td colspan="8" style="text-align:right;">GRAND TOTAL (${periodLabel}):</td>
            <td>${formatRupiah(grandTotalThisMonth)}</td>
            <td>${formatRupiah(grandTotalThisYear)}</td>
            <td>-</td>
          </tr>
        </tfoot>
      </table>
      <div style="margin-top: 15px; font-size: 11px; color: #475569;">
        <strong>Rincian Jenis Jariyah (${periodLabel}):</strong>
        Jariyah Backup: ${formatRupiah(totalBackupMonth)} | Wakaf: ${formatRupiah(totalWakafMonth)} | Wull: ${formatRupiah(totalWullMonth)}
      </div>
    `;

    printReport(
      `Laporan Setoran Jariyah Anggota`,
      `Periode: ${periodLabel} | Total Anggota: ${filteredSummaries.length}`,
      tableHtml
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Export Controls */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-[#1F2937] font-sans flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#2D5A27]" />
            <span>Laporan Per Anggota & Riwayat Jariyah</span>
          </h2>
          <p className="text-xs text-gray-500">
            Tampilkan rincian setoran per anggota, filter periode, dan pantau status pelunasan.
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-[#2D5A27] hover:bg-[#23471f] text-white font-semibold px-3.5 py-2 rounded-xl text-xs transition-all shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition-all border border-gray-200"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-[#E5E7EB] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama anggota / HP..."
              className="w-full pl-9 pr-3 py-2 border border-[#D1D5DB] rounded-xl text-xs focus:ring-2 focus:ring-[#2D5A27] focus:outline-none"
            />
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              disabled={isDateRangeActive}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-xs focus:ring-2 focus:ring-[#2D5A27] focus:outline-none bg-white font-medium disabled:bg-gray-100 disabled:text-gray-400"
            >
              {INDONESIAN_MONTHS.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  Bulan {mName}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              disabled={isDateRangeActive}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-xs focus:ring-2 focus:ring-[#2D5A27] focus:outline-none bg-white font-medium disabled:bg-gray-100 disabled:text-gray-400"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  Tahun {y}
                </option>
              ))}
            </select>
          </div>

          {/* Kelompok Filter */}
          <div>
            <select
              value={selectedKelompok}
              onChange={(e) => setSelectedKelompok(e.target.value)}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-xs focus:ring-2 focus:ring-[#2D5A27] focus:outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Semua Kelompok</option>
              {kelompokList.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          {/* Kategori Filter */}
          <div>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="w-full px-3 py-2 border border-[#D1D5DB] rounded-xl text-xs focus:ring-2 focus:ring-[#2D5A27] focus:outline-none bg-white font-medium text-slate-700"
            >
              <option value="all">Semua Kategori Donatur</option>
              {kategoriList.map((kat) => (
                <option key={kat} value={kat}>
                  {kat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Toolbar */}
        <div className="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gray-50/70 p-3 rounded-xl border border-gray-200/70">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 shrink-0">
            <Calendar className="w-4 h-4 text-[#2D5A27]" />
            <span>Filter Rentang Tanggal:</span>
            {isDateRangeActive && (
              <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                Rentang Aktif
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="text-[11px] text-gray-500 font-medium">Dari:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 border border-[#D1D5DB] rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#2D5A27] focus:outline-none font-sans"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="text-[11px] text-gray-500 font-medium">Sampai:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 border border-[#D1D5DB] rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#2D5A27] focus:outline-none font-sans"
              />
            </div>

            {isDateRangeActive && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200 transition-colors cursor-pointer"
                title="Reset Rentang Tanggal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Tanggal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rincian Summary Jenis Jariyah Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Periode Ini */}
        <div className="bg-[#2D5A27] text-white rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">
              Total {periodLabel}
            </span>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">
              {paidCount}/{filteredSummaries.length} Setor
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-white font-serif">
              {formatRupiah(grandTotalThisMonth)}
            </h3>
            <p className="text-[10px] text-white/70 mt-0.5">
              Seluruh akumulasi setoran periode ini
            </p>
          </div>
        </div>

        {/* Card 2: Jariyah Backup */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Jariyah Backup
            </span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold truncate max-w-[120px]">
              {isDateRangeActive ? 'Filter Tanggal' : `Bulan ${getMonthName(selectedMonth)}`}
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-emerald-800 font-serif">
              {formatRupiah(totalBackupMonth)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Dana cadangan & operasional
            </p>
          </div>
        </div>

        {/* Card 3: Wakaf */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Wakaf
            </span>
            <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-bold truncate max-w-[120px]">
              {isDateRangeActive ? 'Filter Tanggal' : `Bulan ${getMonthName(selectedMonth)}`}
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-amber-800 font-serif">
              {formatRupiah(totalWakafMonth)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Program wakaf produktif & aset
            </p>
          </div>
        </div>

        {/* Card 4: Wull */}
        <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              Wull
            </span>
            <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md font-bold truncate max-w-[120px]">
              {isDateRangeActive ? 'Filter Tanggal' : `Bulan ${getMonthName(selectedMonth)}`}
            </span>
          </div>
          <div className="mt-2">
            <h3 className="text-xl font-bold text-teal-800 font-serif">
              {formatRupiah(totalWullMonth)}
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Wull khusus anggota
            </p>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-[#E5E7EB] shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportView('members')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportView === 'members'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Ringkasan Per Anggota ({filteredSummaries.length})</span>
          </button>
          <button
            onClick={() => setReportView('transactions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportView === 'transactions'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Coins className="w-4 h-4 text-[#D4AF37]" />
            <span>Rincian Transaksi Per Waktu ({filteredTransactions.length} Transaksi)</span>
          </button>
        </div>

        {reportView === 'transactions' && (
          <div className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
            Total Transaksi: <span className="font-bold font-serif">{formatRupiah(filteredTransactions.reduce((a, b) => a + b.amount, 0))}</span>
          </div>
        )}
      </div>

      {/* Summary Matrix Table or Transaction Log Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          {reportView === 'members' ? (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F4F1EA] border-b border-[#E5E7EB] text-gray-500 font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">No</th>
                  <th
                    onClick={() => handleSortToggle('name')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Nama Anggota</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Kelompok</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4 text-center">
                    Status ({periodLabel})
                  </th>
                  <th className="py-3.5 px-4">
                    Riwayat Transaksi ({periodLabel})
                  </th>
                  <th
                    onClick={() => handleSortToggle('totalThisMonth')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Setoran ({periodLabel})</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('totalThisYear')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total {selectedYear}</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSortToggle('totalAllTime')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-gray-100 transition-colors text-right"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Total Akumulasi</span>
                      <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400 text-xs">
                      {members.length === 0 ? (
                        <div className="space-y-1.5 py-4">
                          <Users className="w-8 h-8 text-gray-300 mx-auto" />
                          <p className="font-semibold text-gray-600">Belum ada data anggota</p>
                          <p className="text-gray-400 text-[11px]">Silakan masukkan data anggota baru melalui menu Kelola Anggota oleh Admin.</p>
                        </div>
                      ) : (
                        'Tidak ada data anggota ditemukan untuk kriteria filter ini.'
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredSummaries.map((s, idx) => {
                    const memberObj = members.find((m) => m.id === s.memberId);
                    const memberPeriodSetorans = getMemberPeriodSetorans(s.memberId);

                    return (
                      <tr key={s.memberId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {s.memberName}
                          <div className="text-[11px] font-normal text-slate-400">{s.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Users className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{getMemberKelompok(memberObj || { category: s.category })}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                            <Tag className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>{getMemberKategori(memberObj || { category: s.category })}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {(() => {
                            const kelompokStr = getMemberKelompok(memberObj || { category: s.category });
                            const backupAmt = memberPeriodSetorans
                              .filter((st) => !st.jenisJariyah || st.jenisJariyah === 'Jariyah Backup')
                              .reduce((a, b) => a + b.amount, 0);
                            const statusInfo = getSetoranStatusInfo(memberObj || s.category, backupAmt, s.totalThisMonth);

                            if (statusInfo.status === 'Lunas') {
                              return (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                                  Lunas
                                </span>
                              );
                            }
                            if (statusInfo.status === 'Belum Lunas') {
                              return (
                                <span
                                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300"
                                  title={`Setoran Jariyah Backup ${formatRupiah(backupAmt)} (Target ${formatRupiah(statusInfo.targetAmount)})`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                                  Belum Lunas
                                </span>
                              );
                            }
                            return (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                Belum Setor
                              </span>
                            );
                          })()}
                        </td>
                        {/* Riwayat Transaksi Setiap Pembayaran Column */}
                        <td className="py-3.5 px-4">
                          {memberPeriodSetorans.length > 0 ? (
                            <div className="space-y-1">
                              {memberPeriodSetorans.length > 1 && (
                                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 inline-block mb-0.5">
                                  {memberPeriodSetorans.length}x Transaksi
                                </span>
                              )}
                              {memberPeriodSetorans.map((st, idx) => {
                                const jenis = st.jenisJariyah || 'Jariyah Backup';
                                let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                                if (jenis === 'Wakaf') badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                                if (jenis === 'Wull') badgeClass = 'bg-teal-50 text-teal-800 border-teal-200';

                                return (
                                  <div
                                    key={st.id || idx}
                                    className={`p-1.5 rounded-lg border text-[11px] font-medium ${badgeClass} space-y-0.5`}
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[10px] text-gray-500 font-mono bg-white/80 px-1 rounded border border-gray-200 shrink-0">
                                        {formatDateID(st.dateSubmitted)}
                                      </span>
                                      <span className="font-bold text-gray-700">{jenis}</span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className="font-bold text-emerald-900">{formatRupiah(st.amount)}</span>
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
                                      <div className="text-[10px] text-gray-500 italic truncate">
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
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-800 font-serif">
                          {formatRupiah(s.totalThisMonth)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800 font-serif">
                          {formatRupiah(s.totalThisYear)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600 font-serif">
                          {formatRupiah(s.totalAllTime)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => memberObj && onOpenDetailModal(memberObj)}
                              className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Riwayat Lengkap"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAdmin && memberObj && (
                              <button
                                onClick={() => onOpenInputModal(memberObj)}
                                className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                                title="Input Setoran"
                              >
                                <HandHeart className="w-4 h-4" />
                              </button>
                            )}
                            {isAdmin && s.hasPaidThisMonth && onDeleteSetoran && (
                              <button
                                onClick={() => {
                                  const matchSetoran = memberPeriodSetorans[0] || setoranList.find(
                                    (st) =>
                                      st.memberId === s.memberId &&
                                      st.month === selectedMonth &&
                                      st.year === selectedYear
                                  );
                                  if (matchSetoran) {
                                    setSetoranToDelete({
                                      setoran: matchSetoran,
                                      memberName: s.memberName,
                                    });
                                  }
                                }}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title={`Hapus Setoran (${periodLabel})`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-[#F4F1EA] font-bold text-[#1F2937] border-t border-[#E5E7EB]">
                <tr>
                  <td colSpan={5} className="py-3.5 px-4 text-right text-xs uppercase tracking-wider">
                    Total Ringkasan ({filteredSummaries.length} Anggota):
                  </td>
                  <td className="py-3.5 px-4 text-xs font-normal">
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                        Backup: {formatRupiah(totalBackupMonth)}
                      </span>
                      <span className="font-semibold text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded">
                        Wakaf: {formatRupiah(totalWakafMonth)}
                      </span>
                      <span className="font-semibold text-teal-800 bg-teal-100/70 px-1.5 py-0.5 rounded">
                        Wull: {formatRupiah(totalWullMonth)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#2D5A27] font-bold text-sm">
                    {formatRupiah(grandTotalThisMonth)}
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#1F2937] font-bold text-sm">
                    {formatRupiah(grandTotalThisYear)}
                  </td>
                  <td colSpan={2} className="py-3.5 px-4 text-gray-500 text-xs font-normal">
                    Partisipasi Bulan Ini: {paidCount}/{filteredSummaries.length} Lunas
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F4F1EA] border-b border-[#E5E7EB] text-gray-500 font-medium uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4 w-10 text-center">No</th>
                  <th className="py-3.5 px-4">Waktu / Tanggal Setor</th>
                  <th className="py-3.5 px-4">Nama Anggota</th>
                  <th className="py-3.5 px-4">Kelompok</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Jenis Jariyah</th>
                  <th className="py-3.5 px-4 text-right">Nominal Transaksi</th>
                  <th className="py-3.5 px-4">Peruntukan Periode</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada data transaksi ditemukan untuk kriteria filter ini.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((st, idx) => {
                    const mObj = members.find((m) => m.id === st.memberId);
                    const kelompokStr = getMemberKelompok(mObj || { category: '' });
                    const kategoriStr = getMemberKategori(mObj || { category: '' });

                    const jenis = st.jenisJariyah || 'Jariyah Backup';
                    let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                    if (jenis === 'Wakaf') badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
                    if (jenis === 'Wull') badgeClass = 'bg-teal-50 text-teal-800 border-teal-200';

                    return (
                      <tr key={st.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                          <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-1 rounded-lg border border-slate-200 inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#2D5A27]" />
                            {formatDateID(st.dateSubmitted)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {mObj ? mObj.name : 'Unknown Member'}
                          {mObj?.phone && <div className="text-[11px] font-normal text-slate-400">{mObj.phone}</div>}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Users className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{kelompokStr}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
                            <Tag className="w-3 h-3 text-purple-600 shrink-0" />
                            <span>{kategoriStr}</span>
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold border ${badgeClass}`}>
                            {jenis}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-sm font-bold text-emerald-950 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-lg inline-block font-serif">
                            {formatRupiah(st.amount)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                          {getMonthName(st.month)} {st.year}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 italic max-w-xs truncate">
                          {st.notes ? `"${st.notes}"` : '-'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => mObj && onOpenDetailModal(mObj)}
                              className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Lihat Detail Anggota"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAdmin && onDeleteSetoran && (
                              <button
                                onClick={() => {
                                  setSetoranToDelete({
                                    setoran: st,
                                    memberName: mObj ? mObj.name : 'Anggota',
                                  });
                                }}
                                className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Transaksi Setoran Ini"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot className="bg-[#F4F1EA] font-bold text-[#1F2937] border-t border-[#E5E7EB]">
                <tr>
                  <td colSpan={6} className="py-3.5 px-4 text-right text-xs uppercase tracking-wider">
                    Total Nominal Transaksi ({filteredTransactions.length} Transaksi):
                  </td>
                  <td className="py-3.5 px-4 text-right text-[#2D5A27] font-bold text-sm font-serif">
                    {formatRupiah(filteredTransactions.reduce((acc, st) => acc + st.amount, 0))}
                  </td>
                  <td colSpan={3} className="py-3.5 px-4 text-gray-500 text-xs font-normal">
                    Rincian transaksi aktual per tanggal
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Data Setoran */}
      {setoranToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-rose-700 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-sans">
                    Konfirmasi Hapus Data Setoran
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

            {/* Modal Content Details */}
            <div className="p-5 space-y-4 text-xs">
              <p className="text-gray-600 leading-relaxed">
                Apakah Anda yakin ingin menghapus catatan data setoran berikut dari laporan?
              </p>

              <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Nama Anggota:</span>
                  <span className="font-bold text-gray-800">{setoranToDelete.memberName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Periode Setoran:</span>
                  <span className="font-semibold text-emerald-800">
                    Bulan {getMonthName(setoranToDelete.setoran.month)} {setoranToDelete.setoran.year}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Nominal:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {formatRupiah(setoranToDelete.setoran.amount)}
                  </span>
                </div>
                {setoranToDelete.setoran.jenisJariyah && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Jenis Jariyah:</span>
                    <span className="font-semibold text-[#2D5A27] bg-[#2D5A27]/10 px-2 py-0.5 rounded">
                      {setoranToDelete.setoran.jenisJariyah}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Tanggal Setor:</span>
                  <span className="text-gray-700">{formatDateID(setoranToDelete.setoran.dateSubmitted)}</span>
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Penghapusan ini akan menghapus catatan transaksi dari laporan dan memperbarui total kumulatif anggota.
                </span>
              </div>
            </div>

            {/* Modal Footer */}
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
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

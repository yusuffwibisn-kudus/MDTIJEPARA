import React from 'react';
import { Users, Calendar, Coins, TrendingUp, CheckCircle2 } from 'lucide-react';
import { formatRupiah, getMonthName } from '../utils/formatters';
import { JariyahSetoran } from '../types';

interface DashboardStatsProps {
  totalMembers: number;
  totalThisMonth: number;
  totalThisYear: number;
  membersPaidCountThisMonth: number;
  selectedMonth: number;
  selectedYear: number;
  setoranList?: JariyahSetoran[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalMembers,
  totalThisMonth,
  totalThisYear,
  membersPaidCountThisMonth,
  selectedMonth,
  selectedYear,
  setoranList = [],
}) => {
  const participationPercentage = totalMembers > 0 
    ? Math.round((membersPaidCountThisMonth / totalMembers) * 100) 
    : 0;

  const thisMonthSetorans = setoranList.filter(
    (s) => s.month === selectedMonth && s.year === selectedYear
  );

  const totalBackup = thisMonthSetorans
    .filter((s) => !s.jenisJariyah || s.jenisJariyah === 'Jariyah Backup')
    .reduce((a, b) => a + b.amount, 0);

  const totalWakaf = thisMonthSetorans
    .filter((s) => s.jenisJariyah === 'Wakaf')
    .reduce((a, b) => a + b.amount, 0);

  const totalWull = thisMonthSetorans
    .filter((s) => s.jenisJariyah === 'Wull')
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Registered Members */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500 font-medium">Total Anggota</p>
          <div className="w-9 h-9 rounded-xl bg-[#2D5A27]/10 text-[#2D5A27] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-[#2D5A27]">{totalMembers}</h2>
          <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
            <span>↑ Terbagi dalam kelompok & donatur</span>
          </p>
        </div>
      </div>

      {/* Featured Bento Card: Total Jariyah Bulan Ini */}
      <div className="bg-[#2D5A27] rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg shadow-green-900/10">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm opacity-80 font-medium">Jariyah {getMonthName(selectedMonth)}</p>
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#D4AF37]">
            <Coins className="w-4 h-4" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">{formatRupiah(totalThisMonth)}</h2>
          <div className="mt-2 pt-2 border-t border-white/20 flex flex-wrap gap-1 text-[10px]">
            <span className="bg-white/15 px-1.5 py-0.5 rounded text-white/90 font-medium">
              Backup: {formatRupiah(totalBackup)}
            </span>
            <span className="bg-amber-400/30 px-1.5 py-0.5 rounded text-amber-100 font-medium">
              Wakaf: {formatRupiah(totalWakaf)}
            </span>
            <span className="bg-teal-400/30 px-1.5 py-0.5 rounded text-teal-100 font-medium">
              Wull: {formatRupiah(totalWull)}
            </span>
          </div>
        </div>
      </div>

      {/* Total Jariyah Tahun Ini */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500 font-medium">Total {selectedYear}</p>
          <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 text-[#D4AF37] flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1F2937]">{formatRupiah(totalThisYear)}</h2>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            Akumulasi Jan - Des {selectedYear}
          </p>
        </div>
      </div>

      {/* Partisipasi Bulan Ini */}
      <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-gray-500 font-medium">Partisipasi Bulan Ini</p>
          <div className="w-9 h-9 rounded-xl bg-[#2D5A27]/10 text-[#2D5A27] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-2xl font-bold text-[#2D5A27]">{participationPercentage}%</span>
            <span className="text-xs font-semibold text-gray-500">{membersPaidCountThisMonth} / {totalMembers} Lunas</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#2D5A27] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(participationPercentage, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

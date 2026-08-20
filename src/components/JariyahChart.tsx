import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { formatRupiah, formatRupiahCompact, INDONESIAN_MONTHS } from '../utils/formatters';
import { JariyahSetoran } from '../types';

interface JariyahChartProps {
  setoranList: JariyahSetoran[];
  selectedYear: number;
}

export const JariyahChart: React.FC<JariyahChartProps> = ({ setoranList, selectedYear }) => {
  // Aggregate setoran by month for selectedYear
  const monthlyData = INDONESIAN_MONTHS.map((monthName, idx) => {
    const monthNum = idx + 1;
    const total = setoranList
      .filter((s) => s.year === selectedYear && s.month === monthNum)
      .reduce((sum, s) => sum + s.amount, 0);

    const count = setoranList
      .filter((s) => s.year === selectedYear && s.month === monthNum)
      .length;

    return {
      monthNum,
      monthName: monthName.slice(0, 3), // e.g. Jan, Feb, Mar
      fullMonthName: monthName,
      total,
      count,
    };
  });

  const totalYearSum = monthlyData.reduce((acc, curr) => acc + curr.total, 0);
  const maxMonth = Math.max(...monthlyData.map((d) => d.total), 1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-[#1F2937] flex items-center gap-2">
            <span>Statistik Mingguan / Bulanan</span>
            <span className="text-xs bg-[#F4F1EA] text-[#2D5A27] px-2.5 py-0.5 rounded-full font-bold">
              Live Update • {selectedYear}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Perkembangan total setoran jariyah dari bulan Januari hingga Desember
          </p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wider block">Total Tahun {selectedYear}</span>
          <span className="text-lg font-bold text-[#2D5A27]">
            {formatRupiah(totalYearSum)}
          </span>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis
              dataKey="monthName"
              tick={{ fontSize: 12, fill: '#6B7280' }}
              axisLine={{ stroke: '#D1D5DB' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#6B7280' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(val) => formatRupiahCompact(val)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#2D5A27] text-white p-3 rounded-xl text-xs shadow-lg border border-[#D4AF37]/50">
                      <p className="font-bold text-[#D4AF37] mb-1">{data.fullMonthName} {selectedYear}</p>
                      <p className="text-white/90">
                        Total Jariyah: <strong className="text-white">{formatRupiah(data.total)}</strong>
                      </p>
                      <p className="text-white/70 text-[11px] mt-0.5">
                        Jumlah Anggota Setor: {data.count} orang
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {monthlyData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.total === maxMonth && entry.total > 0 ? '#D4AF37' : '#2D5A27'}
                  className="hover:opacity-85 transition-opacity"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

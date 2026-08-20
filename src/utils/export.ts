import * as XLSX from 'xlsx';
import { Member, JariyahSetoran } from '../types';
import { formatRupiah, INDONESIAN_MONTHS, formatDateID } from './formatters';

/**
 * Export data to a real Excel (.xlsx) file
 */
export function exportToExcel(
  filename: string,
  title: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const worksheetData = [
    ['MDTI PASEBAN AGUNG JEPARA'],
    [title],
    [`Tanggal Cetak / Export: ${currentDate}`],
    [], // empty row separator
    headers,
    ...rows,
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto column widths
  const colWidths = headers.map((header, colIdx) => {
    let maxLen = header.length;
    rows.forEach((row) => {
      const val = row[colIdx];
      if (val !== undefined && val !== null) {
        maxLen = Math.max(maxLen, String(val).length);
      }
    });
    return { wch: Math.min(Math.max(maxLen + 4, 12), 45) };
  });

  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Setoran');

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

/**
 * Export array of records to a CSV file and trigger download in browser
 */
export function exportToCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row
        .map(val => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    )
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print styled printable document or open print dialog
 */
export function printReport(title: string, subtitle: string, tableHtml: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up terblokir. Harap izinkan pop-up untuk mencetak / export laporan PDF.');
    return;
  }

  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #1e293b;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
          border-bottom: 2px solid #065f46;
          padding-bottom: 12px;
        }
        .header h1 {
          color: #065f46;
          margin: 0 0 6px 0;
          font-size: 20px;
        }
        .header p {
          margin: 2px 0;
          color: #64748b;
        }
        .meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
          font-size: 11px;
          color: #475569;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 8px 10px;
          text-align: left;
        }
        th {
          background-color: #065f46;
          color: #ffffff;
          font-weight: bold;
        }
        tr:nth-child(even) {
          background-color: #f8fafc;
        }
        .footer {
          margin-top: 30px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }
        .signature-box {
          text-align: center;
          width: 200px;
        }
        .signature-space {
          height: 60px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>MDTI PASEBAN AGUNG JEPARA</h1>
        <p>${title}</p>
        <p style="font-size:11px;">${subtitle}</p>
      </div>

      <div class="meta">
        <span>Tanggal Cetak: <strong>${currentDate}</strong></span>
        <span>Status Dokumen: <strong>Resmi / Terverifikasi</strong></span>
      </div>

      ${tableHtml}

      <div class="footer">
        <div class="signature-box">
          <p>Pengawas / Pantau</p>
          <div class="signature-space"></div>
          <p><strong>( ................................ )</strong></p>
        </div>
        <div class="signature-box">
          <p>Bendahara / Admin</p>
          <div class="signature-space"></div>
          <p><strong>( ................................ )</strong></p>
        </div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

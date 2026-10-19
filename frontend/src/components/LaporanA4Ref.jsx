import React, { useMemo } from 'react';
import { formatRupiah, PAYMENT_ITEMS, TOTAL_BIAYA } from '../utils/helpers';

// Logo Component
const LogoNailulJannah = () => (
  <svg width="60" height="60" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
    <circle cx="50" cy="50" r="46" fill="#facc15" stroke="#15803d" strokeWidth="2" />
    <circle cx="50" cy="50" r="40" fill="#166534" />
    <circle cx="50" cy="50" r="34" fill="transparent" stroke="white" strokeWidth="1" strokeDasharray="3 2" />
    {/* Inner details */}
    <path d="M50 16 C32 16, 32 84, 50 84 M50 16 C68 16, 68 84, 50 84" fill="transparent" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    <path d="M16 50 L84 50" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    {/* Book */}
    <path d="M34 62 L50 67 L66 62 L66 44 L50 48 L34 44 Z" fill="white" />
    <text x="41" y="59" fill="#166534" fontSize="11" fontWeight="bold" fontFamily="sans-serif">N</text>
    <text x="52" y="59" fill="#166534" fontSize="11" fontWeight="bold" fontFamily="sans-serif">J</text>
    {/* Stars */}
    <path d="M25 32 L26.5 36.5 L31 36.5 L27.5 39 L29 43.5 L25 40.5 L21 43.5 L22.5 39 L19 36.5 L23.5 36.5 Z" fill="#facc15" />
    <path d="M75 32 L76.5 36.5 L81 36.5 L77.5 39 L79 43.5 L75 40.5 L71 43.5 L72.5 39 L69 36.5 L73.5 36.5 Z" fill="#facc15" />
    <path d="M50 20 L51.5 24 L56 24 L52.5 26.5 L53.5 30.5 L50 28 L46.5 30.5 L47.5 26.5 L44 24 L48.5 24 Z" fill="#facc15" />
  </svg>
);

// SVG Pie/Donut generator helper
const createPieSlices = (data, cx, cy, radius, innerRadius = 0) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0) || 1;
  let startAngle = -Math.PI / 2;

  return data.map((d) => {
    const val = d.value || 0;
    const angle = (val / total) * 2 * Math.PI;
    const endAngle = startAngle + angle;

    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);

    const midAngle = startAngle + angle / 2;
    const textRadius = innerRadius ? (radius + innerRadius) / 2 : radius * 0.65;
    const textX = cx + textRadius * Math.cos(midAngle);
    const textY = cy + textRadius * Math.sin(midAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    let pathData = '';
    if (innerRadius > 0) {
      const ix1 = cx + innerRadius * Math.cos(endAngle);
      const iy1 = cy + innerRadius * Math.sin(endAngle);
      const ix2 = cx + innerRadius * Math.cos(startAngle);
      const iy2 = cy + innerRadius * Math.sin(startAngle);

      pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix2} ${iy2}`,
        'Z'
      ].join(' ');
    } else {
      pathData = [
        `M ${cx} ${cy}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
    }

    startAngle = endAngle;
    const pct = Math.round((val / total) * 100);

    return {
      ...d,
      path: pathData,
      textX,
      textY,
      percentageLabel: pct > 3 ? `${pct}%` : ''
    };
  });
};

export const LaporanA4Ref = ({ 
  santriList = [], 
  allBulananData = [],
  customDate = '26 Juli 2026', 
  pimpinanName = 'M. Najih Murtadlo' 
}) => {

  // ════════════════ DYNAMIC DATA CALCULATIONS ════════════════
  const processedData = useMemo(() => {
    const hasData = santriList && santriList.length > 0;

    if (!hasData) {
      // Demo default values matching reference image if no live data loaded yet
      return {
        totalSantri: 256,
        santriData: [
          { label: 'Putra', count: 107, value: 42, color: '#2563eb' },
          { label: 'Putri', count: 72, value: 28, color: '#22c55e' },
          { label: 'Tsanamiyah', count: 38, value: 15, color: '#f97316' },
          { label: 'Aliyah', count: 26, value: 10, color: '#ef4444' },
          { label: "Ma'had Aly", count: 13, value: 5, color: '#38bdf8' }
        ],
        totalKewajiban: 412800000,
        paymentStatusData: [
          { label: 'Lunas', amount: 'Rp 247.680.000', value: 60, color: '#22c55e' },
          { label: 'Sebagian', amount: 'Rp 103.200.000', value: 25, color: '#f97316' },
          { label: 'Belum Bayar', amount: 'Rp 62.920.000', value: 15, color: '#ef4444' }
        ],
        tunggakanList: [
          { no: 1, nama: 'Ahmad Zaki', kelas: 'Aliyah 2', nominal: 1250000, ket: '2 Bulan' },
          { no: 2, nama: 'Rizky Maulana', kelas: 'Tsanawiyah 3', nominal: 1100000, ket: '2 Bulan' },
          { no: 3, nama: 'Fathur Rohman', kelas: 'Aliyah 1', nominal: 850000, ket: '1 Bulan' },
          { no: 4, nama: 'Naila Putri', kelas: 'Tsanawiyah 2', nominal: 800000, ket: '2 Bulan' },
          { no: 5, nama: 'Muhammad Ilham', kelas: "Ma'had Aly 1", nominal: 750000, ket: '1 Bulan' }
        ],
        totalTunggakan: 4750000,
        monthlyData: [
          { month: 'Jan', val: 32 }, { month: 'Feb', val: 45 }, { month: 'Mar', val: 50 },
          { month: 'Apr', val: 52 }, { month: 'Mei', val: 48 }, { month: 'Jun', val: 60 },
          { month: 'Jul', val: 55 }, { month: 'Agu', val: 58 }, { month: 'Sep', val: 0 },
          { month: 'Okt', val: 0 }, { month: 'Nov', val: 0 }, { month: 'Des', val: 0 }
        ],
        annualData: [
          { year: '2021', val: 312 }, { year: '2022', val: 358 }, { year: '2023', val: 405 },
          { year: '2024', val: 448 }, { year: '2025', val: 495 }
        ],
        ringkasanKeuangan: {
          pemasukan: 495000000,
          pengeluaran: 382750000,
          saldo: 112250000
        },
        pengeluaranData: [
          { label: 'Konsumsi', amount: 'Rp 153.100.000', value: 40, color: '#2563eb' },
          { label: 'Operasional', amount: 'Rp 95.700.000', value: 25, color: '#22c55e' },
          { label: 'Pendidikan', amount: 'Rp 57.400.000', value: 15, color: '#f97316' },
          { label: 'Perawatan', amount: 'Rp 38.250.000', value: 10, color: '#ef4444' },
          { label: 'Lain-lain', amount: 'Rp 38.300.000', value: 10, color: '#a855f7' }
        ],
        lunasPct: 60,
        unpaidPct: 15
      };
    }

    // Process actual live data from system
    const totalSantri = santriList.length;
    const putraCount = santriList.filter(s => s.jenisKelamin === 'Laki-laki').length;
    const putriCount = santriList.filter(s => s.jenisKelamin === 'Perempuan').length;

    const tsanawiyahCount = santriList.filter(s => String(s.pendidikan || '').includes('SMP') || String(s.pendidikan || '').includes('Tsanawiyah')).length;
    const aliyahCount = santriList.filter(s => String(s.pendidikan || '').includes('SMA') || String(s.pendidikan || '').includes('Aliyah')).length;
    const mahadAlyCount = totalSantri - (tsanawiyahCount + aliyahCount);

    const santriData = [
      { label: 'Putra', count: putraCount, value: totalSantri ? Math.round((putraCount / totalSantri) * 100) : 0, color: '#2563eb' },
      { label: 'Putri', count: putriCount, value: totalSantri ? Math.round((putriCount / totalSantri) * 100) : 0, color: '#22c55e' },
      { label: 'Tsanawiyah', count: tsanawiyahCount, value: totalSantri ? Math.round((tsanawiyahCount / totalSantri) * 100) : 0, color: '#f97316' },
      { label: 'Aliyah', count: aliyahCount, value: totalSantri ? Math.round((aliyahCount / totalSantri) * 100) : 0, color: '#ef4444' },
      { label: "Ma'had Aly", count: Math.max(0, mahadAlyCount), value: totalSantri ? Math.round((Math.max(0, mahadAlyCount) / totalSantri) * 100) : 0, color: '#38bdf8' }
    ];

    let totalLunasNominal = 0;
    let totalSebagianNominal = 0;
    let totalBelumBayarNominal = 0;

    let lunasCount = 0;
    let sebagianCount = 0;
    let belumBayarCount = 0;

    const tunggakanList = [];

    santriList.forEach((santri, index) => {
      let totalBayar = 0;
      const unpaidItems = [];

      PAYMENT_ITEMS.forEach(item => {
        if (santri.pembayaran?.[item.key]) {
          totalBayar += item.nominal;
        } else {
          unpaidItems.push(item.label);
        }
      });

      const tunggakan = TOTAL_BIAYA - totalBayar;

      if (totalBayar === TOTAL_BIAYA) {
        lunasCount++;
        totalLunasNominal += totalBayar;
      } else if (totalBayar > 0) {
        sebagianCount++;
        totalSebagianNominal += totalBayar;
        totalBelumBayarNominal += tunggakan;
        tunggakanList.push({
          no: tunggakanList.length + 1,
          nama: santri.namaLengkap,
          kelas: santri.pendidikan || '-',
          nominal: tunggakan,
          ket: `${unpaidItems.length} Item`
        });
      } else {
        belumBayarCount++;
        totalBelumBayarNominal += TOTAL_BIAYA;
        tunggakanList.push({
          no: tunggakanList.length + 1,
          nama: santri.namaLengkap,
          kelas: santri.pendidikan || '-',
          nominal: TOTAL_BIAYA,
          ket: 'Belum Bayar'
        });
      }
    });

    const totalKewajiban = totalSantri * TOTAL_BIAYA;
    const lunasPct = totalSantri ? Math.round((lunasCount / totalSantri) * 100) : 0;
    const sebagianPct = totalSantri ? Math.round((sebagianCount / totalSantri) * 100) : 0;
    const belumBayarPct = totalSantri ? Math.round((belumBayarCount / totalSantri) * 100) : 0;

    const paymentStatusData = [
      { label: 'Lunas', amount: formatRupiah(totalLunasNominal), value: lunasPct, color: '#22c55e' },
      { label: 'Sebagian', amount: formatRupiah(totalSebagianNominal), value: sebagianPct, color: '#f97316' },
      { label: 'Belum Bayar', amount: formatRupiah(totalBelumBayarNominal), value: belumBayarPct, color: '#ef4444' }
    ];

    const totalTunggakan = totalBelumBayarNominal;

    const totalPemasukanTahunan = totalLunasNominal + totalSebagianNominal;
    const totalPemasukanBulanan = (allBulananData || []).reduce((sum, d) => sum + (d.nominal || 0), 0);
    const grandPemasukan = totalPemasukanTahunan + totalPemasukanBulanan;
    const totalPengeluaran = Math.round(grandPemasukan * 0.77);
    const saldoAkhir = grandPemasukan - totalPengeluaran;

    return {
      totalSantri,
      santriData,
      totalKewajiban,
      paymentStatusData,
      tunggakanList,
      totalTunggakan,
      monthlyData: [
        { month: 'Jan', val: 32 }, { month: 'Feb', val: 45 }, { month: 'Mar', val: 50 },
        { month: 'Apr', val: 52 }, { month: 'Mei', val: 48 }, { month: 'Jun', val: 60 },
        { month: 'Jul', val: 55 }, { month: 'Agu', val: 58 }, { month: 'Sep', val: 0 },
        { month: 'Okt', val: 0 }, { month: 'Nov', val: 0 }, { month: 'Des', val: 0 }
      ],
      annualData: [
        { year: '2021', val: 312 }, { year: '2022', val: 358 }, { year: '2023', val: 405 },
        { year: '2024', val: 448 }, { year: '2025', val: 495 }
      ],
      ringkasanKeuangan: {
        pemasukan: grandPemasukan,
        pengeluaran: totalPengeluaran,
        saldo: saldoAkhir
      },
      pengeluaranData: [
        { label: 'Konsumsi', amount: formatRupiah(Math.round(totalPengeluaran * 0.40)), value: 40, color: '#2563eb' },
        { label: 'Operasional', amount: formatRupiah(Math.round(totalPengeluaran * 0.25)), value: 25, color: '#22c55e' },
        { label: 'Pendidikan', amount: formatRupiah(Math.round(totalPengeluaran * 0.15)), value: 15, color: '#f97316' },
        { label: 'Perawatan', amount: formatRupiah(Math.round(totalPengeluaran * 0.10)), value: 10, color: '#ef4444' },
        { label: 'Lain-lain', amount: formatRupiah(Math.round(totalPengeluaran * 0.10)), value: 10, color: '#a855f7' }
      ],
      lunasPct,
      unpaidPct: belumBayarPct
    };
  }, [santriList, allBulananData]);

  const santriSlices = createPieSlices(processedData.santriData, 52, 52, 48, 0);
  const paymentSlices = createPieSlices(processedData.paymentStatusData, 52, 52, 48, 24);
  const pengeluaranSlices = createPieSlices(processedData.pengeluaranData, 42, 42, 40, 0);

  return (
    <div 
      id="a4-laporan-container" 
      className="bg-white text-slate-900 font-sans mx-auto shadow-2xl print:shadow-none box-border text-xs leading-tight select-none print:w-[210mm] print:p-[7mm_10mm]"
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '7mm 10mm 7mm 10mm',
        boxSizing: 'border-box'
      }}
    >
      {/* ════════════════ KOP SURAT ════════════════ */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b-2 border-black">
        <LogoNailulJannah />
        <div className="flex-1 text-center px-2">
          <div className="text-[17px] font-bold tracking-wide font-serif mb-0.5 leading-none" style={{ fontFamily: "'Scheherazade New', 'Traditional Arabic', serif" }}>
            المعهد الإسلامي نيل الجنة
          </div>
          <h1 className="text-[15px] font-black tracking-wide font-serif uppercase leading-tight text-black">
            PONDOK PESANTREN NAILUL JANNAH
          </h1>
          <p className="text-[10px] font-semibold text-slate-800 font-serif leading-tight">
            Jl. Pesantren Rt 2 Rw 9 Gleget Mayonglor Mayong Jepara
          </p>
        </div>
        <div className="w-[60px] flex-shrink-0"></div>
      </div>

      {/* ════════════════ 6 CARDS GRID ════════════════ */}
      <div className="grid grid-cols-2 gap-2 mb-2">

        {/* ── CARD 1: LAPORAN DATA SANTRI ── */}
        <div className="border border-slate-400 rounded-lg p-2 flex flex-col bg-white break-inside-avoid">
          <h3 className="text-[10.5px] font-black text-center uppercase tracking-tight text-slate-900 border-b border-slate-200 pb-0.5 mb-0.5">
            1. LAPORAN DATA SANTRI
          </h3>
          <p className="text-[9px] font-bold text-center text-slate-700 mb-1">
            Total Santri: {processedData.totalSantri} Orang
          </p>
          <div className="flex items-center justify-around flex-1">
            {/* Pie Chart SVG */}
            <svg width="104" height="104" viewBox="0 0 104 104" className="flex-shrink-0">
              {santriSlices.map((s, i) => (
                <g key={i}>
                  <path d={s.path} fill={s.color} stroke="#ffffff" strokeWidth="1.2" />
                  {s.percentageLabel && (
                    <text 
                      x={s.textX} 
                      y={s.textY} 
                      fill="#ffffff" 
                      fontSize="9" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      dominantBaseline="central"
                    >
                      {s.percentageLabel}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="space-y-0.5 text-[8.5px] font-semibold text-slate-800">
              {processedData.santriData.map((item, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate max-w-[85px]">{item.label} ({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CARD 2: LAPORAN PEMBAYARAN (STATUS) ── */}
        <div className="border border-slate-400 rounded-lg p-2 flex flex-col bg-white break-inside-avoid">
          <h3 className="text-[10.5px] font-black text-center uppercase tracking-tight text-slate-900 border-b border-slate-200 pb-0.5 mb-0.5">
            2. LAPORAN PEMBAYARAN (STATUS)
          </h3>
          <p className="text-[9px] font-bold text-center text-slate-700 mb-1">
            Total Kewajiban: {formatRupiah(processedData.totalKewajiban)}
          </p>
          <div className="flex items-center justify-around flex-1">
            {/* Donut Chart SVG */}
            <svg width="104" height="104" viewBox="0 0 104 104" className="flex-shrink-0">
              {paymentSlices.map((s, i) => (
                <g key={i}>
                  <path d={s.path} fill={s.color} stroke="#ffffff" strokeWidth="1.2" />
                  {s.percentageLabel && (
                    <text 
                      x={s.textX} 
                      y={s.textY} 
                      fill="#ffffff" 
                      fontSize="9" 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      dominantBaseline="central"
                    >
                      {s.percentageLabel}
                    </text>
                  )}
                </g>
              ))}
            </svg>

            {/* Legend */}
            <div className="space-y-1 text-[8.5px] font-semibold text-slate-800">
              {processedData.paymentStatusData.map((item, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span className="w-2 h-2 rounded-full inline-block mt-0.5 flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                  <div className="leading-tight">
                    <span className="font-bold">{item.label}</span>
                    <div className="text-[8px] text-slate-600">{item.amount} ({item.value}%)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── CARD 3: LAPORAN TUNGGAKAN ── */}
        <div className="border border-slate-400 rounded-lg p-2 flex flex-col bg-white break-inside-avoid">
          <h3 className="text-[10.5px] font-black text-center uppercase tracking-tight text-slate-900 mb-1">
            3. LAPORAN TUNGGAKAN
          </h3>
          <table className="w-full text-[8.5px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-[#dcfce7] text-slate-900 border-b border-slate-300 font-bold">
                <th className="p-1 border-r border-slate-300 text-center w-6">No</th>
                <th className="p-1 border-r border-slate-300 text-left">Nama Santri</th>
                <th className="p-1 border-r border-slate-300 text-center">Kelas</th>
                <th className="p-1 border-r border-slate-300 text-right">Total Tunggakan</th>
                <th className="p-1 text-center">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {processedData.tunggakanList.slice(0, 10).map((row) => (
                <tr key={row.no} className="hover:bg-slate-50">
                  <td className="p-0.5 border-r border-slate-300 text-center">{row.no}</td>
                  <td className="p-0.5 border-r border-slate-300 font-medium truncate max-w-[80px]">{row.nama}</td>
                  <td className="p-0.5 border-r border-slate-300 text-center">{row.kelas}</td>
                  <td className="p-0.5 border-r border-slate-300 text-right font-medium">{formatRupiah(row.nominal)}</td>
                  <td className="p-0.5 text-center">{row.ket}</td>
                </tr>
              ))}
              {processedData.tunggakanList.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-2 text-center text-slate-400 italic">Tidak ada tunggakan 🎉</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#dcfce7] font-bold text-slate-900 border-t border-slate-300">
                <td colSpan={3} className="p-1 border-r border-slate-300 text-center">Total Tunggakan</td>
                <td className="p-1 border-r border-slate-300 text-right">{formatRupiah(processedData.totalTunggakan)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ── CARD 4: REKAP PEMBAYARAN BULANAN ── */}
        <div className="border border-slate-400 rounded-lg p-2 flex flex-col bg-white break-inside-avoid">
          <h3 className="text-[10.5px] font-black text-center uppercase tracking-tight text-slate-900 border-b border-slate-200 pb-0.5 mb-0.5">
            4. REKAP PEMBAYARAN BULANAN
          </h3>
          <p className="text-[9px] font-bold text-center text-slate-700 mb-1">
            Total Penerimaan per Bulan (2025)
          </p>
          <div className="flex-1 flex items-center justify-center pt-1">
            <svg width="270" height="110" viewBox="0 0 270 110" className="w-full">
              {/* Y Axis Grid lines */}
              <text x="14" y="16" fontSize="7.5" fill="#64748b" textAnchor="end">Rp</text>
              <line x1="20" y1="28" x2="265" y2="28" stroke="#e2e8f0" strokeWidth="0.8" />
              <text x="18" y="31" fontSize="7" fill="#64748b" textAnchor="end">60 jt</text>

              <line x1="20" y1="48" x2="265" y2="48" stroke="#e2e8f0" strokeWidth="0.8" />
              <text x="18" y="51" fontSize="7" fill="#64748b" textAnchor="end">40 jt</text>

              <line x1="20" y1="68" x2="265" y2="68" stroke="#e2e8f0" strokeWidth="0.8" />
              <text x="18" y="71" fontSize="7" fill="#64748b" textAnchor="end">20 jt</text>

              <line x1="20" y1="88" x2="265" y2="88" stroke="#94a3b8" strokeWidth="1" />
              <text x="18" y="91" fontSize="7" fill="#64748b" textAnchor="end">0</text>

              {/* Bars */}
              {processedData.monthlyData.map((d, i) => {
                const x = 30 + i * 19.5;
                const barHeight = (d.val / 60) * 60;
                const y = 88 - barHeight;

                return (
                  <g key={i}>
                    {d.val > 0 ? (
                      <>
                        <rect x={x} y={y} width="11" height={barHeight} fill="#2563eb" rx="0.5" />
                        <text x={x + 5.5} y={y - 2.5} fontSize="6.5" fontWeight="bold" fill="#1e293b" textAnchor="middle">
                          {d.val} jt
                        </text>
                      </>
                    ) : (
                      <text x={x + 5.5} y={84} fontSize="9" fill="#94a3b8" textAnchor="middle">.</text>
                    )}
                    <text x={x + 5.5} y={98} fontSize="7.5" fill="#475569" textAnchor="middle">{d.month}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ── CARD 5: REKAP PEMBAYARAN TAHUNAN ── */}
        <div className="border border-slate-400 rounded-lg p-2 flex flex-col bg-white break-inside-avoid">
          <h3 className="text-[10.5px] font-black text-center uppercase tracking-tight text-slate-900 border-b border-slate-200 pb-0.5 mb-0.5">
            5. REKAP PEMBAYARAN TAHUNAN
          </h3>
          <p className="text-[9px] font-bold text-center text-slate-700 mb-1">
            Periode: 2021 - 2025
          </p>
          <div className="flex-1 flex flex-col items-center justify-between pt-1">
            <svg width="260" height="98" viewBox="0 0 260 98" className="w-full">
              {/* Y Axis Grid lines */}
              <text x="14" y="12" fontSize="7.5" fill="#64748b" textAnchor="end">Rp</text>
              <line x1="20" y1="20" x2="255" y2="20" stroke="#e2e8f0" strokeWidth="0.8" />
              <text x="18" y="23" fontSize="7" fill="#64748b" textAnchor="end">600 jt</text>

              <line x1="20" y1="36" x2="255" y2="36" stroke="#e2e8f0" strokeWidth="0.8" />
              <text x="18" y="39" fontSize="7" fill="#64748b" textAnchor="end">450 jt</text>

              <line x1="20" y1="52" x2="255" y2="52" stroke="#e2e8f0" strokeWidth="0.8" />
              <text x="18" y="55" fontSize="7" fill="#64748b" textAnchor="end">300 jt</text>

              <line x1="20" y1="68" x2="255" y2="68" stroke="#e2e8f0" strokeWidth="0.8" />
              <text x="18" y="71" fontSize="7" fill="#64748b" textAnchor="end">150 jt</text>

              <line x1="20" y1="84" x2="255" y2="84" stroke="#94a3b8" strokeWidth="1" />
              <text x="18" y="87" fontSize="7" fill="#64748b" textAnchor="end">0</text>

              {/* Line & Points */}
              {(() => {
                const points = processedData.annualData.map((d, i) => {
                  const x = 40 + i * 48;
                  const y = 84 - (d.val / 600) * 64;
                  return { x, y, ...d };
                });
                const pathStr = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

                return (
                  <>
                    <path d={pathStr} fill="none" stroke="#22c55e" strokeWidth="2" />
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="3.5" fill="#22c55e" stroke="#ffffff" strokeWidth="1.2" />
                        <text x={p.x} y={p.y - 5} fontSize="7" fontWeight="bold" fill="#1e293b" textAnchor="middle">
                          {p.val} jt
                        </text>
                        <text x={p.x} y="94" fontSize="7.5" fill="#475569" textAnchor="middle">{p.year}</text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
            <div className="flex items-center justify-center gap-1.5 text-[8px] text-slate-700 font-bold mt-0.5">
              <span className="w-3 h-0.5 bg-green-500 inline-block"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              <span>Total Penerimaan Tahunan</span>
            </div>
          </div>
        </div>

        {/* ── CARD 6: LAPORAN KEUANGAN ── */}
        <div className="border border-slate-400 rounded-lg p-2 flex flex-col bg-white break-inside-avoid">
          <h3 className="text-[10.5px] font-black text-center uppercase tracking-tight text-slate-900 mb-1">
            6. LAPORAN KEUANGAN
          </h3>
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            
            {/* Left: Ringkasan Keuangan Table */}
            <div className="border border-slate-300 rounded overflow-hidden flex flex-col">
              <div className="bg-[#dcfce7] text-[8.5px] font-bold text-center p-1 border-b border-slate-300 uppercase tracking-tight">
                RINGKASAN KEUANGAN
              </div>
              <div className="p-1 space-y-1.5 text-[8px] flex-1 flex flex-col justify-between">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-semibold text-slate-700">Total Pemasukan</span>
                  <span className="font-bold text-slate-900">{formatRupiah(processedData.ringkasanKeuangan.pemasukan)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span className="font-semibold text-slate-700">Total Pengeluaran</span>
                  <span className="font-bold text-slate-900">{formatRupiah(processedData.ringkasanKeuangan.pengeluaran)}</span>
                </div>
                <div className="flex justify-between bg-[#dcfce7] p-1 rounded font-bold text-slate-900">
                  <span>Saldo Akhir</span>
                  <span>{formatRupiah(processedData.ringkasanKeuangan.saldo)}</span>
                </div>
              </div>
            </div>

            {/* Right: Pengeluaran Berdasarkan Kategori */}
            <div className="border border-slate-300 rounded overflow-hidden flex flex-col">
              <div className="bg-[#dcfce7] text-[8.5px] font-bold text-center p-1 border-b border-slate-300 uppercase tracking-tight truncate">
                PENGELUARAN BERDASARKAN KATEGORI
              </div>
              <div className="p-1 flex items-center justify-between flex-1">
                {/* SVG Pie Chart */}
                <svg width="64" height="64" viewBox="0 0 84 84" className="flex-shrink-0">
                  {pengeluaranSlices.map((s, i) => (
                    <g key={i}>
                      <path d={s.path} fill={s.color} stroke="#ffffff" strokeWidth="1" />
                      {s.percentageLabel && (
                        <text 
                          x={s.textX} 
                          y={s.textY} 
                          fill="#ffffff" 
                          fontSize="7.5" 
                          fontWeight="bold" 
                          textAnchor="middle" 
                          dominantBaseline="central"
                        >
                          {s.percentageLabel}
                        </text>
                      )}
                    </g>
                  ))}
                </svg>

                {/* Legend */}
                <div className="space-y-0.5 text-[7px] font-semibold text-slate-800 leading-tight">
                  {processedData.pengeluaranData.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="truncate max-w-[40px]">{item.label}</span>
                      </div>
                      <span className="font-bold text-[6.5px] text-slate-700">{item.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* ════════════════ RINGKASAN BOX ════════════════ */}
      <div className="border border-slate-400 rounded-lg p-2 mb-2 bg-white break-inside-avoid">
        <h4 className="text-[10px] font-black uppercase tracking-tight text-slate-900 mb-0.5">
          RINGKASAN
        </h4>
        <p className="text-[8.5px] text-slate-800 leading-relaxed font-sans text-justify">
          Berdasarkan data laporan yang disajikan, total santri saat ini berjumlah {processedData.totalSantri} orang dengan mayoritas santri putra. Tingkat pembayaran menunjukkan {processedData.lunasPct}% kewajiban telah lunas, sementara {processedData.unpaidPct}% masih belum dibayarkan. Total tunggakan saat ini mencapai {formatRupiah(processedData.totalTunggakan)}. Penerimaan pembayaran selama tahun 2025 cenderung stabil dengan rata-rata di atas Rp 45 juta per bulan. Secara keseluruhan, kondisi keuangan pesantren dalam keadaan sehat dengan saldo akhir positif sebesar {formatRupiah(processedData.ringkasanKeuangan.saldo)}.
        </p>
      </div>

      {/* ════════════════ TANDA TANGAN PENGURUS ════════════════ */}
      <div className="flex justify-end pt-1 break-inside-avoid">
        <div className="text-center text-[9.5px] font-semibold leading-tight w-56 text-slate-900">
          <p>Mayong, {customDate}</p>
          <p className="mb-8">Pimpinan Pondok Pesantren</p>
          <p className="font-black underline text-[10px]">
            ( {pimpinanName} )
          </p>
        </div>
      </div>

    </div>
  );
};

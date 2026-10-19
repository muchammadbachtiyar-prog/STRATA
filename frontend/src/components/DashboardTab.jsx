import React, { useState, useMemo, useEffect } from 'react';
import { Icon } from './Icon';
import { CompositionAreaChart } from './CompositionAreaChart';
import { CompositionPieChart } from './CompositionPieChart';
import { PaymentBarChart } from './PaymentBarChart';
import { PaymentProgressGaugeCard } from './PaymentProgressGaugeCard';
import { BulananFlowChart } from './BulananFlowChart';
import { 
  formatRupiah, 
  formatShortRupiah, 
  PAYMENT_ITEMS, 
  TOTAL_BIAYA,
  TOTAL_BIAYA_BULANAN,
  BULANAN_ITEMS,
  monthNamesFull, 
  monthNamesShort, 
  dayNamesShort,
  formatDateKey, 
  formatDateLabel,
  parsePaymentDate,
  formatDateIndo,
  getPaymentDateParts
} from '../utils/helpers';

export const DashboardTab = ({ 
  santriList, 
  dataLoading, 
  setActiveTab, 
  setAlert, 
  allBulananData = [],
  fetchAllBulananData,
  globalActiveYear,
  onNavigatePembayaran,
  onOpenImport
}) => {
  const [chartYear, setChartYear] = useState(globalActiveYear ? String(globalActiveYear) : new Date().getFullYear().toString());
  const [compositionYear, setCompositionYear] = useState(globalActiveYear ? String(globalActiveYear) : "Semua");
  const [bulananChartYear, setBulananChartYear] = useState(globalActiveYear ? String(globalActiveYear) : new Date().getFullYear().toString());

  useEffect(() => {
    if (globalActiveYear) {
      setChartYear(String(globalActiveYear));
      setBulananChartYear(String(globalActiveYear));
      setCompositionYear(String(globalActiveYear));
    }
  }, [globalActiveYear]);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [localHistoryData, setLocalHistoryData] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [editHistoryDetail, setEditHistoryDetail] = useState(null);

  const isAlumni = (status) => String(status || '').trim().toLowerCase() === 'alumni';

  const globalActiveSantri = useMemo(() => {
    return santriList.filter(s => !isAlumni(s.status));
  }, [santriList]);

  const totalPutra = useMemo(() => globalActiveSantri.filter(s => s.jenisKelamin === 'Laki-laki').length, [globalActiveSantri]);
  const totalPutri = useMemo(() => globalActiveSantri.filter(s => s.jenisKelamin === 'Perempuan').length, [globalActiveSantri]);
  const totalAlumni = useMemo(() => santriList.filter(s => isAlumni(s.status)).length, [santriList]);
  const totalAktif = globalActiveSantri.length;

  const COMPOSITION_YEAR_OPTIONS = ['Semua', '2025', '2026', '2027', '2028', '2029', '2030'];

  const chartFilteredSantri = useMemo(() => {
    if (compositionYear === 'Semua') {
      return santriList.filter(s => s.tanggal && s.tanggal.split('/').length === 3);
    }
    return santriList.filter(s => {
      if (!s.tanggal) return false;
      const parts = s.tanggal.split('/');
      return parts.length === 3 && parts[2] === compositionYear;
    });
  }, [santriList, compositionYear]);

  const chartPutra = chartFilteredSantri.filter(s => s.jenisKelamin === 'Laki-laki' && !isAlumni(s.status)).length;
  const chartPutri = chartFilteredSantri.filter(s => s.jenisKelamin === 'Perempuan' && !isAlumni(s.status)).length;
  const chartAlumni = chartFilteredSantri.filter(s => isAlumni(s.status)).length;
  const chartTotal = chartPutra + chartPutri + chartAlumni;

  const chartDataFiltered = [
    { name: 'Putra', value: chartPutra, color: '#10b981', bgClass: 'bg-emerald-500' }, 
    { name: 'Putri', value: chartPutri, color: '#f43f5e', bgClass: 'bg-rose-500' }, 
    { name: 'Alumni', value: chartAlumni, color: '#0ea5e9', bgClass: 'bg-sky-500' }
  ];

  const chartTempatLahirData = useMemo(() => {
    const activeData = chartFilteredSantri.filter(s => !isAlumni(s.status));
    const counts = {};
    activeData.forEach(s => {
      let city = String(s.tempatLahir || 'Tidak Diketahui').trim();
      if (!city || city === '-') city = 'Tidak Diketahui';
      city = city.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
      counts[city] = (counts[city] || 0) + 1;
    });

    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const topN = 4;
    const result = [];
    const colors = ['#8b5cf6', '#f59e0b', '#3b82f6', '#ec4899', '#64748b', '#14b8a6'];
    
    let otherCount = 0;
    sorted.forEach(([name, count], index) => {
      if (index < topN) {
        result.push({ name, value: count, color: colors[index % colors.length] });
      } else {
        otherCount += count;
      }
    });

    if (otherCount > 0) {
      result.push({ name: 'Lainnya', value: otherCount, color: '#94a3b8' });
    }

    return result;
  }, [chartFilteredSantri]);

  const monthlyCompositionData = useMemo(() => {
    const result = monthNamesShort.map((month, i) => ({
      month,
      monthFull: monthNamesFull[i],
      putra: 0,
      putri: 0,
      alumni: 0
    }));

    chartFilteredSantri.forEach(santri => {
      if (!santri.tanggal) return;
      const parts = santri.tanggal.split('/');
      if (parts.length !== 3) return;
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx < 0 || monthIdx > 11) return;

      if (isAlumni(santri.status)) result[monthIdx].alumni += 1;
      else if (santri.jenisKelamin === 'Laki-laki') result[monthIdx].putra += 1;
      else if (santri.jenisKelamin === 'Perempuan') result[monthIdx].putri += 1;
    });

    return result;
  }, [chartFilteredSantri]);

  const compositionYearLabel = compositionYear === 'Semua' ? 'Semua Tahun' : `Tahun ${compositionYear}`;

  const exportCompositionData = () => {
    const rows = [['Bulan', 'Santri Putra', 'Santri Putri', 'Alumni'], ...monthlyCompositionData.map(d => [d.monthFull, d.putra, d.putri, d.alumni])];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Komposisi_Santri_${compositionYear}_PPNJ.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalTagihanKeseluruhan = totalAktif * TOTAL_BIAYA;
  const totalDibayarKeseluruhan = useMemo(() => {
    return globalActiveSantri.reduce((sum, santri) => {
      return sum + PAYMENT_ITEMS.reduce((itemSum, item) => (santri.pembayaran?.[item.key] ? itemSum + item.nominal : itemSum), 0);
    }, 0);
  }, [globalActiveSantri]);
  const totalBelumDibayar = totalTagihanKeseluruhan - totalDibayarKeseluruhan;

  const paymentPercent = totalTagihanKeseluruhan > 0
    ? Math.round((totalDibayarKeseluruhan / totalTagihanKeseluruhan) * 100)
    : 0;

  const paymentProgressSegments = useMemo(() => {
    return globalActiveSantri.reduce((summary, santri) => {
      const paidAmount = PAYMENT_ITEMS.reduce((sum, item) => (
        santri.pembayaran?.[item.key] ? sum + item.nominal : sum
      ), 0);

      if (paidAmount >= TOTAL_BIAYA) {
        summary.lunasAmount += TOTAL_BIAYA;
      } else if (paidAmount > 0) {
        summary.sebagianAmount += paidAmount;
      }

      return summary;
    }, { lunasAmount: 0, sebagianAmount: 0 });
  }, [globalActiveSantri]);

  const paymentProgressSegmentPercent = useMemo(() => {
    return totalTagihanKeseluruhan > 0
      ? {
          lunas: (paymentProgressSegments.lunasAmount / totalTagihanKeseluruhan) * 100,
          sebagian: (paymentProgressSegments.sebagianAmount / totalTagihanKeseluruhan) * 100,
          belum: Math.max((totalBelumDibayar / totalTagihanKeseluruhan) * 100, 0)
        }
      : { lunas: 0, sebagian: 0, belum: 0 };
  }, [totalTagihanKeseluruhan, paymentProgressSegments, totalBelumDibayar]);

  const activeStudentIds = useMemo(() => {
    return new Set(globalActiveSantri.map(s => String(s.id || '').trim()));
  }, [globalActiveSantri]);

  const totalDibayarBulanan = useMemo(() => {
    const entriesThisYear = allBulananData.filter(e => {
      const isYearMatch = !bulananChartYear || bulananChartYear === 'Semua' || String(e.academicYear) === String(bulananChartYear);
      const isActiveStudent = activeStudentIds.has(String(e.studentId || '').trim());
      return isYearMatch && isActiveStudent;
    });
    return entriesThisYear.reduce((sum, e) => {
      let entrySum = 0;
      if (e.makan) entrySum += BULANAN_ITEMS.find(i => i.key === 'makan')?.nominal || 0;
      if (e.laundry) entrySum += BULANAN_ITEMS.find(i => i.key === 'laundry')?.nominal || 0;
      if (e.ziaroh) entrySum += BULANAN_ITEMS.find(i => i.key === 'ziaroh')?.nominal || 0;
      return sum + entrySum;
    }, 0);
  }, [allBulananData, bulananChartYear, activeStudentIds]);

  const totalPemasukan = useMemo(() => {
    return totalDibayarKeseluruhan + totalDibayarBulanan;
  }, [totalDibayarKeseluruhan, totalDibayarBulanan]);

  const totalBelumDibayarBulanan = useMemo(() => {
    const maxTheoretical = totalAktif * 12 * TOTAL_BIAYA_BULANAN;
    return Math.max(maxTheoretical - totalDibayarBulanan, 0);
  }, [totalAktif, totalDibayarBulanan]);

  const totalTagihanBulanan = useMemo(() => {
    return totalDibayarBulanan + totalBelumDibayarBulanan;
  }, [totalDibayarBulanan, totalBelumDibayarBulanan]);

  const totalTagihanGabungan = useMemo(() => {
    return totalTagihanKeseluruhan + totalTagihanBulanan;
  }, [totalTagihanKeseluruhan, totalTagihanBulanan]);

  const paymentPercentBulanan = useMemo(() => {
    return totalTagihanBulanan > 0
      ? Math.round((totalDibayarBulanan / totalTagihanBulanan) * 100)
      : 0;
  }, [totalDibayarBulanan, totalTagihanBulanan]);

  const paymentProgressSegmentsBulanan = useMemo(() => {
    const entriesThisYear = allBulananData.filter(e => {
      const isYearMatch = !bulananChartYear || bulananChartYear === 'Semua' || String(e.academicYear) === String(bulananChartYear);
      const isActiveStudent = activeStudentIds.has(String(e.studentId || '').trim());
      return isYearMatch && isActiveStudent;
    });

    let lunasAmount = 0;
    let sebagianAmount = 0;

    entriesThisYear.forEach(e => {
      let paid = 0;
      if (e.makan) paid += BULANAN_ITEMS.find(i => i.key === 'makan')?.nominal || 0;
      if (e.laundry) paid += BULANAN_ITEMS.find(i => i.key === 'laundry')?.nominal || 0;
      if (e.ziaroh) paid += BULANAN_ITEMS.find(i => i.key === 'ziaroh')?.nominal || 0;

      if (paid >= TOTAL_BIAYA_BULANAN) {
        lunasAmount += TOTAL_BIAYA_BULANAN;
      } else if (paid > 0) {
        sebagianAmount += paid;
      }
    });

    return { lunasAmount, sebagianAmount };
  }, [allBulananData, bulananChartYear, activeStudentIds]);

  const paymentProgressSegmentPercentBulanan = useMemo(() => {
    return totalTagihanBulanan > 0
      ? {
          lunas: (paymentProgressSegmentsBulanan.lunasAmount / totalTagihanBulanan) * 100,
          sebagian: (paymentProgressSegmentsBulanan.sebagianAmount / totalTagihanBulanan) * 100,
          belum: Math.max((totalBelumDibayarBulanan / totalTagihanBulanan) * 100, 0)
        }
      : { lunas: 0, sebagian: 0, belum: 0 };
  }, [totalTagihanBulanan, paymentProgressSegmentsBulanan, totalBelumDibayarBulanan]);

  const monthlyFinancialData = useMemo(() => {
    const result = Array.from({ length: 12 }, (_, i) => ({
      month: monthNamesShort[i],
      monthFull: monthNamesFull[i],
      tagihan: 0,
      dibayar: 0
    }));
    const paidSantriByMonth = Array.from({ length: 12 }, () => new Set());

    globalActiveSantri.forEach(santri => {
      if (!santri.pembayaran) return;

      PAYMENT_ITEMS.forEach(item => {
        const paid = santri.pembayaran[item.key];
        if (!paid) return;

        const parts = getPaymentDateParts(santri.pembayaran[item.key + '_tanggal']);
        if ((chartYear === 'Semua' || parts?.year === chartYear) && parts.monthIndex >= 0 && parts.monthIndex < 12) {
          paidSantriByMonth[parts.monthIndex].add(santri.id || santri.rowIndex);
          result[parts.monthIndex].dibayar += item.nominal;
        }
      });
    });

    paidSantriByMonth.forEach((santriIds, monthIndex) => {
      result[monthIndex].tagihan = santriIds.size * TOTAL_BIAYA;
    });

    return result;
  }, [globalActiveSantri, chartYear]);

  const financialTrends = useMemo(() => {
    const currentMonthIdx = new Date().getMonth();
    const prevMonthIdx = currentMonthIdx === 0 ? 11 : currentMonthIdx - 1;
    const currentPaid = monthlyFinancialData[currentMonthIdx]?.dibayar || 0;
    const prevPaid = monthlyFinancialData[prevMonthIdx]?.dibayar || 0;
    const paidTrend = prevPaid === 0 ? (currentPaid > 0 ? 100 : 0) : parseFloat(((currentPaid - prevPaid) / prevPaid * 100).toFixed(1));

    const currentUnpaid = (monthlyFinancialData[currentMonthIdx]?.tagihan || 0) - currentPaid;
    const prevUnpaid = (monthlyFinancialData[prevMonthIdx]?.tagihan || 0) - prevPaid;
    const unpaidTrend = prevUnpaid === 0 ? (currentUnpaid > 0 ? 100 : 0) : parseFloat(((currentUnpaid - prevUnpaid) / prevUnpaid * 100).toFixed(1));

    return { paidTrend, unpaidTrend };
  }, [monthlyFinancialData]);

  const recentPaymentHistory = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const history = [];
    globalActiveSantri.forEach(santri => {
      if (!santri.pembayaran) return;
      PAYMENT_ITEMS.forEach(item => {
        if (!santri.pembayaran[item.key]) return;
        const paidDate = parsePaymentDate(santri.pembayaran[item.key + '_tanggal']);
        if (!paidDate || paidDate < oneWeekAgo || paidDate > now) return;
        const paymentType = ['laundry', 'makan'].includes(item.key) ? 'Pembayaran Bulanan' : 'Pembayaran Tahunan';
        history.push({
          id: `${santri.rowIndex || santri.id}-${item.key}-${santri.pembayaran[item.key + '_tanggal']}`,
          rowIndex: santri.rowIndex,
          nama: santri.namaLengkap || santri.id || 'Tidak Diketahui',
          item: item.label,
          itemKey: item.key,
          tanggal: formatDateIndo(paidDate),
          tanggalRaw: santri.pembayaran[item.key + '_tanggal'],
          amount: item.nominal,
          status: 'Terbayar',
          type: paymentType,
          rawDate: paidDate
        });
      });
    });

    const combined = [...history, ...localHistoryData];
    
    return combined
      .filter(item => 
        item.nama.toLowerCase().includes(historySearchQuery.toLowerCase()) || 
        item.item.toLowerCase().includes(historySearchQuery.toLowerCase())
      )
      .sort((a, b) => b.rawDate - a.rawDate);
  }, [globalActiveSantri, localHistoryData, historySearchQuery]);

  const handleAddHistory = () => {
    const newItem = {
      id: `manual-${Date.now()}`,
      nama: 'Santri Baru (Manual)',
      item: 'Pendaftaran',
      itemKey: 'administrasi',
      tanggal: formatDateIndo(new Date()),
      tanggalRaw: new Date().toISOString().split('T')[0],
      amount: 350000,
      status: 'Terbayar',
      type: 'Pembayaran Tahunan',
      rawDate: new Date()
    };
    setLocalHistoryData(prev => [newItem, ...prev]);
    setAlert({ type: 'success', text: 'Riwayat pembayaran manual berhasil ditambahkan!' });
  };

  const handleUpdateHistory = (id, updatedData) => {
    setLocalHistoryData(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
    setAlert({ type: 'success', text: 'Riwayat pembayaran berhasil diperbarui!' });
  };

  const handleDeleteHistory = (id) => {
    setLocalHistoryData(prev => prev.filter(item => item.id !== id));
    setAlert({ type: 'success', text: 'Riwayat pembayaran berhasil dihapus!' });
  };

  const [statDetailModal, setStatDetailModal] = useState(null);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 4  && h < 11) return { text: 'Selamat Pagi', emoji: 'Selamat Pagi' };
    if (h >= 11 && h < 15) return { text: 'Selamat Siang', emoji: 'Selamat Siang' };
    if (h >= 15 && h < 18) return { text: 'Selamat Sore', emoji: 'Selamat Sore' };
    return { text: 'Selamat Malam', emoji: 'Selamat Malam' };
  };
  const greeting = getGreeting();

  const paymentPercentGabungan = useMemo(() => {
    return totalTagihanGabungan > 0
      ? Math.round((totalPemasukan / totalTagihanGabungan) * 100)
      : 0;
  }, [totalPemasukan, totalTagihanGabungan]);

  const miniSparklinePoints = useMemo(() => {
    const values = monthlyFinancialData.slice(0, 6).map(month => month.dibayar);
    const maxValue = Math.max(...values, 1);
    return values.map((value, index) => ({ x: index * 20, y: 38 - (value / maxValue) * 32 }));
  }, [monthlyFinancialData]);

  const miniBarValues = useMemo(() => {
    const values = monthlyFinancialData.slice(0, 7).map(month => month.dibayar);
    const maxValue = Math.max(...values, 1);
    return values.map(value => Math.max(4, (value / maxValue) * 28));
  }, [monthlyFinancialData]);

  const compactMoney = (amount) => formatShortRupiah(amount).replace(/\s/g, '');
  const hasPaymentTrendData = monthlyFinancialData.some(month => month.dibayar > 0);
  const hasStudentTrendData = monthlyCompositionData.some(month => month.putra + month.putri > 0);
  const studentSparklinePoints = useMemo(() => {
    const values = monthlyCompositionData.map(month => month.putra + month.putri);
    const maxValue = Math.max(...values, 1);
    return values.map((value, index) => ({ x: (index / Math.max(values.length - 1, 1)) * 100, y: 38 - (value / maxValue) * 32 }));
  }, [monthlyCompositionData]);
  const studentSparklinePath = useMemo(() => studentSparklinePoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' '), [studentSparklinePoints]);
  const studentSparklineFillPath = studentSparklinePoints.length ? `${studentSparklinePath} L 100 44 L 0 44 Z` : '';

  const sparklinePath = useMemo(() => {
    if (miniSparklinePoints.length < 2) return '';
    const pts = miniSparklinePoints;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const cx = (pts[i - 1].x + pts[i].x) / 2;
      d += ` C ${cx} ${pts[i - 1].y}, ${cx} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
    }
    return d;
  }, [miniSparklinePoints]);

  const sparklineFillPath = useMemo(() => {
    if (miniSparklinePoints.length < 2) return '';
    const pts = miniSparklinePoints;
    const lastX = pts[pts.length - 1].x;
    return sparklinePath + ` L ${lastX} 44 L ${pts[0].x} 44 Z`;
  }, [miniSparklinePoints, sparklinePath]);

  return (
    <div className="compact-dashboard dashboard-page dashboard-reference w-full space-y-4 pb-8 animate-in">

      {/* ══ DASHBOARD SUMMARY ═══════════════════════════════════════════ */}
      <section className="dashboard-summary" aria-label="Ringkasan dashboard">
        <div className="dashboard-summary-top">
          <div className="dashboard-summary-copy">
            <div className="dashboard-summary-heading">
              <h1 className="dashboard-summary-title">
                Selamat Datang, <span>Pengurus PPNJ</span>
              </h1>
              <span className="dashboard-summary-date">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <p className="dashboard-summary-subtitle">Ringkasan administrasi dan keuangan Pondok Pesantren Nailul Jannah</p>
          </div>

          <div className="dashboard-summary-actions">
            <button
              onClick={onOpenImport}
              className="dashboard-summary-btn"
              title="Import Data"
            >
              <Icon name="download" size={16} />
              <span>Export</span>
            </button>
            <button
              onClick={() => window.location.reload()}
              className="dashboard-summary-btn dashboard-summary-btn--icon"
              title="Refresh"
            >
              <Icon name="refresh-cw" size={16} />
            </button>
          </div>
        </div>

        {!dataLoading && (
          <div className="dashboard-summary-cards">
            <div onClick={() => setStatDetailModal('aktif')} className="dashboard-summary-card dashboard-kpi-card dashboard-kpi-card--students">
              <div className="dashboard-kpi-copy">
                <div className="dashboard-summary-card-header"><span className="dashboard-summary-label">Santri Aktif</span></div>
                <span className="dashboard-summary-value">{totalAktif}</span>
                <span className="dashboard-summary-meta">{totalPutra} putra · {totalPutri} putri · {totalAlumni} alumni</span>
              </div>
              <div className="dashboard-summary-icon"><Icon name="users" size={18} /></div>
              <svg className="dashboard-kpi-chart dashboard-kpi-chart--spark" viewBox="0 0 100 46" preserveAspectRatio="none" role="img" aria-label="Jumlah santri aktif per bulan">
                {hasStudentTrendData && <><path d={studentSparklineFillPath} fill="url(#dashboardStudentGradient)" /><path d={studentSparklinePath} fill="none" stroke="#18834d" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></>}
                {!hasStudentTrendData && <text x="50" y="28" textAnchor="middle">Belum ada data</text>}
                <defs><linearGradient id="dashboardStudentGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18834d" stopOpacity=".2" /><stop offset="100%" stopColor="#18834d" stopOpacity="0" /></linearGradient></defs>
              </svg>
            </div>

            <div onClick={() => setStatDetailModal('totalPemasukan')} className="dashboard-summary-card dashboard-kpi-card dashboard-kpi-card--income">
              <div className="dashboard-kpi-copy">
                <div className="dashboard-summary-card-header"><span className="dashboard-summary-label">Total Pemasukan</span></div>
                <span className="dashboard-summary-value">{compactMoney(totalPemasukan)}</span>
                <span className="dashboard-summary-meta">{hasPaymentTrendData ? `${financialTrends.paidTrend >= 0 ? '+' : ''}${financialTrends.paidTrend}% dari bulan lalu` : 'Belum ada pembayaran tercatat'}</span>
              </div>
              <div className="dashboard-summary-icon"><Icon name="trending-up" size={18} /></div>
              <svg className="dashboard-kpi-chart dashboard-kpi-chart--spark" viewBox="0 0 100 46" preserveAspectRatio="none" role="img" aria-label="Tren pembayaran bulanan">
                {hasPaymentTrendData && <><path d={sparklineFillPath} fill="url(#dashboardIncomeGradient)" /><path d={sparklinePath} fill="none" stroke="#18834d" strokeWidth="2.5" vectorEffect="non-scaling-stroke" /></>}
                {!hasPaymentTrendData && <text x="50" y="28" textAnchor="middle">Belum ada data</text>}
                <defs><linearGradient id="dashboardIncomeGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18834d" stopOpacity=".2" /><stop offset="100%" stopColor="#18834d" stopOpacity="0" /></linearGradient></defs>
              </svg>
            </div>

            <div onClick={() => setStatDetailModal('totalTagihan')} className="dashboard-summary-card dashboard-kpi-card dashboard-kpi-card--invoices">
              <div className="dashboard-kpi-copy">
                <div className="dashboard-summary-card-header"><span className="dashboard-summary-label">Total Tagihan</span></div>
                <span className="dashboard-summary-value">{compactMoney(totalTagihanGabungan)}</span>
                <span className="dashboard-summary-meta">Sisa: {compactMoney(totalBelumDibayar + totalBelumDibayarBulanan)}</span>
              </div>
              <div className="dashboard-summary-icon"><Icon name="file-text" size={18} /></div>
              <div className="dashboard-kpi-chart dashboard-kpi-chart--bars" role="img" aria-label="Pembayaran per bulan, 7 bulan terakhir">
                {miniBarValues.map((height, index) => <span key={index} style={{ height: `${height}px` }} />)}
              </div>
            </div>

            <div onClick={() => setStatDetailModal('totalTagihan')} className="dashboard-summary-card dashboard-kpi-card dashboard-kpi-card--realization">
              <div className="dashboard-kpi-copy">
                <div className="dashboard-summary-card-header"><span className="dashboard-summary-label">Realisasi Keuangan</span></div>
                <span className="dashboard-summary-value">{paymentPercentGabungan}%</span>
                <span className="dashboard-summary-meta">Pembayaran terealisasi</span>
              </div>
              <div className="dashboard-summary-icon"><Icon name="pie-chart" size={18} /></div>
              <div className="dashboard-kpi-chart dashboard-kpi-chart--bars" role="img" aria-label={`${paymentPercentGabungan}% pembayaran terealisasi`}>
                {[0, .25, .5, .75, 1].map((ratio, index) => <span key={index} style={{ height: `${Math.max(.12, Math.min(paymentPercentGabungan / 100, 1)) * ratio * 30}px` }} />)}
              </div>
              <span className="dashboard-summary-progress" aria-hidden="true"><span style={{ width: `${Math.min(paymentPercentGabungan, 100)}%` }} /></span>
            </div>
          </div>
        )}
      </section>

      {/* ══ MAIN DASHBOARD BODY ═══════════════════════════════════════════ */}
      {dataLoading ? (
        <div className="h-40 flex items-center justify-center gap-3 bg-white rounded-xl border border-slate-200/60 shadow-sm">
          <div className="animate-spin w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full" />
          <span className="text-sm text-slate-500 font-medium">Memuat data Dashboard...</span>
        </div>
      ) : (
        <div className="dashboard-content space-y-4">
          
                  {/* ══ ROW 2: DEMOGRAPHICS ═══════════════════════════════════ */}
                  <div className="dashboard-demographics grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between">
              <CompositionAreaChart monthlyData={monthlyCompositionData} totalCount={chartTotal} selectedYearLabel={compositionYearLabel} onExport={exportCompositionData} compositionYear={compositionYear} onYearChange={setCompositionYear} yearOptions={COMPOSITION_YEAR_OPTIONS} />
            </div>
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5"><div className="w-1 h-4 bg-[#083316] rounded-full" /><h3 className="text-sm font-semibold text-slate-800">Gender Santri</h3></div>
              <div className="dashboard-chart dashboard-chart--composition flex-1 flex flex-col justify-center"><CompositionPieChart data={chartDataFiltered} totalCount={chartTotal} title="Proporsi Putra, Putri, dan Alumni" /></div>
            </div>
            <div className="lg:col-span-3 bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5"><div className="w-1 h-4 bg-violet-600 rounded-full" /><h3 className="text-sm font-semibold text-slate-800">Tempat Lahir</h3></div>
              <div className="dashboard-chart dashboard-chart--composition flex-1 flex flex-col justify-center"><CompositionPieChart data={chartTempatLahirData} totalCount={chartPutra + chartPutri} title="Asal Daerah / Tempat Lahir" /></div>
            </div>
          </div>

          {/* ══ ROW 3: FINANCIAL ANALYSIS ═══════════════════════════════════ */}
          <div className="dashboard-section-grid dashboard-priority-grid grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                      <div className="dashboard-panel dashboard-panel--finance lg:col-span-6 bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between min-h-[340px]">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5"><div className="w-1 h-4 bg-emerald-600 rounded-full" /><h3 className="text-sm font-semibold text-slate-800">Tagihan Tahunan</h3></div>
              <div className="flex-1 flex flex-col"><PaymentBarChart data={monthlyFinancialData} chartYear={chartYear} availableYears={['Semua', '2025', '2026', '2027', '2028', '2029', '2030']} onYearChange={setChartYear} /></div>
            </div>
            <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between min-h-[340px]">
              <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5"><div className="w-1 h-4 bg-purple-600 rounded-full" /><h3 className="text-sm font-semibold text-slate-800">Syahriyah Bulanan</h3></div>
              <div className="flex-1 flex flex-col"><BulananFlowChart allBulananData={allBulananData} selectedYear={bulananChartYear} onYearChange={setBulananChartYear} availableYears={['Semua', '2025', '2026', '2027', '2028', '2029', '2030']} /></div>
            </div>
          </div>

          {/* ══ ROW 4: PAYMENT PROGRESS ═══════════════════════════════════ */}
          <div className="dashboard-progress-grid grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                      <div className="dashboard-panel dashboard-panel--progress lg:col-span-6 bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5"><div className="w-1 h-4 bg-emerald-600 rounded-full" /><h3 className="text-sm font-semibold text-slate-800">Progress Pembayaran Tahunan</h3></div>
              <div className="flex-1 flex flex-col"><PaymentProgressGaugeCard title="Progress Pembayaran Tahunan" totalTagihan={totalTagihanKeseluruhan} totalDibayar={totalDibayarKeseluruhan} sisaTagihan={totalBelumDibayar} completionRate={paymentPercent} progressSegments={paymentProgressSegmentPercent} /></div>
            </div>
            <div className="dashboard-panel dashboard-panel--progress lg:col-span-6 bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2.5"><div className="w-1 h-4 bg-purple-600 rounded-full" /><h3 className="text-sm font-semibold text-slate-800">Progress Pembayaran Bulanan</h3></div>
              <div className="flex-1 flex flex-col"><PaymentProgressGaugeCard title="Progress Pembayaran Bulanan" totalTagihan={totalTagihanBulanan} totalDibayar={totalDibayarBulanan} sisaTagihan={totalBelumDibayarBulanan} completionRate={paymentPercentBulanan} progressSegments={paymentProgressSegmentPercentBulanan} /></div>
            </div>
          </div>

        </div>
      )}

      {/* ══ MODAL: HISTORY ═══════════════════════════════════════════ */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3"><div className="w-9 h-9 bg-emerald-100 text-emerald-800 rounded-xl flex items-center justify-center"><Icon name="history" size={18} /></div><div><h3 className="text-base font-bold text-slate-800">Aktivitas Pembayaran Santri</h3><p className="text-xs text-slate-400">Transaksi 7 Hari Terakhir</p></div></div>
              <div className="flex items-center gap-2"><div className="relative"><Icon name="search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /><input type="text" placeholder="Cari santri/pembayaran..." value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 w-44 md:w-56" /></div><button onClick={handleAddHistory} className="p-2 bg-[#083316] text-white rounded-xl hover:bg-[#0c4a21] transition-all" title="Tambah Manual"><Icon name="plus" size={16} /></button><button onClick={() => setShowHistoryModal(false)} className="p-2 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-colors"><Icon name="x" size={16} /></button></div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-auto custom-scroll">{recentPaymentHistory.length > 0 ? (<table className="w-full text-left border-collapse text-xs"><thead className="sticky top-0 bg-slate-50 border-b border-slate-200/80 z-10 text-slate-500 uppercase tracking-wider font-semibold"><tr><th className="px-6 py-3">Santri</th><th className="px-4 py-3">Item & Tipe</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3 text-right">Nominal</th><th className="px-6 py-3 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100">{recentPaymentHistory.map((row) => (<tr key={row.id} className="hover:bg-slate-50/80 transition-colors group"><td className="px-6 py-3 font-semibold text-slate-800">{row.nama}</td><td className="px-4 py-3"><span className="font-medium text-slate-700">{row.item}</span><span className={`ml-2 text-[9px] font-semibold px-1.5 py-0.5 rounded ${row.type === 'Pembayaran Tahunan' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{row.type}</span></td><td className="px-4 py-3 text-slate-500">{row.tanggal}</td><td className="px-4 py-3 text-right font-extrabold text-[#083316] tabular-nums">{formatRupiah(row.amount)}</td><td className="px-6 py-3 text-center"><div className="flex items-center justify-center gap-2"><button onClick={() => setEditHistoryDetail(row)} className="p-1 text-amber-600 hover:text-amber-800" title="Edit"><Icon name="edit-3" size={14} /></button><button onClick={() => { if (confirm(`Hapus riwayat ${row.item} untuk ${row.nama}?`)) handleDeleteHistory(row.id); }} className="p-1 text-rose-600 hover:text-rose-800" title="Hapus"><Icon name="trash-2" size={14} /></button></div></td></tr>))}</tbody></table>) : (<div className="py-16 text-center text-slate-400"><Icon name="inbox" size={32} className="mx-auto mb-2 opacity-30" /><p className="font-medium text-xs">Tidak ada riwayat pembayaran ditemukan.</p></div>)}</div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between"><p className="text-xs text-slate-500 font-semibold">Total {recentPaymentHistory.length} Transaksi</p><button onClick={() => setShowHistoryModal(false)} className="px-4 py-1.5 bg-[#083316] text-white rounded-xl text-xs font-semibold hover:bg-[#0c4a21] transition-all">Tutup</button></div>
          </div>
        </div>
      )}

      {/* ══ MODAL: EDIT HISTORY ═══════════════════════════════════════════ */}
      {editHistoryDetail && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">Edit Riwayat Pembayaran</h3>
              <button onClick={() => setEditHistoryDetail(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                <Icon name="x" size={16} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'Nama Santri', key: 'nama', type: 'text' },
                { label: 'Item Pembayaran', key: 'item', type: 'text' },
                { label: 'Nominal (Rp)', key: 'amount', type: 'number' },
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{field.label}</label>
                  <input
                    type={field.type}
                    value={editHistoryDetail[field.key]}
                    onChange={(e) => setEditHistoryDetail({ ...editHistoryDetail, [field.key]: field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button onClick={() => setEditHistoryDetail(null)} className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all">Batal</button>
              <button
                onClick={() => { handleUpdateHistory(editHistoryDetail.id, editHistoryDetail); setEditHistoryDetail(null); }}
                className="flex-1 py-2 bg-[#083316] text-white text-xs font-semibold rounded-xl hover:bg-[#0c4a21] transition-all shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL: STAT DETAIL ═══════════════════════════════════════════ */}
      {statDetailModal && (() => {
        const modalConfig = {
          aktif:  { title: 'Santri Aktif',  icon: 'users', colorClass: 'text-emerald-700 bg-emerald-100', list: globalActiveSantri },
          alumni: { title: 'Alumni', icon: 'graduation-cap', colorClass: 'text-sky-700 bg-sky-100', list: santriList.filter(s => isAlumni(s.status)) },
          totalTagihan: { title: 'Total Tagihan', icon: 'file-text', colorClass: 'text-indigo-700 bg-indigo-100', isCurrency: true, summary: [
            { label: 'Tagihan Tahunan (Administrasi)', value: totalTagihanKeseluruhan },
            { label: 'Tagihan Bulanan (Syahriyah)', value: totalTagihanBulanan },
            { label: 'Total Tagihan Gabungan', value: totalTagihanGabungan, isTotal: true },
          ]},
          totalPemasukan: { title: 'Total Pemasukan', icon: 'trending-up', colorClass: 'text-amber-700 bg-amber-100', isCurrency: true, summary: [
            { label: 'Pendapatan Tahunan', value: totalDibayarKeseluruhan },
            { label: 'Pendapatan Bulanan', value: totalDibayarBulanan },
            { label: 'Total Pemasukan Gabungan', value: totalPemasukan, isTotal: true },
          ]},
        };
        const cfg = modalConfig[statDetailModal];
        return (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl flex flex-col border border-slate-200">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.colorClass}`}>
                    <Icon name={cfg.icon} size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Detail {cfg.title}</h3>
                    <p className="text-xs text-slate-500">
                      {cfg.isCurrency ? 'Ringkasan rincian nominal' : `Total data: ${cfg.list.length} Santri`}
                    </p>
                  </div>
                </div>
                <button onClick={() => setStatDetailModal(null)} className="p-1.5 bg-slate-100 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                  <Icon name="x" size={16} />
                </button>
              </div>

              <div className="p-5 overflow-y-auto custom-scroll flex-1">
                {cfg.isCurrency ? (
                  <div className="space-y-3">
                    {cfg.summary.map((item, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                        item.isTotal
                          ? 'bg-emerald-50/80 border border-emerald-200 shadow-2xs'
                          : 'bg-slate-50 border border-slate-200/70'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            item.isTotal ? 'bg-[#083316] text-white' : 'bg-white border border-slate-200 text-slate-600'
                          }`}>
                            <Icon name={item.isTotal ? 'trending-up' : 'arrow-down-left'} size={15} />
                          </div>
                          <p className={`font-semibold text-xs sm:text-sm ${item.isTotal ? 'text-[#083316]' : 'text-slate-700'}`}>{item.label}</p>
                        </div>
                        <p className={`font-extrabold tabular-nums ${
                          item.isTotal ? 'text-base text-[#083316]' : 'text-sm text-slate-800'
                        }`}>{formatRupiah(item.value)}</p>
                      </div>
                    ))}
                  </div>
                ) : cfg.list.length > 0 ? (
                  <div className="space-y-2">
                    {cfg.list.map((santri, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/70 rounded-xl hover:border-emerald-200 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {santri.namaLengkap.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-slate-800">{santri.namaLengkap}</p>
                            <p className="text-[10px] font-mono text-slate-400">{santri.id} · {santri.pendidikan}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          santri.status === 'Aktif' || santri.status === 'Diterima' ? 'bg-emerald-100 text-emerald-800' :
                          santri.status === 'Alumni' ? 'bg-sky-100 text-sky-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {santri.status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                    <Icon name="inbox" size={32} className="mb-2 opacity-20" />
                    <p className="font-medium text-xs">Tidak ada data untuk ditampilkan.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

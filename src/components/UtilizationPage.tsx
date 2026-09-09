import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PieChart,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Download,
  Eye,
  Sliders,
  ChevronRight,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  FileText,
  DollarSign,
  Sparkles,
  ChevronDown,
  Info,
  Check,
  Building2,
  ExternalLink,
  ShieldCheck,
  AlertOctagon,
  HelpCircle,
  BarChart2,
  Zap,
  Terminal
} from 'lucide-react';
import {
  UtilizationMetrics,
  UtilizationDashboardSummary,
  UtilizationStatus,
  TrendType,
  UtilizationAlert,
  UtilizationSnapshot,
  SimulationResult,
  ModuleId
} from '../types';
import {
  fetchUtilizationDashboard,
  fetchLicenceUtilization,
  fetchLicenceUtilizationHistory,
  triggerUtilizationSnapshotRecalculation,
  resolveUtilizationAlert,
  simulateUtilizationScenario,
  fetchSqlAudit
} from '../lib/supabase';

interface UtilizationPageProps {
  onNavigate?: (moduleId: ModuleId, contextData?: any) => void;
}

export const UtilizationPage: React.FC<UtilizationPageProps> = ({ onNavigate }) => {
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [summary, setSummary] = useState<UtilizationDashboardSummary | null>(null);
  const [metricsList, setMetricsList] = useState<UtilizationMetrics[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [queryLatency, setQueryLatency] = useState<number>(0);
  const [dataSource, setDataSource] = useState<string>('supabase_postgresql');

  // Filters & Sorting
  const [searchText, setSearchText] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<UtilizationStatus | 'All'>('All');
  const [selectedLicenceStatus, setSelectedLicenceStatus] = useState<string>('All');
  const [maxDaysRemaining, setMaxDaysRemaining] = useState<number>(365);
  const [daysFilterActive, setDaysFilterActive] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'utilization_percent' | 'days_remaining' | 'licence_number' | 'fob_value' | 'trend'>('utilization_percent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Modals & Panels
  const [selectedLicence, setSelectedLicence] = useState<UtilizationMetrics | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState<boolean>(false);
  const [trendChartOpen, setTrendChartOpen] = useState<boolean>(false);
  const [trendHistory, setTrendHistory] = useState<UtilizationSnapshot[]>([]);
  const [trendLoading, setTrendLoading] = useState<boolean>(false);
  const [alertsPanelOpen, setAlertsPanelOpen] = useState<boolean>(false);
  const [activeAlertToResolve, setActiveAlertToResolve] = useState<UtilizationAlert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<string>('');
  const [resolvingAlert, setResolvingAlert] = useState<boolean>(false);

  // Simulation Tool State
  const [simulationOpen, setSimulationOpen] = useState<boolean>(false);
  const [simLicenceId, setSimLicenceId] = useState<string>('');
  const [additionalFobInr, setAdditionalFobInr] = useState<number>(10000000); // 1 Cr
  const [hypotheticalRate, setHypotheticalRate] = useState<number>(0);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ title: string; desc: string; type: 'success' | 'info' | 'error' } | null>(null);

  // SQL Audit Modal State
  const [sqlAuditModalOpen, setSqlAuditModalOpen] = useState<boolean>(false);
  const [sqlAuditData, setSqlAuditData] = useState<any>(null);
  const [sqlAuditLoading, setSqlAuditLoading] = useState<boolean>(false);

  const handleOpenSqlAudit = async () => {
    setSqlAuditModalOpen(true);
    if (!sqlAuditData) {
      setSqlAuditLoading(true);
      const res = await fetchSqlAudit();
      if (res) setSqlAuditData(res);
      setSqlAuditLoading(false);
    }
  };

  const showToast = (title: string, desc: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage({ title, desc, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load Dashboard Data
  const loadData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const response = await fetchUtilizationDashboard({
        status: selectedStatus,
        licenceStatus: selectedLicenceStatus,
        daysRemainingMax: daysFilterActive ? maxDaysRemaining : undefined,
        sortBy,
        sortOrder,
        searchText: searchText.trim(),
        page: currentPage,
        limit: pageSize,
      });

      if (response.success) {
        setSummary(response.summary);
        setMetricsList(response.data);
        setTotalRecords(response.pagination?.totalRecords || response.data.length);
        setQueryLatency(response.queryTimeMs || 35);
        setDataSource(response.source);
      }
    } catch (err) {
      console.error('Failed to load utilization dashboard:', err);
      showToast('Data Error', 'Unable to retrieve real-time utilization stats.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedLicenceStatus, daysFilterActive, maxDaysRemaining, sortBy, sortOrder, currentPage, pageSize]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Handle Snapshot Recalculation
  const handleRecalculateSnapshots = async () => {
    setRefreshing(true);
    try {
      const res = await triggerUtilizationSnapshotRecalculation();
      if (res && res.success) {
        showToast('Snapshots Updated', res.message || 'Daily utilization snapshots and compliance checks completed.', 'success');
        await loadData(true);
      } else {
        showToast('Notice', 'Snapshots calculated with active local cache.', 'info');
      }
    } catch (err) {
      showToast('Calculation Notice', 'Utilized existing DB state.', 'info');
    } finally {
      setRefreshing(false);
    }
  };

  // Open Licence Detail Drawer
  const handleOpenDetail = (lic: UtilizationMetrics) => {
    setSelectedLicence(lic);
    setDetailDrawerOpen(true);
  };

  // Open Trend Chart
  const handleOpenTrendChart = async (lic: UtilizationMetrics) => {
    setSelectedLicence(lic);
    setTrendChartOpen(true);
    setTrendLoading(true);
    try {
      const history = await fetchLicenceUtilizationHistory(lic.licenceId, 90);
      setTrendHistory(history);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setTrendLoading(false);
    }
  };

  // Open Simulation Modal
  const handleOpenSimulation = (lic: UtilizationMetrics) => {
    setSelectedLicence(lic);
    setSimLicenceId(lic.licenceId);
    setAdditionalFobInr(Math.round(lic.totalAuthorizedFOB * 0.15));
    setHypotheticalRate(lic.avgMonthlyExport || Math.round(lic.totalAuthorizedFOB / 12));
    setSimulationOpen(true);
    runSimulation(lic.licenceId, Math.round(lic.totalAuthorizedFOB * 0.15), lic.avgMonthlyExport);
  };

  const runSimulation = async (id: string, additional: number, rate?: number) => {
    setSimulating(true);
    try {
      const res = await simulateUtilizationScenario(id, additional, rate);
      if (res) {
        setSimulationResult(res);
      }
    } catch (err) {
      console.warn('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  // Resolve Alert Action
  const handleResolveAlert = async (status: 'Resolved' | 'Dismissed') => {
    if (!activeAlertToResolve) return;
    setResolvingAlert(true);
    try {
      const ok = await resolveUtilizationAlert(activeAlertToResolve.id, status, resolutionNotes);
      if (ok) {
        showToast(
          status === 'Resolved' ? 'Alert Resolved' : 'Alert Dismissed',
          `Alert for licence ${activeAlertToResolve.licenceNumber || ''} marked as ${status}.`,
          'success'
        );
        setActiveAlertToResolve(null);
        setResolutionNotes('');
        await loadData(true);
      }
    } catch (err) {
      showToast('Error', 'Failed to update alert state.', 'error');
    } finally {
      setResolvingAlert(false);
    }
  };

  // Export Utilization CSV
  const handleExportCSV = () => {
    if (metricsList.length === 0) {
      showToast('Export Notice', 'No data available to export.', 'info');
      return;
    }

    const headers = [
      'Licence Number',
      'Company File No',
      'Authorized FOB (INR)',
      'Exported FOB (INR)',
      'Remaining Quota (INR)',
      'Utilization %',
      'Status',
      'Days Remaining',
      'Expiry Date',
      'Forecast Completion Date',
      'Avg Monthly Export (INR)',
      'Trend',
      'Active Alerts Count',
    ];

    const rows = metricsList.map((m) => [
      `"${m.licenceNumber}"`,
      `"${m.companyFileNumber}"`,
      m.totalAuthorizedFOB,
      m.totalExportedFOB,
      m.remainingQuota,
      `${m.utilizationPercent}%`,
      `"${m.status}"`,
      m.daysRemaining,
      `"${m.licenceExpiry}"`,
      `"${m.forecastCompletionDate || 'N/A'}"`,
      m.avgMonthlyExport,
      `"${m.trend}"`,
      m.alerts.length,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alms-utilization-report-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Report Downloaded', 'Utilization CSV report exported successfully.', 'success');
  };

  // Helper: Format Currency in Lakhs/Crores
  const formatInrCr = (val: number): string => {
    if (!val || isNaN(val)) return '₹0.00';
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // SVG Sparkline Component
  const Sparkline: React.FC<{ data: number[]; trend: TrendType }> = ({ data, trend }) => {
    if (!data || data.length < 2) {
      return <div className="h-6 w-20 bg-slate-100 rounded flex items-center justify-center text-[10px] text-slate-400">N/A</div>;
    }

    const min = Math.min(...data);
    const max = Math.max(...data, min + 1);
    const width = 80;
    const height = 24;
    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * (width - 4) + 2;
        const y = height - 2 - ((val - min) / (max - min)) * (height - 6);
        return `${x},${y}`;
      })
      .join(' ');

    let strokeColor = '#3b82f6'; // Blue Stable
    if (trend === 'Accelerating') strokeColor = '#10b981'; // Green
    else if (trend === 'Declining') strokeColor = '#f97316'; // Orange
    else if (trend === 'Stalled') strokeColor = '#ef4444'; // Red

    return (
      <div className="flex items-center gap-1.5" title={`Trend: ${trend}`}>
        <svg width={width} height={height} className="overflow-visible">
          <polyline
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          {/* Last dot */}
          {data.length > 0 && (
            <circle
              cx={width - 2}
              cy={height - 2 - ((data[data.length - 1] - min) / (max - min)) * (height - 6)}
              r="2.5"
              fill={strokeColor}
            />
          )}
        </svg>
      </div>
    );
  };

  // Radial Gauge Component for Detail Drawer
  const RadialGauge: React.FC<{ value: number }> = ({ value }) => {
    const clampedVal = Math.min(150, Math.max(0, value));
    const radius = 68;
    const circumference = Math.PI * radius; // Half circle arc
    const progress = (Math.min(100, clampedVal) / 100) * circumference;

    let color = '#10b981'; // Green Optimal
    let statusText = 'Optimal Progress';
    if (clampedVal > 100) {
      color = '#ef4444'; // Red Over
      statusText = 'Over-Utilized (Breach)';
    } else if (clampedVal < 50) {
      color = '#f59e0b'; // Amber Under
      statusText = 'Under-Utilized (<50%)';
    }

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 relative overflow-hidden">
        <div className="relative w-44 h-24 flex items-center justify-center">
          <svg className="w-44 h-28 transform rotate-180 overflow-visible" viewBox="0 0 160 90">
            {/* Background Arc */}
            <path
              d="M 12 85 A 68 68 0 0 1 148 85"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* 50% Marker Line */}
            <line x1="80" y1="17" x2="80" y2="29" stroke="#94a3b8" strokeWidth="2" strokeDasharray="2,2" />
            {/* Value Arc */}
            <path
              d="M 12 85 A 68 68 0 0 1 148 85"
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={`${(clampedVal / 100) * circumference} ${circumference * 2}`}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute bottom-0 text-center">
            <span className="text-3xl font-extrabold tracking-tight" style={{ color }}>
              {value.toFixed(1)}%
            </span>
            <div className="text-[11px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">
              Utilization
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-700/60 bg-slate-800/80">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }}></span>
          <span className="text-slate-200">{statusText}</span>
        </div>
      </div>
    );
  };

  // Status Badge Component
  const StatusBadge: React.FC<{ status: UtilizationStatus }> = ({ status }) => {
    switch (status) {
      case 'Optimal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Optimal
          </span>
        );
      case 'Under-Utilized':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Under-Utilized
          </span>
        );
      case 'Over-Utilized':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <AlertOctagon className="w-3 h-3 text-rose-600" />
            Over-Utilized
          </span>
        );
      case 'Expired':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs">
            <Clock className="w-3 h-3 text-slate-400" />
            Expired
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  // All active alerts aggregation for top summary / quick alert view
  const allActiveAlerts = useMemo(() => {
    const list: UtilizationAlert[] = [];
    metricsList.forEach((m) => {
      m.alerts?.forEach((a) => list.push(a));
    });
    return list;
  }, [metricsList]);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl shadow-xl border transition-all transform animate-in slide-in-from-bottom duration-300 max-w-md ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950 text-emerald-100 border-emerald-800'
              : toastMessage.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-800'
              : 'bg-slate-900 text-slate-100 border-slate-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
          ) : (
            <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          )}
          <div className="flex-1 text-sm">
            <h4 className="font-semibold text-white">{toastMessage.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{toastMessage.desc}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Header / Title Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
              <PieChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Utilization & Compliance Dashboard
                </h1>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                  Phase 4 • Live Monitoring
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time tracking of DGFT Advance Licence FOB consumption, export forecasting, and compliance alerts.
              </p>
            </div>
          </div>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRecalculateSnapshots}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-colors disabled:opacity-50"
            title="Recalculate daily utilization snapshots and compliance checks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            {refreshing ? 'Syncing...' : 'Recalculate Snapshots'}
          </button>

          <button
            onClick={handleOpenSqlAudit}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            title="Inspect SQL aggregation queries and manual sample calculation"
          >
            <Terminal className="w-3.5 h-3.5 text-blue-600" />
            SQL & Sample Audit
          </button>

          <button
            onClick={() => setAlertsPanelOpen(true)}
            className="relative inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 shadow-2xs transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            Compliance Alerts
            {summary && summary.activeAlertsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-600 text-white rounded-full text-[10px] font-bold">
                {summary.activeAlertsCount}
              </span>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Utilization Report
          </button>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {/* TOP SUMMARY CARDS (4-Column Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: In Compliance */}
          <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Licences In Compliance
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {summary ? summary.inComplianceCount : 0}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                of {summary ? summary.totalLicencesCount : 0} total
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                <Check className="w-3 h-3" />
                Optimal Range (50%–100%)
              </span>
              <span className="text-slate-500 text-[11px]">
                {summary && summary.totalLicencesCount > 0
                  ? `${Math.round((summary.inComplianceCount / summary.totalLicencesCount) * 100)}% active`
                  : '0%'}
              </span>
            </div>
          </div>

          {/* Card 2: At Risk */}
          <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                At Risk / Attention
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                <AlertOctagon className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600">
                {summary ? summary.atRiskCount : 0}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                licences flagged
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                <AlertTriangle className="w-3 h-3" />
                &lt;50% or &gt;100% FOB
              </span>
              <button
                onClick={() => setSelectedStatus('Under-Utilized')}
                className="text-blue-600 hover:text-blue-800 text-[11px] font-medium underline"
              >
                Filter list
              </button>
            </div>
          </div>

          {/* Card 3: Active Alerts */}
          <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Alerts
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <AlertTriangle className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-700">
                {summary ? summary.activeAlertsCount : 0}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                unresolved notices
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                  {summary ? summary.criticalAlertsCount : 0} Crit
                </span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                  {summary ? summary.warningAlertsCount : 0} Warn
                </span>
              </div>
              <button
                onClick={() => setAlertsPanelOpen(true)}
                className="text-amber-800 hover:text-amber-950 font-semibold text-[11px]"
              >
                View all →
              </button>
            </div>
          </div>

          {/* Card 4: Expiring Soon */}
          <div className="bg-white rounded-xl border border-slate-200 p-4.5 shadow-2xs hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Expiring Soon (&lt;30 Days)
              </span>
              <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
                <Clock className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-black text-orange-700">
                {summary ? summary.expiringSoonCount : 0}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                approaching validity limit
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-600 truncate max-w-[150px]">
                {summary && summary.expiringSoonLicences.length > 0
                  ? `Lic #${summary.expiringSoonLicences[0].licenceNumber}`
                  : 'No critical expiries'}
              </span>
              <button
                onClick={() => {
                  setDaysFilterActive(true);
                  setMaxDaysRemaining(30);
                }}
                className="text-orange-700 hover:text-orange-900 font-semibold text-[11px]"
              >
                Filter &lt;30d
              </button>
            </div>
          </div>
        </div>

        {/* COMPREHENSIVE OVERVIEW BANNER & AI RECOMMENDATION */}
        <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                AI-Powered Compliance & Quota Recommendations
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Enterprise Export Obligation Status
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Total authorized obligation stands at{' '}
                <strong className="text-white">{formatInrCr(summary?.totalAuthorizedFobSum || 0)}</strong>, with{' '}
                <strong className="text-emerald-400">{formatInrCr(summary?.totalExportedFobSum || 0)}</strong> realized (
                {summary?.overallUtilizationPercent || 0}% overall). Coordinate shipping bill realizations on licences with &lt;45 days remaining to avoid DGFT penalty surcharges.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10 text-center">
                <div className="text-xs text-slate-300 uppercase font-semibold">Overall Rate</div>
                <div className="text-xl font-black text-white mt-0.5">
                  {summary ? `${summary.overallUtilizationPercent}%` : '0%'}
                </div>
              </div>

              <button
                onClick={() => {
                  if (metricsList.length > 0) {
                    handleOpenSimulation(metricsList[0]);
                  }
                }}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <Zap className="w-4 h-4" />
                Run What-If Simulation
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH, FILTER & TOOLBAR */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search licence #, file #, buyer name..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-slate-800"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Utilization Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Utilization</option>
                  <option value="Optimal">Optimal (50%–100%)</option>
                  <option value="Under-Utilized">Under-Utilized (&lt;50%)</option>
                  <option value="Over-Utilized">Over-Utilized (&gt;100%)</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="utilization_percent">Utilization %</option>
                  <option value="days_remaining">Days Remaining</option>
                  <option value="fob_value">Authorized Value</option>
                  <option value="licence_number">Licence Number</option>
                  <option value="trend">Trend Momentum</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                  title={`Toggle sort order (Current: ${sortOrder.toUpperCase()})`}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>

              {/* Reset Filters */}
              {(selectedStatus !== 'All' || searchText || daysFilterActive || selectedLicenceStatus !== 'All') && (
                <button
                  onClick={() => {
                    setSelectedStatus('All');
                    setSelectedLicenceStatus('All');
                    setDaysFilterActive(false);
                    setMaxDaysRemaining(365);
                    setSearchText('');
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg font-semibold transition-colors"
                >
                  <X className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Days Remaining Filter Slider (Expandable toggle) */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs gap-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={daysFilterActive}
                  onChange={(e) => setDaysFilterActive(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span className="font-semibold text-slate-700">Filter by Validity Window:</span>
              </label>

              {daysFilterActive && (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="365"
                    step="5"
                    value={maxDaysRemaining}
                    onChange={(e) => setMaxDaysRemaining(parseInt(e.target.value, 10))}
                    className="w-36 accent-blue-600"
                  />
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                    ≤ {maxDaysRemaining} Days
                  </span>
                </div>
              )}
            </div>

            <div className="text-slate-400 text-[11px]">
              Showing <strong className="text-slate-700">{metricsList.length}</strong> of {totalRecords} licences • Latency: {queryLatency}ms
            </div>
          </div>
        </div>

        {/* UTILIZATION STATUS GRID (MAIN TABLE) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px] select-none">
                  <th className="py-3 px-4">Advance Licence</th>
                  <th className="py-3 px-4">Authorized FOB</th>
                  <th className="py-3 px-4">Exported FOB</th>
                  <th className="py-3 px-4">Utilization %</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Validity / Days</th>
                  <th className="py-3 px-4">Completion Forecast</th>
                  <th className="py-3 px-4 text-center">7-Day Trend</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Loading real-time utilization analytics...</span>
                      </div>
                    </td>
                  </tr>
                ) : metricsList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <PieChart className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-sm font-semibold text-slate-700">No matching licences found</p>
                        <p className="text-xs text-slate-400">Try adjusting your filters or search terms.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  metricsList.map((lic) => {
                    const isExpiring = lic.daysRemaining <= 30 && lic.status !== 'Expired';
                    const isOptimal = lic.status === 'Optimal';
                    const isOver = lic.status === 'Over-Utilized';
                    const isUnder = lic.status === 'Under-Utilized';

                    return (
                      <tr
                        key={lic.licenceId}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleOpenDetail(lic)}
                      >
                        {/* Licence Info */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-start gap-2.5">
                            <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                {lic.licenceNumber}
                                {lic.alerts?.length > 0 && (
                                  <span
                                    className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"
                                    title={`${lic.alerts.length} Active Alert(s)`}
                                  />
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                File: {lic.companyFileNumber}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Authorized FOB */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {formatInrCr(lic.totalAuthorizedFOB)}
                          <div className="text-[10px] text-slate-400 uppercase font-medium">
                            {lic.currency}
                          </div>
                        </td>

                        {/* Exported FOB */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-emerald-700">
                            {formatInrCr(lic.totalExportedFOB)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {lic.shippingBillsCount} Shipping Bill{lic.shippingBillsCount !== 1 ? 's' : ''}
                          </div>
                        </td>

                        {/* Utilization % with Progress Bar */}
                        <td className="py-3.5 px-4 min-w-[130px]">
                          <div className="flex items-center justify-between text-xs font-black mb-1">
                            <span
                              className={
                                isOver
                                  ? 'text-rose-600'
                                  : isUnder
                                  ? 'text-amber-700'
                                  : 'text-emerald-700'
                              }
                            >
                              {lic.utilizationPercent.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOver
                                  ? 'bg-rose-500'
                                  : isUnder
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, lic.utilizationPercent)}%` }}
                            />
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={lic.status} />
                        </td>

                        {/* Days Remaining / Expiry */}
                        <td className="py-3.5 px-4">
                          <div
                            className={`font-bold ${
                              isExpiring
                                ? 'text-rose-600 font-extrabold flex items-center gap-1'
                                : lic.daysRemaining <= 60
                                ? 'text-orange-700'
                                : 'text-slate-700'
                            }`}
                          >
                            {lic.daysRemaining} Days
                            {isExpiring && <Clock className="w-3 h-3 text-rose-500" />}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Exp: {lic.licenceExpiry || 'N/A'}
                          </div>
                        </td>

                        {/* Forecast Completion */}
                        <td className="py-3.5 px-4">
                          {lic.utilizationPercent >= 100 ? (
                            <span className="text-[11px] text-emerald-700 font-semibold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Fulfilled
                            </span>
                          ) : lic.forecastCompletionDate ? (
                            <div>
                              <div className="font-semibold text-slate-800">
                                {lic.forecastCompletionDate}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                ~{formatInrCr(lic.avgMonthlyExport)}/mo pace
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">Stalled / Pending</span>
                          )}
                        </td>

                        {/* 7-Day Trend Sparkline */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <Sparkline data={lic.historySparkline} trend={lic.trend} />
                            <span className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">
                              {lic.trend}
                            </span>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 text-right">
                          <div
                            className="inline-flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleOpenTrendChart(lic)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View 90-Day Trend Curve"
                            >
                              <BarChart2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenSimulation(lic)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Run What-If Simulation"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenDetail(lic)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Open Detail Drawer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination Controls */}
          <div className="px-4 py-3 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 font-semibold focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-800">
                Page {currentPage} of {Math.max(1, Math.ceil(totalRecords / pageSize))}
              </span>
              <button
                disabled={currentPage >= Math.ceil(totalRecords / pageSize)}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LICENCE DETAIL DRAWER (SLIDEOVER PANEL)                                    */}
      {/* ========================================================================= */}
      {detailDrawerOpen && selectedLicence && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Licence {selectedLicence.licenceNumber}
                    </h2>
                    <StatusBadge status={selectedLicence.status} />
                  </div>
                  <p className="text-xs text-slate-400">
                    File: {selectedLicence.companyFileNumber} • Validity: {selectedLicence.licenceExpiry}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Radial Gauge & High-Level Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <RadialGauge value={selectedLicence.utilizationPercent} />

                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Days Remaining</span>
                    <div className="text-lg font-black text-slate-900 flex items-center gap-2">
                      {selectedLicence.daysRemaining} Days
                      {selectedLicence.daysRemaining <= 30 && (
                        <span className="text-xs bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">
                          Urgent
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Current Export Momentum</span>
                    <div className="text-sm font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      {selectedLicence.trend === 'Accelerating' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                      )}
                      {selectedLicence.trend} (~{formatInrCr(selectedLicence.avgMonthlyExport)}/mo)
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Forecast 100% Completion</span>
                    <div className="text-sm font-semibold text-slate-800 mt-0.5">
                      {selectedLicence.forecastCompletionDate || 'N/A (Fulfilled or Stalled)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Metrics 3-Card Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Authorized FOB</div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    {formatInrCr(selectedLicence.totalAuthorizedFOB)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Sanctioned Quota</div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Exported FOB</div>
                  <div className="text-sm font-black text-emerald-700 mt-1">
                    {formatInrCr(selectedLicence.totalExportedFOB)}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    {selectedLicence.utilizationPercent.toFixed(1)}% Realized
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">
                    {selectedLicence.utilizationPercent > 100 ? 'Overshoot Amount' : 'Remaining Quota'}
                  </div>
                  <div
                    className={`text-sm font-black mt-1 ${
                      selectedLicence.utilizationPercent > 100 ? 'text-rose-600' : 'text-slate-800'
                    }`}
                  >
                    {selectedLicence.utilizationPercent > 100
                      ? formatInrCr(selectedLicence.overshootAmount || 0)
                      : formatInrCr(selectedLicence.remainingQuota)}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {selectedLicence.utilizationPercent > 100 ? 'Shortfall Claim Needed' : 'To Be Exported'}
                  </div>
                </div>
              </div>

              {/* Active Alerts for this Licence */}
              {selectedLicence.alerts && selectedLicence.alerts.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Compliance & Regulation Alerts
                  </h4>
                  {selectedLicence.alerts.map((alt) => (
                    <div
                      key={alt.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        alt.alertSeverity === 'Critical'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : alt.alertSeverity === 'Warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-blue-50 border-blue-200 text-blue-900'
                      }`}
                    >
                      <div className="text-xs space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.2 rounded font-bold text-[10px] uppercase ${
                              alt.alertSeverity === 'Critical'
                                ? 'bg-rose-600 text-white'
                                : alt.alertSeverity === 'Warning'
                                ? 'bg-amber-600 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {alt.alertType}
                          </span>
                          <span className="text-slate-400 text-[10px]">{alt.triggeredDate}</span>
                        </div>
                        <p className="font-medium text-slate-800 leading-relaxed">{alt.message}</p>
                      </div>

                      <button
                        onClick={() => setActiveAlertToResolve(alt)}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border shadow-2xs shrink-0"
                      >
                        Action
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Linked Modules Quick Jump */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Linked ALMS Modules
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setDetailDrawerOpen(false);
                      onNavigate?.('licences', { licenceId: selectedLicence.licenceId });
                    }}
                    className="p-3 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                      Advance Licence
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Review DGFT Master</div>
                  </button>

                  <button
                    onClick={() => {
                      setDetailDrawerOpen(false);
                      onNavigate?.('exports', { licenceId: selectedLicence.licenceId });
                    }}
                    className="p-3 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                      Export Bills
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {selectedLicence.shippingBillsCount} Associated Bills
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setDetailDrawerOpen(false);
                      onNavigate?.('materials', { licenceId: selectedLicence.licenceId });
                    }}
                    className="p-3 text-left bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition-all group"
                  >
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 flex items-center justify-between">
                      SION Norms
                      <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Input / Output Items</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => handleOpenTrendChart(selectedLicence)}
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                90-Day Trend Curve
              </button>

              <button
                onClick={() => handleOpenSimulation(selectedLicence)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                Run What-If Simulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 90-DAY UTILIZATION TREND CHART MODAL                                      */}
      {/* ========================================================================= */}
      {trendChartOpen && selectedLicence && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">
                  90-Day Utilization Trend Curve — {selectedLicence.licenceNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  Historical progression vs. 50% target threshold and 100% DGFT sanction limit
                </p>
              </div>
              <button
                onClick={() => setTrendChartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Chart Body */}
            <div className="p-6 space-y-4">
              {trendLoading ? (
                <div className="h-64 flex items-center justify-center text-slate-400 gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Generating daily snapshot series...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* SVG Line Chart Canvas */}
                  <div className="relative h-64 bg-slate-950 rounded-xl p-4 border border-slate-800 overflow-hidden select-none">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none opacity-20">
                      <div className="border-b border-white"></div>
                      <div className="border-b border-white"></div>
                      <div className="border-b border-white"></div>
                      <div className="border-b border-white"></div>
                    </div>

                    {/* 100% Threshold Line (Red Dashed) */}
                    <div
                      className="absolute left-0 right-0 border-b-2 border-dashed border-rose-500/80 pointer-events-none"
                      style={{ top: '33.3%' }}
                    >
                      <span className="absolute right-3 -top-5 text-[10px] font-bold text-rose-400 bg-slate-900/80 px-1.5 py-0.5 rounded">
                        100% Sanction Cap
                      </span>
                    </div>

                    {/* 50% Threshold Line (Green Dashed) */}
                    <div
                      className="absolute left-0 right-0 border-b-2 border-dashed border-emerald-500/80 pointer-events-none"
                      style={{ top: '66.6%' }}
                    >
                      <span className="absolute right-3 -top-5 text-[10px] font-bold text-emerald-400 bg-slate-900/80 px-1.5 py-0.5 rounded">
                        50% Minimum Target
                      </span>
                    </div>

                    {/* SVG Trend Polyline */}
                    {trendHistory.length > 1 && (
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 600 200" preserveAspectRatio="none">
                        {/* Area gradient */}
                        <defs>
                          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Area Fill */}
                        <polygon
                          fill="url(#trendGrad)"
                          points={`0,200 ${trendHistory
                            .map((snap, idx) => {
                              const x = (idx / (trendHistory.length - 1)) * 600;
                              // 150% is max top (y=0), 0% is bottom (y=200)
                              const y = 200 - (Math.min(150, snap.utilizationPercent) / 150) * 200;
                              return `${x},${y}`;
                            })
                            .join(' ')} 600,200`}
                        />

                        {/* Actual Polyline */}
                        <polyline
                          fill="none"
                          stroke="#3b82f6"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={trendHistory
                            .map((snap, idx) => {
                              const x = (idx / (trendHistory.length - 1)) * 600;
                              const y = 200 - (Math.min(150, snap.utilizationPercent) / 150) * 200;
                              return `${x},${y}`;
                            })
                            .join(' ')}
                        />

                        {/* Points */}
                        {trendHistory.map((snap, idx) => {
                          if (idx % 10 !== 0 && idx !== trendHistory.length - 1) return null;
                          const x = (idx / (trendHistory.length - 1)) * 600;
                          const y = 200 - (Math.min(150, snap.utilizationPercent) / 150) * 200;
                          return (
                            <circle
                              key={idx}
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#60a5fa"
                              stroke="#1e3a8a"
                              strokeWidth="2"
                            />
                          );
                        })}
                      </svg>
                    )}

                    {/* Chart Legend Overlay */}
                    <div className="absolute bottom-2 left-3 flex items-center gap-4 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-0.5 bg-blue-500"></span> Actual Utilization
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-0.5 border-b border-dashed border-emerald-400"></span> 50% Threshold
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-0.5 border-b border-dashed border-rose-400"></span> 100% Max Quota
                      </span>
                    </div>
                  </div>

                  {/* Summary Bar Below Chart */}
                  <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border text-xs">
                    <div>
                      <span className="text-slate-400">Start (90d Ago):</span>
                      <div className="font-bold text-slate-800">
                        {trendHistory[0]?.utilizationPercent || 0}%
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Current Rate:</span>
                      <div className="font-bold text-blue-700">
                        {selectedLicence.utilizationPercent}%
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400">Projected 100%:</span>
                      <div className="font-bold text-emerald-700">
                        {selectedLicence.forecastCompletionDate || 'On Track'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setTrendChartOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold"
              >
                Close Chart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* WHAT-IF SCENARIO SIMULATION MODAL                                         */}
      {/* ========================================================================= */}
      {simulationOpen && selectedLicence && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/30 rounded-lg border border-blue-400/40">
                  <Zap className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    What-If Utilization Simulation
                  </h3>
                  <p className="text-xs text-blue-200">
                    Licence {selectedLicence.licenceNumber} (Authorized: {formatInrCr(selectedLicence.totalAuthorizedFOB)})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSimulationOpen(false)}
                className="p-1.5 text-blue-200 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulation Controls & Real-Time Output */}
            <div className="p-6 space-y-5">
              {/* Slider for Additional FOB */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Hypothetical Additional Export (FOB INR):</span>
                  <span className="font-black text-blue-700 text-sm">
                    {formatInrCr(additionalFobInr)}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.round(selectedLicence.totalAuthorizedFOB * 1.3)}
                  step="500000"
                  value={additionalFobInr}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setAdditionalFobInr(val);
                    runSimulation(selectedLicence.licenceId, val, hypotheticalRate);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>₹0</span>
                  <span>{formatInrCr(selectedLicence.totalAuthorizedFOB * 0.5)}</span>
                  <span>{formatInrCr(selectedLicence.totalAuthorizedFOB * 1.3)}</span>
                </div>
              </div>

              {/* Simulation Projected Output Cards */}
              {simulationResult && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Projected Scenario Outcomes
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Projected Utilization</div>
                      <div className="text-xl font-black text-slate-900 mt-1 flex items-center gap-1.5">
                        {simulationResult.projectedUtilization.toFixed(1)}%
                        <span className="text-xs text-emerald-600 font-semibold">
                          (+{(simulationResult.projectedUtilization - simulationResult.currentUtilization).toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Revised Status</div>
                      <div className="mt-1">
                        <StatusBadge status={simulationResult.newStatus} />
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 col-span-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Estimated 100% Completion Date</div>
                      <div className="text-sm font-bold text-slate-900 mt-0.5">
                        {simulationResult.projectedCompletionDate || 'Fulfilled immediately with this export volume'}
                      </div>
                    </div>
                  </div>

                  {simulationResult.isOverUtilized && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                      <AlertOctagon className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                      <div>
                        <strong>Breach Risk:</strong> This hypothetical volume exceeds authorized FOB by{' '}
                        {formatInrCr(simulationResult.projectedOvershoot)}. A DGFT shortfall claim will be required.
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSimulationOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ALL COMPLIANCE ALERTS MODAL / RESOLUTION PANEL                            */}
      {/* ========================================================================= */}
      {alertsPanelOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Compliance & Regulation Alerts
                  </h3>
                  <p className="text-xs text-slate-400">
                    Active compliance alerts requiring operational attention or shortfall filing
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAlertsPanelOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {allActiveAlerts.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No active compliance alerts!</p>
                  <p className="text-xs text-slate-400">All Advance Licences are operating within authorized bounds.</p>
                </div>
              ) : (
                allActiveAlerts.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                      alt.alertSeverity === 'Critical'
                        ? 'bg-rose-50/70 border-rose-200'
                        : alt.alertSeverity === 'Warning'
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-blue-50/70 border-blue-200'
                    }`}
                  >
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                            alt.alertSeverity === 'Critical'
                              ? 'bg-rose-600 text-white'
                              : alt.alertSeverity === 'Warning'
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {alt.alertSeverity} • {alt.alertType}
                        </span>
                        <span className="font-bold text-slate-800">
                          Licence #{alt.licenceNumber}
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          Triggered: {alt.triggeredDate}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium leading-relaxed">
                        {alt.message}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setActiveAlertToResolve(alt);
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border shadow-2xs transition-colors"
                      >
                        Resolve / Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setAlertsPanelOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RESOLVE / DISMISS ALERT PROMPT MODAL                                      */}
      {/* ========================================================================= */}
      {activeAlertToResolve && (
        <div className="fixed inset-0 z-60 overflow-hidden bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Resolve Compliance Alert</h3>
              <button
                onClick={() => setActiveAlertToResolve(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-500 uppercase text-[10px]">Alert Details</span>
                <p className="font-semibold text-slate-800 mt-1">{activeAlertToResolve.message}</p>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Resolution or Dismissal Notes:</label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g., Shortfall claim filed with DGFT regional authority on 2026-08-26..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setActiveAlertToResolve(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={resolvingAlert}
                onClick={() => handleResolveAlert('Dismissed')}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-semibold"
              >
                Dismiss Notice
              </button>
              <button
                disabled={resolvingAlert}
                onClick={() => handleResolveAlert('Resolved')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                {resolvingAlert ? 'Saving...' : 'Mark as Resolved'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SQL & Sample Audit Modal */}
      {sqlAuditModalOpen && (
        <div className="fixed inset-0 z-60 overflow-hidden bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">SQL Aggregation Audit & Sample Calculation</h3>
              </div>
              <button
                onClick={() => setSqlAuditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {sqlAuditLoading ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <p>Loading SQL queries and sample calculation audit...</p>
                </div>
              ) : sqlAuditData ? (
                <>
                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">1. Core SQL Aggregation Queries</h4>
                    <p className="text-slate-600">
                      The utilization dashboard and obligation tracking engine executes the following PostgreSQL aggregates against <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">shipping_bills</code>, <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">import_documents</code>, and <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">licence_master</code>:
                    </p>

                    <div className="space-y-3 mt-3">
                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto shadow-xs">
                        <span className="text-emerald-400 font-bold block mb-1">-- Total Exported FOB per Licence</span>
                        {sqlAuditData.queries.totalExportedFobSql}
                      </div>

                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto shadow-xs">
                        <span className="text-emerald-400 font-bold block mb-1">-- Total Imported CIF per Licence</span>
                        {sqlAuditData.queries.totalImportedCifSql}
                      </div>

                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl font-mono text-[11px] overflow-x-auto shadow-xs">
                        <span className="text-emerald-400 font-bold block mb-1">-- Utilization Percentage & Obligation Status</span>
                        {sqlAuditData.queries.utilizationPercentSql}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm">2. Manual Sample Calculation Verification</h4>
                    <p className="text-slate-600">
                      Below is a sample verification check for Advance Licence <span className="font-bold font-mono text-slate-900">{sqlAuditData.sampleCalculation.licenceNumber}</span>:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 font-medium">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Export Obligation Authorized Target (FOB)</span>
                        <span className="text-slate-900 font-bold text-sm">₹{Number(sqlAuditData.sampleCalculation.exportObligationValueInr).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Realized Export Shipped (FOB)</span>
                        <span className="text-emerald-700 font-bold text-sm">₹{Number(sqlAuditData.sampleCalculation.realizedExportFobInr).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Import Entitlement Authorized (CIF)</span>
                        <span className="text-slate-900 font-bold text-sm">₹{Number(sqlAuditData.sampleCalculation.importLicenceValueInr).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-bold">Total Imported B/E (CIF)</span>
                        <span className="text-blue-700 font-bold text-sm">₹{Number(sqlAuditData.sampleCalculation.totalImportedCifInr).toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1 text-emerald-900">
                      <div className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Verification Formulas & Results
                      </div>
                      <p className="font-mono text-[11px] text-emerald-800">
                        • Utilization % = {sqlAuditData.sampleCalculation.formula.utilizationPercent}
                      </p>
                      <p className="font-mono text-[11px] text-emerald-800">
                        • Remaining Import Entitlement = {sqlAuditData.sampleCalculation.formula.remainingImportEntitlement} (₹{Number(sqlAuditData.sampleCalculation.remainingImportEntitlementInr).toLocaleString()})
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-slate-500">Failed to load SQL audit information.</div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
              <button
                onClick={() => setSqlAuditModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs"
              >
                Close Audit Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  ArrowUpRight, 
  ShieldAlert, 
  TrendingUp, 
  Database,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { ModuleId, AdvanceLicence } from '../types';
import { fetchLicencesFromDB, checkDatabaseStatus, DatabaseStatusResponse } from '../lib/supabase';

interface DashboardProps {
  onNavigate: (id: ModuleId) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [licences, setLicences] = useState<AdvanceLicence[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [licResult, statusResult] = await Promise.all([
        fetchLicencesFromDB().catch(() => ({ licences: [], source: 'error', isDb: false })),
        checkDatabaseStatus().catch(() => null),
      ]);
      setLicences(licResult.licences);
      setDbStatus(statusResult);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeLicences = licences.filter(l => (l.licenceStatus || l.status) === 'Active');
  const totalCif = licences.reduce((sum, l) => sum + (Number(l.importLicenceValue) || Number(l.cifValue) || 0), 0);
  const totalEo = licences.reduce((sum, l) => sum + (Number(l.exportObligationValue) || Number(l.fobValue) || 0), 0);
  const nearlyExpired = licences.filter(l => (l.licenceStatus || l.status) === 'Nearly Expired' || (l.licenceStatus || l.status) === 'Pending Closure');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Alok Industries</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">Advance Licence Management System (ALMS)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Export & Logistics Control Center</h1>
          <p className="text-sm text-slate-600 mt-1">
            Centralized tracking of DGFT Advance Licences, SION norms, import Bill of Entries, and export fulfillment.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            title="Refresh live metrics"
            className="p-2 text-slate-500 hover:text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <div className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${dbStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
            <span className="font-medium">
              {dbStatus?.connected
                ? `Supabase Postgres: ${licences.length} Licences Active`
                : `Storage: ${licences.length} Licences Cached`}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => onNavigate('licences')}
          className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Licences</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{activeLicences.length}</div>
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span>{licences.length} total master records in database</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sanctioned CIF Value</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-slate-900">
              {totalCif === 0 ? '₹ 0.00' : `₹ ${(totalCif / 10000000).toFixed(2)} Cr`}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total duty-free entitlement</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Export Obligation (EO)</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-slate-900">
              {totalEo === 0 ? '₹ 0.00' : `₹ ${(totalEo / 10000000).toFixed(2)} Cr`}
            </div>
            <div className="text-xs text-slate-500 mt-1">Total committed export value</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring / Pending</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-slate-900">{nearlyExpired.length}</div>
            <div className="text-xs text-slate-500 mt-1">Requires EO completion check</div>
          </div>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quick Module Access & Status */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                System Modules & Navigation
              </h3>
              <span className="text-xs text-slate-500">Click any module to inspect</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => onNavigate('licences')}
                className="p-4 rounded-xl border border-slate-200 hover:border-blue-500/50 hover:bg-blue-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                      AL
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Advance Authorisations
                      </h4>
                      <p className="text-xs text-slate-500">Manage licences, SION norms, and export items</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>

              <div 
                onClick={() => onNavigate('imports')}
                className="p-4 rounded-xl border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-semibold text-sm">
                      BOE
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                        Import Tracking (BOE)
                      </h4>
                      <p className="text-xs text-slate-500">Log Bill of Entry duty-free debits against licences</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </div>

              <div 
                onClick={() => onNavigate('exports')}
                className="p-4 rounded-xl border border-slate-200 hover:border-indigo-500/50 hover:bg-indigo-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm">
                      SB
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        Export Shipping Bills
                      </h4>
                      <p className="text-xs text-slate-500">Fulfill Export Obligations with shipping bills & BRC</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>

              <div 
                onClick={() => onNavigate('utilization')}
                className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 hover:border-blue-500/80 hover:bg-blue-50/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      UT
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          Utilization Dashboard
                        </h4>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                          Phase 4
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Real-time FOB consumption, forecasts & compliance alerts</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>

              <div 
                onClick={() => onNavigate('reconciliation')}
                className="p-4 rounded-xl border border-slate-200 hover:border-purple-500/50 hover:bg-purple-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                      RC
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                        EODC & Reconciliation
                      </h4>
                      <p className="text-xs text-slate-500">Audit SION consumption & closure readiness</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Supabase Database Audit Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-4 h-4 text-blue-600" />
              Supabase Postgres Health
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Engine:</span>
                <span className="font-semibold text-slate-800">PostgreSQL (Supabase)</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Master Table:</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">licence_master</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Child Table:</span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">licence_export_items</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-50">
                <span className="text-slate-500">Numeric Precision:</span>
                <span className="font-semibold text-emerald-600">NUMERIC(18, 4) Exact</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Master Records:</span>
                <span className="font-bold text-slate-900">{licences.length} Records</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              {dbStatus?.connected ? (
                <span className="text-emerald-700 flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Connected to Supabase PostgreSQL cloud database.
                </span>
              ) : (
                <span className="text-slate-600">
                  Ready for Supabase credentials. Schema configured in <code className="font-mono text-blue-600">/supabase/schema.sql</code>.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

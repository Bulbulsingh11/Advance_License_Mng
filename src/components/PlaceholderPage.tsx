import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PieChart, 
  Search, 
  BarChart3, 
  Settings, 
  Construction, 
  CheckCircle2, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { ModuleId } from '../types';
import { NAVIGATION_ITEMS } from '../data/navigation';

interface PlaceholderPageProps {
  moduleId: ModuleId;
  onNavigate?: (id: ModuleId) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Search,
  BarChart3,
  Settings
};

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ moduleId, onNavigate }) => {
  const item = NAVIGATION_ITEMS.find(n => n.id === moduleId) || NAVIGATION_ITEMS[0];
  const Icon = iconMap[item.iconName] || FileText;

  const getModuleSpecificDetails = (id: ModuleId) => {
    switch (id) {
      case 'licences':
        return {
          scope: 'Advance Licence Master Repository',
          features: [
            'DGFT Advance Licence document indexing & metadata storage (Licence No, Issue Date, Expiry Date)',
            'Sanctioned CIF Value (Foreign Currency & INR) and Quantity limits per SION norm',
            'Export Obligation (EO) period tracking and extension history records',
            'Port of Registration & Custom House (ICEGATE) mapping'
          ],
          statusText: 'Ready for database schema connection & PDF metadata ingestion.'
        };
      case 'materials':
        return {
          scope: 'Raw Materials & Finished Goods (SCOMET & SION)',
          features: [
            'ITC (HS) code classification for imported inputs and export finished goods',
            'Standard Input-Output Norms (SION) mapping table for Alok Industries textile products',
            'Unit of Measurement (UMT) standardization (KGs, Meters, Pieces, Metric Tonnes)',
            'SCOMET and restricted item compliance flags'
          ],
          statusText: 'Material master catalog structure defined.'
        };
      case 'imports':
        return {
          scope: 'Duty-Free Import Transactions (Bill of Entry)',
          features: [
            'Bill of Entry (BOE) number, date, and port code recording',
            'Mapping imported raw material quantity & CIF value against active Advance Licences',
            'Customs duty saved calculations and bond/bank guarantee tracking',
            'ICEGATE EDI transmission status verification log'
          ],
          statusText: 'Import transaction logging interface staged.'
        };
      case 'exports':
        return {
          scope: 'Export Fulfillment & Shipping Bills',
          features: [
            'Shipping Bill (SB) number, date, and Port of Export recording',
            'Realized FOB value in Foreign Exchange (USD/EUR/GBP) and INR equivalent',
            'Mapping exported finished goods to fulfill specific Advance Licence Export Obligations (EO)',
            'e-BRC (Electronic Bank Realization Certificate) linkage and tracking'
          ],
          statusText: 'Export obligation fulfillment ledger structured.'
        };
      case 'utilization':
        return {
          scope: 'Licence Utilization & Balance Engine',
          features: [
            'Real-time balance calculation: Sanctioned vs. Utilized vs. Available Quantity & Value',
            'Export Obligation (EO) percentage completion gauges',
            'Red-flag alerts for licences nearing EO deadline or expiry',
            'Consolidated audit trail per licence for DGFT redemption/closure'
          ],
          statusText: 'Core calculation rules pending step-by-step business logic definition.'
        };
      case 'finder':
        return {
          scope: 'Smart Advance Licence Finder',
          features: [
            'Intelligent matching of upcoming import/export transactions with optimal available licences',
            'FIFO / optimal expiry sorting to prevent licence lapsing',
            'Material & SION compatibility verification',
            'Simulation tool for projected import duty savings'
          ],
          statusText: 'Recommendation algorithm framework initialized.'
        };
      case 'reports':
        return {
          scope: 'Management & Compliance Reports',
          features: [
            'DGFT Monthly/Quarterly Utilization Summary for Senior Management',
            'Expired & Expiring Licences Audit Report (< 90 days alert)',
            'Export Obligation Discharge Certificate (EODC) readiness status report',
            'Exportable PDF/Excel data export capabilities'
          ],
          statusText: 'Reporting templates and data connectors ready.'
        };
      case 'settings':
        return {
          scope: 'System Preferences & Configuration',
          features: [
            'Alok Industries plant and unit management (Silvassa, Vapi, Mumbai, etc.)',
            'Exchange rate master tables (RBI / Customs reference rates)',
            'User role-based access control (Export Officer, Logistics Head, Auditor)',
            'Audit log retention and security policies'
          ],
          statusText: 'Enterprise configuration defaults loaded.'
        };
      default:
        return {
          scope: 'Enterprise Dashboard & Overview',
          features: [
            'Real-time KPI cards for active licences, total sanctioned value, and utilization ratios',
            'Expiring licences notification ticker',
            'Recent import/export transaction feed',
            'Quick navigation to critical compliance tasks'
          ],
          statusText: 'Shell operational.'
        };
    }
  };

  const details = getModuleSpecificDetails(moduleId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Alok Industries ALMS</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">{details.scope}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">{item.label}</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">{item.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Construction className="w-3.5 h-3.5" /> Module Shell Initialized
          </span>
        </div>
      </div>

      {/* Module Architecture & Planned Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-semibold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Planned Enterprise Specifications
            </h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">
              Export & Logistics Department
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Core Functional Capabilities</p>
            <ul className="space-y-2.5">
              {details.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5 border border-blue-100">
                    {idx + 1}
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-600 font-medium">
              <ShieldAlert className="w-4 h-4 text-blue-600" /> {details.statusText}
            </span>
            <span>Architecture: Modular TypeScript / React</span>
          </div>
        </div>

        {/* Sidebar / Quick Navigation Card */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
              AL
            </div>
            <div>
              <h4 className="font-semibold text-white text-base">Step-by-Step Development</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                As instructed, we are building the application shell first. Business data models, API connections, and OCR parsing will be integrated incrementally in subsequent steps.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="text-[11px] uppercase font-semibold text-slate-400 tracking-wider">Quick Actions</div>
            {onNavigate && moduleId !== 'dashboard' && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
              >
                <span>Return to Dashboard</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
            {onNavigate && moduleId !== 'licences' && (
              <button
                onClick={() => onNavigate('licences')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors shadow-sm"
              >
                <span>View Advance Licences</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

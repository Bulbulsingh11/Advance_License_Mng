import React, { useState } from 'react';
import { 
  BookOpen, 
  FileText, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  PieChart, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink,
  Cpu,
  Layers,
  Database,
  Calculator
} from 'lucide-react';
import { ModuleId } from '../types';

interface PortalGuidePageProps {
  onNavigate: (module: ModuleId) => void;
}

export const PortalGuidePage: React.FC<PortalGuidePageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'workflow' | 'ai' | 'compliance' | 'faq'>('overview');

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold mb-4 border border-blue-400/30">
            <BookOpen className="w-3.5 h-3.5" /> Official ALMS Portal Documentation
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
            Advance Licence Management System (ALMS) Guide
          </h1>
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">
            Welcome to the Alok Industries ALMS Portal. This comprehensive guide explains DGFT Advance Authorisations, SION compliance norms, automated AI PDF extractions for Bills of Entry and Shipping Bills, and real-time Export Obligation (EO) utilization tracking.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              onClick={() => setActiveTab('workflow')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2"
            >
              Explore Workflows
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors border border-slate-700 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" /> AI Document OCR Engine
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 gap-8 overflow-x-auto">
        {[
          { id: 'overview', label: '1. Portal Overview', icon: Layers },
          { id: 'workflow', label: '2. End-to-End Workflows', icon: FileText },
          { id: 'ai', label: '3. AI Extraction & Honesty', icon: Sparkles },
          { id: 'compliance', label: '4. DGFT & Customs Compliance', icon: ShieldCheck },
          { id: 'faq', label: '5. FAQ & Troubleshooting', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Advance Authorisation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Duty-free import of raw materials (inputs) for physical export of finished textile goods (products) under DGFT Foreign Trade Policy (FTP).
                </p>
                <button
                  onClick={() => onNavigate('licences')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 pt-2"
                >
                  View Licences Master <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Import Inward Register</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tracks Bills of Entry (BOE), customs clearance, CIF values in INR/FC, duty saved against customs, and item-level SION mapping.
                </p>
                <button
                  onClick={() => onNavigate('imports')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 pt-2"
                >
                  View Import Transactions <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Export Shipping Bills</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Manages Shipping Bills (SB), FOB realization, Bank Realization Certificates (BRC), and Export Obligation (EO) discharge progress.
                </p>
                <button
                  onClick={() => onNavigate('exports')}
                  className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1 pt-2"
                >
                  View Export Transactions <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" /> Core Compliance Objective
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Alok Industries operates multiple Advance Authorisation licences for textile manufacturing. Under DGFT regulations, duty-free imported raw materials must be strictly accounted for against exported finished goods within the specified Export Obligation Period (typically 18 months). ALMS provides real-time audit readiness, preventing negative value additions and ensuring zero duty liabilities upon redemption.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Value Addition Norms</h4>
                    <p className="text-xs text-slate-600 mt-1">Minimum 15% positive value addition calculated as (FOB Export - CIF Import) / CIF Import * 100.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">SION Input-Output Matching</h4>
                    <p className="text-xs text-slate-600 mt-1">Standard Input Output Norms (SION) enforced for every raw material input against export item quantity.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workflow' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Step-by-Step Operating Workflow</h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-200">
                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    1
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex-1 space-y-2">
                    <h4 className="text-base font-bold text-slate-900">Licence Master Setup & PDF OCR</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Navigate to <button onClick={() => onNavigate('licences')} className="text-blue-600 font-semibold underline">Advance Licences</button> and click "Upload DGFT Licence PDF" or create manually. The AI extracts authorisation number, issue date, import/export validities, CIF/FOB values, and SION norms.
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    2
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex-1 space-y-2">
                    <h4 className="text-base font-bold text-slate-900">Materials & SION Definition</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Go to <button onClick={() => onNavigate('materials')} className="text-blue-600 font-semibold underline">Materials / Items</button> to configure input raw materials (e.g. Raw Cotton, Polyester Staple Fibre, Dyes) and export finished goods (e.g. Cotton Dyed Fabric) mapped to SION codes.
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    3
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex-1 space-y-2">
                    <h4 className="text-base font-bold text-slate-900">Import Transactions (Bill of Entry)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      In <button onClick={() => onNavigate('imports')} className="text-blue-600 font-semibold underline">Import Transactions</button>, upload ICEGATE EDI Bill of Entry PDFs or Excel files. The system validates the licence reference in `licence_master` and records duty-free raw material imports.
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    4
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex-1 space-y-2">
                    <h4 className="text-base font-bold text-slate-900">Export Transactions (Shipping Bills)</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      In <button onClick={() => onNavigate('exports')} className="text-blue-600 font-semibold underline">Export Transactions</button>, upload ICEGATE Shipping Bill PDFs or Excel spreadsheets. Track FOB realization and BRC status to fulfill Export Obligation.
                    </p>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center flex-shrink-0 z-10 shadow-sm">
                    5
                  </div>
                  <div className="bg-emerald-50/50 p-6 rounded-xl border border-emerald-200 flex-1 space-y-2">
                    <h4 className="text-base font-bold text-emerald-950">Utilization & Smart Licence Finder</h4>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      Check <button onClick={() => onNavigate('utilization')} className="text-emerald-700 font-semibold underline">Utilization</button> for real-time obligation progress, or use <button onClick={() => onNavigate('finder')} className="text-emerald-700 font-semibold underline">Licence Finder</button> to find the best active licence for new orders.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Gemini AI Document Extraction & Honesty Policy</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Zero hallucination OCR parsing for ICEGATE EDI PDFs</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                ALMS uses Google's advanced Gemini AI models to parse multi-page ICEGATE EDI printouts for Advance Licences, Bills of Entry (Import), and Shipping Bills (Export).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Strict Honesty Rules
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                    <li>Never invent or guess missing financial or quantity figures.</li>
                    <li>If extraction is partial or uncertain, fields are left blank and marked as <span className="font-semibold text-amber-600">Needs Verification</span>.</li>
                    <li>If PDF extraction fails completely, the review table remains empty and saving is blocked until verified.</li>
                  </ul>
                </div>

                <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-600" /> Auto-Licence Linking
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2 list-disc list-inside">
                    <li>Extracts Advance Authorisation numbers directly from document headers or Part IV.B.</li>
                    <li>Automatically resolves and links or auto-creates master records in Supabase PostgreSQL without blocking user uploads.</li>
                    <li>Ensures zero discrepancies between customs printouts and internal registers.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-slate-900">DGFT & Customs Statutory Regulations</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                All transactions recorded in ALMS comply with Chapter 4 of the Foreign Trade Policy (FTP) and Customs Notification No. 18/2015-Cus.
              </p>

              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-sm font-bold text-slate-950">Export Obligation Period (EOP)</h4>
                  <p className="text-xs text-slate-600">
                    The export obligation must be fulfilled within 18 months from the date of issue of the authorisation. ALMS automatically calculates expiry countdowns and highlights licences nearing expiry.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-sm font-bold text-slate-950">Bank Realization Certificate (BRC) Tracking</h4>
                  <p className="text-xs text-slate-600">
                    Export proceeds must be realized in free foreign exchange through authorized banking channels within stipulated RBI timelines. BRC status is tracked per Shipping Bill.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <h4 className="text-sm font-bold text-slate-950">Redemption & EODC</h4>
                  <p className="text-xs text-slate-600">
                    Upon complete fulfillment of Export Obligation and submission of required documents, ALMS generates complete utilization snapshots for submission to the Regional Authority (RA / DGFT) for Export Obligation Discharge Certificate (EODC).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h3>

              <div className="space-y-4">
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-950">Q: What happens if an imported raw material does not match the SION norm?</h4>
                  <p className="text-xs text-slate-600">
                    A: ALMS flags input items that exceed authorized SION quantities or do not match sanctioned ITC HS codes, preventing unauthorized duty-free imports.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-950">Q: Can I upload bulk Excel spreadsheets for historical imports and exports?</h4>
                  <p className="text-xs text-slate-600">
                    A: Yes! Both Import Transactions and Export Transactions support Excel spreadsheet drag-and-drop uploaders in addition to PDF OCR.
                  </p>
                </div>

                <div className="p-5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-950">Q: How is Export Obligation utilization calculated?</h4>
                  <p className="text-xs text-slate-600">
                    A: Utilization is computed by aggregating realized FOB values of Shipping Bills linked to a specific Advance Authorisation and comparing them against the mandated Export Obligation FOB requirement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

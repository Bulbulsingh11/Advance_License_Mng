import React, { useState } from 'react';
import { 
  Settings, 
  DollarSign, 
  Layers, 
  Users, 
  Building2, 
  Save, 
  Edit2, 
  Trash2, 
  Plus, 
  Check, 
  X, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Info,
  Lock,
  Globe,
  AlertTriangle,
  Sliders
} from 'lucide-react';
import { 
  ExchangeRateSetting, 
  SionTemplate, 
  UserRole, 
  SystemSetting 
} from '../types';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'forex' | 'sion' | 'roles' | 'system'>('forex');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // --------------------------------------------------------------------------
  // SECTION A: FOREX RATES STATE & HANDLERS
  // --------------------------------------------------------------------------
  const [exchangeRates, setExchangeRates] = useState<ExchangeRateSetting[]>([
    {
      id: 'rate-usd',
      currency: 'USD',
      currencyName: 'US Dollar',
      importRateInr: 83.50,
      exportRateInr: 83.45,
      rbiReferenceRateInr: 83.48,
      effectiveDate: '2026-09-01',
      lastUpdatedBy: 'Girman Thapa',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rate-eur',
      currency: 'EUR',
      currencyName: 'Euro',
      importRateInr: 90.80,
      exportRateInr: 90.72,
      rbiReferenceRateInr: 90.75,
      effectiveDate: '2026-09-01',
      lastUpdatedBy: 'Girman Thapa',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rate-gbp',
      currency: 'GBP',
      currencyName: 'British Pound Sterling',
      importRateInr: 108.20,
      exportRateInr: 108.10,
      rbiReferenceRateInr: 108.15,
      effectiveDate: '2026-09-01',
      lastUpdatedBy: 'Priya Mehta',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rate-jpy',
      currency: 'JPY',
      currencyName: 'Japanese Yen (100 JPY)',
      importRateInr: 56.40,
      exportRateInr: 56.32,
      rbiReferenceRateInr: 56.35,
      effectiveDate: '2026-09-01',
      lastUpdatedBy: 'Priya Mehta',
      updatedAt: new Date().toISOString()
    },
    {
      id: 'rate-aed',
      currency: 'AED',
      currencyName: 'UAE Dirham',
      importRateInr: 22.75,
      exportRateInr: 22.72,
      rbiReferenceRateInr: 22.73,
      effectiveDate: '2026-09-01',
      lastUpdatedBy: 'Girman Thapa',
      updatedAt: new Date().toISOString()
    }
  ]);

  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [editRateForm, setEditRateForm] = useState<Partial<ExchangeRateSetting>>({});

  const handleStartEditRate = (rate: ExchangeRateSetting) => {
    setEditingRateId(rate.id);
    setEditRateForm(rate);
  };

  const handleSaveRate = (id: string) => {
    setExchangeRates(prev => prev.map(r => r.id === id ? { 
      ...r, 
      ...editRateForm, 
      updatedAt: new Date().toISOString() 
    } as ExchangeRateSetting : r));
    setEditingRateId(null);
    setNotification({ message: 'Forex exchange rate updated successfully!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  // --------------------------------------------------------------------------
  // SECTION B: SION TEMPLATES STATE & HANDLERS
  // --------------------------------------------------------------------------
  const [sionTemplates, setSionTemplates] = useState<SionTemplate[]>([
    {
      id: 'tmpl-01',
      templateName: '100% Cotton Fabric Standard Norm',
      rawMaterialName: 'Raw Cotton Fibre / Cotton Yarn',
      rawMaterialHsCode: '52010015',
      finishedGoodName: '100% Cotton Woven Grey / Processed Fabric',
      finishedGoodHsCode: '52081190',
      inputQty: 1.15,
      inputUom: 'KGS',
      outputQty: 1.00,
      outputUom: 'KGS',
      yieldRatio: 1.15,
      wastagePercent: 15.0,
      isActive: true,
      description: 'Standard DGFT SION norm for Alok Silvassa weaving & processing plant.'
    },
    {
      id: 'tmpl-02',
      templateName: 'Polyester Bed Sheet Set Processing',
      rawMaterialName: 'Polyester Filament Yarn / POY 150D',
      rawMaterialHsCode: '54023300',
      finishedGoodName: 'Polyester Printed Bed Sheet Sets',
      finishedGoodHsCode: '63022200',
      inputQty: 1.05,
      inputUom: 'KGS',
      outputQty: 1.00,
      outputUom: 'NOS',
      yieldRatio: 1.05,
      wastagePercent: 5.0,
      isActive: true,
      description: 'High-speed jet loom weaving & continuous dyeing process norm.'
    },
    {
      id: 'tmpl-03',
      templateName: 'Reactive Textile Dyes & Auxiliaries',
      rawMaterialName: 'Synthetic Organic Reactive Dyes',
      rawMaterialHsCode: '32041600',
      finishedGoodName: 'Dyed Cotton Terry Towels',
      finishedGoodHsCode: '63026000',
      inputQty: 0.05,
      inputUom: 'KGS',
      outputQty: 1.00,
      outputUom: 'KGS',
      yieldRatio: 0.05,
      wastagePercent: 5.0,
      isActive: true,
      description: 'Chemical consumption ratio for Vapi towel dyeing unit.'
    }
  ]);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState<Partial<SionTemplate>>({
    templateName: '',
    rawMaterialName: '',
    finishedGoodName: '',
    inputQty: 1.0,
    inputUom: 'KGS',
    outputQty: 1.0,
    outputUom: 'KGS',
    yieldRatio: 1.0,
    wastagePercent: 5.0,
    isActive: true
  });

  const handleSaveNewTemplate = () => {
    if (!newTemplate.templateName || !newTemplate.rawMaterialName) {
      setNotification({ message: 'Template Name and Raw Material are required.', type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const templateToAdd: SionTemplate = {
      id: `tmpl-${Date.now()}`,
      templateName: newTemplate.templateName!,
      rawMaterialName: newTemplate.rawMaterialName!,
      finishedGoodName: newTemplate.finishedGoodName || 'Finished Goods',
      inputQty: Number(newTemplate.inputQty) || 1.0,
      inputUom: newTemplate.inputUom || 'KGS',
      outputQty: Number(newTemplate.outputQty) || 1.0,
      outputUom: newTemplate.outputUom || 'KGS',
      yieldRatio: Number(newTemplate.yieldRatio) || 1.0,
      wastagePercent: Number(newTemplate.wastagePercent) || 5.0,
      isActive: true,
      description: newTemplate.description || ''
    };

    setSionTemplates(prev => [...prev, templateToAdd]);
    setIsTemplateModalOpen(false);
    setNewTemplate({
      templateName: '',
      rawMaterialName: '',
      finishedGoodName: '',
      inputQty: 1.0,
      inputUom: 'KGS',
      outputQty: 1.0,
      outputUom: 'KGS',
      yieldRatio: 1.0,
      wastagePercent: 5.0,
      isActive: true
    });
    setNotification({ message: 'New SION Template saved to library!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDeleteTemplate = (id: string) => {
    setSionTemplates(prev => prev.filter(t => t.id !== id));
    setNotification({ message: 'SION Template removed.', type: 'info' });
    setTimeout(() => setNotification(null), 3000);
  };

  // --------------------------------------------------------------------------
  // SECTION C: USER ROLES (RBAC) STATE & HANDLERS
  // --------------------------------------------------------------------------
  const [userRoles, setUserRoles] = useState<UserRole[]>([
    {
      id: 'role-admin',
      roleName: 'System Administrator',
      description: 'Full unconstrained access to all modules, settings, approvals, and deletion rights.',
      userCount: 2,
      canExport: true,
      canApprove: true,
      canDelete: true,
      canGenerateReports: true,
      canConfigureSettings: true,
      modulePermissions: {
        licences: 'admin',
        imports: 'admin',
        exports: 'admin',
        materials: 'admin',
        utilization: 'admin',
        reports: 'admin',
        settings: 'admin'
      }
    },
    {
      id: 'role-manager',
      roleName: 'Senior Export Manager',
      description: 'Operational lead for DGFT licence management, BOE/SB mapping, and report generation.',
      userCount: 5,
      canExport: true,
      canApprove: true,
      canDelete: false,
      canGenerateReports: true,
      canConfigureSettings: false,
      modulePermissions: {
        licences: 'write',
        imports: 'write',
        exports: 'write',
        materials: 'write',
        utilization: 'write',
        reports: 'write',
        settings: 'read'
      }
    },
    {
      id: 'role-dataentry',
      roleName: 'Logistics & Documentation Officer',
      description: 'Data upload and indexing specialist for Bills of Entry and Shipping Bills.',
      userCount: 12,
      canExport: false,
      canApprove: false,
      canDelete: false,
      canGenerateReports: true,
      canConfigureSettings: false,
      modulePermissions: {
        licences: 'read',
        imports: 'write',
        exports: 'write',
        materials: 'read',
        utilization: 'read',
        reports: 'read',
        settings: 'none'
      }
    },
    {
      id: 'role-viewer',
      roleName: 'Compliance Auditor / Viewer',
      description: 'Read-only access for internal audit, financial controllers, and DGFT compliance officers.',
      userCount: 4,
      canExport: true,
      canApprove: false,
      canDelete: false,
      canGenerateReports: true,
      canConfigureSettings: false,
      modulePermissions: {
        licences: 'read',
        imports: 'read',
        exports: 'read',
        materials: 'read',
        utilization: 'read',
        reports: 'read',
        settings: 'none'
      }
    }
  ]);

  const handleToggleCapability = (roleId: string, capKey: keyof Pick<UserRole, 'canExport' | 'canApprove' | 'canDelete' | 'canGenerateReports' | 'canConfigureSettings'>) => {
    setUserRoles(prev => prev.map(role => role.id === roleId ? {
      ...role,
      [capKey]: !role[capKey]
    } : role));
    setNotification({ message: 'Role capability updated.', type: 'info' });
    setTimeout(() => setNotification(null), 2000);
  };

  // --------------------------------------------------------------------------
  // SECTION D: SYSTEM PREFERENCES STATE & HANDLERS
  // --------------------------------------------------------------------------
  const [systemConfig, setSystemConfig] = useState({
    companyName: 'Alok Industries Limited',
    companyCode: 'ALOK-001',
    licensingAuthority: 'CLA MUMBAI / DGFT HQ',
    defaultCurrency: 'INR',
    defaultForexCurrency: 'USD',
    fiscalYearStart: '04-01',
    fiscalYearEnd: '03-31',
    expiryAlertThresholdDays: 30,
    utilizationAlertThresholdPercent: 50,
    overUtilizationThresholdPercent: 100
  });

  const handleSaveSystemConfig = () => {
    setNotification({ message: 'System Configuration Preferences Saved Successfully!', type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-800">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium border transition-all ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          notification.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Info className="w-4 h-4 text-blue-600" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Alok Industries ALMS</span>
              <span className="text-slate-300">•</span>
              <span className="text-xs text-slate-500">System Preferences & Master Control</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">Settings & Configuration</h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Configure Customs Forex exchange rates, maintain DGFT SION norm templates, manage User Roles (RBAC), and define global alert parameters.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Lock className="w-3.5 h-3.5" /> Admin Privileges Enabled
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white px-3 pt-2 rounded-t-xl">
        <button
          onClick={() => setActiveTab('forex')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'forex'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Exchange Rate Management</span>
        </button>

        <button
          onClick={() => setActiveTab('sion')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'sion'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>SION Templates Library</span>
          <span className="ml-1 text-[11px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-full">
            {sionTemplates.length} Norms
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Role-Based Access (RBAC)</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'system'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>System Configuration</span>
        </button>
      </div>

      {/* SECTION A: FOREX EXCHANGE RATES */}
      {activeTab === 'forex' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Customs & RBI Foreign Exchange Reference Rates (INR Equivalent)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized conversion rates used for duty savings, CIF import calculations, and FOB export valuation.
              </p>
            </div>
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-md font-semibold border border-blue-200">
              Live Rate Engine Active
            </span>
          </div>

          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="p-3">Currency</th>
                  <th className="p-3">Import Customs Rate (INR)</th>
                  <th className="p-3">Export Customs Rate (INR)</th>
                  <th className="p-3">RBI Ref Rate (INR)</th>
                  <th className="p-3">Effective Date</th>
                  <th className="p-3">Last Updated By</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exchangeRates.map((rate) => {
                  const isEditing = editingRateId === rate.id;
                  return (
                    <tr key={rate.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs border border-blue-100">
                            {rate.currency}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900">{rate.currency}</div>
                            <div className="text-[10px] text-slate-400">{rate.currencyName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editRateForm.importRateInr || ''}
                            onChange={(e) => setEditRateForm({ ...editRateForm, importRateInr: parseFloat(e.target.value) })}
                            className="w-24 text-xs font-semibold bg-white border border-blue-500 rounded px-2 py-1 focus:outline-none"
                          />
                        ) : (
                          <span className="font-bold text-slate-900">₹{rate.importRateInr.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editRateForm.exportRateInr || ''}
                            onChange={(e) => setEditRateForm({ ...editRateForm, exportRateInr: parseFloat(e.target.value) })}
                            className="w-24 text-xs font-semibold bg-white border border-blue-500 rounded px-2 py-1 focus:outline-none"
                          />
                        ) : (
                          <span className="font-bold text-emerald-700">₹{rate.exportRateInr.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="p-3">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editRateForm.rbiReferenceRateInr || ''}
                            onChange={(e) => setEditRateForm({ ...editRateForm, rbiReferenceRateInr: parseFloat(e.target.value) })}
                            className="w-24 text-xs font-semibold bg-white border border-blue-500 rounded px-2 py-1 focus:outline-none"
                          />
                        ) : (
                          <span className="text-slate-600 font-medium">₹{rate.rbiReferenceRateInr.toFixed(2)}</span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-slate-500">{rate.effectiveDate}</td>
                      <td className="p-3 text-slate-500">{rate.lastUpdatedBy}</td>

                      <td className="p-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleSaveRate(rate.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-md transition-colors"
                              title="Save Rate"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingRateId(null)}
                              className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-1.5 rounded-md transition-colors"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEditRate(rate)}
                            className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md transition-colors font-medium text-[11px]"
                          >
                            <Edit2 className="w-3 h-3 text-slate-500" />
                            <span>Edit Rate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION B: SION TEMPLATES LIBRARY */}
      {activeTab === 'sion' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                DGFT Standard Input-Output Norms (SION) Master Templates
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-configured input-to-output consumption ratios for Alok textile products (Cotton, Polyester, Terry Towels).
              </p>
            </div>

            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-3.5 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New SION Template</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sionTemplates.map((template) => (
              <div key={template.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      SION Norm
                    </span>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{template.templateName}</h4>
                  <p className="text-xs text-slate-500 mt-1">{template.description}</p>

                  <div className="mt-4 space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Raw Material:</span>
                      <span className="font-semibold text-slate-900">{template.rawMaterialName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Finished Good:</span>
                      <span className="font-semibold text-slate-900">{template.finishedGoodName}</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                      <span className="text-slate-500">Yield Ratio:</span>
                      <span className="font-bold text-blue-600">{template.inputQty} {template.inputUom} : {template.outputQty} {template.outputUom}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wastage Standard:</span>
                      <span className="font-semibold text-amber-700">{template.wastagePercent}%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active in Master
                  </span>
                  <span>Alok Standard</span>
                </div>
              </div>
            ))}
          </div>

          {/* Modal for Adding New SION Template */}
          {isTemplateModalOpen && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-lg w-full border border-slate-200 p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-base">Create SION Norm Template</h3>
                  <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Template Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Cotton Yarn Weaving Norm"
                      value={newTemplate.templateName || ''}
                      onChange={(e) => setNewTemplate({ ...newTemplate, templateName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Raw Material Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Raw Cotton Fibre"
                      value={newTemplate.rawMaterialName || ''}
                      onChange={(e) => setNewTemplate({ ...newTemplate, rawMaterialName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Finished Good Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Cotton Grey Fabric"
                      value={newTemplate.finishedGoodName || ''}
                      onChange={(e) => setNewTemplate({ ...newTemplate, finishedGoodName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Input Qty & UOM</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={newTemplate.inputQty || 1.0}
                          onChange={(e) => setNewTemplate({ ...newTemplate, inputQty: parseFloat(e.target.value) })}
                          className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-center"
                        />
                        <input
                          type="text"
                          value={newTemplate.inputUom || 'KGS'}
                          onChange={(e) => setNewTemplate({ ...newTemplate, inputUom: e.target.value })}
                          className="w-1/2 bg-slate-50 border border-slate-300 rounded-lg px-2 py-2 text-center uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Wastage %</label>
                      <input
                        type="number"
                        step="0.1"
                        value={newTemplate.wastagePercent || 5.0}
                        onChange={(e) => setNewTemplate({ ...newTemplate, wastagePercent: parseFloat(e.target.value) })}
                        className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Description / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="DGFT reference details..."
                      value={newTemplate.description || ''}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    onClick={() => setIsTemplateModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNewTemplate}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION C: ROLE-BASED ACCESS CONTROL (RBAC) */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-xs">
            <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Role-Based Access Control (RBAC) & Security Permissions
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Granular access control matrix governing user permissions across Alok Industries ALMS modules.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userRoles.map((role) => (
              <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      {role.roleName}
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                        {role.userCount} Users
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Functional Capabilities</div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={role.canExport}
                        onChange={() => handleToggleCapability(role.id, 'canExport')}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Export Reports (PDF/CSV)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={role.canApprove}
                        onChange={() => handleToggleCapability(role.id, 'canApprove')}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Approve BOE / SB Mapping</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={role.canDelete}
                        onChange={() => handleToggleCapability(role.id, 'canDelete')}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Delete Master Records</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={role.canConfigureSettings}
                        onChange={() => handleToggleCapability(role.id, 'canConfigureSettings')}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Configure Settings</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100">
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Security Enforced
                  </span>
                  <span>Role ID: {role.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION D: SYSTEM CONFIGURATION */}
      {activeTab === 'system' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Global System Preferences & Alert Thresholds
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Central corporate configuration for company branding, fiscal calendars, and compliance triggers.
              </p>
            </div>

            <button
              onClick={handleSaveSystemConfig}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 px-4 rounded-lg transition-colors shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save System Settings</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Corporate Profile */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Corporate Entity Profile
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={systemConfig.companyName}
                    onChange={(e) => setSystemConfig({ ...systemConfig, companyName: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Company Code / Entity ID</label>
                  <input
                    type="text"
                    value={systemConfig.companyCode}
                    onChange={(e) => setSystemConfig({ ...systemConfig, companyCode: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Primary DGFT Licensing Authority</label>
                  <input
                    type="text"
                    value={systemConfig.licensingAuthority}
                    onChange={(e) => setSystemConfig({ ...systemConfig, licensingAuthority: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Alert Thresholds */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Compliance & Expiry Alert Thresholds
              </h4>

              <div className="space-y-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Expiry Alert Threshold (Days)</label>
                  <input
                    type="number"
                    value={systemConfig.expiryAlertThresholdDays}
                    onChange={(e) => setSystemConfig({ ...systemConfig, expiryAlertThresholdDays: parseInt(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-blue-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Triggers dashboard ticker when licence expiry &lt; N days.</p>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Under-Utilization Warning Threshold (%)</label>
                  <input
                    type="number"
                    value={systemConfig.utilizationAlertThresholdPercent}
                    onChange={(e) => setSystemConfig({ ...systemConfig, utilizationAlertThresholdPercent: parseInt(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Over-Utilization Cap Threshold (%)</label>
                  <input
                    type="number"
                    value={systemConfig.overUtilizationThresholdPercent}
                    onChange={(e) => setSystemConfig({ ...systemConfig, overUtilizationThresholdPercent: parseInt(e.target.value) })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 font-semibold text-purple-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

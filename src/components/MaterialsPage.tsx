import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Layers,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  FileText,
  TrendingUp,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Calculator,
  RefreshCw,
  X,
  ExternalLink,
  ChevronDown,
  Info,
  Sparkles
} from 'lucide-react';
import {
  RawMaterial,
  FinishedGood,
  SionNorm,
  MaterialType,
  HsCodeItem,
  MaterialSpecification
} from '../types';

type ActiveTab = 'materials' | 'sion';
type MaterialSubFilter = 'all' | 'raw' | 'finished' | 'scomet';

export const MaterialsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('materials');
  const [materialSubFilter, setMaterialSubFilter] = useState<MaterialSubFilter>('all');
  
  // Data States
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [sionNorms, setSionNorms] = useState<SionNorm[]>([]);
  const [hsCodes, setHsCodes] = useState<HsCodeItem[]>([]);
  const [summary, setSummary] = useState<{
    totalMaterials: number;
    totalProducts: number;
    activeSionNorms: number;
    scometItemsCount: number;
    chemicalsCount: number;
    componentsCount: number;
    consumablesCount: number;
    catalystsCount: number;
  }>({
    totalMaterials: 0,
    totalProducts: 0,
    activeSionNorms: 0,
    scometItemsCount: 0,
    chemicalsCount: 0,
    componentsCount: 0,
    consumablesCount: 0,
    catalystsCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [selectedSionStatusFilter, setSelectedSionStatusFilter] = useState<string>('All');

  // Modal States
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);
  const [editingRawMaterial, setEditingRawMaterial] = useState<RawMaterial | null>(null);
  
  const [isFgModalOpen, setIsFgModalOpen] = useState(false);
  const [editingFinishedGood, setEditingFinishedGood] = useState<FinishedGood | null>(null);

  const [isSionModalOpen, setIsSionModalOpen] = useState(false);
  const [editingSionNorm, setEditingSionNorm] = useState<SionNorm | null>(null);

  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  // SION Yield Calculator Sandbox State
  const [calcSionId, setCalcSionId] = useState<string>('');
  const [calcInputQty, setCalcInputQty] = useState<number>(100);

  // Form States for Raw Material Modal
  const [rawForm, setRawForm] = useState<{
    materialCode: string;
    materialName: string;
    hsCode: string;
    hsDescription: string;
    materialType: MaterialType;
    uom: string;
    cifValuePerUnit: number;
    importCurrency: string;
    isScomet: boolean;
    scometCategory: string;
    scometControlReason: string;
    description: string;
    notes: string;
    specifications: { specificationName: string; specificationValue: string; specificationUnit: string }[];
  }>({
    materialCode: '',
    materialName: '',
    hsCode: '',
    hsDescription: '',
    materialType: 'Chemical',
    uom: 'Kgs',
    cifValuePerUnit: 0,
    importCurrency: 'USD',
    isScomet: false,
    scometCategory: '',
    scometControlReason: '',
    description: '',
    notes: '',
    specifications: [],
  });

  // Form States for Finished Good Modal
  const [fgForm, setFgForm] = useState<{
    productCode: string;
    productName: string;
    hsCode: string;
    hsDescription: string;
    uom: string;
    description: string;
    isExportObligationItem: boolean;
    notes: string;
  }>({
    productCode: '',
    productName: '',
    hsCode: '',
    hsDescription: '',
    uom: 'Kgs',
    description: '',
    isExportObligationItem: true,
    notes: '',
  });

  // Form States for SION Norm Modal
  const [sionForm, setSionForm] = useState<{
    sionCode: string;
    rawMaterialId: string;
    finishedGoodId: string;
    inputQuantity: number;
    inputUom: string;
    outputQuantity: number;
    outputUom: string;
    wastagePercent: number;
    dgftNotificationDate: string;
    effectiveFrom: string;
    effectiveTo: string;
    notes: string;
  }>({
    sionCode: '',
    rawMaterialId: '',
    finishedGoodId: '',
    inputQuantity: 1,
    inputUom: 'Kgs',
    outputQuantity: 1,
    outputUom: 'Kgs',
    wastagePercent: 0,
    dgftNotificationDate: '',
    effectiveFrom: '',
    effectiveTo: '',
    notes: '',
  });

  // Fetch all initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [rmRes, fgRes, snRes, hsRes, sumRes] = await Promise.all([
        fetch('/api/raw-materials?limit=all').then((r) => r.json()),
        fetch('/api/finished-goods?limit=all').then((r) => r.json()),
        fetch('/api/sion-norms?limit=all').then((r) => r.json()),
        fetch('/api/hs-codes').then((r) => r.json()),
        fetch('/api/materials/summary').then((r) => r.json()),
      ]);

      if (rmRes.success && Array.isArray(rmRes.data)) setRawMaterials(rmRes.data);
      if (fgRes.success && Array.isArray(fgRes.data)) setFinishedGoods(fgRes.data);
      if (snRes.success && Array.isArray(snRes.data)) setSionNorms(snRes.data);
      if (hsRes.success && Array.isArray(hsRes.data)) setHsCodes(hsRes.data);
      if (sumRes.success && sumRes.summary) setSummary(sumRes.summary);
    } catch (err) {
      console.error('Failed to load materials data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Set default SION in calculator if available
  useEffect(() => {
    if (sionNorms.length > 0 && !calcSionId) {
      setCalcSionId(sionNorms[0].id);
    }
  }, [sionNorms, calcSionId]);

  // Open Add Raw Material Modal
  const openAddRawModal = () => {
    setEditingRawMaterial(null);
    setRawForm({
      materialCode: '',
      materialName: '',
      hsCode: '',
      hsDescription: '',
      materialType: 'Chemical',
      uom: 'Kgs',
      cifValuePerUnit: 0,
      importCurrency: 'USD',
      isScomet: false,
      scometCategory: '',
      scometControlReason: '',
      description: '',
      notes: '',
      specifications: [{ specificationName: 'Purity', specificationValue: '99.5%', specificationUnit: '%' }],
    });
    setIsRawModalOpen(true);
  };

  // Open Edit Raw Material Modal
  const openEditRawModal = (item: RawMaterial) => {
    setEditingRawMaterial(item);
    setRawForm({
      materialCode: item.materialCode,
      materialName: item.materialName,
      hsCode: item.hsCode,
      hsDescription: item.hsDescription || '',
      materialType: item.materialType,
      uom: item.uom,
      cifValuePerUnit: item.cifValuePerUnit || 0,
      importCurrency: item.importCurrency || 'USD',
      isScomet: item.isScomet,
      scometCategory: item.scometCategory || '',
      scometControlReason: item.scometControlReason || '',
      description: item.description || '',
      notes: item.notes || '',
      specifications: item.specifications
        ? item.specifications.map((s) => ({
            specificationName: s.specificationName,
            specificationValue: s.specificationValue,
            specificationUnit: s.specificationUnit || '',
          }))
        : [],
    });
    setIsRawModalOpen(true);
  };

  // Open Add Finished Good Modal
  const openAddFgModal = () => {
    setEditingFinishedGood(null);
    setFgForm({
      productCode: '',
      productName: '',
      hsCode: '',
      hsDescription: '',
      uom: 'Kgs',
      description: '',
      isExportObligationItem: true,
      notes: '',
    });
    setIsFgModalOpen(true);
  };

  // Open Edit Finished Good Modal
  const openEditFgModal = (item: FinishedGood) => {
    setEditingFinishedGood(item);
    setFgForm({
      productCode: item.productCode,
      productName: item.productName,
      hsCode: item.hsCode,
      hsDescription: item.hsDescription || '',
      uom: item.uom,
      description: item.description || '',
      isExportObligationItem: item.isExportObligationItem,
      notes: item.notes || '',
    });
    setIsFgModalOpen(true);
  };

  // Open Add SION Norm Modal
  const openAddSionModal = () => {
    setEditingSionNorm(null);
    setSionForm({
      sionCode: '',
      rawMaterialId: rawMaterials[0]?.id || '',
      finishedGoodId: finishedGoods[0]?.id || '',
      inputQuantity: 1.0,
      inputUom: rawMaterials[0]?.uom || 'Kgs',
      outputQuantity: 1.2,
      outputUom: finishedGoods[0]?.uom || 'Kgs',
      wastagePercent: 2.0,
      dgftNotificationDate: new Date().toISOString().split('T')[0],
      effectiveFrom: new Date().toISOString().split('T')[0],
      effectiveTo: '',
      notes: '',
    });
    setIsSionModalOpen(true);
  };

  // Open Edit SION Norm Modal
  const openEditSionNorm = (item: SionNorm) => {
    setEditingSionNorm(item);
    setSionForm({
      sionCode: item.sionCode,
      rawMaterialId: item.rawMaterialId,
      finishedGoodId: item.finishedGoodId,
      inputQuantity: item.inputQuantity,
      inputUom: item.inputUom,
      outputQuantity: item.outputQuantity,
      outputUom: item.outputUom,
      wastagePercent: item.wastagePercent || 0,
      dgftNotificationDate: item.dgftNotificationDate || '',
      effectiveFrom: item.effectiveFrom || '',
      effectiveTo: item.effectiveTo || '',
      notes: item.notes || '',
    });
    setIsSionModalOpen(true);
  };

  // Handle HS code selection for Raw Material
  const handleRawHsSelect = (selectedHs: string) => {
    const found = hsCodes.find((h) => h.hsCode === selectedHs);
    setRawForm((prev) => ({
      ...prev,
      hsCode: selectedHs,
      hsDescription: found ? found.description : prev.hsDescription,
    }));
  };

  // Handle HS code selection for Finished Good
  const handleFgHsSelect = (selectedHs: string) => {
    const found = hsCodes.find((h) => h.hsCode === selectedHs);
    setFgForm((prev) => ({
      ...prev,
      hsCode: selectedHs,
      hsDescription: found ? found.description : prev.hsDescription,
    }));
  };

  // Save Raw Material
  const handleSaveRawMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingRawMaterial ? `/api/raw-materials/${editingRawMaterial.id}` : '/api/raw-materials';
      const method = editingRawMaterial ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rawForm),
      });
      const data = await res.json();

      if (data.success) {
        setIsRawModalOpen(false);
        fetchData();
      } else {
        alert(`Error saving raw material: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to server');
    }
  };

  // Delete Raw Material
  const handleDeleteRawMaterial = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete raw material ${code}? Any associated SION norms will also be removed.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/raw-materials/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Finished Good
  const handleSaveFinishedGood = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingFinishedGood ? `/api/finished-goods/${editingFinishedGood.id}` : '/api/finished-goods';
      const method = editingFinishedGood ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fgForm),
      });
      const data = await res.json();

      if (data.success) {
        setIsFgModalOpen(false);
        fetchData();
      } else {
        alert(`Error saving finished good: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to server');
    }
  };

  // Delete Finished Good
  const handleDeleteFinishedGood = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete export finished good ${code}? Any associated SION norms will also be removed.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/finished-goods/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save SION Norm
  const handleSaveSionNorm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingSionNorm ? `/api/sion-norms/${editingSionNorm.id}` : '/api/sion-norms';
      const method = editingSionNorm ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sionForm),
      });
      const data = await res.json();

      if (data.success) {
        if (data.warning) {
          alert(`Saved with notice: ${data.warning}`);
        }
        setIsSionModalOpen(false);
        fetchData();
      } else {
        alert(`Error saving SION norm: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to connect to server');
    }
  };

  // Delete SION Norm
  const handleDeleteSionNorm = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to delete SION norm mapping ${code}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/sion-norms/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered Raw Materials
  const filteredRawMaterials = useMemo(() => {
    return rawMaterials.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.materialCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.materialName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hsCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = selectedTypeFilter === 'All' || item.materialType === selectedTypeFilter;
      const matchesSubFilter =
        materialSubFilter === 'all' ||
        materialSubFilter === 'raw' ||
        (materialSubFilter === 'scomet' && item.isScomet);

      return matchesSearch && matchesType && matchesSubFilter;
    });
  }, [rawMaterials, searchTerm, selectedTypeFilter, materialSubFilter]);

  // Filtered Finished Goods
  const filteredFinishedGoods = useMemo(() => {
    if (materialSubFilter === 'raw' || materialSubFilter === 'scomet') return [];
    return finishedGoods.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.hsCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesSearch;
    });
  }, [finishedGoods, searchTerm, materialSubFilter]);

  // Filtered SION Norms
  const filteredSionNorms = useMemo(() => {
    return sionNorms.filter((item) => {
      const matchesSearch =
        searchTerm === '' ||
        item.sionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.rawMaterialName && item.rawMaterialName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.rawMaterialCode && item.rawMaterialCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.finishedGoodName && item.finishedGoodName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.finishedGoodCode && item.finishedGoodCode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        selectedSionStatusFilter === 'All' || item.status === selectedSionStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sionNorms, searchTerm, selectedSionStatusFilter]);

  // Active SION object for calculator
  const selectedCalcSion = useMemo(() => {
    return sionNorms.find((s) => s.id === calcSionId) || sionNorms[0];
  }, [sionNorms, calcSionId]);

  const calcYieldRatio = selectedCalcSion ? selectedCalcSion.yieldRatio : 1.2;
  const calcPermittedOutput = (calcInputQty * calcYieldRatio).toFixed(2);
  const calcWastageAmount = (
    calcInputQty * ((selectedCalcSion?.wastagePercent || 0) / 100)
  ).toFixed(2);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section with summary KPI cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600/10 rounded-xl text-blue-600 border border-blue-200">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Materials & SION Norms Master
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Manage DGFT Advance Licence permitted raw inputs, export finished goods, SCOMET restricted lists, and input-output conversion ratios.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="open-calculator-btn"
            onClick={() => setIsCalcModalOpen(true)}
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Calculator className="w-4 h-4 text-slate-500" />
            <span>Yield Ratio Sandbox</span>
          </button>

          {activeTab === 'materials' ? (
            <div className="flex items-center space-x-2">
              <button
                id="add-raw-material-btn"
                onClick={openAddRawModal}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Raw Material</span>
              </button>
              <button
                id="add-finished-good-btn"
                onClick={openAddFgModal}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 text-slate-500" />
                <span>Add Finished Good</span>
              </button>
            </div>
          ) : (
            <button
              id="add-sion-norm-btn"
              onClick={openAddSionModal}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Define SION Norm</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Permitted Raw Materials
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{summary.totalMaterials}</span>
            <span className="text-xs text-slate-500 font-medium">
              {summary.chemicalsCount} Chem · {summary.componentsCount} Comp
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Duty-free input catalog for Advance Licences
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Export Finished Goods
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{summary.totalProducts}</span>
            <span className="text-xs text-emerald-600 font-medium">EO Discharge Master</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Export obligation finished product items
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active SION Norms
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{summary.activeSionNorms}</span>
            <span className="text-xs text-blue-600 font-medium">Yield Ratios Configured</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Standard DGFT input-output conversion rules
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              SCOMET Restricted Goods
            </span>
            <div className={`p-2 rounded-lg ${summary.scometItemsCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{summary.scometItemsCount}</span>
            {summary.scometItemsCount > 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                Special DGFT Review
              </span>
            ) : (
              <span className="text-xs text-slate-500 font-medium">0 Restricted</span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Dual-use chemical & restricted export control
          </div>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-6 pt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex space-x-8">
            <button
              id="tab-materials-master"
              onClick={() => {
                setActiveTab('materials');
                setSearchTerm('');
              }}
              className={`pb-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'materials'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Material Master Catalog</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                {rawMaterials.length + finishedGoods.length}
              </span>
            </button>

            <button
              id="tab-sion-mapping"
              onClick={() => {
                setActiveTab('sion');
                setSearchTerm('');
              }}
              className={`pb-4 text-sm font-semibold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'sion'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>SION Norms Mapping (Input-Output Ratios)</span>
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-600 font-semibold">
                {sionNorms.length}
              </span>
            </button>
          </div>

          {/* Quick Refresh */}
          <button
            onClick={fetchData}
            disabled={loading}
            title="Refresh list"
            className="mb-3 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative min-w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  activeTab === 'materials'
                    ? 'Search by code, item name, HS code...'
                    : 'Search by SION norm code, item names...'
                }
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sub-Filters for Material Catalog */}
            {activeTab === 'materials' && (
              <div className="flex items-center p-0.5 bg-slate-200/70 rounded-lg text-xs font-medium text-slate-600">
                <button
                  onClick={() => setMaterialSubFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    materialSubFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  All Items ({rawMaterials.length + finishedGoods.length})
                </button>
                <button
                  onClick={() => setMaterialSubFilter('raw')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    materialSubFilter === 'raw' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Import Raw Materials ({rawMaterials.length})
                </button>
                <button
                  onClick={() => setMaterialSubFilter('finished')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    materialSubFilter === 'finished' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'hover:text-slate-900'
                  }`}
                >
                  Export Finished Goods ({finishedGoods.length})
                </button>
                <button
                  onClick={() => setMaterialSubFilter('scomet')}
                  className={`px-3 py-1 rounded-md flex items-center space-x-1 transition-colors ${
                    materialSubFilter === 'scomet' ? 'bg-amber-100 text-amber-900 shadow-xs font-semibold' : 'text-amber-700 hover:text-amber-900'
                  }`}
                >
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  <span>SCOMET ({summary.scometItemsCount})</span>
                </button>
              </div>
            )}

            {/* Material Type Dropdown for Raw Materials */}
            {activeTab === 'materials' && materialSubFilter !== 'finished' && (
              <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                <span>Type:</span>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Categories</option>
                  <option value="Chemical">Chemical</option>
                  <option value="Component">Component</option>
                  <option value="Consumable">Consumable</option>
                  <option value="Catalyst">Catalyst</option>
                  <option value="Packaging">Packaging</option>
                </select>
              </div>
            )}

            {/* SION Status Filter */}
            {activeTab === 'sion' && (
              <div className="flex items-center space-x-1.5 text-xs text-slate-600">
                <span>Status:</span>
                <select
                  value={selectedSionStatusFilter}
                  onChange={(e) => setSelectedSionStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="All">All Norms</option>
                  <option value="Active">Active</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span>
              {activeTab === 'materials'
                ? `Showing ${filteredRawMaterials.length + filteredFinishedGoods.length} items`
                : `Showing ${filteredSionNorms.length} SION norm mappings`}
            </span>
          </div>
        </div>

        {/* TAB 1 CONTENT: MATERIALS MASTER TABLE */}
        {activeTab === 'materials' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Item Code & Name</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">ITC (HS) Code</th>
                  <th className="py-3 px-4">UOM</th>
                  <th className="py-3 px-4">CIF Value / Details</th>
                  <th className="py-3 px-4">SCOMET / Compliance</th>
                  <th className="py-3 px-4">Linked SIONs</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {/* Permitted Raw Materials */}
                {filteredRawMaterials.map((item) => (
                  <tr key={`rm-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center space-x-2">
                        <span>{item.materialCode}</span>
                        {item.isScomet && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            SCOMET
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">{item.materialName}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {item.materialType}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">Permitted Import</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-800">{item.hsCode}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]" title={item.hsDescription}>
                        {item.hsDescription || '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-medium text-slate-700">{item.uom}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900">
                        {item.cifValuePerUnit ? `${item.importCurrency || 'USD'} ${item.cifValuePerUnit.toFixed(2)}` : '—'}
                      </div>
                      {item.specifications && item.specifications.length > 0 && (
                        <div className="text-[11px] text-slate-500">
                          {item.specifications.length} tech spec{item.specifications.length > 1 ? 's' : ''}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {item.isScomet ? (
                        <div>
                          <div className="text-xs font-semibold text-amber-700 flex items-center space-x-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Cat: {item.scometCategory || '2A'}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 line-clamp-1" title={item.scometControlReason}>
                            {item.scometControlReason || 'Dual-use export control'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Standard Item</span>
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {item.sionNorms && item.sionNorms.length > 0 ? (
                        <div className="space-y-0.5">
                          {item.sionNorms.slice(0, 2).map((sn) => (
                            <div key={sn.id} className="text-xs flex items-center space-x-1 font-mono text-slate-700">
                              <span className="font-semibold text-blue-600">{sn.sionCode}</span>
                              <span className="text-slate-400">→</span>
                              <span className="text-slate-600 truncate max-w-[90px]">{sn.finishedGoodCode || 'FG'}</span>
                            </div>
                          ))}
                          {item.sionNorms.length > 2 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{item.sionNorms.length - 2} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No SION linked</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditRawModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                          title="Edit Raw Material"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRawMaterial(item.id, item.materialCode)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Raw Material"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Finished Goods Master */}
                {filteredFinishedGoods.map((item) => (
                  <tr key={`fg-${item.id}`} className="hover:bg-slate-50/80 transition-colors bg-emerald-50/20">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 flex items-center space-x-2">
                        <span>{item.productCode}</span>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Finished Good
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-medium">{item.productName}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-400 line-clamp-1">{item.description}</div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        Export Obligation
                      </span>
                      <div className="text-[11px] text-slate-400 mt-0.5">Fulfillment Item</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-800">{item.hsCode}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 max-w-[200px]" title={item.hsDescription}>
                        {item.hsDescription || '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-medium text-slate-700">{item.uom}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs text-slate-500">Export Goods Master</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs text-emerald-600 flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Permitted Export</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {item.sionNorms && item.sionNorms.length > 0 ? (
                        <div className="space-y-0.5">
                          {item.sionNorms.slice(0, 2).map((sn) => (
                            <div key={sn.id} className="text-xs flex items-center space-x-1 font-mono text-slate-700">
                              <span className="font-semibold text-blue-600">{sn.sionCode}</span>
                              <span className="text-slate-400">←</span>
                              <span className="text-slate-600 truncate max-w-[90px]">{sn.rawMaterialCode || 'Raw'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No SION linked</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => openEditFgModal(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                          title="Edit Finished Good"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFinishedGood(item.id, item.productCode)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete Finished Good"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRawMaterials.length === 0 && filteredFinishedGoods.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No materials or items found</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {searchTerm ? 'Try adjusting your search criteria' : 'Click "Add Raw Material" above to define permitted duty-free inputs.'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2 CONTENT: SION NORMS MAPPING TABLE */}
        {activeTab === 'sion' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">SION Code & Status</th>
                  <th className="py-3 px-4">Permitted Raw Input (Import)</th>
                  <th className="py-3 px-4">Export Finished Good</th>
                  <th className="py-3 px-4">Norm Ratio (In → Out)</th>
                  <th className="py-3 px-4">Yield Ratio</th>
                  <th className="py-3 px-4">Permitted Wastage %</th>
                  <th className="py-3 px-4">DGFT Validity Period</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSionNorms.map((item) => (
                  <tr key={`sion-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900 flex items-center space-x-2">
                        <span>{item.sionCode}</span>
                      </div>
                      <div className="mt-1">
                        {item.status === 'Active' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Active DGFT Norm
                          </span>
                        )}
                        {item.status === 'Expired' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            Expired Norm
                          </span>
                        )}
                        {item.status === 'Upcoming' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Upcoming
                          </span>
                        )}
                      </div>
                      {item.notes && <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{item.notes}</div>}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {item.rawMaterialName || item.rawMaterialCode || 'Raw Material'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {item.rawMaterialCode} · HS: {item.rawMaterialHsCode || '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">
                        {item.finishedGoodName || item.finishedGoodCode || 'Finished Good'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {item.finishedGoodCode} · HS: {item.finishedGoodHsCode || '—'}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {item.inputQuantity} {item.inputUom} → {item.outputQuantity} {item.outputUom}
                      </div>
                      <div className="text-[11px] text-slate-400">DGFT standard norm</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {Number(item.yieldRatio).toFixed(4)}x
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        1 {item.inputUom} raw = {Number(item.yieldRatio).toFixed(2)} {item.outputUom} FG
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold text-slate-700">
                        {item.wastagePercent ? `${item.wastagePercent}%` : '0%'}
                      </span>
                      <div className="text-[11px] text-slate-400">Max allowable loss</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-800 font-medium">
                        {item.effectiveFrom || 'Inception'}
                        <span className="text-slate-400 mx-1">to</span>
                        {item.effectiveTo || 'Indefinite'}
                      </div>
                      {item.dgftNotificationDate && (
                        <div className="text-[11px] text-slate-400">
                          Notif: {item.dgftNotificationDate}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setCalcSionId(item.id);
                            setIsCalcModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 rounded hover:bg-slate-100 transition-colors"
                          title="Simulate Yield Ratio"
                        >
                          <Calculator className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditSionNorm(item)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 transition-colors"
                          title="Edit SION Norm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSionNorm(item.id, item.sionCode)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition-colors"
                          title="Delete SION Norm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSionNorms.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <TrendingUp className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No SION Norm mappings defined</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Click &quot;Define SION Norm&quot; above to specify input-output conversion ratios for Advance Licences.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT RAW MATERIAL */}
      {isRawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingRawMaterial ? 'Edit Permitted Raw Material' : 'Add Permitted Raw Material (Import)'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input raw materials permitted for duty-free importation under Advance Licences.
                </p>
              </div>
              <button
                onClick={() => setIsRawModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRawMaterial} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Material Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Material Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rawForm.materialCode}
                    onChange={(e) => setRawForm({ ...rawForm, materialCode: e.target.value })}
                    placeholder="e.g. MAT-ADDITIVE-MB"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-mono"
                  />
                </div>

                {/* Material Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Material Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rawForm.materialName}
                    onChange={(e) => setRawForm({ ...rawForm, materialName: e.target.value })}
                    placeholder="e.g. Additive MB Textile Auxiliary"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* ITC HS Code Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    ITC (HS) Code <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      list="hs-code-list"
                      value={rawForm.hsCode}
                      onChange={(e) => handleRawHsSelect(e.target.value)}
                      placeholder="e.g. 3809.10.10"
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                    <datalist id="hs-code-list">
                      {hsCodes.map((h) => (
                        <option key={h.id} value={h.hsCode}>
                          {h.hsCode} - {h.description}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Material Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Material Type / Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={rawForm.materialType}
                    onChange={(e) => setRawForm({ ...rawForm, materialType: e.target.value as MaterialType })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Chemical">Chemical</option>
                    <option value="Component">Component</option>
                    <option value="Consumable">Consumable</option>
                    <option value="Catalyst">Catalyst</option>
                    <option value="Packaging">Packaging</option>
                  </select>
                </div>

                {/* UOM */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Unit of Measure (UOM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={rawForm.uom}
                    onChange={(e) => setRawForm({ ...rawForm, uom: e.target.value })}
                    placeholder="e.g. Kgs, MT, Liters, Nos"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* CIF Value per Unit */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Avg CIF Import Value per Unit
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={rawForm.importCurrency}
                      onChange={(e) => setRawForm({ ...rawForm, importCurrency: e.target.value })}
                      className="w-24 px-2 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="INR">INR (₹)</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rawForm.cifValuePerUnit || ''}
                      onChange={(e) => setRawForm({ ...rawForm, cifValuePerUnit: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="flex-1 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* HS Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  ITC Customs Description
                </label>
                <input
                  type="text"
                  value={rawForm.hsDescription}
                  onChange={(e) => setRawForm({ ...rawForm, hsDescription: e.target.value })}
                  placeholder="Official customs tariff description..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* SCOMET Flag and Details */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <div>
                      <span className="text-sm font-bold text-amber-900">
                        SCOMET Dual-Use Classification
                      </span>
                      <p className="text-xs text-amber-700">
                        Special Chemical, Biological, Nuclear or Dual-Use restricted materials requiring DGFT End-User verification.
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rawForm.isScomet}
                      onChange={(e) => setRawForm({ ...rawForm, isScomet: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {rawForm.isScomet && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-amber-200">
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        SCOMET Category Code
                      </label>
                      <input
                        type="text"
                        value={rawForm.scometCategory}
                        onChange={(e) => setRawForm({ ...rawForm, scometCategory: e.target.value })}
                        placeholder="e.g. Category 2A (Chemicals)"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-amber-900 mb-1">
                        Control Reason / Stipulation
                      </label>
                      <input
                        type="text"
                        value={rawForm.scometControlReason}
                        onChange={(e) => setRawForm({ ...rawForm, scometControlReason: e.target.value })}
                        placeholder="e.g. Precursor chemical verification"
                        className="w-full px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-lg focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Technical Specifications */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700 uppercase">
                    Technical Specifications
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setRawForm({
                        ...rawForm,
                        specifications: [
                          ...rawForm.specifications,
                          { specificationName: '', specificationValue: '', specificationUnit: '' },
                        ],
                      })
                    }
                    className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Spec</span>
                  </button>
                </div>

                {rawForm.specifications.map((spec, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Spec Name (e.g. Purity)"
                      value={spec.specificationName}
                      onChange={(e) => {
                        const updated = [...rawForm.specifications];
                        updated[index].specificationName = e.target.value;
                        setRawForm({ ...rawForm, specifications: updated });
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 99.5%)"
                      value={spec.specificationValue}
                      onChange={(e) => {
                        const updated = [...rawForm.specifications];
                        updated[index].specificationValue = e.target.value;
                        setRawForm({ ...rawForm, specifications: updated });
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = rawForm.specifications.filter((_, i) => i !== index);
                        setRawForm({ ...rawForm, specifications: updated });
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Compliance / DGFT Notes
                </label>
                <textarea
                  rows={2}
                  value={rawForm.notes}
                  onChange={(e) => setRawForm({ ...rawForm, notes: e.target.value })}
                  placeholder="Special DGFT conditions or actual user stipulation..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsRawModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingRawMaterial ? 'Update Raw Material' : 'Save Raw Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT FINISHED GOOD */}
      {isFgModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingFinishedGood ? 'Edit Export Finished Good' : 'Add Export Finished Good'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export goods used for discharging Export Obligations (EO) under Advance Licences.
                </p>
              </div>
              <button
                onClick={() => setIsFgModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFinishedGood} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Product Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fgForm.productCode}
                  onChange={(e) => setFgForm({ ...fgForm, productCode: e.target.value })}
                  placeholder="e.g. FG-TEX-POLY-01"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={fgForm.productName}
                  onChange={(e) => setFgForm({ ...fgForm, productName: e.target.value })}
                  placeholder="e.g. 100% Dyed Polyester Fabric"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    ITC (HS) Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    list="hs-code-list-fg"
                    value={fgForm.hsCode}
                    onChange={(e) => handleFgHsSelect(e.target.value)}
                    placeholder="e.g. 5208.11.90"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                  />
                  <datalist id="hs-code-list-fg">
                    {hsCodes.map((h) => (
                      <option key={h.id} value={h.hsCode}>
                        {h.hsCode} - {h.description}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Unit of Measure (UOM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fgForm.uom}
                    onChange={(e) => setFgForm({ ...fgForm, uom: e.target.value })}
                    placeholder="e.g. Kgs, MT, Meters, Nos"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  ITC Customs Description
                </label>
                <input
                  type="text"
                  value={fgForm.hsDescription}
                  onChange={(e) => setFgForm({ ...fgForm, hsDescription: e.target.value })}
                  placeholder="Official customs tariff description..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description / Specification
                </label>
                <textarea
                  rows={2}
                  value={fgForm.description}
                  onChange={(e) => setFgForm({ ...fgForm, description: e.target.value })}
                  placeholder="Product specifications, weave structure, GSM..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFgModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingFinishedGood ? 'Update Finished Good' : 'Save Finished Good'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SION NORM */}
      {isSionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingSionNorm ? 'Edit SION Norm Mapping' : 'Define Standard Input-Output Norm (SION)'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  DGFT mandated conversion ratio mapping imported raw materials into export goods.
                </p>
              </div>
              <button
                onClick={() => setIsSionModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSionNorm} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  SION Norm Code / DGFT Ref <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sionForm.sionCode}
                  onChange={(e) => setSionForm({ ...sionForm, sionCode: e.target.value })}
                  placeholder="e.g. SION-CH-401 or DGFT SION 62/2023"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 uppercase font-mono"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Select Raw Material */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Permitted Raw Material (Input) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={sionForm.rawMaterialId}
                    onChange={(e) => {
                      const selected = rawMaterials.find((r) => r.id === e.target.value);
                      setSionForm({
                        ...sionForm,
                        rawMaterialId: e.target.value,
                        inputUom: selected?.uom || sionForm.inputUom,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select Raw Material...</option>
                    {rawMaterials.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.materialCode} - {r.materialName} ({r.uom})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Select Finished Good */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Export Finished Good (Output) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={sionForm.finishedGoodId}
                    onChange={(e) => {
                      const selected = finishedGoods.find((f) => f.id === e.target.value);
                      setSionForm({
                        ...sionForm,
                        finishedGoodId: e.target.value,
                        outputUom: selected?.uom || sionForm.outputUom,
                      });
                    }}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">Select Finished Good...</option>
                    {finishedGoods.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.productCode} - {f.productName} ({f.uom})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Quantities & Live Yield Ratio preview */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Standard Input-to-Output Conversion Ratio
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">
                      Input Quantity ({sionForm.inputUom})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      value={sionForm.inputQuantity}
                      onChange={(e) => setSionForm({ ...sionForm, inputQuantity: parseFloat(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-800 mb-1">
                      Export Output Quantity ({sionForm.outputUom})
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      required
                      value={sionForm.outputQuantity}
                      onChange={(e) => setSionForm({ ...sionForm, outputQuantity: parseFloat(e.target.value) || 1 })}
                      className="w-full px-3 py-2 text-sm bg-white border border-blue-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Auto Calculated Yield Ratio */}
                <div className="pt-2 border-t border-blue-200 flex items-center justify-between">
                  <div className="text-xs text-blue-800">
                    Calculated Yield Ratio (<code className="font-mono">Output ÷ Input</code>):
                  </div>
                  <div className="text-base font-bold font-mono text-blue-700 bg-white px-3 py-1 rounded-lg border border-blue-300 shadow-xs">
                    {(sionForm.outputQuantity / (sionForm.inputQuantity || 1)).toFixed(4)}x
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Permitted Wastage % */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Permitted Wastage (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={sionForm.wastagePercent}
                    onChange={(e) => setSionForm({ ...sionForm, wastagePercent: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 2.5%"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Effective From */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Effective From
                  </label>
                  <input
                    type="date"
                    value={sionForm.effectiveFrom}
                    onChange={(e) => setSionForm({ ...sionForm, effectiveFrom: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                {/* Effective To */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Effective To (Expiry)
                  </label>
                  <input
                    type="date"
                    value={sionForm.effectiveTo}
                    onChange={(e) => setSionForm({ ...sionForm, effectiveTo: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  DGFT Gazette / Policy Circular Notes
                </label>
                <textarea
                  rows={2}
                  value={sionForm.notes}
                  onChange={(e) => setSionForm({ ...sionForm, notes: e.target.value })}
                  placeholder="e.g. Public Notice No. 42/2023 dated 15-Nov-2023..."
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSionModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                >
                  {editingSionNorm ? 'Update SION Norm' : 'Save SION Norm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SION YIELD RATIO SANDBOX / CALCULATOR */}
      {isCalcModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">SION Yield Ratio Calculator</h3>
                  <p className="text-xs text-slate-500">
                    Verify duty-free input consumption against mandatory export output requirements.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCalcModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Select SION Norm */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select SION Norm Rule
                </label>
                <select
                  value={calcSionId}
                  onChange={(e) => setCalcSionId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  {sionNorms.map((sn) => (
                    <option key={sn.id} value={sn.id}>
                      {sn.sionCode} ({sn.rawMaterialCode} → {sn.finishedGoodCode}) [Yield: {Number(sn.yieldRatio).toFixed(2)}x]
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Quantity Slider / Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase">
                    Raw Material Consumed ({selectedCalcSion?.inputUom || 'Kgs'})
                  </label>
                  <span className="font-mono text-sm font-bold text-indigo-700">
                    {calcInputQty} {selectedCalcSion?.inputUom || 'Kgs'}
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={calcInputQty}
                  onChange={(e) => setCalcInputQty(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Calculation Output Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xs font-semibold uppercase text-emerald-800">
                    Expected Export Finished Good
                  </div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 mt-2">
                    {calcPermittedOutput}
                  </div>
                  <div className="text-xs text-emerald-600 mt-0.5">
                    {selectedCalcSion?.outputUom || 'Kgs'} of {selectedCalcSion?.finishedGoodName || 'FG'}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-semibold uppercase text-slate-700">
                    Permitted Wastage ({selectedCalcSion?.wastagePercent || 0}%)
                  </div>
                  <div className="text-2xl font-bold font-mono text-slate-800 mt-2">
                    {calcWastageAmount}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {selectedCalcSion?.inputUom || 'Kgs'} process loss allowed
                  </div>
                </div>
              </div>

              {/* DGFT Formula Explanation */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span>DGFT Compliance Formula</span>
                </div>
                <p>
                  <code className="font-mono text-blue-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    Export Output = Raw Consumed × Yield Ratio ({Number(calcYieldRatio).toFixed(4)})
                  </code>
                </p>
                <p className="text-[11px] text-slate-500">
                  Customs auditors enforce that physical exports match or exceed this threshold before issuing the Export Obligation Discharge Certificate (EODC).
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCalcModalOpen(false)}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                >
                  Close Sandbox
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

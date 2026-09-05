import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Zap,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  Info,
  ChevronRight,
  Check,
  X,
  Package,
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  History,
  Sparkles,
  AlertCircle,
  AlertOctagon,
  Plus,
  Trash2,
  ExternalLink,
  Percent,
  CheckCheck
} from 'lucide-react';
import {
  ModuleId,
  LicenceFinderSearchType,
  LicenceRecommendation,
  LicenceFinderSearchResult,
  BulkShipmentItem,
  BulkSearchResponse,
  DutySavingsCalculation,
  LicenceFinderHistoryItem,
  RawMaterial,
  FinishedGood,
  AdvanceLicence
} from '../types';

interface LicenceFinderPageProps {
  onNavigate?: (moduleId: ModuleId, contextData?: any) => void;
}

export const LicenceFinderPage: React.FC<LicenceFinderPageProps> = ({ onNavigate }) => {
  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<'single' | 'bulk' | 'calculator' | 'history'>('single');

  // Master Data
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [products, setProducts] = useState<FinishedGood[]>([]);
  const [licences, setLicences] = useState<AdvanceLicence[]>([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Single Search Form State
  const [searchType, setSearchType] = useState<LicenceFinderSearchType>('import');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('mat-007');
  const [materialSearchQuery, setMaterialSearchQuery] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('fg-001');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(500);
  const [uom, setUom] = useState<string>('Kgs');
  const [targetDate, setTargetDate] = useState<string>(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [unitPrice, setUnitPrice] = useState<number>(4.8);
  const [currency, setCurrency] = useState<string>('USD');
  const [customsDutyRate, setCustomsDutyRate] = useState<number>(7.5);
  const [igstRate, setIgstRate] = useState<number>(18.0);

  // Search Results & Loading
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResult, setSearchResult] = useState<LicenceFinderSearchResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Modal Detail State
  const [selectedRecommendation, setSelectedRecommendation] = useState<LicenceRecommendation | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Bulk Optimizer State
  const [bulkShipments, setBulkShipments] = useState<BulkShipmentItem[]>([
    {
      id: 'ship-1',
      type: 'import',
      materialId: 'mat-007',
      materialName: 'Additive Masterbatch MB-90',
      quantity: 500,
      uom: 'Kgs',
      targetDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      unitPrice: 4.8,
      currency: 'USD'
    },
    {
      id: 'ship-2',
      type: 'import',
      materialId: 'mat-001',
      materialName: 'Raw Cotton Long Staple (Giza-86 Grade)',
      quantity: 25000,
      uom: 'KGS',
      targetDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      unitPrice: 2.3,
      currency: 'USD'
    },
    {
      id: 'ship-3',
      type: 'import',
      materialId: 'mat-002',
      materialName: 'Disperse Blue 79 Crude Dyestuff',
      quantity: 1200,
      uom: 'KGS',
      targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      unitPrice: 14.5,
      currency: 'USD'
    }
  ]);
  const [bulkSearching, setBulkSearching] = useState<boolean>(false);
  const [bulkResponse, setBulkResponse] = useState<BulkSearchResponse | null>(null);

  // Standalone Duty Calculator State
  const [calcCifInr, setCalcCifInr] = useState<number>(200280);
  const [calcBcdRate, setCalcBcdRate] = useState<number>(7.5);
  const [calcIgstRate, setCalcIgstRate] = useState<number>(18.0);
  const [calcExchangeRate, setCalcExchangeRate] = useState<number>(83.45);
  const [calcCurrency, setCalcCurrency] = useState<string>('USD');
  const [calcResult, setCalcResult] = useState<DutySavingsCalculation | null>(null);

  // Search History State
  const [historyItems, setHistoryItems] = useState<LicenceFinderHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Fetch Master Data on Mount
  useEffect(() => {
    fetchMasterData();
    fetchHistory();
  }, []);

  const fetchMasterData = async () => {
    setLoadingMaster(true);
    try {
      const [matRes, prodRes, licRes] = await Promise.all([
        fetch('/api/materials').then((r) => r.json()),
        fetch('/api/finished-goods').then((r) => r.json()),
        fetch('/api/licences').then((r) => r.json())
      ]);

      if (matRes.success && matRes.data) setMaterials(matRes.data);
      if (prodRes.success && prodRes.data) setProducts(prodRes.data);
      if (licRes.data || Array.isArray(licRes)) {
        setLicences(licRes.data || licRes);
      }
    } catch (err) {
      console.warn('Master data fetch warning:', err);
    } finally {
      setLoadingMaster(false);
      // Auto-run initial search for Scenario 1
      handleExecuteSearch();
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch('/api/licence-finder/history');
      const data = await res.json();
      if (data.success && data.history) {
        setHistoryItems(data.history);
      }
    } catch (err) {
      console.warn('History fetch error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Run Recommendation Search
  const handleExecuteSearch = async (customParams?: Partial<any>) => {
    setSearching(true);
    setSearchError(null);

    const typeParam = customParams?.type || searchType;
    const matIdParam = customParams?.materialId !== undefined ? customParams.materialId : selectedMaterialId;
    const prodIdParam = customParams?.productId !== undefined ? customParams.productId : selectedProductId;
    const qtyParam = customParams?.quantity || quantity;
    const uomParam = customParams?.uom || uom;
    const targetDateParam = customParams?.targetDate || targetDate;
    const unitPriceParam = customParams?.unitPrice || unitPrice;
    const bcdParam = customParams?.customsDutyRate || customsDutyRate;
    const igstParam = customParams?.igstRate || igstRate;

    try {
      const query = new URLSearchParams({
        type: typeParam,
        ...(typeParam === 'import' && matIdParam ? { materialId: matIdParam } : {}),
        ...(typeParam === 'export' && prodIdParam ? { productId: prodIdParam } : {}),
        quantity: qtyParam.toString(),
        uom: uomParam,
        targetDate: targetDateParam,
        unitPrice: unitPriceParam.toString(),
        currency,
        customsDutyRate: bcdParam.toString(),
        igstRate: igstParam.toString()
      });

      const res = await fetch(`/api/licence-finder/search?${query.toString()}`);
      const data = await res.json();

      if (data.success) {
        setSearchResult(data);
        fetchHistory(); // refresh history
      } else {
        setSearchError(data.message || 'Failed to generate recommendations');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Network error executing recommendation engine');
    } finally {
      setSearching(false);
    }
  };

  // Run Bulk Optimizer Search
  const handleExecuteBulkSearch = async () => {
    if (bulkShipments.length === 0) return;
    setBulkSearching(true);
    try {
      const res = await fetch('/api/licence-finder/bulk-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipments: bulkShipments })
      });
      const data = await res.json();
      if (data.success) {
        setBulkResponse(data);
      }
    } catch (err: any) {
      console.error('Bulk search error:', err);
    } finally {
      setBulkSearching(false);
    }
  };

  // Run Standalone Duty Calculation
  const handleCalculateDuty = async () => {
    try {
      const params = new URLSearchParams({
        cifValueInr: calcCifInr.toString(),
        exchangeRate: calcExchangeRate.toString(),
        customsDutyPercent: calcBcdRate.toString(),
        igstPercent: calcIgstRate.toString(),
        currency: calcCurrency
      });
      const res = await fetch(`/api/licence-finder/duty-calculator?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.calculation) {
        setCalcResult(data.calculation);
      }
    } catch (err) {
      console.warn('Duty calculation error:', err);
    }
  };

  useEffect(() => {
    handleCalculateDuty();
  }, [calcCifInr, calcBcdRate, calcIgstRate, calcExchangeRate, calcCurrency]);

  // Quick Demo Scenario Triggers
  const handleLoadScenario = (scenarioId: number) => {
    if (scenarioId === 1) {
      // Scenario 1: Primary Additive MB 500 Kg
      setSearchType('import');
      setSelectedMaterialId('mat-007');
      setQuantity(500);
      setUom('Kgs');
      setUnitPrice(4.8);
      setCustomsDutyRate(7.5);
      const futureDate = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setTargetDate(futureDate);
      handleExecuteSearch({
        type: 'import',
        materialId: 'mat-007',
        quantity: 500,
        uom: 'Kgs',
        unitPrice: 4.8,
        customsDutyRate: 7.5,
        targetDate: futureDate
      });
    } else if (scenarioId === 2) {
      // Scenario 2: Target date 2 months away (Tests expiry runway filter)
      setSearchType('import');
      setSelectedMaterialId('mat-007');
      setQuantity(1000);
      setUom('Kgs');
      setUnitPrice(4.8);
      const twoMonthsDate = new Date(Date.now() + 65 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setTargetDate(twoMonthsDate);
      handleExecuteSearch({
        type: 'import',
        materialId: 'mat-007',
        quantity: 1000,
        targetDate: twoMonthsDate
      });
    } else if (scenarioId === 3) {
      // Scenario 3: Product not in primary SION norm schedule
      setSearchType('import');
      setSelectedMaterialId('mat-006'); // Heavy Carbon Fiber Spun
      setQuantity(800);
      setUom('KGS');
      setUnitPrice(85.0);
      setCustomsDutyRate(10.0);
      handleExecuteSearch({
        type: 'import',
        materialId: 'mat-006',
        quantity: 800,
        uom: 'KGS',
        unitPrice: 85.0,
        customsDutyRate: 10.0
      });
    } else if (scenarioId === 4) {
      // Scenario 4: Single matching licence (Concentration risk)
      setSearchType('import');
      setSelectedMaterialId('mat-005'); // Sterile Ceftriaxone API
      setQuantity(150);
      setUom('KGS');
      setUnitPrice(120.0);
      setCustomsDutyRate(10.0);
      handleExecuteSearch({
        type: 'import',
        materialId: 'mat-005',
        quantity: 150,
        uom: 'KGS',
        unitPrice: 120.0
      });
    } else if (scenarioId === 5) {
      // Scenario 5: Multi-Shipment Quota Contention Matrix
      setActiveTab('bulk');
      handleExecuteBulkSearch();
    }
  };

  // Accept / Allocate Licence
  const handleAcceptLicence = async (licence: LicenceRecommendation) => {
    try {
      await fetch('/api/licence-finder/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQueryType: searchType,
          searchMaterialId: selectedMaterialId,
          searchQuantity: quantity,
          searchUom: uom,
          searchTargetDate: targetDate,
          recommendedLicenceIds: searchResult?.recommendations.map((r) => r.licenceId) || [],
          topRecommendationId: licence.licenceId,
          topRecommendationNumber: licence.licenceNumber,
          topRecommendationScore: licence.score,
          dutySavingsInr: licence.details.estimatedDutySavingsInr,
          userAccepted: true,
          finalLicenceUsedId: licence.licenceId
        })
      });

      setActionSuccessMessage(`Successfully recorded allocation of Licence ${licence.licenceNumber} (File ${licence.fileNumber}) for this shipment!`);
      setTimeout(() => setActionSuccessMessage(null), 5000);
      fetchHistory();
    } catch (err) {
      console.warn('Accept recommendation error:', err);
    }
  };

  // Helper formatting
  const formatCurrency = (val: number, cur: string = 'INR') => {
    if (cur === 'INR') {
      if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
      if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
      return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    }
    return `$${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
    if (score >= 50) return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
    return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Advance Licence Finder
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    SION Intelligence v2.4
                  </span>
                </h1>
                <p className="text-sm text-slate-500">
                  Intelligent matching engine recommending the optimal Advance Licence for upcoming import/export shipments
                </p>
              </div>
            </div>
          </div>

          {/* Quick Scenario Preset Selector */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <span className="text-xs font-medium text-slate-500 px-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Test Scenarios:
            </span>
            <button
              onClick={() => handleLoadScenario(1)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
              title="500 Kg Additive MB (Primary Prompt Scenario)"
            >
              1. Additive MB 500Kg
            </button>
            <button
              onClick={() => handleLoadScenario(2)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
              title="Target date in 2 months (Tests expiry runway)"
            >
              2. 2-Month Target
            </button>
            <button
              onClick={() => handleLoadScenario(3)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
              title="Item not in SION schedule (Tests partial/no match warning)"
            >
              3. Non-SION Item
            </button>
            <button
              onClick={() => handleLoadScenario(4)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-white text-slate-700 hover:text-blue-600 border border-slate-200 shadow-2xs hover:border-blue-300 transition-colors"
              title="Single Licence match (Tests concentration alert)"
            >
              4. Single Licence
            </button>
            <button
              onClick={() => handleLoadScenario(5)}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shadow-2xs transition-colors"
              title="Bulk shipments with quota conflict matrix"
            >
              5. Bulk Conflicts
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 mt-5 pt-4">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'single'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            Single Shipment Recommendation
          </button>
          <button
            onClick={() => {
              setActiveTab('bulk');
              if (!bulkResponse) handleExecuteBulkSearch();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'bulk'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Bulk Optimizer & Conflict Matrix
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'calculator'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Duty Savings Calculator
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            Search History ({historyItems.length})
          </button>
        </div>
      </div>

      {/* Action Notification Toast */}
      {actionSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{actionSuccessMessage}</p>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: SINGLE SHIPMENT RECOMMENDATION ENGINE */}
      {activeTab === 'single' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Search Query Parameter Form */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Shipment Criteria
              </h2>
              <span className="text-[11px] text-slate-400">100-pt Scoring Engine</span>
            </div>

            {/* Type Toggle: Import vs Export */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Shipment Transaction Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSearchType('import')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    searchType === 'import'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-blue-600" />
                  Import (Raw Material)
                </button>
                <button
                  type="button"
                  onClick={() => setSearchType('export')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    searchType === 'export'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  Export (Finished Good)
                </button>
              </div>
            </div>

            {/* Material / Product Selector */}
            {searchType === 'import' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Import Raw Material (Duty-Free Eligible)
                </label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.materialCode} — {m.materialName} ({m.hsCode})
                    </option>
                  ))}
                  {materials.length === 0 && (
                    <>
                      <option value="mat-007">MAT-ADD-MB01 — Additive Masterbatch MB-90 (3809.10.10)</option>
                      <option value="mat-001">MAT-COT-01 — Raw Cotton Long Staple (5201.00.15)</option>
                      <option value="mat-002">MAT-DYE-02 — Disperse Blue 79 Crude Dyestuff (3204.11.11)</option>
                      <option value="mat-005">MAT-PHA-05 — Sterile Ceftriaxone API (2941.90.90)</option>
                    </>
                  )}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Export Finished Good (Obligation Product)
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productCode} — {p.productName} ({p.hsCode})
                    </option>
                  ))}
                  {products.length === 0 && (
                    <>
                      <option value="fg-001">PROD-FAB-100 — 100% Cotton Grey Woven Fabric (5208.11.90)</option>
                      <option value="fg-002">PROD-BLN-200 — Dyed Poly-Cotton Blended Fabric (5513.21.00)</option>
                      <option value="fg-005">PROD-MED-500 — Ceftriaxone for Injection USP 1g (3004.20.95)</option>
                    </>
                  )}
                </select>
              </div>
            )}

            {/* Quantity and UOM */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Shipment Quantity
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Unit of Measure (UOM)
                </label>
                <select
                  value={uom}
                  onChange={(e) => setUom(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Kgs">Kgs (Kilograms)</option>
                  <option value="MTR">MTR (Meters)</option>
                  <option value="NOS">NOS (Numbers/Pieces)</option>
                  <option value="SQM">SQM (Sq. Meters)</option>
                  <option value="MT">MT (Metric Tonnes)</option>
                </select>
              </div>
            </div>

            {/* Target Date & Runway */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span>Target Clearance / Shipping Date</span>
                <span className="text-[10px] text-blue-600 font-normal">Customs Runway Math</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            {/* Pricing & Duty Rates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  CIF Unit Price (USD)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(Math.max(0.01, Number(e.target.value)))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Basic Customs Duty (BCD)
                </label>
                <select
                  value={customsDutyRate}
                  onChange={(e) => setCustomsDutyRate(Number(e.target.value))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value={7.5}>7.5% (Chemicals / MB)</option>
                  <option value={5.0}>5.0% (Textiles / Cotton)</option>
                  <option value={10.0}>10.0% (Speciality Items)</option>
                  <option value={15.0}>15.0% (Higher Tariff Goods)</option>
                </select>
              </div>
            </div>

            {/* Estimated Value Projections */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200/80 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-500">
                <span>Estimated CIF Value:</span>
                <span className="font-medium text-slate-700">
                  ${(quantity * unitPrice).toLocaleString()} USD (~₹{((quantity * unitPrice) * 83.45).toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                </span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Customs Tariff:</span>
                <span className="font-medium text-slate-700">BCD {customsDutyRate}% + SWS 10% + IGST 18%</span>
              </div>
            </div>

            {/* Search Trigger Button */}
            <button
              type="button"
              disabled={searching}
              onClick={() => handleExecuteSearch()}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
            >
              {searching ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating Compatibility Matrix...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Find Optimal Advance Licence
                </>
              )}
            </button>
          </div>

          {/* Search Results & Ranked Cards */}
          <div className="lg:col-span-8 space-y-5">
            {searchError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <p className="text-sm font-medium">{searchError}</p>
              </div>
            )}

            {searching && (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center space-y-4 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-600 animate-spin">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">Evaluating Active Advance Licences</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Computing 100-point algorithm across SION conversion norms (25pts), expiry runway safety (35pts), remaining FOB quota (20pts), and duty savings (15pts)...
                  </p>
                </div>
              </div>
            )}

            {!searching && searchResult && (
              <>
                {/* Executive Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                        Top Recommendation
                      </span>
                      <div className="flex items-center gap-3 mt-0.5">
                        <h2 className="text-lg font-bold text-white">
                          {searchResult.summary.bestLicence
                            ? `Licence ${searchResult.summary.bestLicence.number} (File ${searchResult.summary.bestLicence.fileNumber})`
                            : 'No Compatible Licence Found'}
                        </h2>
                        {searchResult.summary.bestLicence && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            Rank #1 ({searchResult.summary.bestLicence.score}/100 pts)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Duty Savings Highlight */}
                    <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-lg flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Net Duty Exemption</div>
                        <div className="text-base font-extrabold text-emerald-400">
                          {formatCurrency(searchResult.summary.projectedCosts.dutySavingsInr)} Saved
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Advice */}
                  <div className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="leading-relaxed">{searchResult.summary.overallAdvice}</p>
                  </div>
                </div>

                {/* Ranked Recommendations List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Evaluated Licences ({searchResult.recommendations.length} Candidate{searchResult.recommendations.length !== 1 ? 's' : ''})
                    </h3>
                    <span className="text-xs text-slate-400">Sorted by Total Score & Runway Safety</span>
                  </div>

                  {searchResult.recommendations.map((rec) => {
                    const isRankOne = rec.rank === 1;
                    return (
                      <div
                        key={rec.licenceId}
                        className={`bg-white border rounded-xl p-5 shadow-xs transition-all ${
                          isRankOne
                            ? 'border-blue-300 ring-1 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isRankOne ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                #{rec.rank}
                              </span>
                              <h4 className="text-base font-bold text-slate-900">
                                Licence {rec.licenceNumber}
                              </h4>
                              <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                                File #{rec.fileNumber}
                              </span>
                              {isRankOne && (
                                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Recommended
                                </span>
                              )}
                              {rec.details.daysToExpiry < 60 && rec.details.status !== 'Expired' && (
                                <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Imminent Expiry ({rec.details.daysToExpiry}d)
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 font-medium">
                              {rec.recommendationReason}
                            </p>
                          </div>

                          {/* 100-Point Score Gauge */}
                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <div className="text-right">
                              <div className="text-xs text-slate-400 font-medium">Suitability Score</div>
                              <div className="text-xl font-black text-slate-900">
                                {Math.max(0, rec.score)}
                                <span className="text-xs text-slate-400 font-normal">/100</span>
                              </div>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center font-extrabold text-sm">
                              <span className={rec.score >= 80 ? 'text-emerald-600' : rec.score >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                                {rec.confidencePercent}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Visual Score Breakdown Progress Bar */}
                        <div className="py-3 border-b border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                            <span>Score Breakdown:</span>
                            <div className="flex items-center gap-3">
                              <span>SION: <strong>{rec.scoreBreakdown.sionCompatibility}/25</strong></span>
                              <span>Runway: <strong>{rec.scoreBreakdown.expiryRisk}/35</strong></span>
                              <span>Quota: <strong>{rec.scoreBreakdown.remainingQuota}/20</strong></span>
                              <span>Savings: <strong>{rec.scoreBreakdown.dutySavings}/15</strong></span>
                              {rec.scoreBreakdown.targetDateBonus ? <span>Bonus: <strong>+{rec.scoreBreakdown.targetDateBonus}</strong></span> : null}
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${(rec.scoreBreakdown.sionCompatibility / 100) * 100}%` }}
                              className="bg-blue-500 h-full"
                              title={`SION: ${rec.scoreBreakdown.sionCompatibility} pts`}
                            />
                            <div
                              style={{ width: `${(rec.scoreBreakdown.expiryRisk / 100) * 100}%` }}
                              className="bg-emerald-500 h-full"
                              title={`Expiry Runway: ${rec.scoreBreakdown.expiryRisk} pts`}
                            />
                            <div
                              style={{ width: `${(rec.scoreBreakdown.remainingQuota / 100) * 100}%` }}
                              className="bg-purple-500 h-full"
                              title={`Remaining Quota: ${rec.scoreBreakdown.remainingQuota} pts`}
                            />
                            <div
                              style={{ width: `${(rec.scoreBreakdown.dutySavings / 100) * 100}%` }}
                              className="bg-amber-500 h-full"
                              title={`Duty Savings: ${rec.scoreBreakdown.dutySavings} pts`}
                            />
                          </div>
                        </div>

                        {/* Metric Highlights Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-b border-slate-100 text-xs">
                          <div>
                            <span className="text-slate-400 block text-[11px]">SION Compatibility</span>
                            <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                              {rec.details.compatibilityLevel === 'Perfect Match' ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> Perfect Match
                                </span>
                              ) : rec.details.compatibilityLevel === 'Partial Match' ? (
                                <span className="text-amber-600 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" /> Partial Match
                                </span>
                              ) : (
                                <span className="text-rose-600 font-bold flex items-center gap-1">
                                  <X className="w-3.5 h-3.5" /> No Match
                                </span>
                              )}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Import Validity Runway</span>
                            <span className="font-semibold text-slate-800 block mt-0.5">
                              {rec.details.daysToExpiry} days ({rec.details.expiryDate})
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Remaining FOB Quota</span>
                            <span className="font-semibold text-slate-800 block mt-0.5">
                              {formatCurrency(rec.details.remainingFobInr)} ({rec.details.utilizationPercent}% utilized)
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[11px]">Licence Duty Portfolio</span>
                            <span className="font-bold text-emerald-600 block mt-0.5">
                              {formatCurrency(rec.details.estimatedDutySavingsInr)} Exemption
                            </span>
                          </div>
                        </div>

                        {/* Warning Flags & Action Buttons */}
                        <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            {rec.warningFlags.map((flag, fIdx) => (
                              <div
                                key={fIdx}
                                className="text-[11px] text-amber-700 flex items-center gap-1.5"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                <span>{flag}</span>
                              </div>
                            ))}
                            {rec.warningFlags.length === 0 && (
                              <div className="text-[11px] text-emerald-600 flex items-center gap-1.5 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Fully compliant with DGFT SION standards & runway safety
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setSelectedRecommendation(rec)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Inspect Details
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAcceptLicence(rec)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Allocate Shipment
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BULK SHIPMENTS OPTIMIZER & CONFLICT MATRIX */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Upcoming Shipments Portfolio ({bulkShipments.length} Batches)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Optimize licence quota distribution across multiple import consignments and prevent quota exhaustion conflicts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBulkShipments([
                      ...bulkShipments,
                      {
                        id: `ship-${Date.now()}`,
                        type: 'import',
                        materialName: 'Polyester Staple Fiber (PSF 1.4D)',
                        quantity: 10000,
                        uom: 'KGS',
                        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        unitPrice: 1.15,
                        currency: 'USD'
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Shipment
                </button>
                <button
                  type="button"
                  disabled={bulkSearching}
                  onClick={handleExecuteBulkSearch}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                >
                  {bulkSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Optimize Allocation
                </button>
              </div>
            </div>

            {/* Editable Shipment Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="p-2.5">#</th>
                    <th className="p-2.5">Item / Material Description</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Quantity & UOM</th>
                    <th className="p-2.5">Target Date</th>
                    <th className="p-2.5">Unit Price (USD)</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkShipments.map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-2.5 font-medium text-slate-800">
                        <input
                          type="text"
                          value={s.materialName || ''}
                          onChange={(e) => {
                            const next = [...bulkShipments];
                            next[idx].materialName = e.target.value;
                            setBulkShipments(next);
                          }}
                          className="w-full text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          {s.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5 font-semibold text-slate-700">
                        {s.quantity.toLocaleString()} {s.uom}
                      </td>
                      <td className="p-2.5 text-slate-600">{s.targetDate}</td>
                      <td className="p-2.5 font-semibold text-slate-700">${s.unitPrice}</td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setBulkShipments(bulkShipments.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bulk Conflict Analysis & Allocation Output */}
          {bulkResponse && (
            <div className="space-y-4">
              {/* Conflict Status Alert */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  bulkResponse.conflictAnalysis.hasConflicts
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}
              >
                {bulkResponse.conflictAnalysis.hasConflicts ? (
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <h4 className="text-sm font-bold">
                    {bulkResponse.conflictAnalysis.hasConflicts
                      ? 'Licence Quota Contention Detected'
                      : 'Zero Quota Contention — All Shipments Optimized'}
                  </h4>
                  <p className="text-xs leading-relaxed">
                    {bulkResponse.conflictAnalysis.optimizationStrategy}
                  </p>
                  {bulkResponse.conflictAnalysis.conflictedLicences.length > 0 && (
                    <div className="pt-2 space-y-1">
                      {bulkResponse.conflictAnalysis.conflictedLicences.map((c, i) => (
                        <div key={i} className="text-xs font-semibold text-amber-800">
                          • Licence {c.licenceNumber} (File {c.fileNumber}): Remaining FOB {formatCurrency(c.remainingQuotaInr)} vs Required {formatCurrency(c.totalRequiredInr)} (Deficit: {formatCurrency(c.deficitInr)})
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Shipment Wise Recommended Allocations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bulkResponse.results.map((res, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Shipment #{i + 1}</span>
                      <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        Score {res.recommendedLicence?.score || 0}/100
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{res.shipmentName}</h4>
                      <p className="text-xs text-slate-500">
                        {res.quantity.toLocaleString()} {res.uom} • Est. {formatCurrency(res.estimatedValueInr)}
                      </p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-xs">
                      <div className="text-slate-400 text-[10px] font-semibold uppercase">Assigned Licence</div>
                      <div className="font-bold text-slate-800">
                        Licence {res.recommendedLicence?.licenceNumber || 'N/A'} (File {res.recommendedLicence?.fileNumber || 'N/A'})
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Validity Runway: {res.recommendedLicence?.details.daysToExpiry || 0} days remaining
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: STANDALONE DUTY SAVINGS CALCULATOR */}
      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                Customs Duty & Savings Parameters
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculate Basic Customs Duty (BCD), Social Welfare Surcharge (SWS), and IGST exemptions under Advance Authorisation.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Shipment CIF Value (INR)
              </label>
              <input
                type="number"
                value={calcCifInr}
                onChange={(e) => setCalcCifInr(Math.max(0, Number(e.target.value)))}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  BCD Rate (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={calcBcdRate}
                  onChange={(e) => setCalcBcdRate(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  IGST Rate (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={calcIgstRate}
                  onChange={(e) => setCalcIgstRate(Math.max(0, Number(e.target.value)))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Exchange Rate (USD/INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcExchangeRate}
                  onChange={(e) => setCalcExchangeRate(Math.max(1, Number(e.target.value)))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Currency
                </label>
                <select
                  value={calcCurrency}
                  onChange={(e) => setCalcCurrency(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Calculator Output View */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Customs Exemption Breakdown
            </h3>

            {calcResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4 space-y-1">
                    <span className="text-[11px] font-bold text-rose-700 uppercase">Without Advance Licence</span>
                    <div className="text-xl font-extrabold text-rose-900">
                      {formatCurrency(calcResult.totalDutyWithoutLicenceInr)}
                    </div>
                    <p className="text-[11px] text-rose-600">Standard Customs + SWS + IGST payable at port</p>
                  </div>

                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 space-y-1">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase">With Advance Licence</span>
                    <div className="text-xl font-extrabold text-emerald-900">
                      ₹0 (100% Exemption)
                    </div>
                    <p className="text-[11px] text-emerald-600">Full customs duty exemption under DGFT scheme</p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs">
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">CIF Value of Consignment:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(calcResult.cifValueInr)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Basic Customs Duty (BCD @ {calcResult.basicCustomsDutyPercent}%):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(calcResult.basicCustomsDutyAmountInr)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">Social Welfare Surcharge (SWS @ 10% of BCD):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(calcResult.socialWelfareSurchargeInr)}</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <span className="text-slate-500">IGST (@ {calcResult.igstPercent}% on Assessable Value):</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(calcResult.igstAmountInr)}</span>
                  </div>
                  <div className="py-2.5 flex justify-between text-emerald-700 font-bold bg-emerald-50/60 px-3 rounded-lg mt-2">
                    <span>Net Duty Saved:</span>
                    <span>{formatCurrency(calcResult.netDutySavingsInr)} ({calcResult.effectiveSavingsPercent}% of CIF)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: SEARCH HISTORY & AUDIT TRAIL */}
      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                Recommendation History & Audit Log
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Past shipment evaluation audits and accepted Advance Licence allocations
              </p>
            </div>

            <button
              type="button"
              onClick={async () => {
                await fetch('/api/licence-finder/history', { method: 'DELETE' });
                setHistoryItems([]);
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
            >
              Clear Log
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="p-2.5">Timestamp</th>
                  <th className="p-2.5">Item Evaluated</th>
                  <th className="p-2.5">Quantity</th>
                  <th className="p-2.5">Target Date</th>
                  <th className="p-2.5">Recommended Licence</th>
                  <th className="p-2.5">Score</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyItems.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-slate-500">
                      {new Date(h.searchTimestamp).toLocaleString()}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-800">{h.searchMaterialName}</td>
                    <td className="p-2.5">{h.searchQuantity.toLocaleString()} {h.searchUom}</td>
                    <td className="p-2.5 text-slate-600">{h.searchTargetDate}</td>
                    <td className="p-2.5 font-bold text-blue-700">
                      {h.topRecommendationNumber || 'N/A'}
                    </td>
                    <td className="p-2.5 font-semibold text-slate-800">
                      {h.topRecommendationScore || 0}/100
                    </td>
                    <td className="p-2.5">
                      {h.userAccepted ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Allocated
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          Queried
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {historyItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No search history records found. Execute a recommendation search to generate audit logs.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED RECOMMENDATION INSPECTION MODAL */}
      {selectedRecommendation && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
                  Detailed Compatibility Breakdown
                </span>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Advance Licence {selectedRecommendation.licenceNumber} (File #{selectedRecommendation.fileNumber})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecommendation(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Score Header */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">SION Compatibility</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedRecommendation.scoreBreakdown.sionCompatibility} / 25 pts
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Validity Runway</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedRecommendation.scoreBreakdown.expiryRisk} / 35 pts ({selectedRecommendation.details.daysToExpiry}d)
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Remaining Quota</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedRecommendation.scoreBreakdown.remainingQuota} / 20 pts
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Duty Exemption</span>
                <span className="font-bold text-slate-900 block mt-0.5">
                  {selectedRecommendation.scoreBreakdown.dutySavings} / 15 pts
                </span>
              </div>
            </div>

            {/* SION Norms Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Associated SION Norm Conversion Schedules
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-2.5">SION Code</th>
                      <th className="p-2.5">Raw Material (Input)</th>
                      <th className="p-2.5">Finished Product (Output)</th>
                      <th className="p-2.5">Yield Ratio</th>
                      <th className="p-2.5">Wastage %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecommendation.details.sionNorms.map((sn, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-bold text-blue-700">{sn.sionCode}</td>
                        <td className="p-2.5 font-medium">{sn.rawMaterial}</td>
                        <td className="p-2.5 text-slate-700">{sn.finishedGood}</td>
                        <td className="p-2.5 font-semibold">{sn.yieldRatio}x</td>
                        <td className="p-2.5 font-semibold text-amber-600">{sn.wastagePercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Balances */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Licence Quota & Financial Runway
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Total Sanctioned FOB</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedRecommendation.details.totalFobInr)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Remaining FOB Quota</span>
                  <span className="font-bold text-emerald-600">{formatCurrency(selectedRecommendation.details.remainingFobInr)}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-400 block text-[11px]">Total Sanctioned CIF</span>
                  <span className="font-bold text-slate-900">{formatCurrency(selectedRecommendation.details.totalCifInr)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedRecommendation(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleAcceptLicence(selectedRecommendation);
                  setSelectedRecommendation(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Allocate This Advance Licence
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

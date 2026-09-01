import React, { useState, useEffect, useMemo } from 'react';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Eye,
  Edit3,
  X,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Package,
  Boxes,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Database,
  Download,
  Calendar,
  DollarSign,
  Check,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  FileCheck2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldCheck,
  Truck,
  Factory,
  Warehouse,
  Scale,
  Percent,
  CheckCheck,
  ClipboardList,
} from 'lucide-react';
import {
  ImportDocument,
  ImportLineItem,
  GoodsReceiptNote,
  ConsumptionTracking,
  ImportDocumentStatus,
  GrnStatus,
  AdvanceLicence,
  CurrencyCode,
  PaginationMeta,
  ImportQueryParams,
} from '../types';
import {
  fetchImportDocuments,
  fetchImportDocumentById,
  createImportDocument,
  updateImportDocument,
  deleteImportDocument,
  createOrUpdateGRN,
  logMaterialConsumption,
  deleteConsumptionRecord,
  fetchLicencesFromDB,
  fetchSionNorms,
} from '../lib/supabase';

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'JPY', 'CAD', 'SGD'];

export const ImportTransactionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'import-documents' | 'consumption-tracking'>('import-documents');

  // Data states
  const [documents, setDocuments] = useState<ImportDocument[]>([]);
  const [licences, setLicences] = useState<AdvanceLicence[]>([]);
  const [sionNorms, setSionNorms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingTable, setIsFetchingTable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [databaseSource, setDatabaseSource] = useState<string>('in_memory_fallback');
  const [successBanner, setSuccessBanner] = useState<string>('');

  // Summary Metrics State
  const [summary, setSummary] = useState({
    totalDocumentsCount: 0,
    clearedDocumentsCount: 0,
    pendingFiledCount: 0,
    rejectedCount: 0,
    totalImportValueInr: 0,
    totalImportValueFc: 0,
    totalQuantityImported: 0,
    totalQuantityConsumed: 0,
    totalInventoryRemaining: 0,
    totalDutySaved: 0,
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [pagination, setPagination] = useState<PaginationMeta>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 50,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [grnFilter, setGrnFilter] = useState<string>('All');
  const [selectedLicenceId, setSelectedLicenceId] = useState<string>('All');
  const [countryFilter, setCountryFilter] = useState<string>('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<string>('docDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<ImportDocument | null>(null);
  const [inspectingDoc, setInspectingDoc] = useState<ImportDocument | null>(null);
  const [grnModalDoc, setGrnModalDoc] = useState<ImportDocument | null>(null);
  const [consumptionModalItem, setConsumptionModalItem] = useState<{
    item: ImportLineItem;
    doc: ImportDocument;
  } | null>(null);

  // Form states for New/Edit BoE
  const [docFormData, setDocFormData] = useState({
    licenceId: '',
    importBillNumber: '',
    docDate: new Date().toISOString().split('T')[0],
    customsPort: 'NHAVA SHEVA',
    importerName: 'Alok Industries Limited',
    supplierCountry: 'GERMANY',
    supplierName: '',
    supplierInvoiceNo: '',
    customsDutyPercent: 7.5,
    igstPercent: 18.0,
    totalInvoiceValueFc: 0,
    exchangeRate: 89.65,
    importCurrency: 'USD' as CurrencyCode,
    boeStatus: 'Filed' as ImportDocumentStatus,
    customsClearanceDate: '',
    notes: '',
  });

  const [formLineItems, setFormLineItems] = useState<Array<{
    hsCode: string;
    materialDescription: string;
    quantityReceived: number;
    uom: string;
    unitPriceFc: number;
    sionNormId: string;
    expectedOutputQty: number;
    expectedOutputUom: string;
  }>>([
    {
      hsCode: '38091010',
      materialDescription: 'Additive MB',
      quantityReceived: 500,
      uom: 'KGS',
      unitPriceFc: 3.5,
      sionNormId: 'SION-TX-01',
      expectedOutputQty: 600,
      expectedOutputUom: 'KGS',
    },
  ]);

  // Form states for Consumption Modal
  const [consumptionFormData, setConsumptionFormData] = useState({
    consumptionDate: new Date().toISOString().split('T')[0],
    quantityConsumed: 0,
    productionBatchId: '',
    finishedGoodProducedQty: 0,
    finishedGoodId: '',
    notes: '',
  });

  // Form states for GRN Modal
  const [grnFormData, setGrnFormData] = useState({
    grnNumber: '',
    receiptDate: new Date().toISOString().split('T')[0],
    warehouseLocation: 'Warehouse A, Bay 4',
    receivedBy: 'Warehouse Inward Team',
    inspectedBy: 'Quality Assurance Inspector',
    quantityChecked: 0,
    damageNoted: 'None',
    status: 'Approved' as GrnStatus,
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Initial load for Licences and SION Norms
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [licRes, sionRes] = await Promise.all([
          fetchLicencesFromDB(),
          fetchSionNorms(),
        ]);
        setLicences(licRes.licences || []);
        setSionNorms(sionRes || []);
      } catch (err) {
        console.warn('Error loading initial licences or SION norms:', err);
      }
    };
    loadInitialData();
  }, []);

  // Main data fetcher
  const loadImportDocuments = async () => {
    setIsFetchingTable(true);
    try {
      const params: ImportQueryParams = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
        searchText: debouncedSearch || undefined,
        licenceId: selectedLicenceId !== 'All' ? selectedLicenceId : undefined,
        boeStatus: statusFilter !== 'All' ? (statusFilter as ImportDocumentStatus) : undefined,
        grnStatus: grnFilter !== 'All' ? (grnFilter as GrnStatus) : undefined,
        supplierCountry: countryFilter !== 'All' ? countryFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      const res = await fetchImportDocuments(params);
      if (res.success) {
        setDocuments(res.data || []);
        setPagination(res.pagination);
        setDatabaseSource(res.source);
        if (res.summary) {
          setSummary(res.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching import documents:', err);
    } finally {
      setIsFetchingTable(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImportDocuments();
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    debouncedSearch,
    statusFilter,
    grnFilter,
    selectedLicenceId,
    countryFilter,
    dateFrom,
    dateTo,
  ]);

  // Extract unique countries
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.supplierCountry) set.add(d.supplierCountry);
    });
    return Array.from(set).sort();
  }, [documents]);

  // Flattened inventory items for Tab 2 (Goods Receipt & SION Consumption Tracking)
  const flattenedInventoryItems = useMemo(() => {
    const items: Array<{
      item: ImportLineItem;
      doc: ImportDocument;
      totalConsumed: number;
      remainingStock: number;
      consumedPct: number;
      actualOutput: number;
      expectedOutput: number;
      variance: number;
    }> = [];

    documents.forEach((doc) => {
      (doc.lineItems || []).forEach((item) => {
        const totalConsumed = (item.consumptionTracking || []).reduce(
          (sum, c) => sum + Number(c.quantityConsumed || 0),
          0
        );
        const actualOutput = (item.consumptionTracking || []).reduce(
          (sum, c) => sum + Number(c.finishedGoodProducedQty || 0),
          0
        );
        const remainingStock = Math.max(0, item.quantityReceived - totalConsumed);
        const consumedPct =
          item.quantityReceived > 0
            ? Math.round((totalConsumed / item.quantityReceived) * 100)
            : 0;
        const expectedOutput = Number(item.expectedOutputQty || 0);
        const variance = expectedOutput > 0 ? actualOutput - expectedOutput : 0;

        items.push({
          item,
          doc,
          totalConsumed,
          remainingStock,
          consumedPct,
          actualOutput,
          expectedOutput,
          variance,
        });
      });
    });

    return items;
  }, [documents]);

  // Helper to open New BoE Modal
  const handleOpenNewModal = () => {
    const defaultLicence = licences[0]?.id || '';
    setDocFormData({
      licenceId: defaultLicence,
      importBillNumber: `BoE-2026-${Math.floor(100000 + Math.random() * 900000)}`,
      docDate: new Date().toISOString().split('T')[0],
      customsPort: 'NHAVA SHEVA',
      importerName: 'Alok Industries Limited',
      supplierCountry: 'GERMANY',
      supplierName: '',
      supplierInvoiceNo: '',
      customsDutyPercent: 7.5,
      igstPercent: 18.0,
      totalInvoiceValueFc: 5000,
      exchangeRate: 89.65,
      importCurrency: 'USD',
      boeStatus: 'Filed',
      customsClearanceDate: '',
      notes: '',
    });
    setFormLineItems([
      {
        hsCode: '38091010',
        materialDescription: 'Additive MB',
        quantityReceived: 500,
        uom: 'KGS',
        unitPriceFc: 3.5,
        sionNormId: 'SION-TX-01',
        expectedOutputQty: 600,
        expectedOutputUom: 'KGS',
      },
    ]);
    setEditingDoc(null);
    setIsNewDocModalOpen(true);
  };

  // Helper to open Edit BoE Modal
  const handleOpenEditModal = (doc: ImportDocument) => {
    setEditingDoc(doc);
    setDocFormData({
      licenceId: doc.licenceId,
      importBillNumber: doc.importBillNumber,
      docDate: doc.docDate,
      customsPort: doc.customsPort,
      importerName: doc.importerName || 'Alok Industries Limited',
      supplierCountry: doc.supplierCountry,
      supplierName: doc.supplierName,
      supplierInvoiceNo: doc.supplierInvoiceNo || '',
      customsDutyPercent: doc.customsDutyPercent || 7.5,
      igstPercent: doc.igstPercent || 18.0,
      totalInvoiceValueFc: doc.totalInvoiceValueFc,
      exchangeRate: doc.exchangeRate,
      importCurrency: doc.importCurrency,
      boeStatus: doc.boeStatus,
      customsClearanceDate: doc.customsClearanceDate || '',
      notes: doc.notes || '',
    });

    if (doc.lineItems && doc.lineItems.length > 0) {
      setFormLineItems(
        doc.lineItems.map((i) => ({
          hsCode: i.hsCode,
          materialDescription: i.materialDescription,
          quantityReceived: i.quantityReceived,
          uom: i.uom,
          unitPriceFc: i.unitPriceFc,
          sionNormId: i.sionNormId || '',
          expectedOutputQty: i.expectedOutputQty || 0,
          expectedOutputUom: i.expectedOutputUom || 'KGS',
        }))
      );
    } else {
      setFormLineItems([
        {
          hsCode: '38091010',
          materialDescription: 'Raw Material',
          quantityReceived: 100,
          uom: 'KGS',
          unitPriceFc: 1.0,
          sionNormId: 'SION-TX-01',
          expectedOutputQty: 120,
          expectedOutputUom: 'KGS',
        },
      ]);
    }

    setIsNewDocModalOpen(true);
  };

  // Helper to save BoE (Create or Update)
  const handleSaveDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFormData.licenceId || !docFormData.importBillNumber) {
      alert('Please select an Advance Licence and enter a valid Bill of Entry Number.');
      return;
    }

    setIsSaving(true);
    try {
      const selectedLic = licences.find((l) => l.id === docFormData.licenceId);

      const payload: Partial<ImportDocument> = {
        ...docFormData,
        licenceNumber: selectedLic?.licenceNumber || '',
        companyFileNumber: selectedLic?.companyFileNumber || '',
        lineItems: formLineItems as any,
      };

      if (editingDoc) {
        await updateImportDocument(editingDoc.id, payload);
        setSuccessBanner(`Bill of Entry #${docFormData.importBillNumber} updated successfully.`);
      } else {
        await createImportDocument(payload);
        setSuccessBanner(`Bill of Entry #${docFormData.importBillNumber} created successfully.`);
      }

      setIsNewDocModalOpen(false);
      setEditingDoc(null);
      await loadImportDocuments();
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save Bill of Entry');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to delete BoE
  const handleDeleteDoc = async (id: string, boeNum: string) => {
    if (
      !window.confirm(
        `Are you sure you want to delete Bill of Entry #${boeNum}? This will delete all attached line items, GRNs, and consumption records.`
      )
    ) {
      return;
    }

    try {
      await deleteImportDocument(id);
      setSuccessBanner(`Bill of Entry #${boeNum} deleted successfully.`);
      await loadImportDocuments();
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete Bill of Entry');
    }
  };

  // Helper to open GRN Inspector Modal
  const handleOpenGrnModal = (doc: ImportDocument) => {
    setGrnModalDoc(doc);
    if (doc.grn) {
      setGrnFormData({
        grnNumber: doc.grn.grnNumber,
        receiptDate: doc.grn.receiptDate,
        warehouseLocation: doc.grn.warehouseLocation,
        receivedBy: doc.grn.receivedBy || 'Warehouse Inward Team',
        inspectedBy: doc.grn.inspectedBy || 'Quality Assurance Inspector',
        quantityChecked: doc.grn.quantityChecked || doc.totalReceivedQty || 0,
        damageNoted: doc.grn.damageNoted || 'None',
        status: doc.grn.status || 'Approved',
      });
    } else {
      setGrnFormData({
        grnNumber: `GRN-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        receiptDate: new Date().toISOString().split('T')[0],
        warehouseLocation: 'Warehouse A, Bay 4',
        receivedBy: 'Warehouse Inward Team',
        inspectedBy: 'Quality Assurance Inspector',
        quantityChecked: doc.totalReceivedQty || 0,
        damageNoted: 'None',
        status: doc.boeStatus === 'Cleared' ? 'Approved' : 'Received',
      });
    }
  };

  // Helper to save GRN
  const handleSaveGrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grnModalDoc) return;

    setIsSaving(true);
    try {
      await createOrUpdateGRN(grnModalDoc.id, grnFormData);
      setSuccessBanner(`Goods Receipt Note #${grnFormData.grnNumber} saved successfully.`);
      setGrnModalDoc(null);
      await loadImportDocuments();
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to save Goods Receipt Note');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to open Consumption Modal
  const handleOpenConsumptionModal = (item: ImportLineItem, doc: ImportDocument) => {
    const totalConsumed = (item.consumptionTracking || []).reduce(
      (sum, c) => sum + Number(c.quantityConsumed || 0),
      0
    );
    const available = Math.max(0, item.quantityReceived - totalConsumed);
    const defaultQty = Math.min(100, available);

    let defaultFinishedGoodOutput = 0;
    let defaultFinishedGoodName = 'Finished Export Product';

    if (item.sionNormId) {
      const norm = sionNorms.find(
        (n) => n.id === item.sionNormId || n.normCode === item.sionNormId
      );
      if (norm) {
        defaultFinishedGoodOutput = Number((defaultQty * norm.yieldRatio).toFixed(2));
        defaultFinishedGoodName = norm.finishedGood;
      }
    }

    setConsumptionModalItem({ item, doc });
    setConsumptionFormData({
      consumptionDate: new Date().toISOString().split('T')[0],
      quantityConsumed: defaultQty,
      productionBatchId: `BATCH-2026-${Math.floor(100 + Math.random() * 900)}`,
      finishedGoodProducedQty: defaultFinishedGoodOutput,
      finishedGoodId: defaultFinishedGoodName,
      notes: `Consumed for export batch production under SION norm ${item.sionNormId || 'Standard Norm'}`,
    });
  };

  // Helper to save Consumption
  const handleSaveConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consumptionModalItem) return;

    const { item } = consumptionModalItem;
    const qty = Number(consumptionFormData.quantityConsumed);
    if (!qty || qty <= 0) {
      alert('Please enter a valid quantity to consume.');
      return;
    }

    const totalConsumed = (item.consumptionTracking || []).reduce(
      (sum, c) => sum + Number(c.quantityConsumed || 0),
      0
    );
    const available = item.quantityReceived - totalConsumed;

    if (qty > available + 0.001) {
      alert(
        `Quantity to consume (${qty} ${item.uom}) cannot exceed available stock (${available} ${item.uom}).`
      );
      return;
    }

    setIsSaving(true);
    try {
      await logMaterialConsumption(item.id, consumptionFormData);
      setSuccessBanner(
        `Logged consumption of ${qty} ${item.uom} of ${item.materialDescription} under Batch #${consumptionFormData.productionBatchId}.`
      );
      setConsumptionModalItem(null);
      await loadImportDocuments();
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to log material consumption');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to delete consumption
  const handleDeleteConsumption = async (itemId: string, consId: string) => {
    if (!window.confirm('Are you sure you want to delete this consumption record? Available inventory will be restored.')) {
      return;
    }

    try {
      await deleteConsumptionRecord(itemId, consId);
      setSuccessBanner('Consumption record deleted and inventory restored.');
      await loadImportDocuments();
      setTimeout(() => setSuccessBanner(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete consumption');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    setIsExportingCsv(true);
    try {
      const headers = [
        'Bill of Entry Number',
        'Filing Date',
        'Advance Licence Number',
        'Company File Number',
        'Customs Port',
        'Foreign Supplier',
        'Origin Country',
        'Invoice Value FC',
        'Currency',
        'Exchange Rate',
        'Invoice Value INR',
        'Customs Duty Saved INR',
        'IGST Saved INR',
        'BoE Status',
        'Customs Clearance Date',
        'GRN Number',
        'GRN Status',
        'Total Quantity Inwarded',
        'Total Quantity Consumed',
        'Remaining Stock',
      ];

      const rows = documents.map((d) => [
        d.importBillNumber,
        d.docDate,
        d.licenceNumber || '',
        d.companyFileNumber || '',
        d.customsPort,
        `"${d.supplierName.replace(/"/g, '""')}"`,
        d.supplierCountry,
        d.totalInvoiceValueFc,
        d.importCurrency,
        d.exchangeRate,
        d.totalInvoiceValueInr,
        d.customsDutyAmount || 0,
        d.igstAmount || 0,
        d.boeStatus,
        d.customsClearanceDate || '',
        d.grn?.grnNumber || '',
        d.grn?.status || 'Pending GRN',
        d.totalReceivedQty || 0,
        d.totalConsumedQty || 0,
        d.totalRemainingQty || 0,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Inward_Imports_Register_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating CSV:', err);
    } finally {
      setIsExportingCsv(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn pb-16" id="import-transactions-module">
      {/* Top Banner Notifications */}
      {successBanner && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-slideDown">
          <div className="flex items-center gap-2 font-medium text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header & Main Module Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-sky-100 text-sky-800 text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              Phase 2 • Inbound Logistics
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
              <Database className="w-3.5 h-3.5 text-slate-400" />
              Source: {databaseSource === 'supabase_postgresql' ? 'Supabase Postgres' : 'Active Workspace Store'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <ArrowDownLeft className="w-7 h-7 text-sky-600" />
            Import Transactions & SION Logistics
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Track duty-free raw material imports under Advance Authorisation, manage Bills of Entry (e-BoE), warehouse GRNs, and SION norm consumption.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={loadImportDocuments}
            disabled={isFetchingTable}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-60"
            title="Refresh Inward Register"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isFetchingTable ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv || documents.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenNewModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Record Bill of Entry</span>
          </button>
        </div>
      </div>

      {/* Top Level Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Inward Documents */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Inward Bills of Entry
            </span>
            <span className="p-2 bg-sky-50 text-sky-600 rounded-lg">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{summary.totalDocumentsCount}</span>
            <span className="text-xs text-slate-500">docs filed</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 text-emerald-700 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              {summary.clearedDocumentsCount} Cleared
            </span>
            <span className="text-amber-700 font-medium">{summary.pendingFiledCount} In Assessment</span>
            {summary.rejectedCount > 0 && (
              <span className="text-rose-700 font-medium">{summary.rejectedCount} Discrepant</span>
            )}
          </div>
        </div>

        {/* Card 2: Total CIF Import Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Inward CIF Value
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{(summary.totalImportValueInr / 100000).toFixed(2)} L
            </span>
            <span className="text-xs text-slate-500 font-mono">
              (${summary.totalImportValueFc.toLocaleString()})
            </span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Exchange Avg: ₹89.65 / USD</span>
            <span className="font-semibold text-blue-700">Duty-Free Inflow</span>
          </div>
        </div>

        {/* Card 3: Duty Saved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Customs Duty & IGST Saved
            </span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">
              ₹{(summary.totalDutySaved / 100000).toFixed(2)} L
            </span>
            <span className="text-xs text-emerald-600 font-medium">Exempted</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Basic Customs (BCD) + IGST</span>
            <span className="text-emerald-700 font-semibold">100% Benefit</span>
          </div>
        </div>

        {/* Card 4: Inventory & SION Consumption */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Raw Material Stock Balance
            </span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Boxes className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-900">
              {summary.totalInventoryRemaining.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-medium">Kgs in stock</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Consumed: {summary.totalQuantityConsumed.toLocaleString()} Kgs</span>
            <span className="font-semibold text-purple-700">
              {summary.totalQuantityImported > 0
                ? `${Math.round((summary.totalQuantityConsumed / summary.totalQuantityImported) * 100)}% Used`
                : '0% Used'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 bg-white px-4 rounded-t-xl shadow-sm flex items-center gap-6">
        <button
          onClick={() => setActiveTab('import-documents')}
          className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'import-documents'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Import Documents Register (Bills of Entry)</span>
          <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {summary.totalDocumentsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('consumption-tracking')}
          className={`py-3.5 px-2 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'consumption-tracking'
              ? 'border-sky-600 text-sky-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Goods Receipt & SION Consumption Tracking</span>
          <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {flattenedInventoryItems.length} items
          </span>
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-b-xl border-x border-b border-slate-200 shadow-sm space-y-3 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search BoE #, Licence #, File #, Supplier, HS Code, Material..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Licence Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedLicenceId}
              onChange={(e) => {
                setSelectedLicenceId(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            >
              <option value="All">All Advance Licences</option>
              {licences.map((lic) => (
                <option key={lic.id} value={lic.id}>
                  Licence #{lic.licenceNumber} (File #{lic.companyFileNumber})
                </option>
              ))}
            </select>
          </div>

          {/* BoE Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            >
              <option value="All">All BoE Statuses</option>
              <option value="Cleared">Cleared by Customs</option>
              <option value="Filed">Filed / In Assessment</option>
              <option value="Rejected">Rejected / Discrepancy</option>
            </select>
          </div>

          {/* GRN Status Filter */}
          <div className="md:col-span-2">
            <select
              value={grnFilter}
              onChange={(e) => {
                setGrnFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white"
            >
              <option value="All">All GRN Statuses</option>
              <option value="Approved">GRN Approved</option>
              <option value="Received">GRN Received</option>
              <option value="Inspected">GRN Inspected</option>
              <option value="Quarantined">GRN Quarantined</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-1 flex justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedLicenceId('All');
                setStatusFilter('All');
                setGrnFilter('All');
                setCountryFilter('All');
                setDateFrom('');
                setDateTo('');
                setCurrentPage(1);
              }}
              className="w-full py-2 px-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: IMPORT DOCUMENTS REGISTER (BILLS OF ENTRY) */}
      {/* =================================================================== */}
      {activeTab === 'import-documents' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 border-collapse">
              <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">BoE Number & Date</th>
                  <th className="py-3 px-4">Advance Licence</th>
                  <th className="py-3 px-4">Supplier & Origin</th>
                  <th className="py-3 px-4">Customs Port</th>
                  <th className="py-3 px-4 text-right">Inward CIF Value</th>
                  <th className="py-3 px-4 text-right">Duty Saved</th>
                  <th className="py-3 px-4 text-center">BoE Status</th>
                  <th className="py-3 px-4 text-center">Warehouse GRN</th>
                  <th className="py-3 px-4 text-center">Consumption</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isFetchingTable ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600 mb-2" />
                      <span>Loading inward import records...</span>
                    </td>
                  </tr>
                ) : documents.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No import records match your criteria.</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Try adjusting your search query or filters, or record a new Bill of Entry.
                      </p>
                    </td>
                  </tr>
                ) : (
                  documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      {/* BoE Number & Date */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 font-mono">{doc.importBillNumber}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{doc.docDate}</span>
                        </div>
                      </td>

                      {/* Licence & File # */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">{doc.licenceNumber || '—'}</div>
                        <div className="text-xs text-sky-600 font-semibold">
                          File #{doc.companyFileNumber || '—'}
                        </div>
                      </td>

                      {/* Supplier & Country */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900 truncate max-w-[180px]" title={doc.supplierName}>
                          {doc.supplierName}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                          <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                          <span>{doc.supplierCountry}</span>
                        </div>
                      </td>

                      {/* Customs Port */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-mono font-medium">
                          {doc.customsPort}
                        </span>
                      </td>

                      {/* Inward CIF Value */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-slate-900">
                          ₹{Number(doc.totalInvoiceValueInr).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          {doc.importCurrency} {Number(doc.totalInvoiceValueFc).toLocaleString()}
                        </div>
                      </td>

                      {/* Duty Saved */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-emerald-700">
                          ₹{Number((doc.customsDutyAmount || 0) + (doc.igstAmount || 0)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-emerald-600">
                          {doc.customsDutyPercent || 7.5}% BCD + 18% IGST
                        </div>
                      </td>

                      {/* BoE Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            doc.boeStatus === 'Cleared'
                              ? 'bg-emerald-100 text-emerald-800'
                              : doc.boeStatus === 'Filed'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {doc.boeStatus === 'Cleared' && <CheckCircle2 className="w-3 h-3" />}
                          {doc.boeStatus === 'Filed' && <Clock className="w-3 h-3" />}
                          {doc.boeStatus === 'Rejected' && <AlertCircle className="w-3 h-3" />}
                          <span>{doc.boeStatus}</span>
                        </span>
                        {doc.customsClearanceDate && (
                          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            {doc.customsClearanceDate}
                          </div>
                        )}
                      </td>

                      {/* GRN Status */}
                      <td className="py-3.5 px-4 text-center">
                        {doc.grn ? (
                          <button
                            onClick={() => handleOpenGrnModal(doc)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold transition-colors"
                          >
                            <Warehouse className="w-3 h-3" />
                            <span>{doc.grn.status}</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenGrnModal(doc)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-xs font-medium transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Log GRN</span>
                          </button>
                        )}
                      </td>

                      {/* Consumption Progress */}
                      <td className="py-3.5 px-4 text-center min-w-[120px]">
                        <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                          <span>{doc.totalConsumedQty || 0} Kgs</span>
                          <span className="font-semibold text-slate-900">
                            {doc.totalReceivedQty && doc.totalReceivedQty > 0
                              ? `${Math.round(((doc.totalConsumedQty || 0) / doc.totalReceivedQty) * 100)}%`
                              : '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
                            style={{
                              width: `${
                                doc.totalReceivedQty && doc.totalReceivedQty > 0
                                  ? Math.min(100, Math.round(((doc.totalConsumedQty || 0) / doc.totalReceivedQty) * 100))
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingDoc(doc)}
                            className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                            title="Inspect BoE Details & Line Items"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Bill of Entry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(doc.id, doc.importBillNumber)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Bill of Entry"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing page <span className="font-semibold text-slate-900">{pagination.currentPage}</span> of{' '}
                <span className="font-semibold text-slate-900">{pagination.totalPages}</span> ({pagination.totalRecords} records)
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={!pagination.hasPrevPage}
                  className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                  title="First Page"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrevPage}
                  className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-2 font-semibold text-slate-700">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={!pagination.hasNextPage}
                  className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(pagination.totalPages)}
                  disabled={!pagination.hasNextPage}
                  className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40"
                  title="Last Page"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: GOODS RECEIPT & SION CONSUMPTION TRACKING */}
      {/* =================================================================== */}
      {activeTab === 'consumption-tracking' && (
        <div className="space-y-4">
          <div className="bg-sky-50 border border-sky-200 p-4 rounded-xl flex items-start gap-3">
            <Scale className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-sky-900 space-y-1">
              <span className="font-semibold text-sm block">SION (Standard Input-Output Norms) Consumption Engine</span>
              <p>
                Imported materials are mapped to approved DGFT SION norm yield ratios. When material is consumed in production batches, the system auto-calculates expected finished export output and validates against your Advance Licence fulfillment obligation.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Raw Material & HS Code</th>
                    <th className="py-3 px-4">BoE Reference & Licence</th>
                    <th className="py-3 px-4">SION Norm & Ratio</th>
                    <th className="py-3 px-4 text-right">Inward Qty</th>
                    <th className="py-3 px-4 text-right">Consumed Qty</th>
                    <th className="py-3 px-4 text-right">Free Stock</th>
                    <th className="py-3 px-4 text-right">Expected Output</th>
                    <th className="py-3 px-4 text-right">Actual Output</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {flattenedInventoryItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-500">
                        <Boxes className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-700">No inward raw material items found.</p>
                      </td>
                    </tr>
                  ) : (
                    flattenedInventoryItems.map(({ item, doc, totalConsumed, remainingStock, consumedPct, actualOutput, expectedOutput }) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        {/* Raw Material & HS */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{item.materialDescription}</div>
                          <div className="text-xs text-slate-500 font-mono">HS: {item.hsCode}</div>
                        </td>

                        {/* BoE & Licence */}
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-900 font-mono text-xs">{doc.importBillNumber}</div>
                          <div className="text-xs text-sky-600">Licence #{doc.licenceNumber}</div>
                        </td>

                        {/* SION Norm */}
                        <td className="py-3.5 px-4">
                          {item.sionNormId ? (
                            <div>
                              <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold text-xs font-mono">
                                {item.sionNormId}
                              </span>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Yield: 1 {item.uom} → {(Number(item.expectedOutputQty || 0) / (item.quantityReceived || 1)).toFixed(2)} {item.expectedOutputUom || item.uom}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Standard Norm</span>
                          )}
                        </td>

                        {/* Inward Qty */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                          {item.quantityReceived.toLocaleString()} {item.uom}
                        </td>

                        {/* Consumed Qty */}
                        <td className="py-3.5 px-4 text-right font-medium text-purple-700">
                          {totalConsumed.toLocaleString()} {item.uom}
                          <div className="text-[11px] text-slate-400 font-normal">({consumedPct}%)</div>
                        </td>

                        {/* Remaining Stock */}
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-block font-bold text-sm ${
                              remainingStock === 0
                                ? 'text-slate-400'
                                : remainingStock < 100
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {remainingStock.toLocaleString()} {item.uom}
                          </span>
                        </td>

                        {/* Expected Output */}
                        <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                          {expectedOutput.toLocaleString()} {item.expectedOutputUom || item.uom}
                        </td>

                        {/* Actual Output */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {actualOutput.toLocaleString()} {item.expectedOutputUom || item.uom}
                        </td>

                        {/* Action: Log Consumption */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleOpenConsumptionModal(item, doc)}
                            disabled={remainingStock <= 0}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                          >
                            <Factory className="w-3.5 h-3.5" />
                            <span>Log Consumption</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: RECORD / EDIT BILL OF ENTRY */}
      {/* =================================================================== */}
      {isNewDocModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-scaleUp">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-lg">
                  {editingDoc ? `Edit Bill of Entry #${editingDoc.importBillNumber}` : 'Record Inward Bill of Entry (e-BoE)'}
                </h3>
              </div>
              <button
                onClick={() => setIsNewDocModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Section 1: Basic Master Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Advance Licence <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={docFormData.licenceId}
                    onChange={(e) => setDocFormData({ ...docFormData, licenceId: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Select Advance Licence</option>
                    {licences.map((lic) => (
                      <option key={lic.id} value={lic.id}>
                        Licence #{lic.licenceNumber} (File #{lic.companyFileNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bill of Entry (BoE) Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={docFormData.importBillNumber}
                    onChange={(e) => setDocFormData({ ...docFormData, importBillNumber: e.target.value })}
                    required
                    placeholder="e.g. BoE-2026-548291"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Filing Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={docFormData.docDate}
                    onChange={(e) => setDocFormData({ ...docFormData, docDate: e.target.value })}
                    required
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Section 2: Supplier & Logistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Foreign Supplier Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={docFormData.supplierName}
                    onChange={(e) => setDocFormData({ ...docFormData, supplierName: e.target.value })}
                    required
                    placeholder="e.g. Acme Chemicals GmbH"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Supplier Origin Country
                  </label>
                  <input
                    type="text"
                    value={docFormData.supplierCountry}
                    onChange={(e) => setDocFormData({ ...docFormData, supplierCountry: e.target.value.toUpperCase() })}
                    placeholder="e.g. GERMANY"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customs Port of Import
                  </label>
                  <input
                    type="text"
                    value={docFormData.customsPort}
                    onChange={(e) => setDocFormData({ ...docFormData, customsPort: e.target.value })}
                    placeholder="e.g. NHAVA SHEVA"
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Section 3: Financials & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Invoice Currency
                  </label>
                  <select
                    value={docFormData.importCurrency}
                    onChange={(e) => setDocFormData({ ...docFormData, importCurrency: e.target.value as CurrencyCode })}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg font-bold"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Invoice Value FC
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={docFormData.totalInvoiceValueFc}
                    onChange={(e) => setDocFormData({ ...docFormData, totalInvoiceValueFc: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Exchange Rate (₹/FC)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={docFormData.exchangeRate}
                    onChange={(e) => setDocFormData({ ...docFormData, exchangeRate: parseFloat(e.target.value) || 89.65 })}
                    className="w-full py-2 px-3 text-sm bg-white border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Calculated INR Value
                  </label>
                  <div className="py-2 px-3 text-sm bg-slate-200 border border-slate-300 rounded-lg font-bold text-slate-900">
                    ₹{(docFormData.totalInvoiceValueFc * docFormData.exchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Section 4: Customs Exemption & Status */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    BoE Assessment Status
                  </label>
                  <select
                    value={docFormData.boeStatus}
                    onChange={(e) => setDocFormData({ ...docFormData, boeStatus: e.target.value as ImportDocumentStatus })}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Filed">Filed / In Customs Assessment</option>
                    <option value="Cleared">Cleared by Customs</option>
                    <option value="Rejected">Rejected / Discrepancy</option>
                  </select>
                </div>

                {docFormData.boeStatus === 'Cleared' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Customs Clearance Date
                    </label>
                    <input
                      type="date"
                      value={docFormData.customsClearanceDate}
                      onChange={(e) => setDocFormData({ ...docFormData, customsClearanceDate: e.target.value })}
                      className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Customs Duty % Saved
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={docFormData.customsDutyPercent}
                    onChange={(e) => setDocFormData({ ...docFormData, customsDutyPercent: parseFloat(e.target.value) || 0 })}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Section 5: Raw Material Line Items with SION linkage */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-purple-600" />
                    <h4 className="font-bold text-sm text-slate-900">Inward Raw Material Line Items & SION Yield</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormLineItems([
                        ...formLineItems,
                        {
                          hsCode: '38091010',
                          materialDescription: 'Additive MB',
                          quantityReceived: 100,
                          uom: 'KGS',
                          unitPriceFc: 2.0,
                          sionNormId: 'SION-TX-01',
                          expectedOutputQty: 120,
                          expectedOutputUom: 'KGS',
                        },
                      ])
                    }
                    className="text-xs text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                {formLineItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Material Description
                      </label>
                      <input
                        type="text"
                        value={item.materialDescription}
                        onChange={(e) => {
                          const copy = [...formLineItems];
                          copy[idx].materialDescription = e.target.value;
                          setFormLineItems(copy);
                        }}
                        required
                        className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        HS Code
                      </label>
                      <input
                        type="text"
                        value={item.hsCode}
                        onChange={(e) => {
                          const copy = [...formLineItems];
                          copy[idx].hsCode = e.target.value;
                          setFormLineItems(copy);
                        }}
                        className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        Qty Inwarded
                      </label>
                      <input
                        type="number"
                        value={item.quantityReceived}
                        onChange={(e) => {
                          const copy = [...formLineItems];
                          const q = parseFloat(e.target.value) || 0;
                          copy[idx].quantityReceived = q;
                          const norm = sionNorms.find((n) => n.id === copy[idx].sionNormId);
                          if (norm) {
                            copy[idx].expectedOutputQty = Number((q * norm.yieldRatio).toFixed(2));
                          }
                          setFormLineItems(copy);
                        }}
                        className="w-full py-1.5 px-2.5 text-xs bg-white border border-slate-300 rounded-lg font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                        SION Norm
                      </label>
                      <select
                        value={item.sionNormId}
                        onChange={(e) => {
                          const copy = [...formLineItems];
                          const sId = e.target.value;
                          copy[idx].sionNormId = sId;
                          const norm = sionNorms.find((n) => n.id === sId);
                          if (norm) {
                            copy[idx].expectedOutputQty = Number((copy[idx].quantityReceived * norm.yieldRatio).toFixed(2));
                            copy[idx].expectedOutputUom = norm.finishedGoodUom || 'KGS';
                          }
                          setFormLineItems(copy);
                        }}
                        className="w-full py-1.5 px-2 text-xs bg-white border border-slate-300 rounded-lg font-semibold text-purple-900"
                      >
                        <option value="">No SION</option>
                        {sionNorms.map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.normCode} ({n.yieldRatio}x yield)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">Expected Yield</span>
                        <span className="text-xs font-bold text-purple-700">
                          {item.expectedOutputQty} {item.expectedOutputUom || 'KGS'}
                        </span>
                      </div>
                      {formLineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setFormLineItems(formLineItems.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsNewDocModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{editingDoc ? 'Update Bill of Entry' : 'Create Bill of Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: LOG MATERIAL CONSUMPTION (WITH SION CALCULATION) */}
      {/* =================================================================== */}
      {consumptionModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="bg-purple-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-purple-300" />
                <h3 className="font-bold text-base">Log Material Consumption in Production</h3>
              </div>
              <button
                onClick={() => setConsumptionModalItem(null)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveConsumption} className="p-6 space-y-4">
              {/* Material & Stock Status Header */}
              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 space-y-1.5 text-xs text-purple-900">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-purple-950">
                    {consumptionModalItem.item.materialDescription}
                  </span>
                  <span className="font-mono text-purple-700">HS: {consumptionModalItem.item.hsCode}</span>
                </div>
                <div className="flex items-center justify-between text-purple-800">
                  <span>BoE: #{consumptionModalItem.doc.importBillNumber}</span>
                  <span>Licence #{consumptionModalItem.doc.licenceNumber}</span>
                </div>
                <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between font-semibold">
                  <span>
                    Inward: {consumptionModalItem.item.quantityReceived} {consumptionModalItem.item.uom}
                  </span>
                  <span className="text-purple-950 font-bold">
                    Available Free Stock:{' '}
                    {Math.max(
                      0,
                      consumptionModalItem.item.quantityReceived -
                        (consumptionModalItem.item.consumptionTracking || []).reduce(
                          (sum, c) => sum + Number(c.quantityConsumed || 0),
                          0
                        )
                    )}{' '}
                    {consumptionModalItem.item.uom}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Consumption Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={consumptionFormData.consumptionDate}
                  onChange={(e) => setConsumptionFormData({ ...consumptionFormData, consumptionDate: e.target.value })}
                  required
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Production Batch Reference <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={consumptionFormData.productionBatchId}
                  onChange={(e) => setConsumptionFormData({ ...consumptionFormData, productionBatchId: e.target.value })}
                  required
                  placeholder="e.g. BATCH-2026-081"
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Raw Material Consumed ({consumptionModalItem.item.uom}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={consumptionFormData.quantityConsumed}
                    onChange={(e) => {
                      const qty = parseFloat(e.target.value) || 0;
                      let finishedQty = 0;
                      const norm = sionNorms.find((n) => n.id === consumptionModalItem.item.sionNormId);
                      if (norm) {
                        finishedQty = Number((qty * norm.yieldRatio).toFixed(2));
                      }
                      setConsumptionFormData({
                        ...consumptionFormData,
                        quantityConsumed: qty,
                        finishedGoodProducedQty: finishedQty,
                      });
                    }}
                    required
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg font-bold text-purple-900 focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Finished Goods Output (SION Yield)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={consumptionFormData.finishedGoodProducedQty}
                    onChange={(e) =>
                      setConsumptionFormData({
                        ...consumptionFormData,
                        finishedGoodProducedQty: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full py-2 px-3 text-sm bg-purple-50 border border-purple-300 rounded-lg font-bold text-purple-950 focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Finished Product Name / Export Item
                </label>
                <input
                  type="text"
                  value={consumptionFormData.finishedGoodId}
                  onChange={(e) => setConsumptionFormData({ ...consumptionFormData, finishedGoodId: e.target.value })}
                  placeholder="e.g. Additive Masterbatch Compound"
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Notes & Process Line
                </label>
                <textarea
                  value={consumptionFormData.notes}
                  onChange={(e) => setConsumptionFormData({ ...consumptionFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConsumptionModalItem(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Record Consumption</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: GOODS RECEIPT NOTE (GRN) INSPECTOR */}
      {/* =================================================================== */}
      {grnModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Warehouse className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-base">Warehouse Inward & GRN</h3>
              </div>
              <button
                onClick={() => setGrnModalDoc(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrn} className="p-6 space-y-4">
              <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                BoE Reference: <span className="font-mono font-bold text-slate-800">{grnModalDoc.importBillNumber}</span> (Supplier: {grnModalDoc.supplierName})
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  GRN Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={grnFormData.grnNumber}
                  onChange={(e) => setGrnFormData({ ...grnFormData, grnNumber: e.target.value })}
                  required
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Receipt Date
                  </label>
                  <input
                    type="date"
                    value={grnFormData.receiptDate}
                    onChange={(e) => setGrnFormData({ ...grnFormData, receiptDate: e.target.value })}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    GRN Status
                  </label>
                  <select
                    value={grnFormData.status}
                    onChange={(e) => setGrnFormData({ ...grnFormData, status: e.target.value as GrnStatus })}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="Approved">Approved</option>
                    <option value="Received">Received</option>
                    <option value="Inspected">Inspected</option>
                    <option value="Quarantined">Quarantined</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Warehouse Bay Location
                </label>
                <input
                  type="text"
                  value={grnFormData.warehouseLocation}
                  onChange={(e) => setGrnFormData({ ...grnFormData, warehouseLocation: e.target.value })}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Damage Noted / Remarks
                </label>
                <input
                  type="text"
                  value={grnFormData.damageNoted}
                  onChange={(e) => setGrnFormData({ ...grnFormData, damageNoted: e.target.value })}
                  className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setGrnModalDoc(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors shadow-sm"
                >
                  {isSaving ? 'Saving...' : 'Save GRN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: FULL BoE INSPECT & CONSUMPTION AUDIT TRAIL */}
      {/* =================================================================== */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-scaleUp">
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-lg">
                  Bill of Entry Details & Audit: #{inspectingDoc.importBillNumber}
                </h3>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Licence & File:</span>
                  <span className="font-bold text-slate-900 text-sm">{inspectingDoc.licenceNumber}</span>
                  <span className="text-sky-600 block font-medium">File #{inspectingDoc.companyFileNumber}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Foreign Vendor:</span>
                  <span className="font-bold text-slate-900 text-sm">{inspectingDoc.supplierName}</span>
                  <span className="text-slate-600 block">{inspectingDoc.supplierCountry}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">CIF Invoice Value:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{Number(inspectingDoc.totalInvoiceValueInr).toLocaleString('en-IN')}
                  </span>
                  <span className="text-slate-500 font-mono block">
                    {inspectingDoc.importCurrency} {Number(inspectingDoc.totalInvoiceValueFc).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Customs Assessment:</span>
                  <span
                    className={`inline-block font-bold text-xs px-2 py-0.5 rounded-full mt-1 ${
                      inspectingDoc.boeStatus === 'Cleared'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {inspectingDoc.boeStatus}
                  </span>
                  {inspectingDoc.customsClearanceDate && (
                    <span className="text-[11px] text-slate-500 block font-mono">
                      Cleared: {inspectingDoc.customsClearanceDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-purple-600" />
                  <span>Inward Line Items & SION Yield Mapping</span>
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-100 text-slate-700 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">HS Code</th>
                        <th className="py-2.5 px-3 text-right">Inward Qty</th>
                        <th className="py-2.5 px-3">SION Norm</th>
                        <th className="py-2.5 px-3 text-right">Expected Yield</th>
                        <th className="py-2.5 px-3 text-right">Consumed</th>
                        <th className="py-2.5 px-3 text-right">Free Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(inspectingDoc.lineItems || []).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{item.materialDescription}</td>
                          <td className="py-2.5 px-3 font-mono">{item.hsCode}</td>
                          <td className="py-2.5 px-3 text-right font-medium">
                            {item.quantityReceived} {item.uom}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-purple-700 font-semibold">
                            {item.sionNormId || 'Standard'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                            {item.expectedOutputQty} {item.expectedOutputUom || item.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-purple-700">
                            {item.totalConsumedQty || 0} {item.uom}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                            {item.remainingInventoryQty || 0} {item.uom}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Consumption History Timeline */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Factory className="w-4 h-4 text-purple-600" />
                  <span>Production Consumption Batch History</span>
                </h4>
                {((inspectingDoc.lineItems || []).flatMap((i) => i.consumptionTracking || [])).length === 0 ? (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500 italic">
                    No consumption logged yet for this Bill of Entry.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(inspectingDoc.lineItems || []).flatMap((item) =>
                      (item.consumptionTracking || []).map((c) => (
                        <div
                          key={c.id}
                          className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-purple-950 font-mono">
                              Batch #{c.productionBatchId}
                            </span>
                            <span className="text-purple-700 ml-2">Date: {c.consumptionDate}</span>
                            <div className="text-slate-600 mt-0.5">{c.notes}</div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-purple-900 block">
                              -{c.quantityConsumed} {item.uom} Consumed
                            </span>
                            <span className="text-emerald-700 font-semibold text-[11px] block">
                              +{c.finishedGoodProducedQty} {item.expectedOutputUom || item.uom} Output Produced
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setInspectingDoc(null)}
                  className="px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Landmark,
  Building2,
  Trash2,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileCheck2,
  BadgeAlert,
  ArrowUpRight,
  Database,
  Upload,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  DollarSign,
  Check,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Layers,
} from 'lucide-react';
import { 
  ShippingBill, 
  ShippingBillItem, 
  BrcTracking, 
  BrcStatus,
  AdvanceLicence, 
  CurrencyCode,
  PaginationMeta,
  ShippingBillQueryParams
} from '../types';
import { 
  fetchShippingBillsFromDB, 
  saveShippingBillToDB, 
  updateShippingBillInDB, 
  deleteShippingBillFromDB, 
  updateBrcTrackingInDB,
  fetchLicencesFromDB 
} from '../lib/supabase';
import { ExportExcelUploaderModal } from './ExportExcelUploaderModal';
import { ExportPdfUploaderModal } from './ExportPdfUploaderModal';

const CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'JPY', 'CAD', 'SGD'];

type DatePreset = 'all' | 'today' | '7days' | '30days' | '90days' | '1year' | 'custom';
type FobPreset = 'all' | 'under10k' | '10k-50k' | '50k-100k' | 'above100k' | 'custom';

export const ExportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'shipping-bills' | 'brc-tracking'>('shipping-bills');
  
  // Data states
  const [shippingBills, setShippingBills] = useState<ShippingBill[]>([]);
  const [allShippingBillsForMetrics, setAllShippingBillsForMetrics] = useState<ShippingBill[]>([]);
  const [licences, setLicences] = useState<AdvanceLicence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingTable, setIsFetchingTable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [databaseSource, setDatabaseSource] = useState<string>('local_storage');
  const [successBanner, setSuccessBanner] = useState<string>('');
  const [queryTimeMs, setQueryTimeMs] = useState<number>(0);

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
  const [jumpPageInput, setJumpPageInput] = useState<string>('');

  // Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLicenceIds, setSelectedLicenceIds] = useState<string[]>([]);
  
  // Date Filtering
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // FOB Value Filtering
  const [fobPreset, setFobPreset] = useState<FobPreset>('all');
  const [fobMinUSD, setFobMinUSD] = useState<string>('');
  const [fobMaxUSD, setFobMaxUSD] = useState<string>('');

  // Sorting State
  const [sortBy, setSortBy] = useState<string>('shipping_bill_date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI Panels
  const [isLicenceDropdownOpen, setIsLicenceDropdownOpen] = useState(false);
  const [licenceSearchQuery, setLicenceSearchQuery] = useState('');
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const licenceDropdownRef = useRef<HTMLDivElement>(null);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isBrcModalOpen, setIsBrcModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Active targets
  const [selectedBill, setSelectedBill] = useState<ShippingBill | null>(null);
  const [editingBill, setEditingBill] = useState<ShippingBill | null>(null);
  const [deletingBill, setDeletingBill] = useState<ShippingBill | null>(null);
  const [targetBrcBill, setTargetBrcBill] = useState<ShippingBill | null>(null);

  // Form states - Create Shipping Bill
  const [selectedLicenceId, setSelectedLicenceId] = useState('');
  const [shippingBillNumber, setShippingBillNumber] = useState('');
  const [shippingBillDate, setShippingBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [portOfExport, setPortOfExport] = useState('INNSA1 - Nhava Sheva');
  const [portCode, setPortCode] = useState('INNSA1');
  const [leoDate, setLeoDate] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('United States');
  const [buyerName, setBuyerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(83.50);
  const [billStatus, setBillStatus] = useState<ShippingBill['status']>('Exported');
  const [remarks, setRemarks] = useState('');

  // Line items state
  const [lineItems, setLineItems] = useState<Array<{
    id: string;
    itemSrNo: string;
    itcHsCode: string;
    productDescription: string;
    quantity: number;
    uom: string;
    fobValueFc: number;
    fobValueInr: number;
  }>>([
    {
      id: 'item-1',
      itemSrNo: '1',
      itcHsCode: '52081190',
      productDescription: '100% Cotton Woven Dyed & Printed Finished Fabric',
      quantity: 5000,
      uom: 'MTR',
      fobValueFc: 12500,
      fobValueInr: 1043750,
    }
  ]);

  // BRC Realization quick modal form
  const [brcNumber, setBrcNumber] = useState('');
  const [brcStatus, setBrcStatus] = useState<BrcStatus>('Realized');
  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split('T')[0]);
  const [realizedDate, setRealizedDate] = useState(new Date().toISOString().split('T')[0]);
  const [realizedAmountFc, setRealizedAmountFc] = useState<number>(0);
  const [realizedExchangeRate, setRealizedExchangeRate] = useState<number>(83.50);
  const [realizedAmountInr, setRealizedAmountInr] = useState<number>(0);
  const [bankName, setBankName] = useState('State Bank of India');
  const [bankBranch, setBankBranch] = useState('Corporate Accounts Group, Mumbai');
  const [ifscCode, setIfscCode] = useState('SBIN0009999');
  const [adCode, setAdCode] = useState('0210045');
  const [eBrcDocNumber, setEBrcDocNumber] = useState('');
  const [brcRemarks, setBrcRemarks] = useState('');

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (licenceDropdownRef.current && !licenceDropdownRef.current.contains(event.target as Node)) {
        setIsLicenceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle Date Presets
  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'today') {
      const todayStr = formatDate(today);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setDateFrom(formatDate(past));
      setDateTo(formatDate(today));
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setDateFrom(formatDate(past));
      setDateTo(formatDate(today));
    } else if (preset === '90days') {
      const past = new Date();
      past.setDate(today.getDate() - 90);
      setDateFrom(formatDate(past));
      setDateTo(formatDate(today));
    } else if (preset === '1year') {
      const past = new Date();
      past.setDate(today.getDate() - 365);
      setDateFrom(formatDate(past));
      setDateTo(formatDate(today));
    }
    setCurrentPage(1);
  };

  // Handle FOB Presets
  const applyFobPreset = (preset: FobPreset) => {
    setFobPreset(preset);
    if (preset === 'all') {
      setFobMinUSD('');
      setFobMaxUSD('');
    } else if (preset === 'under10k') {
      setFobMinUSD('');
      setFobMaxUSD('10000');
    } else if (preset === '10k-50k') {
      setFobMinUSD('10000');
      setFobMaxUSD('50000');
    } else if (preset === '50k-100k') {
      setFobMinUSD('50000');
      setFobMaxUSD('100000');
    } else if (preset === 'above100k') {
      setFobMinUSD('100000');
      setFobMaxUSD('');
    }
    setCurrentPage(1);
  };

  // Load initial Licences & Metrics overview
  const loadInitialOverview = async () => {
    setIsLoading(true);
    try {
      const [licRes, allBillsRes] = await Promise.all([
        fetchLicencesFromDB(),
        fetchShippingBillsFromDB({ limit: 'all' })
      ]);
      setLicences(licRes.licences || []);
      setAllShippingBillsForMetrics(allBillsRes.bills || []);
      setIsSupabaseConnected(allBillsRes.isDb);
      setDatabaseSource(allBillsRes.source);
    } catch (e) {
      console.error('Error loading initial exports overview:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialOverview();
  }, []);

  // Fetch paginated data whenever filters, sort or page change
  const fetchPaginatedData = async () => {
    setIsFetchingTable(true);
    try {
      const queryParams: ShippingBillQueryParams = {
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
        searchText: debouncedSearch || undefined,
        licenceId: selectedLicenceIds.length > 0 ? selectedLicenceIds : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        fobMinUSD: fobMinUSD ? parseFloat(fobMinUSD) : undefined,
        fobMaxUSD: fobMaxUSD ? parseFloat(fobMaxUSD) : undefined,
      };

      if (statusFilter !== 'All') {
        if (statusFilter === 'Realized') {
          queryParams.brcStatus = 'Realized';
        } else if (statusFilter === 'Pending') {
          queryParams.brcStatus = ['Not Received', 'Received'];
        } else if (statusFilter === 'Received') {
          queryParams.brcStatus = 'Received';
        } else if (statusFilter === 'Not Received') {
          queryParams.brcStatus = 'Not Received';
        }
      }

      const res = await fetchShippingBillsFromDB(queryParams);
      setShippingBills(res.bills || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
      setQueryTimeMs(res.queryTimeMs || 0);
      setIsSupabaseConnected(res.isDb);
      setDatabaseSource(res.source);
    } catch (err) {
      console.error('Failed to fetch paginated shipping bills:', err);
    } finally {
      setIsFetchingTable(false);
    }
  };

  useEffect(() => {
    fetchPaginatedData();
  }, [
    currentPage,
    pageSize,
    sortBy,
    sortOrder,
    debouncedSearch,
    statusFilter,
    selectedLicenceIds,
    dateFrom,
    dateTo,
    fobMinUSD,
    fobMaxUSD,
  ]);

  // Reset page to 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, selectedLicenceIds, dateFrom, dateTo, fobMinUSD, fobMaxUSD]);

  // Filter licences with unfulfilled export obligations (or active)
  const eligibleLicences = useMemo(() => {
    return licences.filter((lic) => {
      return lic.licenceStatus !== 'Closed' && lic.licenceStatus !== 'Cancelled';
    });
  }, [licences]);

  // Filtered licences list for multi-select dropdown search
  const filteredLicenceOptions = useMemo(() => {
    if (!licenceSearchQuery.trim()) return eligibleLicences;
    const q = licenceSearchQuery.toLowerCase();
    return eligibleLicences.filter(
      (lic) =>
        lic.licenceNumber.toLowerCase().includes(q) ||
        lic.fileNumber.toLowerCase().includes(q)
    );
  }, [eligibleLicences, licenceSearchQuery]);

  // Handle Licence Checkbox Toggle
  const toggleLicenceSelection = (licId: string) => {
    setSelectedLicenceIds((prev) =>
      prev.includes(licId) ? prev.filter((id) => id !== licId) : [...prev, licId]
    );
  };

  const selectAllLicences = () => {
    setSelectedLicenceIds(eligibleLicences.map((l) => l.id));
  };

  const clearAllLicences = () => {
    setSelectedLicenceIds([]);
  };

  // Header column click sort toggle
  const handleSortToggle = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setStatusFilter('All');
    setSelectedLicenceIds([]);
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setFobPreset('all');
    setFobMinUSD('');
    setFobMaxUSD('');
    setSortBy('shipping_bill_date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  // Active filters count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (statusFilter !== 'All') count++;
    if (selectedLicenceIds.length > 0) count++;
    if (dateFrom || dateTo) count++;
    if (fobMinUSD || fobMaxUSD) count++;
    return count;
  }, [debouncedSearch, statusFilter, selectedLicenceIds, dateFrom, dateTo, fobMinUSD, fobMaxUSD]);

  // Export Filtered Records as CSV
  const handleExportCSV = async () => {
    setIsExportingCsv(true);
    try {
      const queryParams: ShippingBillQueryParams = {
        limit: 'all',
        sortBy,
        sortOrder,
        searchText: debouncedSearch || undefined,
        licenceId: selectedLicenceIds.length > 0 ? selectedLicenceIds : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        fobMinUSD: fobMinUSD ? parseFloat(fobMinUSD) : undefined,
        fobMaxUSD: fobMaxUSD ? parseFloat(fobMaxUSD) : undefined,
      };

      if (statusFilter !== 'All') {
        if (statusFilter === 'Realized') queryParams.brcStatus = 'Realized';
        else if (statusFilter === 'Pending') queryParams.brcStatus = ['Not Received', 'Received'];
        else queryParams.brcStatus = statusFilter;
      }

      const res = await fetchShippingBillsFromDB(queryParams);
      const exportBills = res.bills || [];

      if (exportBills.length === 0) {
        alert('No shipping bills to export with the current filter criteria.');
        return;
      }

      const headers = [
        'Shipping Bill Number',
        'Shipping Bill Date',
        'Port of Export',
        'Port Code',
        'LEO Date',
        'Advance Licence Number',
        'Company File Number',
        'Buyer Name',
        'Destination Country',
        'Invoice Number',
        'Invoice Date',
        'Currency',
        'Exchange Rate',
        'Total FOB (FC)',
        'Total FOB (INR)',
        'Status',
        'BRC Status',
        'BRC Number',
        'BRC Realized Date',
        'Realized FC',
        'Realized INR',
        'Bank Name',
        'IFSC Code',
        'AD Code',
        'Line Items Count',
        'Remarks',
      ];

      const rows = exportBills.map((b) => [
        `"${b.shippingBillNumber}"`,
        `"${b.shippingBillDate}"`,
        `"${b.portOfExport}"`,
        `"${b.portCode || ''}"`,
        `"${b.leoDate || ''}"`,
        `"${b.licenceNumber}"`,
        `"${b.companyFileNumber}"`,
        `"${(b.buyerName || '').replace(/"/g, '""')}"`,
        `"${b.destinationCountry}"`,
        `"${b.invoiceNumber || ''}"`,
        `"${b.invoiceDate || ''}"`,
        `"${b.currency}"`,
        b.exchangeRate || 83.5,
        b.totalFobFc || 0,
        b.totalFobInr || 0,
        `"${b.status}"`,
        `"${b.brcTracking?.brcStatus || 'Not Received'}"`,
        `"${b.brcTracking?.brcNumber || ''}"`,
        `"${b.brcTracking?.realizedDate || ''}"`,
        b.brcTracking?.realizedAmountFc || 0,
        b.brcTracking?.realizedAmountInr || 0,
        `"${(b.brcTracking?.bankName || '').replace(/"/g, '""')}"`,
        `"${b.brcTracking?.ifscCode || ''}"`,
        `"${b.brcTracking?.adCode || ''}"`,
        b.items?.length || 0,
        `"${(b.remarks || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `shipping_bills_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccessBanner(`Exported ${exportBills.length} shipping bills to CSV successfully.`);
      setTimeout(() => setSuccessBanner(''), 5000);
    } catch (err: any) {
      alert(`CSV Export Error: ${err.message}`);
    } finally {
      setIsExportingCsv(false);
    }
  };

  // When selected licence changes in create modal, auto-fill company file number and default currency
  useEffect(() => {
    if (selectedLicenceId) {
      const found = licences.find((l) => l.id === selectedLicenceId);
      if (found) {
        if (found.exportForeignCurrency) {
          setCurrency(found.exportForeignCurrency as CurrencyCode);
        }
        if (found.exportExchangeRate && found.exportExchangeRate > 0) {
          setExchangeRate(found.exportExchangeRate);
        } else if (found.forexExportRate && Number(found.forexExportRate) > 0) {
          setExchangeRate(Number(found.forexExportRate));
        }

        if (found.exportItems && found.exportItems.length > 0) {
          const first = found.exportItems[0];
          setLineItems([
            {
              id: `item-${Date.now()}`,
              itemSrNo: '1',
              itcHsCode: first.itcHsCode || '52081190',
              productDescription: first.productDescription || '',
              quantity: first.quantity || 1000,
              uom: first.uom || 'MTR',
              fobValueFc: first.fobValueFc || 2500,
              fobValueInr: first.fobValueInr || 208750,
            }
          ]);
        }
      }
    }
  }, [selectedLicenceId, licences]);

  // Auto calculate totals for line items
  const totalFobFc = useMemo(() => {
    return lineItems.reduce((acc, curr) => acc + (Number(curr.fobValueFc) || 0), 0);
  }, [lineItems]);

  const totalFobInr = useMemo(() => {
    return lineItems.reduce((acc, curr) => acc + (Number(curr.fobValueInr) || 0), 0);
  }, [lineItems]);

  const updateLineItem = (index: number, field: string, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      
      if (field === 'fobValueFc' || field === 'quantity') {
        const rate = exchangeRate || 83.50;
        item.fobValueInr = Number((Number(item.fobValueFc || 0) * rate).toFixed(4));
      }
      updated[index] = item;
      return updated;
    });
  };

  const addLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        itemSrNo: String(prev.length + 1),
        itcHsCode: '52081190',
        productDescription: 'Textile Finished Fabrics / Cotton Piece Goods',
        quantity: 1000,
        uom: 'MTR',
        fobValueFc: 2500,
        fobValueInr: Number((2500 * (exchangeRate || 83.50)).toFixed(4)),
      }
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Save New Shipping Bill
  const handleCreateShippingBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLicenceId) {
      alert('Please select an Advance Licence.');
      return;
    }
    if (!shippingBillNumber.trim()) {
      alert('Please enter a Shipping Bill Number.');
      return;
    }

    const lic = licences.find((l) => l.id === selectedLicenceId);
    if (!lic) return;

    setIsSaving(true);
    try {
      const payload: Partial<ShippingBill> = {
        licenceId: lic.id,
        licenceNumber: lic.licenceNumber,
        companyFileNumber: lic.fileNumber,
        shippingBillNumber: shippingBillNumber.trim(),
        shippingBillDate,
        portOfExport,
        portCode,
        leoDate: leoDate || undefined,
        destinationCountry,
        buyerName,
        invoiceNumber,
        invoiceDate: invoiceDate || undefined,
        currency,
        exchangeRate: Number(exchangeRate),
        totalFobFc: Number(totalFobFc.toFixed(4)),
        totalFobInr: Number(totalFobInr.toFixed(4)),
        status: billStatus,
        remarks,
        items: lineItems.map((itm, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          shippingBillId: '',
          itemSrNo: itm.itemSrNo || String(idx + 1),
          itcHsCode: itm.itcHsCode,
          productDescription: itm.productDescription,
          quantity: Number(itm.quantity),
          uom: itm.uom,
          fobValueCurrency: currency,
          fobValueFc: Number(itm.fobValueFc),
          exchangeRate: Number(exchangeRate),
          fobValueInr: Number(itm.fobValueInr),
        })),
        brcTracking: {
          id: `BRC-${Date.now()}`,
          shippingBillId: '',
          brcStatus: 'Not Received',
          currency,
          realizedAmountFc: 0,
          realizedAmountInr: 0,
        }
      };

      const saved = await saveShippingBillToDB(payload);
      setIsCreateModalOpen(false);
      setSuccessBanner(`Shipping Bill ${saved.shippingBillNumber} logged successfully and mapped to Licence ${saved.licenceNumber}.`);
      setTimeout(() => setSuccessBanner(''), 6000);
      
      // Refresh paginated data & metrics
      fetchPaginatedData();
      loadInitialOverview();

      // Reset form
      setShippingBillNumber('');
      setBuyerName('');
      setInvoiceNumber('');
      setRemarks('');
    } catch (err: any) {
      alert(`Failed to save Shipping Bill: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Open BRC realization modal
  const openBrcModal = (bill: ShippingBill) => {
    setTargetBrcBill(bill);
    const existing = bill.brcTracking;
    if (existing) {
      setBrcNumber(existing.brcNumber || `eBRC/${new Date().getFullYear()}/${bill.shippingBillNumber}`);
      setBrcStatus(existing.brcStatus || 'Realized');
      setReceivedDate(existing.receivedDate || new Date().toISOString().split('T')[0]);
      setRealizedDate(existing.realizedDate || new Date().toISOString().split('T')[0]);
      setRealizedAmountFc(existing.realizedAmountFc && existing.realizedAmountFc > 0 ? existing.realizedAmountFc : bill.totalFobFc);
      setRealizedExchangeRate(existing.realizedExchangeRate || bill.exchangeRate || 83.50);
      setRealizedAmountInr(existing.realizedAmountInr && existing.realizedAmountInr > 0 ? existing.realizedAmountInr : bill.totalFobInr);
      setBankName(existing.bankName || 'State Bank of India');
      setBankBranch(existing.bankBranch || 'Corporate Accounts Group, Mumbai');
      setIfscCode(existing.ifscCode || 'SBIN0009999');
      setAdCode(existing.adCode || '0210045');
      setEBrcDocNumber(existing.eBrcDocumentNumber || `IRN-${Date.now().toString().slice(-6)}`);
      setBrcRemarks(existing.remarks || 'Foreign inward remittance fully realized and matched.');
    } else {
      setBrcNumber(`eBRC/${new Date().getFullYear()}/${bill.shippingBillNumber}`);
      setBrcStatus('Realized');
      setReceivedDate(new Date().toISOString().split('T')[0]);
      setRealizedDate(new Date().toISOString().split('T')[0]);
      setRealizedAmountFc(bill.totalFobFc);
      setRealizedExchangeRate(bill.exchangeRate);
      setRealizedAmountInr(bill.totalFobInr);
      setBankName('State Bank of India');
      setBankBranch('Corporate Accounts Group, Mumbai');
      setIfscCode('SBIN0009999');
      setAdCode('0210045');
      setEBrcDocNumber(`IRN-${Date.now().toString().slice(-6)}`);
      setBrcRemarks('Foreign inward remittance credited via Swift Nostro.');
    }
    setIsBrcModalOpen(true);
  };

  // Submit BRC update & trigger auto-obligation recalculation
  const handleSaveBrc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBrcBill) return;

    setIsSaving(true);
    try {
      const payload: Partial<BrcTracking> = {
        shippingBillId: targetBrcBill.id,
        brcNumber,
        brcStatus,
        receivedDate: brcStatus !== 'Not Received' ? receivedDate : undefined,
        realizedDate: brcStatus === 'Realized' ? realizedDate : undefined,
        currency: targetBrcBill.currency,
        realizedAmountFc: Number(realizedAmountFc),
        realizedExchangeRate: Number(realizedExchangeRate),
        realizedAmountInr: Number((Number(realizedAmountFc) * Number(realizedExchangeRate)).toFixed(4)),
        bankName,
        bankBranch,
        ifscCode,
        adCode,
        eBrcDocumentNumber: eBrcDocNumber,
        remarks: brcRemarks,
      };

      await updateBrcTrackingInDB(targetBrcBill.id, payload);
      
      setIsBrcModalOpen(false);
      setSuccessBanner(`BRC status for SB #${targetBrcBill.shippingBillNumber} updated to '${brcStatus}'. Advance Licence Export Obligation auto-recalculated.`);
      setTimeout(() => setSuccessBanner(''), 6000);

      // Refresh data
      fetchPaginatedData();
      loadInitialOverview();
    } catch (err: any) {
      alert(`Failed to update BRC: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Shipping Bill
  const handleDeleteShippingBill = async () => {
    if (!deletingBill) return;
    try {
      await deleteShippingBillFromDB(deletingBill.id);
      setIsDeleteModalOpen(false);
      setDeletingBill(null);
      setSuccessBanner(`Shipping Bill #${deletingBill.shippingBillNumber} and associated BRC records deleted.`);
      setTimeout(() => setSuccessBanner(''), 5000);

      fetchPaginatedData();
      loadInitialOverview();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // Aggregate Metrics across all dataset
  const totalExportedInr = useMemo(() => {
    return allShippingBillsForMetrics.reduce((acc, b) => acc + (b.totalFobInr || 0), 0);
  }, [allShippingBillsForMetrics]);

  const totalRealizedInr = useMemo(() => {
    return allShippingBillsForMetrics.reduce((acc, b) => {
      if (b.brcTracking?.brcStatus === 'Realized') {
        return acc + (b.brcTracking.realizedAmountInr || b.totalFobInr || 0);
      }
      return acc;
    }, 0);
  }, [allShippingBillsForMetrics]);

  const pendingRealizationInr = totalExportedInr - totalRealizedInr;
  const totalBillsCount = allShippingBillsForMetrics.length;
  const realizedBillsCount = allShippingBillsForMetrics.filter((b) => b.brcTracking?.brcStatus === 'Realized').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Notice */}
      {successBanner && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-sm transition-all duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-medium">{successBanner}</p>
          </div>
          <button onClick={() => setSuccessBanner('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Export Transactions & Shipping Bills</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
              High Volume Optimized
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Log physical exports, track multi-currency FOB conversions with <code className="text-xs bg-slate-200 px-1 py-0.5 rounded font-mono">NUMERIC(18,4)</code> precision, manage e-BRC realization, and auto-fulfill Advance Licences.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => {
              fetchPaginatedData();
              loadInitialOverview();
            }}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh database records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading || isFetchingTable ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExportingCsv}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
            title="Export filtered records as CSV"
          >
            <Download className={`w-4 h-4 text-slate-500 ${isExportingCsv ? 'animate-bounce' : ''}`} />
            {isExportingCsv ? 'Exporting...' : 'Export CSV'}
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
            title="Upload Shipping Bill PDF (ICEGATE EDI)"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            Upload Shipping Bill PDF
          </button>

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
            title="Upload Shipping Bills & BRC Records from Excel / CSV"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            Import Excel
          </button>

          <button
            onClick={() => {
              if (eligibleLicences.length > 0) {
                setSelectedLicenceId(eligibleLicences[0].id);
              }
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Log Shipping Bill
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Exported (FOB)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{(totalExportedInr / 10000000).toFixed(2)} <span className="text-sm font-normal text-slate-500">Cr</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span>{totalBillsCount} Shipping Bills logged</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Realized via BRC</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            ₹{(totalRealizedInr / 10000000).toFixed(2)} <span className="text-sm font-normal text-slate-500">Cr</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {realizedBillsCount} of {totalBillsCount} bills realized ({totalBillsCount > 0 ? Math.round((realizedBillsCount / totalBillsCount) * 100) : 0}%)
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Realization</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            ₹{(pendingRealizationInr / 10000000).toFixed(2)} <span className="text-sm font-normal text-slate-500">Cr</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {totalBillsCount - realizedBillsCount} bills awaiting BRC
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Database Engine</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            {isSupabaseConnected ? 'PostgreSQL Indexed' : 'In-Memory Cache'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {queryTimeMs > 0 ? `Query latency: ${queryTimeMs}ms` : 'Sub-millisecond access'}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-8">
        <button
          onClick={() => setActiveTab('shipping-bills')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'shipping-bills'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Shipping Bills Register
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 font-bold">
            {pagination.totalRecords}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('brc-tracking')}
          className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'brc-tracking'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Landmark className="w-4 h-4" />
          BRC & e-BRC Realization Workflow
          <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${
            totalBillsCount - realizedBillsCount > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}>
            {totalBillsCount - realizedBillsCount} Pending
          </span>
        </button>
      </div>

      {/* SEARCH, SORT & ADVANCED FILTER CONTROLS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Main Filter Bar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Text Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Shipping Bill #, Licence #, File #, Buyer, Destination, Invoice #, Port..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {/* Advance Licences Multi-Select Dropdown */}
            <div className="relative" ref={licenceDropdownRef}>
              <button
                type="button"
                onClick={() => setIsLicenceDropdownOpen(!isLicenceDropdownOpen)}
                className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${
                  selectedLicenceIds.length > 0
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>
                  {selectedLicenceIds.length === 0
                    ? 'All Licences'
                    : `${selectedLicenceIds.length} Licence${selectedLicenceIds.length > 1 ? 's' : ''}`}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Licences Popover */}
              {isLicenceDropdownOpen && (
                <div className="absolute left-0 lg:right-0 lg:left-auto mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Advance Licences
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={selectAllLicences}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                      >
                        All
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={clearAllLicences}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter licences..."
                      value={licenceSearchQuery}
                      onChange={(e) => setLicenceSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {filteredLicenceOptions.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No matching licences found</p>
                    ) : (
                      filteredLicenceOptions.map((lic) => {
                        const isSelected = selectedLicenceIds.includes(lic.id);
                        return (
                          <label
                            key={lic.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                              isSelected ? 'bg-blue-50/80 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleLicenceSelection(lic.id)}
                              className="mt-0.5 h-3.5 w-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate">Lic: {lic.licenceNumber}</div>
                              <div className="text-[11px] text-slate-400 truncate">
                                File: {lic.fileNumber} • {lic.portOfRegistration || 'Nhava Sheva'}
                              </div>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Realization Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
            >
              <option value="All">All Realization Statuses</option>
              <option value="Realized">BRC Realized</option>
              <option value="Pending">BRC Pending</option>
              <option value="Received">BRC Received</option>
              <option value="Not Received">BRC Not Received</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={`${sortBy}:${sortOrder}`}
                onChange={(e) => {
                  const [col, ord] = e.target.value.split(':');
                  setSortBy(col);
                  setSortOrder(ord as 'asc' | 'desc');
                }}
                className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 font-medium"
              >
                <option value="shipping_bill_date:desc">Date (Newest First)</option>
                <option value="shipping_bill_date:asc">Date (Oldest First)</option>
                <option value="total_fob_fc:desc">FOB Foreign Currency (High to Low)</option>
                <option value="total_fob_fc:asc">FOB Foreign Currency (Low to High)</option>
                <option value="total_fob_inr:desc">Total FOB INR (High to Low)</option>
                <option value="total_fob_inr:asc">Total FOB INR (Low to High)</option>
                <option value="shipping_bill_number:asc">Shipping Bill # (A to Z)</option>
                <option value="shipping_bill_number:desc">Shipping Bill # (Z to A)</option>
                <option value="buyer_name:asc">Buyer Name (A to Z)</option>
                <option value="destination_country:asc">Destination Country (A to Z)</option>
              </select>
            </div>

            {/* Advanced Filters Toggle Button */}
            <button
              onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-lg transition-colors ${
                isAdvancedFilterOpen || (dateFrom || dateTo || fobMinUSD || fobMaxUSD)
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {(dateFrom || dateTo || fobMinUSD || fobMaxUSD) && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Filters (Date Range & FOB Value) */}
        {isAdvancedFilterOpen && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
            {/* Date Range Picker with Presets */}
            <div className="p-3 bg-slate-50/75 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Shipping Bill Date Range
                </span>
                {datePreset !== 'all' && (
                  <button
                    onClick={() => applyDatePreset('all')}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                  >
                    Reset Date
                  </button>
                )}
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: '7days', label: '7 Days' },
                    { id: '30days', label: '30 Days' },
                    { id: '90days', label: 'Quarter (90d)' },
                    { id: '1year', label: '1 Year' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyDatePreset(p.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      datePreset === p.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Explicit Date Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-0.5">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-0.5">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* FOB Value Filter with Presets */}
            <div className="p-3 bg-slate-50/75 rounded-lg border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  FOB Foreign Currency Range ($ USD)
                </span>
                {fobPreset !== 'all' && (
                  <button
                    onClick={() => applyFobPreset('all')}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700"
                  >
                    Reset FOB
                  </button>
                )}
              </div>

              {/* Preset Buttons */}
              <div className="flex items-center flex-wrap gap-1.5">
                {(
                  [
                    { id: 'all', label: 'All Values' },
                    { id: 'under10k', label: '< $10K' },
                    { id: '10k-50k', label: '$10K - $50K' },
                    { id: '50k-100k', label: '$50K - $100K' },
                    { id: 'above100k', label: '> $100K' },
                  ] as const
                ).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyFobPreset(p.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                      fobPreset === p.id
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Explicit Range Inputs */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Min FOB (USD)</label>
                  <input
                    type="number"
                    placeholder="Min $"
                    value={fobMinUSD}
                    onChange={(e) => {
                      setFobMinUSD(e.target.value);
                      setFobPreset('custom');
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 font-medium mb-0.5">Max FOB (USD)</label>
                  <input
                    type="number"
                    placeholder="Max $"
                    value={fobMaxUSD}
                    onChange={(e) => {
                      setFobMaxUSD(e.target.value);
                      setFobPreset('custom');
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-500 mr-1">Active Filters:</span>
            
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                <span>Search: "{debouncedSearch}"</span>
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedLicenceIds.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span>Licences: {selectedLicenceIds.length} selected</span>
                <button onClick={clearAllLicences} className="hover:text-indigo-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span>Status: {statusFilter}</span>
                <button onClick={() => setStatusFilter('All')} className="hover:text-emerald-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(dateFrom || dateTo) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                <span>Date: {dateFrom || 'Start'} → {dateTo || 'Today'}</span>
                <button onClick={() => applyDatePreset('all')} className="hover:text-amber-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {(fobMinUSD || fobMaxUSD) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                <span>FOB: ${fobMinUSD || '0'} - ${fobMaxUSD || '∞'}</span>
                <button onClick={() => applyFobPreset('all')} className="hover:text-purple-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 ml-auto flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          </div>
        )}
      </div>

      {/* Main Table Content */}
      {activeTab === 'shipping-bills' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSortToggle('shipping_bill_date')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Shipping Bill Info</span>
                      {sortBy === 'shipping_bill_date' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40" />
                      )}
                    </div>
                  </th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSortToggle('licence_number')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Advance Licence Linked</span>
                      {sortBy === 'licence_number' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                  </th>

                  <th
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSortToggle('destination_country')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Destination & Buyer</span>
                      {sortBy === 'destination_country' && (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                  </th>

                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSortToggle('total_fob_fc')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>FOB Foreign Currency</span>
                      {sortBy === 'total_fob_fc' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40" />
                      )}
                    </div>
                  </th>

                  <th className="py-3.5 px-4 text-right">Exchange Rate</th>

                  <th
                    className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSortToggle('total_fob_inr')}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Total FOB (INR)</span>
                      {sortBy === 'total_fob_inr' ? (
                        sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-600" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-40" />
                      )}
                    </div>
                  </th>

                  <th className="py-3.5 px-4 text-center">BRC Realization</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isFetchingTable ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-28 mb-1.5" /><div className="h-3 bg-slate-100 rounded w-20" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24 mb-1.5" /><div className="h-3 bg-slate-100 rounded w-16" /></td>
                      <td className="py-4 px-4"><div className="h-4 bg-slate-200 rounded w-24 mb-1.5" /><div className="h-3 bg-slate-100 rounded w-32" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-20 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-14 ml-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-4 bg-slate-200 rounded w-24 ml-auto" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-6 bg-slate-200 rounded-full w-20 mx-auto" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-6 bg-slate-200 rounded w-16 mx-auto" /></td>
                    </tr>
                  ))
                ) : shippingBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-14 text-center text-slate-400">
                      <FileSpreadsheet className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700 text-base">No Shipping Bills Found</p>
                      <p className="text-xs text-slate-400 mt-1 mb-4 max-w-md mx-auto">
                        {activeFilterCount > 0 
                          ? 'No shipping bills match the current filters. Try resetting search, date, or FOB parameters.' 
                          : 'Log a shipping bill manually or bulk upload via an Excel spreadsheet.'}
                      </p>
                      <div className="flex items-center justify-center gap-3">
                        {activeFilterCount > 0 ? (
                          <button
                            onClick={handleClearAllFilters}
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Reset All Filters
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsExcelModalOpen(true)}
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Upload Excel Spreadsheet
                            </button>
                            <button
                              onClick={() => {
                                if (eligibleLicences.length > 0) setSelectedLicenceId(eligibleLicences[0].id);
                                setIsCreateModalOpen(true);
                              }}
                              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Log Shipping Bill
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  shippingBills.map((bill) => {
                    const isRealized = bill.brcTracking?.brcStatus === 'Realized';
                    const isReceived = bill.brcTracking?.brcStatus === 'Received';

                    return (
                      <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="py-4 px-4 font-medium text-slate-900">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">#{bill.shippingBillNumber}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>Date: {bill.shippingBillDate}</span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]" title={bill.portOfExport}>Port: {bill.portOfExport}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="font-medium text-slate-800 flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs text-slate-700">
                              {bill.licenceNumber}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Company File: <span className="font-medium text-slate-700">{bill.companyFileNumber}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-slate-700">
                          <div className="font-medium">{bill.destinationCountry}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[160px]" title={bill.buyerName}>
                            {bill.buyerName || 'Unspecified Buyer'}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right font-medium text-slate-900 font-mono">
                          {bill.currency} {bill.totalFobFc?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </td>

                        <td className="py-4 px-4 text-right text-slate-600 font-mono text-xs">
                          ₹{bill.exchangeRate?.toFixed(4)}
                        </td>

                        <td className="py-4 px-4 text-right font-semibold text-slate-900 font-mono">
                          ₹{bill.totalFobInr?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-4 px-4 text-center">
                          {isRealized ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Realized
                            </span>
                          ) : isReceived ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Not Received
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setIsViewModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="View full Shipping Bill inspection"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openBrcModal(bill)}
                              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                              title="Update BRC realization workflow"
                            >
                              BRC
                            </button>

                            <button
                              onClick={() => {
                                setDeletingBill(bill);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete Shipping Bill"
                            >
                              <Trash2 className="w-4 h-4" />
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

          {/* PAGINATION CONTROLS */}
          <div className="px-4 py-3 bg-slate-50/75 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 select-none">
            {/* Left Summary */}
            <div className="flex items-center gap-2">
              <span>
                Showing{' '}
                <span className="font-semibold text-slate-800">
                  {pagination.totalRecords > 0 ? (currentPage - 1) * pageSize + 1 : 0}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-800">
                  {Math.min(currentPage * pageSize, pagination.totalRecords)}
                </span>{' '}
                of <span className="font-semibold text-slate-800">{pagination.totalRecords}</span> bills
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-400">
                {queryTimeMs > 0 ? `⚡ ${queryTimeMs}ms` : 'Instant'}
              </span>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1 || isFetchingTable}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>

              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || isFetchingTable}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
              </button>

              {/* Page Number Chips */}
              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }).map((_, idx) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[28px] h-7 px-2 text-xs font-semibold rounded-md transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={currentPage >= pagination.totalPages || isFetchingTable}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              </button>

              <button
                onClick={() => setCurrentPage(pagination.totalPages)}
                disabled={currentPage >= pagination.totalPages || isFetchingTable}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>

            {/* Rows Per Page & Jump to Page */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                </select>
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Go to:</span>
                  <input
                    type="number"
                    min={1}
                    max={pagination.totalPages}
                    placeholder={String(currentPage)}
                    value={jumpPageInput}
                    onChange={(e) => setJumpPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = parseInt(jumpPageInput, 10);
                        if (target >= 1 && target <= pagination.totalPages) {
                          setCurrentPage(target);
                          setJumpPageInput('');
                        }
                      }
                    }}
                    className="w-12 px-1.5 py-1 text-xs text-center bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* BRC Tracking & Realization View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bank Realisation Certificate (BRC / e-BRC) Ledger</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage bank realization status, FIRCs, Nostro credit vouchers, and auto-discharging export obligations.
              </p>
            </div>
            <div className="text-xs font-medium text-slate-600">
              Showing {shippingBills.length} of {pagination.totalRecords} BRC Records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Shipping Bill & Licence</th>
                  <th className="py-3.5 px-4">BRC / e-BRC Number</th>
                  <th className="py-3.5 px-4">Realization Status</th>
                  <th className="py-3.5 px-4">Realization Date</th>
                  <th className="py-3.5 px-4">Bank & Branch Details</th>
                  <th className="py-3.5 px-4 text-right">Realized Amount (FC)</th>
                  <th className="py-3.5 px-4 text-right">Realized Amount (INR)</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {shippingBills.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Landmark className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                      <p className="font-medium text-slate-600">No BRC Records Available</p>
                    </td>
                  </tr>
                ) : (
                  shippingBills.map((bill) => {
                    const brc = bill.brcTracking;
                    const isRealized = brc?.brcStatus === 'Realized';
                    const isReceived = brc?.brcStatus === 'Received';

                    return (
                      <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-4 font-medium text-slate-900">
                          <div className="font-semibold text-blue-600">SB #{bill.shippingBillNumber}</div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Licence: <span className="font-mono text-slate-700">{bill.licenceNumber}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-xs">
                          {brc?.brcNumber ? (
                            <span className="font-semibold text-slate-800">{brc.brcNumber}</span>
                          ) : (
                            <span className="text-slate-400 italic">Not Assigned</span>
                          )}
                          {brc?.eBrcDocumentNumber && (
                            <div className="text-[11px] text-slate-500 font-sans mt-0.5">
                              Doc: {brc.eBrcDocumentNumber}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          {isRealized ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Realized
                            </span>
                          ) : isReceived ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              Received
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                              Not Received
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-slate-700 text-xs">
                          {brc?.realizedDate ? (
                            <span className="font-medium">{brc.realizedDate}</span>
                          ) : (
                            <span className="text-slate-400 italic">Pending realization</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-xs text-slate-700">
                          <div className="font-medium text-slate-900">{brc?.bankName || 'State Bank of India'}</div>
                          <div className="text-slate-400 text-[11px]">
                            IFSC: {brc?.ifscCode || 'SBIN0009999'} • AD: {brc?.adCode || '0210045'}
                          </div>
                        </td>

                        <td className="py-4 px-4 text-right font-mono text-slate-900">
                          {isRealized ? (
                            <span className="font-semibold text-emerald-700">
                              {bill.currency} {brc?.realizedAmountFc?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-sans text-xs">Unrealized</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right font-mono font-semibold text-slate-900">
                          {isRealized ? (
                            <span className="text-emerald-700">
                              ₹{brc?.realizedAmountInr?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-sans text-xs">₹0.00</span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => openBrcModal(bill)}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
                          >
                            Update Status
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE SHIPPING BILL MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Log New Shipping Bill & Export Transaction</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Link to active Advance Licence, enter multi-currency invoice data, and initialize BRC tracking.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleCreateShippingBill} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SECTION 1: Advance Licence Selection */}
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    Step 1: Link Advance Licence (Unfulfilled Obligations Only)
                  </span>
                  <span className="text-xs font-medium text-blue-700">
                    {eligibleLicences.length} Active Licences Available
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Advance Licence <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedLicenceId}
                      onChange={(e) => setSelectedLicenceId(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium"
                    >
                      <option value="">-- Select Advance Licence --</option>
                      {eligibleLicences.map((lic) => (
                        <option key={lic.id} value={lic.id}>
                          Licence #{lic.licenceNumber} (File {lic.fileNumber}) - {lic.exportForeignCurrency || 'USD'}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Company File Number
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={licences.find((l) => l.id === selectedLicenceId)?.fileNumber || ''}
                      placeholder="Auto-filled from licence master"
                      className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Shipping Bill Header Details */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Step 2: Customs Shipping Bill & Port Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shipping Bill Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingBillNumber}
                      onChange={(e) => setShippingBillNumber(e.target.value)}
                      placeholder="e.g. 7891234"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Shipping Bill Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={shippingBillDate}
                      onChange={(e) => setShippingBillDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Port of Export <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={portOfExport}
                      onChange={(e) => setPortOfExport(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Destination Country <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={destinationCountry}
                      onChange={(e) => setDestinationCountry(e.target.value)}
                      placeholder="e.g. United States"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Overseas Buyer Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Global Apparel Imports LLC"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. EXP/2026/045"
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Multi-Currency FOB & Line Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Step 3: Line Items & Exact Multi-Currency FOB Calculation
                  </h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Product Item
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Invoice Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customs Exchange Rate (1 {currency} in INR)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={exchangeRate}
                      onChange={(e) => setExchangeRate(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    />
                  </div>
                </div>

                {/* Line Items Sub-table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Sr #</th>
                        <th className="py-2.5 px-3">ITC (HS) Code</th>
                        <th className="py-2.5 px-3">Product Description</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3">UOM</th>
                        <th className="py-2.5 px-3 text-right">FOB ({currency})</th>
                        <th className="py-2.5 px-3 text-right">FOB (INR)</th>
                        <th className="py-2.5 px-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {lineItems.map((item, index) => (
                        <tr key={item.id}>
                          <td className="py-2 px-3 font-mono">{index + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.itcHsCode}
                              onChange={(e) => updateLineItem(index, 'itcHsCode', e.target.value)}
                              className="w-24 px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.productDescription}
                              onChange={(e) => updateLineItem(index, 'productDescription', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', Number(e.target.value))}
                              className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-mono text-xs"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={item.uom}
                              onChange={(e) => updateLineItem(index, 'uom', e.target.value)}
                              className="w-16 px-2 py-1 border border-slate-300 rounded text-xs"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="number"
                              step="0.01"
                              value={item.fobValueFc}
                              onChange={(e) => updateLineItem(index, 'fobValueFc', Number(e.target.value))}
                              className="w-24 px-2 py-1 border border-slate-300 rounded text-right font-mono text-xs font-semibold text-blue-700"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            ₹{item.fobValueInr?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              disabled={lineItems.length <= 1}
                              className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Total FOB Summary Card */}
                <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
                  <div>
                    <span className="text-xs text-slate-400 uppercase tracking-wider block">Calculated Total FOB Value</span>
                    <span className="text-sm font-medium text-slate-200">
                      {lineItems.length} Line Item{lineItems.length > 1 ? 's' : ''} Included
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400 font-mono">
                      {currency} {totalFobFc.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                    </div>
                    <div className="text-sm font-semibold text-emerald-400 font-mono">
                      ₹{totalFobInr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                >
                  {isSaving ? 'Logging Shipping Bill...' : 'Save & Link to Licence'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BRC REALIZATION MODAL */}
      {isBrcModalOpen && targetBrcBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-emerald-600" />
                  Bank Realisation Certificate (BRC)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update Forex inward realization for SB #{targetBrcBill.shippingBillNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBrcModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBrc} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    BRC Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={brcStatus}
                    onChange={(e) => setBrcStatus(e.target.value as BrcStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-semibold text-slate-900"
                  >
                    <option value="Realized">Realized (Fulfilled)</option>
                    <option value="Received">Received (In Transit)</option>
                    <option value="Not Received">Not Received (Pending)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    e-BRC / BRC Document Number
                  </label>
                  <input
                    type="text"
                    value={brcNumber}
                    onChange={(e) => setBrcNumber(e.target.value)}
                    placeholder="e.g. eBRC/2026/001928"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Realization Date
                  </label>
                  <input
                    type="date"
                    value={realizedDate}
                    onChange={(e) => setRealizedDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Realized Amount ({targetBrcBill.currency})
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={realizedAmountFc}
                    onChange={(e) => setRealizedAmountFc(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Remarks / Inward Remittance Reference
                </label>
                <textarea
                  rows={2}
                  value={brcRemarks}
                  onChange={(e) => setBrcRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsBrcModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
                >
                  {isSaving ? 'Updating BRC...' : 'Save & Recalculate Obligation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SHIPPING BILL MODAL */}
      {isViewModalOpen && selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Shipping Bill Inspection #{selectedBill.shippingBillNumber}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Linked to Advance Licence #{selectedBill.licenceNumber} (File: {selectedBill.companyFileNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Top Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500">Shipping Bill Date</span>
                  <div className="font-semibold text-slate-900">{selectedBill.shippingBillDate}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500">Destination</span>
                  <div className="font-semibold text-slate-900">{selectedBill.destinationCountry}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500">FOB Foreign Currency</span>
                  <div className="font-semibold text-blue-700 font-mono">
                    {selectedBill.currency} {selectedBill.totalFobFc?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500">Total FOB (INR)</span>
                  <div className="font-semibold text-emerald-700 font-mono">
                    ₹{selectedBill.totalFobInr?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Line Items List */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Export Line Items</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Sr #</th>
                        <th className="py-2 px-3">ITC (HS) Code</th>
                        <th className="py-2 px-3">Product Description</th>
                        <th className="py-2 px-3 text-right">Quantity</th>
                        <th className="py-2 px-3 text-right">FOB ({selectedBill.currency})</th>
                        <th className="py-2 px-3 text-right">FOB (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(selectedBill.items || []).map((itm, idx) => (
                        <tr key={itm.id || idx}>
                          <td className="py-2 px-3 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-800">{itm.itcHsCode}</td>
                          <td className="py-2 px-3">{itm.productDescription}</td>
                          <td className="py-2 px-3 text-right font-mono">{itm.quantity} {itm.uom}</td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-blue-700">
                            {itm.fobValueFc?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            ₹{itm.fobValueInr?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsViewModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && deletingBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Shipping Bill</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to delete Shipping Bill <span className="font-semibold text-slate-900">#{deletingBill.shippingBillNumber}</span>? Line items and associated BRC tracking records will be cascade deleted, and the Advance Licence export obligation will be automatically recalculated.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteShippingBill}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXCEL / CSV BULK UPLOADER MODAL */}
      <ExportExcelUploaderModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        licences={licences}
        onImportSuccess={(importedCount, message) => {
          setSuccessBanner(message);
          fetchPaginatedData();
          loadInitialOverview();
          setTimeout(() => setSuccessBanner(''), 6000);
        }}
      />

      {/* PDF SHIPPING BILL UPLOADER MODAL */}
      <ExportPdfUploaderModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        licences={licences}
        onImportSuccess={(message) => {
          setSuccessBanner(message);
          fetchPaginatedData();
          loadInitialOverview();
          setTimeout(() => setSuccessBanner(''), 6000);
        }}
      />
    </div>
  );
};

export const ExportTransactionsPage = ExportsPage;

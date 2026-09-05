import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  X, 
  Filter,
  Upload,
  Sparkles,
  FileCheck,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle,
  Database,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react';
import { AdvanceLicence, ExportItem, ImportItem } from '../types';
import { 
  fetchLicencesFromDB, 
  saveLicenceToDB, 
  updateLicenceInDB, 
  deleteLicenceFromDB,
  getLicenceFromDB,
  getSupabase 
} from '../lib/supabase';

// Helper to extract company file number from filename (e.g., "725 Advance Authorisation..." -> "725")
const detectCompanyFileNumber = (name: string): string => {
  if (!name) return "";
  const clean = name.trim();
  const match = clean.match(/^([A-Za-z0-9\-_/]+)(?:\s+|_|-|\b)/);
  if (match && match[1]) {
    const token = match[1];
    const ignored = ["advance", "authorisation", "authorization", "dgft", "licence", "license", "doc", "document", "scan", "letter", "file"];
    if (!ignored.includes(token.toLowerCase())) {
      return token;
    }
  }
  return "";
};

export const LicencesPage: React.FC = () => {
  const [licences, setLicences] = useState<AdvanceLicence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);
  const [databaseSource, setDatabaseSource] = useState<string>('local_storage');
  const [apiError, setApiError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLicence, setSelectedLicence] = useState<AdvanceLicence | null>(null);
  const [editingLicence, setEditingLicence] = useState<AdvanceLicence | null>(null);
  const [deletingLicence, setDeletingLicence] = useState<AdvanceLicence | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState('');

  // Extraction loading state
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionSuccessMsg, setExtractionSuccessMsg] = useState('');

  // Form state for adding new licence
  const [fileNumber, setFileNumber] = useState('');
  const [isFileNumberFromFilename, setIsFileNumberFromFilename] = useState(false);
  const [dgftFileNumber, setDgftFileNumber] = useState('');
  const [dgftApplicationNumber, setDgftApplicationNumber] = useState('');
  const [licenceNumber, setLicenceNumber] = useState('');
  const [licenceDate, setLicenceDate] = useState('');
  const [importValidity, setImportValidity] = useState('');
  const [exportValidity, setExportValidity] = useState('');
  const [licensingAuthority, setLicensingAuthority] = useState('');
  const [licenceType, setLicenceType] = useState('Advance Authorisation for Duty Exemption');
  const [typeOfNorm, setTypeOfNorm] = useState('Standard SION (Textile)');
  const [exportForeignCurrency, setExportForeignCurrency] = useState('USD');
  const [importCurrency, setImportCurrency] = useState('USD');
  const [forexExportRate, setForexExportRate] = useState('');
  const [forexImportRate, setForexImportRate] = useState('');
  const [exportExchangeRate, setExportExchangeRate] = useState<number>(0);
  const [importExchangeRate, setImportExchangeRate] = useState<number>(0);
  
  const [fobValueInr, setFobValueInr] = useState('');
  const [fobValueFc, setFobValueFc] = useState('');
  const [cifValueInr, setCifValueInr] = useState('');
  const [cifValueFc, setCifValueFc] = useState('');
  const [cifValueInvalidatedInr, setCifValueInvalidatedInr] = useState('0.00');

  // Exact decimal numeric fields
  const [importLicenceValue, setImportLicenceValue] = useState<number>(0);
  const [bulkLicenceValue, setBulkLicenceValue] = useState<number>(0);
  const [exportObligationValue, setExportObligationValue] = useState<number>(0);
  const [fobValue, setFobValue] = useState<number>(0);
  const [cifValue, setCifValue] = useState<number>(0);
  const [dutySaved, setDutySaved] = useState<number>(0);
  const [exportObligationPeriod, setExportObligationPeriod] = useState('');
  const [licenceStatus, setLicenceStatus] = useState<AdvanceLicence['licenceStatus']>('Active');
  
  const [uploadedDoc, setUploadedDoc] = useState<{ name: string; uploadedAt: string; size?: string; dataUrl?: string } | null>(null);
  const [originalFilename, setOriginalFilename] = useState('');
  const [extractedFlag, setExtractedFlag] = useState(false);
  const [otherExtractedInfo, setOtherExtractedInfo] = useState<Array<{ label: string; value: string; page?: number }>>([]);
  const [showOtherInfo, setShowOtherInfo] = useState(false);

  // Edit form state
  const [editFileNumber, setEditFileNumber] = useState('');
  const [editDgftFileNumber, setEditDgftFileNumber] = useState('');
  const [editDgftApplicationNumber, setEditDgftApplicationNumber] = useState('');
  const [editLicenceNumber, setEditLicenceNumber] = useState('');
  const [editLicenceDate, setEditLicenceDate] = useState('');
  const [editImportValidity, setEditImportValidity] = useState('');
  const [editExportValidity, setEditExportValidity] = useState('');
  const [editLicensingAuthority, setEditLicensingAuthority] = useState('');
  const [editLicenceType, setEditLicenceType] = useState('');
  const [editTypeOfNorm, setEditTypeOfNorm] = useState('');
  const [editExportForeignCurrency, setEditExportForeignCurrency] = useState('USD');
  const [editImportCurrency, setEditImportCurrency] = useState('USD');
  const [editForexExportRate, setEditForexExportRate] = useState('');
  const [editForexImportRate, setEditForexImportRate] = useState('');
  const [editExportExchangeRate, setEditExportExchangeRate] = useState<number>(0);
  const [editImportExchangeRate, setEditImportExchangeRate] = useState<number>(0);
  const [editFobValueInr, setEditFobValueInr] = useState('');
  const [editFobValueFc, setEditFobValueFc] = useState('');
  const [editCifValueInr, setEditCifValueInr] = useState('');
  const [editCifValueFc, setEditCifValueFc] = useState('');
  const [editCifValueInvalidatedInr, setEditCifValueInvalidatedInr] = useState('');
  const [editImportLicenceValue, setEditImportLicenceValue] = useState<number>(0);
  const [editBulkLicenceValue, setEditBulkLicenceValue] = useState<number>(0);
  const [editExportObligationValue, setEditExportObligationValue] = useState<number>(0);
  const [editFobValue, setEditFobValue] = useState<number>(0);
  const [editCifValue, setEditCifValue] = useState<number>(0);
  const [editDutySaved, setEditDutySaved] = useState<number>(0);
  const [editExportObligationPeriod, setEditExportObligationPeriod] = useState('');
  const [editLicenceStatus, setEditLicenceStatus] = useState<AdvanceLicence['licenceStatus']>('Active');
  const [editUploadedDoc, setEditUploadedDoc] = useState<{ name: string; uploadedAt: string; size?: string; dataUrl?: string } | null>(null);
  const [editOriginalFilename, setEditOriginalFilename] = useState('');
  const [editOtherExtractedInfo, setEditOtherExtractedInfo] = useState<Array<{ label: string; value: string; page?: number }>>([]);

  const [exportItems, setExportItems] = useState<ExportItem[]>([]);
  const [editExportItems, setEditExportItems] = useState<ExportItem[]>([]);

  const [importItems, setImportItems] = useState<ImportItem[]>([]);
  const [editImportItems, setEditImportItems] = useState<ImportItem[]>([]);

  // Handlers for Add Licence Export Items
  const handleExportItemChange = (index: number, field: keyof ExportItem, value: any) => {
    setExportItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // Auto-clear verification tag when essential valid values are present
      if (field === 'productDescription' || field === 'itcHsCode' || field === 'quantity' || field === 'fobValueInr') {
        if (next[index].productDescription && next[index].itcHsCode && Number(next[index].quantity) > 0 && Number(next[index].fobValueInr) > 0) {
          next[index].needsVerification = false;
        }
      }
      return next;
    });
  };

  const handleToggleExportItemVerification = (index: number) => {
    setExportItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], needsVerification: !next[index].needsVerification };
      return next;
    });
  };

  const handleAddExportItemRow = () => {
    const nextSrNo = String(exportItems.length + 1);
    setExportItems(prev => [
      ...prev,
      {
        id: `exp-${Date.now()}-${prev.length + 1}`,
        exportSrNo: nextSrNo,
        sionSrNo: '',
        itcHsCode: '',
        productDescription: '',
        quantity: 0,
        uom: 'MTR',
        fobValueInr: 0,
        fobValueFc: 0,
        currency: exportForeignCurrency || 'USD',
        needsVerification: false
      }
    ]);
  };

  const handleDeleteExportItemRow = (index: number) => {
    setExportItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handlers for Edit Licence Export Items
  const handleEditExportItemChange = (index: number, field: keyof ExportItem, value: any) => {
    setEditExportItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'productDescription' || field === 'itcHsCode' || field === 'quantity' || field === 'fobValueInr') {
        if (next[index].productDescription && next[index].itcHsCode && Number(next[index].quantity) > 0 && Number(next[index].fobValueInr) > 0) {
          next[index].needsVerification = false;
        }
      }
      return next;
    });
  };

  const handleToggleEditExportItemVerification = (index: number) => {
    setEditExportItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], needsVerification: !next[index].needsVerification };
      return next;
    });
  };

  const handleAddEditExportItemRow = () => {
    const nextSrNo = String(editExportItems.length + 1);
    setEditExportItems(prev => [
      ...prev,
      {
        id: `exp-${Date.now()}-${prev.length + 1}`,
        exportSrNo: nextSrNo,
        sionSrNo: '',
        itcHsCode: '',
        productDescription: '',
        quantity: 0,
        uom: 'MTR',
        fobValueInr: 0,
        fobValueFc: 0,
        currency: editExportForeignCurrency || 'USD',
        needsVerification: false
      }
    ]);
  };

  const handleDeleteEditExportItemRow = (index: number) => {
    setEditExportItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handlers for Add Licence Import Items
  const handleImportItemChange = (index: number, field: keyof ImportItem, value: any) => {
    setImportItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // If user inputs critical fields, clear verification flag if not explicitly set
      if (field === 'inputDescription' || field === 'itcHsCode' || field === 'quantity' || field === 'cifValueInr') {
        if (next[index].inputDescription && next[index].itcHsCode && Number(next[index].quantity) > 0 && Number(next[index].cifValueInr) > 0) {
          next[index].needsVerification = false;
        }
      }
      return next;
    });
  };

  const handleToggleImportItemVerification = (index: number) => {
    setImportItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], needsVerification: !next[index].needsVerification };
      return next;
    });
  };

  const handleAddImportItemRow = () => {
    const nextSrNo = String(importItems.length + 1);
    setImportItems(prev => [
      ...prev,
      {
        id: `imp-${Date.now()}-${prev.length + 1}`,
        inputSrNo: nextSrNo,
        inputDescription: '',
        technicalDescription: '',
        sionSrNo: '',
        exportSrNo: exportItems.length > 0 ? (exportItems[0].exportSrNo || '1') : '1',
        itcHsCode: '',
        quantity: 0,
        uom: 'KGS',
        cifValueInr: 0,
        cifValueFc: 0,
        currency: importCurrency || exportForeignCurrency || 'USD',
        dutySavedInr: 0,
        dutySavedPercent: 0,
        needsVerification: false,
        verificationNotes: ''
      }
    ]);
  };

  const handleDeleteImportItemRow = (index: number) => {
    setImportItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handlers for Edit Licence Import Items
  const handleEditImportItemChange = (index: number, field: keyof ImportItem, value: any) => {
    setEditImportItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      if (field === 'inputDescription' || field === 'itcHsCode' || field === 'quantity' || field === 'cifValueInr') {
        if (next[index].inputDescription && next[index].itcHsCode && Number(next[index].quantity) > 0 && Number(next[index].cifValueInr) > 0) {
          next[index].needsVerification = false;
        }
      }
      return next;
    });
  };

  const handleToggleEditImportItemVerification = (index: number) => {
    setEditImportItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], needsVerification: !next[index].needsVerification };
      return next;
    });
  };

  const handleAddEditImportItemRow = () => {
    const nextSrNo = String(editImportItems.length + 1);
    setEditImportItems(prev => [
      ...prev,
      {
        id: `imp-${Date.now()}-${prev.length + 1}`,
        inputSrNo: nextSrNo,
        inputDescription: '',
        technicalDescription: '',
        sionSrNo: '',
        exportSrNo: editExportItems.length > 0 ? (editExportItems[0].exportSrNo || '1') : '1',
        itcHsCode: '',
        quantity: 0,
        uom: 'KGS',
        cifValueInr: 0,
        cifValueFc: 0,
        currency: editImportCurrency || editExportForeignCurrency || 'USD',
        dutySavedInr: 0,
        dutySavedPercent: 0,
        needsVerification: false,
        verificationNotes: ''
      }
    ]);
  };

  const handleDeleteEditImportItemRow = (index: number) => {
    setEditImportItems(prev => prev.filter((_, i) => i !== index));
  };
  const loadLicences = async () => {
    setIsLoading(true);
    setApiError('');
    try {
      const result = await fetchLicencesFromDB();
      setLicences(result.licences);
      setIsSupabaseConnected(result.isDb);
      setDatabaseSource(result.source);
    } catch (err: any) {
      console.error('Failed to load licences from API:', err);
      setApiError(err.message || 'Failed to connect to database API');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLicences();
  }, []);

  // Filter logic
  const filteredLicences = licences.filter(lic => {
    const matchesSearch = 
      (lic.fileNumber && lic.fileNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lic.dgftFileNumber && lic.dgftFileNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lic.dgftApplicationNumber && lic.dgftApplicationNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lic.licenceNumber && lic.licenceNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lic.originalFilename && lic.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || lic.status === statusFilter || lic.licenceStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Detect company file number from filename prefix
    const detectedNo = detectCompanyFileNumber(file.name);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      const docObj = {
        name: file.name,
        uploadedAt: new Date().toLocaleString(),
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        dataUrl: base64String
      };

      if (isEdit) {
        setEditUploadedDoc(docObj);
        setEditOriginalFilename(file.name);
      } else {
        setUploadedDoc(docObj);
        setOriginalFilename(file.name);
        if (detectedNo) {
          setFileNumber(detectedNo);
          setIsFileNumberFromFilename(true);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExtractWithAI = async () => {
    if (!uploadedDoc?.dataUrl) {
      alert('Please upload a DGFT Advance Authorisation PDF document first.');
      return;
    }

    setIsExtracting(true);
    setExtractionSuccessMsg('');

    const doFetch = async (retryCount = 0): Promise<any> => {
      try {
        const response = await fetch('/api/extract-licence-pdf', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            pdfBase64: uploadedDoc?.dataUrl || null,
            fileName: uploadedDoc?.name || 'Advance_Licence.pdf'
          })
        });

        if (!response.ok) {
          throw new Error(`Server returned HTTP ${response.status}`);
        }

        return await response.json();
      } catch (err: any) {
        if (retryCount < 1) {
          await new Promise(r => setTimeout(r, 1000));
          return doFetch(retryCount + 1);
        }
        throw err;
      }
    };

    try {
      const data = await doFetch();
      if (data && data.success && data.extracted) {
        const ext = data.extracted;
        
        // 1. Company File Number (suggested from filename or left blank)
        const detectedNo = detectCompanyFileNumber(uploadedDoc?.name || '') || ext.fileNumber || '';
        if (detectedNo) {
          setFileNumber(detectedNo);
          setIsFileNumberFromFilename(true);
        } else {
          setFileNumber('');
          setIsFileNumberFromFilename(false);
        }

        // 2. DGFT File Number (extracted faithfully from PDF)
        setDgftFileNumber(ext.dgftFileNumber || '');

        // 3. DGFT Application Number (blank if not in PDF)
        setDgftApplicationNumber(ext.dgftApplicationNumber || '');

        // 4. Licence / Authorisation Number (extracted from PDF)
        setLicenceNumber(ext.licenceNumber || '');

        // Helper to ensure dates fit HTML <input type="date">
        const toInputDate = (d: any): string => {
          if (!d || typeof d !== 'string') return '';
          const trimmed = d.trim();
          if (!trimmed || trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'n/a') return '';
          if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
          const match = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
          if (match) {
            return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
          }
          const parsed = new Date(trimmed);
          if (!isNaN(parsed.getTime())) {
            const y = parsed.getFullYear();
            const m = String(parsed.getMonth() + 1).padStart(2, '0');
            const day = String(parsed.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          }
          return trimmed;
        };

        setLicenceDate(toInputDate(ext.licenceDate));
        setImportValidity(toInputDate(ext.importValidity));
        setExportValidity(toInputDate(ext.exportValidity));
        setLicensingAuthority(ext.licensingAuthority || '');
        setLicenceType(ext.licenceType || 'Advance Authorisation for Duty Exemption');
        setTypeOfNorm(ext.typeOfNorm || 'Standard SION (Textile)');
        setExportForeignCurrency(ext.exportForeignCurrency || 'USD');
        setImportCurrency(ext.importCurrency || ext.exportForeignCurrency || 'USD');
        setForexExportRate(ext.forexExportRate || '');
        setForexImportRate(ext.forexImportRate || '');
        setExportExchangeRate(typeof ext.exportExchangeRate === 'number' ? ext.exportExchangeRate : (Number(ext.forexExportRate) || 0));
        setImportExchangeRate(typeof ext.importExchangeRate === 'number' ? ext.importExchangeRate : (Number(ext.forexImportRate) || 0));
        setFobValueInr(ext.fobValueInr || '');
        setFobValueFc(ext.fobValueFc || '');
        setCifValueInr(ext.cifValueInr || '');
        setCifValueFc(ext.cifValueFc || '');
        setCifValueInvalidatedInr(ext.cifValueInvalidatedInr || '0.00');
        
        setImportLicenceValue(typeof ext.importLicenceValue === 'number' ? ext.importLicenceValue : 0);
        setBulkLicenceValue(typeof ext.bulkLicenceValue === 'number' ? ext.bulkLicenceValue : 0);
        setExportObligationValue(typeof ext.exportObligationValue === 'number' ? ext.exportObligationValue : 0);
        setFobValue(typeof ext.fobValue === 'number' ? ext.fobValue : 0);
        setCifValue(typeof ext.cifValue === 'number' ? ext.cifValue : 0);
        setDutySaved(typeof ext.dutySaved === 'number' ? ext.dutySaved : 0);
        setExportObligationPeriod(ext.exportObligationPeriod || '');
        setLicenceStatus(ext.licenceStatus || 'Active');
        setOriginalFilename(ext.originalFilename || uploadedDoc?.name || '');
        setExportItems(Array.isArray(ext.exportItems) ? ext.exportItems : []);
        setImportItems(Array.isArray(ext.importItems) ? ext.importItems : []);
        setOtherExtractedInfo(Array.isArray(ext.otherExtractedInfo) ? ext.otherExtractedInfo : []);

        setExtractedFlag(true);
        const expCount = Array.isArray(ext.exportItems) ? ext.exportItems.length : 0;
        const impCount = Array.isArray(ext.importItems) ? ext.importItems.length : 0;
        if (data.notice) {
          setExtractionSuccessMsg(data.notice);
        } else {
          setExtractionSuccessMsg(`Data extracted successfully (${expCount} Export Item${expCount === 1 ? '' : 's'}, ${impCount} Import Item${impCount === 1 ? '' : 's'} detected). Please review and verify all fields below.`);
        }
      } else {
        alert('Extraction completed with warnings. Please review fields manually.');
      }
    } catch (err: any) {
      console.warn('Extraction fetch warning:', err);
      alert('Extraction service connection issue. Please check the document and try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddLicence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNumber || !licenceNumber || !dgftFileNumber) {
      alert('Please fill in Company File Number, DGFT File Number, and Licence Number.');
      return;
    }

    const duplicate = licences.find(l => l.licenceNumber === licenceNumber || l.fileNumber === fileNumber);
    if (duplicate) {
      if (!confirm(`Warning: A licence with number ${licenceNumber} or file number ${fileNumber} already exists. Do you still want to proceed?`)) {
        return;
      }
    }

    // Generate unique database ID
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `AL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    const newEntry: AdvanceLicence = {
      id: uniqueId,
      fileNumber,
      dgftFileNumber,
      dgftApplicationNumber: dgftApplicationNumber || '',
      licenceNumber,
      licenceDate: licenceDate || '',
      importValidity: importValidity || '',
      exportValidity: exportValidity || '',
      licensingAuthority,
      licenceType,
      typeOfNorm,
      exportForeignCurrency,
      importCurrency,
      forexExportRate,
      forexImportRate,
      exportExchangeRate,
      importExchangeRate,
      fobValueInr,
      fobValueFc,
      cifValueInr,
      cifValueFc,
      cifValueInvalidatedInr,
      importLicenceValue: Number(importLicenceValue) || 0,
      bulkLicenceValue: Number(bulkLicenceValue) || 0,
      exportObligationValue: Number(exportObligationValue) || 0,
      fobValue: Number(fobValue) || 0,
      cifValue: Number(cifValue) || 0,
      dutySaved: Number(dutySaved) || 0,
      exportObligationPeriod: exportObligationPeriod || '',
      licenceStatus,
      exportItems: exportItems.map(item => ({
        ...item,
        licenceId: uniqueId,
        licenceNumber: licenceNumber
      })),
      importItems: importItems.map(item => ({
        ...item,
        licenceId: uniqueId,
        licenceNumber: licenceNumber
      })),
      originalDocument: uploadedDoc,
      originalFilename: originalFilename || uploadedDoc?.name,
      extractedFromPdf: extractedFlag,
      otherExtractedInfo,
      status: licenceStatus === 'Active' ? 'Active' : licenceStatus === 'Expired' ? 'Expired' : 'Active',
      applicantName: 'Alok Industries Limited'
    };

    setIsSaving(true);
    setApiError('');
    try {
      // Save to Supabase Database via backend API
      const savedRecord = await saveLicenceToDB(newEntry);

      // Update local state with the returned saved record
      setLicences(prev => [savedRecord, ...prev.filter(l => l.id !== savedRecord.id)]);
      setIsAddModalOpen(false);
      
      // Reset form
      setFileNumber('');
      setIsFileNumberFromFilename(false);
      setDgftFileNumber('');
      setDgftApplicationNumber('');
      setLicenceNumber('');
      setLicenceDate('');
      setImportValidity('');
      setExportValidity('');
      setLicensingAuthority('');
      setLicenceType('Advance Authorisation for Duty Exemption');
      setTypeOfNorm('Standard SION (Textile)');
      setExportForeignCurrency('USD');
      setImportCurrency('USD');
      setForexExportRate('');
      setForexImportRate('');
      setExportExchangeRate(0);
      setImportExchangeRate(0);
      setFobValueInr('');
      setFobValueFc('');
      setCifValueInr('');
      setCifValueFc('');
      setCifValueInvalidatedInr('0.00');
      setImportLicenceValue(0);
      setBulkLicenceValue(0);
      setExportObligationValue(0);
      setFobValue(0);
      setCifValue(0);
      setDutySaved(0);
      setExportObligationPeriod('');
      setLicenceStatus('Active');
      setExportItems([]);
      setImportItems([]);
      setUploadedDoc(null);
      setOriginalFilename('');
      setExtractedFlag(false);
      setOtherExtractedInfo([]);
      setExtractionSuccessMsg('');
    } catch (err: any) {
      console.error('Failed to save licence to database:', err);
      alert(`Error saving to database: ${err.message || 'Unknown error'}`);
      setApiError(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenViewModal = async (lic: AdvanceLicence) => {
    // Retrieve latest record directly from database / storage
    const freshRecord = await getLicenceFromDB(lic.id);
    setSelectedLicence(freshRecord || lic);
  };

  const openEditModal = (lic: AdvanceLicence) => {
    setEditingLicence(lic);
    setEditFileNumber(lic.fileNumber);
    setEditDgftFileNumber(lic.dgftFileNumber);
    setEditDgftApplicationNumber(lic.dgftApplicationNumber || '');
    setEditLicenceNumber(lic.licenceNumber);
    setEditLicenceDate(lic.licenceDate);
    setEditImportValidity(lic.importValidity);
    setEditExportValidity(lic.exportValidity);
    setEditLicensingAuthority(lic.licensingAuthority || '');
    setEditLicenceType(lic.licenceType || '');
    setEditTypeOfNorm(lic.typeOfNorm);
    setEditExportForeignCurrency(lic.exportForeignCurrency);
    setEditImportCurrency(lic.importCurrency || lic.exportForeignCurrency);
    setEditForexExportRate(lic.forexExportRate);
    setEditForexImportRate(lic.forexImportRate);
    setEditExportExchangeRate(lic.exportExchangeRate || Number(lic.forexExportRate) || 0);
    setEditImportExchangeRate(lic.importExchangeRate || Number(lic.forexImportRate) || 0);
    setEditFobValueInr(lic.fobValueInr);
    setEditFobValueFc(lic.fobValueFc);
    setEditCifValueInr(lic.cifValueInr);
    setEditCifValueFc(lic.cifValueFc);
    setEditCifValueInvalidatedInr(lic.cifValueInvalidatedInr);
    setEditImportLicenceValue(lic.importLicenceValue);
    setEditBulkLicenceValue(lic.bulkLicenceValue);
    setEditExportObligationValue(lic.exportObligationValue);
    setEditFobValue(lic.fobValue);
    setEditCifValue(lic.cifValue || 0);
    setEditDutySaved(lic.dutySaved || 0);
    setEditExportObligationPeriod(lic.exportObligationPeriod || '');
    setEditLicenceStatus(lic.licenceStatus || 'Active');
    setEditExportItems(lic.exportItems || []);
    setEditImportItems(lic.importItems || []);
    setEditUploadedDoc(lic.originalDocument || null);
    setEditOriginalFilename(lic.originalFilename || lic.originalDocument?.name || '');
    setEditOtherExtractedInfo(lic.otherExtractedInfo || []);
  };

  const handleUpdateLicence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLicence) return;

    const updatedData: AdvanceLicence = {
      ...editingLicence,
      fileNumber: editFileNumber,
      dgftFileNumber: editDgftFileNumber,
      dgftApplicationNumber: editDgftApplicationNumber,
      licenceNumber: editLicenceNumber,
      licenceDate: editLicenceDate,
      importValidity: editImportValidity,
      exportValidity: editExportValidity,
      licensingAuthority: editLicensingAuthority,
      licenceType: editLicenceType,
      typeOfNorm: editTypeOfNorm,
      exportForeignCurrency: editExportForeignCurrency,
      importCurrency: editImportCurrency,
      forexExportRate: editForexExportRate,
      forexImportRate: editForexImportRate,
      exportExchangeRate: editExportExchangeRate,
      importExchangeRate: editImportExchangeRate,
      fobValueInr: editFobValueInr,
      fobValueFc: editFobValueFc,
      cifValueInr: editCifValueInr,
      cifValueFc: editCifValueFc,
      cifValueInvalidatedInr: editCifValueInvalidatedInr,
      importLicenceValue: Number(editImportLicenceValue) || 0,
      bulkLicenceValue: Number(editBulkLicenceValue) || 0,
      exportObligationValue: Number(editExportObligationValue) || 0,
      fobValue: Number(editFobValue) || 0,
      cifValue: Number(editCifValue) || 0,
      dutySaved: Number(editDutySaved) || 0,
      exportObligationPeriod: editExportObligationPeriod,
      licenceStatus: editLicenceStatus,
      exportItems: editExportItems.map(item => ({
        ...item,
        licenceId: editingLicence.id,
        licenceNumber: editLicenceNumber
      })),
      importItems: editImportItems.map(item => ({
        ...item,
        licenceId: editingLicence.id,
        licenceNumber: editLicenceNumber
      })),
      originalDocument: editUploadedDoc,
      originalFilename: editOriginalFilename,
      otherExtractedInfo: editOtherExtractedInfo
    };

    setIsSaving(true);
    setApiError('');
    try {
      const savedRecord = await updateLicenceInDB(updatedData);
      setLicences(prev => prev.map(l => l.id === savedRecord.id ? savedRecord : l));
      if (selectedLicence && selectedLicence.id === savedRecord.id) {
        setSelectedLicence(savedRecord);
      }
      setEditingLicence(null);
    } catch (err: any) {
      console.error('Failed to update licence in database:', err);
      alert(`Error updating database: ${err.message || 'Unknown error'}`);
      setApiError(`Update error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const promptDeleteLicence = (lic: AdvanceLicence) => {
    setDeletingLicence(lic);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLicence) return;
    setIsDeleting(true);
    try {
      await deleteLicenceFromDB(deletingLicence.id);
      setLicences(prev => prev.filter(l => l.id !== deletingLicence.id));
      if (selectedLicence && selectedLicence.id === deletingLicence.id) {
        setSelectedLicence(null);
      }
      if (editingLicence && editingLicence.id === deletingLicence.id) {
        setEditingLicence(null);
      }
      const licIdentifier = deletingLicence.licenceNumber || deletingLicence.fileNumber || 'Record';
      setDeleteSuccessMsg(`Advance Licence ${licIdentifier} has been permanently deleted.`);
      setTimeout(() => {
        setDeleteSuccessMsg('');
      }, 4000);
      setDeletingLicence(null);
    } catch (err) {
      console.error('Failed to delete licence:', err);
      alert('Failed to delete licence record. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: AdvanceLicence['licenceStatus']) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Nearly Expired':
      case 'Pending Closure':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Expired':
      case 'Cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Closed':
        return 'bg-slate-100 text-slate-600 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      {deleteSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{deleteSuccessMsg}</span>
          </div>
          <button 
            onClick={() => setDeleteSuccessMsg('')}
            className="p-1 text-emerald-600 hover:text-emerald-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* API Error Notification */}
      {apiError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 font-medium">
            <Info className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>Database API Notice: {apiError}</span>
          </div>
          <button 
            onClick={() => setApiError('')}
            className="p-1 text-rose-600 hover:text-rose-800 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">Alok Industries</span>
            <span className="text-slate-300">•</span>
            <span className="text-xs text-slate-500">DGFT Advance Licence Master Repository</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">Advance Licences</h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete master records with source-faithful extraction, exact decimal precision, and Supabase PostgreSQL persistence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Supabase Connection Badge */}
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSupabaseConnected ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`}></span>
            <span className="font-medium text-slate-700">
              {isSupabaseConnected ? (
                <>Supabase Postgres: <span className="text-emerald-700 font-semibold">{licences.length} Records</span></>
              ) : (
                <>Storage: <span className="text-slate-900 font-semibold">{licences.length} Records</span></>
              )}
            </span>
          </div>

          <button
            onClick={loadLicences}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            title="Reload from Database"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Licence</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search File No, DGFT File, App No, Licence No, or Filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs text-slate-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['All', 'Active', 'Pending Closure', 'Expired', 'Closed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Licences Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 text-[11px] font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Company File No</th>
                <th className="py-3.5 px-4">DGFT File No</th>
                <th className="py-3.5 px-4">Licence Number</th>
                <th className="py-3.5 px-4">Import Value (₹)</th>
                <th className="py-3.5 px-4">EO Value (₹)</th>
                <th className="py-3.5 px-4">Import / Export Validity</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="font-medium text-xs">Loading master records from database...</p>
                  </td>
                </tr>
              ) : filteredLicences.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-medium text-sm">No Advance Licences found.</p>
                    <p className="text-slate-400 text-xs mt-1">
                      {licences.length === 0 
                        ? 'Click "Add Licence" to create or extract a DGFT Advance Authorisation record.' 
                        : 'Try adjusting or clearing your search query and status filter.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLicences.map((lic) => (
                  <tr key={lic.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="font-bold text-slate-900">{lic.fileNumber}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{lic.typeOfNorm}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{lic.dgftFileNumber}</td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-600">
                      <div>{lic.licenceNumber}</div>
                      {lic.originalFilename && (
                        <div className="text-[10px] text-emerald-600 font-normal truncate max-w-[180px]" title={lic.originalFilename}>
                          📄 {lic.originalFilename}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-1 font-sans">
                        {lic.exportItems && lic.exportItems.length > 0 && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-medium">
                            {lic.exportItems.length} Exp Item{lic.exportItems.length === 1 ? '' : 's'}
                          </span>
                        )}
                        {lic.importItems && lic.importItems.length > 0 && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                            {lic.importItems.length} Imp Item{lic.importItems.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">₹ {lic.importLicenceValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">₹ {lic.exportObligationValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <div>Imp: {lic.importValidity || '—'}</div>
                      <div className="text-[11px] text-slate-500">Exp: {lic.exportValidity || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusBadge(lic.licenceStatus || lic.status)}`}>
                        {lic.licenceStatus || lic.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenViewModal(lic)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200 hover:border-blue-200 font-medium text-xs transition-all shadow-2xs"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => openEditModal(lic)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 border border-slate-200 hover:border-amber-200 font-medium text-xs transition-all shadow-2xs"
                          title="Edit Licence"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => promptDeleteLicence(lic)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-600 border border-slate-200 hover:border-rose-200 font-medium text-xs transition-all shadow-2xs"
                          title="Delete Licence"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer / Summary */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong className="text-slate-700">{filteredLicences.length}</strong> of <strong className="text-slate-700">{licences.length}</strong> Advance Licences (Persistent)</span>
          <span className="text-slate-400">Database: licence_master</span>
        </div>
      </div>

      {/* --- View Licence Modal (Organized Sections A-I) --- */}
      {selectedLicence && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Advance Authorisation Master Record ({selectedLicence.licenceNumber})</h3>
              </div>
              <button 
                onClick={() => setSelectedLicence(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Organized Sections */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Top Banner */}
              <div className="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <div>
                  <div className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Authorisation / Licence Number</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{selectedLicence.licenceNumber}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Database ID: <span className="font-mono text-slate-700">{selectedLicence.id}</span> | Company File: {selectedLicence.fileNumber} | DGFT File: {selectedLicence.dgftFileNumber}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(selectedLicence.licenceStatus || selectedLicence.status)}`}>
                    {selectedLicence.licenceStatus || selectedLicence.status}
                  </span>
                </div>
              </div>

              {/* Section A: Basic Licence Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  A. Basic Licence Information
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Company File Number</span>
                    <div className="font-bold text-slate-900 mt-1">{selectedLicence.fileNumber || '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">DGFT File Number</span>
                    <div className="font-mono font-medium text-slate-900 mt-1">{selectedLicence.dgftFileNumber || '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">DGFT Application No</span>
                    <div className="font-mono font-medium text-slate-900 mt-1">{selectedLicence.dgftApplicationNumber || '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Licence Type</span>
                    <div className="font-medium text-slate-900 mt-1">{selectedLicence.licenceType || 'Advance Authorisation'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Licensing Authority / DGFT Office</span>
                    <div className="font-medium text-slate-900 mt-1">{selectedLicence.licensingAuthority || 'Office of the Additional DGFT'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Type of Norm</span>
                    <div className="font-medium text-slate-900 mt-1">{selectedLicence.typeOfNorm}</div>
                  </div>
                </div>
              </div>

              {/* Section B: Validity */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                  B. Validity & Dates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Licence Date</span>
                    <div className="font-medium text-slate-900 mt-1">{selectedLicence.licenceDate || '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Import Validity</span>
                    <div className="font-medium text-slate-900 mt-1">{selectedLicence.importValidity || '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Export Validity (EO Period)</span>
                    <div className="font-medium text-slate-900 mt-1">{selectedLicence.exportValidity || '—'} {selectedLicence.exportObligationPeriod ? `(${selectedLicence.exportObligationPeriod})` : ''}</div>
                  </div>
                </div>
              </div>

              {/* Section C: Licence Values (CIF / Import Values with exact decimals) */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  C. Licence Values (Import / CIF)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <span className="text-blue-600 uppercase tracking-wider text-[10px] font-semibold">Import Licence Value</span>
                    <div className="font-mono font-bold text-slate-900 mt-1 text-sm">₹ {selectedLicence.importLicenceValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <span className="text-blue-600 uppercase tracking-wider text-[10px] font-semibold">Bulk Licence Value</span>
                    <div className="font-mono font-bold text-slate-900 mt-1 text-sm">₹ {selectedLicence.bulkLicenceValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">CIF Value (INR)</span>
                    <div className="font-mono font-medium text-slate-900 mt-1">{selectedLicence.cifValueInr ? `₹ ${selectedLicence.cifValueInr}` : '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Duty Saved (₹)</span>
                    <div className="font-mono font-medium text-slate-900 mt-1">₹ {selectedLicence.dutySaved?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) || '0.00'}</div>
                  </div>
                </div>
              </div>

              {/* Section D: Import Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                  D. Import Information & Entitlements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Import Currency</span>
                    <div className="font-medium text-slate-900 mt-1">{selectedLicence.importCurrency || selectedLicence.exportForeignCurrency || '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Import Exchange Rate</span>
                    <div className="font-mono font-medium text-slate-900 mt-1">{selectedLicence.importExchangeRate || selectedLicence.forexImportRate || '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">CIF Value in FC</span>
                    <div className="font-mono font-medium text-slate-900 mt-1">{selectedLicence.cifValueFc || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Section E: Export Obligation */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  E. Export Obligation (FOB / Obligation)
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                    <span className="text-amber-700 uppercase tracking-wider text-[10px] font-semibold">Export Obligation Value</span>
                    <div className="font-mono font-bold text-slate-900 mt-1 text-sm">₹ {selectedLicence.exportObligationValue?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</div>
                  </div>
                  <div className="bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                    <span className="text-amber-700 uppercase tracking-wider text-[10px] font-semibold">FOB Value (INR)</span>
                    <div className="font-mono font-bold text-slate-900 mt-1 text-sm">{selectedLicence.fobValueInr ? `₹ ${selectedLicence.fobValueInr}` : '—'}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Export FC & FOB in FC</span>
                    <div className="font-medium text-slate-900 mt-1">{selectedLicence.exportForeignCurrency} {selectedLicence.fobValueFc || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Section E.1: Export Items (Obligation Schedule) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Export Items (Obligation Items Schedule)
                  </h4>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium border border-blue-100">
                    {selectedLicence.exportItems?.length || 0} Item{selectedLicence.exportItems?.length === 1 ? '' : 's'}
                  </span>
                </div>

                {selectedLicence.exportItems && selectedLicence.exportItems.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Export Sr No</th>
                          <th className="py-2.5 px-3">SION Sr No</th>
                          <th className="py-2.5 px-3">ITC HS Code</th>
                          <th className="py-2.5 px-3 min-w-[220px]">Product Description</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-center">UOM</th>
                          <th className="py-2.5 px-3 text-right">FOB Value (INR)</th>
                          <th className="py-2.5 px-3 text-right">FOB Value ({selectedLicence.exportForeignCurrency || 'FC'})</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLicence.exportItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/75 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.exportSrNo || idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{item.sionSrNo || '—'}</td>
                            <td className="py-2.5 px-3 font-mono font-medium">
                              {item.itcHsCode ? (
                                <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                  {item.itcHsCode}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium leading-relaxed max-w-xs">{item.productDescription || '—'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {typeof item.quantity === 'number' && item.quantity > 0 
                                ? item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) 
                                : (item.quantity ? String(item.quantity) : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-medium">{item.uom || '—'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {typeof item.fobValueInr === 'number' && item.fobValueInr > 0
                                ? `₹ ${item.fobValueInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                : (item.fobValueInr ? `₹ ${item.fobValueInr}` : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {typeof item.fobValueFc === 'number' && item.fobValueFc > 0
                                ? `${item.fobValueFc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                : (item.fobValueFc ? String(item.fobValueFc) : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.needsVerification ? (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
                                  Flagged for verification
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
                                  Extracted
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50/90 border-t border-slate-200 font-semibold text-slate-900">
                          <td colSpan={4} className="py-2.5 px-3 text-right uppercase text-[10px] tracking-wider text-slate-500">
                            Total ({selectedLicence.exportItems.length} items):
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {selectedLicence.exportItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">
                            {Array.from(new Set(selectedLicence.exportItems.map(i => i.uom).filter(Boolean))).join(', ') || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-900">
                            ₹ {selectedLicence.exportItems.reduce((sum, item) => sum + (Number(item.fobValueInr) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            {selectedLicence.exportItems.reduce((sum, item) => sum + (Number(item.fobValueFc) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {selectedLicence.exportForeignCurrency || ''}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-5 text-center text-slate-500">
                    <p className="text-xs">No Export Items recorded or extracted for this licence.</p>
                  </div>
                )}
              </div>

              {/* Section E.2: Import Items Schedule (Duty Free Imports) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      Import Items Schedule (Details of items sought to be imported duty free under the Authorisation)
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedLicence.importItems?.some(i => i.needsVerification) && (
                      <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full font-medium border border-amber-200 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        Needs Verification
                      </span>
                    )}
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-medium border border-emerald-100">
                      {selectedLicence.importItems?.length || 0} Item{selectedLicence.importItems?.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                {selectedLicence.importItems && selectedLicence.importItems.length > 0 ? (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 px-3">Input Sr No</th>
                          <th className="py-2.5 px-3">SION Sr No</th>
                          <th className="py-2.5 px-3">Export Sr No</th>
                          <th className="py-2.5 px-3">ITC HS Code</th>
                          <th className="py-2.5 px-3 min-w-[200px]">Input Description</th>
                          <th className="py-2.5 px-3 min-w-[180px]">Technical Features</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-center">UOM</th>
                          <th className="py-2.5 px-3 text-right">CIF Value (INR)</th>
                          <th className="py-2.5 px-3 text-right">CIF Value ({selectedLicence.importCurrency || selectedLicence.exportForeignCurrency || 'FC'})</th>
                          <th className="py-2.5 px-3 text-right">Duty Saved (₹)</th>
                          <th className="py-2.5 px-3 text-right">Duty Saved %</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedLicence.importItems.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50/75 transition-colors">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.inputSrNo || idx + 1}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{item.sionSrNo || '—'}</td>
                            <td className="py-2.5 px-3 font-mono">
                              <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium" title="Links to Export Item Serial Number">
                                #{item.exportSrNo || '1'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-medium">
                              {item.itcHsCode ? (
                                <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                  {item.itcHsCode}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 font-medium leading-relaxed max-w-xs">{item.inputDescription || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-600 italic text-[11px] leading-relaxed max-w-xs">{item.technicalDescription || '—'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {typeof item.quantity === 'number' && item.quantity > 0 
                                ? item.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }) 
                                : (item.quantity ? String(item.quantity) : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-medium">{item.uom || '—'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {typeof item.cifValueInr === 'number' && item.cifValueInr > 0
                                ? `₹ ${item.cifValueInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                : (item.cifValueInr ? `₹ ${item.cifValueInr}` : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {typeof item.cifValueFc === 'number' && item.cifValueFc > 0
                                ? `${item.cifValueFc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                : (item.cifValueFc ? String(item.cifValueFc) : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">
                              {typeof item.dutySavedInr === 'number' && item.dutySavedInr > 0
                                ? `₹ ${item.dutySavedInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
                                : (item.dutySavedInr ? `₹ ${item.dutySavedInr}` : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {typeof item.dutySavedPercent === 'number' && item.dutySavedPercent > 0
                                ? `${item.dutySavedPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
                                : (item.dutySavedPercent ? `${item.dutySavedPercent}%` : '—')}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {item.needsVerification ? (
                                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
                                  Flagged for verification
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
                                  Extracted
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50/90 border-t border-slate-200 font-semibold text-slate-900">
                          <td colSpan={6} className="py-2.5 px-3 text-right uppercase text-[10px] tracking-wider text-slate-500">
                            Total ({selectedLicence.importItems.length} items):
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {selectedLicence.importItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-500 text-[10px]">
                            {Array.from(new Set(selectedLicence.importItems.map(i => i.uom).filter(Boolean))).join(', ') || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ₹ {selectedLicence.importItems.reduce((sum, item) => sum + (Number(item.cifValueInr) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            {selectedLicence.importItems.reduce((sum, item) => sum + (Number(item.cifValueFc) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} {selectedLicence.importCurrency || selectedLicence.exportForeignCurrency || ''}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                            ₹ {selectedLicence.importItems.reduce((sum, item) => sum + (Number(item.dutySavedInr) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </td>
                          <td colSpan={2}></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-5 text-center text-slate-500">
                    <p className="text-xs">No Import Items recorded or extracted for this licence.</p>
                  </div>
                )}
              </div>

              {/* Section F: Exchange Rates */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-violet-600"></span>
                  F. Exchange Rates
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Export Exchange Rate ({selectedLicence.exportForeignCurrency})</span>
                      <div className="font-mono font-bold text-slate-900 mt-1">{selectedLicence.exportExchangeRate || selectedLicence.forexExportRate || '—'}</div>
                    </div>
                    <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded font-mono">Decimal Precision</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider text-[10px] font-semibold">Import Exchange Rate ({selectedLicence.importCurrency || selectedLicence.exportForeignCurrency})</span>
                      <div className="font-mono font-bold text-slate-900 mt-1">{selectedLicence.importExchangeRate || selectedLicence.forexImportRate || '—'}</div>
                    </div>
                    <span className="text-xs bg-violet-100 text-violet-800 px-2 py-0.5 rounded font-mono">Decimal Precision</span>
                  </div>
                </div>
              </div>

              {/* Section G: Licence Status */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  G. Licence Status
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 font-medium">Manually Maintained Licence Status:</span>
                    <span className="ml-3 font-bold text-slate-900">{selectedLicence.licenceStatus}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Extracted via AI/OCR:</span>
                    <span className="ml-2 font-semibold text-blue-600">{selectedLicence.extractedFromPdf ? 'Yes (Verified)' : 'No (Manual)'}</span>
                  </div>
                </div>
              </div>

              {/* Section H: Original Licence Document */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                  H. Original Licence Document & Filename
                </h4>
                {selectedLicence.originalDocument || selectedLicence.originalFilename ? (
                  <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCheck className="w-8 h-8 text-emerald-600" />
                      <div>
                        <div className="font-semibold text-slate-900 font-mono text-xs">{selectedLicence.originalFilename || selectedLicence.originalDocument?.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {selectedLicence.originalDocument?.uploadedAt ? `Uploaded on: ${selectedLicence.originalDocument.uploadedAt}` : 'Attached Document'}
                          {selectedLicence.originalDocument?.size ? ` (${selectedLicence.originalDocument.size})` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedLicence.originalDocument?.dataUrl && (
                        <a
                          href={selectedLicence.originalDocument.dataUrl}
                          download={selectedLicence.originalFilename || selectedLicence.originalDocument.name}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg text-xs transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View / Download PDF
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-6 text-center text-slate-500">
                    <FileText className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs">No original PDF document attached to this licence record.</p>
                  </div>
                )}
              </div>

              {/* Section I: Other Extracted Information (Safety Net) */}
              {selectedLicence.otherExtractedInfo && selectedLicence.otherExtractedInfo.length > 0 && (
                <div className="space-y-3">
                  <button
                    onClick={() => setShowOtherInfo(!showOtherInfo)}
                    className="w-full flex items-center justify-between font-semibold text-slate-900 text-sm border-b border-slate-200 pb-1.5 hover:text-blue-600 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                      <span>I. Other Extracted Information ({selectedLicence.otherExtractedInfo.length} items)</span>
                    </div>
                    {showOtherInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showOtherInfo && (
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-2">
                      <div className="text-[11px] text-slate-500 mb-2">Additional metadata detected by AI in the DGFT Advance Authorisation document:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {selectedLicence.otherExtractedInfo.map((info, idx) => (
                          <div key={idx} className="bg-white p-2.5 rounded border border-slate-200">
                            <div className="text-[10px] font-semibold text-slate-400 uppercase">{info.label} {info.page ? `(Page ${info.page})` : ''}</div>
                            <div className="font-medium text-slate-900 mt-0.5">{info.value}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toDel = selectedLicence;
                    setSelectedLicence(null);
                    promptDeleteLicence(toDel);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors"
                  title="Delete this licence"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Licence</span>
                </button>
                <span className="text-[11px] text-slate-500 hidden sm:inline">Applicant: {selectedLicence.applicantName}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const toEdit = selectedLicence;
                    setSelectedLicence(null);
                    openEditModal(toEdit);
                  }}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setSelectedLicence(null)}
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Edit Licence Modal --- */}
      {editingLicence && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-base">Edit Advance Authorisation Master ({editingLicence.licenceNumber})</h3>
              </div>
              <button 
                onClick={() => setEditingLicence(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateLicence} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-1">1. Master & Document Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Company File Number *</label>
                    <input
                      type="text"
                      required
                      value={editFileNumber}
                      onChange={(e) => setEditFileNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">DGFT File Number *</label>
                    <input
                      type="text"
                      required
                      value={editDgftFileNumber}
                      onChange={(e) => setEditDgftFileNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">DGFT Application Number</label>
                    <input
                      type="text"
                      value={editDgftApplicationNumber}
                      onChange={(e) => setEditDgftApplicationNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Licence / Authorisation Number *</label>
                    <input
                      type="text"
                      required
                      value={editLicenceNumber}
                      onChange={(e) => setEditLicenceNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Licensing Authority</label>
                    <input
                      type="text"
                      value={editLicensingAuthority}
                      onChange={(e) => setEditLicensingAuthority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Licence Type</label>
                    <input
                      type="text"
                      value={editLicenceType}
                      onChange={(e) => setEditLicenceType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Licence Date</label>
                    <input
                      type="date"
                      value={editLicenceDate}
                      onChange={(e) => setEditLicenceDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Import Validity</label>
                    <input
                      type="date"
                      value={editImportValidity}
                      onChange={(e) => setEditImportValidity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Export Validity</label>
                    <input
                      type="date"
                      value={editExportValidity}
                      onChange={(e) => setEditExportValidity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Licence Values & Exchange Rates Section */}
              <div className="space-y-4 pt-2">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-1">2. Licence Values & Exchange Rates (Decimal Precision)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Import Licence Value</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editImportLicenceValue}
                      onChange={(e) => setEditImportLicenceValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bulk Licence Value</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editBulkLicenceValue}
                      onChange={(e) => setEditBulkLicenceValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Duty Saved (₹)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editDutySaved}
                      onChange={(e) => setEditDutySaved(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Export Exchange Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editExportExchangeRate}
                      onChange={(e) => setEditExportExchangeRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Import Exchange Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editImportExchangeRate}
                      onChange={(e) => setEditImportExchangeRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Export Obligation Section */}
              <div className="space-y-4 pt-2">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-1">3. Export Obligation</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Export Obligation Value</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editExportObligationValue}
                      onChange={(e) => setEditExportObligationValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">FOB Value</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editFobValue}
                      onChange={(e) => setEditFobValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Export Obligation Period</label>
                    <input
                      type="text"
                      value={editExportObligationPeriod}
                      onChange={(e) => setEditExportObligationPeriod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Export Items Schedule (Editable) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    3.1 Export Items Schedule ({editExportItems.length} items)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddEditExportItemRow}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md text-[11px] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Export Item
                  </button>
                </div>

                {editExportItems.length > 0 ? (
                  <div className="space-y-3">
                    {editExportItems.map((item, index) => (
                      <div key={item.id || index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-900 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                              Item #{item.exportSrNo || index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleEditExportItemVerification(index)}
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 transition-colors ${
                                item.needsVerification
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Click to toggle verification status"
                            >
                              {item.needsVerification ? (
                                <>
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Needs Verification</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Verified</span>
                                </>
                              )}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEditExportItemRow(index)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors text-xs flex items-center gap-1"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Export Sr No</label>
                            <input
                              type="text"
                              value={item.exportSrNo || ''}
                              onChange={(e) => handleEditExportItemChange(index, 'exportSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">SION Sr No</label>
                            <input
                              type="text"
                              value={item.sionSrNo || ''}
                              onChange={(e) => handleEditExportItemChange(index, 'sionSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="e.g. 62/2023"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">ITC HS Code</label>
                            <input
                              type="text"
                              value={item.itcHsCode || ''}
                              onChange={(e) => handleEditExportItemChange(index, 'itcHsCode', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="8-digit ITC HS Code"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">UOM</label>
                            <input
                              type="text"
                              value={item.uom || ''}
                              onChange={(e) => handleEditExportItemChange(index, 'uom', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs uppercase"
                              placeholder="MTR, KGS, NOS"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Export Product Description (Verbatim from DGFT)</label>
                          <textarea
                            rows={2}
                            value={item.productDescription || ''}
                            onChange={(e) => handleEditExportItemChange(index, 'productDescription', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 text-xs font-medium resize-none leading-relaxed"
                            placeholder="Exact product description as printed on the DGFT document"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Quantity (Exact Decimal)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.quantity}
                              onChange={(e) => handleEditExportItemChange(index, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">FOB Value (INR)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.fobValueInr}
                              onChange={(e) => handleEditExportItemChange(index, 'fobValueInr', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">FOB Value in FC ({editExportForeignCurrency || 'USD'})</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.fobValueFc}
                              onChange={(e) => handleEditExportItemChange(index, 'fobValueFc', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-500 text-xs">
                    <p>No Export Items attached to this licence record.</p>
                    <button
                      type="button"
                      onClick={handleAddEditExportItemRow}
                      className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      <Plus className="w-3 h-3" /> Add First Export Item
                    </button>
                  </div>
                )}
              </div>

              {/* Import Items Schedule (Editable) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      3.2 Import Items Schedule ({editImportItems.length} items)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Details of items sought to be imported duty free under the Authorisation (Preserve verbatim)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditImportItemRow}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-md text-[11px] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Import Item
                  </button>
                </div>

                {editImportItems.length > 0 ? (
                  <div className="space-y-3">
                    {editImportItems.map((item, index) => (
                      <div key={item.id || index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-800 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                              Input #{item.inputSrNo || index + 1}
                            </span>
                            <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-medium border border-blue-200" title="Linked Export Obligation Item">
                              Links to Export #{item.exportSrNo || '1'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleEditImportItemVerification(index)}
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 transition-colors ${
                                item.needsVerification
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Click to toggle verification status"
                            >
                              {item.needsVerification ? (
                                <>
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Needs Verification</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Marked as Verified</span>
                                </>
                              )}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEditImportItemRow(index)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors text-xs flex items-center gap-1"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Input Sr No</label>
                            <input
                              type="text"
                              value={item.inputSrNo || ''}
                              onChange={(e) => handleEditImportItemChange(index, 'inputSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Export Sr No (Link)</label>
                            <input
                              type="text"
                              value={item.exportSrNo || ''}
                              onChange={(e) => handleEditImportItemChange(index, 'exportSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded text-blue-900 font-mono text-xs font-semibold"
                              placeholder="1"
                              title="Export Item Serial Number linked to this import input"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">SION Sr No</label>
                            <input
                              type="text"
                              value={item.sionSrNo || ''}
                              onChange={(e) => handleEditImportItemChange(index, 'sionSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="e.g. 62/2023"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">ITC HS Code</label>
                            <input
                              type="text"
                              value={item.itcHsCode || ''}
                              onChange={(e) => handleEditImportItemChange(index, 'itcHsCode', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="8-digit HS Code"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">UOM</label>
                            <input
                              type="text"
                              value={item.uom || ''}
                              onChange={(e) => handleEditImportItemChange(index, 'uom', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs uppercase"
                              placeholder="KGS, MTR, NOS"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Input Description (Verbatim from DGFT)</label>
                          <textarea
                            rows={2}
                            value={item.inputDescription || ''}
                            onChange={(e) => handleEditImportItemChange(index, 'inputDescription', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 text-xs font-medium resize-none leading-relaxed"
                            placeholder="Exact input description verbatim as printed on DGFT document"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Technical Features / Description (Verbatim)</label>
                          <textarea
                            rows={1}
                            value={item.technicalDescription || ''}
                            onChange={(e) => handleEditImportItemChange(index, 'technicalDescription', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 text-xs resize-none"
                            placeholder="Technical features, yarn count, blend, spec verbatim as printed"
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Quantity to Import</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.quantity}
                              onChange={(e) => handleEditImportItemChange(index, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">CIF Value (INR)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.cifValueInr}
                              onChange={(e) => handleEditImportItemChange(index, 'cifValueInr', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">CIF Value in FC ({editImportCurrency || editExportForeignCurrency || 'USD'})</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.cifValueFc}
                              onChange={(e) => handleEditImportItemChange(index, 'cifValueFc', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Duty Saved (INR)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.dutySavedInr}
                              onChange={(e) => handleEditImportItemChange(index, 'dutySavedInr', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs text-emerald-800 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Duty Saved (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.dutySavedPercent}
                              onChange={(e) => handleEditImportItemChange(index, 'dutySavedPercent', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>

                        {item.needsVerification && (
                          <div>
                            <label className="block text-[10px] font-semibold text-amber-800 uppercase mb-0.5">Verification Notes</label>
                            <input
                              type="text"
                              value={item.verificationNotes || ''}
                              onChange={(e) => handleEditImportItemChange(index, 'verificationNotes', e.target.value)}
                              className="w-full px-2 py-1 bg-amber-50/50 border border-amber-200 rounded text-amber-900 text-xs"
                              placeholder="Notes on why this item requires manual check"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-500 text-xs">
                    <p>No Import Items attached to this licence record.</p>
                    <button
                      type="button"
                      onClick={handleAddEditImportItemRow}
                      className="mt-2 inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      <Plus className="w-3 h-3" /> Add First Import Item
                    </button>
                  </div>
                )}
              </div>

              {/* Licence Status */}
              <div className="space-y-4 pt-2">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-1">4. Licence Status</h4>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Status</label>
                  <select
                    value={editLicenceStatus}
                    onChange={(e) => setEditLicenceStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Pending Closure">Pending Closure</option>
                  </select>
                </div>
              </div>

              {/* Document Section & Filename */}
              <div className="space-y-4 pt-2">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-1">5. Original Document & Filename</h4>
                <div className="grid grid-cols-1 gap-2">
                  <label className="block font-semibold text-slate-700">Original PDF Filename</label>
                  <input
                    type="text"
                    value={editOriginalFilename}
                    onChange={(e) => setEditOriginalFilename(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <div className="font-medium text-slate-900">{editUploadedDoc ? editUploadedDoc.name : 'No document attached'}</div>
                    <div className="text-[10px] text-slate-500">{editUploadedDoc ? `Uploaded: ${editUploadedDoc.uploadedAt}` : 'Upload PDF'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg cursor-pointer text-xs font-medium transition-colors">
                      <span>Replace PDF</span>
                      <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => handleFileUpload(e, true)} />
                    </label>
                    {editUploadedDoc && (
                      <button
                        type="button"
                        onClick={() => { setEditUploadedDoc(null); setEditOriginalFilename(''); }}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const toDel = editingLicence;
                    setEditingLicence(null);
                    promptDeleteLicence(toDel);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Licence</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingLicence(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving to Supabase...</span>
                      </>
                    ) : (
                      <span>Update Master Record</span>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Add Licence Modal (With PDF Upload & AI Extraction & Verification Form) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Add New Advance Authorisation (Master Record)</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLicence} className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
              {/* Step 1: Upload PDF & Extract */}
              <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-blue-900 text-sm">Upload DGFT Advance Authorisation PDF & Extract</h4>
                  </div>
                  {uploadedDoc && (
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" /> PDF Attached
                    </span>
                  )}
                </div>
                <p className="text-slate-600 text-[11px]">
                  Upload original DGFT PDF. The system will detect the Company File Number from the filename and extract DGFT fields from the document.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-300 cursor-pointer transition-colors shadow-2xs">
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{uploadedDoc ? 'Change PDF File' : 'Select PDF File'}</span>
                    <input 
                      type="file" 
                      accept=".pdf,image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, false)} 
                    />
                  </label>

                  {uploadedDoc && (
                    <button
                      type="button"
                      disabled={isExtracting}
                      onClick={handleExtractWithAI}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-xs disabled:opacity-50"
                    >
                      {isExtracting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Extracting DGFT Document Data...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Extract Data from PDF</span>
                        </>
                      )}
                    </button>
                  )}

                  {uploadedDoc && (
                    <div className="text-[11px] text-slate-500 truncate max-w-[240px]">
                      <span className="font-semibold text-slate-700">File:</span> {originalFilename}
                    </div>
                  )}
                </div>

                {extractionSuccessMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{extractionSuccessMsg}</span>
                  </div>
                )}
              </div>

              {/* Section 1: Basic Licence Information & Validity (Editable for verification) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    1. Basic Licence Information & Validity
                  </h4>
                  <span className="text-[10px] text-slate-500 font-medium italic">Verify & edit extracted values</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Company File Number from Filename */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {isFileNumberFromFilename ? 'Company File Number (from filename) *' : 'Company File Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 725 or 700"
                      value={fileNumber}
                      onChange={(e) => {
                        setFileNumber(e.target.value);
                        setIsFileNumberFromFilename(false);
                      }}
                      className={`w-full px-3 py-2 bg-slate-50 border rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-bold ${!fileNumber ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'}`}
                    />
                    {isFileNumberFromFilename ? (
                      <div className="text-[11px] text-blue-600 font-medium mt-1 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Detected from uploaded filename. Please verify before saving.</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 mt-1">
                        {fileNumber ? 'Entered manually. Please verify before saving.' : 'Please enter company internal file number manually.'}
                      </div>
                    )}
                  </div>

                  {/* DGFT File Number from PDF */}
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      DGFT File Number *
                      <span className="text-[10px] text-slate-400 font-normal ml-1.5">(From PDF)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 05AX04004128AM26"
                      value={dgftFileNumber}
                      onChange={(e) => setDgftFileNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">DGFT Application Number</label>
                    <input
                      type="text"
                      placeholder="Blank if not present in PDF"
                      value={dgftApplicationNumber}
                      onChange={(e) => setDgftApplicationNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Licence / Authorisation Number *
                      <span className="text-[10px] text-slate-400 font-normal ml-1.5">(From PDF)</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0511038251"
                      value={licenceNumber}
                      onChange={(e) => setLicenceNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Licensing Authority / DGFT Office</label>
                    <input
                      type="text"
                      placeholder="e.g. Office of Additional DGFT, Mumbai"
                      value={licensingAuthority}
                      onChange={(e) => setLicensingAuthority(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Licence Type</label>
                    <input
                      type="text"
                      value={licenceType}
                      onChange={(e) => setLicenceType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Licence Date</label>
                    <input
                      type="date"
                      value={licenceDate}
                      onChange={(e) => setLicenceDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Import Validity</label>
                    <input
                      type="date"
                      value={importValidity}
                      onChange={(e) => setImportValidity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Export Validity</label>
                    <input
                      type="date"
                      value={exportValidity}
                      onChange={(e) => setExportValidity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Licence Values & Exchange Rates (Decimal Precision) */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  2. Licence Values & Exchange Rates (Exact Decimals)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Import Licence Value (₹)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={importLicenceValue}
                      onChange={(e) => setImportLicenceValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Bulk Licence Value (₹)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={bulkLicenceValue}
                      onChange={(e) => setBulkLicenceValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Duty Saved (₹)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={dutySaved}
                      onChange={(e) => setDutySaved(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Export Exchange Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={exportExchangeRate}
                      onChange={(e) => setExportExchangeRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Import Exchange Rate</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={importExchangeRate}
                      onChange={(e) => setImportExchangeRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Export Obligation Section */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                  3. Export Obligation
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Export Obligation Value (₹)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={exportObligationValue}
                      onChange={(e) => setExportObligationValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">FOB Value (₹)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={fobValue}
                      onChange={(e) => setFobValue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Export Obligation Period
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(e.g. 18 Months)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Blank if not specifically stated"
                      value={exportObligationPeriod}
                      onChange={(e) => setExportObligationPeriod(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3.1: Export Items Schedule (Extracted / Reviewable) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <h4 className="font-semibold text-slate-900 text-sm">
                      3.1 Export Items Schedule ({exportItems.length} items)
                    </h4>
                    {exportItems.some(i => i.needsVerification) && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded font-medium border border-amber-200">
                        Review Required
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExportItemRow}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-md text-[11px] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Export Item
                  </button>
                </div>

                {exportItems.length > 0 ? (
                  <div className="space-y-3">
                    {exportItems.map((item, index) => (
                      <div key={item.id || index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-slate-900 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                              Item #{item.exportSrNo || index + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleExportItemVerification(index)}
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 transition-colors ${
                                item.needsVerification
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Click to toggle verification status"
                            >
                              {item.needsVerification ? (
                                <>
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Needs Verification</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Marked as Verified</span>
                                </>
                              )}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteExportItemRow(index)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors text-xs flex items-center gap-1"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Export Sr No</label>
                            <input
                              type="text"
                              value={item.exportSrNo || ''}
                              onChange={(e) => handleExportItemChange(index, 'exportSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">SION Sr No</label>
                            <input
                              type="text"
                              value={item.sionSrNo || ''}
                              onChange={(e) => handleExportItemChange(index, 'sionSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="e.g. 62/2023"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">ITC HS Code</label>
                            <input
                              type="text"
                              value={item.itcHsCode || ''}
                              onChange={(e) => handleExportItemChange(index, 'itcHsCode', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="8-digit ITC HS Code"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">UOM</label>
                            <input
                              type="text"
                              value={item.uom || ''}
                              onChange={(e) => handleExportItemChange(index, 'uom', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs uppercase"
                              placeholder="MTR, KGS, NOS"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Export Product Description (Verbatim from DGFT)</label>
                          <textarea
                            rows={2}
                            value={item.productDescription || ''}
                            onChange={(e) => handleExportItemChange(index, 'productDescription', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 text-xs font-medium resize-none leading-relaxed"
                            placeholder="Exact product description as printed on the DGFT document"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Quantity (Exact Decimal)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.quantity}
                              onChange={(e) => handleExportItemChange(index, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">FOB Value (INR)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.fobValueInr}
                              onChange={(e) => handleExportItemChange(index, 'fobValueInr', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">FOB Value in FC ({exportForeignCurrency || 'USD'})</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.fobValueFc}
                              onChange={(e) => handleExportItemChange(index, 'fobValueFc', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-500 text-xs">
                    <p>No Export Items extracted yet. Click "Extract Data from PDF" or add manually.</p>
                    <button
                      type="button"
                      onClick={handleAddExportItemRow}
                      className="mt-2 inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      <Plus className="w-3 h-3" /> Add Export Item Row
                    </button>
                  </div>
                )}
              </div>

              {/* Section 3.2: Import Items Schedule (Editable) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      3.2 Import Items Schedule ({importItems.length} items)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Details of items sought to be imported duty free under the Authorisation (Preserve verbatim)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImportItemRow}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-md text-[11px] transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Import Item Row
                  </button>
                </div>

                {importItems.length > 0 ? (
                  <div className="space-y-3">
                    {importItems.map((item, index) => (
                      <div key={item.id || index} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-800 text-white font-mono text-[10px] px-2 py-0.5 rounded font-bold">
                              Input #{item.inputSrNo || index + 1}
                            </span>
                            <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded font-medium border border-blue-200" title="Linked Export Obligation Item">
                              Links to Export #{item.exportSrNo || '1'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleToggleImportItemVerification(index)}
                              className={`text-[10px] px-2 py-0.5 rounded font-medium border flex items-center gap-1 transition-colors ${
                                item.needsVerification
                                  ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              }`}
                              title="Click to toggle verification status"
                            >
                              {item.needsVerification ? (
                                <>
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Needs Verification</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Marked as Verified</span>
                                </>
                              )}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteImportItemRow(index)}
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1 rounded transition-colors text-xs flex items-center gap-1"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Input Sr No</label>
                            <input
                              type="text"
                              value={item.inputSrNo || ''}
                              onChange={(e) => handleImportItemChange(index, 'inputSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Export Sr No (Link)</label>
                            <input
                              type="text"
                              value={item.exportSrNo || ''}
                              onChange={(e) => handleImportItemChange(index, 'exportSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-blue-200 rounded text-blue-900 font-mono text-xs font-semibold"
                              placeholder="1"
                              title="Export Item Serial Number linked to this import input"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">SION Sr No</label>
                            <input
                              type="text"
                              value={item.sionSrNo || ''}
                              onChange={(e) => handleImportItemChange(index, 'sionSrNo', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="e.g. 62/2023"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">ITC HS Code</label>
                            <input
                              type="text"
                              value={item.itcHsCode || ''}
                              onChange={(e) => handleImportItemChange(index, 'itcHsCode', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                              placeholder="8-digit HS Code"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">UOM</label>
                            <input
                              type="text"
                              value={item.uom || ''}
                              onChange={(e) => handleImportItemChange(index, 'uom', e.target.value)}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs uppercase"
                              placeholder="KGS, MTR, NOS"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Input Description (Verbatim from DGFT)</label>
                          <textarea
                            rows={2}
                            value={item.inputDescription || ''}
                            onChange={(e) => handleImportItemChange(index, 'inputDescription', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 text-xs font-medium resize-none leading-relaxed"
                            placeholder="Exact input description verbatim as printed on DGFT document"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Technical Features / Description (Verbatim)</label>
                          <textarea
                            rows={1}
                            value={item.technicalDescription || ''}
                            onChange={(e) => handleImportItemChange(index, 'technicalDescription', e.target.value)}
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 text-xs resize-none"
                            placeholder="Technical features, yarn count, blend, spec verbatim as printed"
                          />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Quantity to Import</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.quantity}
                              onChange={(e) => handleImportItemChange(index, 'quantity', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">CIF Value (INR)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.cifValueInr}
                              onChange={(e) => handleImportItemChange(index, 'cifValueInr', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">CIF Value in FC ({importCurrency || exportForeignCurrency || 'USD'})</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.cifValueFc}
                              onChange={(e) => handleImportItemChange(index, 'cifValueFc', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Duty Saved (INR)</label>
                            <input
                              type="number"
                              step="0.0001"
                              value={item.dutySavedInr}
                              onChange={(e) => handleImportItemChange(index, 'dutySavedInr', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs text-emerald-800 font-semibold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-0.5">Duty Saved (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={item.dutySavedPercent}
                              onChange={(e) => handleImportItemChange(index, 'dutySavedPercent', Number(e.target.value))}
                              className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-slate-900 font-mono text-xs"
                            />
                          </div>
                        </div>

                        {item.needsVerification && (
                          <div>
                            <label className="block text-[10px] font-semibold text-amber-800 uppercase mb-0.5">Verification Notes</label>
                            <input
                              type="text"
                              value={item.verificationNotes || ''}
                              onChange={(e) => handleImportItemChange(index, 'verificationNotes', e.target.value)}
                              className="w-full px-2 py-1 bg-amber-50/50 border border-amber-200 rounded text-amber-900 text-xs"
                              placeholder="Notes on why this item requires manual check"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-4 text-center text-slate-500 text-xs">
                    <p>No Import Items extracted yet. Click "Extract Data from PDF" or add manually.</p>
                    <button
                      type="button"
                      onClick={handleAddImportItemRow}
                      className="mt-2 inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      <Plus className="w-3 h-3" /> Add Import Item Row
                    </button>
                  </div>
                )}
              </div>

              {/* Section 4: Licence Status */}
              <div className="space-y-3 pt-2">
                <h4 className="font-semibold text-slate-900 text-sm border-b border-slate-100 pb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  4. Licence Status
                </h4>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Licence Status</label>
                  <select
                    value={licenceStatus}
                    onChange={(e) => setLicenceStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Closed">Closed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Pending Closure">Pending Closure</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>Save Licence Master Record</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Delete Confirmation Modal --- */}
      {deletingLicence && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center flex-shrink-0 text-rose-600">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900">Delete Advance Licence?</h3>
                  <p className="text-xs text-slate-500">
                    Are you sure you want to permanently delete this licence master record? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Licence Number:</span>
                  <span className="font-mono font-bold text-slate-900">{deletingLicence.licenceNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Company File No:</span>
                  <span className="font-bold text-slate-900">{deletingLicence.fileNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">DGFT File No:</span>
                  <span className="font-mono text-slate-700">{deletingLicence.dgftFileNumber || '—'}</span>
                </div>
                {deletingLicence.exportItems && deletingLicence.exportItems.length > 0 && (
                  <div className="flex justify-between border-t border-slate-200/80 pt-1.5">
                    <span className="text-slate-500 font-medium">Export Schedule:</span>
                    <span className="font-medium text-blue-600">{deletingLicence.exportItems.length} Export Item{deletingLicence.exportItems.length === 1 ? '' : 's'}</span>
                  </div>
                )}
                {deletingLicence.importItems && deletingLicence.importItems.length > 0 && (
                  <div className="flex justify-between border-t border-slate-200/80 pt-1.5">
                    <span className="text-slate-500 font-medium">Import Schedule:</span>
                    <span className="font-medium text-emerald-600">{deletingLicence.importItems.length} Import Item{deletingLicence.importItems.length === 1 ? '' : 's'}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingLicence(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Licence</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Loader2,
  Info,
  ArrowRight,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
} from 'lucide-react';
import { ImportDocument, CurrencyCode, AdvanceLicence } from '../types';
import { createImportDocumentsBulk, fetchLicencesFromDB } from '../lib/supabase';

interface ImportExcelUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (createdDocs: ImportDocument[], message: string) => void;
}

export interface ParsedImportExcelRow {
  tempId: string;
  importBillNumber: string;
  docDate: string;
  customsPort: string;
  importerName: string;
  supplierName: string;
  supplierCountry: string;
  supplierInvoiceNo: string;
  hsCode: string;
  materialDescription: string;
  quantityReceived: number;
  uom: string;
  unitPriceFc: number;
  totalLineValueFc: number;
  totalLineValueInr: number;
  importCurrency: CurrencyCode;
  exchangeRate: number;
  customsDutyPercent: number;
  igstPercent: number;
  boeStatus: 'Cleared' | 'Filed' | 'Rejected';
  customsClearanceDate: string;
  notes: string;
  isValid: boolean;
  warnings: string[];
  licenceId?: string;
}

const VALID_CURRENCIES: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'JPY', 'CAD', 'SGD'];

export const ImportExcelUploaderModal: React.FC<ImportExcelUploaderModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedImportExcelRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [licences, setLicences] = useState<AdvanceLicence[]>([]);
  const [globalBatchLicenceId, setGlobalBatchLicenceId] = useState<string>('');
  const [isLoadingLicences, setIsLoadingLicences] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingLicences(true);
      fetchLicencesFromDB()
        .then((res) => {
          if (res && Array.isArray(res.licences)) {
            setLicences(res.licences);
            if (res.licences.length === 1 && !globalBatchLicenceId) {
              setGlobalBatchLicenceId(res.licences[0].id);
            }
          }
        })
        .catch((err) => console.warn('Failed to fetch licences for excel modal:', err))
        .finally(() => setIsLoadingLicences(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetAll = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setIsProcessingFile(false);
    setIsSaving(false);
    setUploadError(null);
    setSearchFilter('');
    setGlobalBatchLicenceId('');
  };

  const handleApplyGlobalLicenceToAllRows = () => {
    if (!globalBatchLicenceId) {
      alert('Please select an Advance Licence first from the batch dropdown.');
      return;
    }
    setParsedRows((prev) =>
      prev.map((row) => ({
        ...row,
        licenceId: globalBatchLicenceId,
      }))
    );
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Bill of Entry No': '8492015',
        'BoE Date (YYYY-MM-DD)': '2026-04-12',
        'Customs Port': 'INNSA1 - Nhava Sheva',
        'Importer Name': 'Alok Industries Limited',
        'Foreign Supplier': 'Dystar Singapore Pte Ltd',
        'Supplier Country': 'SINGAPORE',
        'Supplier Invoice No': 'INV-SG-2026-081',
        'ITC HS Code': '32041111',
        'Material Description (Verbatim)': 'Disperse Blue 79 Concentrate (200% Standard Commercial Strength)',
        'Quantity': 2500,
        'UOM': 'KGS',
        'Unit Price FC': 14.50,
        'Currency (USD/EUR/GBP)': 'USD',
        'Exchange Rate (INR)': 89.65,
        'Customs Duty %': 7.5,
        'IGST %': 18.0,
        'BoE Status (Cleared/Filed)': 'Cleared',
        'Clearance Date (YYYY-MM-DD)': '2026-04-15',
        'Remarks': 'Duty free raw material consignment under actual inward entry',
      },
      {
        'Bill of Entry No': '8492015',
        'BoE Date (YYYY-MM-DD)': '2026-04-12',
        'Customs Port': 'INNSA1 - Nhava Sheva',
        'Importer Name': 'Alok Industries Limited',
        'Foreign Supplier': 'Dystar Singapore Pte Ltd',
        'Supplier Country': 'SINGAPORE',
        'Supplier Invoice No': 'INV-SG-2026-081',
        'ITC HS Code': '38099190',
        'Material Description (Verbatim)': 'Finishing Agent Auxiliary FR-400 (Flame Retardant Chemical)',
        'Quantity': 1000,
        'UOM': 'KGS',
        'Unit Price FC': 6.20,
        'Currency (USD/EUR/GBP)': 'USD',
        'Exchange Rate (INR)': 89.65,
        'Customs Duty %': 7.5,
        'IGST %': 18.0,
        'BoE Status (Cleared/Filed)': 'Cleared',
        'Clearance Date (YYYY-MM-DD)': '2026-04-15',
        'Remarks': 'Special textile chemical auxiliary',
      },
      {
        'Bill of Entry No': '8492020',
        'BoE Date (YYYY-MM-DD)': '2026-04-20',
        'Customs Port': 'INNSA1 - Nhava Sheva',
        'Importer Name': 'Alok Industries Limited',
        'Foreign Supplier': 'BASF Colors & Chemicals AG',
        'Supplier Country': 'GERMANY',
        'Supplier Invoice No': 'INV-DE-89211',
        'ITC HS Code': '38091010',
        'Material Description (Verbatim)': 'Textile Polymer Modifier Additive MB (Raw Material Grade A)',
        'Quantity': 1500,
        'UOM': 'KGS',
        'Unit Price FC': 8.75,
        'Currency (USD/EUR/GBP)': 'EUR',
        'Exchange Rate (INR)': 96.40,
        'Customs Duty %': 7.5,
        'IGST %': 18.0,
        'BoE Status (Cleared/Filed)': 'Cleared',
        'Clearance Date (YYYY-MM-DD)': '2026-04-23',
        'Remarks': 'High-performance synthetic textile modifier',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const colWidths = [
      { wch: 18 }, { wch: 22 }, { wch: 24 }, { wch: 26 }, { wch: 28 },
      { wch: 18 }, { wch: 20 }, { wch: 16 }, { wch: 45 }, { wch: 12 },
      { wch: 10 }, { wch: 15 }, { wch: 22 }, { wch: 20 }, { wch: 16 },
      { wch: 12 }, { wch: 24 }, { wch: 26 }, { wch: 35 },
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import_Actual_Transactions');
    XLSX.writeFile(workbook, 'Import_Transactions_Template.xlsx');
  };

  // Process uploaded Excel / CSV file
  const handleProcessFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessingFile(true);
    setUploadError(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true, dateNF: 'yyyy-mm-dd' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

      if (rawJson.length === 0) {
        throw new Error('The selected spreadsheet contains no data rows.');
      }

      const parsed: ParsedImportExcelRow[] = rawJson.map((row, index) => {
        // Dynamic column matching by stripping non-alphanumeric characters
        const findVal = (possibleKeys: string[]): string => {
          for (const key of possibleKeys) {
            for (const rowKey of Object.keys(row)) {
              if (rowKey.toLowerCase().replace(/[^a-z0-9]/g, '') === key.toLowerCase().replace(/[^a-z0-9]/g, '')) {
                return String(row[rowKey]).trim();
              }
            }
          }
          return '';
        };

        const boeNumber = findVal([
          'Bill of Entry No',
          'Bill of Entry Number',
          'BoE No',
          'BoE Number',
          'BOE',
          'Import Bill Number',
          'Import Bill No',
          'Bill No',
        ]);

        let docDate = findVal([
          'BoE Date (YYYY-MM-DD)',
          'BoE Date',
          'Filing Date',
          'Bill Date',
          'Date',
        ]);
        if (!docDate || isNaN(Date.parse(docDate))) {
          docDate = new Date().toISOString().split('T')[0];
        } else {
          docDate = new Date(docDate).toISOString().split('T')[0];
        }

        const customsPort =
          findVal(['Customs Port', 'Port of Import', 'Port', 'Port Code']) || 'INNSA1 - Nhava Sheva';
        const importerName =
          findVal(['Importer Name', 'Importer', 'Consignee']) || 'Alok Industries Limited';
        const supplierName =
          findVal(['Foreign Supplier', 'Supplier Name', 'Supplier', 'Vendor Name', 'Vendor']) || 'Foreign Vendor';
        const supplierCountry = (
          findVal(['Supplier Country', 'Country of Origin', 'Origin Country', 'Country']) || 'GERMANY'
        ).toUpperCase();
        const supplierInvoiceNo = findVal([
          'Supplier Invoice No',
          'Invoice Number',
          'Invoice No',
          'Commercial Invoice No',
        ]);

        const rawCurrency = findVal(['Currency (USD/EUR/GBP)', 'Currency', 'Import Currency', 'Curr']).toUpperCase();
        const importCurrency: CurrencyCode = VALID_CURRENCIES.includes(rawCurrency as CurrencyCode)
          ? (rawCurrency as CurrencyCode)
          : 'USD';

        let exchangeRate = parseFloat(findVal(['Exchange Rate (INR)', 'Exchange Rate', 'Forex Rate', 'Rate']));
        if (isNaN(exchangeRate) || exchangeRate <= 0) {
          exchangeRate = importCurrency === 'EUR' ? 96.40 : importCurrency === 'GBP' ? 112.50 : 89.65;
        }

        const hsCode = findVal(['ITC HS Code', 'HS Code', 'HSCode', 'CTH', 'Tariff Code']) || '38091010';
        const materialDescription =
          findVal(['Material Description (Verbatim)', 'Material Description', 'Product Description', 'Description', 'Item Description']) ||
          `Import Raw Material #${index + 1}`;

        let quantity = parseFloat(findVal(['Quantity', 'Inward Qty', 'Qty', 'Quantity Received']));
        if (isNaN(quantity) || quantity <= 0) quantity = 1000;

        const uom = (findVal(['UOM', 'Unit', 'Unit of Measure']) || 'KGS').toUpperCase();

        let unitPriceFc = parseFloat(findVal(['Unit Price FC', 'Unit Price', 'Price FC', 'Rate FC']));
        if (isNaN(unitPriceFc) || unitPriceFc <= 0) unitPriceFc = 5.0;

        let totalLineValueFc = parseFloat(findVal(['Total FC', 'Total Line Value FC', 'Invoice Value FC', 'Assessable Value FC']));
        if (isNaN(totalLineValueFc) || totalLineValueFc <= 0) {
          totalLineValueFc = Number((quantity * unitPriceFc).toFixed(2));
        }

        const totalLineValueInr = Number((totalLineValueFc * exchangeRate).toFixed(2));

        let customsDutyPercent = parseFloat(findVal(['Customs Duty %', 'Duty %', 'Basic Customs Duty %']));
        if (isNaN(customsDutyPercent)) customsDutyPercent = 7.5;

        let igstPercent = parseFloat(findVal(['IGST %', 'IGST Percent', 'GST %']));
        if (isNaN(igstPercent)) igstPercent = 18.0;

        const rawStatus = findVal(['BoE Status (Cleared/Filed)', 'BoE Status', 'Status', 'Clearance Status']).toLowerCase();
        let boeStatus: 'Cleared' | 'Filed' | 'Rejected' = 'Cleared';
        if (rawStatus.includes('file') || rawStatus.includes('pend')) boeStatus = 'Filed';
        else if (rawStatus.includes('reject')) boeStatus = 'Rejected';

        let clearanceDate = findVal(['Clearance Date (YYYY-MM-DD)', 'Clearance Date', 'OOC Date', 'Customs Clearance Date']);
        if (clearanceDate && !isNaN(Date.parse(clearanceDate))) {
          clearanceDate = new Date(clearanceDate).toISOString().split('T')[0];
        } else {
          clearanceDate = boeStatus === 'Cleared' ? docDate : '';
        }

        const notes = findVal(['Remarks', 'Notes', 'Comment']) || 'Imported via Excel spreadsheet';

        const warnings: string[] = [];
        if (!boeNumber) warnings.push('Auto-assigned temporary BoE #');

        return {
          tempId: `excel-row-${Date.now()}-${index}`,
          importBillNumber: boeNumber || `BOE-IMP-${Date.now().toString().slice(-5)}-${index + 1}`,
          docDate,
          customsPort,
          importerName,
          supplierName,
          supplierCountry,
          supplierInvoiceNo,
          hsCode,
          materialDescription,
          quantityReceived: quantity,
          uom,
          unitPriceFc,
          totalLineValueFc,
          totalLineValueInr,
          importCurrency,
          exchangeRate,
          customsDutyPercent,
          igstPercent,
          boeStatus,
          customsClearanceDate: clearanceDate,
          notes,
          isValid: true,
          warnings,
        };
      });

      setParsedRows(parsed);
    } catch (err: any) {
      console.error('[handleProcessFile] Excel error:', err);
      setUploadError(err.message || 'Failed to parse Excel file.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (
        file.name.endsWith('.xlsx') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.csv')
      ) {
        handleProcessFile(file);
      } else {
        setUploadError('Please select a valid Excel spreadsheet (.xlsx, .xls) or .csv file.');
      }
    }
  };

  // Update a field in a parsed row
  const handleUpdateRow = (tempId: string, field: keyof ParsedImportExcelRow, value: any) => {
    setParsedRows((prev) =>
      prev.map((row) => {
        if (row.tempId !== tempId) return row;
        const updated = { ...row, [field]: value };

        // Recalculate totals if price, qty or exchange rate changes
        if (field === 'quantityReceived' || field === 'unitPriceFc' || field === 'exchangeRate') {
          const qty = Number(updated.quantityReceived) || 0;
          const price = Number(updated.unitPriceFc) || 0;
          const rate = Number(updated.exchangeRate) || 89.65;
          const fc = Number((qty * price).toFixed(2));
          updated.totalLineValueFc = fc;
          updated.totalLineValueInr = Number((fc * rate).toFixed(2));
        }

        return updated;
      })
    );
  };

  const handleDeleteRow = (tempId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  const handleAddRow = () => {
    const newRow: ParsedImportExcelRow = {
      tempId: `excel-row-custom-${Date.now()}`,
      importBillNumber: `BOE-IMP-${Date.now().toString().slice(-5)}`,
      docDate: new Date().toISOString().split('T')[0],
      customsPort: 'INNSA1 - Nhava Sheva',
      importerName: 'Alok Industries Limited',
      supplierName: 'Foreign Vendor',
      supplierCountry: 'GERMANY',
      supplierInvoiceNo: '',
      hsCode: '38091010',
      materialDescription: 'New Import Raw Material',
      quantityReceived: 100,
      uom: 'KGS',
      unitPriceFc: 10.0,
      totalLineValueFc: 1000.0,
      totalLineValueInr: 89650.0,
      importCurrency: 'USD',
      exchangeRate: 89.65,
      customsDutyPercent: 7.5,
      igstPercent: 18.0,
      boeStatus: 'Cleared',
      customsClearanceDate: new Date().toISOString().split('T')[0],
      notes: 'Manually added import item row',
      isValid: true,
      warnings: [],
    };
    setParsedRows((prev) => [...prev, newRow]);
  };

  // Save all reviewed rows to Inward Register
  const handleCommitSave = async () => {
    if (parsedRows.length === 0) {
      alert('No rows available to save.');
      return;
    }

    setIsSaving(true);
    try {
      // Group rows by Bill of Entry number so that multiple items under same BoE are saved as a single document with multiple line items
      const docMap = new Map<string, any>();
      const unassignedBoes: string[] = [];

      for (const row of parsedRows) {
        const key = row.importBillNumber.trim().toUpperCase();
        const effectiveLicenceId = row.licenceId || globalBatchLicenceId || '';

        if (!effectiveLicenceId) {
          if (!unassignedBoes.includes(row.importBillNumber.trim())) {
            unassignedBoes.push(row.importBillNumber.trim() || 'Unspecified BoE');
          }
        }

        const selLicence = licences.find((l) => l.id === effectiveLicenceId);

        if (!docMap.has(key)) {
          docMap.set(key, {
            importBillNumber: row.importBillNumber.trim(),
            docDate: row.docDate,
            customsPort: row.customsPort,
            importerName: row.importerName,
            supplierName: row.supplierName,
            supplierCountry: row.supplierCountry,
            supplierInvoiceNo: row.supplierInvoiceNo,
            importCurrency: row.importCurrency,
            exchangeRate: row.exchangeRate,
            customsDutyPercent: row.customsDutyPercent,
            igstPercent: row.igstPercent,
            boeStatus: row.boeStatus,
            customsClearanceDate: row.customsClearanceDate || null,
            notes: row.notes,
            licenceId: effectiveLicenceId,
            licenceNumber: selLicence?.licenceNumber || '',
            companyFileNumber: selLicence?.fileNumber || '',
            lineItems: [],
            totalInvoiceValueFc: 0,
            totalInvoiceValueInr: 0,
          });
        }

        const doc = docMap.get(key);
        doc.lineItems.push({
          hsCode: row.hsCode,
          materialDescription: row.materialDescription,
          quantityReceived: row.quantityReceived,
          uom: row.uom,
          unitPriceFc: row.unitPriceFc,
          totalLineValueFc: row.totalLineValueFc,
          totalLineValueInr: row.totalLineValueInr,
          customsDutyAmount: Number(((row.totalLineValueInr * row.customsDutyPercent) / 100).toFixed(2)),
          notes: row.notes,
        });
        doc.totalInvoiceValueFc += row.totalLineValueFc;
        doc.totalInvoiceValueInr += row.totalLineValueInr;
      }

      if (unassignedBoes.length > 0) {
        setIsSaving(false);
        alert(
          `Please assign an Advance Licence for the following Bill(s) of Entry before committing:\n\n` +
            unassignedBoes.join(', ') +
            `\n\nYou can select a Batch Advance Licence at the top and click "Apply Licence to All Rows", or select a licence per row.`
        );
        return;
      }

      const docsToCreate = Array.from(docMap.values());
      const response = await createImportDocumentsBulk(docsToCreate);

      onImportSuccess(
        response.data,
        `Successfully imported ${docsToCreate.length} Bill of Entry document(s) with ${parsedRows.length} total item row(s).`
      );
      handleClose();
    } catch (err: any) {
      alert(err.message || 'Failed to save imported documents.');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter rows
  const filteredRows = parsedRows.filter((r) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      r.importBillNumber.toLowerCase().includes(q) ||
      r.hsCode.toLowerCase().includes(q) ||
      r.materialDescription.toLowerCase().includes(q) ||
      r.supplierName.toLowerCase().includes(q) ||
      r.supplierCountry.toLowerCase().includes(q)
    );
  });

  const totalQty = parsedRows.reduce((s, r) => s + (Number(r.quantityReceived) || 0), 0);
  const totalInr = parsedRows.reduce((s, r) => s + (Number(r.totalLineValueInr) || 0), 0);
  const uniqueBoECount = new Set(parsedRows.map((r) => r.importBillNumber.trim())).size;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Upload Actual Import Excel</h2>
              <p className="text-xs text-slate-500">
                Bulk upload Bills of Entry & imported material transactions with intelligent header mapping
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Step 1: Dropzone & Template Download (if no parsed rows) */}
          {parsedRows.length === 0 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProcessFile(file);
                  }}
                />

                {isProcessingFile ? (
                  <div className="py-6 flex flex-col items-center justify-center space-y-3">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <p className="font-semibold text-slate-800 text-sm">
                      Reading spreadsheet and mapping column headers...
                    </p>
                    <p className="text-xs text-slate-500">
                      Detecting BoE numbers, HS codes, quantities, and verbatim descriptions...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">
                        Click to select or drag and drop Import Transactions spreadsheet
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Supports Microsoft Excel (.xlsx, .xls) and CSV files with flexible column ordering
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Sample Template bar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-slate-600">
                    <p className="font-semibold text-slate-800">Need a pre-formatted Excel template?</p>
                    <p>Download our standard import spreadsheet with sample BoE and material lines.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template (.xlsx)</span>
                </button>
              </div>

              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
                  <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Editable Review Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 animate-fadeIn">
              {/* Notice Banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs text-amber-900">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold">Excel Import Review:</span> Review and edit mapped rows
                    before committing to the Inward Register.
                    <span className="block mt-0.5 text-amber-800">
                      <strong>Advance Licence Requirement:</strong> An Advance Licence is required for all imported Bills of Entry to record duty-free raw material debit in PostgreSQL. Select a batch licence below or choose per-row.
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setParsedRows([]);
                    setSelectedFile(null);
                  }}
                  className="text-amber-800 hover:text-amber-950 font-semibold underline whitespace-nowrap text-xs"
                >
                  Upload Different File
                </button>
              </div>

              {/* Batch Licence Selection Bar */}
              <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">
                      Batch Advance Licence Selection <span className="text-rose-600">*</span>
                    </span>
                    <span className="text-[11px] text-amber-800">
                      Assign a single licence to all imported rows at once or override individually per row below
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 min-w-[320px]">
                  <select
                    value={globalBatchLicenceId}
                    onChange={(e) => setGlobalBatchLicenceId(e.target.value)}
                    className="flex-1 text-xs px-3 py-1.5 bg-white border border-amber-300 rounded-lg font-medium text-slate-800 focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  >
                    <option value="">-- Select Batch Licence --</option>
                    {licences.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.licenceNumber} (File #{l.fileNumber || 'N/A'})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleApplyGlobalLicenceToAllRows}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-colors whitespace-nowrap shadow-2xs"
                  >
                    Apply to All Rows
                  </button>
                </div>
              </div>

              {/* Stats Bar and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-slate-100 text-slate-800 text-xs px-2.5 py-1 rounded-lg font-semibold">
                    {parsedRows.length} Row(s)
                  </span>
                  <span className="bg-sky-50 text-sky-800 text-xs px-2.5 py-1 rounded-lg font-semibold">
                    {uniqueBoECount} Bill(s) of Entry
                  </span>
                  <span className="bg-emerald-50 text-emerald-800 text-xs px-2.5 py-1 rounded-lg font-mono font-bold">
                    Total: ₹{totalInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter rows..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 w-48"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Row</span>
                  </button>
                </div>
              </div>

              {/* Editable Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-8 text-center">#</th>
                        <th className="py-2.5 px-3 min-w-[120px]">BoE No *</th>
                        <th className="py-2.5 px-3 min-w-[180px]">Advance Licence *</th>
                        <th className="py-2.5 px-3 min-w-[110px]">Filing Date</th>
                        <th className="py-2.5 px-3 min-w-[140px]">Foreign Supplier</th>
                        <th className="py-2.5 px-3 min-w-[110px]">ITC HS Code</th>
                        <th className="py-2.5 px-3 min-w-[260px]">Material Description (Verbatim)</th>
                        <th className="py-2.5 px-3 min-w-[90px] text-right">Qty</th>
                        <th className="py-2.5 px-3 min-w-[70px]">UOM</th>
                        <th className="py-2.5 px-3 min-w-[90px] text-right">Unit Price</th>
                        <th className="py-2.5 px-3 min-w-[80px]">Curr</th>
                        <th className="py-2.5 px-3 min-w-[100px] text-right">Total FC</th>
                        <th className="py-2.5 px-3 min-w-[110px] text-right">Total INR</th>
                        <th className="py-2.5 px-3 min-w-[90px]">Status</th>
                        <th className="py-2.5 px-3 w-10 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredRows.map((row, idx) => (
                        <tr key={row.tempId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.importBillNumber}
                              onChange={(e) => handleUpdateRow(row.tempId, 'importBillNumber', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono font-medium focus:border-emerald-500 focus:bg-white bg-slate-50/50"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.licenceId || globalBatchLicenceId || ''}
                              onChange={(e) => handleUpdateRow(row.tempId, 'licenceId', e.target.value)}
                              className={`w-full px-2 py-1 border rounded text-[11px] font-medium focus:border-emerald-500 focus:bg-white ${
                                !(row.licenceId || globalBatchLicenceId)
                                  ? 'border-rose-400 text-rose-800 bg-rose-50/40'
                                  : 'border-slate-200 text-slate-800 bg-slate-50/50'
                              }`}
                            >
                              <option value="">-- Select Licence --</option>
                              {licences.map((l) => (
                                <option key={l.id} value={l.id}>
                                  {l.licenceNumber} ({l.fileNumber || 'N/A'})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="date"
                              value={row.docDate}
                              onChange={(e) => handleUpdateRow(row.tempId, 'docDate', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:border-emerald-500 focus:bg-white bg-slate-50/50"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.supplierName}
                              onChange={(e) => handleUpdateRow(row.tempId, 'supplierName', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:border-emerald-500 focus:bg-white bg-slate-50/50"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.hsCode}
                              onChange={(e) => handleUpdateRow(row.tempId, 'hsCode', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs font-mono focus:border-emerald-500 focus:bg-white bg-slate-50/50"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.materialDescription}
                              onChange={(e) => handleUpdateRow(row.tempId, 'materialDescription', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs focus:border-emerald-500 focus:bg-white bg-slate-50/50"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="0.001"
                              value={row.quantityReceived}
                              onChange={(e) => handleUpdateRow(row.tempId, 'quantityReceived', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right font-mono focus:border-emerald-500 focus:bg-white bg-slate-50/50"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={row.uom}
                              onChange={(e) => handleUpdateRow(row.tempId, 'uom', e.target.value.toUpperCase())}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs uppercase font-mono focus:border-emerald-500 focus:bg-white bg-slate-50/50"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              step="0.01"
                              value={row.unitPriceFc}
                              onChange={(e) => handleUpdateRow(row.tempId, 'unitPriceFc', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1 border border-slate-200 rounded text-xs text-right font-mono focus:border-emerald-500 focus:bg-white bg-slate-50/50"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.importCurrency}
                              onChange={(e) => handleUpdateRow(row.tempId, 'importCurrency', e.target.value)}
                              className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs font-mono bg-slate-50/50"
                            >
                              {VALID_CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700 font-medium">
                            {Number(row.totalLineValueFc).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900">
                            ₹
                            {Number(row.totalLineValueInr).toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="py-2 px-3">
                            <select
                              value={row.boeStatus}
                              onChange={(e) => handleUpdateRow(row.tempId, 'boeStatus', e.target.value)}
                              className="w-full px-1.5 py-1 border border-slate-200 rounded text-[11px] font-medium bg-slate-50/50"
                            >
                              <option value="Cleared">Cleared</option>
                              <option value="Filed">Filed</option>
                              <option value="Rejected">Rejected</option>
                            </select>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.tempId)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Delete row"
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 hidden sm:inline">
                {parsedRows.length} item row(s) ready to import
              </span>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCommitSave}
                className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing to Register...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save {parsedRows.length} Row(s) to Inward Register</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

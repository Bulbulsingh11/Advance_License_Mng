import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  ArrowRight,
  RefreshCw,
  FileCheck2,
  Trash2,
  HelpCircle,
  Building2,
  Info
} from 'lucide-react';
import { AdvanceLicence, ShippingBill, CurrencyCode, BrcStatus } from '../types';
import { saveShippingBillsBulkToDB } from '../lib/supabase';

interface ExportExcelUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  licences: AdvanceLicence[];
  onImportSuccess: (importedCount: number, message: string) => void;
}

interface ParsedExportRow {
  tempId: string;
  shippingBillNumber: string;
  shippingBillDate: string;
  licenceId: string;
  licenceNumber: string;
  companyFileNumber: string;
  portOfExport: string;
  portCode: string;
  destinationCountry: string;
  buyerName: string;
  invoiceNumber: string;
  invoiceDate?: string;
  currency: CurrencyCode;
  exchangeRate: number;
  totalFobFc: number;
  totalFobInr: number;
  status: ShippingBill['status'];
  remarks: string;
  // Line item
  itcHsCode: string;
  productDescription: string;
  quantity: number;
  uom: string;
  // BRC Details
  brcStatus: BrcStatus;
  brcNumber: string;
  realizedDate?: string;
  realizedAmountFc: number;
  realizedAmountInr: number;
  bankName: string;
  adCode: string;
  eBrcDocumentNumber: string;
  // Validation status
  isValid: boolean;
  warnings: string[];
}

export const ExportExcelUploaderModal: React.FC<ExportExcelUploaderModalProps> = ({
  isOpen,
  onClose,
  licences,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedExportRow[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Active licences for matching
  const activeLicences = licences.filter((l) => l.licenceStatus !== 'Cancelled');

  // Helper to find matching licence from string
  const findMatchingLicence = (searchTerm: string): AdvanceLicence | undefined => {
    if (!searchTerm) return undefined;
    const clean = searchTerm.trim().toLowerCase();
    return activeLicences.find((lic) => {
      const num = (lic.licenceNumber || '').toLowerCase();
      const file = (lic.fileNumber || '').toLowerCase();
      return (
        num === clean ||
        file === clean ||
        (num && num.includes(clean)) ||
        (file && file.includes(clean))
      );
    });
  };

  // 1. Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Shipping Bill No': '9845101',
        'Shipping Bill Date (YYYY-MM-DD)': '2026-04-15',
        'Licence Number or File No': licences[0]?.licenceNumber || '0310998822',
        'Port of Export': 'INNSA1 - Nhava Sheva',
        'Destination Country': 'United States',
        'Buyer Name': 'Global Apparel Imports LLC, New York',
        'Invoice Number': 'EXP/ALOK/2026/0101',
        'Invoice Date (YYYY-MM-DD)': '2026-04-10',
        'Currency (USD/EUR/GBP/INR)': 'USD',
        'Exchange Rate (INR)': 83.50,
        'ITC HS Code': '52081190',
        'Product Description': '100% Cotton Dyed & Printed Woven Finished Fabric',
        'Quantity': 10000,
        'UOM': 'MTR',
        'FOB Value FC': 25000.00,
        'BRC Status (Realized / Received / Not Received)': 'Realized',
        'e-BRC Number': 'eBRC/2026/9845101',
        'Realized Date (YYYY-MM-DD)': '2026-05-20',
        'Bank Name': 'State Bank of India',
        'AD Code': '0210045',
        'Remarks': 'Nostro inward remittance matched via Swift'
      },
      {
        'Shipping Bill No': '9845102',
        'Shipping Bill Date (YYYY-MM-DD)': '2026-04-22',
        'Licence Number or File No': licences[1]?.licenceNumber || licences[0]?.licenceNumber || '0310998822',
        'Port of Export': 'INNSA1 - Nhava Sheva',
        'Destination Country': 'Germany',
        'Buyer Name': 'EuroTex Logistics GmbH, Hamburg',
        'Invoice Number': 'EXP/ALOK/2026/0102',
        'Invoice Date (YYYY-MM-DD)': '2026-04-18',
        'Currency (USD/EUR/GBP/INR)': 'EUR',
        'Exchange Rate (INR)': 90.75,
        'ITC HS Code': '52081190',
        'Product Description': 'Premium Cotton Shirting Fabric',
        'Quantity': 8000,
        'UOM': 'MTR',
        'FOB Value FC': 18000.00,
        'BRC Status (Realized / Received / Not Received)': 'Received',
        'e-BRC Number': 'eBRC/2026/9845102',
        'Realized Date (YYYY-MM-DD)': '2026-05-28',
        'Bank Name': 'State Bank of India',
        'AD Code': '0210045',
        'Remarks': 'FIRC certificate issued'
      },
      {
        'Shipping Bill No': '9845103',
        'Shipping Bill Date (YYYY-MM-DD)': '2026-05-02',
        'Licence Number or File No': licences[0]?.fileNumber || '03/21/040/00122/AM26',
        'Port of Export': 'INBOM4 - Air Cargo Mumbai',
        'Destination Country': 'United Kingdom',
        'Buyer Name': 'London Fashion Retailers Ltd',
        'Invoice Number': 'EXP/ALOK/2026/0103',
        'Invoice Date (YYYY-MM-DD)': '2026-04-29',
        'Currency (USD/EUR/GBP/INR)': 'GBP',
        'Exchange Rate (INR)': 106.20,
        'ITC HS Code': '63023100',
        'Product Description': 'Cotton Bed Linen Sets & Home Textiles',
        'Quantity': 1200,
        'UOM': 'SET',
        'FOB Value FC': 14500.00,
        'BRC Status (Realized / Received / Not Received)': 'Not Received',
        'e-BRC Number': '',
        'Realized Date (YYYY-MM-DD)': '',
        'Bank Name': 'State Bank of India',
        'AD Code': '0210045',
        'Remarks': 'Shipment in transit'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    
    // Auto column width
    const colWidths = [
      { wch: 18 }, { wch: 28 }, { wch: 30 }, { wch: 24 }, { wch: 22 },
      { wch: 36 }, { wch: 24 }, { wch: 26 }, { wch: 26 }, { wch: 22 },
      { wch: 16 }, { wch: 45 }, { wch: 14 }, { wch: 10 }, { wch: 18 },
      { wch: 44 }, { wch: 22 }, { wch: 26 }, { wch: 22 }, { wch: 14 }, { wch: 35 }
    ];
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Shipping_Bills_Template');
    XLSX.writeFile(workbook, 'Alok_Export_Shipping_Bills_Template.xlsx');
  };

  // 2. Parse Excel/CSV File
  const handleFileChange = async (file: File) => {
    if (!file) return;
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
        throw new Error('The selected Excel/CSV file contains no rows or data.');
      }

      // Process and map rows
      const parsed: ParsedExportRow[] = rawJson.map((row, index) => {
        // Flexible key matching
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

        const sbNumber = findVal(['Shipping Bill No', 'ShippingBillNumber', 'SB Number', 'SB No', 'Shipping Bill #']);
        let sbDate = findVal(['Shipping Bill Date (YYYY-MM-DD)', 'Shipping Bill Date', 'SB Date', 'Date']);
        if (!sbDate || isNaN(Date.parse(sbDate))) {
          sbDate = new Date().toISOString().split('T')[0];
        } else {
          sbDate = new Date(sbDate).toISOString().split('T')[0];
        }

        const licenceRef = findVal(['Licence Number or File No', 'Licence Number', 'Licence No', 'File Number', 'File No', 'Advance Licence']);
        const matchedLic = findMatchingLicence(licenceRef) || (licences.length > 0 ? licences[0] : undefined);

        const portOfExport = findVal(['Port of Export', 'Port', 'Port Name']) || 'INNSA1 - Nhava Sheva';
        const portCode = portOfExport.split(' ')[0] || 'INNSA1';
        const destinationCountry = findVal(['Destination Country', 'Country', 'Destination']) || 'United States';
        const buyerName = findVal(['Buyer Name', 'Buyer', 'Consignee', 'Customer']) || 'Global Buyer';
        const invoiceNumber = findVal(['Invoice Number', 'Invoice No', 'Inv No']) || `EXP/INV/${Date.now().toString().slice(-4)}`;
        let invoiceDate = findVal(['Invoice Date (YYYY-MM-DD)', 'Invoice Date', 'Inv Date']);
        if (invoiceDate && !isNaN(Date.parse(invoiceDate))) {
          invoiceDate = new Date(invoiceDate).toISOString().split('T')[0];
        } else {
          invoiceDate = sbDate;
        }

        const rawCurrency = findVal(['Currency (USD/EUR/GBP/INR)', 'Currency', 'Curr']).toUpperCase();
        const validCurrencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'JPY', 'CAD', 'SGD'];
        const currency: CurrencyCode = validCurrencies.includes(rawCurrency as CurrencyCode)
          ? (rawCurrency as CurrencyCode)
          : (matchedLic?.exportForeignCurrency as CurrencyCode) || 'USD';

        let exchangeRate = parseFloat(findVal(['Exchange Rate (INR)', 'Exchange Rate', 'Forex Rate', 'Rate']));
        if (isNaN(exchangeRate) || exchangeRate <= 0) {
          exchangeRate = matchedLic?.exportExchangeRate || (currency === 'EUR' ? 90.75 : currency === 'GBP' ? 106.2 : 83.50);
        }

        const itcHsCode = findVal(['ITC HS Code', 'HS Code', 'ITCHSCode', 'HSCode']) || '52081190';
        const productDescription = findVal(['Product Description', 'Description', 'Item Description']) || 'Textile Goods / Cotton Fabric';
        
        let quantity = parseFloat(findVal(['Quantity', 'Qty', 'Item Qty']));
        if (isNaN(quantity) || quantity <= 0) quantity = 1000;

        const uom = (findVal(['UOM', 'Unit', 'Unit of Measure']) || 'MTR').toUpperCase();

        let totalFobFc = parseFloat(findVal(['FOB Value FC', 'FOB Value (FC)', 'FOB FC', 'FOB Amount FC', 'Total FOB']));
        if (isNaN(totalFobFc) || totalFobFc <= 0) {
          totalFobFc = quantity * 2.5; // fallback
        }

        const totalFobInr = Number((totalFobFc * exchangeRate).toFixed(4));

        // BRC fields
        const rawBrcStatus = findVal(['BRC Status (Realized / Received / Not Received)', 'BRC Status', 'Realization Status']).toLowerCase();
        let brcStatus: BrcStatus = 'Not Received';
        if (rawBrcStatus.includes('realiz')) brcStatus = 'Realized';
        else if (rawBrcStatus.includes('receiv')) brcStatus = 'Received';

        const brcNumber = findVal(['e-BRC Number', 'BRC Number', 'BRC No', 'eBRC No']) || (brcStatus === 'Realized' ? `eBRC/${new Date().getFullYear()}/${sbNumber || index + 1}` : '');
        let realizedDate = findVal(['Realized Date (YYYY-MM-DD)', 'Realized Date', 'Realisation Date', 'Bank Date']);
        if (realizedDate && !isNaN(Date.parse(realizedDate))) {
          realizedDate = new Date(realizedDate).toISOString().split('T')[0];
        } else if (brcStatus === 'Realized') {
          realizedDate = sbDate;
        }

        const bankName = findVal(['Bank Name', 'Bank', 'Realizing Bank']) || 'State Bank of India';
        const adCode = findVal(['AD Code', 'Bank AD Code', 'ADCode']) || '0210045';
        const remarks = findVal(['Remarks', 'Notes', 'Comment']) || 'Imported via Excel spreadsheet.';

        // Validation checks
        const warnings: string[] = [];
        if (!sbNumber) warnings.push('Generated temporary SB #');
        if (!matchedLic) warnings.push('No matching Advance Licence found - please assign manually');

        return {
          tempId: `row-${Date.now()}-${index}`,
          shippingBillNumber: sbNumber || `SB-AUTO-${Date.now().toString().slice(-5)}-${index + 1}`,
          shippingBillDate: sbDate,
          licenceId: matchedLic?.id || '',
          licenceNumber: matchedLic?.licenceNumber || (licenceRef || 'Unmapped'),
          companyFileNumber: matchedLic?.fileNumber || 'Unmapped',
          portOfExport,
          portCode,
          destinationCountry,
          buyerName,
          invoiceNumber,
          invoiceDate,
          currency,
          exchangeRate,
          totalFobFc,
          totalFobInr,
          status: 'Exported',
          remarks,
          itcHsCode,
          productDescription,
          quantity,
          uom,
          brcStatus,
          brcNumber,
          realizedDate: brcStatus !== 'Not Received' ? realizedDate : undefined,
          realizedAmountFc: brcStatus === 'Realized' ? totalFobFc : 0,
          realizedAmountInr: brcStatus === 'Realized' ? totalFobInr : 0,
          bankName,
          adCode,
          eBrcDocumentNumber: brcNumber ? `IRN-${Date.now().toString().slice(-6)}` : '',
          isValid: true,
          warnings,
        };
      });

      setParsedRows(parsed);
    } catch (err: any) {
      console.error('Excel parse error:', err);
      setUploadError(err.message || 'Failed to parse Excel file. Please ensure it is a valid spreadsheet.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Change licence assignment for a specific row in the preview
  const handleAssignLicence = (tempId: string, licenceId: string) => {
    const selected = licences.find((l) => l.id === licenceId);
    if (!selected) return;

    setParsedRows((prev) =>
      prev.map((row) => {
        if (row.tempId === tempId) {
          const warnings = row.warnings.filter((w) => !w.includes('No matching Advance Licence'));
          return {
            ...row,
            licenceId: selected.id,
            licenceNumber: selected.licenceNumber,
            companyFileNumber: selected.fileNumber,
            warnings,
          };
        }
        return row;
      })
    );
  };

  // Bulk assign all unmapped rows to a specific licence
  const handleBulkAssignLicence = (licenceId: string) => {
    const selected = licences.find((l) => l.id === licenceId);
    if (!selected) return;

    setParsedRows((prev) =>
      prev.map((row) => {
        const warnings = row.warnings.filter((w) => !w.includes('No matching Advance Licence'));
        return {
          ...row,
          licenceId: selected.id,
          licenceNumber: selected.licenceNumber,
          companyFileNumber: selected.fileNumber,
          warnings,
        };
      })
    );
  };

  // Remove a row from the preview table
  const handleRemoveRow = (tempId: string) => {
    setParsedRows((prev) => prev.filter((r) => r.tempId !== tempId));
  };

  // 3. Confirm & Execute Bulk Import
  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;

    // Check if any row lacks a valid licenceId
    const unmapped = parsedRows.filter((r) => !r.licenceId);
    if (unmapped.length > 0) {
      alert(`Please assign an Advance Licence to all ${unmapped.length} unmapped rows before importing.`);
      return;
    }

    setIsImporting(true);
    try {
      const payload: Partial<ShippingBill>[] = parsedRows.map((row, idx) => ({
        id: `SB-IMP-${Date.now()}-${idx}`,
        licenceId: row.licenceId,
        licenceNumber: row.licenceNumber,
        companyFileNumber: row.companyFileNumber,
        shippingBillNumber: row.shippingBillNumber,
        shippingBillDate: row.shippingBillDate,
        portOfExport: row.portOfExport,
        portCode: row.portCode,
        destinationCountry: row.destinationCountry,
        buyerName: row.buyerName,
        invoiceNumber: row.invoiceNumber,
        invoiceDate: row.invoiceDate,
        currency: row.currency,
        exchangeRate: row.exchangeRate,
        totalFobFc: row.totalFobFc,
        totalFobInr: row.totalFobInr,
        status: row.status,
        remarks: row.remarks,
        items: [
          {
            id: `itm-${Date.now()}-${idx}`,
            shippingBillId: '',
            itemSrNo: '1',
            itcHsCode: row.itcHsCode,
            productDescription: row.productDescription,
            quantity: row.quantity,
            uom: row.uom,
            fobValueCurrency: row.currency,
            fobValueFc: row.totalFobFc,
            exchangeRate: row.exchangeRate,
            fobValueInr: row.totalFobInr,
            notes: row.remarks,
          }
        ],
        brcTracking: {
          id: `BRC-IMP-${Date.now()}-${idx}`,
          shippingBillId: '',
          brcNumber: row.brcNumber,
          brcStatus: row.brcStatus,
          receivedDate: row.brcStatus !== 'Not Received' ? row.realizedDate : undefined,
          realizedDate: row.brcStatus === 'Realized' ? row.realizedDate : undefined,
          currency: row.currency,
          realizedAmountFc: row.realizedAmountFc,
          realizedExchangeRate: row.exchangeRate,
          realizedAmountInr: row.realizedAmountInr,
          bankName: row.bankName,
          bankBranch: 'Corporate Accounts Group, Mumbai',
          ifscCode: 'SBIN0009999',
          adCode: row.adCode,
          eBrcDocumentNumber: row.eBrcDocumentNumber,
          remarks: row.remarks,
        }
      }));

      const res = await saveShippingBillsBulkToDB(payload);
      
      onImportSuccess(
        res.count,
        `Successfully imported ${res.count} Shipping Bills and updated Advance Licence Export Obligations!`
      );
      onClose();
    } catch (err: any) {
      alert(`Bulk import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Preview totals
  const previewTotalInr = parsedRows.reduce((acc, r) => acc + (r.totalFobInr || 0), 0);
  const previewRealizedCount = parsedRows.filter((r) => r.brcStatus === 'Realized').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Excel & CSV Importer for Export Transactions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Bulk upload shipping bills, multi-currency FOB line items, and e-BRC realization records directly into PostgreSQL.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors shadow-xs"
              title="Download pre-formatted Alok Industries Excel Template"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template (.xlsx)
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* File Upload Drag & Drop Zone */}
          {parsedRows.length === 0 && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="p-4 bg-blue-50 text-blue-600 rounded-full">
                <Upload className={`w-8 h-8 ${isProcessingFile ? 'animate-bounce' : ''}`} />
              </div>

              <div>
                <p className="text-base font-semibold text-slate-800">
                  {isProcessingFile ? 'Parsing Spreadsheet...' : 'Drop your Excel or CSV file here, or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports <code className="font-semibold text-slate-700">.xlsx</code>, <code className="font-semibold text-slate-700">.xls</code>, and <code className="font-semibold text-slate-700">.csv</code> up to 25MB
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Auto-header matching
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Advance Licence auto-linking
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Real-time Obligation Discharging
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="text-rose-500 hover:text-rose-700 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Parsed Spreadsheet Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              {/* Preview Action & Summary Bar */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-slate-900">
                      {parsedRows.length} Records Parsed
                    </span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="text-xs text-slate-600">
                    Total Value: <span className="font-semibold text-slate-900 font-mono">₹{(previewTotalInr / 10000000).toFixed(3)} Cr</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <div className="text-xs text-emerald-700 font-medium">
                    {previewRealizedCount} e-BRCs Realized
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Bulk Licence Assigner */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span>Set all to:</span>
                    <select
                      onChange={(e) => {
                        if (e.target.value) handleBulkAssignLicence(e.target.value);
                      }}
                      className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-700"
                    >
                      <option value="">-- Apply Licence to All --</option>
                      {activeLicences.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.licenceNumber} ({l.fileNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setSelectedFile(null);
                    }}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
                  >
                    Clear & Re-upload
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-100/80 sticky top-0 border-b border-slate-200 z-10 font-semibold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Shipping Bill #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Advance Licence Linked</th>
                        <th className="py-2.5 px-3">Destination & Buyer</th>
                        <th className="py-2.5 px-3 text-right">FOB (FC)</th>
                        <th className="py-2.5 px-3 text-right">FOB (INR)</th>
                        <th className="py-2.5 px-3 text-center">BRC Status</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedRows.map((row, idx) => {
                        const isRealized = row.brcStatus === 'Realized';
                        return (
                          <tr key={row.tempId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                            
                            <td className="py-2.5 px-3 font-semibold text-blue-600 font-mono">
                              #{row.shippingBillNumber}
                            </td>

                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                              {row.shippingBillDate}
                            </td>

                            <td className="py-2.5 px-3">
                              <select
                                value={row.licenceId}
                                onChange={(e) => handleAssignLicence(row.tempId, e.target.value)}
                                className={`px-2 py-1 rounded text-xs font-medium border ${
                                  row.licenceId
                                    ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                                    : 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                                }`}
                              >
                                <option value="">-- Assign Licence --</option>
                                {activeLicences.map((lic) => (
                                  <option key={lic.id} value={lic.id}>
                                    {lic.licenceNumber} (File {lic.fileNumber})
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="py-2.5 px-3 text-slate-700 max-w-[180px] truncate">
                              <div className="font-medium truncate">{row.destinationCountry}</div>
                              <div className="text-[11px] text-slate-400 truncate">{row.buyerName}</div>
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap">
                              {row.currency} {row.totalFobFc?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                              ₹{row.totalFobInr?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              {isRealized ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                  Realized
                                </span>
                              ) : row.brcStatus === 'Received' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                                  Received
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800">
                                  Pending
                                </span>
                              )}
                            </td>

                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => handleRemoveRow(row.tempId)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title="Remove row from import"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Quick Guide Card */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Info className="w-4 h-4 text-blue-600" />
              <span>Bulk Uploader Tips & Guidelines:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-500">
              <li>
                <strong>Licence Mapping:</strong> The importer automatically links records using the <em>Licence Number</em> or <em>DGFT File Number</em> column. You can also assign/reassign licences directly in the table.
              </li>
              <li>
                <strong>Automatic Obligation Fulfillment:</strong> Rows marked as <strong>Realized</strong> will instantly credit the linked Advance Authorisation and recalculate export obligation progress in real-time.
              </li>
              <li>
                <strong>Exchange Rates:</strong> Foreign currency values (USD, EUR, GBP) are converted to INR using specified rates or the standard Alok Industries baseline.
              </li>
            </ul>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-200 bg-slate-50/75 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors shadow-xs"
          >
            Cancel
          </button>

          {parsedRows.length > 0 && (
            <button
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Importing to Database & Calculating Obligations...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import {parsedRows.length} Shipping Bills
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

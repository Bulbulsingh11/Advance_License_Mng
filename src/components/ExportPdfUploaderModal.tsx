import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  FileCheck2,
  Trash2,
  Building2,
  Plus,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { AdvanceLicence, ShippingBill, CurrencyCode, ShippingBillItem } from '../types';
import { saveShippingBillToDB } from '../lib/supabase';

interface ExportPdfUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  licences: AdvanceLicence[];
  onImportSuccess: (message: string) => void;
}

export const ExportPdfUploaderModal: React.FC<ExportPdfUploaderModalProps> = ({
  isOpen,
  onClose,
  licences,
  onImportSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Extracted / Editable state
  const [shippingBillNumber, setShippingBillNumber] = useState('');
  const [shippingBillDate, setShippingBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [portCode, setPortCode] = useState('INNSA1');
  const [portOfExport, setPortOfExport] = useState('INNSA1 - Nhava Sheva');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(83.50);
  const [selectedLicenceId, setSelectedLicenceId] = useState('');
  const [extractedLicenceNo, setExtractedLicenceNo] = useState('');

  const [lineItems, setLineItems] = useState<Array<{
    id: string;
    itemSrNo: string;
    itcHsCode: string;
    productDescription: string;
    quantity: number;
    uom: string;
    fobValueFc: number;
    fobValueInr: number;
    needsVerification?: boolean;
  }>>([]);

  const [isExtracted, setIsExtracted] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeLicences = licences.filter((l) => l.licenceStatus !== 'Cancelled' && l.licenceStatus !== 'Closed');

  // Handle file selection and Gemini PDF extraction API call
  const handleFileChange = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsExtracting(true);
    setExtractionError(null);
    setExtractionNotice(null);
    setIsExtracted(false);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64String = (reader.result as string).split(',')[1];
          const response = await fetch('/api/extract-shipping-bill-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: base64String, fileName: file.name }),
          });

          const data = await response.json();
          if (!data.success || !data.extracted) {
            throw new Error(data.error || 'Failed to extract Shipping Bill PDF data.');
          }

          const ext = data.extracted;

          // Populate extracted fields
          setShippingBillNumber(ext.shippingBillNumber || '');
          if (ext.shippingBillDate && !isNaN(Date.parse(ext.shippingBillDate))) {
            setShippingBillDate(ext.shippingBillDate);
          }
          setPortCode(ext.portCode || 'INNSA1');
          setPortOfExport(ext.portOfExport || 'INNSA1 - Nhava Sheva');
          setDestinationCountry(ext.destinationCountry || '');
          setBuyerName(ext.buyerName || '');
          setInvoiceNumber(ext.invoiceNumber || '');
          if (ext.invoiceDate && !isNaN(Date.parse(ext.invoiceDate))) {
            setInvoiceDate(ext.invoiceDate);
          }

          const validCurrencies: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'JPY', 'CAD', 'SGD'];
          const extCurr = (ext.currency || 'USD').toUpperCase();
          if (validCurrencies.includes(extCurr as CurrencyCode)) {
            setCurrency(extCurr as CurrencyCode);
          }

          if (ext.exchangeRate && ext.exchangeRate > 0) {
            setExchangeRate(Number(ext.exchangeRate));
          }

          const extLicNo = ext.licenceNumber || '';
          setExtractedLicenceNo(extLicNo);

          // Try to match advance licence
          if (extLicNo) {
            const matched = activeLicences.find(
              (l) =>
                l.licenceNumber.toLowerCase().includes(extLicNo.toLowerCase()) ||
                l.fileNumber.toLowerCase().includes(extLicNo.toLowerCase())
            );
            if (matched) {
              setSelectedLicenceId(matched.id);
            } else if (activeLicences.length > 0) {
              setSelectedLicenceId(activeLicences[0].id);
            }
          } else if (activeLicences.length > 0) {
            setSelectedLicenceId(activeLicences[0].id);
          }

          // Populate line items
          if (ext.items && Array.isArray(ext.items) && ext.items.length > 0) {
            setLineItems(
              ext.items.map((item: any, idx: number) => ({
                id: `item-${Date.now()}-${idx}`,
                itemSrNo: item.itemSrNo || String(idx + 1),
                itcHsCode: item.itcHsCode || '',
                productDescription: item.productDescription || '',
                quantity: Number(item.quantity) || 0,
                uom: item.uom || 'MTR',
                fobValueFc: Number(item.fobValueFc) || 0,
                fobValueInr: Number(item.fobValueInr) || Number((Number(item.fobValueFc || 0) * (ext.exchangeRate || 83.5)).toFixed(4)),
                needsVerification: item.needsVerification || !item.itcHsCode || !item.quantity,
              }))
            );
          } else {
            setLineItems([]);
            setExtractionNotice('Extraction warning: No line items could be detected in the PDF. Please add them manually.');
          }

          setIsExtracted(true);
        } catch (parseErr: any) {
          console.error('PDF parsing error:', parseErr);
          setExtractionError(parseErr.message || 'Failed to parse extracted JSON from PDF.');
        } finally {
          setIsExtracting(false);
        }
      };
      reader.onerror = (error) => {
        setIsExtracting(false);
        setExtractionError('Failed to read PDF file.');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsExtracting(false);
      setExtractionError(err.message || 'Error processing file upload.');
    }
  };

  // Line item helpers
  const updateLineItem = (index: number, field: string, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };
      if (field === 'fobValueFc' || field === 'quantity') {
        item.fobValueInr = Number((Number(item.fobValueFc || 0) * exchangeRate).toFixed(4));
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
        productDescription: '',
        quantity: 1000,
        uom: 'MTR',
        fobValueFc: 2500,
        fobValueInr: Number((2500 * exchangeRate).toFixed(4)),
        needsVerification: true,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalFobFc = lineItems.reduce((acc, curr) => acc + (Number(curr.fobValueFc) || 0), 0);
  const totalFobInr = lineItems.reduce((acc, curr) => acc + (Number(curr.fobValueInr) || 0), 0);

  // Validation
  const isFormValid =
    shippingBillNumber.trim() !== '' &&
    shippingBillDate !== '' &&
    selectedLicenceId !== '' &&
    lineItems.length > 0 &&
    lineItems.every((item) => item.productDescription.trim() !== '' && item.quantity > 0 && item.fobValueFc > 0);

  // Save / Commit to Export Register
  const handleSaveToRegister = async () => {
    if (!isFormValid) {
      alert('Please ensure all mandatory fields (SB Number, Date, Advance Licence, and Line Items with description/qty/FOB) are filled correctly.');
      return;
    }

    const lic = licences.find((l) => l.id === selectedLicenceId);
    if (!lic) {
      alert('Selected Advance Licence not found.');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<ShippingBill> = {
        id: `SB-PDF-${Date.now()}`,
        licenceId: lic.id,
        licenceNumber: lic.licenceNumber,
        companyFileNumber: lic.fileNumber,
        shippingBillNumber: shippingBillNumber.trim(),
        shippingBillDate,
        portOfExport,
        portCode,
        destinationCountry: destinationCountry || 'International',
        buyerName: buyerName || 'Export Buyer',
        invoiceNumber: invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
        invoiceDate: invoiceDate || shippingBillDate,
        currency,
        exchangeRate: Number(exchangeRate),
        totalFobFc: Number(totalFobFc.toFixed(4)),
        totalFobInr: Number(totalFobInr.toFixed(4)),
        status: 'Exported',
        remarks: `Extracted from PDF: ${selectedFile?.name || 'Shipping Bill'}`,
        items: lineItems.map((itm, idx) => ({
          id: `item-${Date.now()}-${idx}`,
          shippingBillId: '',
          itemSrNo: itm.itemSrNo || String(idx + 1),
          itcHsCode: itm.itcHsCode || '52081190',
          productDescription: itm.productDescription,
          quantity: Number(itm.quantity),
          uom: itm.uom || 'MTR',
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
        },
      };

      await saveShippingBillToDB(payload);
      onImportSuccess(`Shipping Bill #${shippingBillNumber} extracted from PDF and saved to Export Register successfully!`);
      onClose();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/75">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl shadow-xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Upload Shipping Bill PDF (ICEGATE EDI)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                AI extraction of ICEGATE EDI Shipping Bill printouts with strict verification and Advance Licence mapping.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Step 1: Upload Box (shown if not extracted yet or resetting) */}
          {!isExtracted && (
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
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/70'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="p-4 bg-blue-50 text-blue-600 rounded-full shadow-inner">
                <Upload className={`w-8 h-8 ${isExtracting ? 'animate-bounce' : ''}`} />
              </div>

              <div>
                <p className="text-base font-semibold text-slate-800">
                  {isExtracting ? 'Extracting Shipping Bill PDF via Gemini AI...' : 'Drop ICEGATE Shipping Bill PDF here, or click to browse'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports multi-page ICEGATE EDI export printouts (.pdf)
                </p>
              </div>

              {isExtracting && (
                <div className="flex items-center gap-2 text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing document header, valuation block, and line items...
                </div>
              )}
            </div>
          )}

          {/* Extraction Error */}
          {extractionError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-rose-800 text-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>{extractionError}</span>
              </div>
              <button
                onClick={() => setExtractionError(null)}
                className="text-rose-500 hover:text-rose-700 font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Extraction Notice */}
          {extractionNotice && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-amber-800 text-sm">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <span>{extractionNotice}</span>
              </div>
              <button onClick={() => setExtractionNotice(null)} className="text-amber-500 hover:text-amber-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Extracted & Review Form */}
          {isExtracted && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* File Info Banner */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-slate-700 font-medium truncate">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{selectedFile?.name}</span>
                  <span className="text-slate-400">({((selectedFile?.size || 0) / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  onClick={() => {
                    setIsExtracted(false);
                    setSelectedFile(null);
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline flex-shrink-0"
                >
                  Upload a different PDF
                </button>
              </div>

              {/* Advance Licence Assignment */}
              <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Advance Licence Association (Mandatory)
                  </label>
                  {extractedLicenceNo && (
                    <span className="text-xs font-medium text-slate-600">
                      Extracted Licence Ref: <strong className="text-slate-900">{extractedLicenceNo}</strong>
                    </span>
                  )}
                </div>

                <select
                  value={selectedLicenceId}
                  onChange={(e) => setSelectedLicenceId(e.target.value)}
                  className="w-full text-sm bg-white border border-blue-300 rounded-lg p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                >
                  <option value="">-- Select Advance Licence to debit export obligation against --</option>
                  {activeLicences.map((lic) => (
                    <option key={lic.id} value={lic.id}>
                      Licence #{lic.licenceNumber} (File: {lic.fileNumber}) - Balance FOB: ₹{Number(lic.exportObligationValue || lic.fobValueInr || 0).toLocaleString()}
                    </option>
                  ))}
                </select>
                {!selectedLicenceId && (
                  <p className="text-xs text-rose-600 font-medium">⚠️ A valid Advance Licence must be selected to commit this shipping bill.</p>
                )}
              </div>

              {/* Header Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Bill Number *</label>
                  <input
                    type="text"
                    value={shippingBillNumber}
                    onChange={(e) => setShippingBillNumber(e.target.value)}
                    placeholder="e.g. 3766969"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shipping Bill Date *</label>
                  <input
                    type="date"
                    value={shippingBillDate}
                    onChange={(e) => setShippingBillDate(e.target.value)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Port Code</label>
                  <input
                    type="text"
                    value={portCode}
                    onChange={(e) => setPortCode(e.target.value)}
                    placeholder="e.g. INNSA1"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Country</label>
                  <input
                    type="text"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    placeholder="e.g. United States"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Buyer / Consignee</label>
                  <input
                    type="text"
                    value={buyerName}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Buyer Name & Address"
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Number & Date</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="Invoice No"
                      className="w-3/5 text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900"
                    />
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-2/5 text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Foreign Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900"
                  >
                    {['USD', 'EUR', 'GBP', 'INR', 'AED', 'JPY', 'CAD', 'SGD'].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Exchange Rate (INR)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-900"
                  />
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-blue-600" />
                    Extracted Line Items ({lineItems.length})
                  </h4>
                  <button
                    onClick={addLineItem}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-semibold">
                        <th className="p-2.5">Sr</th>
                        <th className="p-2.5">HS Code</th>
                        <th className="p-2.5">Product Description</th>
                        <th className="p-2.5">Qty & UOM</th>
                        <th className="p-2.5">FOB Value ({currency})</th>
                        <th className="p-2.5">FOB (INR)</th>
                        <th className="p-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            No line items extracted. Click "Add Line Item" above.
                          </td>
                        </tr>
                      ) : (
                        lineItems.map((item, idx) => (
                          <tr key={item.id} className={item.needsVerification ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}>
                            <td className="p-2.5 font-mono text-slate-500">{item.itemSrNo || idx + 1}</td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.itcHsCode}
                                onChange={(e) => updateLineItem(idx, 'itcHsCode', e.target.value)}
                                className="w-24 text-xs bg-white border border-slate-200 rounded p-1 font-mono"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={item.productDescription}
                                onChange={(e) => updateLineItem(idx, 'productDescription', e.target.value)}
                                className="w-full min-w-[220px] text-xs bg-white border border-slate-200 rounded p-1"
                                placeholder="Product description"
                              />
                            </td>
                            <td className="p-2.5">
                              <div className="flex gap-1 items-center">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-20 text-xs bg-white border border-slate-200 rounded p-1"
                                />
                                <input
                                  type="text"
                                  value={item.uom}
                                  onChange={(e) => updateLineItem(idx, 'uom', e.target.value)}
                                  className="w-14 text-xs bg-white border border-slate-200 rounded p-1 uppercase"
                                />
                              </div>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.01"
                                value={item.fobValueFc}
                                onChange={(e) => updateLineItem(idx, 'fobValueFc', parseFloat(e.target.value) || 0)}
                                className="w-24 text-xs bg-white border border-slate-200 rounded p-1 font-mono"
                              />
                            </td>
                            <td className="p-2.5 font-mono font-medium text-slate-700">
                              ₹{item.fobValueInr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="p-2.5 text-right">
                              <button
                                onClick={() => removeLineItem(idx)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Totals footer */}
                <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800">
                  <span>Total Calculated FOB:</span>
                  <div className="flex items-center gap-4">
                    <span>{currency} {totalFobFc.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className="text-blue-600">₹{totalFobInr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-xs text-slate-500">
            {isExtracted ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> PDF Extraction Complete. Review & commit below.
              </span>
            ) : (
              <span>Upload an ICEGATE EDI Shipping Bill PDF to begin extraction.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>

            {isExtracted && (
              <button
                onClick={handleSaveToRegister}
                disabled={!isFormValid || isSaving}
                className={`flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-colors shadow-xs ${
                  !isFormValid || isSaving ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Save / Commit to Export Register
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

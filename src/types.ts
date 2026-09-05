export interface ExportItem {
  id: string;
  licenceId?: string;                 // Association with AdvanceLicence ID
  licenceNumber?: string;             // Associated Licence Number
  exportSrNo: string;                // 1. Export Serial Number (e.g., "1", "2")
  sionSrNo: string;                  // 2. SION Serial Number (e.g., "62/2023", "1")
  itcHsCode: string;                 // 3. ITC HS Code (e.g., "52081190")
  productDescription: string;        // 4. Export Product Description (exact text preserved)
  quantity: number;                  // 5. Quantity (exact decimal)
  uom: string;                       // 6. Unit of Measurement (e.g., "MTR", "KGS", "PCS")
  fobValueInr: number;               // 7. FOB Value in INR (exact decimal)
  fobValueFc: number;                // 8. FOB Value in Export Foreign Currency (exact decimal)
  currency?: string;                 // Currency (e.g., "USD")
  needsVerification?: boolean;       // Flagged if field is missing or ambiguous
  verificationNotes?: string;        // Optional notes on what needs verification
}

export interface ImportItem {
  id: string;
  licenceId?: string;                 // Association with AdvanceLicence ID
  licenceNumber?: string;             // Associated Licence Number
  inputSrNo: string;                  // 7. Input Serial Number (e.g., "1", "2")
  inputDescription: string;           // 1. Input Description (100% verbatim DGFT)
  technicalDescription: string;       // 2. Technical Features / Description (100% verbatim DGFT)
  sionSrNo: string;                   // 3. SION Serial Number (e.g., "62/2023", "1", "H-12")
  exportSrNo: string;                 // 4. Export Serial Number (links import input to corresponding export item)
  itcHsCode: string;                  // 5. ITC HS Code (e.g., "52010015", "29051100")
  quantity: number;                   // 6. Quantity to be Imported (exact decimal)
  uom: string;                        // 8. Unit of Measurement (e.g., "KGS", "MTR", "MT", "NOS")
  cifValueInr: number;                // 9. CIF Value in INR (exact decimal)
  cifValueFc: number;                 // 10. CIF Value in Foreign Currency (exact decimal)
  currency?: string;                  // Currency (e.g., "USD")
  dutySavedInr: number;               // 11. Duty Saved in INR (exact decimal)
  dutySavedPercent: number;           // 12. Duty Saved Percentage (exact decimal)
  needsVerification?: boolean;        // Flagged if field is missing or ambiguous
  verificationNotes?: string;         // Optional notes on what needs verification
  createdAt?: string;
  updatedAt?: string;
}

export interface AdvanceLicence {
  id: string;
  fileNumber: string;                 // 1. Internal File Number
  dgftFileNumber: string;             // 2. DGFT File Number
  dgftApplicationNumber: string;      // 3. DGFT Application Number
  licenceNumber: string;              // 4. Licence / Authorisation Number
  licenceDate: string;                // 5. Licence / Authorisation Date
  importValidity: string;             // 6. Import Validity
  exportValidity: string;             // 7. Export Validity
  typeOfNorm: string;                 // 8. Type of Norm
  exportForeignCurrency: string;      // 9. Export Foreign Currency
  forexExportRate: string;            // 10. Foreign Exchange Export Rate
  forexImportRate: string;            // 11. Foreign Exchange Import Rate
  fobValueInr: string;                // 12. FOB Value in INR
  fobValueFc: string;                 // 13. FOB Value in Export Foreign Currency
  cifValueInr: string;                // 14. CIF Value in INR
  cifValueFc: string;                 // 15. CIF Value in Export Foreign Currency
  cifValueInvalidatedInr: string;     // 16. CIF Value Invalidated in INR
  
  // Enhanced & Extended master schema fields
  licensingAuthority?: string;        // DGFT Office / Authority
  licenceType?: string;               // Authorisation Type
  importLicenceValue: number;         // Import Licence Value (Decimal supported)
  bulkLicenceValue: number;           // Bulk Licence Value (Decimal supported)
  exportObligationValue: number;      // Export Obligation Value (Decimal supported)
  fobValue: number;                   // FOB Value (Decimal supported)
  cifValue?: number;                  // CIF Value (Decimal supported)
  dutySaved?: number;                 // Duty Saved (Decimal supported)
  exportExchangeRate?: number;        // Export Exchange Rate (Decimal supported)
  importExchangeRate?: number;        // Import Exchange Rate (Decimal supported)
  importCurrency?: string;            // Import Currency
  exportObligationPeriod: string;     // Export Obligation Period
  licenceStatus: 'Active' | 'Expired' | 'Closed' | 'Cancelled' | 'Pending Closure' | 'Nearly Expired';
  
  // Associated Export & Import Items extracted from DGFT Document
  exportItems?: ExportItem[];
  importItems?: ImportItem[];

  originalDocument: {
    name: string;                     // Original PDF Filename
    uploadedAt: string;
    size?: string;
    dataUrl?: string;
  } | null;
  originalFilename?: string;          // Stored original PDF filename

  extractedFromPdf: boolean;
  otherExtractedInfo?: Array<{
    label: string;
    value: string;
    page?: number;
  }>;

  status: 'Active' | 'Expired' | 'Nearly Expired' | 'Closed';
  applicantName: string;
}

// ============================================================================
// EXPORT TRANSACTIONS & SHIPPING BILLS MODULE TYPES
// ============================================================================

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'INR' | 'AED' | 'JPY' | 'CAD' | 'SGD';

export interface ShippingBillItem {
  id: string;
  shippingBillId: string;
  itemSrNo: string;
  itcHsCode: string;
  productDescription: string;
  quantity: number;
  uom: string;
  fobValueCurrency: CurrencyCode;
  fobValueFc: number;         // NUMERIC(18, 4)
  exchangeRate: number;       // NUMERIC(18, 4)
  fobValueInr: number;        // NUMERIC(18, 4)
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type BrcStatus = 'Not Received' | 'Received' | 'Realized';

export interface BrcTracking {
  id: string;
  shippingBillId: string;
  brcNumber?: string;
  brcStatus: BrcStatus;
  receivedDate?: string;
  realizedDate?: string;
  realizedAmountFc?: number;   // NUMERIC(18, 4)
  realizedAmountInr?: number;  // NUMERIC(18, 4)
  currency: CurrencyCode;
  realizedExchangeRate?: number;
  bankName?: string;
  bankBranch?: string;
  ifscCode?: string;
  adCode?: string;
  eBrcDocumentNumber?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShippingBill {
  id: string;
  licenceId: string;
  licenceNumber: string;
  companyFileNumber: string;
  shippingBillNumber: string;
  shippingBillDate: string;
  portOfExport: string;          // e.g. INNSA1 (Nhava Sheva)
  portCode?: string;
  leoDate?: string;              // Let Export Order Date
  destinationCountry: string;
  buyerName?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  currency: CurrencyCode;
  exchangeRate: number;          // NUMERIC(18, 4)
  totalFobFc: number;            // NUMERIC(18, 4)
  totalFobInr: number;           // NUMERIC(18, 4)
  status: 'Draft' | 'Submitted' | 'LEO Issued' | 'Exported' | 'Closed';
  remarks?: string;
  
  // Relations
  items?: ShippingBillItem[];
  brcTracking?: BrcTracking;

  createdAt?: string;
  updatedAt?: string;
}

export interface ExportObligationTracking {
  id: string;
  licenceId: string;
  licenceNumber: string;
  companyFileNumber: string;
  totalExportObligationFobInr: number;
  totalExportObligationFobFc: number;
  currency: CurrencyCode;
  realizedFobInr: number;
  realizedFobFc: number;
  unrealizedFobInr: number;
  fulfilledPercent: number;     // e.g. 74.52%
  status: 'Not Started' | 'In Progress' | 'Partially Fulfilled' | 'Fully Realized' | 'Over Fulfilled';
  shippingBillsCount: number;
  realizedBillsCount: number;
  lastCalculatedAt: string;
}

export type ModuleId = 
  | 'dashboard'
  | 'licences'
  | 'materials'
  | 'imports'
  | 'exports'
  | 'utilization'
  | 'finder'
  | 'reports'
  | 'settings';

export interface NavigationItem {
  id: ModuleId;
  label: string;
  iconName: string;
  description: string;
  badge?: string;
}

export interface UserProfile {
  name: string;
  role: string;
  department: string;
  location: string;
  avatarInitials: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ShippingBillQueryParams {
  page?: number;
  limit?: number | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  licenceId?: string | string[];
  brcStatus?: string | string[];
  fobMinUSD?: number;
  fobMaxUSD?: number;
  fobMinINR?: number;
  fobMaxINR?: number;
  searchText?: string;
}

export interface ShippingBillsResponse {
  bills: ShippingBill[];
  pagination?: PaginationMeta;
  source: string;
  isDb: boolean;
  queryTimeMs?: number;
}

// ============================================================================
// PHASE 4: UTILIZATION DASHBOARD MODULE TYPES
// ============================================================================

export type UtilizationStatus = 'Optimal' | 'Under-Utilized' | 'Over-Utilized' | 'Expired';
export type TrendType = 'Accelerating' | 'Stable' | 'Declining' | 'Stalled';
export type AlertSeverity = 'Critical' | 'Warning' | 'Info';
export type AlertType = 'Under-Utilized' | 'Over-Utilized' | 'Expiry Warning' | 'No Activity';
export type AlertStatus = 'Active' | 'Resolved' | 'Dismissed';

export interface UtilizationAlert {
  id: string;
  licenceId: string;
  licenceNumber?: string;
  companyFileNumber?: string;
  alertType: AlertType;
  alertSeverity: AlertSeverity;
  triggeredDate: string;
  thresholdValue?: number;
  currentValue?: number;
  status: AlertStatus;
  resolvedDate?: string | null;
  resolutionNotes?: string | null;
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UtilizationSnapshot {
  id: string;
  licenceId: string;
  licenceNumber?: string;
  snapshotDate: string;
  totalLicenceValue: number;
  totalExportedValue: number;
  utilizationPercent: number;
  status: UtilizationStatus;
  daysRemaining: number;
  forecastCompletionDate?: string | null;
  avgMonthlyExport: number;
  trend: TrendType;
  createdAt?: string;
  updatedAt?: string;
}

export interface UtilizationMetrics {
  licenceId: string;
  licenceNumber: string;
  companyFileNumber: string;
  licenceStatus: string;
  totalAuthorizedFOB: number;
  totalExportedFOB: number;
  remainingQuota: number;
  utilizationPercent: number;
  status: UtilizationStatus;
  daysRemaining: number;
  licenceExpiry: string;
  licenceDate?: string;
  forecastCompletionDate?: string | null;
  avgMonthlyExport: number;
  trend: TrendType;
  historySparkline: number[];       // 7-day or recent utilization percentages for sparkline
  shippingBillsCount: number;
  alerts: UtilizationAlert[];
  currency: CurrencyCode;
  lastExportDate?: string | null;
  overshootAmount?: number;
  buyerNames?: string[];
  productDescriptions?: string[];
}

export interface UtilizationDashboardSummary {
  inComplianceCount: number;
  atRiskCount: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
  warningAlertsCount: number;
  infoAlertsCount: number;
  expiringSoonCount: number;
  totalLicencesCount: number;
  expiringSoonLicences: Array<{
    id: string;
    licenceNumber: string;
    companyFileNumber?: string;
    daysRemaining: number;
    expiryDate: string;
    utilizationPercent: number;
  }>;
  totalAuthorizedFobSum: number;
  totalExportedFobSum: number;
  overallUtilizationPercent: number;
}

export interface UtilizationQueryParams {
  status?: UtilizationStatus | 'All';
  licenceStatus?: string;
  daysRemainingMax?: number;
  sortBy?: 'utilization_percent' | 'days_remaining' | 'licence_number' | 'fob_value' | 'trend';
  sortOrder?: 'asc' | 'desc';
  searchText?: string;
  page?: number;
  limit?: number | 'all';
}

export interface UtilizationDashboardResponse {
  success: boolean;
  source: string;
  summary: UtilizationDashboardSummary;
  data: UtilizationMetrics[];
  pagination: PaginationMeta;
  queryTimeMs?: number;
}

export interface SimulationResult {
  currentFOB: number;
  additionalFOB: number;
  projectedExportedFOB: number;
  authorizedFOB: number;
  currentUtilization: number;
  projectedUtilization: number;
  currentDaysRemaining: number;
  projectedCompletionDate: string | null;
  avgMonthlyExport: number;
  newStatus: UtilizationStatus;
  isOverUtilized: boolean;
  projectedOvershoot: number;
}

// ============================================================================
// PHASE 2: IMPORT TRANSACTIONS & INBOUND LOGISTICS MODULE TYPES
// ============================================================================

export type ImportDocumentStatus = 'Filed' | 'Cleared' | 'Rejected';
export type GrnStatus = 'Received' | 'Inspected' | 'Quarantined' | 'Approved';

export interface ConsumptionTracking {
  id: string;
  importLineItemId: string;
  licenceId?: string;
  consumptionDate: string;
  quantityConsumed: number;              // Material quantity consumed (in UOM)
  productionBatchId?: string;           // Batch Reference (e.g. "BATCH-2026-081")
  finishedGoodProducedQty?: number;      // Output yield produced (in SION ratio)
  finishedGoodId?: string;              // Output product name or ID
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GoodsReceiptNote {
  id: string;
  importBillId: string;
  grnNumber: string;                    // e.g. "GRN-2026-00123"
  receiptDate: string;
  warehouseLocation: string;            // e.g. "Warehouse A, Bay 4"
  receivedBy?: string;
  inspectedBy?: string;
  quantityChecked: number;              // Inspected quantity
  damageNoted?: string;
  status: GrnStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportLineItem {
  id: string;
  importBillId: string;
  hsCode: string;                       // Harmonized Tariff Code
  materialDescription: string;          // Material Description (e.g. "Additive MB")
  materialId?: string;                  // Product Master Link
  quantityReceived: number;             // Received Quantity (e.g. 500 Kgs)
  uom: string;                          // 'Kgs', 'MTR', 'Liters', 'Nos'
  unitPriceFc: number;                  // FC price per unit
  totalLineValueFc: number;             // Total foreign currency value
  totalLineValueInr: number;            // Total INR value
  sionNormId?: string;                  // SION Norm Code / ID
  expectedOutputQty?: number;           // Expected finished goods yield (e.g. 600 Kgs)
  expectedOutputUom?: string;           // Finished good UOM
  notes?: string;
  consumptionTracking?: ConsumptionTracking[];
  
  // Computed aggregations
  totalConsumedQty?: number;
  remainingInventoryQty?: number;
  consumedPercent?: number;
  actualOutputProducedQty?: number;
  sionVariance?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportDocument {
  id: string;
  licenceId: string;
  licenceNumber?: string;
  companyFileNumber?: string;
  importBillNumber: string;             // e.g. "BoE-AUTO-12345-26" or "5482910"
  docDate: string;                      // Filing date
  customsPort: string;                  // e.g. "NHAVA SHEVA", "BANGALORE AIR"
  importerName?: string;
  supplierCountry: string;              // Origin Country
  supplierName: string;                 // Foreign Vendor
  supplierInvoiceNo?: string;
  customsDutyPercent?: number;          // e.g. 7.5%
  customsDutyAmount?: number;           // Calculated customs duty
  igstPercent?: number;                 // e.g. 18.0%
  igstAmount?: number;                  // Calculated IGST
  totalInvoiceValueFc: number;          // FC Value
  totalInvoiceValueInr: number;         // INR Value
  importCurrency: CurrencyCode;         // 'USD', 'EUR', 'GBP', 'INR'
  exchangeRate: number;                 // Exchange rate used
  boeStatus: ImportDocumentStatus;      // 'Filed', 'Cleared', 'Rejected'
  customsClearanceDate?: string;
  notes?: string;
  
  // Relations
  lineItems?: ImportLineItem[];
  grn?: GoodsReceiptNote;
  
  // Computed stats
  totalItemsCount?: number;
  totalReceivedQty?: number;
  totalConsumedQty?: number;
  totalRemainingQty?: number;
  grnStatus?: GrnStatus;
  
  createdAt?: string;
  updatedAt?: string;
}

export interface ImportQueryParams {
  page?: number;
  limit?: number | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
  licenceId?: string | string[];
  boeStatus?: ImportDocumentStatus | string[];
  grnStatus?: GrnStatus | string[];
  supplierCountry?: string;
  supplierName?: string;
  searchText?: string;
}

export interface ImportDocumentsResponse {
  success: boolean;
  source: string;
  data: ImportDocument[];
  pagination: PaginationMeta;
  summary?: {
    totalDocumentsCount: number;
    clearedDocumentsCount: number;
    pendingFiledCount: number;
    rejectedCount: number;
    totalImportValueInr: number;
    totalImportValueFc: number;
    totalQuantityImported: number;
    totalQuantityConsumed: number;
    totalInventoryRemaining: number;
    totalDutySaved: number;
  };
  queryTimeMs?: number;
}

export interface LicenceImportConsumptionStatus {
  licenceId: string;
  licenceNumber: string;
  companyFileNumber: string;
  authorizedCifInr: number;
  importedCifInr: number;
  remainingCifInr: number;
  importUtilizationPercent: number;
  totalImportDocsCount: number;
  lineItems: Array<{
    materialDescription: string;
    hsCode: string;
    quantityReceived: number;
    quantityConsumed: number;
    inventoryRemaining: number;
    uom: string;
    expectedOutputQty: number;
    actualOutputProducedQty: number;
    sionNormId?: string;
  }>;
}

// ============================================================================
// PHASE 1: MATERIALS, FINISHED GOODS & SION NORMS MODULE TYPES
// ============================================================================

export type MaterialType = 'Chemical' | 'Component' | 'Consumable' | 'Catalyst' | 'Other';

export interface MaterialSpecification {
  id: string;
  rawMaterialId?: string;
  specificationName: string;
  specificationValue: string;
  specificationUnit?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SionNormSummary {
  id: string;
  sionCode: string;
  finishedGoodId: string;
  finishedGoodName?: string;
  finishedGoodCode?: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  rawMaterialCode?: string;
  inputQuantity: number;
  inputUom: string;
  outputQuantity: number;
  outputUom: string;
  yieldRatio: number;
  wastagePercent: number;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  dgftNotificationDate?: string | null;
  status?: 'Active' | 'Expired' | 'Upcoming';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawMaterial {
  id: string;
  materialCode: string;
  materialName: string;
  hsCode: string;
  hsDescription?: string;
  materialType: MaterialType;
  uom: string;
  cifValuePerUnit: number;
  importCurrency: CurrencyCode;
  isScomet: boolean;
  scometCategory?: string;
  scometControlReason?: string;
  description?: string;
  notes?: string;
  specifications?: MaterialSpecification[];
  sionNorms?: SionNormSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FinishedGood {
  id: string;
  productCode: string;
  productName: string;
  hsCode: string;
  hsDescription?: string;
  uom: string;
  description?: string;
  isExportObligationItem: boolean;
  notes?: string;
  sionNorms?: SionNormSummary[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SionNorm {
  id: string;
  sionCode: string;
  rawMaterialId: string;
  rawMaterialName?: string;
  rawMaterialCode?: string;
  rawMaterialHsCode?: string;
  finishedGoodId: string;
  finishedGoodName?: string;
  finishedGoodCode?: string;
  finishedGoodHsCode?: string;
  inputQuantity: number;
  inputUom: string;
  outputQuantity: number;
  outputUom: string;
  yieldRatio: number;
  wastagePercent: number;
  dgftNotificationDate?: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  status?: 'Active' | 'Expired' | 'Upcoming';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface HsCodeItem {
  id: string;
  hsCode: string;
  description: string;
  itemType: 'Import' | 'Export' | 'Both';
  gstRate: number;
  notes?: string;
}

export interface MaterialsSummaryMetrics {
  totalMaterials: number;
  totalProducts: number;
  activeSionNorms: number;
  scometItemsCount: number;
  chemicalsCount: number;
  componentsCount: number;
  consumablesCount: number;
  catalystsCount: number;
}

// ============================================================================
// LICENCE FINDER & RECOMMENDATION ENGINE TYPES
// ============================================================================

export type LicenceFinderSearchType = 'import' | 'export';

export interface LicenceScoreBreakdown {
  sionCompatibility: number;      // 0 - 25 points
  expiryRisk: number;             // 0 - 35 points
  remainingQuota: number;         // 0 - 20 points
  dutySavings: number;            // 0 - 15 points
  targetDateBonus?: number;       // Optional buffer bonus points
}

export interface SionNormSummaryDetail {
  sionCode: string;
  rawMaterial: string;
  rawMaterialHsCode?: string;
  finishedGood?: string;
  finishedGoodHsCode?: string;
  yieldRatio: number;
  wastagePercent: number;
  dgftGazetteRef?: string;
}

export interface LicenceRecommendationDetails {
  status: 'Active' | 'Expired' | 'Nearly Expired' | 'Closed' | 'Pending Closure';
  daysToExpiry: number;
  expiryDate: string;
  licenceDate?: string;
  licensingAuthority?: string;
  totalFobInr: number;
  totalFobFc: number;
  remainingFobInr: number;
  remainingFobFc: number;
  totalCifInr: number;
  totalCifFc: number;
  remainingCifInr?: number;
  remainingCifFc?: number;
  utilizationPercent: number;
  estimatedDutySavingsInr: number;
  estimatedDutySavingsFc: number;
  importCurrency: string;
  exportCurrency?: string;
  exchangeRate: number;
  sionNorms: SionNormSummaryDetail[];
  warningFlags: string[];
  recommendationReason: string;
  compatibilityLevel: 'Perfect Match' | 'Partial Match' | 'No Match';
  compatibilityReason: string;
}

export interface LicenceRecommendation {
  rank: number;
  licenceId: string;
  licenceNumber: string;
  fileNumber: string;
  dgftFileNumber?: string;
  score: number;
  confidencePercent: number;
  scoreBreakdown: LicenceScoreBreakdown;
  details: LicenceRecommendationDetails;
  warningFlags: string[];
  recommendationReason: string;
}

export interface ProjectedCosts {
  cifValueInr: number;
  cifValueFc: number;
  basicCustomsDutyRate: number;
  igstRate: number;
  importDutyWithoutInr: number;
  importDutyWithInr: number;
  dutySavingsInr: number;
  savingsPercentage: number;
}

export interface LicenceFinderSummary {
  bestLicence: {
    id: string;
    number: string;
    fileNumber: string;
    score: number;
    reason: string;
  } | null;
  alternativeLicences: Array<{
    id: string;
    number: string;
    fileNumber: string;
    score: number;
    reason: string;
  }>;
  overallAdvice: string;
  projectedCosts: ProjectedCosts;
  totalCandidatesEvaluated: number;
  eligibleCount: number;
}

export interface LicenceFinderSearchQuery {
  type: LicenceFinderSearchType;
  materialId?: string;
  materialName?: string;
  productId?: string;
  productName?: string;
  hsCode?: string;
  quantity: number;
  uom: string;
  targetDate: string;
  unitPrice?: number;
  currency?: string;
  customsDutyRate?: number;
  igstRate?: number;
}

export interface LicenceFinderSearchResult {
  success: boolean;
  source: string;
  search: {
    type: LicenceFinderSearchType;
    material?: {
      id?: string;
      code?: string;
      name: string;
      hsCode: string;
      uom?: string;
      cifUnitPrice?: number;
      currency?: string;
    };
    product?: {
      id?: string;
      code?: string;
      name: string;
      hsCode: string;
      uom?: string;
      standardFobPrice?: number;
      currency?: string;
    };
    quantity: number;
    uom: string;
    targetDate: string;
    estimatedValueInr?: number;
    estimatedValueFc?: number;
    currency?: string;
  };
  recommendations: LicenceRecommendation[];
  summary: LicenceFinderSummary;
}

export interface BulkShipmentItem {
  id: string;
  type: LicenceFinderSearchType;
  materialId?: string;
  productId?: string;
  materialName?: string;
  productName?: string;
  hsCode?: string;
  quantity: number;
  uom: string;
  targetDate: string;
  unitPrice?: number;
  currency?: string;
}

export interface BulkShipmentRecommendation {
  shipmentId: string;
  shipmentName: string;
  type: LicenceFinderSearchType;
  quantity: number;
  uom: string;
  targetDate: string;
  estimatedValueInr: number;
  recommendedLicence: LicenceRecommendation | null;
  alternativeLicences: LicenceRecommendation[];
  conflictWarning?: string;
}

export interface BulkSearchResponse {
  success: boolean;
  source: string;
  totalShipments: number;
  results: BulkShipmentRecommendation[];
  conflictAnalysis: {
    hasConflicts: boolean;
    conflictedLicences: Array<{
      licenceNumber: string;
      fileNumber: string;
      remainingQuotaInr: number;
      totalRequiredInr: number;
      deficitInr: number;
      competingShipments: string[];
    }>;
    optimizationStrategy: string;
  };
  totalProjectedDutySavingsInr: number;
}

export interface DutySavingsCalculation {
  licenceId?: string;
  licenceNumber?: string;
  cifValueInr: number;
  cifValueFc: number;
  currency: string;
  exchangeRate: number;
  basicCustomsDutyPercent: number;
  basicCustomsDutyAmountInr: number;
  socialWelfareSurchargePercent: number;
  socialWelfareSurchargeInr: number;
  igstPercent: number;
  igstAmountInr: number;
  totalDutyWithoutLicenceInr: number;
  totalDutyWithLicenceInr: number;
  netDutySavingsInr: number;
  effectiveSavingsPercent: number;
}

export interface CompatibilityStatus {
  isCompatible: boolean;
  compatibilityLevel: 'Perfect Match' | 'Partial Match' | 'No Match';
  reason: string;
  sionNorms: SionNorm[];
  exportItems: ExportItem[];
  yieldRatio?: number;
  wastagePercent?: number;
}

export interface LicenceFinderHistoryItem {
  id: string;
  userId?: string;
  searchQueryType: LicenceFinderSearchType;
  searchMaterialId?: string;
  searchMaterialName: string;
  searchQuantity: number;
  searchUom: string;
  searchTargetDate: string;
  recommendedLicenceIds: string[];
  topRecommendationId?: string;
  topRecommendationNumber?: string;
  topRecommendationScore?: number;
  dutySavingsInr?: number;
  rankingCriteria?: any;
  searchTimestamp: string;
  userAccepted?: boolean;
  finalLicenceUsedId?: string;
  createdAt?: string;
}





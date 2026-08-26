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
  
  // Associated Export Items extracted from DGFT Document
  exportItems?: ExportItem[];

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

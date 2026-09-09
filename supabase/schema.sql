
-- ============================================================================
-- AUTHENTICATION & PROFILES
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Viewer')) DEFAULT 'Viewer',
    unit TEXT DEFAULT 'Global',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;
CREATE POLICY "Admins can read all profiles" ON user_profiles FOR SELECT USING (
  (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'Admin'
);


-- Trigger to auto-create user_profiles for new Supabase Auth users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, unit)
  VALUES (new.id, new.email, 'Viewer', 'Global');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user is Admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is Viewer
CREATE OR REPLACE FUNCTION is_viewer() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'Viewer'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ============================================================================
-- ALOK INDUSTRIES - ADVANCE LICENCE MANAGEMENT SYSTEM (ALMS)
-- SUPABASE POSTGRESQL DATABASE SCHEMA
-- ============================================================================
-- Run this complete script in the Supabase SQL Editor to provision tables,
-- foreign keys, indexes, decimal precision, and Row Level Security (RLS) policies.

-- 1. Enable pgcrypto extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- TABLE 1: licence_master (Master Table for DGFT Advance Authorisations)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licence_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identification & File Tracking
    file_number TEXT NOT NULL,                          -- Internal Company File Number (e.g. "701", "725")
    dgft_file_number TEXT,                              -- DGFT File Number (e.g. "05AX04004128AM26")
    dgft_application_number TEXT,                       -- DGFT Online Application / File Number
    licence_number TEXT NOT NULL,                       -- Advance Authorisation / Licence Number (e.g. "0511038251")
    
    -- Authority & Classification
    licensing_authority TEXT,                           -- DGFT Regional Authority (e.g. "CLA MUMBAI")
    licence_type TEXT DEFAULT 'Advance Authorisation for Duty Exemption',
    type_of_norm TEXT DEFAULT 'Standard SION (Textile)',
    
    -- Validity Windows
    licence_date DATE,                                  -- Date of Issue
    import_validity DATE,                               -- Import Validity Date
    export_validity DATE,                               -- Export Obligation Validity Date
    export_obligation_period TEXT,                      -- EO Period (e.g. "18 Months")
    
    -- Currencies & Forex Rates (Exact 4 Decimal Places)
    export_foreign_currency TEXT DEFAULT 'USD',
    import_currency TEXT DEFAULT 'USD',
    forex_export_rate TEXT,
    forex_import_rate TEXT,
    export_exchange_rate NUMERIC(18, 4) DEFAULT 0.0000,
    import_exchange_rate NUMERIC(18, 4) DEFAULT 0.0000,
    
    -- Master Financial & Entitlement Values (Exact 4 Decimal Places)
    import_licence_value NUMERIC(18, 4) DEFAULT 0.0000, -- Sanctioned CIF Value (USD / FC)
    bulk_licence_value NUMERIC(18, 4) DEFAULT 0.0000,
    export_obligation_value NUMERIC(18, 4) DEFAULT 0.0000, -- FOB Export Obligation Target
    fob_value NUMERIC(18, 4) DEFAULT 0.0000,            -- FOB Value (INR)
    cif_value NUMERIC(18, 4) DEFAULT 0.0000,            -- CIF Value (INR)
    duty_saved NUMERIC(18, 4) DEFAULT 0.0000,           -- Estimated Customs Duty Saved
    
    -- String / Form Value Mirrored Fields
    fob_value_inr TEXT DEFAULT '0',
    fob_value_fc TEXT DEFAULT '0',
    cif_value_inr TEXT DEFAULT '0',
    cif_value_fc TEXT DEFAULT '0',
    cif_value_invalidated_inr TEXT DEFAULT '0.00',
    
    -- Status & Entity
    licence_status TEXT DEFAULT 'Active',               -- 'Active', 'Pending Closure', 'Expired', 'Closed', 'Cancelled'
    status TEXT DEFAULT 'Active',
    applicant_name TEXT DEFAULT 'Alok Industries Limited',
    
    -- Source Document Metadata & AI Extraction Audit
    original_filename TEXT,
    original_document JSONB,
    extracted_from_pdf BOOLEAN DEFAULT FALSE,
    other_extracted_info JSONB DEFAULT '[]'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 2: licence_export_items (Export Items Schedule Child Table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licence_export_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_id UUID NOT NULL REFERENCES licence_master(id) ON DELETE CASCADE,
    
    -- Schedule Item Details
    export_sr_no TEXT,                                 -- Export Item Serial Number (e.g. "1", "2")
    sion_sr_no TEXT,                                   -- SION Norm Reference (e.g. "62/2023", "H-12")
    itc_hs_code TEXT,                                  -- 8-digit ITC (HS) Code (e.g. "52081190")
    product_description TEXT NOT NULL,                 -- 100% Verbatim DGFT Description
    
    -- Quantities & Values with 4-Decimal Precision
    quantity NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    uom TEXT,                                          -- Unit of Measurement (e.g. "MTR", "KGS", "NOS")
    fob_value_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    fob_value_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    currency TEXT DEFAULT 'USD',
    
    -- AI Verification Tracking
    needs_verification BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 2B: licence_import_items (Import Items Schedule Child Table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licence_import_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_id UUID NOT NULL REFERENCES licence_master(id) ON DELETE CASCADE,
    
    -- Schedule Item Details
    input_sr_no TEXT,                                  -- Input Serial Number (e.g. "1", "2")
    input_description TEXT NOT NULL,                   -- 100% Verbatim DGFT Input Description
    technical_description TEXT,                        -- 100% Verbatim Technical Features / Description
    sion_sr_no TEXT,                                   -- SION Serial Number (e.g. "62/2023", "H-12")
    export_sr_no TEXT,                                 -- Export Serial Number (links import input to export item)
    itc_hs_code TEXT,                                  -- ITC (HS) Code
    
    -- Quantities & Monetary Values with 4-Decimal Precision
    quantity NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    uom TEXT,                                          -- Unit of Measurement (e.g. "KGS", "MTR", "MT", "NOS")
    cif_value_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    cif_value_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    currency TEXT DEFAULT 'USD',
    duty_saved_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    duty_saved_percent NUMERIC(10, 4) DEFAULT 0.0000 NOT NULL,
    
    -- AI Verification Tracking
    needs_verification BOOLEAN DEFAULT FALSE,
    verification_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- INDEXES for Ultra-Fast Lookups & Foreign Key Joins
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_licence_master_file_no ON licence_master (file_number);
CREATE INDEX IF NOT EXISTS idx_licence_master_licence_no ON licence_master (licence_number);
CREATE INDEX IF NOT EXISTS idx_licence_master_dgft_file_no ON licence_master (dgft_file_number);
CREATE INDEX IF NOT EXISTS idx_licence_master_status ON licence_master (licence_status);
CREATE INDEX IF NOT EXISTS idx_licence_master_created_at ON licence_master (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_licence_export_items_licence_id ON licence_export_items (licence_id);
CREATE INDEX IF NOT EXISTS idx_licence_export_items_itc_hs ON licence_export_items (itc_hs_code);
CREATE INDEX IF NOT EXISTS idx_licence_import_items_licence_id ON licence_import_items (licence_id);
CREATE INDEX IF NOT EXISTS idx_licence_import_items_itc_hs ON licence_import_items (itc_hs_code);
CREATE INDEX IF NOT EXISTS idx_licence_import_items_export_sr_no ON licence_import_items (export_sr_no);

-- ----------------------------------------------------------------------------
-- AUTOMATIC updated_at TRIGGERS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_licence_master_updated_at ON licence_master;
CREATE TRIGGER trigger_licence_master_updated_at
    BEFORE UPDATE ON licence_master
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_licence_export_items_updated_at ON licence_export_items;
CREATE TRIGGER trigger_licence_export_items_updated_at
    BEFORE UPDATE ON licence_export_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_licence_import_items_updated_at ON licence_import_items;
CREATE TRIGGER trigger_licence_import_items_updated_at
    BEFORE UPDATE ON licence_import_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE licence_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE licence_export_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE licence_import_items ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated, service_role, and anon
DROP POLICY IF EXISTS "Allow full access to licence_master" ON licence_master;
CREATE POLICY "Admins have full access to licence_master" ON licence_master FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read licence_master" ON licence_master FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to licence_export_items" ON licence_export_items;
CREATE POLICY "Admins have full access to licence_export_items" ON licence_export_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read licence_export_items" ON licence_export_items FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to licence_import_items" ON licence_import_items;
CREATE POLICY "Admins have full access to licence_import_items" ON licence_import_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read licence_import_items" ON licence_import_items FOR SELECT USING (is_viewer());

-- ----------------------------------------------------------------------------
-- TABLE 3: shipping_bills (Export Shipping Bills Mapped to Advance Licences)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_id UUID NOT NULL REFERENCES licence_master(id) ON DELETE CASCADE,
    
    -- Identification & Document References
    licence_number TEXT NOT NULL,
    company_file_number TEXT NOT NULL,
    shipping_bill_number TEXT NOT NULL,
    shipping_bill_date DATE NOT NULL,
    port_of_export TEXT NOT NULL,                         -- e.g. "INNSA1 - Nhava Sheva"
    port_code TEXT,
    leo_date DATE,                                        -- Let Export Order Date
    
    -- Buyer & Shipment Destination
    destination_country TEXT NOT NULL,
    buyer_name TEXT,
    invoice_number TEXT,
    invoice_date DATE,
    
    -- Multi-Currency Financials & Exact Conversion
    currency TEXT DEFAULT 'USD' NOT NULL,
    exchange_rate NUMERIC(18, 4) DEFAULT 83.5000 NOT NULL,
    total_fob_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    total_fob_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    
    -- Status & Remarks
    status TEXT DEFAULT 'Exported' NOT NULL,              -- 'Draft', 'Submitted', 'LEO Issued', 'Exported', 'Closed'
    remarks TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 4: shipping_bill_items (Line Items with SION / Product Mapping)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shipping_bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipping_bill_id UUID NOT NULL REFERENCES shipping_bills(id) ON DELETE CASCADE,
    
    -- Product Details
    item_sr_no TEXT DEFAULT '1',
    itc_hs_code TEXT NOT NULL,
    product_description TEXT NOT NULL,
    quantity NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    uom TEXT DEFAULT 'MTR' NOT NULL,
    
    -- Values & Rates
    fob_value_currency TEXT DEFAULT 'USD' NOT NULL,
    fob_value_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    exchange_rate NUMERIC(18, 4) DEFAULT 83.5000 NOT NULL,
    fob_value_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 5: brc_tracking (Bank Realisation Certificate Status & Forex Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS brc_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shipping_bill_id UUID NOT NULL UNIQUE REFERENCES shipping_bills(id) ON DELETE CASCADE,
    
    -- BRC & Banking Attributes
    brc_number TEXT,
    brc_status TEXT DEFAULT 'Not Received' NOT NULL,      -- 'Not Received', 'Received', 'Realized'
    received_date DATE,
    realized_date DATE,
    
    -- Realized Forex & Inward Remittance
    currency TEXT DEFAULT 'USD' NOT NULL,
    realized_amount_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    realized_exchange_rate NUMERIC(18, 4) DEFAULT 83.5000,
    realized_amount_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    
    -- Banking Channel Details
    bank_name TEXT,
    bank_branch TEXT,
    ifsc_code TEXT,
    ad_code TEXT,                                         -- Authorised Dealer Code
    e_brc_document_number TEXT,
    remarks TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 6: export_obligation_tracking (Per-Licence Real-Time Status & Progress)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS export_obligation_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_id UUID NOT NULL UNIQUE REFERENCES licence_master(id) ON DELETE CASCADE,
    
    -- Licence References
    licence_number TEXT NOT NULL,
    company_file_number TEXT NOT NULL,
    
    -- Obligation Figures
    currency TEXT DEFAULT 'USD' NOT NULL,
    total_export_obligation_fob_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    total_export_obligation_fob_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    
    -- Realization Progress
    realized_fob_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    realized_fob_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    unrealized_fob_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    fulfilled_percent NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL, -- e.g. 75.4000
    
    -- Operational Status
    status TEXT DEFAULT 'Not Started' NOT NULL,           -- 'Not Started', 'In Progress', 'Partially Fulfilled', 'Fully Realized', 'Over Fulfilled'
    shipping_bills_count INTEGER DEFAULT 0 NOT NULL,
    realized_bills_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Timestamps
    last_calculated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- INDEXES for Export & BRC Tables (Optimized for 1,000+ to 100,000+ Records)
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_shipping_bills_licence_id ON shipping_bills (licence_id);
CREATE INDEX IF NOT EXISTS idx_shipping_bills_sb_number ON shipping_bills (shipping_bill_number);
CREATE INDEX IF NOT EXISTS idx_shipping_bills_sb_date ON shipping_bills (shipping_bill_date DESC);
CREATE INDEX IF NOT EXISTS idx_shipping_bills_total_fob_fc ON shipping_bills (total_fob_fc);
CREATE INDEX IF NOT EXISTS idx_shipping_bills_total_fob_inr ON shipping_bills (total_fob_inr);
CREATE INDEX IF NOT EXISTS idx_shipping_bills_buyer_name ON shipping_bills (buyer_name);
CREATE INDEX IF NOT EXISTS idx_shipping_bills_destination ON shipping_bills (destination_country);
CREATE INDEX IF NOT EXISTS idx_shipping_bills_created_at ON shipping_bills (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_shipping_bill_items_sb_id ON shipping_bill_items (shipping_bill_id);
CREATE INDEX IF NOT EXISTS idx_shipping_bill_items_itc_hs ON shipping_bill_items (itc_hs_code);
CREATE INDEX IF NOT EXISTS idx_shipping_bill_items_fob_fc ON shipping_bill_items (fob_value_fc);

CREATE INDEX IF NOT EXISTS idx_brc_tracking_sb_id ON brc_tracking (shipping_bill_id);
CREATE INDEX IF NOT EXISTS idx_brc_tracking_status ON brc_tracking (brc_status);
CREATE INDEX IF NOT EXISTS idx_brc_tracking_realized_date ON brc_tracking (realized_date);
CREATE INDEX IF NOT EXISTS idx_eo_tracking_licence_id ON export_obligation_tracking (licence_id);

-- ----------------------------------------------------------------------------
-- AUTOMATIC updated_at TRIGGERS for Export Tables
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_shipping_bills_updated_at ON shipping_bills;
CREATE TRIGGER trigger_shipping_bills_updated_at
    BEFORE UPDATE ON shipping_bills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_shipping_bill_items_updated_at ON shipping_bill_items;
CREATE TRIGGER trigger_shipping_bill_items_updated_at
    BEFORE UPDATE ON shipping_bill_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_brc_tracking_updated_at ON brc_tracking;
CREATE TRIGGER trigger_brc_tracking_updated_at
    BEFORE UPDATE ON brc_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_export_obligation_tracking_updated_at ON export_obligation_tracking;
CREATE TRIGGER trigger_export_obligation_tracking_updated_at
    BEFORE UPDATE ON export_obligation_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS POLICIES for Export Tables
-- ----------------------------------------------------------------------------
ALTER TABLE shipping_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE brc_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_obligation_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to shipping_bills" ON shipping_bills;
CREATE POLICY "Admins have full access to shipping_bills" ON shipping_bills FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read shipping_bills" ON shipping_bills FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to shipping_bill_items" ON shipping_bill_items;
CREATE POLICY "Admins have full access to shipping_bill_items" ON shipping_bill_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read shipping_bill_items" ON shipping_bill_items FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to brc_tracking" ON brc_tracking;
CREATE POLICY "Admins have full access to brc_tracking" ON brc_tracking FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read brc_tracking" ON brc_tracking FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to export_obligation_tracking" ON export_obligation_tracking;
CREATE POLICY "Admins have full access to export_obligation_tracking" ON export_obligation_tracking FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read export_obligation_tracking" ON export_obligation_tracking FOR SELECT USING (is_viewer());

-- ----------------------------------------------------------------------------
-- TABLE 7: utilization_snapshots (Daily Historical Snapshots for Trend Analysis)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilization_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_id UUID NOT NULL REFERENCES licence_master(id) ON DELETE CASCADE,
    snapshot_date DATE DEFAULT CURRENT_DATE NOT NULL,
    total_licence_value NUMERIC(18, 4) NOT NULL,
    total_exported_value NUMERIC(18, 4) NOT NULL,
    utilization_percent NUMERIC(5, 2) NOT NULL,
    status TEXT CHECK (status IN ('Optimal', 'Under-Utilized', 'Over-Utilized', 'Expired')) NOT NULL,
    days_remaining INTEGER DEFAULT 0,
    forecast_completion_date DATE,
    avg_monthly_export NUMERIC(18, 4) DEFAULT 0,
    trend TEXT CHECK (trend IN ('Accelerating', 'Stable', 'Declining', 'Stalled')) DEFAULT 'Stable',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT uq_licence_snapshot_date UNIQUE (licence_id, snapshot_date)
);

-- ----------------------------------------------------------------------------
-- TABLE 8: utilization_alerts (Compliance Alerts & Resolution Tracking)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS utilization_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_id UUID NOT NULL REFERENCES licence_master(id) ON DELETE CASCADE,
    alert_type TEXT CHECK (alert_type IN ('Under-Utilized', 'Over-Utilized', 'Expiry Warning', 'No Activity')) NOT NULL,
    alert_severity TEXT CHECK (alert_severity IN ('Critical', 'Warning', 'Info')) NOT NULL,
    triggered_date DATE DEFAULT CURRENT_DATE NOT NULL,
    threshold_value NUMERIC(5, 2),
    current_value NUMERIC(5, 2),
    status TEXT CHECK (status IN ('Active', 'Resolved', 'Dismissed')) DEFAULT 'Active' NOT NULL,
    resolved_date DATE,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- INDEXES for Utilization Dashboard & Alert Tables
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_utilization_snapshots_licence_id ON utilization_snapshots (licence_id);
CREATE INDEX IF NOT EXISTS idx_utilization_snapshots_date ON utilization_snapshots (snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_utilization_snapshots_status ON utilization_snapshots (status);
CREATE INDEX IF NOT EXISTS idx_utilization_snapshots_percent ON utilization_snapshots (utilization_percent);

CREATE INDEX IF NOT EXISTS idx_utilization_alerts_licence_id ON utilization_alerts (licence_id);
CREATE INDEX IF NOT EXISTS idx_utilization_alerts_type ON utilization_alerts (alert_type);
CREATE INDEX IF NOT EXISTS idx_utilization_alerts_status ON utilization_alerts (status);
CREATE INDEX IF NOT EXISTS idx_utilization_alerts_severity ON utilization_alerts (alert_severity);
CREATE INDEX IF NOT EXISTS idx_utilization_alerts_triggered_date ON utilization_alerts (triggered_date DESC);

-- ----------------------------------------------------------------------------
-- AUTOMATIC updated_at TRIGGERS for Utilization Tables
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_utilization_snapshots_updated_at ON utilization_snapshots;
CREATE TRIGGER trigger_utilization_snapshots_updated_at
    BEFORE UPDATE ON utilization_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_utilization_alerts_updated_at ON utilization_alerts;
CREATE TRIGGER trigger_utilization_alerts_updated_at
    BEFORE UPDATE ON utilization_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS POLICIES for Utilization Tables
-- ----------------------------------------------------------------------------
ALTER TABLE utilization_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE utilization_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to utilization_snapshots" ON utilization_snapshots;
CREATE POLICY "Admins have full access to utilization_snapshots" ON utilization_snapshots FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read utilization_snapshots" ON utilization_snapshots FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to utilization_alerts" ON utilization_alerts;
CREATE POLICY "Admins have full access to utilization_alerts" ON utilization_alerts FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read utilization_alerts" ON utilization_alerts FOR SELECT USING (is_viewer());

-- ============================================================================
-- PHASE 2: IMPORT TRANSACTIONS & INBOUND LOGISTICS MODULE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE 8: import_documents (Bills of Entry - Customs Inbound Import Documents)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_id UUID NOT NULL REFERENCES licence_master(id) ON DELETE CASCADE,
    
    -- Identification & Document References
    import_bill_number TEXT NOT NULL UNIQUE,              -- e.g. "BoE-AUTO-12345-26" or "5482910"
    doc_date DATE NOT NULL,                               -- Filing / Entry Date
    customs_port TEXT NOT NULL,                           -- e.g. "NHAVA SHEVA", "BANGALORE AIR"
    importer_name TEXT DEFAULT 'Alok Industries Limited',
    supplier_country TEXT NOT NULL,                       -- e.g. "GERMANY", "USA", "JAPAN"
    supplier_name TEXT NOT NULL,                          -- Foreign Supplier Name
    supplier_invoice_no TEXT,
    
    -- Customs Duty, IGST, & Forex Financials
    customs_duty_percent NUMERIC(5, 2) DEFAULT 0.00,
    customs_duty_amount NUMERIC(18, 4) DEFAULT 0.0000,
    igst_percent NUMERIC(5, 2) DEFAULT 0.00,
    igst_amount NUMERIC(18, 4) DEFAULT 0.0000,
    total_invoice_value_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    total_invoice_value_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    import_currency TEXT DEFAULT 'USD' NOT NULL,          -- 'USD', 'EUR', 'GBP', 'INR'
    exchange_rate NUMERIC(18, 6) DEFAULT 83.500000 NOT NULL,
    
    -- Status & Clearance Tracking
    boe_status TEXT CHECK (boe_status IN ('Filed', 'Cleared', 'Rejected')) DEFAULT 'Filed' NOT NULL,
    customs_clearance_date DATE,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 9: import_line_items (Line Items with SION & Material Yield Linkage)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS import_line_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_bill_id UUID NOT NULL REFERENCES import_documents(id) ON DELETE CASCADE,
    
    -- Material Details & Classification
    hs_code TEXT NOT NULL,                                -- e.g. "3809.10.10", "29419090"
    material_description TEXT NOT NULL,                   -- e.g. "Additive MB", "Raw Cotton 1-1/8"
    material_id TEXT,                                     -- Optional linkage to product master
    quantity_received NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    uom TEXT DEFAULT 'KGS' NOT NULL,                      -- 'Kgs', 'MTR', 'Liters', 'Nos'
    unit_price_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    total_line_value_fc NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    total_line_value_inr NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    
    -- SION Norm Linkage & Expected Output Yield Calculation
    sion_norm_id TEXT,                                    -- SION Norm reference / ID
    expected_output_qty NUMERIC(18, 4) DEFAULT 0.0000,    -- e.g. 10 Kg input * 1.2 = 12 Kg output
    expected_output_uom TEXT DEFAULT 'KGS',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 10: goods_receipt_notes (GRN - Warehouse Inbound Receipts)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_bill_id UUID NOT NULL REFERENCES import_documents(id) ON DELETE CASCADE,
    grn_number TEXT NOT NULL UNIQUE,                      -- e.g. "GRN-2026-00123"
    receipt_date DATE NOT NULL,
    warehouse_location TEXT DEFAULT 'Warehouse A, Bay 4',
    received_by TEXT,
    inspected_by TEXT,
    quantity_checked NUMERIC(18, 4) DEFAULT 0.0000,
    damage_noted TEXT,
    status TEXT CHECK (status IN ('Received', 'Inspected', 'Quarantined', 'Approved')) DEFAULT 'Received' NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- TABLE 11: consumption_tracking (Material Consumption in Production)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consumption_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    import_line_item_id UUID NOT NULL REFERENCES import_line_items(id) ON DELETE CASCADE,
    licence_id UUID REFERENCES licence_master(id) ON DELETE SET NULL,
    consumption_date DATE NOT NULL,
    quantity_consumed NUMERIC(18, 4) DEFAULT 0.0000 NOT NULL,
    production_batch_id TEXT,                             -- e.g. "BATCH-2026-081"
    finished_good_produced_qty NUMERIC(18, 4) DEFAULT 0.0000,
    finished_good_id TEXT,                                -- Finished good product name / ID
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ----------------------------------------------------------------------------
-- INDEXES for Import Documents, Line Items, GRN & Consumption Tracking
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_import_documents_licence_id ON import_documents (licence_id);
CREATE INDEX IF NOT EXISTS idx_import_documents_bill_number ON import_documents (import_bill_number);
CREATE INDEX IF NOT EXISTS idx_import_documents_doc_date ON import_documents (doc_date DESC);
CREATE INDEX IF NOT EXISTS idx_import_documents_boe_status ON import_documents (boe_status);

CREATE INDEX IF NOT EXISTS idx_import_line_items_import_bill_id ON import_line_items (import_bill_id);
CREATE INDEX IF NOT EXISTS idx_import_line_items_hs_code ON import_line_items (hs_code);
CREATE INDEX IF NOT EXISTS idx_import_line_items_sion_norm_id ON import_line_items (sion_norm_id);

CREATE INDEX IF NOT EXISTS idx_grn_import_bill_id ON goods_receipt_notes (import_bill_id);
CREATE INDEX IF NOT EXISTS idx_grn_receipt_date ON goods_receipt_notes (receipt_date DESC);
CREATE INDEX IF NOT EXISTS idx_grn_status ON goods_receipt_notes (status);

CREATE INDEX IF NOT EXISTS idx_consumption_tracking_item_id ON consumption_tracking (import_line_item_id);
CREATE INDEX IF NOT EXISTS idx_consumption_tracking_licence_id ON consumption_tracking (licence_id);
CREATE INDEX IF NOT EXISTS idx_consumption_tracking_date ON consumption_tracking (consumption_date DESC);

-- ----------------------------------------------------------------------------
-- AUTOMATIC updated_at TRIGGERS for Import Tables
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_import_documents_updated_at ON import_documents;
CREATE TRIGGER trigger_import_documents_updated_at
    BEFORE UPDATE ON import_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_import_line_items_updated_at ON import_line_items;
CREATE TRIGGER trigger_import_line_items_updated_at
    BEFORE UPDATE ON import_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_grn_updated_at ON goods_receipt_notes;
CREATE TRIGGER trigger_grn_updated_at
    BEFORE UPDATE ON goods_receipt_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_consumption_tracking_updated_at ON consumption_tracking;
CREATE TRIGGER trigger_consumption_tracking_updated_at
    BEFORE UPDATE ON consumption_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS POLICIES for Import Tables
-- ----------------------------------------------------------------------------
ALTER TABLE import_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consumption_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to import_documents" ON import_documents;
CREATE POLICY "Admins have full access to import_documents" ON import_documents FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read import_documents" ON import_documents FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to import_line_items" ON import_line_items;
CREATE POLICY "Admins have full access to import_line_items" ON import_line_items FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read import_line_items" ON import_line_items FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to goods_receipt_notes" ON goods_receipt_notes;
CREATE POLICY "Admins have full access to goods_receipt_notes" ON goods_receipt_notes FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read goods_receipt_notes" ON goods_receipt_notes FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to consumption_tracking" ON consumption_tracking;
CREATE POLICY "Admins have full access to consumption_tracking" ON consumption_tracking FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read consumption_tracking" ON consumption_tracking FOR SELECT USING (is_viewer());

-- ============================================================================
-- PHASE 1: MATERIALS & SION NORMS MASTER DATA LAYER
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. HS CODE MASTER (Reference ITC HS Directory)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hs_code_master (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hs_code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    item_type TEXT DEFAULT 'Both' CHECK (item_type IN ('Import', 'Export', 'Both')),
    gst_rate NUMERIC(5,2) DEFAULT 18.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hs_code_master_code ON hs_code_master (hs_code);
CREATE INDEX IF NOT EXISTS idx_hs_code_master_type ON hs_code_master (item_type);

-- ----------------------------------------------------------------------------
-- 2. RAW MATERIALS (Permitted Duty-Free Import Items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS raw_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_code TEXT UNIQUE NOT NULL,
    material_name TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    hs_description TEXT,
    material_type TEXT NOT NULL CHECK (material_type IN ('Chemical', 'Component', 'Consumable', 'Catalyst', 'Other')),
    uom TEXT NOT NULL,
    cif_value_per_unit NUMERIC(18,4) DEFAULT 0.0000,
    import_currency TEXT DEFAULT 'USD' CHECK (import_currency IN ('USD', 'EUR', 'GBP', 'INR')),
    is_scomet BOOLEAN DEFAULT false,
    scomet_category TEXT,
    scomet_control_reason TEXT,
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_materials_code ON raw_materials (material_code);
CREATE INDEX IF NOT EXISTS idx_raw_materials_hs_code ON raw_materials (hs_code);
CREATE INDEX IF NOT EXISTS idx_raw_materials_is_scomet ON raw_materials (is_scomet);
CREATE INDEX IF NOT EXISTS idx_raw_materials_material_type ON raw_materials (material_type);

-- ----------------------------------------------------------------------------
-- 3. FINISHED GOODS (Permitted Export Items / Finished Products)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS finished_goods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_code TEXT UNIQUE NOT NULL,
    product_name TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    hs_description TEXT,
    uom TEXT NOT NULL,
    description TEXT,
    is_export_obligation_item BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_finished_goods_code ON finished_goods (product_code);
CREATE INDEX IF NOT EXISTS idx_finished_goods_hs_code ON finished_goods (hs_code);
CREATE INDEX IF NOT EXISTS idx_finished_goods_eo_item ON finished_goods (is_export_obligation_item);

-- ----------------------------------------------------------------------------
-- 4. SION NORMS (Standard Input-Output Norm Yield Mappings)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sion_norms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sion_code TEXT UNIQUE NOT NULL,
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    finished_good_id UUID NOT NULL REFERENCES finished_goods(id) ON DELETE CASCADE,
    input_quantity NUMERIC(18,4) NOT NULL DEFAULT 1.0000,
    input_uom TEXT NOT NULL,
    output_quantity NUMERIC(18,4) NOT NULL DEFAULT 1.0000,
    output_uom TEXT NOT NULL,
    yield_ratio NUMERIC(5,4) NOT NULL DEFAULT 1.0000,
    wastage_percent NUMERIC(5,2) DEFAULT 0.00,
    dgft_notification_date DATE,
    effective_from DATE,
    effective_to DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sion_norms_code ON sion_norms (sion_code);
CREATE INDEX IF NOT EXISTS idx_sion_norms_raw_mat ON sion_norms (raw_material_id);
CREATE INDEX IF NOT EXISTS idx_sion_norms_fin_good ON sion_norms (finished_good_id);

-- ----------------------------------------------------------------------------
-- 5. MATERIAL SPECIFICATIONS (Detailed technical specs per raw material)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS material_specifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_material_id UUID NOT NULL REFERENCES raw_materials(id) ON DELETE CASCADE,
    specification_name TEXT NOT NULL,
    specification_value TEXT NOT NULL,
    specification_unit TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_material_specs_raw_mat ON material_specifications (raw_material_id);

-- ----------------------------------------------------------------------------
-- AUTOMATIC updated_at TRIGGERS for Phase 1 Master Tables
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_raw_materials_updated_at ON raw_materials;
CREATE TRIGGER trigger_raw_materials_updated_at
    BEFORE UPDATE ON raw_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_finished_goods_updated_at ON finished_goods;
CREATE TRIGGER trigger_finished_goods_updated_at
    BEFORE UPDATE ON finished_goods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_sion_norms_updated_at ON sion_norms;
CREATE TRIGGER trigger_sion_norms_updated_at
    BEFORE UPDATE ON sion_norms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_material_specs_updated_at ON material_specifications;
CREATE TRIGGER trigger_material_specs_updated_at
    BEFORE UPDATE ON material_specifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS POLICIES for Phase 1 Master Tables
-- ----------------------------------------------------------------------------
ALTER TABLE hs_code_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE finished_goods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sion_norms ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_specifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to hs_code_master" ON hs_code_master;
CREATE POLICY "Admins have full access to hs_code_master" ON hs_code_master FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read hs_code_master" ON hs_code_master FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to raw_materials" ON raw_materials;
CREATE POLICY "Admins have full access to raw_materials" ON raw_materials FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read raw_materials" ON raw_materials FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to finished_goods" ON finished_goods;
CREATE POLICY "Admins have full access to finished_goods" ON finished_goods FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read finished_goods" ON finished_goods FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to sion_norms" ON sion_norms;
CREATE POLICY "Admins have full access to sion_norms" ON sion_norms FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read sion_norms" ON sion_norms FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to material_specifications" ON material_specifications;
CREATE POLICY "Admins have full access to material_specifications" ON material_specifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read material_specifications" ON material_specifications FOR SELECT USING (is_viewer());

-- ============================================================================
-- PHASE 5: LICENCE FINDER & INTELLIGENT RECOMMENDATION ENGINE TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LICENCE RECOMMENDATIONS (Audit Trail of Search Queries & Optimal Matches)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licence_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'current_user',
    search_query_type TEXT NOT NULL CHECK (search_query_type IN ('import', 'export')),
    
    -- Material / Finished Good Search References
    search_material_id UUID,
    search_material_name TEXT NOT NULL,
    search_quantity NUMERIC(18, 4) NOT NULL,
    search_uom TEXT NOT NULL,
    search_target_date DATE,
    
    -- Recommendation Outputs & Scoring Details
    recommended_licence_ids TEXT[] DEFAULT '{}',
    top_recommendation_id UUID REFERENCES licence_master(id) ON DELETE SET NULL,
    ranking_criteria JSONB DEFAULT '{}'::jsonb,
    search_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- User Action Tracking & Feedback Loop
    user_accepted BOOLEAN DEFAULT FALSE,
    final_licence_used_id UUID REFERENCES licence_master(id) ON DELETE SET NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for lightning-fast history lookup and analytics
CREATE INDEX IF NOT EXISTS idx_licence_rec_user ON licence_recommendations (user_id);
CREATE INDEX IF NOT EXISTS idx_licence_rec_timestamp ON licence_recommendations (search_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_licence_rec_top_lic ON licence_recommendations (top_recommendation_id);
CREATE INDEX IF NOT EXISTS idx_licence_rec_type ON licence_recommendations (search_query_type);

-- ----------------------------------------------------------------------------
-- 2. LICENCE COMPATIBILITY SCORES (Fast Matching & Pre-computed Norm Cache)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS licence_compatibility_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    licence_id UUID NOT NULL REFERENCES licence_master(id) ON DELETE CASCADE,
    material_id UUID REFERENCES raw_materials(id) ON DELETE CASCADE,
    finished_good_id UUID REFERENCES finished_goods(id) ON DELETE CASCADE,
    
    is_compatible BOOLEAN NOT NULL DEFAULT FALSE,
    compatibility_level TEXT DEFAULT 'No Match', -- 'Perfect Match', 'Partial Match', 'No Match'
    compatibility_reason TEXT,
    last_verified_at TIMESTAMPTZ DEFAULT NOW(),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for compatibility joins
CREATE INDEX IF NOT EXISTS idx_lic_comp_licence ON licence_compatibility_scores (licence_id);
CREATE INDEX IF NOT EXISTS idx_lic_comp_material ON licence_compatibility_scores (material_id);
CREATE INDEX IF NOT EXISTS idx_lic_comp_fin_good ON licence_compatibility_scores (finished_good_id);

-- ----------------------------------------------------------------------------
-- AUTOMATIC updated_at TRIGGERS for Licence Finder Tables
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_licence_recommendations_updated_at ON licence_recommendations;
CREATE TRIGGER trigger_licence_recommendations_updated_at
    BEFORE UPDATE ON licence_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_licence_comp_scores_updated_at ON licence_compatibility_scores;
CREATE TRIGGER trigger_licence_comp_scores_updated_at
    BEFORE UPDATE ON licence_compatibility_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- RLS POLICIES for Licence Finder Tables
-- ----------------------------------------------------------------------------
ALTER TABLE licence_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE licence_compatibility_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow full access to licence_recommendations" ON licence_recommendations;
CREATE POLICY "Admins have full access to licence_recommendations" ON licence_recommendations FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read licence_recommendations" ON licence_recommendations FOR SELECT USING (is_viewer());

DROP POLICY IF EXISTS "Allow full access to licence_compatibility_scores" ON licence_compatibility_scores;
CREATE POLICY "Admins have full access to licence_compatibility_scores" ON licence_compatibility_scores FOR ALL USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "Viewers can read licence_compatibility_scores" ON licence_compatibility_scores FOR SELECT USING (is_viewer());






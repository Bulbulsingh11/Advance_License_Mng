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
-- INDEXES for Ultra-Fast Lookups & Foreign Key Joins
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_licence_master_file_no ON licence_master (file_number);
CREATE INDEX IF NOT EXISTS idx_licence_master_licence_no ON licence_master (licence_number);
CREATE INDEX IF NOT EXISTS idx_licence_master_dgft_file_no ON licence_master (dgft_file_number);
CREATE INDEX IF NOT EXISTS idx_licence_master_status ON licence_master (licence_status);
CREATE INDEX IF NOT EXISTS idx_licence_master_created_at ON licence_master (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_licence_export_items_licence_id ON licence_export_items (licence_id);
CREATE INDEX IF NOT EXISTS idx_licence_export_items_itc_hs ON licence_export_items (itc_hs_code);

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

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE licence_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE licence_export_items ENABLE ROW LEVEL SECURITY;

-- Permissive policies for authenticated, service_role, and anon
DROP POLICY IF EXISTS "Allow full access to licence_master" ON licence_master;
CREATE POLICY "Allow full access to licence_master"
    ON licence_master
    FOR ALL
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access to licence_export_items" ON licence_export_items;
CREATE POLICY "Allow full access to licence_export_items"
    ON licence_export_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

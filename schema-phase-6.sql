-- =========================================================================
-- PHASE 6: Data Integrity Layer & Audit Trail
-- =========================================================================

-- 1. Upload Audit Trail Table
CREATE TABLE IF NOT EXISTS upload_audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    upload_batch_id UUID NOT NULL,
    uploaded_by TEXT NOT NULL DEFAULT 'System User',
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    document_type TEXT NOT NULL, -- e.g., 'Import Excel', 'Export PDF'
    licence_id UUID REFERENCES licence_master(id),
    file_name TEXT,
    total_rows_processed INT DEFAULT 0,
    rows_accepted INT DEFAULT 0,
    rows_rejected INT DEFAULT 0,
    status TEXT DEFAULT 'Completed', -- e.g., 'Completed', 'Flagged', 'Failed', 'Rolled Back'
    remarks TEXT
);

CREATE INDEX IF NOT EXISTS idx_upload_audit_batch ON upload_audit_trail(upload_batch_id);

-- 2. Add upload_batch_id to track which records belong to which upload for rollback
ALTER TABLE import_documents ADD COLUMN IF NOT EXISTS upload_batch_id UUID;
ALTER TABLE import_line_items ADD COLUMN IF NOT EXISTS upload_batch_id UUID;
ALTER TABLE shipping_bills ADD COLUMN IF NOT EXISTS upload_batch_id UUID;
ALTER TABLE shipping_bill_items ADD COLUMN IF NOT EXISTS upload_batch_id UUID;

CREATE INDEX IF NOT EXISTS idx_import_docs_batch ON import_documents(upload_batch_id);
CREATE INDEX IF NOT EXISTS idx_shipping_bills_batch ON shipping_bills(upload_batch_id);

-- 3. Over-commit Guard Trigger on import_documents
CREATE OR REPLACE FUNCTION check_import_cif_limit()
RETURNS TRIGGER AS $$
DECLARE
    auth_cif NUMERIC;
    current_cif NUMERIC;
    new_doc_cif NUMERIC;
BEGIN
    -- Only run this check if licence_id is set
    IF NEW.licence_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Get authorized CIF limit from licence_master
    SELECT import_licence_value INTO auth_cif 
    FROM licence_master 
    WHERE id = NEW.licence_id;

    -- Get current sum of CIF for this licence (excluding the row being updated if it's an UPDATE)
    SELECT COALESCE(SUM(total_invoice_value_inr), 0) INTO current_cif
    FROM import_documents
    WHERE licence_id = NEW.licence_id 
    AND id != NEW.id;

    -- Calculate the new incoming value
    new_doc_cif := COALESCE(NEW.total_invoice_value_inr, 0);

    -- Reject if limits exceeded
    IF (current_cif + new_doc_cif) > COALESCE(auth_cif, 100000000) THEN
        RAISE EXCEPTION 'Compliance Guard: Inserting/Updating Bill of Entry would push cumulative CIF (%) past authorized limit (%)', (current_cif + new_doc_cif), COALESCE(auth_cif, 100000000);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_import_cif_limit ON import_documents;
CREATE TRIGGER trg_check_import_cif_limit
    BEFORE INSERT OR UPDATE ON import_documents
    FOR EACH ROW
    EXECUTE FUNCTION check_import_cif_limit();


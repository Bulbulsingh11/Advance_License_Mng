# DGFT Audit & Rollback Path for Bulk Uploads

## Overview
Phase 6 introduces strict data integrity boundaries by tracking every bulk upload (Excel/Review) with a unique `upload_batch_id`. This ID cascades from the `upload_audit_trail` table down to the individual `import_documents`, `import_line_items`, `shipping_bills`, and `shipping_bill_items`.

If an incorrect or corrupted Excel file is uploaded and saved to the database, you can safely perform a surgical rollback of **only that specific upload batch** without affecting any other transactions on the Advance Licence.

## How to Identify a Bad Upload
1. Query the `upload_audit_trail` table (or check a future admin dashboard).
   ```sql
   SELECT * FROM upload_audit_trail ORDER BY uploaded_at DESC LIMIT 10;
   ```
2. Locate the row corresponding to the bad upload. You can identify it by `uploaded_by`, `uploaded_at`, or `file_name`.
3. Note the `upload_batch_id` UUID for that upload.

## How to Perform a Rollback

To completely reverse an import/export bulk upload, execute the following SQL commands using your Supabase SQL Editor. 

### Rolling back an Import Bulk Upload:
```sql
BEGIN;
  -- Replace 'YOUR-BATCH-ID' with the actual upload_batch_id
  DELETE FROM import_line_items WHERE upload_batch_id = 'YOUR-BATCH-ID';
  DELETE FROM import_documents WHERE upload_batch_id = 'YOUR-BATCH-ID';
  
  -- Update the audit trail to reflect the rollback
  UPDATE upload_audit_trail 
  SET status = 'Rolled Back', remarks = 'Rolled back by administrator' 
  WHERE upload_batch_id = 'YOUR-BATCH-ID';
COMMIT;
```

### Rolling back an Export Bulk Upload:
```sql
BEGIN;
  -- Replace 'YOUR-BATCH-ID' with the actual upload_batch_id
  DELETE FROM shipping_bill_items WHERE upload_batch_id = 'YOUR-BATCH-ID';
  DELETE FROM shipping_bills WHERE upload_batch_id = 'YOUR-BATCH-ID';
  
  -- Update the audit trail to reflect the rollback
  UPDATE upload_audit_trail 
  SET status = 'Rolled Back', remarks = 'Rolled back by administrator' 
  WHERE upload_batch_id = 'YOUR-BATCH-ID';
COMMIT;
```

## Why this is safe
Because of the database-level triggers added in Phase 6, if the bad upload originally breached the `import_licence_value` CIF limits or pushed utilization thresholds out of bounds, reversing it will instantly correct the cumulative calculations in the `computeLicenceUtilization` engine. The daily snapshot job will automatically correct the graphs on its next run, or you can trigger a manual recalculation from the Utilization Dashboard.

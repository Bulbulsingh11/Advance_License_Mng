const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// For import-documents/bulk
code = code.replace(
  /const createdDocs: any\[\] = \[\];\n\s+const supabase = getSupabaseServerClient\(\);/,
  `const createdDocs: any[] = [];
      const supabase = getSupabaseServerClient();
      const uploadBatchId = req.body.uploadBatchId || randomUUID();
      const fileName = req.body.fileName || "unknown_import_upload";
      
      if (supabase) {
        await supabase.from("upload_audit_trail").insert({
          upload_batch_id: uploadBatchId,
          document_type: "Import Bulk",
          file_name: fileName,
          total_rows_processed: rawDocs.length,
          status: "In Progress"
        });
      }`
);

code = code.replace(
  /id: newDoc\.id,\n\s+licence_id: newDoc\.licenceId,/,
  `id: newDoc.id,
              licence_id: newDoc.licenceId,
              upload_batch_id: uploadBatchId,`
);

code = code.replace(
  /const dbItems = processedItems\.map\(\(item\) => \(\{\n\s+id: item\.id,\n\s+import_bill_id: item\.importBillId,/,
  `const dbItems = processedItems.map((item) => ({
                id: item.id,
                import_bill_id: item.importBillId,
                upload_batch_id: uploadBatchId,`
);


// For shipping-bills/bulk
code = code.replace(
  /const insertedBills: any\[\] = \[\];\n\s+const affectedLicenceIds = new Set<string>\(\);\n\s+const supabase = getSupabaseServerClient\(\);/,
  `const insertedBills: any[] = [];
      const affectedLicenceIds = new Set<string>();
      const supabase = getSupabaseServerClient();
      const uploadBatchId = req.body.uploadBatchId || randomUUID();
      const fileName = req.body.fileName || "unknown_export_upload";

      if (supabase) {
        await supabase.from("upload_audit_trail").insert({
          upload_batch_id: uploadBatchId,
          document_type: "Export Bulk",
          file_name: fileName,
          total_rows_processed: bills.length,
          status: "In Progress"
        });
      }`
);

code = code.replace(
  /id: newId,\n\s+licence_id: licenceUuid,/,
  `id: newId,
            licence_id: licenceUuid,
            upload_batch_id: uploadBatchId,`
);

code = code.replace(
  /const itemInserts = formattedRecord\.items\.map\(\(itm: any\) => \(\{\n\s+id: itm\.id,\n\s+shipping_bill_id: newId,/,
  `const itemInserts = formattedRecord.items.map((itm: any) => ({
              id: itm.id,
              shipping_bill_id: newId,
              upload_batch_id: uploadBatchId,`
);

fs.writeFileSync('server.ts', code);

const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix 1: uploadBatchId in shipping-bills
code = code.replace(/id: newId,\s+licence_id: licenceUuid,\s+upload_batch_id: uploadBatchId,/g, 'id: newId, licence_id: licenceUuid,');

// For shipping-bills/bulk, it uses `id: newId,\n            licence_id: licenceUuid,\n            licence_number` let's just manually put it back.
code = code.replace(/shipping_bill_number: formattedRecord\.shippingBillNumber,/, 'shipping_bill_number: formattedRecord.shippingBillNumber,\n            upload_batch_id: typeof uploadBatchId !== "undefined" ? uploadBatchId : null,');

fs.writeFileSync('server.ts', code);

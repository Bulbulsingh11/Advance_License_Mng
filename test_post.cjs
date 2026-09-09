async function test() {
  const res = await fetch('http://localhost:3000/api/import-documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      licenceId: "AL-2026-001",
      licenceNumber: "0310789456",
      importBillNumber: "TEST-BOE-1",
      docDate: "2026-01-01",
      portCode: "INNSA1",
      supplierName: "Test Supplier",
      supplierCountry: "US",
      currency: "USD",
      exchangeRate: 83.5,
      invoiceNumber: "INV-123",
      invoiceDate: "2026-01-01",
      totalInvoiceValueFc: 100,
      freightFcy: 10,
      insuranceFcy: 5,
      boeStatus: "Cleared",
      lineItems: [
        {
          rawMaterialId: "RM-COT-001",
          quantity: 10,
          uom: "KGS",
          unitPriceFcy: 10,
          totalValueFcy: 100,
          assessableValueInr: 8350,
          bcdPercent: 5,
          igstPercent: 12
        }
      ]
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
test();

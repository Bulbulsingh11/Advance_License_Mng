async function test() {
  const res = await fetch('http://localhost:3000/api/shipping-bills', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      licenceId: "AL-2026-001",
      licenceNumber: "0310789456",
      shippingBillNumber: "SB-2026-1",
      sbDate: "2026-01-01",
      portCode: "INNSA1",
      buyerName: "Test Buyer",
      buyerCountry: "US",
      currency: "USD",
      exchangeRate: 83.5,
      invoiceNumber: "INV-123",
      invoiceDate: "2026-01-01",
      totalFobValueFc: 100,
      realizedFobValueInr: 8350,
      sbStatus: "Exported",
      lineItems: [
        {
          exportProductId: "EP-YRN-001",
          quantity: 10,
          uom: "KGS",
          unitPriceFcy: 10,
          totalValueFcy: 100,
          fobValueInr: 8350
        }
      ]
    })
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text);
}
test();

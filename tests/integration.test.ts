import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app, startServer } from '../server.ts';
import { randomUUID } from 'crypto';

describe('Save Endpoints Integration Tests (Write Failures)', () => {
  beforeAll(async () => {
    // initialize routes without starting the listener
    process.env.NODE_ENV = "production"; await startServer(true); 
  });

  const generateLicenceId = () => randomUUID(); 

  it('POST /api/import-documents should return success: false on DB constraint failure', async () => {
    const payload = {
      licenceId: generateLicenceId(),
      importBillNumber: "TEST-IB-" + Date.now(),
      boeStatus: "INVALID_STATUS_THAT_BREAKS_CHECK", 
      items: []
    };

    const res = await request(app).post('/api/import-documents').send(payload);
    
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.status).not.toBe(200);
  });

  it('POST /api/import-documents/bulk should return success: false on DB constraint failure', async () => {
    const payload = {
      documents: [
        {
          licenceId: generateLicenceId(),
          importBillNumber: "TEST-IB-BULK-" + Date.now(),
          boeStatus: "INVALID_STATUS_THAT_BREAKS_CHECK",
          items: []
        }
      ]
    };

    const res = await request(app).post('/api/import-documents/bulk').send(payload);
    
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.status).not.toBe(200);
  });

  it('POST /api/shipping-bills should return success: false on DB constraint failure', async () => {
    const payload = {
      licenceId: generateLicenceId(),
      shippingBillNumber: "TEST-SB-" + Date.now(),
      status: "INVALID_STATUS_THAT_BREAKS_CHECK", 
      items: []
    };

    const res = await request(app).post('/api/shipping-bills').send(payload);
    
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.status).not.toBe(200);
  });

  it('POST /api/shipping-bills/bulk should return success: false on DB constraint failure', async () => {
    const payload = {
      bills: [
        {
          licenceId: generateLicenceId(),
          shippingBillNumber: "TEST-SB-BULK-" + Date.now(),
          status: "INVALID_STATUS_THAT_BREAKS_CHECK",
          items: []
        }
      ]
    };

    const res = await request(app).post('/api/shipping-bills/bulk').send(payload);
    
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.status).not.toBe(200);
  });
});

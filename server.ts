import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Initialize server-side Supabase client using Service Role Key or fallback anon key
let supabaseServerClient: SupabaseClient | null = null;

function getSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseServerClient) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY;

    if (url && key && url.trim() !== "" && key.trim() !== "") {
      try {
        supabaseServerClient = createClient(url, key, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
        console.log(`[Supabase] Initialized server-side client with endpoint: ${url}`);
      } catch (err) {
        console.error("[Supabase] Failed to initialize client:", err);
      }
    } else {
      console.warn(
        "[Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables."
      );
    }
  }
  return supabaseServerClient;
}

// In-memory fallback repository when database credentials are not configured yet
let inMemoryLicencesStore: any[] = [];

// Helper to sanitize dates for PostgreSQL DATE columns (empty string -> null)
function sanitizeDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const trimmed = dateStr.trim();
  if (!trimmed || trimmed === "" || trimmed === "undefined" || trimmed === "null") {
    return null;
  }
  // Check if valid YYYY-MM-DD or parseable date
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
  } catch {}
  return null;
}

// Map PostgreSQL snake_case row to frontend camelCase object
function mapDbRowToLicence(row: any): any {
  if (!row) return null;

  // Extract joined export items if present
  const rawItems = row.licence_export_items || row.export_items || [];
  const exportItems = Array.isArray(rawItems)
    ? rawItems.map((item: any, idx: number) => ({
        id: item.id || `exp-${idx + 1}`,
        licenceId: item.licence_id || row.id,
        exportSrNo: item.export_sr_no || String(idx + 1),
        sionSrNo: item.sion_sr_no || "",
        itcHsCode: item.itc_hs_code || "",
        productDescription: item.product_description || "",
        quantity: Number(item.quantity) || 0,
        uom: item.uom || "",
        fobValueInr: Number(item.fob_value_inr) || 0,
        fobValueFc: Number(item.fob_value_fc) || 0,
        currency: item.currency || row.export_foreign_currency || "USD",
        needsVerification: Boolean(item.needs_verification),
        verificationNotes: item.verification_notes || "",
      }))
    : [];

  return {
    id: row.id,
    fileNumber: row.file_number || "",
    dgftFileNumber: row.dgft_file_number || "",
    dgftApplicationNumber: row.dgft_application_number || "",
    licenceNumber: row.licence_number || "",
    licenceDate: row.licence_date || "",
    importValidity: row.import_validity || "",
    exportValidity: row.export_validity || "",
    licensingAuthority: row.licensing_authority || "",
    licenceType: row.licence_type || "Advance Authorisation for Duty Exemption",
    typeOfNorm: row.type_of_norm || "Standard SION (Textile)",
    exportForeignCurrency: row.export_foreign_currency || "USD",
    importCurrency: row.import_currency || row.export_foreign_currency || "USD",
    forexExportRate: row.forex_export_rate || "",
    forexImportRate: row.forex_import_rate || "",
    exportExchangeRate: Number(row.export_exchange_rate) || 0,
    importExchangeRate: Number(row.import_exchange_rate) || 0,
    fobValueInr: row.fob_value_inr || "0",
    fobValueFc: row.fob_value_fc || "0",
    cifValueInr: row.cif_value_inr || "0",
    cifValueFc: row.cif_value_fc || "0",
    cifValueInvalidatedInr: row.cif_value_invalidated_inr || "0.00",
    importLicenceValue: Number(row.import_licence_value) || 0,
    bulkLicenceValue: Number(row.bulk_licence_value) || 0,
    exportObligationValue: Number(row.export_obligation_value) || 0,
    fobValue: Number(row.fob_value) || 0,
    cifValue: Number(row.cif_value) || 0,
    dutySaved: Number(row.duty_saved) || 0,
    exportObligationPeriod: row.export_obligation_period || "",
    licenceStatus: row.licence_status || "Active",
    status: row.status || "Active",
    applicantName: row.applicant_name || "Alok Industries Limited",
    originalFilename: row.original_filename || "",
    originalDocument: row.original_document || null,
    extractedFromPdf: Boolean(row.extracted_from_pdf),
    exportItems: exportItems,
    otherExtractedInfo: Array.isArray(row.other_extracted_info) ? row.other_extracted_info : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Map camelCase payload to PostgreSQL snake_case master row
function mapLicencePayloadToDbRow(payload: any, recordId: string): any {
  return {
    id: recordId,
    file_number: payload.fileNumber || payload.file_number || "",
    dgft_file_number: payload.dgftFileNumber || payload.dgft_file_number || "",
    dgft_application_number: payload.dgftApplicationNumber || payload.dgft_application_number || "",
    licence_number: payload.licenceNumber || payload.licence_number || "",
    licence_date: sanitizeDate(payload.licenceDate || payload.licence_date),
    import_validity: sanitizeDate(payload.importValidity || payload.import_validity),
    export_validity: sanitizeDate(payload.exportValidity || payload.export_validity),
    licensing_authority: payload.licensingAuthority || payload.licensing_authority || "",
    licence_type: payload.licenceType || payload.licence_type || "Advance Authorisation for Duty Exemption",
    type_of_norm: payload.typeOfNorm || payload.type_of_norm || "Standard SION (Textile)",
    export_foreign_currency: payload.exportForeignCurrency || payload.export_foreign_currency || "USD",
    import_currency: payload.importCurrency || payload.import_currency || payload.exportForeignCurrency || "USD",
    forex_export_rate: payload.forexExportRate || payload.forex_export_rate || "",
    forex_import_rate: payload.forexImportRate || payload.forex_import_rate || "",
    export_exchange_rate: Number(payload.exportExchangeRate ?? payload.export_exchange_rate) || 0,
    import_exchange_rate: Number(payload.importExchangeRate ?? payload.import_exchange_rate) || 0,
    fob_value_inr: String(payload.fobValueInr ?? payload.fob_value_inr ?? "0"),
    fob_value_fc: String(payload.fobValueFc ?? payload.fob_value_fc ?? "0"),
    cif_value_inr: String(payload.cifValueInr ?? payload.cif_value_inr ?? "0"),
    cif_value_fc: String(payload.cifValueFc ?? payload.cif_value_fc ?? "0"),
    cif_value_invalidated_inr: String(payload.cifValueInvalidatedInr ?? payload.cif_value_invalidated_inr ?? "0.00"),
    import_licence_value: Number(payload.importLicenceValue ?? payload.import_licence_value) || 0,
    bulk_licence_value: Number(payload.bulkLicenceValue ?? payload.bulk_licence_value) || 0,
    export_obligation_value: Number(payload.exportObligationValue ?? payload.export_obligation_value) || 0,
    fob_value: Number(payload.fobValue ?? payload.fob_value) || 0,
    cif_value: Number(payload.cifValue ?? payload.cif_value) || 0,
    duty_saved: Number(payload.dutySaved ?? payload.duty_saved) || 0,
    export_obligation_period: payload.exportObligationPeriod || payload.export_obligation_period || "",
    licence_status: payload.licenceStatus || payload.licence_status || "Active",
    status: payload.status || "Active",
    applicant_name: payload.applicantName || payload.applicant_name || "Alok Industries Limited",
    original_filename: payload.originalFilename || payload.original_filename || "",
    original_document: payload.originalDocument || payload.original_document || null,
    extracted_from_pdf: Boolean(payload.extractedFromPdf ?? payload.extracted_from_pdf),
    other_extracted_info: payload.otherExtractedInfo || payload.other_extracted_info || [],
    updated_at: new Date().toISOString(),
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // CORS and resilience headers
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Database Connection Status Endpoint
  app.get("/api/database/status", async (req, res) => {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.json({
        connected: false,
        source: "in_memory_fallback",
        message: "Supabase environment variables (SUPABASE_URL, SUPABASE_SERVICE_KEY) not provided.",
        recordsCount: inMemoryLicencesStore.length,
      });
    }

    try {
      const { count, error } = await supabase
        .from("licence_master")
        .select("*", { count: "exact", head: true });

      if (error) {
        console.warn("[/api/database/status] Supabase check notice:", error.message);
        return res.json({
          connected: false,
          source: "supabase_table_pending",
          error: error.message,
          hint: "Make sure you executed the SQL script in /supabase/schema.sql in your Supabase SQL editor.",
          recordsCount: inMemoryLicencesStore.length,
        });
      }

      return res.json({
        connected: true,
        source: "supabase_postgresql",
        tables: ["licence_master", "licence_export_items"],
        recordsCount: count ?? 0,
      });
    } catch (err: any) {
      return res.json({
        connected: false,
        source: "connection_exception",
        error: err.message,
        recordsCount: inMemoryLicencesStore.length,
      });
    }
  });

  // -------------------------------------------------------------------------
  // CRUD API: GET /api/licences (Fetch all licences with joined export items)
  // -------------------------------------------------------------------------
  app.get("/api/licences", async (req, res) => {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return res.json({
        success: true,
        source: "in_memory_fallback",
        count: inMemoryLicencesStore.length,
        data: inMemoryLicencesStore,
      });
    }

    try {
      // 1. Fetch master records
      const { data: masterRows, error: masterErr } = await supabase
        .from("licence_master")
        .select("*")
        .order("created_at", { ascending: false });

      if (masterErr) {
        console.warn("[API GET /api/licences] Supabase query notice (falling back to memory):", masterErr.message);
        return res.json({
          success: true,
          source: "in_memory_fallback",
          fallback: true,
          count: inMemoryLicencesStore.length,
          data: inMemoryLicencesStore,
          databaseError: masterErr.message,
          hint: "Run /supabase/schema.sql in the Supabase SQL editor to create PostgreSQL tables.",
        });
      }

      const rows = masterRows || [];

      // 2. Fetch export items for all retrieved master licences
      let allExportItems: any[] = [];
      if (rows.length > 0) {
        const masterIds = rows.map((r: any) => r.id).filter(Boolean);
        try {
          const { data: itemsData, error: itemsErr } = await supabase
            .from("licence_export_items")
            .select("*")
            .in("licence_id", masterIds);

          if (!itemsErr && itemsData) {
            allExportItems = itemsData;
          }
        } catch (itemQueryErr) {
          console.warn("[API GET /api/licences] Export items query skipped:", itemQueryErr);
        }
      }

      // 3. Attach export items to respective master records
      const joinedData = rows.map((m: any) => ({
        ...m,
        licence_export_items: allExportItems.filter((item: any) => item.licence_id === m.id),
      }));

      const formatted = joinedData.map(mapDbRowToLicence);

      // Keep in-memory store in sync with DB records
      if (formatted.length > 0) {
        inMemoryLicencesStore = formatted;
      }

      return res.json({
        success: true,
        source: "supabase_postgresql",
        count: formatted.length,
        data: formatted,
      });
    } catch (err: any) {
      console.warn("[API GET /api/licences] Exception (falling back):", err.message);
      return res.json({
        success: true,
        source: "in_memory_fallback",
        fallback: true,
        count: inMemoryLicencesStore.length,
        data: inMemoryLicencesStore,
        databaseError: err.message || "Failed to fetch licences from database",
      });
    }
  });

  // -------------------------------------------------------------------------
  // CRUD API: GET /api/licences/:id (Fetch single licence with export items)
  // -------------------------------------------------------------------------
  app.get("/api/licences/:id", async (req, res) => {
    const { id } = req.params;
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      const found = inMemoryLicencesStore.find((l) => l.id === id);
      if (!found) {
        return res.status(404).json({ success: false, error: "Licence not found" });
      }
      return res.json({ success: true, data: found });
    }

    try {
      const { data: masterRow, error: masterErr } = await supabase
        .from("licence_master")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (masterErr || !masterRow) {
        const found = inMemoryLicencesStore.find((l) => l.id === id);
        if (found) {
          return res.json({ success: true, source: "in_memory_fallback", data: found });
        }
        return res.status(404).json({
          success: false,
          error: masterErr ? masterErr.message : "Licence not found in database",
        });
      }

      // Fetch export items
      let exportItems: any[] = [];
      try {
        const { data: items } = await supabase
          .from("licence_export_items")
          .select("*")
          .eq("licence_id", id);
        if (items) exportItems = items;
      } catch {}

      const formatted = mapDbRowToLicence({
        ...masterRow,
        licence_export_items: exportItems,
      });

      return res.json({
        success: true,
        source: "supabase_postgresql",
        data: formatted,
      });
    } catch (err: any) {
      const found = inMemoryLicencesStore.find((l) => l.id === id);
      if (found) {
        return res.json({ success: true, source: "in_memory_fallback", data: found });
      }
      return res.status(500).json({
        success: false,
        error: err.message || "Internal server error fetching licence",
      });
    }
  });

  // -------------------------------------------------------------------------
  // CRUD API: POST /api/licences (Insert master record + export items schedule)
  // -------------------------------------------------------------------------
  app.post("/api/licences", async (req, res) => {
    const payload = req.body;
    const fileNumber = payload.fileNumber || payload.file_number;
    const licenceNumber = payload.licenceNumber || payload.licence_number;

    if (!fileNumber || !licenceNumber) {
      return res.status(400).json({
        success: false,
        error: "Company File Number and Licence Number are required fields.",
      });
    }

    // Generate valid UUID for id
    const recordId =
      payload.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        payload.id
      )
        ? payload.id
        : crypto.randomUUID();

    const masterRow = mapLicencePayloadToDbRow(payload, recordId);
    const rawExportItems = Array.isArray(payload.exportItems)
      ? payload.exportItems
      : Array.isArray(payload.export_items)
      ? payload.export_items
      : [];

    const inMemoryRecord = {
      ...payload,
      id: recordId,
      fileNumber: fileNumber,
      licenceNumber: licenceNumber,
      exportItems: rawExportItems.map((item: any, idx: number) => ({
        ...item,
        id: item.id || crypto.randomUUID(),
        licenceId: recordId,
        exportSrNo: item.exportSrNo || String(idx + 1),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Always keep in-memory store updated
    inMemoryLicencesStore = [
      inMemoryRecord,
      ...inMemoryLicencesStore.filter((l) => l.id !== recordId),
    ];

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return res.status(201).json({
        success: true,
        source: "in_memory_fallback",
        data: inMemoryRecord,
      });
    }

    try {
      // 1. Insert Master Record into licence_master
      const { data: insertedMaster, error: masterError } = await supabase
        .from("licence_master")
        .insert(masterRow)
        .select()
        .single();

      if (masterError) {
        console.warn("[POST /api/licences] Supabase insert warning (saved in memory):", masterError.message);
        return res.status(200).json({
          success: true,
          source: "in_memory_fallback",
          fallback: true,
          data: inMemoryRecord,
          warning: `Database save notice: ${masterError.message}. Stored in session cache. Run /supabase/schema.sql to enable permanent DB persistence.`,
        });
      }

      // 2. Insert Export Items into licence_export_items
      let savedExportItems: any[] = [];
      if (rawExportItems.length > 0) {
        const itemRows = rawExportItems.map((item: any, idx: number) => ({
          id:
            item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
              ? item.id
              : crypto.randomUUID(),
          licence_id: insertedMaster.id,
          export_sr_no: item.exportSrNo || item.export_sr_no || String(idx + 1),
          sion_sr_no: item.sionSrNo || item.sion_sr_no || "",
          itc_hs_code: item.itcHsCode || item.itc_hs_code || "",
          product_description: item.productDescription || item.product_description || "",
          quantity: Number(item.quantity) || 0,
          uom: item.uom || "",
          fob_value_inr: Number(item.fobValueInr ?? item.fob_value_inr) || 0,
          fob_value_fc: Number(item.fobValueFc ?? item.fob_value_fc) || 0,
          currency: item.currency || insertedMaster.export_foreign_currency || "USD",
          needs_verification: Boolean(item.needsVerification ?? item.needs_verification),
          verification_notes: item.verificationNotes || item.verification_notes || null,
        }));

        try {
          const { data: insertedItems, error: itemsError } = await supabase
            .from("licence_export_items")
            .insert(itemRows)
            .select();

          if (!itemsError && insertedItems) {
            savedExportItems = insertedItems;
          }
        } catch (itemErr) {
          console.warn("[POST /api/licences] Export items insert warning:", itemErr);
        }
      }

      // 3. Return full joined object
      const fullRecord = mapDbRowToLicence({
        ...insertedMaster,
        licence_export_items: savedExportItems,
      });

      inMemoryLicencesStore = [
        fullRecord,
        ...inMemoryLicencesStore.filter((l) => l.id !== fullRecord.id),
      ];

      return res.status(201).json({
        success: true,
        source: "supabase_postgresql",
        data: fullRecord,
      });
    } catch (err: any) {
      console.warn("[POST /api/licences] Exception (saved to memory):", err.message);
      return res.status(200).json({
        success: true,
        source: "in_memory_fallback",
        fallback: true,
        data: inMemoryRecord,
        warning: `Database exception: ${err.message}. Saved to local memory cache.`,
      });
    }
  });

  // -------------------------------------------------------------------------
  // CRUD API: PUT /api/licences/:id (Update licence master + sync export items)
  // -------------------------------------------------------------------------
  app.put("/api/licences/:id", async (req, res) => {
    const { id } = req.params;
    const payload = req.body;

    const masterRow = mapLicencePayloadToDbRow(payload, id);
    const rawExportItems = Array.isArray(payload.exportItems)
      ? payload.exportItems
      : Array.isArray(payload.export_items)
      ? payload.export_items
      : [];

    const inMemoryUpdated = {
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    inMemoryLicencesStore = inMemoryLicencesStore.map((l) => (l.id === id ? inMemoryUpdated : l));

    const supabase = getSupabaseServerClient();

    if (!supabase) {
      return res.json({
        success: true,
        source: "in_memory_fallback",
        data: inMemoryUpdated,
      });
    }

    try {
      // 1. Update master row
      const { data: updatedMaster, error: masterError } = await supabase
        .from("licence_master")
        .update(masterRow)
        .eq("id", id)
        .select()
        .maybeSingle();

      if (masterError || !updatedMaster) {
        console.warn("[PUT /api/licences/:id] Supabase update warning:", masterError?.message);
        return res.json({
          success: true,
          source: "in_memory_fallback",
          fallback: true,
          data: inMemoryUpdated,
        });
      }

      // 2. Replace export items schedule
      try {
        await supabase.from("licence_export_items").delete().eq("licence_id", id);
      } catch {}

      let savedExportItems: any[] = [];
      if (rawExportItems.length > 0) {
        const itemRows = rawExportItems.map((item: any, idx: number) => ({
          id:
            item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
              ? item.id
              : crypto.randomUUID(),
          licence_id: id,
          export_sr_no: item.exportSrNo || item.export_sr_no || String(idx + 1),
          sion_sr_no: item.sionSrNo || item.sion_sr_no || "",
          itc_hs_code: item.itcHsCode || item.itc_hs_code || "",
          product_description: item.productDescription || item.product_description || "",
          quantity: Number(item.quantity) || 0,
          uom: item.uom || "",
          fob_value_inr: Number(item.fobValueInr ?? item.fob_value_inr) || 0,
          fob_value_fc: Number(item.fobValueFc ?? item.fob_value_fc) || 0,
          currency: item.currency || updatedMaster.export_foreign_currency || "USD",
          needs_verification: Boolean(item.needsVerification ?? item.needs_verification),
          verification_notes: item.verificationNotes || item.verification_notes || null,
        }));

        try {
          const { data: insertedItems } = await supabase
            .from("licence_export_items")
            .insert(itemRows)
            .select();

          if (insertedItems) {
            savedExportItems = insertedItems;
          }
        } catch {}
      }

      const fullRecord = mapDbRowToLicence({
        ...updatedMaster,
        licence_export_items: savedExportItems,
      });

      inMemoryLicencesStore = inMemoryLicencesStore.map((l) => (l.id === id ? fullRecord : l));

      return res.json({
        success: true,
        source: "supabase_postgresql",
        data: fullRecord,
      });
    } catch (err: any) {
      console.warn("[PUT /api/licences/:id] Exception:", err.message);
      return res.json({
        success: true,
        source: "in_memory_fallback",
        data: inMemoryUpdated,
      });
    }
  });

  // -------------------------------------------------------------------------
  // CRUD API: DELETE /api/licences/:id (Delete licence and cascade export items)
  // -------------------------------------------------------------------------
  app.delete("/api/licences/:id", async (req, res) => {
    const { id } = req.params;
    inMemoryLicencesStore = inMemoryLicencesStore.filter((l) => l.id !== id);

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return res.json({
        success: true,
        source: "in_memory_fallback",
        message: "Licence deleted from memory store",
      });
    }

    try {
      const { error } = await supabase.from("licence_master").delete().eq("id", id);
      if (error) {
        console.warn("[DELETE /api/licences/:id] Database delete warning:", error.message);
      }
      return res.json({
        success: true,
        source: "supabase_postgresql",
        message: "Licence deleted successfully",
      });
    } catch (err: any) {
      console.warn("[DELETE /api/licences/:id] Exception:", err.message);
      return res.json({
        success: true,
        source: "in_memory_fallback",
        message: "Licence removed from memory store",
      });
    }
  });

  // -------------------------------------------------------------------------
  // CRUD API: DELETE /api/licences/:id (Delete licence and cascade export items)
  // -------------------------------------------------------------------------
  app.delete("/api/licences/:id", async (req, res) => {
    const { id } = req.params;
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      inMemoryLicencesStore = inMemoryLicencesStore.filter((l) => l.id !== id);
      return res.json({
        success: true,
        source: "in_memory_fallback",
        deletedId: id,
      });
    }

    try {
      // Explicitly delete export items first (in case cascade is not activated yet)
      await supabase.from("licence_export_items").delete().eq("licence_id", id);

      const { error } = await supabase
        .from("licence_master")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("[DELETE /api/licences/:id] Error:", error);
        return res.status(500).json({
          success: false,
          error: `Failed to delete licence: ${error.message}`,
        });
      }

      return res.json({
        success: true,
        source: "supabase_postgresql",
        deletedId: id,
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        error: err.message || "Failed to delete licence record",
      });
    }
  });

  // -------------------------------------------------------------------------
  // Helper to extract company file number from filename prefix
  // -------------------------------------------------------------------------
  const extractCompanyFileNumberFromFilename = (name: string): string => {
    if (!name) return "";
    const cleanName = name.trim();
    const match = cleanName.match(/^([A-Za-z0-9\-_/]+)(?:\s+|_|-|\b)/);
    if (match && match[1]) {
      const token = match[1];
      const ignored = ["advance", "authorisation", "authorization", "dgft", "licence", "license", "doc", "document", "scan", "letter", "file"];
      if (!ignored.includes(token.toLowerCase())) {
        return token;
      }
    }
    return "";
  };

  // -------------------------------------------------------------------------
  // PDF Extraction API route using Gemini with strict verbatim rules
  // -------------------------------------------------------------------------
  app.post("/api/extract-licence-pdf", async (req, res) => {
    const { pdfBase64, fileName } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    const suggestedCompanyFileNo = extractCompanyFileNumberFromFilename(fileName || "");

    const sanitizeExtractedData = (data: any) => {
      let period = typeof data.exportObligationPeriod === "string" ? data.exportObligationPeriod.trim() : "";
      if (
        period.toLowerCase().includes("refer") ||
        period.toLowerCase().includes("header") ||
        period.toLowerCase().includes("condition") ||
        period.toLowerCase().includes("as per") ||
        period.toLowerCase().includes("policy")
      ) {
        period = "";
      }

      let fileNumber = suggestedCompanyFileNo || (typeof data.fileNumber === "string" ? data.fileNumber.trim() : "");
      let dgftFileNumber = typeof data.dgftFileNumber === "string" ? data.dgftFileNumber.trim() : "";

      if (fileNumber === dgftFileNumber) {
        fileNumber = suggestedCompanyFileNo || "";
      }

      const rawExportItems = Array.isArray(data.exportItems) ? data.exportItems : [];
      const sanitizedExportItems = rawExportItems.map((item: any, index: number) => {
        const exportSrNo = typeof item.exportSrNo === "string" ? item.exportSrNo.trim() : String(item.exportSrNo || index + 1);
        const sionSrNo = typeof item.sionSrNo === "string" ? item.sionSrNo.trim() : item.sionSrNo ? String(item.sionSrNo) : "";
        const itcHsCode = typeof item.itcHsCode === "string" ? item.itcHsCode.trim() : item.itcHsCode ? String(item.itcHsCode) : "";
        const productDescription = typeof item.productDescription === "string" ? item.productDescription.trim() : "";
        const quantity = typeof item.quantity === "number" ? item.quantity : Number(item.quantity) || 0;
        const uom = typeof item.uom === "string" ? item.uom.trim().toUpperCase() : "";
        const fobValueInr = typeof item.fobValueInr === "number" ? item.fobValueInr : Number(item.fobValueInr) || 0;
        const fobValueFc = typeof item.fobValueFc === "number" ? item.fobValueFc : Number(item.fobValueFc) || 0;
        const currency = typeof item.currency === "string" ? item.currency.trim() : data.exportForeignCurrency || "USD";

        const needsVerification = Boolean(
          item.needsVerification || !productDescription || !itcHsCode || quantity <= 0 || fobValueInr <= 0
        );

        return {
          id: item.id || `exp-item-${Date.now()}-${index + 1}`,
          exportSrNo: exportSrNo || String(index + 1),
          sionSrNo: sionSrNo || "",
          itcHsCode: itcHsCode || "",
          productDescription: productDescription || "",
          quantity: quantity,
          uom: uom || "",
          fobValueInr: fobValueInr,
          fobValueFc: fobValueFc,
          currency: currency || "USD",
          needsVerification: needsVerification,
        };
      });

      return {
        ...data,
        fileNumber: fileNumber || "",
        isCompanyFileNumberFromFilename: Boolean(suggestedCompanyFileNo),
        dgftFileNumber: dgftFileNumber || "",
        dgftApplicationNumber:
          (typeof data.dgftApplicationNumber === "string" ? data.dgftApplicationNumber.trim() : "") || "",
        exportObligationPeriod: period || "",
        exportItems: sanitizedExportItems,
        originalFilename: fileName || data.originalFilename || "Advance_Authorisation.pdf",
      };
    };

    const getFallbackExtraction = () => ({
      success: true,
      extracted: sanitizeExtractedData({
        fileNumber: suggestedCompanyFileNo || "",
        dgftFileNumber: "",
        dgftApplicationNumber: "",
        licenceNumber: "",
        licenceDate: "",
        importValidity: "",
        exportValidity: "",
        licensingAuthority: "",
        licenceType: "Advance Authorisation for Duty Exemption",
        typeOfNorm: "Standard SION (Textile)",
        exportForeignCurrency: "USD",
        importCurrency: "USD",
        forexExportRate: "",
        forexImportRate: "",
        exportExchangeRate: 0,
        importExchangeRate: 0,
        fobValueInr: "",
        fobValueFc: "",
        cifValueInr: "",
        cifValueFc: "",
        cifValueInvalidatedInr: "0.00",
        importLicenceValue: 0,
        bulkLicenceValue: 0,
        exportObligationValue: 0,
        fobValue: 0,
        cifValue: 0,
        dutySaved: 0,
        exportObligationPeriod: "",
        exportItems: [],
        licenceStatus: "Active",
        originalFilename: fileName || "",
        otherExtractedInfo: [],
      }),
    });

    try {
      if (!apiKey) {
        console.warn("No GEMINI_API_KEY available in environment.");
        return res.json(getFallbackExtraction());
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const promptText = `You are an expert DGFT document analyst for Alok Industries. Extract all relevant information from this Advance Authorisation document into valid JSON.
CRITICAL EXTRACTION RULES:
1. MASTER DETAILS:
   - DO NOT extract company internal file number from PDF content (it does not exist in DGFT PDF body).
   - DGFT FILE NUMBER: Extract into "dgftFileNumber" (e.g. '05AX04004128AM26').
   - LICENCE NUMBER: Extract into "licenceNumber" (e.g. '0511038251').
   - DGFT APPLICATION NUMBER: If not present, set "dgftApplicationNumber": "". NEVER invent values.
   - EXPORT OBLIGATION PERIOD: Extract into "exportObligationPeriod" ONLY if a real duration (e.g. '18 Months') is stated. If boilerplate like 'Please refer header details' or 'As per policy', set "exportObligationPeriod": "".
   - DECIMAL PRECISION: Preserve all numbers with exact decimal places (e.g. 16975780.50, 83.1250). Do NOT round.

2. EXPORT ITEMS TABLE & VERBATIM PRODUCT DESCRIPTION RULES:
   - Locate the "Details of Items to be Exported" or "Export Items" schedule/table in the DGFT PDF.
   - Extract each export item row into the "exportItems" array with these exact fields:
     * exportSrNo: Export Serial Number (e.g. "1", "2")
     * sionSrNo: SION Serial Number / Norm reference (e.g. "62/2023" or "1", blank if not found)
     * itcHsCode: ITC (HS) Code / Tariff heading (e.g. "52081190")
     * productDescription: CRITICAL 100% VERBATIM TEXT EXTRACTION:
       - MUST be the complete, exact, literal text from the Item / Product Description column.
       - NEVER omit, remove, skip, or alter ANY character, digit, word, or identifier.
       - Example: If the cell says "Relevant Additive viz UV Stabilizer 1 contents 4000.000 Kgs", you MUST output the full string "Relevant Additive viz UV Stabilizer 1 contents 4000.000 Kgs" with the digit "1" and all words intact.
       - Do NOT remove numeric identifiers, codes, grade designations, serial markers, roman numerals, or internal sub-item numbers.
       - Do NOT normalize, clean, summarize, or paraphrase.
       - If multi-line in the table cell, combine lines with single spaces while preserving every word and number in sequence.
       - If any part of the text is unclear, retain the best literal transcription and set "needsVerification": true.
     * quantity: Numeric quantity exactly as stated (e.g. 100000.000 or 4000.000, do not round)
     * uom: Unit of Measurement (e.g. "MTR", "KGS", "SQM", "PCS")
     * fobValueInr: Numeric FOB Value in INR exactly as stated (e.g. 16975780.50, do not round)
     * fobValueFc: Numeric FOB Value in Export Foreign Currency exactly as stated (e.g. 204221.15)
     * currency: Currency code (e.g. "USD")
     * needsVerification: boolean
   - If no export items table is found, set "exportItems": [].

3. Return exact JSON keys:
   - dgftFileNumber, dgftApplicationNumber, licenceNumber, licenceDate, importValidity, exportValidity, licensingAuthority, licenceType, typeOfNorm, exportForeignCurrency, importCurrency, forexExportRate, forexImportRate, exportExchangeRate, importExchangeRate, fobValueInr, fobValueFc, cifValueInr, cifValueFc, cifValueInvalidatedInr, importLicenceValue, bulkLicenceValue, exportObligationValue, fobValue, cifValue, dutySaved, exportObligationPeriod, exportItems, licenceStatus, originalFilename, otherExtractedInfo.
Return ONLY valid JSON.`;

      let contents: any;

      if (pdfBase64) {
        const base64Data = pdfBase64.includes("base64,") ? pdfBase64.split("base64,")[1] : pdfBase64;
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64Data,
              },
            },
            {
              text: promptText,
            },
          ],
        };
      } else {
        contents = {
          parts: [
            {
              text: "Extract Advance Licence data in JSON format.",
            },
          ],
        };
      }

      const candidateModels = ["gemini-3.7-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      let response: any = null;

      for (const modelName of candidateModels) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: contents,
              config: {
                systemInstruction:
                  "You are an expert DGFT document analyst for Indian Advance Licences. You extract exact, 100% VERBATIM data from Advance Authorisation PDFs. You must NEVER drop numbers, words, abbreviations, or identifiers from product descriptions. You must NEVER paraphrase, shorten, or normalize any text. Preserve all quantities, decimals, currencies, and descriptions precisely as printed.",
                responseMimeType: "application/json",
                temperature: 0.0,
              },
            });
            if (response && response.text) {
              break;
            }
          } catch (modelErr) {
            console.warn(`Attempt ${attempt} on model ${modelName} encountered an error:`, modelErr);
            if (attempt === 1) {
              await new Promise((resolve) => setTimeout(resolve, 600));
            }
          }
        }
        if (response && response.text) {
          break;
        }
      }

      if (!response || !response.text) {
        console.warn("No content returned from Gemini models, using fallback extraction structure.");
        return res.json(getFallbackExtraction());
      }

      const responseText = response.text || "{}";
      let rawExtracted: any = {};
      try {
        const jsonStr = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        rawExtracted = JSON.parse(jsonStr);
      } catch (_jsonErr) {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            rawExtracted = JSON.parse(jsonMatch[0]);
          } catch {
            rawExtracted = {};
          }
        }
      }
      const sanitized = sanitizeExtractedData(rawExtracted);

      res.json({ success: true, extracted: sanitized });
    } catch (_err) {
      res.json(getFallbackExtraction());
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

import express from "express";
import path from "path";
import fs from "fs/promises";
import multer from "multer";
import Papa from "papaparse";
import { processRawData } from "./src/lib/processors.ts";
import { OperationRecord } from "./src/types";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV });
  });

  // Data Persistence path
  const DATA_FILE = "/tmp/db_records.json";

  // Helper to load and save records
  const loadRecords = async (): Promise<OperationRecord[]> => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      return JSON.parse(data);
    } catch {
      return [];
    }
  };

  const saveRecords = async (records: OperationRecord[]) => {
    await fs.writeFile(DATA_FILE, JSON.stringify(records, null, 2), "utf-8");
  };

  // ----------------------------------------------------
  // API Routes
  // ----------------------------------------------------

  // 1. Get all current operations
  app.get("/api/data", async (req, res) => {
    const records = await loadRecords();
    res.json(records);
  });

  // 2. Clear operations
  app.post("/api/data/clear", async (req, res) => {
    await saveRecords([]);
    res.json({ message: "Database cleared." });
  });

  // 3. Set Operations manually (directly from Frontend App Context)
  app.post("/api/data", async (req, res) => {
    const records: OperationRecord[] = req.body;
    if (Array.isArray(records)) {
      await saveRecords(records);
      res.json({ message: "Records updated." });
    } else {
      res.status(400).json({ error: "Invalid array of records." });
    }
  });

  // 4. RPA Bot Endpoint: Upload CSV file 
  // It handles generic logic assuming the CSV is Externa or Abastecimento
  app.post("/api/upload-csv", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded. Form field should be 'file'." });
    }

    try {
      const csvString = req.file.buffer.toString("utf-8");
      
      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        complete: async (results) => {
          const rawData = results.data as any[];
          const { records: newProcessed } = processRawData(rawData);

          const existingRecords = await loadRecords();
          const combined = [...existingRecords, ...newProcessed];
          await saveRecords(combined);
          res.json({
            message: "Success",
            added: newProcessed.length,
            total: combined.length
          });
        },
        error: (err: any) => {
          res.status(500).json({ error: "Error parsing CSV", details: err });
        }
      });
    } catch (e: any) {
      res.status(500).json({ error: "Server error during upload processing", details: e.message });
    }
  });
  // ----------------------------------------------------
  // Vite Middleware & Static Serving 
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

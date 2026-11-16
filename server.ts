import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

const FALLBACK_FX_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 152.4,
  CAD: 1.39,
  AUD: 1.52,
  INR: 84.1,
  CHF: 0.88,
};

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/fx-rates", async (_req: Request, res: Response) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      const upstream = await fetch("https://open.er-api.com/v6/latest/USD", {
        signal: controller.signal,
      });
      if (!upstream.ok) {
        throw new Error(`FX upstream responded with ${upstream.status}`);
      }
      const data = (await upstream.json()) as {
        rates?: Record<string, number>;
        time_last_update_utc?: string;
      };
      const rates: Record<string, number> = { USD: 1.0 };
      for (const code of Object.keys(FALLBACK_FX_RATES)) {
        if (code === "USD") continue;
        const val = Number(data?.rates?.[code]);
        rates[code] =
          Number.isFinite(val) && val > 0
            ? Number(val.toFixed(4))
            : FALLBACK_FX_RATES[code];
      }
      return res.json({
        source: "live",
        updatedAt: data?.time_last_update_utc || new Date().toISOString(),
        rates,
      });
    } catch {
      return res.json({
        source: "fallback",
        updatedAt: new Date().toISOString(),
        rates: FALLBACK_FX_RATES,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== "true",
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      const indexFile = path.join(distPath, "index.html");
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send("Application build not found.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`WealthWise server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

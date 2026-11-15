import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";

interface ExpenseItem {
  id?: string | number;
  amount?: number | string;
  category?: string;
  date?: string;
  description?: string;
  stream?: string;
}

interface BudgetItem {
  category?: string;
  budgetAmount?: number | string;
}

interface GoalItem {
  goal?: string;
  target_amount?: number | string;
  saved_amount?: number | string;
  targetDate?: string;
}

interface IncomeConfig {
  monthlyIncomeUSD?: number;
  needsPct?: number;
  wantsPct?: number;
  wealthPct?: number;
}

interface FinancialInsightsRequestBody {
  expenses?: ExpenseItem[];
  budgets?: BudgetItem[];
  goals?: GoalItem[];
  incomeConfig?: IncomeConfig;
  currency?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 25000,
      headers: { "User-Agent": "aistudio-build" },
    },
  });
}

function buildFinancialSnapshot(body: FinancialInsightsRequestBody) {
  const expenses = Array.isArray(body.expenses) ? body.expenses : [];
  const budgets = Array.isArray(body.budgets) ? body.budgets : [];
  const goals = Array.isArray(body.goals) ? body.goals : [];
  const incomeConfig = body.incomeConfig || {};
  const monthlyIncomeUSD = Number(incomeConfig.monthlyIncomeUSD) || 6500;

  let totalSpendUSD = 0;
  const categoryTotals = new Map<string, { totalUSD: number; count: number }>();
  const monthlyTotals = new Map<string, number>();
  const monthlyCategoryTotals = new Map<string, Map<string, number>>();

  for (const item of expenses) {
    const amount = Number(item.amount) || 0;
    if (amount <= 0) continue;
    const category = (item.category || "Other").trim() || "Other";
    const monthKey =
      typeof item.date === "string" && item.date.length >= 7
        ? item.date.slice(0, 7)
        : "Unknown";

    totalSpendUSD += amount;

    const catEntry = categoryTotals.get(category) || { totalUSD: 0, count: 0 };
    catEntry.totalUSD += amount;
    catEntry.count += 1;
    categoryTotals.set(category, catEntry);

    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + amount);

    if (!monthlyCategoryTotals.has(monthKey)) {
      monthlyCategoryTotals.set(monthKey, new Map());
    }
    const monthCatMap = monthlyCategoryTotals.get(monthKey)!;
    const catKey = category.toLowerCase();
    monthCatMap.set(catKey, (monthCatMap.get(catKey) || 0) + amount);
  }

  const sortedMonths = Array.from(monthlyTotals.keys())
    .filter((m) => m !== "Unknown")
    .sort();
  const latestMonth = sortedMonths[sortedMonths.length - 1] || null;
  const latestMonthSpendUSD = latestMonth
    ? monthlyTotals.get(latestMonth) || 0
    : 0;
  const activeMonthCount = Math.max(sortedMonths.length, 1);
  const averageMonthlySpendUSD = totalSpendUSD / activeMonthCount;

  const topCategories = Array.from(categoryTotals.entries())
    .map(([category, stats]) => ({
      category,
      totalUSD: Math.round(stats.totalUSD * 100) / 100,
      monthlyAvgUSD: Math.round((stats.totalUSD / activeMonthCount) * 100) / 100,
      transactions: stats.count,
      sharePct:
        totalSpendUSD > 0
          ? Math.round((stats.totalUSD / totalSpendUSD) * 1000) / 10
          : 0,
    }))
    .sort((a, b) => b.totalUSD - a.totalUSD);

  const latestMonthCatMap = latestMonth
    ? monthlyCategoryTotals.get(latestMonth) || new Map()
    : new Map();

  const budgetHealth = budgets.map((b) => {
    const category = (b.category || "Other").trim();
    const limitUSD = Number(b.budgetAmount) || 0;
    const spentLatestMonthUSD =
      latestMonthCatMap.get(category.toLowerCase()) || 0;
    const utilizationPct =
      limitUSD > 0 ? Math.round((spentLatestMonthUSD / limitUSD) * 100) : 0;
    return {
      category,
      limitUSD: Math.round(limitUSD * 100) / 100,
      spentLatestMonthUSD: Math.round(spentLatestMonthUSD * 100) / 100,
      utilizationPct,
    };
  });

  const savingsVaults = goals.map((g) => {
    const targetUSD = Number(g.target_amount) || 0;
    const savedUSD = Number(g.saved_amount) || 0;
    return {
      goal: (g.goal || "Savings Goal").trim(),
      savedUSD: Math.round(savedUSD * 100) / 100,
      targetUSD: Math.round(targetUSD * 100) / 100,
      progressPct:
        targetUSD > 0 ? Math.round((savedUSD / targetUSD) * 100) : 0,
      targetDate: g.targetDate || "Flexible",
    };
  });

  const recentExpenses = [...expenses]
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, 20)
    .map((e) => ({
      date: e.date || "",
      category: e.category || "Other",
      description: (e.description || "").slice(0, 80),
      amountUSD: Math.round((Number(e.amount) || 0) * 100) / 100,
    }));

  return {
    displayCurrency: body.currency || "USD",
    monthlyIncomeUSD,
    incomeSplitPct: {
      needs: Number(incomeConfig.needsPct) || 50,
      wants: Number(incomeConfig.wantsPct) || 30,
      wealth: Number(incomeConfig.wealthPct) || 20,
    },
    totalLoggedSpendUSD: Math.round(totalSpendUSD * 100) / 100,
    transactionCount: expenses.length,
    activeMonthsCount: sortedMonths.length,
    latestMonth,
    latestMonthSpendUSD: Math.round(latestMonthSpendUSD * 100) / 100,
    latestMonthSurplusUSD:
      Math.round((monthlyIncomeUSD - latestMonthSpendUSD) * 100) / 100,
    averageMonthlySpendUSD: Math.round(averageMonthlySpendUSD * 100) / 100,
    monthlyTrend: sortedMonths.map((month) => ({
      month,
      spendUSD: Math.round((monthlyTotals.get(month) || 0) * 100) / 100,
    })),
    categoryBreakdown: topCategories,
    budgetHealth,
    savingsVaults,
    recentExpenses,
  };
}

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

  app.post("/api/financial-insights", async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as FinancialInsightsRequestBody;
      const expenses = Array.isArray(body.expenses) ? body.expenses : [];

      if (expenses.length === 0) {
        return res.status(400).json({
          error: "Add at least one expense to generate financial insights.",
        });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return res.status(503).json({
          error:
            "Gemini API key is not configured. Set GEMINI_API_KEY in your environment secrets to enable AI Financial Insights.",
        });
      }

      const snapshot = buildFinancialSnapshot(body);

      const prompt = `Analyze the user's personal finance ledger snapshot below. All numeric amounts in the JSON snapshot are strictly in USD.

FINANCIAL SNAPSHOT (USD):
${JSON.stringify(snapshot, null, 2)}

Instructions:
1. Summarize their overall spending habits, monthly cash-flow surplus/deficit, and budget adherence in 2 crisp sentences. Avoid mentioning raw USD numbers in prose if avoidable or express percentages/ratios so the summary stays natural regardless of display currency (${snapshot.displayCurrency}).
2. Identify 3 to 4 distinct spending habits grounded directly in the category breakdown, monthly trends, budget utilization, or recent transactions.
3. Recommend 3 concrete, realistic savings opportunities with realistic monthly USD savings estimates (monthlySavingsUSD) based on their actual spending levels and budget overages. Set estimatedMonthlySavingsUSD to the sum of the 3 monthlySavingsUSD values.`;

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a disciplined personal wealth analyst for WealthWise. Deliver factual, concise, practical insights based strictly on the provided ledger numbers. Never invent transactions or categories not present in the snapshot.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description:
                  "Concise 2-sentence executive summary of spending habits and cash flow health.",
              },
              healthStatus: {
                type: Type.STRING,
                description:
                  "Short status label: 'Strong', 'Balanced', or 'Watch Spending'.",
              },
              estimatedMonthlySavingsUSD: {
                type: Type.NUMBER,
                description:
                  "Total realistic monthly savings potential in USD across the opportunities.",
              },
              spendingHabits: {
                type: Type.ARRAY,
                description:
                  "3 to 4 concise observations about spending habits and budget adherence.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    detail: { type: Type.STRING },
                    category: { type: Type.STRING },
                  },
                  required: ["title", "detail", "category"],
                },
              },
              savingsOpportunities: {
                type: Type.ARRAY,
                description:
                  "3 actionable savings recommendations with realistic monthly USD impact.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    action: { type: Type.STRING },
                    monthlySavingsUSD: { type: Type.NUMBER },
                    targetCategory: { type: Type.STRING },
                  },
                  required: [
                    "title",
                    "action",
                    "monthlySavingsUSD",
                    "targetCategory",
                  ],
                },
              },
            },
            required: [
              "summary",
              "healthStatus",
              "estimatedMonthlySavingsUSD",
              "spendingHabits",
              "savingsOpportunities",
            ],
          },
        },
      });

      const rawText = response.text;
      if (!rawText) {
        return res.status(502).json({
          error: "Received an empty response from the AI insights service.",
        });
      }

      const parsed = JSON.parse(rawText);
      return res.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
      });
    } catch (error: unknown) {
      const err = error as { status?: number; message?: string };
      const status = typeof err?.status === "number" ? err.status : 500;
      if (status === 429) {
        return res.status(429).json({
          error:
            "AI analysis rate limit reached. Please wait a moment and try again.",
        });
      }
      if (status === 401 || status === 403) {
        return res.status(status).json({
          error:
            "Unable to authenticate with Gemini API. Check GEMINI_API_KEY configuration.",
        });
      }
      return res.status(status >= 400 && status < 600 ? status : 500).json({
        error:
          err?.message ||
          "Failed to generate financial insights. Please try again.",
      });
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

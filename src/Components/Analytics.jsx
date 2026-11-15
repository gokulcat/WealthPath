import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  TrendingUp,
  ArrowLeftRight,
  Sparkles,
  Globe2,
  Target,
  Wallet,
} from "lucide-react";
import {
  CURRENCIES,
  formatCurrency,
  getCategoryStream,
} from "../utils/currency";

function formatMonthLabel(monthKey) {
  if (!monthKey) return "Current Month";
  const [year, month] = monthKey.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(dateObj.getTime())) return monthKey;
  return dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function ProjectionTooltip({ active, payload, label, currentCurrency }) {
  if (!active || !payload || payload.length === 0) return null;
  const projected = payload.find((p) => p.dataKey === "projected")?.value || 0;
  const baseline = payload.find((p) => p.dataKey === "baseline")?.value || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[185px]">
      <p className="font-semibold text-[#0b1c30] mb-1.5">{label}</p>
      <div className="flex justify-between gap-4 text-[#006948] font-semibold">
        <span>With APY Growth</span>
        <span className="font-mono tabular-nums">
          {formatCurrency(projected, currentCurrency, { showCents: false })}
        </span>
      </div>
      <div className="flex justify-between gap-4 text-slate-500 mt-1">
        <span>Principal Only</span>
        <span className="font-mono tabular-nums">
          {formatCurrency(baseline, currentCurrency, { showCents: false })}
        </span>
      </div>
    </div>
  );
}

function Analytics({
  expenses = [],
  budgets = [],
  goals = [],
  incomeConfig,
  currentCurrency = "USD",
  onCurrencyChange,
  apyRate = 4.85,
  onOpenFXModal,
}) {
  const [horizon, setHorizon] = useState("1y");

  const monthlyIncomeUSD = incomeConfig?.monthlyIncomeUSD || 6500;
  const wantsPctTarget = incomeConfig?.split?.wants ?? 30;
  const wantsCapUSD = (monthlyIncomeUSD * wantsPctTarget) / 100;

  const latestMonth = useMemo(() => {
    const months = Array.from(
      new Set(expenses.map((e) => (e.date || "").slice(0, 7)).filter(Boolean))
    ).sort();
    return months[months.length - 1] || new Date().toISOString().slice(0, 7);
  }, [expenses]);

  const totalVaultSavedUSD = goals.reduce(
    (sum, g) => sum + (parseFloat(g.saved_amount) || 0),
    0
  );
  const monthlyVaultAutoUSD = goals.reduce(
    (sum, g) => sum + (parseFloat(g.monthlyAuto) || 0),
    0
  );
  const monthlyContributionUSD = Math.max(
    monthlyVaultAutoUSD,
    Math.round(monthlyIncomeUSD * ((incomeConfig?.split?.wealth ?? 20) / 100))
  );

  const projectionData = useMemo(() => {
    const monthsCount = horizon === "6m" ? 6 : horizon === "5y" ? 60 : 12;
    const step = horizon === "5y" ? 6 : 1;
    const monthlyRate = (apyRate || 4.85) / 100 / 12;
    const points = [];
    let balance = totalVaultSavedUSD;
    let baseline = totalVaultSavedUSD;

    for (let m = 0; m <= monthsCount; m++) {
      if (m % step === 0 || m === monthsCount) {
        points.push({
          label:
            m === 0
              ? "Now"
              : horizon === "5y"
              ? `Yr ${(m / 12).toFixed(1)}`
              : `Mo ${m}`,
          projected: Math.round(balance),
          baseline: Math.round(baseline),
        });
      }
      balance = balance * (1 + monthlyRate) + monthlyContributionUSD;
      baseline = baseline + monthlyContributionUSD;
    }
    return points;
  }, [horizon, totalVaultSavedUSD, monthlyContributionUSD, apyRate]);

  const projectionFinal = projectionData[projectionData.length - 1] || {
    projected: totalVaultSavedUSD,
    baseline: totalVaultSavedUSD,
  };
  const projectedYieldGainUSD = Math.max(
    0,
    projectionFinal.projected - projectionFinal.baseline
  );

  const latestMonthWantsUSD = useMemo(() => {
    const budgetStreamMap = new Map();
    budgets.forEach((b) => {
      budgetStreamMap.set(
        b.category.trim().toLowerCase(),
        getCategoryStream(b.category, b.stream)
      );
    });
    let total = 0;
    expenses.forEach((item) => {
      if ((item.date || "").slice(0, 7) === latestMonth) {
        const key = (item.category || "Other").trim().toLowerCase();
        const stream = getCategoryStream(item.category, budgetStreamMap.get(key));
        if (stream === "Lifestyle & Wants") {
          total += parseFloat(item.amount) || 0;
        }
      }
    });
    return total;
  }, [expenses, budgets, latestMonth]);

  const wantsVarianceUSD = wantsCapUSD - latestMonthWantsUSD;
  const wantsUsagePct =
    wantsCapUSD > 0 ? Math.round((latestMonthWantsUSD / wantsCapUSD) * 100) : 0;

  const vaultBenchmarks = useMemo(() => {
    return goals.map((g) => {
      const target = parseFloat(g.target_amount) || 0;
      const saved = parseFloat(g.saved_amount) || 0;
      const pct = target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0;
      const statusLabel =
        pct >= 90 ? "Almost Done" : pct >= 55 ? "Ahead" : "On Track";
      const statusClass =
        pct >= 90
          ? "text-[#006948]"
          : pct >= 55
          ? "text-emerald-700"
          : "text-slate-600";
      return {
        ...g,
        target,
        saved,
        pct,
        statusLabel,
        statusClass,
      };
    });
  }, [goals]);

  const hedgedVaults = useMemo(
    () =>
      goals.filter((g) =>
        Boolean(g.foreignCurrency && CURRENCIES[g.foreignCurrency])
      ),
    [goals]
  );

  return (
    <div className="flex-1 bg-[#f8f9ff] py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Page Header + Inline 8-Currency Quick Pills */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0b1c30]">
              Wealth Analytics &amp; Projections
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Multi-horizon compounding growth, vault velocity benchmarks, and
              FX hedging performance in {currentCurrency}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onCurrencyChange && (
              <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200">
                {Object.keys(CURRENCIES).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onCurrencyChange(code)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                      currentCurrency === code
                        ? "bg-[#006948] text-white"
                        : "text-slate-600 hover:text-[#0b1c30]"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}

            {onOpenFXModal && (
              <button
                type="button"
                onClick={onOpenFXModal}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0b1c30] bg-white border border-slate-200 hover:bg-[#eff4ff] rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#006948]" />
                <span>FX Matrix</span>
              </button>
            )}
          </div>
        </div>

        {/* Top 4 KPI Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Current Vault Reserve
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {formatCurrency(totalVaultSavedUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Across {goals.length} active savings vaults
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Monthly Compounding Pace
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#006948]">
              {formatCurrency(monthlyContributionUSD, currentCurrency, {
                showCents: false,
              })}
              <span className="text-xs font-normal text-slate-400"> / mo</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              {apyRate}% APY target yield
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-medium text-slate-500">
              Projected Balance (
              {horizon === "6m" ? "6M" : horizon === "5y" ? "5Y" : "1Y"})
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#0b1c30]">
              {formatCurrency(projectionFinal.projected, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
              Principal:{" "}
              {formatCurrency(projectionFinal.baseline, currentCurrency, {
                showCents: false,
              })}
            </p>
          </div>

          <div className="bg-[#006948] text-white rounded-xl p-5">
            <p className="text-xs font-medium text-emerald-100">
              Compounded Yield Bonus
            </p>
            <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-white">
              +
              {formatCurrency(projectedYieldGainUSD, currentCurrency, {
                showCents: false,
              })}
            </p>
            <p className="mt-1 text-xs text-[#85f8c4]">
              Earned over {horizon === "6m" ? "6 months" : horizon === "5y" ? "5 years" : "1 year"}
            </p>
          </div>
        </div>

        {/* Main Compounding Projection AreaChart */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-[#eff4ff] text-[#006948] shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#0b1c30]">
                  Cumulative Vault &amp; Compounding Projection
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Comparing linear principal deposits vs. {apyRate}% APY
                  compounded wealth trajectory
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1 p-1 bg-[#eff4ff] rounded-lg border border-slate-200 self-start sm:self-auto">
              {[
                { id: "6m", label: "6 Months" },
                { id: "1y", label: "1 Year" },
                { id: "5y", label: "5 Years" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setHorizon(opt.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    horizon === opt.id
                      ? "bg-[#0b1c30] text-white"
                      : "text-slate-600 hover:text-[#0b1c30]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={projectionData}
                margin={{ top: 10, right: 16, left: 0, bottom: 4 }}
              >
                <defs>
                  <linearGradient
                    id="analyticsVaultFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#006948" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#006948" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eff4ff"
                />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#e2e8f0" }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(val) =>
                    formatCurrency(val, currentCurrency, {
                      showCents: false,
                      compact: true,
                    })
                  }
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={62}
                />
                <Tooltip
                  content={
                    <ProjectionTooltip currentCurrency={currentCurrency} />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="baseline"
                  stroke="#64748b"
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  fill="none"
                  name="Principal Only"
                />
                <Area
                  type="monotone"
                  dataKey="projected"
                  stroke="#006948"
                  strokeWidth={3}
                  fill="url(#analyticsVaultFill)"
                  name="With APY Growth"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vault Velocity Benchmarks + Active FX Hedging Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#0b1c30]">
                  Vault Velocity Benchmarks
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time funding pace across all active savings vaults
                </p>
              </div>
              <Link
                to="/goals"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#006948] hover:underline whitespace-nowrap"
              >
                <Target className="w-3.5 h-3.5" />
                <span>Manage Vaults</span>
              </Link>
            </div>

            <div className="space-y-3.5">
              {vaultBenchmarks.map((v, idx) => (
                <div key={`${v.goal}-${idx}`} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-semibold text-[#0b1c30] truncate">
                      {v.goal}
                    </span>
                    <span className="flex items-center gap-2 font-mono tabular-nums shrink-0">
                      <span className={`font-semibold ${v.statusClass}`}>
                        {v.statusLabel}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-bold text-[#0b1c30]">{v.pct}%</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#006948] rounded-full transition-all duration-300"
                      style={{ width: `${v.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Smart Allocation Insight */}
            <div className="rounded-xl bg-[#0b1c30] text-white p-4 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-[#85f8c4] shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-[#85f8c4]">
                  Smart Allocation Insight
                </p>
                <p className="mt-1 text-slate-200">
                  {wantsVarianceUSD >= 0 ? (
                    <>
                      Your Lifestyle &amp; Wants spend in{" "}
                      {formatMonthLabel(latestMonth)} is{" "}
                      <span className="font-mono tabular-nums font-semibold text-white">
                        {formatCurrency(wantsVarianceUSD, currentCurrency, {
                          showCents: false,
                        })}
                      </span>{" "}
                      under your {wantsPctTarget}% cap ({wantsUsagePct}% used) —
                      eligible to sweep directly into high-yield vaults at{" "}
                      {apyRate}% APY.
                    </>
                  ) : (
                    <>
                      Your Lifestyle &amp; Wants spend exceeded your{" "}
                      {wantsPctTarget}% target by{" "}
                      <span className="font-mono tabular-nums font-semibold text-white">
                        {formatCurrency(
                          Math.abs(wantsVarianceUSD),
                          currentCurrency,
                          { showCents: false }
                        )}
                      </span>
                      . Adjust discretionary budgets in Budgets &amp; Streams to
                      restore surplus velocity.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0b1c30]">
                    Active FX Hedging Performance
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dual-currency vault reserves &amp; spot settlement pairs
                  </p>
                </div>
                <Globe2 className="w-5 h-5 text-[#006948] shrink-0" />
              </div>

              {hedgedVaults.length > 0 ? (
                <div className="space-y-3">
                  {hedgedVaults.map((hv, idx) => {
                    const fx = CURRENCIES[hv.foreignCurrency];
                    const pct =
                      hv.foreignTargetAmount > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (hv.foreignCurrentAmount /
                                hv.foreignTargetAmount) *
                                100
                            )
                          )
                        : 0;
                    return (
                      <div
                        key={`${hv.goal}-fx-${idx}`}
                        className="rounded-xl bg-[#eff4ff]/70 border border-slate-200 p-4 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-[#0b1c30]">
                            {hv.goal}
                          </span>
                          <span className="text-xs font-mono font-semibold text-[#006948]">
                            USD → {hv.foreignCurrency}
                          </span>
                        </div>
                        <p className="text-sm font-bold font-mono tabular-nums text-[#0b1c30]">
                          {fx.symbol}
                          {Number(hv.foreignCurrentAmount || 0).toLocaleString(
                            "en-US"
                          )}{" "}
                          <span className="text-xs font-normal text-slate-500">
                            / {fx.symbol}
                            {Number(hv.foreignTargetAmount || 0).toLocaleString(
                              "en-US"
                            )}{" "}
                            {hv.foreignCurrency}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                          USD Reserve:{" "}
                          {formatCurrency(hv.saved_amount, currentCurrency, {
                            showCents: false,
                          })}{" "}
                          · {pct}% hedged at 1 USD = {fx.rateAgainstUSD}{" "}
                          {hv.foreignCurrency}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl bg-[#eff4ff]/70 border border-slate-200 p-4 text-xs text-slate-600">
                  No foreign-hedged vaults active yet. Enable FX Hedge on any
                  goal in Goals to lock target currency reserves.
                </div>
              )}

              <div className="rounded-xl bg-[#eff4ff]/60 border border-slate-200 p-4 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0b1c30] block">
                    EUR / USD Settlement Corridor
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Guaranteed 0.05% interbank spread
                  </span>
                </div>
                <span className="text-xs font-semibold text-[#006948]">
                  Protected
                </span>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Active Settlement Currency
                  </span>
                  <span className="font-mono font-bold text-[#0b1c30]">
                    {currentCurrency} ({CURRENCIES[currentCurrency]?.symbol})
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Monthly Auto-Contribution
                  </span>
                  <span className="font-mono font-semibold text-[#006948] tabular-nums">
                    {formatCurrency(monthlyContributionUSD, currentCurrency, {
                      showCents: false,
                    })}
                    /mo
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              {onOpenFXModal && (
                <button
                  type="button"
                  onClick={onOpenFXModal}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0b1c30] bg-[#eff4ff] hover:bg-[#dce9ff] rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#006948]" />
                  <span>FX Spot Matrix</span>
                </button>
              )}
              <Link
                to="/planner"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#006948] hover:bg-[#00855d] rounded-lg transition-colors"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Adjust Salary Split</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;

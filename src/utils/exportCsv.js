import { convertAmount, CURRENCIES, getCategoryStream } from "./currency";

function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatMonthName(monthKey) {
  const [year, month] = monthKey.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(dateObj.getTime())) return monthKey;
  return dateObj.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function exportExpensesAndAnalyticsCSV(
  expenses = [],
  budgets = [],
  selectedMonth = "",
  currencyCode = "USD",
  options = {}
) {
  const decimals = currencyCode === "JPY" ? 0 : 2;
  const formatVal = (usd) => convertAmount(usd, currencyCode).toFixed(decimals);
  const currencyObj = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const currencyName = currencyObj.code;
  const fxRate = currencyObj.rateAgainstUSD;
  const monthlyIncomeUSD = Number(options.monthlyIncomeUSD) || 0;
  const goals = Array.isArray(options.goals) ? options.goals : [];

  const totalSpent = expenses.reduce(
    (sum, item) => sum + (parseFloat(item.amount) || 0),
    0
  );

  const categoryTotals = new Map();
  const monthTotals = new Map();
  const selectedMonthCategoryTotals = new Map();

  expenses.forEach((item) => {
    const amount = parseFloat(item.amount) || 0;
    const category = (item.category || "Other").trim();
    const monthKey = (item.date || "").slice(0, 7) || "Unknown";

    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
    monthTotals.set(monthKey, (monthTotals.get(monthKey) || 0) + amount);

    if (!selectedMonth || monthKey === selectedMonth) {
      selectedMonthCategoryTotals.set(
        category,
        (selectedMonthCategoryTotals.get(category) || 0) + amount
      );
    }
  });

  const budgetMap = new Map(
    budgets.map((b) => [
      (b.category || "").trim().toLowerCase(),
      parseFloat(b.budgetAmount) || 0,
    ])
  );

  const totalBudgetUSD = budgets.reduce(
    (sum, b) => sum + (parseFloat(b.budgetAmount) || 0),
    0
  );

  const lines = [];

  lines.push("WealthWise Comprehensive Financial Report");
  lines.push(`Generated At,${escapeCsvCell(new Date().toISOString())}`);
  lines.push(`Active Currency,${currencyName} (${currencyObj.symbol})`);
  lines.push(`Exchange Rate (1 USD),${fxRate} ${currencyName}`);
  if (monthlyIncomeUSD > 0) {
    lines.push(
      `Monthly Income Target (${currencyName}),${formatVal(monthlyIncomeUSD)}`
    );
  }
  if (totalBudgetUSD > 0) {
    lines.push(
      `Total Monthly Budget Cap (${currencyName}),${formatVal(totalBudgetUSD)}`
    );
  }
  lines.push(`Total Logged Expenses (${currencyName}),${formatVal(totalSpent)}`);
  if (selectedMonth) {
    lines.push(
      `Selected Budget Month,${escapeCsvCell(formatMonthName(selectedMonth))}`
    );
  }
  lines.push("");

  lines.push("EXPENSE HISTORY");
  lines.push(
    `Date,Category,Stream,Note,Amount (${currencyName}),Base Amount (USD)`
  );
  const sortedExpenses = [...expenses].sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );
  sortedExpenses.forEach((item) => {
    const amountUSD = parseFloat(item.amount) || 0;
    lines.push(
      [
        escapeCsvCell(item.date || ""),
        escapeCsvCell(item.category || ""),
        escapeCsvCell(getCategoryStream(item.category)),
        escapeCsvCell(item.note || item.description || ""),
        formatVal(amountUSD),
        amountUSD.toFixed(2),
      ].join(",")
    );
  });
  lines.push("");

  lines.push("CATEGORY ANALYTICS & BUDGET VARIANCE");
  lines.push(
    `Category,Total Spent (${currencyName}),Share (%),Monthly Budget Limit (${currencyName}),Selected Month Spent (${currencyName}),Remaining (${currencyName}),Budget Used (%)`
  );
  Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, sum]) => {
      const share = totalSpent > 0 ? ((sum / totalSpent) * 100).toFixed(1) : "0.0";
      const limit = budgetMap.get(category.toLowerCase());
      const monthSpend = selectedMonthCategoryTotals.get(category) || 0;
      const remaining = limit !== undefined ? limit - monthSpend : null;
      const usedPct =
        limit && limit > 0 ? ((monthSpend / limit) * 100).toFixed(1) : "N/A";
      lines.push(
        [
          escapeCsvCell(category),
          formatVal(sum),
          `${share}%`,
          limit !== undefined ? formatVal(limit) : "Not set",
          formatVal(monthSpend),
          remaining !== null ? formatVal(remaining) : "N/A",
          usedPct === "N/A" ? "N/A" : `${usedPct}%`,
        ].join(",")
      );
    });
  lines.push("");

  lines.push("MONTHLY CASH-FLOW TRENDS");
  if (monthlyIncomeUSD > 0) {
    lines.push(
      `Month,Income (${currencyName}),Total Spent (${currencyName}),Net Surplus (${currencyName}),Savings Rate (%)`
    );
  } else {
    lines.push(`Month,Total Spent (${currencyName})`);
  }
  Array.from(monthTotals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([monthKey, sum]) => {
      if (monthlyIncomeUSD > 0) {
        const surplus = monthlyIncomeUSD - sum;
        const savingsRate = ((surplus / monthlyIncomeUSD) * 100).toFixed(1);
        lines.push(
          [
            escapeCsvCell(formatMonthName(monthKey)),
            formatVal(monthlyIncomeUSD),
            formatVal(sum),
            formatVal(surplus),
            `${savingsRate}%`,
          ].join(",")
        );
      } else {
        lines.push(
          [escapeCsvCell(formatMonthName(monthKey)), formatVal(sum)].join(",")
        );
      }
    });

  if (goals.length > 0) {
    lines.push("");
    lines.push("SAVINGS VAULTS & GOALS");
    lines.push(
      `Goal,Category Tag,Target Date,Saved (${currencyName}),Target (${currencyName}),Monthly Auto (${currencyName}),Progress (%)`
    );
    goals.forEach((g) => {
      const saved = parseFloat(g.saved_amount) || 0;
      const target = parseFloat(g.target_amount) || 0;
      const auto = parseFloat(g.monthlyAuto) || 0;
      const pct = target > 0 ? ((saved / target) * 100).toFixed(1) : "0.0";
      lines.push(
        [
          escapeCsvCell(g.goal || ""),
          escapeCsvCell(g.categoryTag || ""),
          escapeCsvCell(g.targetDate || "Flexible"),
          formatVal(saved),
          formatVal(target),
          formatVal(auto),
          `${pct}%`,
        ].join(",")
      );
    });
  }

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute(
    "download",
    `wealthwise-financial-report-${currencyName.toLowerCase()}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

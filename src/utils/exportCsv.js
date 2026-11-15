import { convertAmount, CURRENCIES } from "./currency";

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
  currencyCode = "USD"
) {
  const decimals = currencyCode === "JPY" ? 0 : 2;
  const formatVal = (usd) => convertAmount(usd, currencyCode).toFixed(decimals);
  const currencyName = CURRENCIES[currencyCode]?.code || "USD";

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

  const lines = [];

  lines.push("WealthWise Expense History & Analytics Report");
  lines.push(`Generated At,${escapeCsvCell(new Date().toISOString())}`);
  lines.push(`Currency,${currencyName}`);
  lines.push(`Total Expenses (${currencyName}),${formatVal(totalSpent)}`);
  if (selectedMonth) {
    lines.push(
      `Selected Budget Month,${escapeCsvCell(formatMonthName(selectedMonth))}`
    );
  }
  lines.push("");

  lines.push("EXPENSE HISTORY");
  lines.push(`Date,Category,Note,Amount (${currencyName})`);
  const sortedExpenses = [...expenses].sort((a, b) =>
    (b.date || "").localeCompare(a.date || "")
  );
  sortedExpenses.forEach((item) => {
    lines.push(
      [
        escapeCsvCell(item.date || ""),
        escapeCsvCell(item.category || ""),
        escapeCsvCell(item.note || item.description || ""),
        formatVal(parseFloat(item.amount) || 0),
      ].join(",")
    );
  });
  lines.push("");

  lines.push("CATEGORY ANALYTICS");
  lines.push(
    `Category,Total Spent (${currencyName}),Share (%),Monthly Budget Limit (${currencyName}),Selected Month Spent (${currencyName}),Budget Used (%)`
  );
  Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([category, sum]) => {
      const share = totalSpent > 0 ? ((sum / totalSpent) * 100).toFixed(1) : "0.0";
      const limit = budgetMap.get(category.toLowerCase());
      const monthSpend = selectedMonthCategoryTotals.get(category) || 0;
      const usedPct =
        limit && limit > 0 ? ((monthSpend / limit) * 100).toFixed(1) : "N/A";
      lines.push(
        [
          escapeCsvCell(category),
          formatVal(sum),
          `${share}%`,
          limit !== undefined ? formatVal(limit) : "Not set",
          formatVal(monthSpend),
          usedPct === "N/A" ? "N/A" : `${usedPct}%`,
        ].join(",")
      );
    });
  lines.push("");

  lines.push("MONTHLY SPENDING TRENDS");
  lines.push(`Month,Total Spent (${currencyName})`);
  Array.from(monthTotals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .forEach(([monthKey, sum]) => {
      lines.push(
        [escapeCsvCell(formatMonthName(monthKey)), formatVal(sum)].join(",")
      );
    });

  const csvContent = lines.join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "wealthwise-expense-report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

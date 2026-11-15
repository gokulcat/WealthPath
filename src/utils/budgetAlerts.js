import { formatCurrency } from "./currency";

export function formatAlertMonth(monthKey) {
  if (!monthKey || monthKey === "Unknown") return "Current Month";
  const [year, month] = monthKey.split("-");
  const dateObj = new Date(Number(year), Number(month) - 1, 1);
  if (Number.isNaN(dateObj.getTime())) return monthKey;
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

export function getMonthCategorySpendUSD(expenses, category, monthKey) {
  const targetCat = (category || "").trim().toLowerCase();
  if (!targetCat || !monthKey) return 0;

  return expenses.reduce((sum, item) => {
    const itemCat = (item.category || "").trim().toLowerCase();
    const itemMonth = (item.date || "").slice(0, 7);
    if (itemCat === targetCat && itemMonth === monthKey) {
      return sum + (parseFloat(item.amount) || 0);
    }
    return sum;
  }, 0);
}

/**
 * Evaluates all defined category budgets across every month present in expenses
 * (or the current month if no expenses exist) and returns active alerts
 * where spend >= thresholdPct or >= 100%.
 */
export function evaluateBudgetAlerts(
  expenses = [],
  budgets = [],
  thresholdPct = 80
) {
  if (!Array.isArray(budgets) || budgets.length === 0) return [];

  const monthsSet = new Set(
    expenses.map((e) => (e.date || "").slice(0, 7)).filter(Boolean)
  );
  if (monthsSet.size === 0) {
    monthsSet.add(new Date().toISOString().slice(0, 7));
  }

  const alerts = [];

  monthsSet.forEach((monthKey) => {
    budgets.forEach((budget) => {
      const limitUSD = parseFloat(budget.budgetAmount) || 0;
      if (limitUSD <= 0) return;

      const spentUSD = getMonthCategorySpendUSD(
        expenses,
        budget.category,
        monthKey
      );
      if (spentUSD <= 0) return;

      const pct = Math.round((spentUSD / limitUSD) * 100);
      if (pct >= thresholdPct) {
        const severity = pct >= 100 ? "exceeded" : "approaching";
        alerts.push({
          id: `${monthKey}::${budget.category.trim().toLowerCase()}`,
          category: budget.category,
          stream: budget.stream,
          monthKey,
          monthLabel: formatAlertMonth(monthKey),
          spentUSD,
          limitUSD,
          remainingUSD: limitUSD - spentUSD,
          pct,
          severity,
        });
      }
    });
  });

  return alerts.sort((a, b) => {
    if (a.monthKey !== b.monthKey) {
      return b.monthKey.localeCompare(a.monthKey);
    }
    if (a.severity !== b.severity) {
      return a.severity === "exceeded" ? -1 : 1;
    }
    return b.pct - a.pct;
  });
}

/**
 * Evaluates a single category + month against defined budgets after a mutation
 * and returns a toast payload if the category is approaching or exceeding its cap.
 */
export function buildCategoryBudgetAlert({
  expenses = [],
  budgets = [],
  category,
  monthKey,
  thresholdPct = 80,
  previousSpentUSD = null,
}) {
  const normalizedCat = (category || "").trim().toLowerCase();
  if (!normalizedCat || !monthKey) return null;

  const matchingBudget = budgets.find(
    (b) => (b.category || "").trim().toLowerCase() === normalizedCat
  );
  if (!matchingBudget) return null;

  const limitUSD = parseFloat(matchingBudget.budgetAmount) || 0;
  if (limitUSD <= 0) return null;

  const spentUSD = getMonthCategorySpendUSD(
    expenses,
    matchingBudget.category,
    monthKey
  );
  const pct = Math.round((spentUSD / limitUSD) * 100);

  if (pct < thresholdPct) return null;

  const prevPct =
    previousSpentUSD !== null && limitUSD > 0
      ? Math.round((previousSpentUSD / limitUSD) * 100)
      : null;

  const severity = pct >= 100 ? "exceeded" : "approaching";
  const crossedThreshold =
    prevPct === null
      ? true
      : severity === "exceeded"
      ? prevPct < 100 || spentUSD > previousSpentUSD
      : prevPct < thresholdPct || spentUSD > previousSpentUSD;

  if (!crossedThreshold) return null;

  return {
    toastId: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    alertId: `${monthKey}::${normalizedCat}`,
    category: matchingBudget.category,
    stream: matchingBudget.stream,
    monthKey,
    monthLabel: formatAlertMonth(monthKey),
    spentUSD,
    limitUSD,
    remainingUSD: limitUSD - spentUSD,
    pct,
    severity,
    createdAt: Date.now(),
  };
}

export function formatAlertSummaryText(alert, currencyCode = "USD") {
  if (!alert) return "";
  if (alert.severity === "exceeded") {
    const overUSD = Math.abs(alert.remainingUSD);
    return overUSD > 0
      ? `Exceeded ${alert.category} limit for ${alert.monthLabel} by ${formatCurrency(
          overUSD,
          currencyCode
        )} (${alert.pct}% used).`
      : `Reached 100% of your ${alert.category} budget for ${alert.monthLabel}.`;
  }
  return `Approaching ${alert.category} budget for ${alert.monthLabel}: ${alert.pct}% used (${formatCurrency(
    Math.max(0, alert.remainingUSD),
    currencyCode
  )} left).`;
}

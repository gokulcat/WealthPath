export const FREQUENCIES = [
  { value: "weekly", label: "Weekly", description: "Repeats every 7 days" },
  { value: "monthly", label: "Monthly", description: "Repeats every month" },
  { value: "yearly", label: "Yearly", description: "Repeats once a year" },
];

export function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(baseDateStr, daysToAdd) {
  const [y, m, d] = (baseDateStr || getTodayISO()).split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  return dt.toISOString().slice(0, 10);
}

export function advanceDateByFrequency(dateStr, frequency) {
  const [y, m, d] = (dateStr || getTodayISO()).split("-").map(Number);
  if (!y || !m || !d) return getTodayISO();

  if (frequency === "weekly") {
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + 7);
    return dt.toISOString().slice(0, 10);
  }

  if (frequency === "yearly") {
    const targetYear = y + 1;
    const maxDay = new Date(Date.UTC(targetYear, m, 0)).getUTCDate();
    const clampedDay = Math.min(d, maxDay);
    return new Date(Date.UTC(targetYear, m - 1, clampedDay))
      .toISOString()
      .slice(0, 10);
  }

  // Default: monthly
  const nextMonthIndex = m; // 0-indexed next month (since m is 1-12)
  const targetYear = y + Math.floor(nextMonthIndex / 12);
  const targetMonthZero = nextMonthIndex % 12;
  const maxDay = new Date(
    Date.UTC(targetYear, targetMonthZero + 1, 0)
  ).getUTCDate();
  const clampedDay = Math.min(d, maxDay);
  return new Date(Date.UTC(targetYear, targetMonthZero, clampedDay))
    .toISOString()
    .slice(0, 10);
}

export function getMonthlyEquivalentUSD(rule) {
  const amount = parseFloat(rule?.amountUSD) || 0;
  if (rule?.frequency === "weekly") return (amount * 52) / 12;
  if (rule?.frequency === "yearly") return amount / 12;
  return amount;
}

export function getInitialRecurringExpenses() {
  const today = getTodayISO();
  return [
    {
      id: "rec-internet",
      description: "Fiber Internet & Cloud Backup",
      category: "Utilities",
      amountUSD: 75,
      frequency: "monthly",
      startDate: addDaysISO(today, 3),
      nextRunDate: addDaysISO(today, 3),
      lastProcessedDate: null,
      active: true,
    },
    {
      id: "rec-groceries",
      description: "Weekly Fresh Produce Box",
      category: "Food",
      amountUSD: 55,
      frequency: "weekly",
      startDate: addDaysISO(today, 5),
      nextRunDate: addDaysISO(today, 5),
      lastProcessedDate: null,
      active: true,
    },
    {
      id: "rec-insurance",
      description: "Annual Health & Wellness Plan",
      category: "Healthcare",
      amountUSD: 360,
      frequency: "yearly",
      startDate: addDaysISO(today, 18),
      nextRunDate: addDaysISO(today, 18),
      lastProcessedDate: null,
      active: true,
    },
  ];
}

export function processDueRecurringExpenses(
  rules = [],
  existingExpenses = [],
  referenceDateStr = getTodayISO()
) {
  const today = referenceDateStr || getTodayISO();
  const generatedExpenses = [];
  const existingKeys = new Set(
    existingExpenses
      .filter((e) => e.recurringId && e.date)
      .map((e) => `${e.recurringId}::${e.date}`)
  );

  const updatedRules = rules.map((rule) => {
    if (!rule || rule.active === false) return rule;
    let cursorDate = rule.nextRunDate || rule.startDate || today;
    let lastProcessedDate = rule.lastProcessedDate || null;
    let safetyIterations = 0;

    while (cursorDate && cursorDate <= today && safetyIterations < 24) {
      safetyIterations += 1;
      const dedupeKey = `${rule.id}::${cursorDate}`;
      if (!existingKeys.has(dedupeKey)) {
        existingKeys.add(dedupeKey);
        generatedExpenses.push({
          category: rule.category || "Utilities",
          description: rule.description || "Recurring Bill",
          note: `${rule.description || "Recurring Bill"} (${
            rule.frequency || "monthly"
          } auto-bill)`,
          date: cursorDate,
          amount: Number((parseFloat(rule.amountUSD) || 0).toFixed(2)),
          recurringId: rule.id,
          isRecurring: true,
        });
      }
      lastProcessedDate = cursorDate;
      cursorDate = advanceDateByFrequency(cursorDate, rule.frequency);
    }

    if (
      cursorDate !== rule.nextRunDate ||
      lastProcessedDate !== rule.lastProcessedDate
    ) {
      return {
        ...rule,
        nextRunDate: cursorDate,
        lastProcessedDate,
      };
    }
    return rule;
  });

  return {
    generatedExpenses,
    updatedRules,
  };
}

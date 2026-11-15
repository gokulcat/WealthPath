export const DEFAULT_CURRENCIES = {
  USD: { code: "USD", symbol: "$", name: "US Dollar", rateAgainstUSD: 1.0 },
  EUR: { code: "EUR", symbol: "€", name: "Euro", rateAgainstUSD: 0.92 },
  GBP: { code: "GBP", symbol: "£", name: "British Pound", rateAgainstUSD: 0.79 },
  JPY: { code: "JPY", symbol: "¥", name: "Japanese Yen", rateAgainstUSD: 152.4 },
  CAD: { code: "CAD", symbol: "C$", name: "Canadian Dollar", rateAgainstUSD: 1.39 },
  AUD: { code: "AUD", symbol: "A$", name: "Australian Dollar", rateAgainstUSD: 1.52 },
  INR: { code: "INR", symbol: "₹", name: "Indian Rupee", rateAgainstUSD: 84.1 },
  CHF: { code: "CHF", symbol: "Fr", name: "Swiss Franc", rateAgainstUSD: 0.88 },
};

const FX_RATES_STORAGE_KEY = "wealthwise_fx_rates_v1";

function loadInitialCurrencies() {
  const cloned = {};
  Object.entries(DEFAULT_CURRENCIES).forEach(([code, info]) => {
    cloned[code] = { ...info };
  });

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(FX_RATES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          Object.keys(cloned).forEach((code) => {
            if (code === "USD") return;
            const rate = Number(parsed[code]);
            if (Number.isFinite(rate) && rate > 0) {
              cloned[code].rateAgainstUSD = rate;
            }
          });
        }
      }
    } catch {
      // Ignore storage read issues
    }
  }

  return cloned;
}

export const CURRENCIES = loadInitialCurrencies();

export function getExchangeRate(currencyCode = "USD") {
  return CURRENCIES[currencyCode]?.rateAgainstUSD || 1.0;
}

export function setCustomExchangeRates(ratesMap = {}) {
  const next = {};
  Object.keys(DEFAULT_CURRENCIES).forEach((code) => {
    if (code === "USD") {
      CURRENCIES.USD.rateAgainstUSD = 1.0;
      next.USD = 1.0;
      return;
    }
    const candidate = Number(ratesMap[code]);
    const validRate =
      Number.isFinite(candidate) && candidate > 0
        ? Number(candidate.toFixed(4))
        : CURRENCIES[code].rateAgainstUSD;
    CURRENCIES[code].rateAgainstUSD = validRate;
    next[code] = validRate;
  });

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.setItem(FX_RATES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage write issues
    }
  }
  return CURRENCIES;
}

export function resetExchangeRates() {
  Object.entries(DEFAULT_CURRENCIES).forEach(([code, info]) => {
    CURRENCIES[code].rateAgainstUSD = info.rateAgainstUSD;
  });
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      window.localStorage.removeItem(FX_RATES_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  return CURRENCIES;
}

export function convertAmount(amountInUSD, currencyCode = "USD") {
  const rate = CURRENCIES[currencyCode]?.rateAgainstUSD || 1.0;
  return (parseFloat(amountInUSD) || 0) * rate;
}

export function toUSD(amountInCurrency, currencyCode = "USD") {
  const rate = CURRENCIES[currencyCode]?.rateAgainstUSD || 1.0;
  return rate > 0 ? (parseFloat(amountInCurrency) || 0) / rate : 0;
}

export function getCurrencySymbol(currencyCode = "USD") {
  return CURRENCIES[currencyCode]?.symbol || "$";
}

export function formatCurrency(
  amountInUSD,
  currencyCode = "USD",
  options = {}
) {
  const currencyObj = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = (parseFloat(amountInUSD) || 0) * currencyObj.rateAgainstUSD;
  const showCents = options.showCents !== undefined ? options.showCents : true;

  if (options.compact && Math.abs(converted) >= 1000) {
    const sign = converted < 0 ? "-" : "";
    const abs = Math.abs(converted);
    if (abs >= 1000000) {
      return `${sign}${currencyObj.symbol}${(abs / 1000000).toFixed(1)}M`;
    }
    return `${sign}${currencyObj.symbol}${(abs / 1000).toFixed(1)}k`;
  }

  const decimals = currencyCode === "JPY" ? 0 : showCents ? 2 : 0;
  const sign = converted < 0 ? "-" : "";
  return `${sign}${currencyObj.symbol}${Math.abs(converted).toLocaleString(
    "en-US",
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  )}`;
}

export const STREAMS = [
  "Essential Needs",
  "Lifestyle & Wants",
  "Wealth Building",
];

const DEFAULT_STREAM_MAP = {
  food: "Essential Needs",
  groceries: "Essential Needs",
  housing: "Essential Needs",
  rent: "Essential Needs",
  utilities: "Essential Needs",
  healthcare: "Essential Needs",
  transport: "Essential Needs",
  entertainment: "Lifestyle & Wants",
  shopping: "Lifestyle & Wants",
  dining: "Lifestyle & Wants",
  travel: "Lifestyle & Wants",
  subscriptions: "Lifestyle & Wants",
  savings: "Wealth Building",
  investments: "Wealth Building",
  retirement: "Wealth Building",
  wealth: "Wealth Building",
};

export function getCategoryStream(category, explicitStream) {
  if (explicitStream && STREAMS.includes(explicitStream)) {
    return explicitStream;
  }
  const key = (category || "").trim().toLowerCase();
  return DEFAULT_STREAM_MAP[key] || "Lifestyle & Wants";
}

// Currency service for formatting and conversion
export const formatCurrency = (amount, currency = "NGN") => {
  if (!amount || amount === 0) return "₦0.00";

  try {
    // Always format as Naira for Nigerian enterprise
    if (currency === "NGN" || !currency) {
      return `₦${amount.toLocaleString("en-NG", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    // Fallback - always use Naira symbol
    return `₦${amount.toFixed(2)}`;
  }
};

export const getCurrencySymbol = () => {
  // Always return Naira symbol for Nigerian enterprise
  return "₦";
};

// Simple conversion rates (in production, use a real API)
const conversionRates = {
  USD: 1,
  NGN: 750, // Example rate
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110,
};

export const convertCurrency = (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;

  const fromRate = conversionRates[fromCurrency] || 1;
  const toRate = conversionRates[toCurrency] || 1;

  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
};

export const formatMoney = (amount, currency = "NGN") => {
  return formatCurrency(amount, currency);
};

// System base currency
export const BASE_CURRENCY = "NGN";

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
];

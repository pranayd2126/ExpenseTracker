export function formatCurrency(value, region = "en-IN", currencyCode = "INR") {
  try {
    return new Intl.NumberFormat(region || "en-IN", {
      style: "currency",
      currency: (currencyCode || "INR").toUpperCase(),
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);
  } catch {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(Number(value) || 0);
  }
}

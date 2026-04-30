// Static USD -> NGN conversion rate. Update if needed.
export const USD_TO_NGN = 1650;

export type CurrencyMode = "usd" | "ngn" | "both";

export const formatUSD = (amount: number) => `$${amount.toFixed(2)}`;

export const formatNGN = (usdAmount: number) => {
  const naira = Math.round(usdAmount * USD_TO_NGN);
  return `₦${naira.toLocaleString("en-NG")}`;
};

export const formatDualPrice = (usdAmount: number) =>
  `${formatUSD(usdAmount)} / ${formatNGN(usdAmount)}`;

/** Format a USD amount according to the active currency mode. */
export const formatPrice = (usdAmount: number, mode: CurrencyMode = "both") => {
  if (mode === "usd") return formatUSD(usdAmount);
  if (mode === "ngn") return formatNGN(usdAmount);
  return formatDualPrice(usdAmount);
};
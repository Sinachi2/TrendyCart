// Static USD -> NGN conversion rate. Update if needed.
export const USD_TO_NGN = 1650;

export const formatUSD = (amount: number) =>
  `$${amount.toFixed(2)}`;

export const formatNGN = (usdAmount: number) => {
  const naira = Math.round(usdAmount * USD_TO_NGN);
  return `₦${naira.toLocaleString("en-NG")}`;
};

export const formatDualPrice = (usdAmount: number) =>
  `${formatUSD(usdAmount)} / ${formatNGN(usdAmount)}`;
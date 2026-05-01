// VIP users get everything free (100% discount + free shipping).
// Keep this list small and intentional.
export const VIP_EMAILS = [
  "ezeonyekasinachi@gmail.com",
  "ezeonyekasinachifranklin@gmail.com",
] as const;

export const isVipEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return VIP_EMAILS.includes(email.trim().toLowerCase() as (typeof VIP_EMAILS)[number]);
};
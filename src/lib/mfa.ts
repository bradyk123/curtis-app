import { supabase } from "./supabase";

/** Verified TOTP factors on the current account (empty if none / not configured). */
export async function listTotpFactors() {
  if (!supabase) return { factors: [], error: "Auth is not configured." };
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) return { factors: [], error: error.message };
  // listFactors returns only verified factors in data.totp
  return { factors: data?.totp ?? [], error: undefined as string | undefined };
}

/** Begin enrolling an authenticator app. Returns a QR (SVG) + secret to display. */
export async function enrollTotp() {
  if (!supabase) return { error: "Auth is not configured." };
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
  if (error || !data) return { error: error?.message ?? "Could not start enrollment." };
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret, uri: data.totp.uri };
}

/** Verify a 6-digit code against a factor (challenge + verify). */
export async function verifyTotp(factorId: string, code: string) {
  if (!supabase) return { error: "Auth is not configured." };
  const ch = await supabase.auth.mfa.challenge({ factorId });
  if (ch.error || !ch.data) return { error: ch.error?.message ?? "Could not start challenge." };
  const v = await supabase.auth.mfa.verify({ factorId, challengeId: ch.data.id, code });
  return { error: v.error?.message };
}

/** Remove a factor (turns 2FA off for that factor). */
export async function unenrollFactor(factorId: string) {
  if (!supabase) return { error: "Auth is not configured." };
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return { error: error?.message };
}

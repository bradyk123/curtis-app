/** Shared password policy. Returns an error message, or null if the password is OK. */
export function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Use at least 8 characters.";
  if (!/[A-Za-z]/.test(pw)) return "Include at least one letter.";
  if (!/[0-9]/.test(pw)) return "Include at least one number.";
  return null;
}

export const PASSWORD_HINT = "At least 8 characters, including a letter and a number.";

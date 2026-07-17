import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/Logo";
import { listTotpFactors, verifyTotp } from "../lib/mfa";

/** Second-factor gate: shown after password sign-in when the user has 2FA enabled. */
export function MfaChallenge() {
  const { refreshMfa, signOut } = useAuth();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTotpFactors().then(({ factors }) => setFactorId(factors[0]?.id ?? null));
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setBusy(true);
    const { error } = await verifyTotp(factorId, code.trim());
    setBusy(false);
    if (error) {
      setError("That code didn't work. Try the current one from your app.");
      setCode("");
      return;
    }
    await refreshMfa(); // clears the gate → app proceeds
  };

  return (
    <div className="auth-page">
      <div className="auth-page-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Logo size={38} />
          </div>
          <h1>Two-Factor</h1>
          <p>Enter the 6-digit code from your authenticator app.</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            Code
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="code-input"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-submit" disabled={busy || code.length < 6}>
            {busy ? "…" : "Verify"}
          </button>
        </form>

        <p className="auth-switch">
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}

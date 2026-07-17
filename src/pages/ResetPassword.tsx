import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/Logo";
import { validatePassword, PASSWORD_HINT } from "../lib/password";

/** Shown after the user follows the password-recovery link from their email. */
export function ResetPassword() {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const pwErr = validatePassword(password);
    if (pwErr) return setError(pwErr);
    setBusy(true);
    const { error } = await updatePassword(password);
    setBusy(false);
    if (error) return setError(error);
    setDone(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-page-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Logo size={38} />
          </div>
          <h1>New Password</h1>
          <p>Choose a new password for your account.</p>
        </div>

        {done ? (
          <>
            <p className="auth-notice">Password updated. You're all set.</p>
            <p className="auth-switch">
              <button type="button" onClick={() => signOut()}>
                Continue
              </button>
            </p>
          </>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <label>
              New password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span className="field-hint">{PASSWORD_HINT}</span>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button type="submit" className="auth-submit" disabled={busy}>
              {busy ? "…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";
import { Logo } from "../components/Logo";
import { validatePassword, PASSWORD_HINT } from "../lib/password";

type Mode = "signin" | "signup" | "reset";

/** Full-screen gate shown to signed-out visitors — the app is inaccessible until sign-in. */
export function AuthPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (mode === "reset") {
      setBusy(true);
      const { error } = await resetPassword(email);
      setBusy(false);
      if (error) return setError(error);
      return setNotice("If that email has an account, a reset link is on its way.");
    }

    if (mode === "signup") {
      const pwErr = validatePassword(password);
      if (pwErr) return setError(pwErr);
    }

    setBusy(true);
    if (mode === "signin") {
      const { error } = await signIn(email, password);
      setBusy(false);
      if (error) setError(error);
      // on success, the auth listener flips the app to the signed-in view automatically
    } else {
      const { error, needsConfirm } = await signUp(email, password);
      setBusy(false);
      if (error) return setError(error);
      if (needsConfirm) setNotice("Check your email to confirm your account, then sign in.");
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setNotice(null);
  };

  return (
    <div className="auth-page">
      <div className="auth-page-card">
        <div className="auth-brand">
          <div className="auth-logo">
            <Logo size={38} />
          </div>
          <h1>Beach Track Club</h1>
          <p>
            {mode === "reset" ? "Reset your password." : "Sign in to access your training."}
          </p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {mode !== "reset" && (
            <label>
              Password
              <input
                type="password"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === "signup" && <span className="field-hint">{PASSWORD_HINT}</span>}
            </label>
          )}

          {mode === "signin" && (
            <button type="button" className="link-btn" onClick={() => switchMode("reset")}>
              Forgot password?
            </button>
          )}

          {error && <p className="auth-error">{error}</p>}
          {notice && <p className="auth-notice">{notice}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy
              ? "…"
              : mode === "signin"
              ? "Sign In"
              : mode === "signup"
              ? "Create Account"
              : "Send Reset Link"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "reset" ? (
            <>
              Remembered it?{" "}
              <button type="button" onClick={() => switchMode("signin")}>
                Back to sign in
              </button>
            </>
          ) : mode === "signin" ? (
            <>
              New to Beach Track Club?{" "}
              <button type="button" onClick={() => switchMode("signup")}>
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button type="button" onClick={() => switchMode("signin")}>
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

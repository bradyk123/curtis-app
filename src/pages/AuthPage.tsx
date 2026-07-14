import { useState, type FormEvent } from "react";
import { useAuth } from "../lib/auth";

type Mode = "signin" | "signup";

/** Full-screen gate shown to signed-out visitors — the app is inaccessible until sign-in. */
export function AuthPage() {
  const { signIn, signUp } = useAuth();
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

  return (
    <div className="auth-page">
      <div className="auth-page-card">
        <div className="auth-brand">
          <div className="auth-logo">🏖️</div>
          <h1>Beach Track Club</h1>
          <p>Sign in to access your training.</p>
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
          <label>
            Password
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}
          {notice && <p className="auth-notice">{notice}</p>}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signin" ? "New to Beach Track Club? " : "Already have an account? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setNotice(null);
            }}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

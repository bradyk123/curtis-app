import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import { listTotpFactors, enrollTotp, verifyTotp, unenrollFactor } from "../lib/mfa";

/** Enable / disable authenticator-app two-factor. Lives in the profile modal. */
export function TwoFactorSetup() {
  const { refreshMfa } = useAuth();
  const [enabledId, setEnabledId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enroll, setEnroll] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { factors } = await listTotpFactors();
    setEnabledId(factors[0]?.id ?? null);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const start = async () => {
    setError(null);
    setBusy(true);
    const r = await enrollTotp();
    setBusy(false);
    if ("error" in r && r.error) return setError(r.error);
    setEnroll({ factorId: r.factorId!, qr: r.qr!, secret: r.secret! });
  };

  const confirmCode = async () => {
    if (!enroll) return;
    setError(null);
    setBusy(true);
    const { error } = await verifyTotp(enroll.factorId, code.trim());
    setBusy(false);
    if (error) {
      setError("That code didn't work — enter the current one from your app.");
      setCode("");
      return;
    }
    setEnroll(null);
    setCode("");
    await load();
    await refreshMfa();
  };

  const cancel = async () => {
    if (enroll) await unenrollFactor(enroll.factorId); // discard the pending factor
    setEnroll(null);
    setCode("");
    setError(null);
  };

  const turnOff = async () => {
    if (!enabledId || !confirm("Turn off two-factor authentication?")) return;
    setBusy(true);
    await unenrollFactor(enabledId);
    setBusy(false);
    await load();
    await refreshMfa();
  };

  return (
    <div className="mfa-section">
      <div className="mfa-head">
        <span>Two-factor authentication</span>
        {!loading && !enroll && (
          <span className={`mfa-badge ${enabledId ? "on" : "off"}`}>{enabledId ? "On" : "Off"}</span>
        )}
      </div>

      {loading ? (
        <p className="field-hint">Checking…</p>
      ) : enroll ? (
        <>
          <p className="field-hint">
            Scan this with an authenticator app (Google Authenticator, Authy, 1Password), then enter
            the 6-digit code.
          </p>
          <div className="mfa-qr" dangerouslySetInnerHTML={{ __html: enroll.qr }} />
          <p className="mfa-secret">
            Can't scan? Key: <code>{enroll.secret}</code>
          </p>
          <input
            className="code-input"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          {error && <p className="auth-error">{error}</p>}
          <div className="mfa-actions">
            <button className="text-btn primary" disabled={busy || code.length < 6} onClick={confirmCode}>
              {busy ? "…" : "Verify & enable"}
            </button>
            <button className="text-btn" onClick={cancel} disabled={busy}>
              Cancel
            </button>
          </div>
        </>
      ) : enabledId ? (
        <>
          <p className="field-hint">Your account is protected with an authenticator app.</p>
          {error && <p className="auth-error">{error}</p>}
          <button className="text-btn danger" onClick={turnOff} disabled={busy}>
            {busy ? "…" : "Turn off 2FA"}
          </button>
        </>
      ) : (
        <>
          <p className="field-hint">
            Add a second step at sign-in using an authenticator app — strongly recommended.
          </p>
          {error && <p className="auth-error">{error}</p>}
          <button className="text-btn primary" onClick={start} disabled={busy}>
            {busy ? "…" : "Enable two-factor"}
          </button>
        </>
      )}
    </div>
  );
}

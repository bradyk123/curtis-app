import { useState } from "react";
import { useAuth } from "../lib/auth";
import { AuthModal } from "./AuthModal";

export function Header() {
  const { user, signOut, loading } = useAuth();
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);

  return (
    <header className="header">
      <h1>Beach Track Club</h1>
      <div className="actions">
        {loading ? null : user ? (
          <>
            <span className="user-email" title={user.email}>
              {user.email}
            </span>
            <button className="sign-in" onClick={() => signOut()}>
              Sign Out
            </button>
          </>
        ) : (
          <>
            <button className="sign-in" onClick={() => setAuthMode("signin")}>
              Sign In
            </button>
            <button className="sign-up" onClick={() => setAuthMode("signup")}>
              Sign Up
            </button>
          </>
        )}
      </div>

      {authMode && (
        <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />
      )}
    </header>
  );
}

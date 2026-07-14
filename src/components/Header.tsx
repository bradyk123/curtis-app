import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useProfile } from "../lib/profile";
import { AuthModal } from "./AuthModal";
import { ProfileModal } from "./ProfileModal";

export function Header() {
  const { user, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const name = profile?.display_name || user?.email || "";

  return (
    <header className="header">
      <h1>Beach Track Club</h1>
      <div className="actions">
        {loading ? null : user ? (
          <>
            {profile?.is_admin && (
              <Link className="admin-link" to="/admin">
                Approvals
              </Link>
            )}
            <button className="user-chip" onClick={() => setShowProfile(true)} title="Edit profile">
              <span className="user-email">{name}</span>
              {profile?.role && <span className={`role-badge role-${profile.role}`}>{profile.role}</span>}
            </button>
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

      {authMode && <AuthModal initialMode={authMode} onClose={() => setAuthMode(null)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </header>
  );
}

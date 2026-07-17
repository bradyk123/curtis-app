import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useProfile } from "../lib/profile";
import { usePreviewAthlete, setPreviewAthlete } from "../lib/viewAs";
import { AuthModal } from "./AuthModal";
import { ProfileModal } from "./ProfileModal";
import { Logo } from "./Logo";

export function Header() {
  const { user, signOut, loading } = useAuth();
  const { profile } = useProfile();
  const previewing = usePreviewAthlete();
  const [authMode, setAuthMode] = useState<"signin" | "signup" | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  const name = profile?.display_name || user?.email || "";
  const isAdmin = !!profile?.is_admin;

  return (
    <header className="header">
      <Link className="brand-lockup" to="/">
        <Logo size={30} className="logo" />
        <h1>Beach Track Club</h1>
        <span className="app-version" title={`Deployed build ${__BUILD_SHA__}`}>
          v{__APP_VERSION__}
        </span>
      </Link>
      <div className="actions">
        {loading ? null : user ? (
          <>
            {isAdmin && (
              <button
                className={`viewas-toggle${previewing ? " on" : ""}`}
                onClick={() => setPreviewAthlete(!previewing)}
                title={previewing ? "Return to coach view" : "Preview the app as an athlete sees it"}
              >
                {previewing ? "Exit athlete view" : "View as athlete"}
              </button>
            )}
            {isAdmin && !previewing && (
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

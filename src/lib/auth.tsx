import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** True when a signed-in user must still pass a 2FA challenge (aal1 → aal2). */
  mfaRequired: boolean;
  /** True during a password-recovery flow (from the email reset link). */
  recovery: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (password: string) => Promise<{ error?: string }>;
  /** Re-check the 2FA assurance level (call after passing a challenge). */
  refreshMfa: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

/** Base path for redirect links (matches Vite base + HashRouter). */
function appUrl() {
  return window.location.origin + window.location.pathname;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [recovery, setRecovery] = useState(false);

  const checkAal = async () => {
    if (!supabase) return setMfaRequired(false);
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setMfaRequired(!!data && data.nextLevel === "aal2" && data.currentLevel === "aal1");
  };

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await checkAal();
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") {
        setRecovery(false);
        setMfaRequired(false);
      }
      // recompute the 2FA gate whenever auth state shifts
      checkAal();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthState["signIn"] = async (email, password) => {
    if (!supabase) return { error: "Auth is not configured." };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) await checkAal();
    return { error: error?.message };
  };

  const signUp: AuthState["signUp"] = async (email, password) => {
    if (!supabase) return { error: "Auth is not configured." };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // If email confirmation is required, no session is returned yet.
    return { needsConfirm: !data.session };
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setRecovery(false);
    setMfaRequired(false);
  };

  const resetPassword: AuthState["resetPassword"] = async (email) => {
    if (!supabase) return { error: "Auth is not configured." };
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: appUrl() });
    return { error: error?.message };
  };

  const updatePassword: AuthState["updatePassword"] = async (password) => {
    if (!supabase) return { error: "Auth is not configured." };
    const { error } = await supabase.auth.updateUser({ password });
    if (!error) setRecovery(false);
    return { error: error?.message };
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        loading,
        mfaRequired,
        recovery,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshMfa: checkAal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

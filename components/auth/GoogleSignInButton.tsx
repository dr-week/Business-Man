"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  pictureUrl?: string | null;
  role: string;
};

export function GoogleAuthControls({
  onAuthChange,
}: {
  onAuthChange?: (user: AuthUser | null) => void;
}) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkSession() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = (await res.json()) as { user?: AuthUser | null };
          if (mounted && data?.user) {
            setCurrentUser(data.user);
            onAuthChange?.(data.user);
          }
        }
      } catch {
        // silent fail on network / SSR
      } finally {
        if (mounted) setLoading(false);
      }
    }
    checkSession();
    return () => {
      mounted = false;
    };
  }, [onAuthChange]);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      onAuthChange?.(null);
    } catch {
      setError("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedDevSignIn = async () => {
    // In dev/test mode without live Google client credentials, allow passwordless single-click demo identity
    setLoading(true);
    setError(null);
    try {
      const devPayload = {
        iss: "https://accounts.google.com",
        sub: `google-user-${Math.floor(Math.random() * 10000)}`,
        aud: "businessman-app.apps.googleusercontent.com",
        email: "analyst@businessman.dev",
        email_verified: true,
        name: "Analyst (Google Demo)",
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      };

      const mockJwt = `${btoa(JSON.stringify({ alg: "RS256" }))}.${btoa(JSON.stringify(devPayload))}.${btoa("mock")}`;

      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: mockJwt }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err?.error || "Sign-in failed");
      }

      const data = (await res.json()) as { user: AuthUser };
      setCurrentUser(data.user);
      onAuthChange?.(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-xs text-[var(--muted)] animate-pulse">Checking sign-in...</div>;
  }

  if (currentUser) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs">
          {currentUser.pictureUrl ? (
            <img
              src={currentUser.pictureUrl}
              alt={currentUser.displayName}
              className="w-6 h-6 rounded-full border border-[#454936]"
            />
          ) : (
            <User size={16} className="text-[var(--gold)]" />
          )}
          <span className="font-medium text-[var(--cream)]">{currentUser.displayName}</span>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign out"
          aria-label="Sign out"
          className="hunt-icon-action !w-8 !h-8 text-xs text-[var(--muted)] hover:text-red-400"
        >
          <LogOut size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleSimulatedDevSignIn}
        className="hunt-primary !h-8 !px-3 !w-auto text-xs font-semibold gap-1.5 bg-[#292d23] hover:bg-[#343a2c] text-[var(--gold)] border border-[#454936] rounded-md transition-colors"
      >
        <LogIn size={13} />
        Sign in with Google
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

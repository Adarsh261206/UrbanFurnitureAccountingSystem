import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@tanstack/react-router";
import { setUnauthorizedHandler } from "@/lib/api/client";
import { authService, type LoginRequest } from "@/services/authService";
import type { Role, User } from "@/types/api";

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: SessionStatus;
  isAuthenticated: boolean;
  hasRole: (roles: Role[]) => boolean;
  /** Landing route for the signed-in role (A3): user → /invoices. */
  homePath: "/dashboard" | "/invoices";
  login: (body: LoginRequest) => Promise<User>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function homePathForRole(role: Role | undefined): "/dashboard" | "/invoices" {
  return role === "user" ? "/invoices" : "/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");
  const redirecting = useRef(false);

  /** GET /auth/me on application startup (22 §5). */
  const refresh = useCallback(async () => {
    try {
      const me = await authService.me();
      setUser(me);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setStatus("unauthenticated");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // 401 anywhere → clear session and send the visitor to /login.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setStatus("unauthenticated");
      if (redirecting.current) return;
      redirecting.current = true;
      void router.navigate({ to: "/login", replace: true }).finally(() => {
        redirecting.current = false;
      });
    });
    return () => setUnauthorizedHandler(null);
  }, [router]);

  const login = useCallback(async (body: LoginRequest) => {
    const authed = await authService.login(body);
    setUser(authed);
    setStatus("authenticated");
    return authed;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setStatus("unauthenticated");
      await router.navigate({ to: "/login", replace: true });
    }
  }, [router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      isAuthenticated: status === "authenticated" && user !== null,
      hasRole: (roles: Role[]) => (user ? roles.includes(user.role) : false),
      homePath: homePathForRole(user?.role),
      login,
      logout,
      refresh,
    }),
    [user, status, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

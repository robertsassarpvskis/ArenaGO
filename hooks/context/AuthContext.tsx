// context/AuthContext.tsx
import { useRouter, useSegments } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userName: string;
  email: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

interface AuthContextType {
  user: AuthTokens | null;
  isLoading: boolean;
  isNewSignup: boolean;
  clearNewSignup: () => void;
  login: (data: LoginData) => Promise<void>;
  signup: (data: SignUpData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

interface SignUpData {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: boolean;
  birthDate: string;
  preferredLanguages: string[];
  preferredTimeZone: string;
}

interface LoginData {
  userNameOrEmail: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = "http://217.182.74.113:30080/api/Auth";

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [user, setUser] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // When true, the routing guard stands down so ProfileSetupScreen
  // can handle navigation instead of being overridden by the auth useEffect.
  const [isNewSignup, setIsNewSignup] = useState(false);

  const router = useRouter();
  const segments = useSegments();

  // Load stored tokens on mount
  useEffect(() => {
    loadStoredTokens();
  }, []);

  // Handle routing based on auth state
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      // Not authenticated — send to login
      router.replace("/(auth)/LoginScreen");
    } else if (user && inAuthGroup) {
      // Authenticated but still in auth screens —
      // only redirect if this is NOT a fresh signup.
      // Fresh signups are routed manually by SignUpScreen -> ProfileSetupScreen.
      if (isNewSignup) return;
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoading, isNewSignup]);

  // Auto-refresh access token before it expires
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      const expiresAt = new Date(user.accessTokenExpiresAt).getTime();
      const timeUntilExpiry = expiresAt - Date.now();

      console.log("[Auth] Time until token expiry (ms):", timeUntilExpiry);

      if (timeUntilExpiry <= 120000) {
        console.log("[Auth] Token expiring soon — refreshing...");
        refreshAccessToken();
      }
    };

    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const loadStoredTokens = async () => {
    try {
      const stored = await SecureStore.getItemAsync("authTokens");
      if (stored) {
        const tokens: AuthTokens = JSON.parse(stored);

        const refreshExpiresAt = new Date(
          tokens.refreshTokenExpiresAt,
        ).getTime();
        if (refreshExpiresAt > Date.now()) {
          setUser(tokens);

          const accessExpiresAt = new Date(
            tokens.accessTokenExpiresAt,
          ).getTime();
          if (accessExpiresAt < Date.now()) {
            await refreshAccessToken();
          }
        } else {
          // Refresh token expired — force re-login
          await SecureStore.deleteItemAsync("authTokens");
        }
      }
    } catch (error) {
      console.error("[Auth] Error loading stored tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTokens = async (tokens: AuthTokens) => {
    try {
      await SecureStore.setItemAsync("authTokens", JSON.stringify(tokens));
      setUser(tokens);
    } catch (error) {
      console.error("[Auth] Error saving tokens:", error);
      throw error;
    }
  };

  const login = async (data: LoginData) => {
    const { userNameOrEmail, password } = data;

    if (!userNameOrEmail.trim())
      throw new Error("Username or email is required");
    if (!password || password.length < 8)
      throw new Error("Password must be at least 8 characters");

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userNameOrEmail: userNameOrEmail.trim(),
          password,
        }),
      });

      const rawText = await response.text();
      console.log("[Auth] Login response:", rawText);

      let res: any;
      try {
        res = JSON.parse(rawText);
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        if (res?.errors) {
          const firstGroup = Object.values(res.errors)[0];
          if (Array.isArray(firstGroup))
            throw new Error(firstGroup[0] as string);
        }
        throw new Error(res?.detail || "Login failed");
      }

      const tokens: AuthTokens = res.result ?? res;
      if (!tokens?.accessToken)
        throw new Error("Login response missing authentication data");

      // Existing user login — no profile setup needed
      setIsNewSignup(false);
      await saveTokens(tokens);
    } catch (error) {
      console.error("[Auth] Login error:", error);
      throw error;
    }
  };

  const signup = async (data: SignUpData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          preferredLanguages: data.preferredLanguages.map((l) => l.trim()),
        }),
      });

      const res = await response.json();
      console.log("[Auth] Signup response:", res);

      if (!response.ok) {
        if (res?.errors) {
          const firstGroup = Object.values(res.errors)[0];
          if (Array.isArray(firstGroup))
            throw new Error(firstGroup[0] as string);
        }
        throw new Error(res?.detail || "Sign up failed");
      }

      const tokens: AuthTokens = res.result ?? res;
      if (!tokens?.accessToken)
        throw new Error("Signup response missing authentication data");

      // Set BEFORE saveTokens so the routing useEffect sees isNewSignup=true
      // when user state updates, preventing the auto-redirect to /(tabs)
      setIsNewSignup(true);
      await saveTokens(tokens);
    } catch (error) {
      console.error("[Auth] Signup error:", error);
      throw error;
    }
  };

  // Call this from ProfileSetupScreen once setup is done or skipped.
  // Reactivates normal auth routing for all future navigations.
  const clearNewSignup = () => {
    setIsNewSignup(false);
  };

  const refreshAccessToken = async () => {
    if (!user) return;

    console.log("[Auth] Refreshing access token...");

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: user.refreshToken }),
      });

      const data = await response.json();

      if (!response.ok || !data?.accessToken) {
        await logout();
        throw new Error("Session expired. Please login again.");
      }

      console.log(
        "[Auth] Token refreshed. New expiry:",
        data.accessTokenExpiresAt,
      );
      await saveTokens(data);
    } catch (error) {
      console.error("[Auth] Token refresh error:", error);
      await logout();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("authTokens");
      setIsNewSignup(false);
      setUser(null);
    } catch (error) {
      console.error("[Auth] Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isNewSignup,
        clearNewSignup,
        login,
        signup,
        logout,
        refreshAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

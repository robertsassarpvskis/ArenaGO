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
  gender: boolean; // true = male? backend defined
  birthDate: string; // ISO string
  preferredLanguages: string[]; // changed from number[] to string[]
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
      // Redirect to login if not authenticated
      router.replace("/(auth)/LoginScreen");
    } else if (user && inAuthGroup) {
      // Redirect to main app if authenticated
      router.replace("/(tabs)");
    }
  }, [user, segments, isLoading]);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    const checkTokenExpiry = () => {
      const expiresAt = new Date(user.accessTokenExpiresAt).getTime();
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      console.log("[Auth] Time until expiry (ms):", timeUntilExpiry);

      // If expired OR about to expire → refresh
      if (timeUntilExpiry <= 120000) {
        console.log("[Auth] Token expired or about to expire. Refreshing...");
        refreshAccessToken();
      }
    };

    // Check immediately
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const loadStoredTokens = async () => {
    try {
      const stored = await SecureStore.getItemAsync("authTokens");
      if (stored) {
        const tokens: AuthTokens = JSON.parse(stored);

        // Check if refresh token is still valid
        const refreshExpiresAt = new Date(
          tokens.refreshTokenExpiresAt,
        ).getTime();
        if (refreshExpiresAt > Date.now()) {
          setUser(tokens);

          // Check if access token needs refresh
          const accessExpiresAt = new Date(
            tokens.accessTokenExpiresAt,
          ).getTime();
          if (accessExpiresAt < Date.now()) {
            await refreshAccessToken();
          }
        } else {
          // Refresh token expired, clear storage
          await SecureStore.deleteItemAsync("authTokens");
        }
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveTokens = async (tokens: AuthTokens) => {
    try {
      await SecureStore.setItemAsync("authTokens", JSON.stringify(tokens));
      setUser(tokens);
    } catch (error) {
      console.error("Error saving tokens:", error);
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
      console.log("Login raw response:", rawText); // 🔥 log the server response
      let res: any;
      try {
        res = JSON.parse(rawText);
      } catch {
        throw new Error("Server returned an invalid response");
      }

      if (!response.ok) {
        if (res?.errors) {
          const firstErrorGroup = Object.values(res.errors)[0];
          if (Array.isArray(firstErrorGroup))
            throw new Error(firstErrorGroup[0]);
        }
        throw new Error(res?.detail || "Login failed");
      }

      // ✅ Accept tokens in res.result or at root
      const tokens: AuthTokens = res.result ?? res;

      if (!tokens?.accessToken)
        throw new Error("Login response missing authentication data");

      await saveTokens(tokens);
    } catch (error) {
      console.error("Login error:", error);
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

      console.log("Signup raw response:", res); // 🔥 log the server response

      if (!response.ok) {
        // Handle ASP.NET validation errors
        if (res?.errors) {
          const firstErrorGroup = Object.values(res.errors)[0];
          if (Array.isArray(firstErrorGroup)) {
            throw new Error(firstErrorGroup[0]);
          }
        }
        throw new Error(res?.detail || "Sign up failed");
      }

      // Determine where the tokens actually are
      const tokens: AuthTokens = res.result ?? res; // fallback to root if no result

      if (!tokens?.accessToken) {
        throw new Error("Signup response missing authentication data");
      }

      await saveTokens(tokens);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const refreshAccessToken = async () => {
    if (!user) return;

    console.log("[AuthContext] Refreshing access token...");

    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: user.refreshToken,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.accessToken) {
        await logout();
        throw new Error("Session expired. Please login again.");
      }

      // 🔥 LOG NEW ACCESS TOKEN HERE
      console.log(
        "[AuthContext] Access token refreshed successfully:",
        data.accessToken,
      );

      console.log(
        "[AuthContext] New access token expires at:",
        data.accessTokenExpiresAt,
      );

      await saveTokens(data);
    } catch (error) {
      console.error("Token refresh error:", error);
      await logout();
      throw error;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("authTokens");
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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

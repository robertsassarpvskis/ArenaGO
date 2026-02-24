// utils/apiClient.ts
import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://217.182.74.113:30080/api";

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  userName: string;
  email: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

class ApiClient {
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];
  private onTokenRefreshedCallback:
    | ((tokens: AuthTokens) => Promise<void>)
    | null = null;
  private onSessionExpiredCallback: (() => void) | null = null;

  // Register a callback to be called when tokens are refreshed
  setOnTokenRefreshed(callback: (tokens: AuthTokens) => Promise<void>) {
    this.onTokenRefreshedCallback = callback;
  }

  // Register a callback to be called when session expires
  setOnSessionExpired(callback: () => void) {
    this.onSessionExpiredCallback = callback;
  }

  private async getTokens(): Promise<AuthTokens | null> {
    try {
      const stored = await SecureStore.getItemAsync("authTokens");
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error("Error getting tokens:", error);
      return null;
    }
  }

  private async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      await SecureStore.setItemAsync("authTokens", JSON.stringify(tokens));
      // Notify AuthContext about token update
      if (this.onTokenRefreshedCallback) {
        await this.onTokenRefreshedCallback(tokens);
      }
    } catch (error) {
      console.error("Error saving tokens:", error);
    }
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  private async refreshToken(): Promise<string> {
    const tokens = await this.getTokens();
    if (!tokens) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${API_BASE_URL}/Auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refreshToken: tokens.refreshToken,
      }),
    });

    const data = await response.json();
    console.log("Token refresh response:", {
      status: response.status,
      ok: response.ok,
      data: data,
    });

    if (!response.ok) {
      console.error(
        "Token refresh failed:",
        data?.title || data?.message || data?.detail || "Unknown error",
      );
      await SecureStore.deleteItemAsync("authTokens");
      // Notify about session expiration
      if (this.onSessionExpiredCallback) {
        this.onSessionExpiredCallback();
      }
      throw new Error(
        data?.detail || data?.message || data?.title || "Token refresh failed",
      );
    }

    // Handle both direct response and wrapped response (with .result)
    const newTokens: AuthTokens = data.result ?? data;

    if (!newTokens?.accessToken) {
      console.error(
        "Token refresh response missing accessToken, data:",
        newTokens,
      );
      await SecureStore.deleteItemAsync("authTokens");
      // Notify about session expiration
      if (this.onSessionExpiredCallback) {
        this.onSessionExpiredCallback();
      }
      throw new Error("Invalid token refresh response: missing accessToken");
    }

    console.log("✓ Token refresh successful");
    await this.saveTokens(newTokens);
    return newTokens.accessToken;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const tokens = await this.getTokens();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (tokens) {
      headers["Authorization"] = `Bearer ${tokens.accessToken}`;
    }

    let response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401 && tokens) {
      console.log("Received 401 Unauthorized, attempting token refresh...");

      if (!this.isRefreshing) {
        this.isRefreshing = true;

        try {
          const newToken = await this.refreshToken();
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);

          console.log("Token refreshed successfully, retrying request...");

          // Retry original request with new token
          headers["Authorization"] = `Bearer ${newToken}`;
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } catch (error) {
          this.isRefreshing = false;
          console.error("Token refresh failed:", error);
          throw error;
        }
      } else {
        console.log("Waiting for ongoing token refresh...");
        // Wait for token refresh to complete
        const newToken = await new Promise<string>((resolve) => {
          this.subscribeTokenRefresh(resolve);
        });

        // Retry with new token
        headers["Authorization"] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Request failed:", response.status, errorData);
      throw new Error(
        errorData.message || `Request failed: ${response.status}`,
      );
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

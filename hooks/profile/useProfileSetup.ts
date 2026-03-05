/**
 * useProfileSetup.ts
 *
 * Hook dedicated to the post-signup profile setup flow.
 * Handles avatar upload, bio, languages, and interests
 * via PUT /api/Users/{username}
 *
 * Kept SEPARATE from useAuth so signup flow is untouched.
 */

import { useState } from "react";

export interface ProfileSetupPayload {
  username: string;
  avatarFile?: {
    uri: string;
    name: string;
    type: string;
  } | null;
  bio?: string;
  preferredLanguages: string[];
  preferredTimezone?: string;
}

export interface ProfileSetupResult {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  profilePhoto: {
    id: string;
    url: string;
    contentType: string;
  } | null;
  preferredLanguages: string[];
  preferredTimeZone: string;
}

const API_BASE_URL = "http://217.182.74.113:30080";

export function useProfileSetup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Update profile after signup.
   * Pass token from auth context so this hook stays stateless.
   */
  const updateProfile = async (
    payload: ProfileSetupPayload,
    token: string,
  ): Promise<ProfileSetupResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      // Avatar (optional - user may skip)
      if (payload.avatarFile) {
        formData.append("ProfilePictureUpload", {
          uri: payload.avatarFile.uri,
          name: payload.avatarFile.name ?? "avatar.jpg",
          type: payload.avatarFile.type ?? "image/jpeg",
        } as any);
      }

      // Bio (optional)
      if (payload.bio) {
        formData.append("Bio", payload.bio);
      }

      // Languages — append each as separate field (multipart array)
      const langs =
        payload.preferredLanguages.length > 0
          ? payload.preferredLanguages
          : ["en"];

      langs.forEach((lang) => formData.append("PreferredLanguages", lang));

      // Timezone
      const timezone =
        payload.preferredTimezone ??
        Intl.DateTimeFormat().resolvedOptions().timeZone;
      formData.append("PreferredTimezone", timezone);

      const response = await fetch(
        `${API_BASE_URL}/api/Users/${payload.username}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT set Content-Type — let fetch set it with the boundary
          },
          body: formData,
        },
      );

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        throw new Error(errText || `Server error: ${response.status}`);
      }

      const data: ProfileSetupResult = await response.json();
      return data;
    } catch (err: any) {
      const msg = err?.message ?? "Failed to update profile";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateProfile,
  };
}

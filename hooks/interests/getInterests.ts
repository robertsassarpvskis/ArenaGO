import { Alert } from "react-native";

export interface CategoryOption {
  id: string;
  label: string;
  icon?: {
    id: string;
    url: string;
    contentType: string;
  };
  color?: {
    r: number;
    g: number;
    b: number;
    a: number;
  };
}

export interface UserInterest {
  id: string;
  label: string;
  icon?: string;
}

/**
 * Saņem intereses no ArenaGo API un pārveido uz CategoryOption formātu
 * @param accessToken Lietotāja JWT access token
 * @returns CategoryOption masīvs
 */
export async function fetchInterests(
  accessToken: string | null,
): Promise<CategoryOption[]> {
  if (!accessToken) {
    console.warn("No access token provided");
    return [];
  }

  try {
    const res = await fetch("http://217.182.74.113:30080/api/Interests", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch interests: ${res.status}`);
    }

    const data = await res.json();

    // Map API data to CategoryOption format, using real icon URLs and RGBA colors
    const categories: CategoryOption[] = data.map((item: any) => ({
      id: item.id,
      label: item.name,
      // Use the actual icon object from the API (contains id, url, contentType)
      icon: item.icon
        ? {
            id: item.icon.id,
            url: item.icon.url,
            contentType: item.icon.contentType,
          }
        : undefined,
      // Use the actual RGBA color object from the API
      // Note: the API returns alpha as 0–255, but rgbaToString expects 0–1.
      // Normalise `a` here so downstream rendering is correct.
      color: item.color
        ? {
            r: item.color.r,
            g: item.color.g,
            b: item.color.b,
            a: item.color.a > 1 ? item.color.a / 255 : item.color.a,
          }
        : undefined,
    }));

    return categories;
  } catch (err: any) {
    console.error("Error fetching interests:", err);
    Alert.alert("Error", "Failed to load categories");
    return [];
  }
}

/**
 * Converts CategoryOption to UserInterest format for profile display
 * @param categories Array of category options
 * @returns UserInterest array for display
 */
export function toUserInterests(categories: CategoryOption[]): UserInterest[] {
  return categories.map((cat) => ({
    id: cat.id,
    label: cat.label,
    icon: cat.icon?.url, // Use the icon URL for display
  }));
}

/**
 * Fetches user's selected interests
 * @param userName Username to fetch interests for
 * @param accessToken JWT access token
 * @returns Array of UserInterest
 */
export async function fetchUserInterests(
  userName: string,
  accessToken: string | null,
): Promise<UserInterest[]> {
  if (!accessToken || !userName) {
    console.warn("No access token or username provided");
    return [];
  }

  try {
    const res = await fetch(
      `http://217.182.74.113:30080/api/Users/${userName}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!res.ok) {
      throw new Error(`Failed to fetch user interests: ${res.status}`);
    }

    const userData = await res.json();

    // Extract interests from user bio (hashtags) or dedicated field if available
    if (userData.interests) {
      return userData.interests;
    }

    // Fallback: parse interests from bio hashtags
    if (userData.bio) {
      const hashtags = userData.bio.match(/#\w+/g) || [];
      return hashtags.map((tag: string) => ({
        id: tag.substring(1), // Remove #
        label: tag.substring(1),
        icon: undefined,
      }));
    }

    return [];
  } catch (err: any) {
    console.error("Error fetching user interests:", err);
    return [];
  }
}

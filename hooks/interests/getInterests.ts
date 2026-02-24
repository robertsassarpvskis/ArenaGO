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

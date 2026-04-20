import * as Haptics from "expo-haptics";
import { useCallback } from "react";

/**
 * Hook for triggering haptic feedback with quality presets.
 * Modern and simple API for all haptic interactions across the app.
 *
 * Usage:
 *   const { impact, notification, selection } = useHapticFeedback();
 *
 *   // On refresh/primary action
 *   hapticFeedback.impact("medium");
 *
 *   // On success/completion
 *   hapticFeedback.notification("success");
 *
 *   // On UI interaction
 *   hapticFeedback.selection();
 */
export function useHapticFeedback() {
  /**
   * Impact feedback for major actions (pull-to-refresh, button press, etc.)
   * @param intensity - "light" | "medium" | "heavy"
   */
  const impact = useCallback(
    async (intensity: "light" | "medium" | "heavy" = "medium") => {
      try {
        switch (intensity) {
          case "light":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case "medium":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            break;
          case "heavy":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            break;
          default:
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch (error) {
        console.warn("Haptic feedback not available:", error);
      }
    },
    [],
  );

  /**
   * Notification feedback for success/error/warning events
   * @param type - "success" | "error" | "warning"
   */
  const notification = useCallback(
    async (type: "success" | "error" | "warning" = "success") => {
      try {
        switch (type) {
          case "success":
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            break;
          case "error":
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Error,
            );
            break;
          case "warning":
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning,
            );
            break;
          default:
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
        }
      } catch (error) {
        console.warn("Haptic feedback not available:", error);
      }
    },
    [],
  );

  /**
   * Selection feedback for UI interactions (like taps)
   * Light and quick haptic response.
   */
  const selection = useCallback(async () => {
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn("Haptic feedback not available:", error);
    }
  }, []);

  /**
   * Complex haptic pattern for premium feel
   * Combines multiple feedbacks for sophisticated interactions
   */
  const pattern = useCallback(
    async (type: "double-tap" | "triple-tap" | "pulse" = "double-tap") => {
      try {
        switch (type) {
          case "double-tap":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await new Promise((resolve) => setTimeout(resolve, 100));
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case "triple-tap":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await new Promise((resolve) => setTimeout(resolve, 80));
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            await new Promise((resolve) => setTimeout(resolve, 80));
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          case "pulse":
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await new Promise((resolve) => setTimeout(resolve, 150));
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
          default:
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (error) {
        console.warn("Haptic feedback not available:", error);
      }
    },
    [],
  );

  return {
    impact,
    notification,
    selection,
    pattern,
  };
}

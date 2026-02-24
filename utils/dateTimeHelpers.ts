// utils/dateTimeHelpers.ts

export type DateOption = "NOW" | "TODAY" | "TONIGHT" | "TOMORROW" | "CUSTOM";

export interface TimeSlot {
  display: string;
  value: Date;
  disabled: boolean;
  isPast: boolean;
  crossesMidnight?: boolean;
}

export interface DateTimeSelection {
  startDateTime: Date;
  endDateTime: Date;
  durationMinutes: number;
  method: DateOption;
}

// Urban color palette
export const URBAN_COLORS = {
  primary: "#FF6B58",
  secondary: "#FF8A73",
  accentGreen: "#10B981",
  accentRed: "#EF4444",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
  background: "#fffcf4",
  cardBg: "#FFFFFF",
  darkGray: "#374151",
};

export const DEFAULT_DURATIONS: Record<string, number> = {
  Sports: 120,
  Music: 180,
  Networking: 120,
  Workshop: 120,
  Social: 120,
  default: 120,
};

export const DURATION_OPTIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hour", value: 60 },
  { label: "1.5 hours", value: 90 },
  { label: "2 hours", value: 120 },
  { label: "3 hours", value: 180 },
  { label: "4 hours", value: 240 },
];

/**
 * Round time to nearest 5 minutes
 */
export function roundToNearest5Minutes(date: Date): Date {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const roundedMinutes = Math.ceil(minutes / 5) * 5;
  rounded.setMinutes(roundedMinutes);
  rounded.setSeconds(0);
  rounded.setMilliseconds(0);
  return rounded;
}

/**
 * Format time for display (e.g., "18:00")
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Format duration for display
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Check if event crosses midnight
 */
export function crossesMidnight(start: Date, end: Date): boolean {
  return start.getDate() !== end.getDate();
}

/**
 * Format end time with day awareness
 */
export function formatEndTime(start: Date, end: Date): string {
  if (crossesMidnight(start, end)) {
    return `${formatTime(end)} (next day)`;
  }
  return formatTime(end);
}

/**
 * Generate time slots for TODAY
 */
export function generateTodaySlots(now: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const bufferTime = new Date(now.getTime() + 15 * 60000);

  let currentTime = roundToNearest5Minutes(new Date(bufferTime));
  currentTime.setMinutes(Math.ceil(currentTime.getMinutes() / 30) * 30);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 0, 0, 0);

  while (currentTime <= endOfDay && slots.length < 12) {
    slots.push({
      display: formatTime(currentTime),
      value: new Date(currentTime),
      disabled: false,
      isPast: false,
    });

    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }

  return slots;
}

/**
 * Generate time slots for TONIGHT (6 PM - 11 PM)
 */
export function generateTonightSlots(now: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const bufferTime = new Date(now.getTime() + 15 * 60000);
  const baseDate = new Date(now);

  const eveningHours = [18, 19, 20, 21, 22, 23];

  for (const hour of eveningHours) {
    const slotTime = new Date(baseDate);
    slotTime.setHours(hour, 0, 0, 0);

    if (slotTime > bufferTime) {
      slots.push({
        display: formatTime(slotTime),
        value: slotTime,
        disabled: false,
        isPast: false,
      });
    }
  }

  if (slots.length === 0 && now.getHours() >= 22) {
    const lateNightHours = [23, 0, 1];
    for (const hour of lateNightHours) {
      const slotTime = new Date(baseDate);
      if (hour === 0 || hour === 1) {
        slotTime.setDate(slotTime.getDate() + 1);
      }
      slotTime.setHours(hour, 0, 0, 0);

      if (slotTime > bufferTime) {
        slots.push({
          display: formatTime(slotTime),
          value: slotTime,
          disabled: false,
          isPast: false,
          crossesMidnight: hour === 0 || hour === 1,
        });
      }
    }
  }

  return slots;
}

/**
 * Generate time slots for TOMORROW
 */
export function generateTomorrowSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  [9, 10, 11].forEach((hour) => {
    const slotTime = new Date(tomorrow);
    slotTime.setHours(hour, 0, 0, 0);
    slots.push({
      display: formatTime(slotTime),
      value: slotTime,
      disabled: false,
      isPast: false,
    });
  });

  [12, 13, 14, 15, 16, 17].forEach((hour) => {
    const slotTime = new Date(tomorrow);
    slotTime.setHours(hour, 0, 0, 0);
    slots.push({
      display: formatTime(slotTime),
      value: slotTime,
      disabled: false,
      isPast: false,
    });
  });

  [18, 19, 20, 21].forEach((hour) => {
    const slotTime = new Date(tomorrow);
    slotTime.setHours(hour, 0, 0, 0);
    slots.push({
      display: formatTime(slotTime),
      value: slotTime,
      disabled: false,
      isPast: false,
    });
  });

  return slots;
}

/**
 * Generate time slots for custom date
 */
export function generateCustomDateSlots(date: Date): TimeSlot[] {
  const slots: TimeSlot[] = [];

  for (let hour = 8; hour <= 22; hour++) {
    const slotTime = new Date(date);
    slotTime.setHours(hour, 0, 0, 0);

    slots.push({
      display: formatTime(slotTime),
      value: slotTime,
      disabled: false,
      isPast: false,
    });
  }

  return slots;
}

/**
 * Get appropriate time slots based on date option
 */
export function generateTimeSlots(
  dateOption: DateOption,
  currentTime: Date,
  customDate?: Date,
): TimeSlot[] {
  switch (dateOption) {
    case "NOW":
      return [];

    case "TODAY":
      return generateTodaySlots(currentTime);

    case "TONIGHT":
      return generateTonightSlots(currentTime);

    case "TOMORROW":
      return generateTomorrowSlots();

    case "CUSTOM":
      return customDate ? generateCustomDateSlots(customDate) : [];

    default:
      return [];
  }
}

/**
 * Calculate end time from start and duration
 */
export function calculateEndTime(start: Date, durationMinutes: number): Date {
  return new Date(start.getTime() + durationMinutes * 60000);
}

/**
 * Get default duration based on category
 */
export function getDefaultDuration(categoryLabel?: string): number {
  if (!categoryLabel) return DEFAULT_DURATIONS.default;
  return DEFAULT_DURATIONS[categoryLabel] || DEFAULT_DURATIONS.default;
}

/**
 * Get label for date option based on current time
 */
export function getDateOptionLabel(
  option: DateOption,
  currentTime: Date,
): string {
  const hour = currentTime.getHours();

  switch (option) {
    case "NOW":
      return "NOW";

    case "TODAY":
      return "Today";

    case "TONIGHT":
      if (hour >= 23) {
        return "Late Night";
      }
      return "Tonight";

    case "TOMORROW":
      return "Tomorrow";

    case "CUSTOM":
      return "Pick Date";

    default:
      return "";
  }
}

/**
 * Check if date option should be available
 */
export function isDateOptionAvailable(
  option: DateOption,
  currentTime: Date,
): boolean {
  const hour = currentTime.getHours();

  switch (option) {
    case "TONIGHT":
      return hour < 24;

    default:
      return true;
  }
}

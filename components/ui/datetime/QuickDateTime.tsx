// components/ui/datetime/QuickDateTime.tsx

import {
  calculateEndTime,
  crossesMidnight,
  DateOption,
  DateTimeSelection,
  formatDuration,
  formatEndTime,
  generateTimeSlots,
  getDateOptionLabel,
  getDefaultDuration,
  roundToNearest5Minutes,
  TimeSlot,
} from "@/utils/dateTimeHelpers";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DateOptionChip } from "./DateOptionChip";
import { DurationPicker } from "./DurationPicker";
import { TimeSlotChip } from "./TimeSlotChip";

// ─── Local tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F4",
  border: "#EBEBEB",
  borderMid: "#D8D8D8",
  text: "#111111",
  textSub: "#555555",
  textMuted: "#AAAAAA",
  ink: "#1A1A1A",
  coral: "#FF6B58",
  coralLight: "rgba(255,107,88,0.08)",
  coralBorder: "rgba(255,107,88,0.22)",
  success: "#1A9E6A",
  successLight: "rgba(26,158,106,0.08)",
  successBorder: "rgba(26,158,106,0.22)",
} as const;

interface QuickDateTimeProps {
  categoryLabel?: string;
  onDateTimeChange: (selection: DateTimeSelection) => void;
  initialStartTime?: Date;
}

export const QuickDateTime: React.FC<QuickDateTimeProps> = ({
  categoryLabel,
  onDateTimeChange,
  initialStartTime,
}) => {
  const [dateOption, setDateOption] = useState<DateOption | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(
    initialStartTime || null,
  );
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [duration, setDuration] = useState(getDefaultDuration(categoryLabel));
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [currentTime] = useState(new Date());

  useEffect(() => {
    setDuration(getDefaultDuration(categoryLabel));
  }, [categoryLabel]);

  useEffect(() => {
    if (dateOption && dateOption !== "NOW") {
      const slots = generateTimeSlots(
        dateOption,
        currentTime,
        dateOption === "CUSTOM" ? customDate : undefined,
      );
      setTimeSlots(slots);
      if (!selectedTime && slots.length > 0) handleTimeSlotSelect(slots[0]);
    }
  }, [dateOption, customDate]);

  useEffect(() => {
    if (selectedTime) {
      const endTime = calculateEndTime(selectedTime, duration);
      onDateTimeChange({
        startDateTime: selectedTime,
        endDateTime: endTime,
        durationMinutes: duration,
        method: dateOption || "CUSTOM",
      });
    }
  }, [selectedTime, duration]);

  const handleDateOptionSelect = (option: DateOption) => {
    setDateOption(option);
    if (option === "NOW") {
      const now = new Date();
      setSelectedTime(roundToNearest5Minutes(now));
      setDuration(60);
    } else if (option === "CUSTOM") {
      setShowCustomDatePicker(true);
    } else {
      setSelectedTime(null);
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.disabled) setSelectedTime(slot.value);
  };

  const handleCustomDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowCustomDatePicker(false);
    if (date) {
      setCustomDate(date);
      if (Platform.OS === "android") {
        const slots = generateTimeSlots("CUSTOM", currentTime, date);
        setTimeSlots(slots);
      }
    }
  };

  const endDateTime = selectedTime
    ? calculateEndTime(selectedTime, duration)
    : null;
  const showEndTime = selectedTime && endDateTime;
  const doesCrossMidnight = showEndTime
    ? crossesMidnight(selectedTime, endDateTime)
    : false;

  return (
    <View style={styles.container}>
      {/* ── Date options ── */}
      <Text style={styles.sectionLabel}>DATE</Text>
      <View style={styles.chipsWrap}>
        <DateOptionChip
          label="NOW"
          selected={dateOption === "NOW"}
          onPress={() => handleDateOptionSelect("NOW")}
          icon="flash"
        />
        <DateOptionChip
          label={getDateOptionLabel("TODAY", currentTime)}
          selected={dateOption === "TODAY"}
          onPress={() => handleDateOptionSelect("TODAY")}
        />
        <DateOptionChip
          label={getDateOptionLabel("TONIGHT", currentTime)}
          selected={dateOption === "TONIGHT"}
          onPress={() => handleDateOptionSelect("TONIGHT")}
        />
        <DateOptionChip
          label="Tomorrow"
          selected={dateOption === "TOMORROW"}
          onPress={() => handleDateOptionSelect("TOMORROW")}
        />
        <DateOptionChip
          label="Pick date"
          selected={dateOption === "CUSTOM"}
          onPress={() => handleDateOptionSelect("CUSTOM")}
          outlined
          icon="calendar-outline"
        />
      </View>

      {/* Custom date picker */}
      {showCustomDatePicker && (
        <DateTimePicker
          value={customDate}
          mode="date"
          minimumDate={new Date()}
          maximumDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)}
          onChange={handleCustomDateChange}
          display={Platform.OS === "ios" ? "spinner" : "default"}
        />
      )}

      {/* ── Time slots ── */}
      {dateOption && dateOption !== "NOW" && timeSlots.length > 0 && (
        <View style={styles.timeSection}>
          <Text style={styles.sectionLabel}>TIME</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeSlotsContent}
          >
            {timeSlots.map((slot, idx) => (
              <TimeSlotChip
                key={idx}
                label={slot.display}
                selected={selectedTime?.getTime() === slot.value.getTime()}
                onPress={() => handleTimeSlotSelect(slot)}
                disabled={slot.disabled}
                crossesMidnight={slot.crossesMidnight}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Duration row ── */}
      {selectedTime && (
        <View style={styles.durationSection}>
          {/* Duration trigger */}
          <TouchableOpacity
            onPress={() => setShowDurationPicker(true)}
            style={styles.durationRow}
            activeOpacity={0.75}
          >
            <View style={styles.durationInfo}>
              <Text style={styles.durationKey}>DURATION</Text>
              <Text style={styles.durationValue}>
                {formatDuration(duration)}
              </Text>
            </View>
            <View style={styles.editPill}>
              <Text style={styles.editPillText}>EDIT</Text>
            </View>
          </TouchableOpacity>

          {/* End time */}
          {showEndTime && (
            <View style={styles.endTimeRow}>
              <View style={styles.endTimeDot} />
              <Text style={styles.endTimeLabel}>Ends at </Text>
              <Text style={styles.endTimeValue}>
                {formatEndTime(selectedTime, endDateTime)}
              </Text>
              {doesCrossMidnight && (
                <View style={styles.midnightTag}>
                  <Ionicons name="moon-outline" size={10} color={C.textMuted} />
                  <Text style={styles.midnightTagText}>next day</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Duration picker modal */}
      <DurationPicker
        visible={showDurationPicker}
        currentDuration={duration}
        onSelect={(d) => setDuration(d)}
        onClose={() => setShowDurationPicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },

  // ── Section label — urban stencil style
  sectionLabel: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.5,
    color: C.textMuted,
    textTransform: "uppercase",
    marginBottom: 10,
  },

  // ── Date chips
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 4,
  },

  // ── Time slots
  timeSection: {
    marginTop: 20,
  },
  timeSlotsContent: {
    paddingRight: 8,
  },

  // ── Duration section
  durationSection: {
    marginTop: 20,
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: "hidden",
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  durationInfo: {
    gap: 2,
  },
  durationKey: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
    color: C.textMuted,
    textTransform: "uppercase",
  },
  durationValue: {
    fontSize: 18,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  editPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  editPillText: {
    fontSize: 11,
    fontWeight: "800",
    color: C.textSub,
    letterSpacing: 1,
  },

  // ── End time row
  endTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 6,
  },
  endTimeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.success,
  },
  endTimeLabel: {
    fontSize: 13,
    fontWeight: "400",
    color: C.textMuted,
  },
  endTimeValue: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    flex: 1,
  },
  midnightTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1,
    borderColor: C.border,
  },
  midnightTagText: {
    fontSize: 10,
    fontWeight: "600",
    color: C.textMuted,
  },
});

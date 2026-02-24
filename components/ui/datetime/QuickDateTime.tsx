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
  URBAN_COLORS,
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

      if (!selectedTime && slots.length > 0) {
        handleTimeSlotSelect(slots[0]);
      }
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
      const roundedNow = roundToNearest5Minutes(now);
      setSelectedTime(roundedNow);
      setDuration(60);
    } else if (option === "CUSTOM") {
      setShowCustomDatePicker(true);
    } else {
      setSelectedTime(null);
    }
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (!slot.disabled) {
      setSelectedTime(slot.value);
    }
  };

  const handleCustomDateChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") {
      setShowCustomDatePicker(false);
    }

    if (date) {
      setCustomDate(date);
      if (Platform.OS === "android") {
        const slots = generateTimeSlots("CUSTOM", currentTime, date);
        setTimeSlots(slots);
      }
    }
  };

  const handleDurationChange = (newDuration: number) => {
    setDuration(newDuration);
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
      {/* Section Header with Orange Icon */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerIconOrange}>
          <Ionicons name="calendar" size={20} color="#fff" />
        </View>
        <Text style={styles.question}>When is your event?</Text>
      </View>

      {/* Date Selection - Non-scrollable Wrap */}
      <View style={styles.dateOptionsContainer}>
        <View style={styles.dateOptionsRow}>
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
        </View>
        <View style={styles.dateOptionsRow}>
          <DateOptionChip
            label="Tomorrow"
            selected={dateOption === "TOMORROW"}
            onPress={() => handleDateOptionSelect("TOMORROW")}
          />
          <DateOptionChip
            label="Pick Date"
            selected={dateOption === "CUSTOM"}
            onPress={() => handleDateOptionSelect("CUSTOM")}
            outlined
            icon="calendar-outline"
          />
        </View>
      </View>

      {/* Custom Date Picker */}
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

      {/* Time Selection */}
      {dateOption && dateOption !== "NOW" && timeSlots.length > 0 && (
        <View style={styles.timeSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.headerIconOrange}>
              <Ionicons name="time" size={20} color="#fff" />
            </View>
            <Text style={styles.question}>What time?</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.timeSlots}
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

      {/* Duration & End Time Display */}
      {selectedTime && (
        <View style={styles.durationSection}>
          <TouchableOpacity
            onPress={() => setShowDurationPicker(true)}
            style={styles.durationButton}
            activeOpacity={0.7}
          >
            <View style={styles.durationLeft}>
              <View style={styles.durationIconContainerOrange}>
                <Ionicons name="timer" size={22} color="#fff" />
              </View>
              <View>
                <Text style={styles.durationLabel}>Duration</Text>
                <Text style={styles.durationValue}>
                  {formatDuration(duration)}
                </Text>
              </View>
            </View>
            <View style={styles.changeButton}>
              <Text style={styles.changeText}>EDIT</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={URBAN_COLORS.primary}
              />
            </View>
          </TouchableOpacity>

          {showEndTime && (
            <View style={styles.endTimeInfo}>
              <View style={styles.endTimeRow}>
                <Ionicons name="flag" size={16} color={URBAN_COLORS.primary} />
                <Text style={styles.endTimeLabel}>Ends at</Text>
                <Text style={styles.endTimeText}>
                  {formatEndTime(selectedTime, endDateTime)}
                </Text>
              </View>
              {doesCrossMidnight && (
                <View style={styles.midnightWarning}>
                  <Ionicons
                    name="moon"
                    size={14}
                    color={URBAN_COLORS.primary}
                  />
                  <Text style={styles.midnightWarningText}>
                    Continues to next day
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      {/* Duration Picker Modal */}
      <DurationPicker
        visible={showDurationPicker}
        currentDuration={duration}
        onSelect={handleDurationChange}
        onClose={() => setShowDurationPicker(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  headerIconOrange: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: URBAN_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  question: {
    fontSize: 16,
    fontWeight: "700",
    color: URBAN_COLORS.textPrimary,
    letterSpacing: 0.1,
  },
  dateOptionsContainer: {
    paddingBottom: 4,
  },
  dateOptionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  timeSection: {
    marginTop: 24,
  },
  timeSlots: {
    marginTop: 8,
  },
  timeSlotsContent: {
    paddingRight: 16,
  },
  durationSection: {
    marginTop: 20,
    padding: 18,
    backgroundColor: URBAN_COLORS.cardBg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: URBAN_COLORS.secondary,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  durationButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  durationLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  durationIconContainerOrange: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: URBAN_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  durationLabel: {
    fontSize: 12,
    color: URBAN_COLORS.textSecondary,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: "800",
    color: URBAN_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFF1F0",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: URBAN_COLORS.secondary,
  },
  changeText: {
    fontSize: 13,
    color: URBAN_COLORS.primary,
    fontWeight: "800",
    marginRight: 4,
    letterSpacing: 0.5,
  },
  endTimeInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: "#F3F4F6",
    borderStyle: "dashed",
  },
  endTimeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  endTimeLabel: {
    fontSize: 13,
    color: URBAN_COLORS.textSecondary,
    marginLeft: 8,
    marginRight: 6,
    fontWeight: "600",
  },
  endTimeText: {
    fontSize: 16,
    color: URBAN_COLORS.textPrimary,
    fontWeight: "700",
  },
  midnightWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FFF1F0",
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: URBAN_COLORS.primary,
  },
  midnightWarningText: {
    fontSize: 13,
    color: URBAN_COLORS.primary,
    marginLeft: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});

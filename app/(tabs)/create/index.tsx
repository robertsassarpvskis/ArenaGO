// app/(tabs)/events/create.tsx

import { QuickDateTime } from "@/components/ui/datetime/QuickDateTime";
import InputDescription from "@/components/ui/inputs/input-description";
import InputHeading from "@/components/ui/inputs/input-heading";
import { useAuth } from "@/hooks/context/AuthContext";
import { DateTimeSelection, URBAN_COLORS } from "@/utils/dateTimeHelpers";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker } from "react-native-maps";
import { SvgUri } from "react-native-svg"; // ← NEW
import { Container } from "../../../components/common/Container";
import {
  CategoryOption,
  rgbaToString,
} from "../../../components/ui/buttons/DropdownButtons";
import {
  CreateEventPayload,
  useCreateEvent,
} from "../../../hooks/events/useEventsCreate";
import { fetchInterests } from "../../../hooks/interests/getInterests";

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Fallback categories (no icon URLs, so Ionicons will be used as fallback)
const CATEGORIES: CategoryOption[] = [
  {
    id: "1",
    label: "Sports",
    color: { r: 255, g: 107, b: 88, a: 1 },
  },
  {
    id: "2",
    label: "Music",
    color: { r: 255, g: 138, b: 115, a: 1 },
  },
  {
    id: "3",
    label: "Networking",
    color: { r: 16, g: 185, b: 129, a: 1 },
  },
  {
    id: "4",
    label: "Workshop",
    color: { r: 107, g: 114, b: 128, a: 1 },
  },
  {
    id: "5",
    label: "Social",
    color: { r: 239, g: 68, b: 68, a: 1 },
  },
];

const PARTICIPANT_PRESETS = [
  { value: "5", label: "5" },
  { value: "10", label: "10" },
  { value: "15", label: "15" },
  { value: "20", label: "20" },
  { value: "30", label: "30" },
  { value: "50", label: "50+" },
];

export default function CreateEvent() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { createEvent, loading } = useCreateEvent(user?.accessToken || null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [customParticipants, setCustomParticipants] = useState("");

  const [eventImage, setEventImage] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);

  const [dateTimeSelection, setDateTimeSelection] =
    useState<DateTimeSelection | null>(null);

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [fetchingLocationName, setFetchingLocationName] = useState(false);

  const [extrasExpanded, setExtrasExpanded] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const result = await fetchInterests(user?.accessToken || null);
      if (result && result.length > 0) {
        setCategories(result);
      }
    };
    loadCategories();
  }, [user?.accessToken]);

  useEffect(() => {
    if (description || category || maxParticipants || eventImage) {
      setExtrasExpanded(true);
    }
  }, [description, category, maxParticipants, eventImage]);

  const handleMapPress = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setLocation(coords);
    setFetchingLocationName(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
      );
      const data = await res.json();

      const address = data.address;
      let finalLocationName = "";

      if (address?.building || address?.amenity || address?.leisure) {
        finalLocationName =
          address.building || address.amenity || address.leisure;
      } else if (address?.road) {
        const houseNumber = address.house_number || "";
        finalLocationName = `${houseNumber} ${address.road}`.trim();
      } else if (address?.neighbourhood || address?.suburb) {
        finalLocationName = address.neighbourhood || address.suburb;
      } else if (address?.city || address?.town || address?.village) {
        finalLocationName = address.city || address.town || address.village;
      } else {
        finalLocationName = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      }

      setLocationName(finalLocationName);
    } catch {
      setLocationName(
        `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`,
      );
    } finally {
      setFetchingLocationName(false);
    }
  };

  const handleDateTimeChange = (selection: DateTimeSelection) => {
    setDateTimeSelection(selection);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll permissions");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setEventImage({
        uri: asset.uri,
        type: "image/jpeg",
        name: `event-${Date.now()}.jpg`,
      });
    }
  };

  const removeImage = () => setEventImage(null);

  const handlePresetSelect = (value: string) => {
    setMaxParticipants(value);
    setCustomParticipants("");
  };

  const applyCustomParticipants = () => {
    if (
      customParticipants &&
      !isNaN(Number(customParticipants)) &&
      Number(customParticipants) > 0
    ) {
      setMaxParticipants(customParticipants);
    }
  };

  const clearParticipants = () => {
    setMaxParticipants("");
    setCustomParticipants("");
  };

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      Alert.alert("Missing Title", "Please enter an event name");
      return;
    }
    if (!dateTimeSelection) {
      Alert.alert(
        "Missing Date/Time",
        "Please select when your event will happen",
      );
      return;
    }
    if (!location) {
      Alert.alert(
        "Missing Location",
        "Please tap on the map to set event location",
      );
      return;
    }

    const payload: CreateEventPayload = {
      title: eventTitle.trim(),
      description: description.trim(),
      interestId: category || "",
      maxParticipants: maxParticipants ? Number(maxParticipants) : 0,
      thumbnailUploadRequest: eventImage || null,
      locationName:
        locationName ||
        `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
      },
      startScheduledTo: dateTimeSelection.startDateTime.toISOString(),
      endScheduledTo: dateTimeSelection.endDateTime.toISOString(),
    };

    try {
      await createEvent(payload);
      Alert.alert("Event Created! 🎉", "Your event is live and ready to go", [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error("Create event error:", err);

      let errorMessage = "Failed to create event. Please try again.";
      if (err.response?.status === 405) {
        errorMessage = "Method not allowed. Please check the API endpoint.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      Alert.alert("Error", errorMessage);
    }
  };

  const displayCategories = categories.length > 0 ? categories : CATEGORIES;

  const selectedCategory =
    categories.find((c) => c.id === category) ||
    CATEGORIES.find((c) => c.id === category);

  const canCreate =
    eventTitle.trim() && dateTimeSelection && location && !loading;

  const hasExtrasData = !!(
    description ||
    category ||
    maxParticipants ||
    eventImage
  );

  const isCustomParticipant =
    maxParticipants &&
    !PARTICIPANT_PRESETS.some((p) => p.value === maxParticipants);

  return (
    <>
      <StatusBar style="dark" />
      <Container backgroundColor={URBAN_COLORS.background}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
            >
              <Ionicons
                name="close"
                size={28}
                color={URBAN_COLORS.textPrimary}
              />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Create Event</Text>
            </View>
            <View style={{ width: 28 }} />
          </View>

          {/* REQUIRED SECTION */}
          <View style={styles.requiredSection}>
            <View style={styles.sectionLabelContainer}>
              <View style={styles.requiredBadge}>
                <Ionicons name="flash" size={14} color="#fff" />
              </View>
              <Text style={styles.sectionLabelRequired}>MUST HAVE</Text>
            </View>

            {/* Event Title */}
            <View style={styles.field}>
              <InputHeading
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="What's happening?"
              />
            </View>

            {/* Category */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <View style={styles.iconWrapperRequired}>
                  <Ionicons name="grid-outline" size={20} color="#fff" />
                </View>
                <Text
                  style={[
                    styles.fieldTitleRequired,
                    category && styles.fieldTitleOptionalActive,
                  ]}
                >
                  Choose interest category
                </Text>
              </View>

              <View style={styles.categoryGrid}>
                {displayCategories.map((cat) => {
                  const isSelected = category === cat.id;
                  const colorStr = rgbaToString(cat.color);

                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryCard,
                        isSelected && styles.categoryCardSelected,
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <View
                        style={[
                          styles.categoryIconWrapper,
                          {
                            backgroundColor: isSelected
                              ? colorStr
                              : `${colorStr}20`,
                          },
                        ]}
                      >
                        {/* ↓ SvgUri renders the real icon from API; Ionicons as fallback */}
                        {cat.icon?.url ? (
                          <SvgUri
                            uri={cat.icon.url}
                            width={21}
                            height={21}
                            color={isSelected ? "#fff" : colorStr}
                          />
                        ) : (
                          <Ionicons
                            name="grid-outline"
                            size={20}
                            color={isSelected ? "#fff" : "#9CA3AF"}
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.categoryLabel,
                          isSelected && styles.categoryLabelSelected,
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* When (Date & Time) */}
            <View style={styles.field}>
              <QuickDateTime
                categoryLabel={selectedCategory?.label}
                onDateTimeChange={handleDateTimeChange}
              />
            </View>

            {/* Location */}
            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <View style={styles.iconWrapperRequired}>
                  <Ionicons name="location-sharp" size={20} color="#fff" />
                </View>
                <Text style={styles.fieldTitleRequired}>Where?</Text>
              </View>

              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: 56.9496,
                  longitude: 24.1052,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                onPress={(e) => handleMapPress(e.nativeEvent.coordinate)}
              >
                {location && (
                  <Marker
                    coordinate={location}
                    draggable
                    onDragEnd={(e) => handleMapPress(e.nativeEvent.coordinate)}
                    title={locationName || "Event Location"}
                  />
                )}
              </MapView>

              {fetchingLocationName && (
                <View style={styles.locationLoadingContainer}>
                  <ActivityIndicator
                    size="small"
                    color={URBAN_COLORS.primary}
                  />
                  <Text style={styles.locationLoadingText}>
                    Finding spot...
                  </Text>
                </View>
              )}

              {locationName && !fetchingLocationName && (
                <View style={styles.locationNameContainer}>
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  <Text style={styles.locationNameText}>{locationName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* COLLAPSIBLE DIVIDER */}
          <TouchableOpacity
            style={styles.dividerContainer}
            onPress={() => setExtrasExpanded(!extrasExpanded)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.dividerLine,
                hasExtrasData && styles.dividerLineActive,
              ]}
            />
            <View
              style={[
                styles.dividerTextContainer,
                hasExtrasData && styles.dividerTextContainerActive,
              ]}
            >
              <Text
                style={[
                  styles.dividerText,
                  hasExtrasData && styles.dividerTextActive,
                ]}
              >
                EXTRAS
              </Text>
              <Ionicons
                name={extrasExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={hasExtrasData ? "#10B981" : "#9CA3AF"}
              />
            </View>
            <View
              style={[
                styles.dividerLine,
                hasExtrasData && styles.dividerLineActive,
              ]}
            />
          </TouchableOpacity>

          {/* OPTIONAL SECTION */}
          {extrasExpanded && (
            <View style={styles.optionalSection}>
              <View style={styles.sectionLabelContainer}>
                <View
                  style={[
                    styles.optionalBadge,
                    hasExtrasData && styles.optionalBadgeActive,
                  ]}
                >
                  <Ionicons
                    name={hasExtrasData ? "checkmark-circle" : "add-circle"}
                    size={14}
                    color={hasExtrasData ? "#fff" : "#6B7280"}
                  />
                </View>
                <Text
                  style={[
                    styles.sectionLabelOptional,
                    hasExtrasData && styles.sectionLabelOptionalActive,
                  ]}
                >
                  {hasExtrasData ? "LOOKING GOOD!" : "SPICE IT UP (OPTIONAL)"}
                </Text>
              </View>

              {/* Description */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.iconWrapperOptional,
                      description && styles.iconWrapperOptionalActive,
                    ]}
                  >
                    <Ionicons
                      name="chatbox-ellipses-outline"
                      size={18}
                      color={description ? "#fff" : "#6B7280"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.fieldTitleOptional,
                      description && styles.fieldTitleOptionalActive,
                    ]}
                  >
                    Tell us more
                  </Text>
                </View>
                <InputDescription
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What should people know?"
                />
              </View>

              {/* Max Participants */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.iconWrapperOptional,
                      maxParticipants && styles.iconWrapperOptionalActive,
                    ]}
                  >
                    <Ionicons
                      name="people"
                      size={18}
                      color={maxParticipants ? "#fff" : "#6B7280"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.fieldTitleOptional,
                      maxParticipants && styles.fieldTitleOptionalActive,
                    ]}
                  >
                    Squad size
                  </Text>
                </View>

                <View style={styles.participantPresetsContainer}>
                  {PARTICIPANT_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.value}
                      style={[
                        styles.presetChip,
                        maxParticipants === preset.value &&
                          styles.presetChipActive,
                      ]}
                      onPress={() => handlePresetSelect(preset.value)}
                    >
                      <Text
                        style={[
                          styles.presetChipText,
                          maxParticipants === preset.value &&
                            styles.presetChipTextActive,
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.customInputWrapper}>
                  <View style={styles.customInputContainer}>
                    <TextInput
                      style={styles.customInput}
                      value={customParticipants}
                      onChangeText={setCustomParticipants}
                      placeholder="Or enter custom number..."
                      keyboardType="number-pad"
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      style={[
                        styles.applyButton,
                        (!customParticipants ||
                          isNaN(Number(customParticipants))) &&
                          styles.applyButtonDisabled,
                      ]}
                      onPress={applyCustomParticipants}
                      disabled={
                        !customParticipants || isNaN(Number(customParticipants))
                      }
                    >
                      <Text style={styles.applyButtonText}>Set</Text>
                    </TouchableOpacity>
                  </View>

                  {isCustomParticipant && (
                    <View style={styles.customSelectedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#10B981"
                      />
                      <Text style={styles.customSelectedText}>
                        {maxParticipants} people selected
                      </Text>
                      <TouchableOpacity onPress={clearParticipants}>
                        <Ionicons
                          name="close-circle"
                          size={18}
                          color="#EF4444"
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {!maxParticipants && (
                  <View style={styles.unlimitedBadge}>
                    <Ionicons name="infinite" size={18} color="#10B981" />
                    <Text style={styles.unlimitedText}>
                      No limit - everyone's welcome!
                    </Text>
                  </View>
                )}
              </View>

              {/* Event Image */}
              <View style={styles.field}>
                <View style={styles.fieldHeader}>
                  <View
                    style={[
                      styles.iconWrapperOptional,
                      eventImage && styles.iconWrapperOptionalActive,
                    ]}
                  >
                    <Ionicons
                      name="camera"
                      size={18}
                      color={eventImage ? "#fff" : "#6B7280"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.fieldTitleOptional,
                      eventImage && styles.fieldTitleOptionalActive,
                    ]}
                  >
                    Cover photo
                  </Text>
                </View>

                {eventImage ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image
                      source={{ uri: eventImage.uri }}
                      style={styles.imagePreview}
                    />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={removeImage}
                    >
                      <Ionicons name="trash" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.imageUploadButton}
                    onPress={pickImage}
                  >
                    <View style={styles.uploadIconWrapper}>
                      <Ionicons
                        name="image-outline"
                        size={32}
                        color="#9CA3AF"
                      />
                    </View>
                    <Text style={styles.imageUploadText}>Add a vibe</Text>
                    <Text style={styles.imageUploadSubtext}>
                      Make it stand out
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Create Button */}
          <TouchableOpacity
            onPress={handleCreateEvent}
            disabled={!canCreate}
            style={[
              styles.submit,
              {
                backgroundColor: canCreate ? URBAN_COLORS.primary : "#D1D5DB",
                opacity: canCreate ? 1 : 0.6,
              },
            ]}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.submitText}>
                  {canCreate ? "Drop the event! 🔥" : "Fill required fields"}
                </Text>
                {canCreate && (
                  <View style={styles.submitIcon}>
                    <Ionicons name="rocket" size={18} color="#fff" />
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </Container>
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 24,
  },
  closeButton: {
    width: 28,
    height: 28,
  },
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: URBAN_COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  requiredSection: {
    marginBottom: 12,
  },
  optionalSection: {
    marginBottom: 24,
  },
  sectionLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 2,
  },
  requiredBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: URBAN_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  optionalBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  optionalBadgeActive: {
    backgroundColor: "#10B981",
  },
  sectionLabelRequired: {
    fontSize: 12,
    fontWeight: "900",
    color: URBAN_COLORS.primary,
    letterSpacing: 1.2,
  },
  sectionLabelOptional: {
    fontSize: 12,
    fontWeight: "800",
    color: "#6B7280",
    letterSpacing: 1.2,
  },
  sectionLabelOptionalActive: {
    color: "#10B981",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 28,
    paddingHorizontal: 2,
  },
  dividerLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#E5E7EB",
  },
  dividerLineActive: {
    backgroundColor: "#10B981",
  },
  dividerTextContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    gap: 6,
  },
  dividerTextContainerActive: {
    backgroundColor: "#ECFDF5",
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#9CA3AF",
    letterSpacing: 1.5,
  },
  dividerTextActive: {
    color: "#10B981",
  },
  field: {
    marginBottom: 24,
  },
  fieldHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrapperRequired: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: URBAN_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  iconWrapperOptional: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconWrapperOptionalActive: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  fieldTitleRequired: {
    fontSize: 17,
    fontWeight: "800",
    color: URBAN_COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  fieldTitleOptional: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: -0.2,
  },
  fieldTitleOptionalActive: {
    color: URBAN_COLORS.textPrimary,
    fontWeight: "800",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryCardSelected: {
    backgroundColor: "#FFF",
    borderColor: URBAN_COLORS.primary,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#9CA3AF",
  },
  categoryLabelSelected: {
    color: URBAN_COLORS.textPrimary,
  },
  participantPresetsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  presetChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    borderWidth: 2,
    borderColor: "transparent",
    gap: 4,
  },
  presetChipActive: {
    backgroundColor: URBAN_COLORS.primary,
    borderColor: URBAN_COLORS.primary,
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  presetChipText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6B7280",
  },
  presetChipTextActive: {
    color: "#fff",
  },
  customInputWrapper: {
    gap: 10,
  },
  customInputContainer: {
    flexDirection: "row",
    gap: 10,
  },
  customInput: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    fontSize: 16,
    fontWeight: "600",
    color: URBAN_COLORS.textPrimary,
  },
  applyButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: URBAN_COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  applyButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  customSelectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    gap: 8,
  },
  customSelectedText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  unlimitedBadge: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    gap: 8,
  },
  unlimitedText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#059669",
  },
  imageUploadButton: {
    height: 200,
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  imageUploadText: {
    fontSize: 15,
    fontWeight: "700",
    color: URBAN_COLORS.textPrimary,
  },
  imageUploadSubtext: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
    marginTop: 2,
  },
  imagePreviewContainer: {
    position: "relative",
  },
  imagePreview: {
    width: "100%",
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  removeImageButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  map: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  locationLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    gap: 8,
  },
  locationLoadingText: {
    fontSize: 13,
    color: "#D97706",
    fontWeight: "700",
  },
  locationNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 14,
    backgroundColor: "#ECFDF5",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#A7F3D0",
    gap: 8,
  },
  locationNameText: {
    flex: 1,
    fontSize: 14,
    color: "#059669",
    fontWeight: "800",
  },
  submit: {
    flexDirection: "row",
    padding: 20,
    borderRadius: 16,
    marginTop: 24,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: URBAN_COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
    gap: 10,
  },
  submitText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.3,
  },
  submitIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
});

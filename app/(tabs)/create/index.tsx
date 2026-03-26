// app/(tabs)/events/create.tsx
import { QuickDateTime } from "@/components/ui/datetime/QuickDateTime";
import InputDescription from "@/components/ui/inputs/input-description";
import { useAuth } from "@/hooks/context/AuthContext";
import { DateTimeSelection } from "@/utils/dateTimeHelpers";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "expo-router";
import { StatusBar } from "expo-status-bar";
import MapView, { Marker } from "react-native-maps";
import { SvgUri } from "react-native-svg";
import {
  CategoryOption,
  rgbaToString,
} from "../../../components/ui/buttons/DropdownButtons";
import {
  CreateEventPayload,
  useCreateEvent,
} from "../../../hooks/events/useEventsCreate";
import { fetchInterests } from "../../../hooks/interests/getInterests";

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceAlt: "#F4F4F4",
  border: "#EBEBEB",
  borderMid: "#D8D8D8",
  text: "#111111",
  textSub: "#555555",
  textMuted: "#AAAAAA",
  coral: "#FF6B58",
  coralLight: "rgba(255,107,88,0.10)",
  coralBorder: "rgba(255,107,88,0.30)",
  success: "#1A9E6A",
  successLight: "rgba(26,158,106,0.08)",
  successBorder: "rgba(26,158,106,0.25)",
  ink: "#1A1A1A",
  chalk: "#F0EEE9",
  overlay: "rgba(17,17,17,0.6)",
} as const;

// ─── Constants ─────────────────────────────────────────────────────────────────

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { id: "1", label: "Sports", color: { r: 59, g: 130, b: 246, a: 1 } },
  { id: "2", label: "Music", color: { r: 139, g: 92, b: 246, a: 1 } },
  { id: "3", label: "Networking", color: { r: 16, g: 185, b: 129, a: 1 } },
  { id: "4", label: "Workshop", color: { r: 245, g: 158, b: 11, a: 1 } },
  { id: "5", label: "Social", color: { r: 99, g: 102, b: 241, a: 1 } },
  { id: "custom", label: "Custom", color: { r: 80, g: 80, b: 80, a: 1 } },
];

// Per-label icons for the category card grid
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Sports: "football-outline",
  Music: "musical-notes-outline",
  Networking: "people-outline",
  Workshop: "construct-outline",
  Social: "happy-outline",
  Custom: "pencil-outline",
};

const PARTICIPANT_PRESETS = ["5", "10", "15", "20", "30", "50"];

const STEPS = [
  { key: "basics", icon: "flash-outline" as const, label: "Basics" },
  { key: "when", icon: "calendar-outline" as const, label: "When" },
  { key: "where", icon: "location-outline" as const, label: "Where" },
  { key: "details", icon: "layers-outline" as const, label: "Details" },
  { key: "cover", icon: "image-outline" as const, label: "Cover" },
];

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function CreateEvent() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { createEvent, loading } = useCreateEvent(user?.accessToken || null);

  const [currentStep, setCurrentStep] = useState(0);
  const stepAnim = useRef(new Animated.Value(0)).current;

  // Fields
  const [eventTitle, setEventTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [maxParticipants, setMaxParticipants] = useState("");
  const [customParticipants, setCustomParticipants] = useState("");
  const [customCategoryText, setCustomCategoryText] = useState(""); // always visible
  const [eventImage, setEventImage] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);
  const [dateTimeSelection, setDateTimeSelection] =
    useState<DateTimeSelection | null>(null);

  // Category dropdown
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  // Location
  const mapRef = useRef<MapView>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [locationName, setLocationName] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [fetchingLocationName, setFetchingLocationName] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Animated
  const titleFocusAnim = useRef(new Animated.Value(0)).current;
  const customCatFocusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchInterests(user?.accessToken || null).then((res) => {
      if (res?.length) setCategories(res);
    });
  }, [user?.accessToken]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const displayCategories =
    categories.length > 0 ? categories : FALLBACK_CATEGORIES;
  const selectedCat = displayCategories.find((c) => c.id === category);
  const isCustomSelected = category === "custom";
  const isLastStep = currentStep === STEPS.length - 1;

  const canAdvanceStep = () => {
    if (currentStep === 0) {
      if (!eventTitle.trim()) return false;
      const hasCat = category !== "" && !isCustomSelected;
      const hasCustom =
        isCustomSelected && customCategoryText.trim().length > 0;
      const typedCustom =
        category === "" && customCategoryText.trim().length > 0;
      if (!hasCat && !hasCustom && !typedCustom) return false;
      return true;
    }
    if (currentStep === 1) return dateTimeSelection !== null;
    if (currentStep === 2) return location !== null;
    return true;
  };

  const canCreate = !!(
    eventTitle.trim() &&
    (!isCustomSelected && category
      ? true
      : customCategoryText.trim().length > 0) &&
    dateTimeSelection &&
    location &&
    !loading
  );

  const progressWidth = stepAnim.interpolate({
    inputRange: STEPS.map((_, i) => i),
    outputRange: STEPS.map((_, i) => `${((i + 1) / STEPS.length) * 100}%`),
  });

  const goToStep = (next: number) => {
    Animated.spring(stepAnim, {
      toValue: next,
      useNativeDriver: false,
      tension: 130,
      friction: 16,
    }).start();
    setCurrentStep(next);
  };

  // ── Location ──────────────────────────────────────────────────────────────────

  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchingLocation(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setSearchingLocation(false);
      }
    }, 350);
  };

  const handleSuggestionSelect = (item: NominatimResult) => {
    const coords = {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
    };
    const label = item.display_name.split(",").slice(0, 2).join(",").trim();
    setLocation(coords);
    setLocationName(label);
    setLocationSearch(label);
    setSuggestions([]);
    setShowSuggestions(false);
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 },
      600,
    );
  };

  const reverseGeocode = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setFetchingLocationName(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
      );
      const data = await res.json();
      const a = data.address;
      const name =
        a?.building ||
        a?.amenity ||
        a?.leisure ||
        (a?.road ? `${a.house_number || ""} ${a.road}`.trim() : "") ||
        a?.neighbourhood ||
        a?.suburb ||
        a?.city ||
        a?.town ||
        a?.village ||
        `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      setLocationName(name);
      setLocationSearch(name);
    } catch {
      const f = `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
      setLocationName(f);
      setLocationSearch(f);
    } finally {
      setFetchingLocationName(false);
    }
  };

  const handleMapPress = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setSuggestions([]);
    setShowSuggestions(false);
    setLocation(coords);
    await reverseGeocode(coords);
  };

  // ── Image ─────────────────────────────────────────────────────────────────────

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please grant camera roll access");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setEventImage({
        uri: a.uri,
        type: "image/jpeg",
        name: `event-${Date.now()}.jpg`,
      });
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!eventTitle.trim() || !dateTimeSelection || !location) return;

    const payload: CreateEventPayload = {
      title: eventTitle.trim(),
      description: description.trim() || undefined,
      // Only pass a real interestId if a non-custom category is selected
      interestId: !isCustomSelected && category ? category : "",
      // Pass customInterestName whenever the user typed something in the custom field
      customInterestName: customCategoryText.trim() || undefined,
      maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
      thumbnailUploadRequest: eventImage || null,
      locationName:
        locationName ||
        `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      location: { latitude: location.latitude, longitude: location.longitude },
      startScheduledTo: dateTimeSelection.startDateTime.toISOString(),
      endScheduledTo: dateTimeSelection.endDateTime?.toISOString(),
    };

    try {
      await createEvent(payload);
      Alert.alert(
        "Event created!",
        "People can now find and join your event.",
        [{ text: "Let's go!", onPress: () => navigation.goBack() }],
      );
    } catch (err: any) {
      let msg = "Something went wrong. Please try again.";
      if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.message) msg = err.message;
      Alert.alert("Couldn't create event", msg);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 0 — Basics
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBasics = () => {
    const filtered = displayCategories.filter((c) =>
      c.label.toLowerCase().includes(categorySearch.toLowerCase()),
    );

    return (
      <View style={styles.stepBody}>
        <View style={styles.streetLabel}>
          <Text style={styles.streetLabelText}>01 — BASICS</Text>
        </View>
        <Text style={styles.stepTitle}>What's your event?</Text>
        <Text style={styles.stepSubtitle}>Name it, tag it — done.</Text>

        {/* ── Title ── */}
        <View style={styles.titleBlock}>
          <TextInput
            style={styles.titleInput}
            value={eventTitle}
            onChangeText={setEventTitle}
            placeholder="Event name..."
            placeholderTextColor={C.textMuted}
            maxLength={60}
            autoFocus
            onFocus={() =>
              Animated.timing(titleFocusAnim, {
                toValue: 1,
                duration: 180,
                useNativeDriver: false,
              }).start()
            }
            onBlur={() =>
              Animated.timing(titleFocusAnim, {
                toValue: 0,
                duration: 180,
                useNativeDriver: false,
              }).start()
            }
          />
          <Animated.View
            style={[
              styles.titleUnderline,
              {
                backgroundColor: titleFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [C.border, C.coral],
                }),
                height: titleFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 2],
                }),
              },
            ]}
          />
          <Text style={styles.charCount}>{eventTitle.length} / 60</Text>
        </View>

        {/* ── Category — dropdown with card grid inside ── */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Category</Text>

          <TouchableOpacity
            style={[
              styles.dropdownTrigger,
              categoryDropdownOpen && styles.dropdownTriggerOpen,
            ]}
            onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            activeOpacity={0.8}
          >
            {selectedCat ? (
              <View style={styles.dropdownTriggerContent}>
                {selectedCat.icon?.url ? (
                  <SvgUri
                    uri={selectedCat.icon.url}
                    width={15}
                    height={15}
                    color={C.text}
                  />
                ) : (
                  <View
                    style={[
                      styles.dropdownDot,
                      { backgroundColor: rgbaToString(selectedCat.color) },
                    ]}
                  />
                )}
                <Text style={styles.dropdownTriggerText}>
                  {selectedCat.label}
                </Text>
              </View>
            ) : (
              <Text style={styles.dropdownTriggerPlaceholder}>
                Select a category
              </Text>
            )}
            <Ionicons
              name={categoryDropdownOpen ? "chevron-up" : "chevron-down"}
              size={15}
              color={C.textMuted}
            />
          </TouchableOpacity>

          {categoryDropdownOpen && (
            <View style={styles.dropdownPanel}>
              {/* Inline search */}
              <View style={styles.dropdownSearch}>
                <Ionicons name="search-outline" size={14} color={C.textMuted} />
                <TextInput
                  style={styles.dropdownSearchInput}
                  value={categorySearch}
                  onChangeText={setCategorySearch}
                  placeholder="Search..."
                  placeholderTextColor={C.textMuted}
                  returnKeyType="done"
                />
                {categorySearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setCategorySearch("")}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name="close-circle"
                      size={14}
                      color={C.textMuted}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {filtered.length === 0 ? (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>Nothing found</Text>
                </View>
              ) : (
                <View style={styles.catGrid}>
                  {filtered.map((cat) => {
                    const colorStr = rgbaToString(cat.color);
                    const isSelected = category === cat.id;
                    const iconName = cat.icon?.url
                      ? null
                      : (CATEGORY_ICONS[cat.label] ?? "grid-outline");
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.catCard,
                          isSelected && {
                            borderColor: colorStr,
                            backgroundColor: `${colorStr}14`,
                          },
                        ]}
                        onPress={() => {
                          setCategory(isSelected ? "" : cat.id);
                          setCategoryDropdownOpen(false);
                          setCategorySearch("");
                        }}
                        activeOpacity={0.75}
                      >
                        <View
                          style={[
                            styles.catCardIcon,
                            {
                              backgroundColor: isSelected
                                ? colorStr
                                : C.surfaceAlt,
                            },
                          ]}
                        >
                          {cat.icon?.url ? (
                            <SvgUri
                              uri={cat.icon.url}
                              width={17}
                              height={17}
                              color={isSelected ? "#fff" : colorStr}
                            />
                          ) : (
                            <Ionicons
                              name={iconName!}
                              size={16}
                              color={isSelected ? "#fff" : colorStr}
                            />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.catCardLabel,
                            isSelected && {
                              color: colorStr,
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {cat.label}
                        </Text>
                        {isSelected && (
                          <View
                            style={[
                              styles.catCardCheck,
                              { backgroundColor: colorStr },
                            ]}
                          >
                            <Ionicons name="checkmark" size={8} color="#fff" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ── Custom category — always visible from the start ── */}
        <View style={styles.inputGroup}>
          <View style={styles.customCatLabelRow}>
            <Text style={styles.inputLabel}>Your own tag</Text>
            <Text style={styles.customCatLabelNote}>
              {isCustomSelected ? "required for Custom" : "optional"}
            </Text>
          </View>
          <Animated.View
            style={[
              styles.customCatWrapper,
              {
                borderColor: customCatFocusAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [C.border, C.borderMid],
                }),
              },
            ]}
          >
            <Ionicons
              name="pricetag-outline"
              size={14}
              color={customCategoryText ? C.coral : C.textMuted}
              style={{ marginLeft: 14 }}
            />
            <TextInput
              style={styles.customCatInput}
              value={customCategoryText}
              onChangeText={setCustomCategoryText}
              placeholder="e.g. Skate session, Rooftop yoga..."
              placeholderTextColor={C.textMuted}
              maxLength={40}
              onFocus={() =>
                Animated.timing(customCatFocusAnim, {
                  toValue: 1,
                  duration: 160,
                  useNativeDriver: false,
                }).start()
              }
              onBlur={() =>
                Animated.timing(customCatFocusAnim, {
                  toValue: 0,
                  duration: 160,
                  useNativeDriver: false,
                }).start()
              }
            />
            {customCategoryText.length > 0 && (
              <TouchableOpacity
                onPress={() => setCustomCategoryText("")}
                style={{ marginRight: 12 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </Animated.View>
          {customCategoryText.length > 0 && (
            <View style={styles.customTagPreview}>
              <View style={styles.customTagDot} />
              <Text style={styles.customTagPreviewText}>
                "{customCategoryText}"
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — When
  // ─────────────────────────────────────────────────────────────────────────────
  const renderWhen = () => (
    <View style={styles.stepBody}>
      <View style={styles.streetLabel}>
        <Text style={styles.streetLabelText}>02 — WHEN</Text>
      </View>
      <Text style={styles.stepTitle}>Pick a time</Text>
      <Text style={styles.stepSubtitle}>
        Start time required — end is optional
      </Text>

      {dateTimeSelection && (
        <View style={styles.timeConfirm}>
          <View style={styles.timeConfirmDot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.timeConfirmDate}>
              {dateTimeSelection.startDateTime.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
            <Text style={styles.timeConfirmTime}>
              {dateTimeSelection.startDateTime.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {dateTimeSelection.endDateTime
                ? ` → ${dateTimeSelection.endDateTime.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                : ""}
            </Text>
          </View>
          <Ionicons
            name="checkmark-circle-outline"
            size={18}
            color={C.success}
          />
        </View>
      )}

      <QuickDateTime
        categoryLabel={displayCategories.find((c) => c.id === category)?.label}
        onDateTimeChange={setDateTimeSelection}
      />
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — Where
  // ─────────────────────────────────────────────────────────────────────────────
  const renderWhere = () => (
    <View style={styles.stepBody}>
      <View style={styles.streetLabel}>
        <Text style={styles.streetLabelText}>03 — WHERE</Text>
      </View>
      <Text style={styles.stepTitle}>Set the spot</Text>
      <Text style={styles.stepSubtitle}>Search or tap the map to pin it</Text>

      <View style={{ zIndex: 20, marginBottom: 12 }}>
        <View
          style={[
            styles.searchBar,
            showSuggestions && suggestions.length > 0 && styles.searchBarOpen,
          ]}
        >
          {searchingLocation ? (
            <ActivityIndicator
              size="small"
              color={C.coral}
              style={{ marginHorizontal: 2 }}
            />
          ) : (
            <Ionicons
              name="search-outline"
              size={16}
              color={locationSearch ? C.coral : C.textMuted}
            />
          )}
          <TextInput
            style={styles.searchInput}
            value={locationSearch}
            onChangeText={(t) => {
              setLocationSearch(t);
              fetchSuggestions(t);
            }}
            placeholder="Search address or place..."
            placeholderTextColor={C.textMuted}
            returnKeyType="search"
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {locationSearch.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setLocationSearch("");
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.dropdown}>
            {suggestions.map((item, i) => (
              <TouchableOpacity
                key={`${item.lat}-${item.lon}`}
                style={[
                  styles.suggestionRow,
                  i < suggestions.length - 1 && styles.suggestionBorder,
                ]}
                onPress={() => handleSuggestionSelect(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={14} color={C.coral} />
                <Text style={styles.suggestionText} numberOfLines={2}>
                  {item.display_name.split(",").slice(0, 3).join(",").trim()}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={13}
                  color={C.borderMid}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <MapView
        ref={mapRef}
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
        <View style={styles.locationRow}>
          <ActivityIndicator size="small" color={C.coral} />
          <Text style={styles.locationRowText}>Locating...</Text>
        </View>
      )}
      {locationName && !fetchingLocationName && (
        <View style={[styles.locationRow, styles.locationRowSet]}>
          <Ionicons name="location" size={14} color={C.success} />
          <Text
            style={[styles.locationRowText, { color: C.success, flex: 1 }]}
            numberOfLines={1}
          >
            {locationName}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setLocation(null);
              setLocationName("");
              setLocationSearch("");
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close-circle-outline"
              size={16}
              color={C.textMuted}
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3 — Details
  // ─────────────────────────────────────────────────────────────────────────────
  const renderDetails = () => (
    <View style={styles.stepBody}>
      <View style={styles.streetLabel}>
        <Text style={styles.streetLabelText}>04 — DETAILS</Text>
      </View>
      <Text style={styles.stepTitle}>A few extras</Text>
      <Text style={styles.stepSubtitle}>Both optional — skip freely</Text>

      <View style={styles.detailSection}>
        <View style={styles.detailSectionHeader}>
          <Text style={styles.detailSectionTitle}>Spots available</Text>
          <Text style={styles.detailSectionNote}>optional</Text>
        </View>
        <View style={styles.presetRow}>
          {PARTICIPANT_PRESETS.map((val) => (
            <TouchableOpacity
              key={val}
              style={[
                styles.presetChip,
                maxParticipants === val && styles.presetChipActive,
              ]}
              onPress={() => {
                setMaxParticipants(maxParticipants === val ? "" : val);
                setCustomParticipants("");
              }}
            >
              <Text
                style={[
                  styles.presetChipText,
                  maxParticipants === val && styles.presetChipTextActive,
                ]}
              >
                {val === "50" ? "50+" : val}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.customCatWrapper}>
          <TextInput
            style={styles.customCatInput}
            value={customParticipants}
            onChangeText={(v) => {
              setCustomParticipants(v);
              if (v && !isNaN(Number(v)) && Number(v) > 0)
                setMaxParticipants(v);
              else if (!v) setMaxParticipants("");
            }}
            placeholder="Custom number..."
            keyboardType="number-pad"
            placeholderTextColor={C.textMuted}
          />
        </View>
        {maxParticipants ? (
          <View style={styles.statusRow}>
            <Text style={styles.statusText}>{maxParticipants} spots</Text>
            <TouchableOpacity
              onPress={() => {
                setMaxParticipants("");
                setCustomParticipants("");
              }}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="close-circle-outline"
                size={15}
                color={C.textMuted}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: C.textMuted }]}>
              Open — no limit
            </Text>
          </View>
        )}
      </View>

      <View style={styles.detailSection}>
        <View style={styles.detailSectionHeader}>
          <Text style={styles.detailSectionTitle}>Description</Text>
          <Text style={styles.detailSectionNote}>optional</Text>
        </View>
        <InputDescription
          value={description}
          onChangeText={setDescription}
          placeholder="What should attendees know? Keep it short."
        />
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4 — Cover (fully redesigned)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderCover = () => (
    <View style={styles.stepBody}>
      <View style={styles.streetLabel}>
        <Text style={styles.streetLabelText}>05 — COVER</Text>
      </View>
      <Text style={styles.stepTitle}>Add a cover</Text>
      <Text style={styles.stepSubtitle}>Make it stand out in the feed</Text>

      {eventImage ? (
        <View style={styles.coverPreviewCard}>
          <Image
            source={{ uri: eventImage.uri }}
            style={styles.coverPreviewImage}
            resizeMode="cover"
          />
          {/* Bottom scrim */}
          <View style={styles.coverPreviewScrim} />
          {/* Urban COVER tag */}
          <View style={styles.coverCornerTag}>
            <Text style={styles.coverCornerTagText}>COVER</Text>
          </View>
          {/* Action buttons floating bottom-right */}
          <View style={styles.coverActionsRow}>
            <TouchableOpacity
              style={styles.coverActionBtn}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="swap-horizontal-outline" size={13} color="#fff" />
              <Text style={styles.coverActionBtnText}>Replace</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.coverActionBtn, styles.coverActionBtnDanger]}
              onPress={() => setEventImage(null)}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={13} color="#fff" />
              <Text style={styles.coverActionBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.coverUploadZone}
          onPress={pickImage}
          activeOpacity={0.8}
        >
          {/* Urban corner brackets */}
          <View style={[styles.cornerBracket, styles.cornerTL]} />
          <View style={[styles.cornerBracket, styles.cornerTR]} />
          <View style={[styles.cornerBracket, styles.cornerBL]} />
          <View style={[styles.cornerBracket, styles.cornerBR]} />

          <View style={styles.coverUploadInner}>
            <View style={styles.coverUploadIcon}>
              <Ionicons name="image-outline" size={26} color={C.textMuted} />
            </View>
            <Text style={styles.coverUploadTitle}>Upload cover photo</Text>
            <Text style={styles.coverUploadSub}>
              16:9 · JPG or PNG · optional
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Tip rows */}
      <View style={styles.coverTips}>
        <View style={styles.coverTipRow}>
          <Ionicons name="eye-outline" size={13} color={C.textMuted} />
          <Text style={styles.coverTipText}>Wide crops work best in feeds</Text>
        </View>
        <View style={styles.coverTipRow}>
          <Ionicons name="trending-up-outline" size={13} color={C.textMuted} />
          <Text style={styles.coverTipText}>
            Events with covers get more joins
          </Text>
        </View>
      </View>
    </View>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar style="dark" />

      {/* ── Top bar ── */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() =>
            currentStep > 0 ? goToStep(currentStep - 1) : navigation.goBack()
          }
        >
          <Ionicons name="chevron-back" size={19} color={C.text} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={styles.topTitle}>New event</Text>
        </View>
        <View style={styles.stepCounter}>
          <Text style={styles.stepCounterText}>
            {currentStep + 1}
            <Text style={{ color: C.textMuted }}>/{STEPS.length}</Text>
          </Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: progressWidth }]}
        />
      </View>

      {/* ── Step indicators — icon pills + connector lines ── */}
      <View style={styles.stepRow}>
        {STEPS.map((s, i) => {
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <React.Fragment key={s.key}>
              {i > 0 && (
                <View
                  style={[
                    styles.stepConnector,
                    done && styles.stepConnectorDone,
                  ]}
                />
              )}
              <TouchableOpacity
                onPress={() => i < currentStep && goToStep(i)}
                disabled={i > currentStep}
                style={styles.stepItem}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.stepIconPill,
                    active && styles.stepIconPillActive,
                    done && styles.stepIconPillDone,
                  ]}
                >
                  {done ? (
                    <Ionicons name="checkmark" size={11} color="#fff" />
                  ) : (
                    <Ionicons
                      name={s.icon}
                      size={11}
                      color={active ? "#fff" : C.textMuted}
                    />
                  )}
                </View>
                {active && <Text style={styles.stepItemLabel}>{s.label}</Text>}
              </TouchableOpacity>
            </React.Fragment>
          );
        })}
      </View>

      {/* ── Step content ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {currentStep === 0 && renderBasics()}
          {currentStep === 1 && renderWhen()}
          {currentStep === 2 && renderWhere()}
          {currentStep === 3 && renderDetails()}
          {currentStep === 4 && renderCover()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bottom CTA ── */}
      <View style={styles.bottomBar}>
        {!isLastStep ? (
          <TouchableOpacity
            style={[
              styles.nextBtn,
              !canAdvanceStep() && styles.nextBtnDisabled,
            ]}
            onPress={() => canAdvanceStep() && goToStep(currentStep + 1)}
            disabled={!canAdvanceStep()}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.nextBtnText,
                !canAdvanceStep() && styles.nextBtnTextDisabled,
              ]}
            >
              {currentStep === 0 && "Continue"}
              {currentStep === 1 && "Set the location"}
              {currentStep === 2 && "Add details"}
              {currentStep === 3 && "Add a cover"}
            </Text>
            {canAdvanceStep() && (
              <Ionicons name="arrow-forward" size={15} color={C.coral} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.createBtn, !canCreate && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={!canCreate}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.createBtnText}>Create event</Text>
                <View style={styles.createBtnAccent} />
              </>
            )}
          </TouchableOpacity>
        )}

        {!canAdvanceStep() && !isLastStep && (
          <Text style={styles.ctaHint}>
            {currentStep === 0
              ? !eventTitle.trim()
                ? "Enter an event name to continue"
                : "Pick a category or type your own tag"
              : "Complete the step above to continue"}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  topCenter: { flex: 1, alignItems: "center" },
  topTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: C.text,
    letterSpacing: -0.1,
  },
  stepCounter: { width: 34, alignItems: "flex-end" },
  stepCounterText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.3,
  },

  // ── Progress bar
  progressTrack: {
    height: 1.5,
    backgroundColor: C.border,
    marginHorizontal: 18,
    borderRadius: 1,
    overflow: "hidden",
  },
  progressFill: { height: 1.5, backgroundColor: C.coral, borderRadius: 1 },

  // ── Step indicator row
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  stepConnector: {
    flex: 1,
    height: 1.5,
    backgroundColor: C.border,
    marginHorizontal: 4,
  },
  stepConnectorDone: { backgroundColor: C.success },
  stepItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  stepIconPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
  },
  stepIconPillActive: { backgroundColor: C.ink, borderColor: C.ink },
  stepIconPillDone: { backgroundColor: C.success, borderColor: C.success },
  stepItemLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: 0.1,
  },

  // ── Scroll
  scrollContainer: { paddingBottom: 20 },

  // ── Step body
  stepBody: { padding: 20, paddingTop: 16 },
  streetLabel: { alignSelf: "flex-start", marginBottom: 10 },
  streetLabelText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2.5,
    color: C.textMuted,
    textTransform: "uppercase",
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: C.text,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: C.textSub,
    marginBottom: 26,
    lineHeight: 20,
  },

  // ── Title input
  titleBlock: { marginBottom: 28 },
  titleInput: {
    fontSize: 22,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.4,
    paddingVertical: 8,
    paddingHorizontal: 0,
    backgroundColor: "transparent",
    minHeight: 48,
  },
  titleUnderline: { width: "100%", marginTop: 2 },
  charCount: {
    fontSize: 11,
    fontWeight: "500",
    color: C.textMuted,
    textAlign: "right",
    marginTop: 5,
  },

  // ── Input group
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.textMuted,
    marginBottom: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  // ── Category dropdown trigger
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  dropdownTriggerOpen: {
    borderColor: C.borderMid,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  dropdownTriggerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dropdownTriggerText: { fontSize: 15, fontWeight: "600", color: C.text },
  dropdownTriggerPlaceholder: {
    fontSize: 15,
    fontWeight: "400",
    color: C.textMuted,
  },
  dropdownDot: { width: 10, height: 10, borderRadius: 5 },

  // ── Dropdown panel
  dropdownPanel: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: C.borderMid,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  dropdownSearch: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dropdownSearchInput: {
    flex: 1,
    fontSize: 14,
    color: C.text,
    paddingVertical: 2,
  },
  dropdownEmpty: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  dropdownEmptyText: { fontSize: 13, fontWeight: "500", color: C.textMuted },

  // ── Category card grid
  catGrid: { flexDirection: "row", flexWrap: "wrap", padding: 10, gap: 8 },
  catCard: {
    width: (SCREEN_WIDTH - 40 - 20 - 16) / 2 - 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: "transparent",
    position: "relative",
  },
  catCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  catCardLabel: { flex: 1, fontSize: 13, fontWeight: "600", color: C.textSub },
  catCardCheck: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
  },

  // ── Custom category — always visible
  customCatLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  customCatLabelNote: {
    fontSize: 10,
    fontWeight: "500",
    color: C.textMuted,
    letterSpacing: 0.2,
  },
  customCatWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    overflow: "hidden",
  },
  customCatInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 13,
    fontSize: 15,
    fontWeight: "500",
    color: C.text,
  },
  customTagPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  customTagDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: C.coral,
  },
  customTagPreviewText: { fontSize: 12, fontWeight: "600", color: C.coral },

  // ── When step
  timeConfirm: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: C.successLight,
    borderWidth: 1,
    borderColor: C.successBorder,
    marginBottom: 20,
  },
  timeConfirmDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.success,
  },
  timeConfirmDate: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.1,
  },
  timeConfirmTime: {
    fontSize: 13,
    fontWeight: "500",
    color: C.textSub,
    marginTop: 2,
  },

  // ── Where step
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
    paddingHorizontal: 14,
    gap: 10,
  },
  searchBarOpen: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderColor: C.borderMid,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "400",
    color: C.text,
    paddingVertical: 14,
  },
  dropdown: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: C.borderMid,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 10,
  },
  suggestionBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  suggestionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: C.text,
    lineHeight: 20,
  },
  map: {
    width: "100%",
    height: 230,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 10,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
  },
  locationRowSet: {
    backgroundColor: C.successLight,
    borderColor: C.successBorder,
  },
  locationRowText: { fontSize: 13, fontWeight: "500", color: C.textSub },

  // ── Details step
  detailSection: {
    marginBottom: 20,
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    padding: 16,
  },
  detailSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.1,
  },
  detailSectionNote: {
    fontSize: 11,
    fontWeight: "500",
    color: C.textMuted,
    letterSpacing: 0.3,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  presetChip: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: C.surfaceAlt,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  presetChipActive: { backgroundColor: C.ink, borderColor: C.ink },
  presetChipText: { fontSize: 13, fontWeight: "600", color: C.textSub },
  presetChipTextActive: { color: "#fff" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  statusText: { flex: 1, fontSize: 13, fontWeight: "600", color: C.text },

  // ── Cover step
  coverPreviewCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: C.border,
    marginBottom: 16,
  },
  coverPreviewImage: { width: "100%", height: 210 },
  coverPreviewScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  coverCornerTag: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: C.coral,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 5,
  },
  coverCornerTagText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 1.5,
  },
  coverActionsRow: {
    position: "absolute",
    bottom: 12,
    right: 12,
    flexDirection: "row",
    gap: 8,
  },
  coverActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(26,26,26,0.82)",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  coverActionBtnDanger: { backgroundColor: "rgba(229,57,53,0.82)" },
  coverActionBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  coverUploadZone: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.border,
    borderStyle: "dashed",
    backgroundColor: C.chalk,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    position: "relative",
  },
  coverUploadInner: { alignItems: "center", gap: 6 },
  coverUploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.border,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  coverUploadTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.text,
    letterSpacing: -0.1,
  },
  coverUploadSub: { fontSize: 12, fontWeight: "400", color: C.textMuted },

  // Corner bracket decoration
  cornerBracket: {
    position: "absolute",
    width: 18,
    height: 18,
    borderColor: C.borderMid,
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
    borderBottomRightRadius: 4,
  },

  coverTips: { gap: 7 },
  coverTipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  coverTipText: { fontSize: 12, fontWeight: "400", color: C.textMuted },

  // ── Bottom bar
  bottomBar: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.coralBorder,
    gap: 8,
  },
  nextBtnDisabled: {
    backgroundColor: C.surfaceAlt,
    borderColor: "transparent",
  },
  nextBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: C.coral,
    letterSpacing: -0.1,
  },
  nextBtnTextDisabled: { color: C.textMuted },
  createBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: C.ink,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    overflow: "hidden",
    position: "relative",
  },
  createBtnDisabled: { backgroundColor: C.surfaceAlt },
  createBtnText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  createBtnAccent: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: C.coral,
  },
  ctaHint: {
    fontSize: 12,
    fontWeight: "400",
    color: C.textMuted,
    textAlign: "center",
    marginTop: 8,
  },
});

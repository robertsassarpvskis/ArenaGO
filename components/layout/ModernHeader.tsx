import { useLocation } from "@/hooks/useLocation";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  coral: "#FF5A45",
  coralLight: "rgba(255,90,69,0.11)",
  coralBorder: "rgba(255,90,69,0.28)",
  ink: "#0D0D0D",
  ink80: "#2A2A2A",
  ink60: "#5C5C5C",
  ink40: "#A0A0A0",
  ink10: "rgba(0,0,0,0.045)",
  inkHair: "rgba(0,0,0,0.08)",
  white: "#FFFFFF",
  surface: "#F5F5F5",
  padH: 20,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface FilterChip {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}
export interface TimeFilterChip {
  id: string;
  label: string;
}
export interface DistanceFilterChip {
  id: string;
  label: string;
  km?: number;
}

export const DEFAULT_FILTERS: FilterChip[] = [
  { id: "all", label: "All", icon: "apps-outline" },
  { id: "sport", label: "Sport", icon: "football-outline" },
  { id: "social", label: "Social", icon: "people-outline" },
  { id: "culture", label: "Culture", icon: "color-palette-outline" },
  { id: "food", label: "Food", icon: "restaurant-outline" },
  { id: "outdoor", label: "Outdoor", icon: "leaf-outline" },
];

export const DEFAULT_TIME_FILTERS: TimeFilterChip[] = [
  { id: "anytime", label: "Anytime" },
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "weekend", label: "Weekend" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
];

export const DEFAULT_DISTANCE_FILTERS: DistanceFilterChip[] = [
  { id: "any", label: "Any", km: 0 },
  { id: "1km", label: "1 km", km: 1 },
  { id: "5km", label: "5 km", km: 5 },
  { id: "10km", label: "10 km", km: 10 },
  { id: "25km", label: "25 km", km: 25 },
];

type ViewMode = "discover" | "friends" | "created";

interface FeedHeaderProps {
  city?: string;
  filters?: FilterChip[];
  activeFilter?: string;
  onFilterChange?: (id: string) => void;
  timeFilters?: TimeFilterChip[];
  activeTimeFilter?: string;
  onTimeFilterChange?: (id: string) => void;
  distanceFilters?: DistanceFilterChip[];
  activeDistanceFilter?: string;
  onDistanceFilterChange?: (id: string) => void;
  notificationCount?: number;
  onNotificationPress?: () => void;
  onCityPress?: () => void;
  onSavePress?: () => void;
  isSaved?: boolean;
  currentView?: ViewMode;
  onViewChange?: (view: ViewMode) => void;
  scrollY?: Animated.Value;
}

const TOP_BAR_H = 60;

const VIEW_OPTIONS: {
  value: ViewMode;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}[] = [
  {
    value: "discover",
    label: "Discover",
    icon: "compass-outline",
    description: "Events around you",
  },
  {
    value: "friends",
    label: "With friends",
    icon: "people-outline",
    description: "What your friends join",
  },
  {
    value: "created",
    label: "Created by me",
    icon: "sparkles-outline",
    description: "Your hosted events",
  },
];

// ─── Snap Slider ──────────────────────────────────────────────────────────────
const THUMB = 26;

interface SnapSliderProps {
  steps: DistanceFilterChip[];
  activeId: string;
  onChange: (id: string) => void;
}

function SnapSlider({ steps, activeId, onChange }: SnapSliderProps) {
  const trackW = useRef(0);
  const thumbX = useRef(new Animated.Value(0)).current;
  const activeIdx = steps.findIndex((s) => s.id === activeId);

  const xFor = (idx: number, w: number) =>
    steps.length <= 1 ? 0 : (idx / (steps.length - 1)) * (w - THUMB);

  useEffect(() => {
    if (!trackW.current) return;
    Animated.spring(thumbX, {
      toValue: xFor(activeIdx, trackW.current),
      useNativeDriver: true,
      damping: 22,
      stiffness: 320,
      mass: 0.7,
    }).start();
  }, [activeIdx]);

  const onLayout = (e: LayoutChangeEvent) => {
    trackW.current = e.nativeEvent.layout.width;
    thumbX.setValue(xFor(activeIdx, trackW.current));
  };

  const onPress = (e: GestureResponderEvent) => {
    const ratio = Math.max(
      0,
      Math.min(1, e.nativeEvent.locationX / trackW.current),
    );
    onChange(steps[Math.round(ratio * (steps.length - 1))].id);
  };

  return (
    <View style={sl.wrap}>
      <Pressable style={sl.hitArea} onPress={onPress}>
        <View style={sl.track} onLayout={onLayout}>
          <Animated.View
            style={[sl.fill, { width: Animated.add(thumbX, THUMB / 2) }]}
          />
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                sl.dot,
                {
                  left:
                    steps.length <= 1
                      ? 0
                      : (`${(i / (steps.length - 1)) * 100}%` as any),
                },
                i <= activeIdx && sl.dotOn,
              ]}
            />
          ))}
          <Animated.View
            style={[sl.thumb, { transform: [{ translateX: thumbX }] }]}
          >
            <View style={sl.thumbCore} />
          </Animated.View>
        </View>
      </Pressable>
      <View style={sl.labelRow}>
        {steps.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => onChange(s.id)}
            activeOpacity={0.7}
            style={sl.labelBtn}
          >
            <Text style={[sl.labelTxt, s.id === activeId && sl.labelTxtOn]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const sl = StyleSheet.create({
  wrap: { paddingTop: 2 },
  hitArea: { paddingVertical: 12 },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.inkHair,
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    backgroundColor: C.coral,
  },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.ink40,
    marginLeft: -3,
    top: -1,
  },
  dotOn: { backgroundColor: C.coral },
  thumb: {
    position: "absolute",
    top: -(THUMB / 2 - 2),
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: C.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: C.coral,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  labelBtn: { alignItems: "center", flex: 1 },
  labelTxt: { fontSize: 11, color: C.ink40, fontWeight: "500" },
  labelTxtOn: { color: C.coral, fontWeight: "700" },
});

// ─── Filter Sheet ─────────────────────────────────────────────────────────────
interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: FilterChip[];
  activeFilter: string;
  timeFilters: TimeFilterChip[];
  activeTimeFilter: string;
  distanceFilters: DistanceFilterChip[];
  activeDistanceFilter: string;
  onApply: (category: string, time: string, distance: string) => void;
}

function FilterSheet({
  visible,
  onClose,
  filters,
  activeFilter,
  timeFilters,
  activeTimeFilter,
  distanceFilters,
  activeDistanceFilter,
  onApply,
}: FilterSheetProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  const [pendCat, setPendCat] = useState(activeFilter);
  const [pendTime, setPendTime] = useState(activeTimeFilter);
  const [pendDist, setPendDist] = useState(activeDistanceFilter);

  useEffect(() => {
    if (visible) {
      setPendCat(activeFilter);
      setPendTime(activeTimeFilter);
      setPendDist(activeDistanceFilter);
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 28,
          stiffness: 300,
          mass: 0.85,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const dismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const apply = () => {
    onApply(pendCat, pendTime, pendDist);
    dismiss();
  };
  const reset = () => {
    setPendCat("all");
    setPendTime("anytime");
    setPendDist("any");
  };

  const sheetY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [500, 0],
  });

  const count =
    (pendCat !== "all" ? 1 : 0) +
    (pendTime !== "anytime" ? 1 : 0) +
    (pendDist !== "any" ? 1 : 0);

  const dirty = count > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {/* Backdrop */}
      <Animated.View
        style={[sh.backdrop, { opacity: backdropAnim }]}
        pointerEvents="box-none"
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={dismiss} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={[
          sh.sheet,
          { paddingBottom: Math.max(insets.bottom, 16) },
          { transform: [{ translateY: sheetY }] },
        ]}
      >
        {Platform.OS === "ios" && (
          <BlurView
            intensity={84}
            tint="light"
            style={[StyleSheet.absoluteFillObject, { borderRadius: 28 }]}
          />
        )}
        {Platform.OS === "android" && (
          <View style={[StyleSheet.absoluteFillObject, sh.bgAndroid]} />
        )}

        {/* Handle */}
        <View style={sh.handleWrap}>
          <View style={sh.handle} />
        </View>

        {/* Header row */}
        <View style={sh.header}>
          <Text style={sh.title}>Filters</Text>
          <TouchableOpacity
            onPress={reset}
            disabled={!dirty}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Text style={[sh.resetTxt, !dirty && sh.resetDim]}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* ── Category ─────────────────────────────────────────── */}
        <View style={sh.sec}>
          <Text style={sh.secLabel}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sh.chipRow}
            decelerationRate="fast"
          >
            {filters.map((f) => {
              const on = pendCat === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[sh.chip, on && sh.chipOn]}
                  onPress={() => setPendCat(f.id)}
                  activeOpacity={0.65}
                >
                  <Ionicons
                    name={f.icon}
                    size={13}
                    color={on ? C.coral : C.ink60}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[sh.chipTxt, on && sh.chipTxtOn]}>
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={sh.div} />

        {/* ── When ─────────────────────────────────────────────── */}
        <View style={sh.sec}>
          <Text style={sh.secLabel}>When</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={sh.chipRow}
            decelerationRate="fast"
          >
            {timeFilters.map((tf) => {
              const on = pendTime === tf.id;
              return (
                <TouchableOpacity
                  key={tf.id}
                  style={[sh.chip, on && sh.chipOn]}
                  onPress={() => setPendTime(tf.id)}
                  activeOpacity={0.65}
                >
                  <Text style={[sh.chipTxt, on && sh.chipTxtOn]}>
                    {tf.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={sh.div} />

        {/* ── Distance ─────────────────────────────────────────── */}
        <View style={sh.sec}>
          <View style={sh.distRow}>
            <Text style={sh.secLabel}>Distance</Text>
            <Text style={sh.distVal}>
              {distanceFilters.find((d) => d.id === pendDist)?.label ?? "Any"}
            </Text>
          </View>
          <SnapSlider
            steps={distanceFilters}
            activeId={pendDist}
            onChange={setPendDist}
          />
        </View>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <View style={sh.ctaWrap}>
          <TouchableOpacity style={sh.cta} onPress={apply} activeOpacity={0.82}>
            <Text style={sh.ctaTxt}>
              {count > 0 ? `Show events · ${count}` : "Show events"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FeedHeader({
  city = "Milan",
  filters = DEFAULT_FILTERS,
  activeFilter = "all",
  onFilterChange,
  timeFilters = DEFAULT_TIME_FILTERS,
  activeTimeFilter = "anytime",
  onTimeFilterChange,
  distanceFilters = DEFAULT_DISTANCE_FILTERS,
  activeDistanceFilter = "any",
  onDistanceFilterChange,
  notificationCount = 0,
  onNotificationPress,
  onSavePress,
  isSaved = false,
  onCityPress,
  currentView = "discover",
  onViewChange,
  scrollY,
}: FeedHeaderProps) {
  const insets = useSafeAreaInsets();
  const { location: userLocation } = useLocation();

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const activeFilterCount =
    (activeFilter !== "all" ? 1 : 0) +
    (activeTimeFilter !== "anytime" ? 1 : 0) +
    (activeDistanceFilter !== "any" ? 1 : 0);

  const filterBtnScale = useRef(new Animated.Value(1)).current;

  const openFilters = () => {
    Animated.sequence([
      Animated.spring(filterBtnScale, {
        toValue: 0.88,
        useNativeDriver: true,
        damping: 15,
        stiffness: 400,
      }),
      Animated.spring(filterBtnScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 14,
        stiffness: 320,
      }),
    ]).start();
    setFilterSheetOpen(true);
  };

  const applyFilters = (cat: string, time: string, dist: string) => {
    onFilterChange?.(cat);
    onTimeFilterChange?.(time);
    onDistanceFilterChange?.(dist);
  };

  // dropdown
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(0)).current;

  const openDrop = () => {
    setDropdownOpen(true);
    Animated.parallel([
      Animated.spring(dropdownAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 260,
        mass: 0.8,
      }),
      Animated.spring(chevronAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }),
    ]).start();
  };
  const closeDrop = () => {
    Animated.parallel([
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(chevronAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 300,
      }),
    ]).start(() => setDropdownOpen(false));
  };
  const toggleDrop = () => (dropdownOpen ? closeDrop() : openDrop());

  // scroll collapse
  const lastSY = useRef(0);
  const hVisible = useRef(true);
  const collapseAnim = useRef(new Animated.Value(1)).current;

  const showHeader = useCallback(() => {
    if (hVisible.current) return;
    hVisible.current = true;
    Animated.timing(collapseAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [collapseAnim]);

  const hideHeader = useCallback(() => {
    if (!hVisible.current) return;
    hVisible.current = false;
    if (dropdownOpen) closeDrop();
    Animated.timing(collapseAnim, {
      toValue: 0,
      duration: 160,
      easing: Easing.in(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [collapseAnim, dropdownOpen]);

  useEffect(() => {
    if (!scrollY) return;
    const id = scrollY.addListener(({ value }) => {
      const delta = value - lastSY.current;
      lastSY.current = value;
      if (value < 8) {
        showHeader();
        return;
      }
      if (delta > 3) hideHeader();
      else if (delta < -3) showHeader();
    });
    return () => scrollY.removeListener(id);
  }, [scrollY, showHeader, hideHeader]);

  const elevation = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 20],
        outputRange: [0, 1],
        extrapolate: "clamp",
      })
    : 0;
  const barH = collapseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, TOP_BAR_H],
  });
  const barOp = collapseAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const dropScale = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const dropDY = dropdownAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 0],
  });
  const chevRot = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <>
      <Animated.View style={[s.container, { paddingTop: insets.top }]}>
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={72}
            tint="light"
            style={StyleSheet.absoluteFillObject}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFillObject,
              { backgroundColor: C.white },
            ]}
          />
        )}

        <View style={s.borderStatic} />
        <Animated.View style={[s.borderShadow, { opacity: elevation }]} />

        {/* Top bar */}
        <Animated.View
          style={{ height: barH, opacity: barOp, overflow: "hidden" }}
        >
          <View style={s.topBar}>
            {/* Location */}
            <TouchableOpacity
              style={s.locationPill}
              onPress={onCityPress}
              activeOpacity={0.7}
            >
              <Ionicons name="location-sharp" size={15} color={C.coral} />
              <Text style={s.locationTxt} numberOfLines={1}>
                {userLocation?.city || city}
              </Text>
              <Ionicons name="chevron-down" size={13} color={C.ink40} />
            </TouchableOpacity>

            {/* Center title */}
            <View style={s.centerAbs} pointerEvents="box-none">
              <TouchableOpacity
                style={s.titleBtn}
                onPress={toggleDrop}
                activeOpacity={0.8}
              >
                <Text style={[s.titleTxt, dropdownOpen && s.titleActive]}>
                  {VIEW_OPTIONS.find((o) => o.value === currentView)?.label ??
                    "Discover"}
                </Text>
                <Animated.View
                  style={{ transform: [{ rotate: chevRot }], marginLeft: 4 }}
                >
                  <Ionicons
                    name="chevron-down"
                    size={15}
                    color={dropdownOpen ? C.coral : C.ink60}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>

            {/* Right icons */}
            <View style={s.rightRow}>
              <Animated.View style={{ transform: [{ scale: filterBtnScale }] }}>
                <TouchableOpacity
                  style={[s.filterBtn, activeFilterCount > 0 && s.filterBtnOn]}
                  onPress={openFilters}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name="options-outline"
                    size={18}
                    color={activeFilterCount > 0 ? C.coral : C.ink60}
                  />
                  {activeFilterCount > 0 && (
                    <View style={s.filterBadge}>
                      <Text style={s.filterBadgeTxt}>{activeFilterCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={s.iconBtn}
                onPress={onNotificationPress}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    notificationCount > 0
                      ? "notifications"
                      : "notifications-outline"
                  }
                  size={18}
                  color={notificationCount > 0 ? C.coral : C.ink80}
                />
                {notificationCount > 0 && (
                  <View style={s.badge}>
                    <Text style={s.badgeTxt}>
                      {notificationCount > 9 ? "9+" : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Dropdown */}
        {dropdownOpen && (
          <Animated.View
            style={[
              s.dropdown,
              { top: insets.top + TOP_BAR_H + 6 },
              {
                opacity: dropdownAnim,
                transform: [{ scale: dropScale }, { translateY: dropDY }],
              },
            ]}
          >
            {Platform.OS === "ios" && (
              <BlurView
                intensity={60}
                tint="light"
                style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]}
              />
            )}
            <View style={s.dropInner}>
              {VIEW_OPTIONS.map((opt, idx) => {
                const on = currentView === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      s.dropRow,
                      idx < VIEW_OPTIONS.length - 1 && s.dropDiv,
                    ]}
                    onPress={() => {
                      closeDrop();
                      onViewChange?.(opt.value);
                    }}
                    activeOpacity={0.6}
                  >
                    <View style={[s.dropIcon, on && s.dropIconOn]}>
                      <Ionicons
                        name={opt.icon}
                        size={16}
                        color={on ? C.coral : C.ink60}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.dropLabel, on && s.dropLabelOn]}>
                        {opt.label}
                      </Text>
                      <Text style={s.dropDesc}>{opt.description}</Text>
                    </View>
                    {on && (
                      <View style={s.checkCircle}>
                        <Ionicons name="checkmark" size={11} color={C.coral} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}
      </Animated.View>

      <FilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        filters={filters}
        activeFilter={activeFilter}
        timeFilters={timeFilters}
        activeTimeFilter={activeTimeFilter}
        distanceFilters={distanceFilters}
        activeDistanceFilter={activeDistanceFilter}
        onApply={applyFilters}
      />
    </>
  );
}

// ─── Header styles ────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    backgroundColor: C.white,
    zIndex: 100,
    overflow: "visible",
  },
  borderStatic: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: C.coralBorder,
    zIndex: 1,
  },
  borderShadow: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(0,0,0,0.12)",
    zIndex: 2,
  },
  topBar: {
    height: TOP_BAR_H,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: C.padH,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
  },
  locationTxt: {
    fontSize: 13,
    fontWeight: "500",
    color: C.ink80,
    maxWidth: 96,
  },
  centerAbs: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  titleBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
  },
  titleTxt: {
    fontSize: 20,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.4,
  },
  titleActive: { color: C.coral },
  rightRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBtnOn: { backgroundColor: C.coralLight },
  filterBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: C.coral,
    borderWidth: 1.5,
    borderColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  filterBadgeTxt: { fontSize: 8, fontWeight: "800", color: C.white },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.coral,
    borderWidth: 2,
    borderColor: C.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  badgeTxt: { fontSize: 8, fontWeight: "800", color: C.white },
  dropdown: {
    position: "absolute",
    alignSelf: "center",
    width: 240,
    borderRadius: 20,
    zIndex: 500,
    overflow: Platform.OS === "ios" ? "hidden" : "visible",
    backgroundColor: Platform.OS === "android" ? C.white : "transparent",
    ...Platform.select({ android: { elevation: 16 } }),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.inkHair,
  },
  dropInner: {
    paddingVertical: 6,
    ...(Platform.OS !== "ios"
      ? {
          backgroundColor: C.white,
          borderRadius: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 24,
        }
      : {}),
  },
  dropRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  dropDiv: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.inkHair,
  },
  dropIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.ink10,
    alignItems: "center",
    justifyContent: "center",
  },
  dropIconOn: { backgroundColor: C.coralLight },
  dropLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: C.ink60,
    letterSpacing: -0.1,
    marginBottom: 1,
  },
  dropLabelOn: { color: C.ink },
  dropDesc: { fontSize: 11, color: C.ink40, fontWeight: "400" },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.coralLight,
    alignItems: "center",
    justifyContent: "center",
  },
});

// ─── Sheet styles ─────────────────────────────────────────────────────────────
const sh = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    zIndex: 200,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 300,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: Platform.OS === "ios" ? "hidden" : "visible",
    backgroundColor: C.white,
  },
  bgAndroid: {
    backgroundColor: C.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 2 },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0,0,0,0.12)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: C.padH,
    paddingTop: 8,
    paddingBottom: 10,
  },
  title: { fontSize: 17, fontWeight: "700", color: C.ink, letterSpacing: -0.3 },
  resetTxt: { fontSize: 13, fontWeight: "600", color: C.coral },
  resetDim: { color: C.ink40 },

  sec: { paddingHorizontal: C.padH, paddingTop: 12, paddingBottom: 14 },
  secLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.ink40,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  div: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: C.inkHair,
    marginHorizontal: C.padH,
  },

  chipRow: { gap: 7, paddingRight: C.padH },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    height: 32,
    borderRadius: 100,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipOn: { backgroundColor: C.coralLight, borderColor: C.coralBorder },
  chipTxt: { fontSize: 13, fontWeight: "500", color: C.ink60 },
  chipTxtOn: { color: C.coral, fontWeight: "700" },

  distRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  distVal: { fontSize: 13, fontWeight: "700", color: C.coral },

  ctaWrap: { paddingHorizontal: C.padH, paddingTop: 8, paddingBottom: 2 },
  cta: {
    height: 52,
    borderRadius: 16,
    backgroundColor: C.coral,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: C.white,
    letterSpacing: -0.2,
  },
});

import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
import { useAuth } from "../../hooks/context/AuthContext";

const { width } = Dimensions.get("window");

const API_BASE_URL = "http://217.182.74.113:30080";

// ─── Data ─────────────────────────────────────────────────────────────────────

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "lv", label: "Latvian", flag: "🇱🇻" },
  { code: "ru", label: "Russian", flag: "🇷🇺" },
  { code: "es", label: "Spanish", flag: "🇪🇸" },
  { code: "fr", label: "French", flag: "🇫🇷" },
  { code: "de", label: "German", flag: "🇩🇪" },
  { code: "pt", label: "Portuguese", flag: "🇵🇹" },
  { code: "zh", label: "Chinese", flag: "🇨🇳" },
  { code: "ar", label: "Arabic", flag: "🇸🇦" },
  { code: "ja", label: "Japanese", flag: "🇯🇵" },
];

const INTERESTS = [
  { id: "sport", label: "Sport", icon: "⚡" },
  { id: "music", label: "Music", icon: "🎵" },
  { id: "art", label: "Art", icon: "🎨" },
  { id: "tech", label: "Tech", icon: "💻" },
  { id: "food", label: "Food", icon: "🍜" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "fashion", label: "Fashion", icon: "👟" },
  { id: "film", label: "Film", icon: "🎬" },
  { id: "gaming", label: "Gaming", icon: "🎮" },
  { id: "fitness", label: "Fitness", icon: "🏋️" },
  { id: "books", label: "Books", icon: "📚" },
  { id: "events", label: "Events", icon: "🔥" },
  { id: "hiking", label: "Hiking", icon: "🥾" },
  { id: "cycling", label: "Cycling", icon: "🚴" },
];

// ─── Progress bar ──────────────────────────────────────────────────────────────

const ProgressBar = ({
  current,
  total,
}: {
  current: number;
  total: number;
}) => {
  const progress = useRef(new Animated.Value((current - 1) / total)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: current / total,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [current]);

  const widthInterp = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={prog.track}>
      <Animated.View style={[prog.fill, { width: widthInterp }]} />
    </View>
  );
};

const prog = StyleSheet.create({
  track: {
    flex: 1,
    height: 4,
    backgroundColor: "#EDE8DF",
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: 4,
    backgroundColor: "#FF6B58",
    borderRadius: 2,
  },
});

// ─── Chip ──────────────────────────────────────────────────────────────────────

const Chip = ({
  label,
  prefix,
  active,
  onPress,
}: {
  label: string;
  prefix?: string;
  active: boolean;
  onPress: () => void;
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.94,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View
        style={[chip.base, active && chip.active, { transform: [{ scale }] }]}
      >
        {prefix ? <Text style={chip.prefix}>{prefix}</Text> : null}
        <Text style={[chip.label, active && chip.labelActive]}>{label}</Text>
        {active && <View style={chip.dot} />}
      </Animated.View>
    </TouchableOpacity>
  );
};

const chip = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EDE8DF",
    gap: 6,
  },
  active: {
    backgroundColor: "#FF6B58",
    borderColor: "#FF6B58",
  },
  prefix: { fontSize: 15 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: 0.1,
  },
  labelActive: { color: "#FFFFFF" },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginLeft: 2,
  },
});

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user, clearNewSignup } = useAuth();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 3;

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<any>(null);
  const [bio, setBio] = useState("");
  const [selectedLangs, setLangs] = useState<string[]>(["en"]);
  const [selectedTags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const avatarScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const animateTransition = (dir: "fwd" | "back", cb: () => void) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      slideAnim.setValue(dir === "fwd" ? 32 : -32);
      cb();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goNext = () => {
    if (step < TOTAL_STEPS)
      animateTransition("fwd", () => setStep((s) => s + 1));
    else handleFinish();
  };

  const goBack = () => {
    if (step > 1) animateTransition("back", () => setStep((s) => s - 1));
    else handleSkip();
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
      setAvatarFile(result.assets[0]);
      Animated.sequence([
        Animated.timing(avatarScale, {
          toValue: 1.1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(avatarScale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleSkip = () => {
    clearNewSignup();
    router.replace("/(tabs)");
  };

  // ─── API call ────────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    // Guard: must have user + username from auth context
    if (!user?.userName || !user?.accessToken) {
      Alert.alert("Error", "Session missing — please sign in again.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // 1. Avatar — binary file, field name must match exactly
      if (avatarFile?.uri) {
        const fileExt = avatarFile.uri.split(".").pop()?.toLowerCase() ?? "jpg";
        const mimeType = fileExt === "png" ? "image/png" : "image/jpeg";
        formData.append("ProfilePictureUpload", {
          uri: avatarFile.uri,
          name: `avatar.${fileExt}`,
          type: mimeType,
        } as any);
      }

      // 2. Bio — combine user text + interest hashtags
      const interestTags = selectedTags.map((id) => `#${id}`).join(" ");
      const fullBio = [bio.trim(), interestTags].filter(Boolean).join("\n\n");
      if (fullBio) {
        formData.append("Bio", fullBio);
      }

      // 3. PreferredLanguages — one entry per language (multipart array)
      const langs = selectedLangs.length > 0 ? selectedLangs : ["en"];
      langs.forEach((lang) => formData.append("PreferredLanguages", lang));

      // 4. Timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      formData.append("PreferredTimezone", timezone);

      console.log("[ProfileSetup] PUT /api/Users/" + user.userName);
      console.log("[ProfileSetup] langs:", langs);
      console.log("[ProfileSetup] bio:", fullBio);
      console.log("[ProfileSetup] avatar:", avatarFile?.uri ?? "none");

      // Username goes in the URL path — NOT in the form body
      const response = await fetch(
        `${API_BASE_URL}/api/Users/${encodeURIComponent(user.userName)}`,
        {
          method: "PUT",
          headers: {
            // DO NOT set Content-Type here — fetch sets it automatically
            // with the correct multipart boundary when body is FormData
            Authorization: `Bearer ${user.accessToken}`,
          },
          body: formData,
        },
      );

      const responseText = await response.text();
      console.log("[ProfileSetup] Response status:", response.status);
      console.log("[ProfileSetup] Response body:", responseText);

      if (!response.ok) {
        // Try to parse a readable error from the server
        let errorMsg = `Server error: ${response.status}`;
        try {
          const errJson = JSON.parse(responseText);
          if (errJson?.errors) {
            const firstGroup = Object.values(errJson.errors)[0];
            if (Array.isArray(firstGroup)) errorMsg = firstGroup[0] as string;
          } else if (errJson?.detail) {
            errorMsg = errJson.detail;
          } else if (errJson?.title) {
            errorMsg = errJson.title;
          }
        } catch {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      // Success — release the auth guard and enter the app
      clearNewSignup();
      router.replace("/(tabs)");
    } catch (err: any) {
      console.error("[ProfileSetup] Error:", err);
      Alert.alert(
        "Couldn't save profile",
        err?.message || "Something went wrong. Try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Step renders ─────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <View style={s.stepWrap}>
      <View style={s.avatarBlock}>
        <Text style={s.sectionEyebrow}>PROFILE PHOTO</Text>
        <Text style={s.stepHeading}>Show your face</Text>
        <Text style={s.stepMeta}>Optional — you can always add it later</Text>

        <View style={s.avatarOuter}>
          {!avatarUri && (
            <Animated.View
              style={[s.pulseRing, { transform: [{ scale: pulseAnim }] }]}
            />
          )}
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
            <Animated.View
              style={[s.avatarCircle, { transform: [{ scale: avatarScale }] }]}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={s.avatarImg} />
              ) : (
                <View style={s.avatarEmpty}>
                  <Ionicons name="camera" size={28} color="#FF6B58" />
                  <Text style={s.avatarEmptyLabel}>Add photo</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>

          {avatarUri && (
            <TouchableOpacity style={s.changeBtn} onPress={pickImage}>
              <Ionicons name="pencil" size={13} color="#FF6B58" />
              <Text style={s.changeBtnText}>Change</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={s.bioBlock}>
        <Text style={s.sectionEyebrow}>BIO</Text>
        <Text style={s.stepHeading}>About you</Text>
        <View style={s.bioCard}>
          <TextInput
            style={s.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Write something short about yourself..."
            placeholderTextColor="#BBAF9F"
            multiline
            maxLength={150}
          />
          <View style={s.bioFooter}>
            <View style={s.bioBar}>
              <View
                style={[
                  s.bioBarFill,
                  { width: `${(bio.length / 150) * 100}%` as any },
                ]}
              />
            </View>
            <Text style={s.bioCount}>{bio.length}/150</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={s.stepWrap}>
      <Text style={s.sectionEyebrow}>LANGUAGES</Text>
      <Text style={s.stepHeading}>You speak what?</Text>
      <Text style={s.stepMeta}>Select all that apply</Text>

      <View style={s.chipGrid}>
        {LANGUAGES.map((lang) => (
          <Chip
            key={lang.code}
            label={lang.label}
            prefix={lang.flag}
            active={selectedLangs.includes(lang.code)}
            onPress={() =>
              setLangs((prev) =>
                prev.includes(lang.code)
                  ? prev.filter((l) => l !== lang.code)
                  : [...prev, lang.code],
              )
            }
          />
        ))}
      </View>

      {selectedLangs.length > 0 && (
        <View style={s.selectionNote}>
          <Ionicons name="checkmark-circle" size={15} color="#FF6B58" />
          <Text style={s.selectionNoteText}>
            {selectedLangs.length} selected
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep3 = () => (
    <View style={s.stepWrap}>
      <Text style={s.sectionEyebrow}>INTERESTS</Text>
      <Text style={s.stepHeading}>What's your scene?</Text>
      <Text style={s.stepMeta}>
        We'll show you events you'll actually care about
      </Text>

      <View style={s.chipGrid}>
        {INTERESTS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            prefix={item.icon}
            active={selectedTags.includes(item.id)}
            onPress={() =>
              setTags((prev) =>
                prev.includes(item.id)
                  ? prev.filter((i) => i !== item.id)
                  : [...prev, item.id],
              )
            }
          />
        ))}
      </View>

      {selectedTags.length > 0 && (
        <View style={s.selectionNote}>
          <Ionicons name="checkmark-circle" size={15} color="#FF6B58" />
          <Text style={s.selectionNoteText}>{selectedTags.length} picked</Text>
        </View>
      )}
    </View>
  );

  const steps = [renderStep1, renderStep2, renderStep3];

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <>
      <StatusBar style="dark" />
      <View style={s.root}>
        <LinearGradient
          colors={["#FFFCF4", "#FFF8EE", "#FFFCF4"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={goBack}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#1A1A1A" />
          </TouchableOpacity>

          <View style={s.progressRow}>
            <ProgressBar current={step} total={TOTAL_STEPS} />
            <Text style={s.stepCounter}>
              {step}/{TOTAL_STEPS}
            </Text>
          </View>

          <TouchableOpacity
            style={s.skipBtn}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={s.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={s.scroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }}
            >
              {steps[step - 1]()}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* CTA */}
        <View style={s.cta}>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={goNext}
            activeOpacity={0.88}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={s.ctaBtnText}>
                {step === TOTAL_STEPS ? "Done →" : "Continue →"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#FFFCF4" },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 62 : 44,
    paddingBottom: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#EDE8DF",
    justifyContent: "center",
    alignItems: "center",
  },
  progressRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  stepCounter: {
    fontSize: 12,
    fontWeight: "700",
    color: "#BBAF9F",
    width: 28,
    textAlign: "right",
  },
  skipBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  skipText: { fontSize: 14, fontWeight: "600", color: "#BBAF9F" },

  scroll: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 8 },

  stepWrap: { gap: 20 },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FF6B58",
    letterSpacing: 2.5,
    marginBottom: -10,
  },
  stepHeading: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1A1A1A",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  stepMeta: {
    fontSize: 14,
    color: "#9A8F80",
    fontWeight: "500",
    marginTop: -8,
    lineHeight: 20,
  },

  // Avatar
  avatarBlock: { gap: 12, alignItems: "flex-start" },
  avatarOuter: {
    alignSelf: "center",
    alignItems: "center",
    marginTop: 8,
    gap: 14,
  },
  pulseRing: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: "#FF6B58",
    opacity: 0.2,
  },
  avatarCircle: {
    width: 116,
    height: 116,
    borderRadius: 58,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#EDE8DF",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarImg: { width: 116, height: 116, borderRadius: 58 },
  avatarEmpty: { alignItems: "center", gap: 6 },
  avatarEmptyLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF6B58",
    letterSpacing: 0.5,
  },
  changeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: "#FF6B58",
    backgroundColor: "#FFF5F3",
  },
  changeBtnText: { fontSize: 13, fontWeight: "700", color: "#FF6B58" },

  // Bio
  bioBlock: { gap: 12 },
  bioCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#EDE8DF",
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  bioInput: {
    fontSize: 15,
    color: "#1A1A1A",
    minHeight: 80,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  bioFooter: { flexDirection: "row", alignItems: "center", gap: 10 },
  bioBar: {
    flex: 1,
    height: 3,
    backgroundColor: "#EDE8DF",
    borderRadius: 2,
    overflow: "hidden",
  },
  bioBarFill: { height: 3, backgroundColor: "#FF6B58", borderRadius: 2 },
  bioCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#BBAF9F",
    width: 36,
    textAlign: "right",
  },

  // Chips
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectionNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  selectionNoteText: { fontSize: 13, fontWeight: "600", color: "#FF6B58" },

  // CTA
  cta: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 44 : 28,
    paddingTop: 12,
    backgroundColor: "#FFFCF4",
    borderTopWidth: 1,
    borderTopColor: "#F0EAE0",
  },
  ctaBtn: {
    backgroundColor: "#FF6B58",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaBtnText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
});

// app/(auth)/LoginScreen.tsx

import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Award,
  Crown,
  Heart,
  Lock,
  Star,
  Target,
  Trophy,
  User,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

const { width, height } = Dimensions.get("window");

/* ---------------- BACKGROUND ICONS ---------------- */

const backgroundIcons = [
  { Icon: Target, delay: 0, size: 52, top: "6%", left: "8%" },
  { Icon: Trophy, delay: 400, size: 48, top: "12%", right: "10%" },
  { Icon: Star, delay: 800, size: 50, top: "25%", left: "5%" },
  { Icon: Zap, delay: 1200, size: 46, top: "38%", right: "8%" },
  { Icon: Heart, delay: 1600, size: 52, top: "52%", left: "12%" },
  { Icon: Award, delay: 2000, size: 48, bottom: "28%", right: "6%" },
  { Icon: Crown, delay: 600, size: 50, bottom: "18%", left: "10%" },
  { Icon: Target, delay: 1400, size: 46, bottom: "8%", right: "15%" },
  { Icon: Trophy, delay: 1000, size: 52, top: "68%", right: "12%" },
  { Icon: Star, delay: 200, size: 48, top: "18%", left: "15%" },
  { Icon: Zap, delay: 1800, size: 50, bottom: "38%", left: "6%" },
  { Icon: Heart, delay: 1100, size: 46, top: "45%", right: "5%" },
];

/* ---------------- FLOATING ICON ---------------- */

const FloatingIcon = ({ Icon, delay = 0, size = 40, ...pos }: any) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -35,
            duration: 4500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.28,
            duration: 2250,
            delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 4500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.15,
            duration: 2250,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.floatingIcon,
        {
          opacity,
          transform: [{ translateY }],
          ...pos,
        },
      ]}
    >
      <Icon color="#FF6B58" size={size} strokeWidth={1.5} />
    </Animated.View>
  );
};

/* ---------------- LOGIN SCREEN ---------------- */

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const passwordRef = useRef<TextInput | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  const handleLogin = async () => {
    setErrorMessage(null);

    if (!identifier.trim() || !password.trim()) {
      const msg = "Please fill in all fields";
      setErrorMessage(msg);
      Alert.alert("Validation Error", msg);
      return;
    }

    setLoading(true);

    try {
      await login({
        userNameOrEmail: identifier.trim(),
        password: password.trim(),
      });
    } catch (error: any) {
      const msg = error?.message || "Login failed";
      setErrorMessage(msg);
      Alert.alert("Login Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LinearGradient
        colors={["#FFFCF4", "#FFF8E1", "#FFFCF4"]}
        style={styles.container}
      >
        {/* BACK BUTTON */}
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </TouchableOpacity>

        <View style={styles.backgroundIcons}>
          {backgroundIcons.map((item, index) => (
            <FloatingIcon key={index} {...item} />
          ))}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.content,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              <Text style={styles.title}>
                Welcome <Text style={styles.titleHighlight}>Back!</Text>
              </Text>

              {/* EMAIL */}
              <View style={styles.inputWrapper}>
                <User size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="Email or Username"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              {/* PASSWORD */}
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#999" />
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  placeholder="Password"
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={setPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible(!passwordVisible)}
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={20}
                    color="#999"
                  />
                </TouchableOpacity>
              </View>

              {errorMessage && (
                <Text style={{ color: "red", marginTop: 10 }}>
                  {errorMessage}
                </Text>
              )}

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.loginButtonText}>Sign In</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <StatusBar style="dark" />
    </>
  );
}

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1 },

  backgroundIcons: { ...StyleSheet.absoluteFillObject },
  floatingIcon: { position: "absolute" },

  backButton: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
    borderRadius: 14,
    elevation: 5,
  },

  scrollContent: { flexGrow: 1, padding: 24, justifyContent: "center" },
  content: { gap: 16 },

  title: { fontSize: 36, fontWeight: "800", color: "#1A1A1A" },
  titleHighlight: { color: "#FF6B58" },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    paddingHorizontal: 14,
    gap: 10,
  },

  input: { flex: 1, paddingVertical: 14, fontSize: 15 },

  loginButton: {
    backgroundColor: "#FF6B58",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 12,
  },

  loginButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});

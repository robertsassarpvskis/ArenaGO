import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Bike,
  BookOpen,
  Coffee,
  Dumbbell,
  Flame,
  Gamepad2,
  MapPin,
  Music,
  PartyPopper,
  Timer,
  Users,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { height, width } = Dimensions.get("window");

// Category Icons data with positions
const backgroundIconsData = [
  {
    id: "1",
    iconIndex: 0,
    size: 48,
    delay: 0,
    duration: 4000,
    top: "8%",
    left: "8%",
  },
  {
    id: "2",
    iconIndex: 1,
    size: 52,
    delay: 300,
    duration: 5200,
    top: "18%",
    right: "10%",
  },
  {
    id: "3",
    iconIndex: 2,
    size: 44,
    delay: 600,
    duration: 4600,
    top: "40%",
    left: "12%",
  },
  {
    id: "4",
    iconIndex: 3,
    size: 50,
    delay: 900,
    duration: 5400,
    top: "55%",
    right: "8%",
  },
  {
    id: "5",
    iconIndex: 4,
    size: 46,
    delay: 1200,
    duration: 4800,
    top: "72%",
    left: "10%",
  },
  {
    id: "6",
    iconIndex: 5,
    size: 54,
    delay: 1500,
    duration: 5600,
    bottom: "22%",
    right: "12%",
  },
  {
    id: "7",
    iconIndex: 6,
    size: 48,
    delay: 1800,
    duration: 4700,
    bottom: "12%",
    left: "15%",
  },
  {
    id: "8",
    iconIndex: 7,
    size: 42,
    delay: 400,
    duration: 5100,
    top: "30%",
    right: "5%",
  },
  {
    id: "9",
    iconIndex: 8,
    size: 50,
    delay: 1100,
    duration: 4900,
    bottom: "35%",
    left: "5%",
  },
];

// Category Icons for background
const categoryIcons = [
  { icon: Music, label: "Music" },
  { icon: Gamepad2, label: "Gaming" },
  { icon: Dumbbell, label: "Fitness" },
  { icon: BookOpen, label: "Learning" },
  { icon: Zap, label: "Energy" },
  { icon: Users, label: "People" },
  { icon: MapPin, label: "Nearby" },
  { icon: Flame, label: "Trending" },
  { icon: Timer, label: "Now" },
  { icon: PartyPopper, label: "Fun" },
  { icon: Coffee, label: "Hangout" },
  { icon: Bike, label: "Activity" },
];
// Floating Icon component
const FloatingIcon = ({
  delay = 0,
  duration = 3000,
  size = 40,
  iconIndex = 0,
}) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -40,
            duration: duration,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.35,
            duration: duration / 2,
            delay: delay,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const IconComponent = categoryIcons[iconIndex % categoryIcons.length].icon;

  return (
    <Animated.View
      style={[
        styles.iconParticle,
        {
          width: size,
          height: size,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <IconComponent color="#FF6B58" size={size} strokeWidth={1.5} />
    </Animated.View>
  );
};

export default function WelcomeScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Main entrance animation
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

    // Delayed footer fade
    Animated.timing(footerFade, {
      toValue: 1,
      duration: 600,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePrimaryPress = () => {
    router.push("/(auth)/SignUp");
  };

  return (
    <>
      <LinearGradient
        colors={["#fffcf4", "#fff5e6", "#fff8e1", "#fffcf4"]}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.container}
      >
        {/* Background Category Icons */}
        <View style={styles.iconContainer}>
          <View style={[styles.iconWrapper, { top: "10%", left: "8%" }]}>
            <FloatingIcon delay={0} duration={4000} size={50} iconIndex={0} />
          </View>
          <View style={[styles.iconWrapper, { top: "20%", right: "12%" }]}>
            <FloatingIcon delay={500} duration={5000} size={45} iconIndex={1} />
          </View>
          <View style={[styles.iconWrapper, { top: "50%", left: "15%" }]}>
            <FloatingIcon
              delay={1000}
              duration={4500}
              size={48}
              iconIndex={2}
            />
          </View>
          <View style={[styles.iconWrapper, { bottom: "25%", right: "10%" }]}>
            <FloatingIcon
              delay={1500}
              duration={5500}
              size={52}
              iconIndex={3}
            />
          </View>
          <View style={[styles.iconWrapper, { bottom: "15%", left: "12%" }]}>
            <FloatingIcon delay={800} duration={4800} size={46} iconIndex={4} />
          </View>
          <View style={[styles.iconWrapper, { top: "65%", right: "18%" }]}>
            <FloatingIcon delay={300} duration={5200} size={44} iconIndex={0} />
          </View>
          <View style={[styles.iconWrapper, { bottom: "40%", left: "20%" }]}>
            <FloatingIcon
              delay={1200}
              duration={4600}
              size={50}
              iconIndex={3}
            />
          </View>
          <View style={[styles.iconWrapper, { top: "35%", right: "25%" }]}>
            <FloatingIcon delay={600} duration={5300} size={42} iconIndex={5} />
          </View>
          <View style={[styles.iconWrapper, { bottom: "50%", right: "5%" }]}>
            <FloatingIcon
              delay={1400}
              duration={4700}
              size={48}
              iconIndex={6}
            />
          </View>
          <View style={[styles.iconWrapper, { top: "75%", left: "5%" }]}>
            <FloatingIcon delay={700} duration={5100} size={44} iconIndex={7} />
          </View>
          <View style={[styles.iconWrapper, { top: "12%", right: "35%" }]}>
            <FloatingIcon
              delay={1100}
              duration={4900}
              size={46}
              iconIndex={8}
            />
          </View>
          <View style={[styles.iconWrapper, { bottom: "8%", right: "20%" }]}>
            <FloatingIcon delay={900} duration={5400} size={50} iconIndex={9} />
          </View>
          <View style={[styles.iconWrapper, { top: "45%", right: "35%" }]}>
            <FloatingIcon
              delay={400}
              duration={4900}
              size={45}
              iconIndex={10}
            />
          </View>
          <View style={[styles.iconWrapper, { top: "28%", left: "25%" }]}>
            <FloatingIcon
              delay={1300}
              duration={5200}
              size={43}
              iconIndex={11}
            />
          </View>
          <View style={[styles.iconWrapper, { bottom: "32%", right: "28%" }]}>
            <FloatingIcon delay={550} duration={4700} size={48} iconIndex={0} />
          </View>
          <View style={[styles.iconWrapper, { top: "62%", left: "28%" }]}>
            <FloatingIcon
              delay={1050}
              duration={5300}
              size={46}
              iconIndex={1}
            />
          </View>
          <View style={[styles.iconWrapper, { bottom: "58%", left: "35%" }]}>
            <FloatingIcon delay={750} duration={4800} size={44} iconIndex={2} />
          </View>
          <View style={[styles.iconWrapper, { top: "18%", left: "40%" }]}>
            <FloatingIcon
              delay={1250}
              duration={5100}
              size={50}
              iconIndex={4}
            />
          </View>
          <View style={[styles.iconWrapper, { bottom: "20%", right: "40%" }]}>
            <FloatingIcon delay={650} duration={5400} size={42} iconIndex={5} />
          </View>
          <View style={[styles.iconWrapper, { top: "55%", right: "42%" }]}>
            <FloatingIcon
              delay={1150}
              duration={4900}
              size={47}
              iconIndex={6}
            />
          </View>
          <View style={[styles.iconWrapper, { bottom: "45%", left: "3%" }]}>
            <FloatingIcon delay={850} duration={5200} size={45} iconIndex={7} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Welcome Text */}
          <Animated.View
            style={[
              styles.welcomeSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.welcomeTitle}>
              Welcome to the{" "}
              <Text style={styles.welcomeTitleHighlight}>ArenaGO</Text>
            </Text>
            <Text style={styles.welcomeSubtitle}>
              Where every moment becomes a{" "}
              <Text style={styles.subtitleBold}>challenge</Text>, and every
              challenge becomes a <Text style={styles.subtitleBold}>story</Text>
            </Text>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePrimaryPress}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={["#FF6B58", "#FF8A7A", "#FF6B58"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonGradient}
              >
                <Text style={styles.primaryButtonText}>Get Started</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </LinearGradient>
            </TouchableOpacity>

              <View style={styles.divider} />

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/(auth)/LoginScreen")}
              activeOpacity={0.7}
            >
              <View style={styles.secondaryButtonInner}>
                <Text style={styles.secondaryButtonText}>
                  I Already Have an Account
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
    
            </View>

            {/* Social Sign-In Buttons */}
          
          </Animated.View>

          {/* Footer */}
          {/* <Animated.View style={[styles.footer, { opacity: footerFade }]}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{" "}
              <Text style={styles.footerLink}>Terms</Text> &{" "}
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Text>
          </Animated.View> */}
        </View>
      </LinearGradient>
      <StatusBar style="dark" animated />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iconContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  iconWrapper: {
    position: "absolute",
  },
  iconParticle: {
    justifyContent: "center",
    alignItems: "center",
  },
  blobContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  blob: {
    position: "absolute",
    borderRadius: 1000,
  },
  blob1: {
    width: 300,
    height: 300,
    backgroundColor: "rgba(255, 107, 88, 0.08)",
    top: -100,
    right: -50,
    opacity: 0.6,
  },
  blob2: {
    width: 250,
    height: 250,
    backgroundColor: "rgba(255, 138, 122, 0.1)",
    bottom: -80,
    left: -60,
    opacity: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 24,
    paddingTop: height * 0.15,
    paddingBottom: 40,
    zIndex: 2,
  },
  welcomeSection: {
    alignItems: "center",
    paddingHorizontal: 20,
    flex: 1,
    justifyContent: "center",
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 14,
    letterSpacing: 0.2,
    lineHeight: 38,
  },
  welcomeTitleHighlight: {
    color: "#FF6B58",
    fontWeight: "900",
  },
  welcomeSubtitle: {
    fontSize: 16,
    fontWeight: "400",
    color: "#666666",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  subtitleBold: {
    fontWeight: "700",
    color: "#1A1A1A",
  },
  buttonContainer: {
    gap: 12,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E8E8",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: "#999999",
    fontWeight: "700",
  },
  primaryButton: {
    borderRadius: 18,
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonGradient: {
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  buttonArrow: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  socialButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 4,
  },
  socialContainer: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#E8E8E8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FAFAFA",
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  secondaryButton: {
    backgroundColor: "transparent",
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "#FF6B58",
    marginTop: 4,
  },
  secondaryButtonInner: {
    flexDirection: "row",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#FF6B58",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.3,
    backgroundColor: "#fff4c",
  },
  footer: {
    alignItems: "center",
    marginTop: 24,
    gap: 10,
  },
  footerText: {
    fontSize: 12,
    color: "#999999",
    textAlign: "center",
    lineHeight: 18,
  },
  footerLink: {
    fontWeight: "700",
    color: "#1A1A1A",
  },
});

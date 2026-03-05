import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Award,
  Crown,
  Heart,
  Lock,
  Mail,
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

// Background icons array
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

interface SignUpData {
  userName: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: boolean;
  birthDate: string;
  preferredLanguages: string[];
  preferredTimeZone: string;
}

// Floating Icon Component
const FloatingIcon = ({
  Icon,
  delay = 0,
  size = 40,
  top,
  left,
  right,
  bottom,
}: any) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -35,
            duration: 4500,
            delay: delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.28,
            duration: 2250,
            delay: delay,
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
          top,
          left,
          right,
          bottom,
        },
      ]}
    >
      <Icon color="#FF6B58" size={size} strokeWidth={1.5} />
    </Animated.View>
  );
};

export default function SignUpScreen() {
  const router = useRouter();
  const { signup } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form data
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<boolean | null>(null);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const lastNameRef = useRef<TextInput>(null);
  const usernameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentStep]);

  const validateStep = () => {
    switch (currentStep) {
      case 1:
        if (!firstName.trim() || !lastName.trim()) {
          Alert.alert("Required", "Please enter your first and last name");
          return false;
        }
        return true;
      case 2:
        if (gender === null) {
          Alert.alert("Required", "Please select your gender");
          return false;
        }
        if (!day || !month || !year) {
          Alert.alert("Required", "Please enter your birth date");
          return false;
        }
        if (!validateDate(day, month, year)) {
          Alert.alert("Invalid Date", "Please enter a valid birth date");
          return false;
        }
        return true;
      case 3:
        if (!username.trim()) {
          Alert.alert("Required", "Please choose a username");
          return false;
        }
        if (!email.trim()) {
          Alert.alert("Required", "Please enter your email");
          return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
          Alert.alert("Invalid Email", "Please enter a valid email address");
          return false;
        }
        return true;
      case 4:
        if (!password.trim()) {
          Alert.alert("Required", "Please enter a password");
          return false;
        }
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          Alert.alert("Weak Password", passwordValidation.errors.join("\n"));
          return false;
        }
        if (password !== confirmPassword) {
          Alert.alert("Password Mismatch", "Passwords do not match");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 30,
            duration: 0,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentStep(currentStep + 1);
        });
      } else {
        handleSignUp();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -30,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(currentStep - 1);
      });
    } else {
      router.back();
    }
  };

  const validatePassword = (
    pwd: string,
  ): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push("Password must be at least 8 characters");
    if (!/\d/.test(pwd))
      errors.push("Password must have at least one digit (0-9)");
    if (!/[A-Z]/.test(pwd))
      errors.push("Password must have at least one uppercase letter (A-Z)");

    return { valid: errors.length === 0, errors };
  };

  const validateDate = (d: string, m: string, y: string): boolean => {
    if (!d || !m || !y) return false;
    const dayNum = parseInt(d);
    const monthNum = parseInt(m);
    const yearNum = parseInt(y);
    if (monthNum < 1 || monthNum > 12) return false;
    if (dayNum < 1) return false;
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (
      monthNum === 2 &&
      ((yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0)
    ) {
      daysInMonth[1] = 29;
    }
    return dayNum <= daysInMonth[monthNum - 1];
  };

  const handleSignUp = async () => {
    setLoading(true);
    try {
      // Build birth date as proper ISO string
      const birthDate = `${year.padStart(4, "0")}-${month.padStart(
        2,
        "0",
      )}-${day.padStart(2, "0")}T00:00:00Z`;
      const birthDateISO = new Date(birthDate).toISOString();

      // Create payload matching SignUpData interface
      const payload: SignUpData = {
        userName: username.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        gender: gender!, // true = male, false = female
        birthDate: birthDateISO,
        preferredLanguages: ["en"], // Backend language ID array
        preferredTimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };

      console.log("Signup payload:", payload);

      await signup(payload);
      router.replace("/(auth)/ProfileSetUp");

      // Navigation handled automatically by AuthContext
    } catch (error: any) {
      console.error("SignUp error:", error);
      Alert.alert("Sign Up Failed", error?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>What's your name?</Text>
              <Text style={styles.stepSubtitle}>
                Let's start with the basics
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>First Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "firstName" && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <User color="#999999" size={20} strokeWidth={2} />
                </View>
                <TextInput
                  style={styles.input}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#999999"
                  autoCapitalize="words"
                  onFocus={() => setFocusedInput("firstName")}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "lastName" && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <User color="#999999" size={20} strokeWidth={2} />
                </View>
                <TextInput
                  ref={lastNameRef}
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Enter your last name"
                  placeholderTextColor="#999999"
                  autoCapitalize="words"
                  onFocus={() => setFocusedInput("lastName")}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={handleNext}
                />
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepSubtitle}>
                This helps us personalize your experience
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === true && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender(true)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === true && styles.genderButtonTextSelected,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === false && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender(false)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === false && styles.genderButtonTextSelected,
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Birth Date</Text>
              <View style={styles.dateContainer}>
                <View style={styles.dateField}>
                  <Text style={styles.dateFieldLabel}>Day</Text>
                  <TextInput
                    style={[
                      styles.dateInput,
                      focusedInput === "day" && styles.inputWrapperFocused,
                    ]}
                    value={day}
                    onChangeText={(val) => {
                      if (
                        val === "" ||
                        (/^\d+$/.test(val) && parseInt(val) <= 31)
                      ) {
                        setDay(val);
                      }
                    }}
                    placeholder="DD"
                    placeholderTextColor="#999999"
                    keyboardType="number-pad"
                    maxLength={2}
                    onFocus={() => setFocusedInput("day")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={styles.dateFieldLabel}>Month</Text>
                  <TextInput
                    style={[
                      styles.dateInput,
                      focusedInput === "month" && styles.inputWrapperFocused,
                    ]}
                    value={month}
                    onChangeText={(val) => {
                      if (
                        val === "" ||
                        (/^\d+$/.test(val) && parseInt(val) <= 12)
                      ) {
                        setMonth(val);
                      }
                    }}
                    placeholder="MM"
                    placeholderTextColor="#999999"
                    keyboardType="number-pad"
                    maxLength={2}
                    onFocus={() => setFocusedInput("month")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
                <View style={styles.dateField}>
                  <Text style={styles.dateFieldLabel}>Year</Text>
                  <TextInput
                    style={[
                      styles.dateInput,
                      focusedInput === "year" && styles.inputWrapperFocused,
                    ]}
                    value={year}
                    onChangeText={(val) => {
                      if (val === "" || /^\d+$/.test(val)) {
                        setYear(val);
                      }
                    }}
                    placeholder="YYYY"
                    placeholderTextColor="#999999"
                    keyboardType="number-pad"
                    maxLength={4}
                    onFocus={() => setFocusedInput("year")}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Create your identity</Text>
              <Text style={styles.stepSubtitle}>
                Choose a unique username and email
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "username" && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <User color="#999999" size={20} strokeWidth={2} />
                </View>
                <TextInput
                  ref={usernameRef}
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Choose a unique username"
                  placeholderTextColor="#999999"
                  autoCapitalize="none"
                  maxLength={32}
                  onFocus={() => setFocusedInput("username")}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                />
              </View>
              <Text style={styles.inputHint}>
                {username.length}/32 characters
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "email" && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Mail color="#999999" size={20} strokeWidth={2} />
                </View>
                <TextInput
                  ref={emailRef}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="your@email.com"
                  placeholderTextColor="#999999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput("email")}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={handleNext}
                />
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <Text style={styles.stepTitle}>Secure your account</Text>
              <Text style={styles.stepSubtitle}>Create a strong password</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "password" && styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Lock color="#999999" size={20} strokeWidth={2} />
                </View>
                <TextInput
                  key={`password-${passwordVisible}`}
                  ref={passwordRef}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#999999"
                  secureTextEntry={!passwordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  keyboardType="default"
                  editable={true}
                  selectTextOnFocus={true}
                  onFocus={() => setFocusedInput("password")}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                />
                <TouchableOpacity
                  onPress={() => {
                    setPasswordVisible(!passwordVisible);
                    passwordRef.current?.focus();
                  }}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={20}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.passwordRequirements}>
                <View style={styles.requirementItem}>
                  <Text
                    style={[
                      styles.requirementCheck,
                      password.length >= 8 && styles.requirementMet,
                    ]}
                  >
                    {password.length >= 8 ? "✓" : "○"}
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      password.length >= 8 && styles.requirementMetText,
                    ]}
                  >
                    At least 8 characters
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text
                    style={[
                      styles.requirementCheck,
                      /\d/.test(password) && styles.requirementMet,
                    ]}
                  >
                    {/\d/.test(password) ? "✓" : "○"}
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      /\d/.test(password) && styles.requirementMetText,
                    ]}
                  >
                    One digit (0-9)
                  </Text>
                </View>
                <View style={styles.requirementItem}>
                  <Text
                    style={[
                      styles.requirementCheck,
                      /[A-Z]/.test(password) && styles.requirementMet,
                    ]}
                  >
                    {/[A-Z]/.test(password) ? "✓" : "○"}
                  </Text>
                  <Text
                    style={[
                      styles.requirementText,
                      /[A-Z]/.test(password) && styles.requirementMetText,
                    ]}
                  >
                    One uppercase (A-Z)
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === "confirmPassword" &&
                    styles.inputWrapperFocused,
                ]}
              >
                <View style={styles.inputIconContainer}>
                  <Lock color="#999999" size={20} strokeWidth={2} />
                </View>
                <TextInput
                  key={`confirm-${confirmPasswordVisible}`}
                  ref={confirmPasswordRef}
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#999999"
                  secureTextEntry={!confirmPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="newPassword"
                  keyboardType="default"
                  editable={true}
                  selectTextOnFocus={true}
                  onFocus={() => setFocusedInput("confirmPassword")}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="go"
                  onSubmitEditing={handleNext}
                />
                <TouchableOpacity
                  onPress={() => {
                    setConfirmPasswordVisible(!confirmPasswordVisible);
                    confirmPasswordRef.current?.focus();
                  }}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={confirmPasswordVisible ? "eye-off" : "eye"}
                    size={20}
                    color="#999999"
                  />
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && (
                <Text
                  style={[
                    styles.inputHint,
                    password === confirmPassword
                      ? styles.matchSuccess
                      : styles.matchError,
                  ]}
                >
                  {password === confirmPassword
                    ? "✓ Passwords match"
                    : "✗ Passwords do not match"}
                </Text>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <LinearGradient
        colors={["#FFFCF4", "#FFF8E1", "#FFFCF4"]}
        style={styles.container}
      >
        {/* Animated Background Icons */}
        <View style={styles.backgroundIcons}>
          {backgroundIcons.map((item, index) => (
            <FloatingIcon
              key={index}
              Icon={item.Icon}
              delay={item.delay}
              size={item.size}
              top={item.top}
              left={item.left}
              right={item.right}
              bottom={item.bottom}
            />
          ))}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="always"
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Text style={styles.backIcon}>←</Text>
              </TouchableOpacity>

              <View style={styles.progressWrapper}>
                <View style={styles.progressBar}>
                  {[...Array(totalSteps)].map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.progressDot,
                        index < currentStep && styles.progressDotActive,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.progressText}>
                  Step {currentStep} of {totalSteps}
                </Text>
              </View>
            </View>

            {/* Step Content */}
            <Animated.View
              style={[
                styles.formContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {renderStep()}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>
                        {currentStep === totalSteps
                          ? "Create Account"
                          : "Continue"}
                      </Text>
                      <Text style={styles.nextArrow}>→</Text>
                    </>
                  )}
                </TouchableOpacity>

                {currentStep === totalSteps && (
                  <>
                    <View style={styles.divider}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>or sign up with</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    <View style={styles.socialContainer}>
                      <TouchableOpacity
                        style={styles.socialButton}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="logo-apple" size={22} color="#000000" />
                        <Text style={styles.socialText}>Apple</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.socialButton}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.socialIconGoogle}>G</Text>
                        <Text style={styles.socialText}>Google</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>

              {/* Sign In Link */}
              <View style={styles.signInContainer}>
                <Text style={styles.signInText}>Already have an account? </Text>
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/LoginScreen")}
                >
                  <Text style={styles.signInLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
      <StatusBar style="dark" animated />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundIcons: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  floatingIcon: {
    position: "absolute",
  },
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    justifyContent: "center",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center", // vertical center
    justifyContent: "space-between", // back button left, progress centered
    marginBottom: 32,
  },

  progressWrapper: {
    flex: 1,
    alignItems: "center", // center progress bar horizontally in remaining space
  },

  progressBar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 4,
    marginVertical: 24,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  backIcon: {
    fontSize: 24,
    color: "#1A1A1A",
  },
  progressContainer: {
    marginBottom: 32,
    alignItems: "center",
  },

  progressDot: {
    width: 50,
    height: 4,
    backgroundColor: "#E8E8E8",
    borderRadius: 2,
  },
  progressDotActive: {
    backgroundColor: "#FF6B58",
  },
  progressText: {
    fontSize: 13,
    color: "#999999",
    fontWeight: "600",
  },
  formContainer: {
    gap: 28,
  },
  stepContent: {
    gap: 24,
  },
  stepHeader: {
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1A1A1A",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#666666",
    fontWeight: "400",
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    paddingHorizontal: 14,
    paddingVertical: 2,
  },
  inputWrapperFocused: {
    borderColor: "#FF6B58",
    borderWidth: 2,
  },
  inputIconContainer: {
    marginRight: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
    paddingVertical: 15,
  },
  inputHint: {
    fontSize: 12,
    color: "#999999",
    marginLeft: 4,
    marginTop: 4,
  },
  matchSuccess: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  matchError: {
    color: "#FF4444",
    fontWeight: "600",
  },
  eyeButton: {
    padding: 8,
  },
  genderContainer: {
    flexDirection: "row",
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  genderButtonSelected: {
    borderColor: "#FF6B58",
    backgroundColor: "#FF6B58",
    borderWidth: 2,
  },
  genderButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#999999",
  },
  genderButtonTextSelected: {
    color: "#FFFFFF",
  },
  dateContainer: {
    flexDirection: "row",
    gap: 10,
  },
  dateField: {
    flex: 1,
    gap: 6,
  },
  dateFieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    marginLeft: 4,
  },
  dateInput: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    paddingVertical: 15,
    fontSize: 15,
    color: "#1A1A1A",
    textAlign: "center",
    fontWeight: "600",
  },
  passwordRequirements: {
    gap: 8,
    marginTop: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  requirementCheck: {
    fontSize: 14,
    fontWeight: "700",
    color: "#999999",
    width: 20,
  },
  requirementMet: {
    color: "#4CAF50",
  },
  requirementText: {
    fontSize: 13,
    color: "#666666",
    fontWeight: "500",
  },
  requirementMetText: {
    color: "#4CAF50",
  },
  actionButtons: {
    gap: 16,
  },
  nextButton: {
    backgroundColor: "#FF6B58",
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#FF6B58",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  nextArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E8E8",
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: "#999999",
    fontWeight: "600",
  },
  socialContainer: {
    flexDirection: "row",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#F0F0F0",
    paddingVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  socialIconGoogle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  socialText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  signInContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  signInText: {
    fontSize: 15,
    color: "#666666",
  },
  signInLink: {
    fontSize: 15,
    color: "#FF6B58",
    fontWeight: "700",
  },
});

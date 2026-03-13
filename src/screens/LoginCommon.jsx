import React, { useEffect, useState, useRef } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Button,
  FlatList,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  commonAPICall,
  GENERATE_CAPTCHA,
  LOGIN_END_POINT,
  LOGOUT_END_POINT,
  myAxios,
  myAxiosLogin,
} from "../utils/utils";
import { useDispatch } from "react-redux";
import { hideLoader, login, showLoader } from "../actions";
import {
  showErrorToast,
  showInfoToast,
  showSuccessToast,
} from "../utils/showToast";

const { width } = Dimensions.get("window");

const LoginCommon = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [deptCaptcha, setDeptCaptcha] = useState("");
  const [storedCaptchaId, setStoredCaptchaId] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    username: "",
    password: "",
    deptCaptcha: "",
  });

  const dispatch = useDispatch();

  const encodeBase64 = (value) => {
    try {
      if (typeof btoa === "function") return btoa(value);
      if (global?.btoa) return global.btoa(value);
      return value;
    } catch {
      return value;
    }
  };

  const validateForm = () => {
    const newErrors = {
      username: "",
      password: "",
      deptCaptcha: "",
    };

    let valid = true;

    if (!username.trim()) {
      newErrors.username = "Username is required";
      valid = false;
    } else if (username.trim().length < 4) {
      newErrors.username = "Username must be at least 4 characters";
      valid = false;
    } else if (username.trim().length > 18) {
      newErrors.username = "Username must be less than 18 characters";
      valid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required";
      valid = false;
    } else if (password.trim().length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      valid = false;
    }

    if (!deptCaptcha.trim()) {
      newErrors.deptCaptcha = "Captcha is required";
      valid = false;
    } else if (deptCaptcha.trim().length !== 6) {
      newErrors.deptCaptcha = "Captcha must be exactly 6 characters";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const generateCaptcha = async () => {
    const response = await commonAPICall(GENERATE_CAPTCHA, {}, "get", dispatch);
    setCaptchaImage(response?.data?.captcha || "");
    setStoredCaptchaId(response?.data?.captchaId || "");
  };

  const logoutUser = async () => {
    try {
      await myAxios.get(`${LOGOUT_END_POINT}?type=HOMEPAGE`);
    } catch (error) {
      console.log("Logout skipped:", error?.message);
    }
  };

  useEffect(() => {
    logoutUser();
    generateCaptcha();
  }, []);

  const getLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    const values = {
      username: username.trim(),
      password: encodeBase64(password),
      deptCaptcha: deptCaptcha.trim(),
      storedCaptchaId,
      latitude: null,
      longitude: null,
      loginSource: "mobile",
    };

    try {
      const response = await myAxiosLogin.post(LOGIN_END_POINT, values);

      if (response.status === 200) {
        const payload = {
          isLoggedIn: true,
          isDefaultPassword: response.data.isDefaultPassword,
          isProfileUpdated: response.data.isProfileUpdated,
          officerName: response.data.officerName,
          mobile: response.data.mobile,
          parents: response.data.parents,
          services: response.data.services,
          roleId: response.data.roleId,
          userId: response.data.userId,
          username: response.data.username,
          token: response.data.token,
          roleName: response.data.roleName,
          photoPath: response.data.photoPath,
          lastLoginTime: response.data.lastLoginTime,
          uuid: response.data.uuid,
          lastLogoutTime: response.data.lastLogoutTime,
          lastFailureAttemptTime: response.data.lastFailureAttemptTime,
          passwordSinceUpdated: response.data.passwordSinceUpdated,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          loginLocation: response.data.location,
        };

        dispatch(login(payload));

        const currentTime = new Date().getHours();
        let welcomeMsg = "";

        if (currentTime >= 5 && currentTime < 12) {
          welcomeMsg =
            "Good morning! A book is a window to the world—start your day with knowledge!";
        } else if (currentTime >= 12 && currentTime < 18) {
          welcomeMsg =
            "Good afternoon! Dive into a book and let your imagination take you on an adventure!";
        } else {
          welcomeMsg =
            "Good evening! End your day with the wisdom of a good book!";
        }

        showSuccessToast(welcomeMsg);
        if (
          parseInt(response?.data?.passwordSinceUpdated) >= 85 &&
          parseInt(response?.data?.passwordSinceUpdated) < 90
        ) {
          showInfoToast(
            `Your password will expire in ${
              90 - response.data.passwordSinceUpdated
            } days. Please update it soon.`,
          );
        }

        navigation.navigate("HOME");
      } else {
        showErrorToast("Please enter valid credentials");
      }
    } catch (error) {
      if (error.response) {
        setCaptchaImage(error.response?.data?.captcha || "");
        setStoredCaptchaId(error.response?.data?.captchaId || "");
        showErrorToast(
          error.response?.data?.message || "Please enter valid credentials",
        );
      } else {
        showErrorToast(error.message || "Something went wrong");
      }

      console.log("Error during authentication:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />

      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 20}
        enabled
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Background Image */}
          <Image
            source={{ uri: "https://labour.dev.nidhi.apcfss.in/files/labourdept/secondslide.jpeg" }}
            style={styles.backgroundImage}
          />
          
          {/* Dark Overlay */}
          <View style={styles.overlay} />
          
          <View style={styles.backgroundLayerTop} />
          <View style={styles.backgroundLayerMiddle} />
          <View style={styles.topDecorationOne} />
          <View style={styles.topDecorationTwo} />
          <View style={styles.bottomDecoration} />
          <View style={styles.bottomDecorationTwo} />

          {/* Hero Image */}
          <View style={styles.heroImageWrapper}>
            <Image 
              source={{ uri: "https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=600&auto=format&fit=crop" }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroImageOverlay}>
              <Text style={styles.heroImageText}>DEPARTMENT OF LABOUR</Text>
              <Text style={styles.heroImageSubText}>Government of Andhra Pradesh</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardGlow} />

            {/* Labour Department Logo/Header */}
            <View style={styles.logoWrapper}>
              <View style={styles.logoOuterRing}>
                <View style={styles.logoCircle}>
                  <Ionicons
                    name="briefcase-outline"
                    size={34}
                    color="#fff"
                  />
                </View>
              </View>
            </View>

            <Text style={styles.deptName}>DEPARTMENT OF LABOUR</Text>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to access your labour department account
            </Text>

            <View style={styles.fieldBlock}>
              <View
                style={[
                  styles.inputWrapper,
                  errors.username ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#5f6f94"
                  style={styles.leftIcon}
                />
                <TextInput
                  placeholder="Enter User ID"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (errors.username) setErrors({ ...errors, username: "" });
                  }}
                  maxLength={18}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>
              {errors.username ? (
                <Text style={styles.errorText}>{errors.username}</Text>
              ) : null}
            </View>

            <View style={styles.fieldBlock}>
              <View
                style={[
                  styles.inputWrapper,
                  errors.password ? styles.inputWrapperError : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#5f6f94"
                  style={styles.leftIcon}
                />
                <TextInput
                  placeholder="Enter Password"
                  placeholderTextColor="#94a3b8"
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: "" });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={22}
                    color="#1e3a5f"
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            <View style={styles.fieldBlock}>
              <View style={styles.captchaRow}>
                <View
                  style={[
                    styles.captchaInputWrapper,
                    errors.deptCaptcha ? styles.inputWrapperError : null,
                  ]}
                >
                  <TextInput
                    placeholder="Captcha"
                    placeholderTextColor="#94a3b8"
                    style={styles.input}
                    value={deptCaptcha}
                    onChangeText={(text) => {
                      setDeptCaptcha(text);
                      if (errors.deptCaptcha) {
                        setErrors({ ...errors, deptCaptcha: "" });
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>

                <View style={styles.captchaBox}>
                  {captchaImage ? (
                    <Image
                      source={{ uri: captchaImage }}
                      style={styles.captchaImage}
                      resizeMode="contain"
                    />
                  ) : (
                    <Text style={styles.captchaPlaceholderText}>Captcha</Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={generateCaptcha}
                  style={styles.refreshBtn}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={22} color="#1e3a5f" />
                </TouchableOpacity>
              </View>

              {errors.deptCaptcha ? (
                <Text style={styles.errorText}>{errors.deptCaptcha}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.loginButton,
                loading ? styles.loginButtonDisabled : null,
              ]}
              onPress={getLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.loginText}>Sign In</Text>
                  <Ionicons
                    name="arrow-forward-outline"
                    size={20}
                    color="#fff"
                    style={{ marginLeft: 8 }}
                  />
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginCommon;

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    
  },

  screen: {
    flex: 1,
    backgroundColor: "#1e3a5f",
    backgroundImage: "https://labour.dev.nidhi.apcfss.in/files/labourdept/secondslide.jpeg",
  },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
    position: "relative",
    overflow: "hidden",
  },

  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    opacity: 0.15,
  },

  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(30, 58, 95, 0.85)",
  },

  backgroundLayerTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "42%",
    backgroundColor: "#1e3a5f",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  backgroundLayerMiddle: {
    position: "absolute",
    top: "24%",
    left: -20,
    right: -20,
    height: 180,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 50,
    transform: [{ rotate: "-6deg" }],
  },

  topDecorationOne: {
    position: "absolute",
    top: -35,
    right: -25,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  topDecorationTwo: {
    position: "absolute",
    top: 95,
    left: -48,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(173,216,255,0.16)",
  },

  bottomDecoration: {
    position: "absolute",
    bottom: 55,
    right: -45,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(255,255,255,0.10)",
  },

  bottomDecorationTwo: {
    position: "absolute",
    bottom: 10,
    left: -35,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(173,216,255,0.13)",
  },

  // Hero Image Styles
  heroImageWrapper: {
    height: 160,
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },

  heroImage: {
    width: "100%",
    height: "100%",
  },

  heroImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(30, 58, 95, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },

  heroImageText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 5,
  },

  heroImageSubText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    opacity: 0.9,
  },

  card: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 24,
    shadowColor: "#0a1a2e",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    overflow: "hidden",
  },

  cardGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(30, 58, 95, 0.10)",
  },

  logoWrapper: {
    alignItems: "center",
    marginBottom: 10,
  },

  logoOuterRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(30, 58, 95, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },

  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#1e3a5f",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1e3a5f",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
  },

  deptName: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#1e3a5f",
    marginBottom: 4,
    letterSpacing: 1,
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: 0.3,
  },

  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },

  fieldBlock: {
    marginBottom: 16,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
    marginLeft: 4,
    letterSpacing: 0.2,
  },

  inputWrapper: {
    minHeight: 56,
    backgroundColor: "#f8fbff",
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#d7e3ff",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#1e3a5f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  captchaInputWrapper: {
    flex: 1.2,
    minHeight: 56,
    backgroundColor: "#f8fbff",
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#d7e3ff",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#1e3a5f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  inputWrapperError: {
    borderColor: "#ef4444",
    backgroundColor: "#fff6f6",
  },

  leftIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    color: "#111827",
    fontSize: 15,
    paddingVertical: 14,
  },

  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 6,
  },

  captchaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  captchaBox: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d7e3ff",
    backgroundColor: "#f8fbff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
    shadowColor: "#1e3a5f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  captchaImage: {
    width: "100%",
    height: 42,
  },

  captchaPlaceholderText: {
    color: "#6b7280",
    fontWeight: "600",
    fontSize: 13,
  },

  refreshBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#eef4ff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d7e3ff",
    shadowColor: "#1e3a5f",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 9,
    elevation: 2,
  },

  loginButton: {
    width: "100%",
    height: 58,
    backgroundColor: "#1e3a5f",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    flexDirection: "row",
    shadowColor: "#0f2a40",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 7,
    borderWidth: 1,
    borderColor: "#2c4b75",
  },

  loginButtonDisabled: {
    opacity: 0.8,
  },

  loginText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  errorText: {
    color: "#ef4444",
    marginTop: 6,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: "600",
  },

  footerText: {
    textAlign: "center",
    color: "#7c8aa5",
    fontSize: 12,
    marginTop: 18,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  bottomSpacing: {
    height: 30,
  },
});
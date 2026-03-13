import React, { useEffect, useState } from "react";
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

  const incidentOptions = [
    {
      id: "0",
      title: "General Incidents",
      icon: "elephant-outline",
      type: "general",
    },
    { id: "6", title: "Sarpa Mithra", icon: "snake-outline", type: "sarpa" },
    { id: "1", title: "Gaja Praja", icon: "elephant-outline", type: "gaja" },
    { id: "5", title: "Monkey Menace", icon: "monkey-outline", type: "monkey" },
  ];

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
      <StatusBar barStyle="dark-content" backgroundColor="#edf4ff" />

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
          <View style={styles.topDecorationOne} />
          <View style={styles.topDecorationTwo} />
          <View style={styles.bottomDecoration} />

          <View style={styles.card}>
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={34}
                  color="#fff"
                />
              </View>
            </View>

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue to your account
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
                    color="#3856b5"
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
                  <Ionicons name="refresh" size={22} color="#3856b5" />
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
            {/* 
            <Text style={styles.footerText}>
              Secure access to your application
            </Text> */}
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
    backgroundColor: "#edf4ff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 28,
  },

  topDecorationOne: {
    position: "absolute",
    top: -30,
    right: -25,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: "rgba(74,108,247,0.14)",
  },
  topDecorationTwo: {
    position: "absolute",
    top: 90,
    left: -50,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(28,61,143,0.08)",
  },
  bottomDecoration: {
    position: "absolute",
    bottom: 40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(74,108,247,0.08)",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 24,
    shadowColor: "#1c3d8f",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 10,
    borderWidth: 1,
    borderColor: "#eef2ff",
  },

  logoWrapper: {
    alignItems: "center",
    marginBottom: 14,
  },
  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#4a6cf7",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4a6cf7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 6,
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
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 26,
    lineHeight: 22,
  },

  fieldBlock: {
    marginBottom: 16,
  },

  inputWrapper: {
    minHeight: 56,
    backgroundColor: "#f8faff",
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#dbe4ff",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#4a6cf7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  captchaInputWrapper: {
    flex: 1.2,
    minHeight: 56,
    backgroundColor: "#f8faff",
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#dbe4ff",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#4a6cf7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  inputWrapperError: {
    borderColor: "#ef4444",
    backgroundColor: "#fff7f7",
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe4ff",
    backgroundColor: "#f8faff",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
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
    borderRadius: 16,
    backgroundColor: "#f8faff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dbe4ff",
    shadowColor: "#4a6cf7",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },

  loginButton: {
    width: "100%",
    height: 56,
    backgroundColor: "#4a6cf7",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    flexDirection: "row",
    shadowColor: "#4a6cf7",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
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
    fontWeight: "500",
  },

  footerText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 18,
    fontWeight: "500",
  },

  bottomSpacing: {
    height: 30,
  },

  incidentSection: {
    width: "100%",
    paddingHorizontal: 16,
  },
  incidentList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  incidentCard: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    marginRight: 12,
  },
  incidentCardText: {
    fontSize: 12,
    fontWeight: "500",
    color: "white",
    backgroundColor: "orange",
    padding: 3,
    borderRadius: 4,
    minWidth: 100,
    height: 30,
    textAlign: "center",
  },
});

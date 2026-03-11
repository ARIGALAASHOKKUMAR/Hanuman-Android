import React, { useEffect } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";

const SessionChecking = ({ navigation, children }) => {
  const state = useSelector((state) => state.LoginReducer);

  const {
    isLoggedIn,
    isDefaultPassword,
    isProfileUpdated,
    passwordSinceUpdated,
  } = state;

  useEffect(() => {
    const passwordDays = parseInt(passwordSinceUpdated || 0, 10);
    const isPasswordExpired = passwordDays >= 90;

    let changePasswordMsg =
      "For your security, please update your password. It was initially set by the system and should be personalized to ensure the safety of your account.";

    if (isPasswordExpired) {
      changePasswordMsg =
        "Your password has expired. Please change it immediately to continue accessing your account.";
    }

    if (!isLoggedIn) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
      return;
    }

    if (
      (typeof isDefaultPassword === "string" &&
        isDefaultPassword.toUpperCase() === "Y") ||
      isPasswordExpired
    ) {
      Alert.alert("Password Update Required", changePasswordMsg, [
        {
          text: "OK",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "ChangePassword" }],
            });
          },
        },
      ]);
      return;
    }

    if (
      typeof isProfileUpdated === "string" &&
      isProfileUpdated.toUpperCase() === "N"
    ) {
      Alert.alert("Profile Update Required", "Please Update Officer Name & Mobile Number", [
        {
          text: "OK",
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: "ProfileUpdate" }],
            });
          },
        },
      ]);
      return;
    }
  }, [
    isLoggedIn,
    isDefaultPassword,
    isProfileUpdated,
    passwordSinceUpdated,
    navigation,
  ]);

  console.log("passwordSinceUpdated",isLoggedIn, isDefaultPassword, isProfileUpdated, passwordSinceUpdated);
  

  if (!isLoggedIn) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4a6cf7" />
      </View>
    );
  }

  return <>{children}</>;
};

export default SessionChecking;

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    backgroundColor: "#f2f5ff",
    justifyContent: "center",
    alignItems: "center",
  },
});
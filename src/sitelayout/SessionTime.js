import React, { useEffect } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useRoute } from "@react-navigation/native";
import { useTimer } from "react-timer-hook";
import { FontAwesome } from "@expo/vector-icons";
import { CommonLogout } from "../utils/CommonFunctions";


const SessionTime = ({ remainingTime = 0, randomTrigger = 0, navigation }) => {
  const route = useRoute();
  const dispatch = useDispatch();

  const state = useSelector((state) => state.LoginReducer);
  const { roleName, token, uuid } = state;

  const sessionTimeInfo = () => {
    Alert.alert(
      "Session Info",
      "If the app is idle for 59 or more minutes, the session will expire automatically."
    );
  };

  const getCurrentTime = () => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + Number(remainingTime || 0));
    return time;
  };

  const { seconds, minutes, hours, restart } = useTimer({
    expiryTimestamp: getCurrentTime(),
    autoStart: Number(remainingTime) > 0,
    onExpire: () => {
      CommonLogout(
        dispatch,
        uuid,
        roleName,
        token,
        navigation,
        "s",
        "SESSIONTIMEDOUT"
      );
    },
  });

  useEffect(() => {
    if (Number(remainingTime) > 0) {
      restart(getCurrentTime(), true);
    }
  }, [route?.name, remainingTime, randomTrigger]);

  const hh = String(hours || 0).padStart(2, "0");
  const mm = String(minutes || 0).padStart(2, "0");
  const ss = String(seconds || 0).padStart(2, "0");

  return (
    <TouchableOpacity onPress={sessionTimeInfo} activeOpacity={0.8}>
      <View style={styles.container}>
        <FontAwesome name="clock-o" size={16} color="#2747c7" />
        <Text style={styles.text}>{"  "}{hh}:{mm}:{ss}</Text>
      </View>
    </TouchableOpacity>
  );
};

export default SessionTime;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#f6f8ff",
    borderWidth: 1,
    borderColor: "#dde5ff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 120,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  text: {
    fontSize: 13,
    color: "#2747c7",
    fontWeight: "700",
  },
});
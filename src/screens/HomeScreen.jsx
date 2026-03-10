import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSelector } from "react-redux";

const HomeScreen = ({ navigation }) => {
  const state = useSelector((state) => state.LoginReducer);


  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Home Screen</Text> */}
      <Text style={styles.subtitle}>Login successful</Text>
{/* 
      <Text>Officer Name: {state.officerName}</Text>
      <Text>Username: {state.username}</Text>
      <Text>Mobile: {state.mobile}</Text>
      <Text>Role Name: {state.roleName}</Text>
      <Text>User Id: {state.userId}</Text> */}

      {/* <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Login")}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f5ff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "gray",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#4a6cf7",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
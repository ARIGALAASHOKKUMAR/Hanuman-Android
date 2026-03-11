import React, { useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { Formik } from "formik";
import * as Yup from "yup";

import { hideLoader, showLoader, login, showMessage } from "../actions";
import { store } from "../reducers/allReducers";
import { commonAPICall, CONTEXT_HEADING, myAxios } from "../utils/utils";

const ProfileUpdate = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const state = useSelector((state) => state.LoginReducer);
  const { isLoggedIn, officerName, mobile } = state;

  useEffect(() => {
    if (!isLoggedIn) {
      navigation.replace("Login");
    }
  }, [isLoggedIn, navigation]);

  const userValidationSchema = Yup.object().shape({
    officerName: Yup.string()
      .required("Please Enter Officer Name")
      .min(3, "Officer Name must be at least 3 characters"),
    mobileNumber: Yup.string()
      .matches(
        /^[0-9]+$/,
        "Mobile Number should contain only numeric characters",
      )
      .min(10, "Mobile Number should be 10 digits")
      .max(10, "Mobile Number should not exceed 10 digits")
      .required("Please Enter Mobile Number"),
  });



    

  const submitDetails = async (values, { resetForm }) => {

        console.log("accessTokentesttt", state.token);

    let msg = "";
    let msgType = "";

    try {
      //      dispatch(showLoader("Loading, Please Wait....."));

      console.log("FROMTRYYYYYY", values);

      //   const response = await myAxios.post(UpdateProfile, values);

      const response = await myAxios.post(UpdateProfile, values);

      console.log("response", response);

      if (response.status === 200) {
        const existingPayload = store.getState().LoginReducer;

        const updatedPayload = {
          ...existingPayload,
          isProfileUpdated: "Y",
          officerName: values.officerName,
          mobile: values.mobileNumber,
        };

        dispatch(login(updatedPayload));

        msg = response.data.message;
        msgType = "success";
        resetForm();
      } else {
        msg = response.data.message;
        msgType = "failure";
      }
    } catch (error) {
      msg =
        error?.response?.data?.message && error?.response?.data?.status
          ? `${error.response.data.message} (${error.response.data.status})`
          : "Something went wrong";
      msgType = "failure";
    }

    dispatch(showMessage(msg, msgType));
    dispatch(hideLoader());

    Alert.alert(
      msgType === "success" ? "Success" : "Error",
      msg || "Something went wrong",
    );
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Formik
        initialValues={{
          officerName: officerName !== null ? officerName : "",
          mobileNumber:
            mobile && mobile + "" !== "9999999999" ? String(mobile) : "",
        }}
        onSubmit={submitDetails}
        // validationSchema={userValidationSchema}
        enableReinitialize
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          handleSubmit,
        }) => (
          <View style={styles.card}>
            <Text style={styles.header}>PROFILE UPDATE</Text>

            <View style={styles.panel}>
              <Text style={styles.panelHeading}>{CONTEXT_HEADING}</Text>

              <View style={styles.contentWrapper}>
                <View style={styles.formWrapper}>
                  <View style={styles.inputBlock}>
                    <Text style={styles.label}>Officer Name *</Text>
                    <TextInput
                      style={styles.input}
                      value={values.officerName}
                      onChangeText={handleChange("officerName")}
                      onBlur={handleBlur("officerName")}
                      placeholder="Enter officer name"
                      maxLength={50}
                    />
                    {touched.officerName && errors.officerName ? (
                      <Text style={styles.errorText}>{errors.officerName}</Text>
                    ) : null}
                  </View>

                  <View style={styles.inputBlock}>
                    <Text style={styles.label}>Mobile Number *</Text>
                    <TextInput
                      style={styles.input}
                      value={values.mobileNumber}
                      onChangeText={handleChange("mobileNumber")}
                      onBlur={handleBlur("mobileNumber")}
                      placeholder="Enter mobile number"
                      keyboardType="numeric"
                      maxLength={10}
                    />
                    {touched.mobileNumber && errors.mobileNumber ? (
                      <Text style={styles.errorText}>
                        {errors.mobileNumber}
                      </Text>
                    ) : null}
                  </View>

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                  >
                    <Text style={styles.submitButtonText}>UPDATE PROFILE</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.imageWrapper}>
                  <Image
                    source={{
                      uri: "https://api.apfd.apcfss.in/socialwelfaredms/user-defined-path/file-download/APFD/UPLOADS/1724065824648_profileupdate.png",
                    }}
                    style={styles.image}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </View>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
};

export default ProfileUpdate;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: "#f5f6fa",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 3,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    backgroundColor: "#e9ecef",
    paddingVertical: 14,
    color: "#222",
  },
  panel: {
    padding: 16,
  },
  panelHeading: {
    backgroundColor: "#0d6efd",
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  contentWrapper: {
    flexDirection: "column",
  },
  formWrapper: {
    width: "100%",
  },
  inputBlock: {
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
    color: "#222",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#000",
  },
  errorText: {
    color: "red",
    marginTop: 6,
    fontSize: 13,
  },
  submitButton: {
    backgroundColor: "#198754",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  imageWrapper: {
    alignItems: "center",
    marginTop: 24,
  },
  image: {
    width: "100%",
    height: 280,
  },
});

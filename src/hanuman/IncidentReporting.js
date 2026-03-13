import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Ionicons } from "@expo/vector-icons";
import { useDispatch } from "react-redux";
import axios from "axios";

import {
  commonAPICall,
  CONTEXT_HEADING,
  GETANIMALS,
  GETINCIDENTS,
  VOLUNTEERMOBILEOTP,
  createIncident,
  IMG_UPLOAD_URL,
  IMG_DOWNLOAD_URL,
} from "../utils/utils";

import { showLoader, hideLoader } from "../actions";
import { showErrorToast, showSuccessToast } from "../utils/showToast";

/* ===========================
   IMAGE UPLOAD CONFIGURATION
=========================== */
// const IMG_UPLOAD_URL = process.env.REACT_APP_IMG_UPLOAD_URL;
// const IMG_DOWNLOAD_URL = process.env.REACT_APP_IMG_DOWNLOAD_URL;
const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];
const MAX_FILE_SIZE = 20971520; // 20MB

/* ===========================
   IMAGE UPLOAD HELPER FUNCTIONS
=========================== */

/**
 * Validate file type and size for native
 */
const validateFileTypeAndSizeNative = (file, maxSize) => {
  if (!file) {
    Alert.alert("Warning", "Please select an image");
    return false;
  }

  // Check file extension
  const fileName = file.name || "";
  const fileExt = fileName.split(".").pop()?.toLowerCase() || "";
  
  if (!ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
    Alert.alert(
      "Invalid file type",
      "Please select JPG, JPEG or PNG image only"
    );
    return false;
  }

  // Check file size
  if (file.size && Number(file.size) > Number(maxSize)) {
    Alert.alert(
      "File too large",
      `Please select a file smaller than ${Math.round(
        Number(maxSize) / (1024 * 1024)
      )} MB`
    );
    return false;
  }

  return true;
};

/**
 * Create a proper file object for React Native FormData
 */
const createNativeFileObject = (asset) => {
  // Generate filename with timestamp to avoid duplicates
  const timestamp = Date.now();
  const originalName = asset.name || asset.fileName || "image.jpg";
  const ext = originalName.split(".").pop() || "jpg";
  const fileName = `incident_${timestamp}.${ext}`;

  return {
    uri: asset.uri,
    name: fileName,
    type: asset.mimeType || asset.type || "image/jpeg",
    size: asset.size || 0,
  };
};

/**
 * Pick image from camera
 */
const pickImageFromCamera = async () => {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Camera permission is required");
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8, // Reduce quality slightly for better upload performance
      base64: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return createNativeFileObject(result.assets[0]);
  } catch (error) {
    console.log("Camera pick error:", error);
    Alert.alert("Error", "Failed to open camera");
    return null;
  }
};

/**
 * Pick image from gallery
 */
const pickImageFromGallery = async () => {
  try {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert("Permission Required", "Gallery permission is required");
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
      base64: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return createNativeFileObject(result.assets[0]);
  } catch (error) {
    console.log("Gallery pick error:", error);
    Alert.alert("Error", "Failed to open gallery");
    return null;
  }
};

/**
 * Pick image from files
 */
const pickImageFromFiles = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["image/jpeg", "image/png", "image/jpg"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    return createNativeFileObject(result.assets[0]);
  } catch (error) {
    console.log("Document pick error:", error);
    Alert.alert("Error", "Failed to open document picker");
    return null;
  }
};

/**
 * Common axios post for file upload
 */
const commonAxiosPost = async (url, formData) => {
  try {
    console.log("Uploading to URL:", url);
    
    const response = await axios({
      method: "post",
      url: url,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        "Accept": "application/json",
      },
      timeout: 30000, // 30 seconds timeout
    });

    console.log("Upload response status:", response.status);
    console.log("Upload response data:", response.data);

    if (response.status === 200 || response.status === 201) {
      return response.data;
    } else {
      throw new Error(`Upload failed with status: ${response.status}`);
    }
  } catch (error) {
    console.log("Upload error details:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    throw error;
  }
};

/**
 * Main function to upload image to bucket
 */
const ImageBucketNative = async (file, formik, path, name, size, dispatch) => {
  if (!dispatch) {
    console.error("Dispatch is required for ImageBucketNative");
    return null;
  }

  dispatch(
    showLoader("Uploading your file to the cloud...")
  );

  try {
    // Validate file
    if (!validateFileTypeAndSizeNative(file, size)) {
      dispatch(hideLoader());
      return null;
    }

    // Create FormData properly for React Native
    const formData = new FormData();
    
    // Append file with proper structure for React Native
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.type,
    });

    // Log for debugging
    console.log("Uploading file:", {
      name: file.name,
      type: file.type,
      size: file.size,
      uri: file.uri,
    });

    // Make the API call
    const responseData = await commonAxiosPost(
      IMG_UPLOAD_URL + path,
      formData
    );

    console.log("Upload successful, response:", responseData);

    // Handle different response formats
    let fileUrl = "";
    if (typeof responseData === "string") {
      fileUrl = responseData;
    } else if (responseData?.data) {
      fileUrl = responseData.data;
    } else if (responseData?.filePath || responseData?.path) {
      fileUrl = responseData.filePath || responseData.path;
    } else if (responseData?.url) {
      fileUrl = responseData.url;
    } else if (responseData?.file) {
      fileUrl = responseData.file;
    }

    // Construct full URL if needed
    const fullUrl = fileUrl.startsWith("http") 
      ? fileUrl 
      : IMG_DOWNLOAD_URL + fileUrl;

      console.log("fullUrl",fullUrl);
      

    // Update formik
    await formik.setFieldValue(name, fullUrl);
    
    showSuccessToast("File uploaded successfully");
    dispatch(hideLoader());
    
    return fullUrl;
  } catch (error) {
    console.log("ImageBucketNative upload error:", error);
    
    // Clear the field on error
    await formik.setFieldValue(name, "");
    
    showErrorToast(error.response?.data?.message || "Upload failed. Please try again.");
    dispatch(hideLoader());
    
    return null;
  }
};

/**
 * Unified function to pick and upload image
 */
const pickAndUploadImage = async ({
  source,
  formik,
  path,
  name,
  size = MAX_FILE_SIZE,
  dispatch,
}) => {
  try {
    let file = null;

    // Pick image based on source
    switch (source) {
      case "camera":
        file = await pickImageFromCamera();
        break;
      case "gallery":
        file = await pickImageFromGallery();
        break;
      case "files":
        file = await pickImageFromFiles();
        break;
      default:
        console.error("Invalid source:", source);
        return null;
    }

    if (!file) {
      console.log("No file selected");
      return null;
    }

    // Upload the file
    const uploadedUrl = await ImageBucketNative(
      file,
      formik,
      path,
      name,
      size,
      dispatch
    );

    return uploadedUrl;
  } catch (error) {
    console.log("pickAndUploadImage error:", error);
    await formik.setFieldValue(name, "");
    Alert.alert("Error", "Unable to process image");
    return null;
  }
};

/* ===========================
   MAIN COMPONENT
=========================== */

const IncidentReporting = ({ route }) => {
  const { item } = route.params;

  console.log("iteem", item.id);

  const [ANIMALS, setAnimals] = useState([]);
  const [INCIDENTS, setIncidents] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [status, setStatus] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);

  const otpInputRefs = useRef([]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const dispatch = useDispatch();

  const convertToAMPM = (time) => {
    if (!time) return "";

    let [hours, minutes] = time.split(":");
    hours = Number(hours);

    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;

    return `${hours}:${minutes} ${ampm}`;
  };

  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTimeForInput = (date) => {
    const hours = `${date.getHours()}`.padStart(2, "0");
    const minutes = `${date.getMinutes()}`.padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const validationSchema = Yup.object().shape({
    district: Yup.string().required("District is required"),
    mandal: Yup.string().required("Mandal is required"),
    village: Yup.string().required("Village is required"),
    animalId: Yup.string().required("Animal is required"),
    incidentTypeId: Yup.string().required("Incident type is required"),
    incidentDate: Yup.date()
      .required("Incident date is required")
      .max(new Date(), "Date cannot be in the future"),
    incidentTime: Yup.string().required("Incident time is required"),
    latitude: Yup.number()
      .typeError("Latitude is required")
      .required("Latitude is required"),
    longitude: Yup.number()
      .typeError("Longitude is required")
      .required("Longitude is required"),
    severityOfUrgency: Yup.string().required("Severity is required"),
    landmark: Yup.string().required("Landmark is required"),
    mobileNo: Yup.string()
      .required("Mobile No is required")
      .matches(/^\d{10}$/, "Please enter valid mobile number"),
    description: Yup.string().required("Description is required"),
    animalCount: Yup.string().required("required"),
    incidentLocationId: Yup.string().required("Required"),
    incidentPhoto: Yup.string().required("Incident photo is required"),
    otherIncidentLocation: Yup.string().test(
      "other-location-required",
      "Please enter other incident location",
      function (value) {
        const { incidentLocationId } = this.parent;
        if (incidentLocationId === "14") {
          return value && value.trim() !== "";
        }
        return true;
      }
    ),
  });

  const incidentFormik = useFormik({
    initialValues: {
      district: "",
      mandal: "",
      village: "",
      animalId: "",
      incidentTypeId: "",
      incidentDate: "",
      incidentTime: "",
      latitude: "",
      longitude: "",
      description: "",
      severityOfUrgency: "",
      landmark: "",
      mobileNo: "",
      incidentLocationId: "",
      otherIncidentLocation: "",
      animalCount: "",
      incidentPhoto: "",
    },
    validationSchema,
    onSubmit: async () => {},
    validateOnChange: true,
    validateOnBlur: true,
  });

  useEffect(() => {
    incidentFormik.setFieldValue("animalId", item.id);
  }, []);

  const getAnimals = async () => {
    try {
      const response = await commonAPICall(GETANIMALS, {}, "get", dispatch);
      if (response.status === 200) {
        setAnimals(response.data.Animal_Master || []);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load animals");
    }
  };

  const getIncidents = async (animalId) => {
    try {
      const response = await commonAPICall(
        `${GETINCIDENTS}?animalId=${animalId}`,
        {},
        "get",
        dispatch
      );
      if (response.status === 200) {
        setIncidents(response.data.Animal_Incident_Types || []);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load incidents");
    }
  };

  const requestLocationAndSetDefaults = async () => {
    try {
      const now = new Date();

      incidentFormik.setFieldValue("incidentDate", formatDateForInput(now));
      incidentFormik.setFieldValue("incidentTime", formatTimeForInput(now));

      const { status: permissionStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (permissionStatus !== "granted") {
        setPageLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      incidentFormik.setFieldValue("latitude", location.coords.latitude);
      incidentFormik.setFieldValue("longitude", location.coords.longitude);
      setPageLoading(false);
    } catch (error) {
      setPageLoading(false);
    }
  };

  const GetOtp = async (mobileNo) => {
    const errors = await incidentFormik.validateForm();
    const { otp, ...errorsWithoutOtp } = errors;

    if (Object.keys(errorsWithoutOtp).length > 0) {
      const errorList = Object.keys(errorsWithoutOtp).map((key) => ({
        field: key,
        message: Array.isArray(errorsWithoutOtp[key])
          ? errorsWithoutOtp[key][0]
          : errorsWithoutOtp[key],
      }));
      setValidationErrors(errorList);
      setShowValidationModal(true);
      return;
    }

    if (!/^\d{10}$/.test(mobileNo)) {
      Alert.alert("Validation", "Please enter valid mobile number");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await commonAPICall(
        VOLUNTEERMOBILEOTP + mobileNo,
        {},
        "post",
        dispatch
      );
      setIsSubmitting(false);

      if (response.status === 200) {
        setStatus(true);
        setShowOtpModal(true);
        setOtpValues(["", "", "", "", "", ""]);

        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 300);
      } else {
        Alert.alert("Error", "Failed to send OTP");
      }
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to send OTP");
    }
  };

  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/[^0-9]/g, "");

    if (cleaned.length > 1) {
      const digits = cleaned.slice(0, 6).split("");
      const newOtpValues = [...otpValues];

      for (let i = 0; i < digits.length; i++) {
        if (index + i < 6) {
          newOtpValues[index + i] = digits[i];
        }
      }

      setOtpValues(newOtpValues);

      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtpValues = [...otpValues];
    newOtpValues[index] = cleaned;
    setOtpValues(newOtpValues);

    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index, e) => {
    if (e.nativeEvent.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmitWithOtp = async () => {
    const otp = otpValues.join("");

    if (otp.length !== 6) {
      Alert.alert("Validation", "Please enter complete 6-digit OTP");
      return;
    }

    const errors = await incidentFormik.validateForm();
    if (Object.keys(errors).length > 0) {
      Alert.alert("Validation", "Please fix all validation errors");
      setShowOtpModal(false);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await commonAPICall(
        createIncident,
        {
          ...incidentFormik.values,
          incidentTime: convertToAMPM(incidentFormik.values.incidentTime),
          otp,
        },
        "POST",
        dispatch
      );

      setIsSubmitting(false);

      if (response.status === 200) {
        incidentFormik.resetForm();
        setOtpValues(["", "", "", "", "", ""]);
        setStatus(false);
        setShowOtpModal(false);
        setIncidents([]);

        const now = new Date();
        incidentFormik.setFieldValue("incidentDate", formatDateForInput(now));
        incidentFormik.setFieldValue("incidentTime", formatTimeForInput(now));

        Alert.alert("Success", "Incident reported successfully");
      } else {
        Alert.alert("Error", "Failed to report incident. Please try again.");
      }
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to report incident. Please try again.");
    }
  };

  const handleCloseModal = () => {
    setShowOtpModal(false);
    setOtpValues(["", "", "", "", "", ""]);
  };

  const handleCloseValidationModal = () => {
    setShowValidationModal(false);
    setValidationErrors([]);
  };

  const getFieldLabel = (field) => {
    const labels = {
      district: "District",
      mandal: "Mandal",
      village: "Village",
      animalId: "Animal Involved",
      incidentTypeId: "Incident Type",
      incidentDate: "Date of Incident",
      incidentTime: "Time of Incident",
      latitude: "Latitude",
      longitude: "Longitude",
      severityOfUrgency: "Severity",
      landmark: "Landmark",
      mobileNo: "Mobile No",
      description: "Description",
      animalCount: "Animal Count",
      incidentLocationId: "Location Type",
      otherIncidentLocation: "Other Incident Location",
      incidentPhoto: "Incident Photo",
    };
    return labels[field] || field;
  };

  const openImageOptions = () => {
    Alert.alert("Incident Photo", "Choose image source", [
      {
        text: "Camera",
        onPress: async () => {
          try {
            await pickAndUploadImage({
              source: "camera",
              formik: incidentFormik,
              path: "APFD/SAWMILLS/",
              name: "incidentPhoto",
              size: MAX_FILE_SIZE,
              dispatch,
            });
          } catch (error) {
            console.log("Camera upload error:", error);
          }
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          try {
            await pickAndUploadImage({
              source: "gallery",
              formik: incidentFormik,
              path: "APFD/SAWMILLS/",
              name: "incidentPhoto",
              size: MAX_FILE_SIZE,
              dispatch,
            });
          } catch (error) {
            console.log("Gallery upload error:", error);
          }
        },
      },
      {
        text: "Files",
        onPress: async () => {
          try {
            await pickAndUploadImage({
              source: "files",
              formik: incidentFormik,
              path: "APFD/SAWMILLS/",
              name: "incidentPhoto",
              size: MAX_FILE_SIZE,
              dispatch,
            });
          } catch (error) {
            console.log("Files upload error:", error);
          }
        },
      },
      {
        text: "Cancel",
        style: "cancel",
      },
    ]);
  };

  useEffect(() => {
    getAnimals();
  }, []);

  useEffect(() => {
    requestLocationAndSetDefaults();
  }, [status]);

  const renderError = (name) => {
    const touched = incidentFormik.touched[name];
    const error = incidentFormik.errors[name];
    if (touched && error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    return null;
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Multi Species Incident Reporting</Text>
          <Text style={styles.subTitle}>{CONTEXT_HEADING}</Text>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Animal Involved *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={incidentFormik.values.animalId}
                onValueChange={(value) => {
                  incidentFormik.setFieldValue("animalId", value);
                  incidentFormik.setFieldTouched("animalId", true);
                  setIncidents([]);
                  incidentFormik.setFieldValue("incidentTypeId", "");
                  if (value) getIncidents(value);
                }}
              >
                <Picker.Item label="Select Animal" value="" />
                {ANIMALS.map((a) => (
                  <Picker.Item
                    key={a.animal_id}
                    label={a.animal_name}
                    value={String(a.animal_id)}
                  />
                ))}
              </Picker>
            </View>
            {renderError("animalId")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Animal Count *</Text>
            <TextInput
              style={styles.input}
              value={incidentFormik.values.animalCount}
              onChangeText={(text) =>
                incidentFormik.setFieldValue(
                  "animalCount",
                  text.replace(/[^0-9]/g, "")
                )
              }
              onBlur={() => incidentFormik.setFieldTouched("animalCount", true)}
              keyboardType="numeric"
              maxLength={5}
              placeholder="Enter animal count"
            />
            {renderError("animalCount")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Incident Photo *</Text>

            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={openImageOptions}
            >
              <Ionicons
                name="cloud-upload-outline"
                size={20}
                color="#fff"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.imagePickerButtonText}>
                {incidentFormik.values.incidentPhoto
                  ? "Change Incident Photo"
                  : "Upload Incident Photo"}
              </Text>
            </TouchableOpacity>

            {incidentFormik.values.incidentPhoto ? (
              <View style={styles.previewWrapper}>
                <Image
                  source={{ uri: incidentFormik.values.incidentPhoto }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />

                <View style={styles.previewActions}>
                  <Text numberOfLines={1} style={styles.previewText}>
                    Uploaded successfully
                  </Text>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      incidentFormik.setFieldValue("incidentPhoto", "")
                    }
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {renderError("incidentPhoto")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Location Type *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={incidentFormik.values.incidentLocationId}
                onValueChange={(value) => {
                  incidentFormik.setFieldValue("incidentLocationId", value);
                  incidentFormik.setFieldTouched("incidentLocationId", true);
                }}
              >
                <Picker.Item label="-- Select Location Type --" value="" />
                <Picker.Item label="Temple" value="1" />
                <Picker.Item label="Mosque" value="2" />
                <Picker.Item label="Church" value="3" />
                <Picker.Item label="School" value="4" />
                <Picker.Item label="College" value="5" />
                <Picker.Item label="Hospital" value="6" />
                <Picker.Item label="Residential Area" value="7" />
                <Picker.Item label="Market Area" value="8" />
                <Picker.Item label="Government Office" value="9" />
                <Picker.Item label="Forest Fringe Village" value="10" />
                <Picker.Item label="Highway" value="11" />
                <Picker.Item label="Tourist Spot" value="12" />
                <Picker.Item label="Agricultural Field" value="13" />
                <Picker.Item label="Others" value="14" />
              </Picker>
            </View>
            {renderError("incidentLocationId")}
          </View>

          {incidentFormik.values.incidentLocationId === "14" && (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Other Incident Location *</Text>
              <TextInput
                style={styles.input}
                value={incidentFormik.values.otherIncidentLocation}
                onChangeText={(text) =>
                  incidentFormik.setFieldValue("otherIncidentLocation", text)
                }
                onBlur={() =>
                  incidentFormik.setFieldTouched("otherIncidentLocation", true)
                }
                placeholder="Enter other incident location"
              />
              {renderError("otherIncidentLocation")}
            </View>
          )}

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Incident Type *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={incidentFormik.values.incidentTypeId}
                onValueChange={(value) => {
                  incidentFormik.setFieldValue("incidentTypeId", value);
                  incidentFormik.setFieldTouched("incidentTypeId", true);
                }}
              >
                <Picker.Item label="Select Type" value="" />
                {INCIDENTS.map((i) => (
                  <Picker.Item
                    key={i.incident_type_id}
                    label={i.incident_type}
                    value={String(i.incident_type_id)}
                  />
                ))}
              </Picker>
            </View>
            {renderError("incidentTypeId")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Date of Incident *</Text>
            <TouchableOpacity
              style={styles.selectorBox}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.selectorText}>
                {incidentFormik.values.incidentDate || "Select date"}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#3856b5" />
            </TouchableOpacity>
            {renderError("incidentDate")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Time of Incident *</Text>
            <TouchableOpacity
              style={styles.selectorBox}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.selectorText}>
                {incidentFormik.values.incidentTime || "Select time"}
              </Text>
              <Ionicons name="time-outline" size={20} color="#3856b5" />
            </TouchableOpacity>
            {renderError("incidentTime")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Latitude *</Text>
            {pageLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#3856b5" />
                <Text style={styles.loadingText}>Fetching location...</Text>
              </View>
            ) : (
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={String(incidentFormik.values.latitude || "")}
                editable={false}
              />
            )}
            {renderError("latitude")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Longitude *</Text>
            {pageLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#3856b5" />
                <Text style={styles.loadingText}>Fetching location...</Text>
              </View>
            ) : (
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={String(incidentFormik.values.longitude || "")}
                editable={false}
              />
            )}
            {renderError("longitude")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Severity of Categorization *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={incidentFormik.values.severityOfUrgency}
                onValueChange={(value) => {
                  incidentFormik.setFieldValue("severityOfUrgency", value);
                  incidentFormik.setFieldTouched("severityOfUrgency", true);
                }}
              >
                <Picker.Item label="Select Severity" value="" />
                <Picker.Item label="Low" value="Low" />
                <Picker.Item label="Medium" value="Medium" />
                <Picker.Item label="High" value="High" />
                <Picker.Item label="Critical" value="Critical" />
              </Picker>
            </View>
            {renderError("severityOfUrgency")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Landmark *</Text>
            <TextInput
              style={styles.input}
              value={incidentFormik.values.landmark}
              onChangeText={(text) =>
                incidentFormik.setFieldValue("landmark", text)
              }
              onBlur={() => incidentFormik.setFieldTouched("landmark", true)}
              placeholder="Enter landmark"
            />
            {renderError("landmark")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>District *</Text>
            <TextInput
              style={styles.input}
              value={incidentFormik.values.district}
              onChangeText={(text) =>
                incidentFormik.setFieldValue("district", text)
              }
              onBlur={() => incidentFormik.setFieldTouched("district", true)}
              placeholder="Enter district"
            />
            {renderError("district")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Mandal *</Text>
            <TextInput
              style={styles.input}
              value={incidentFormik.values.mandal}
              onChangeText={(text) =>
                incidentFormik.setFieldValue("mandal", text)
              }
              onBlur={() => incidentFormik.setFieldTouched("mandal", true)}
              placeholder="Enter mandal"
            />
            {renderError("mandal")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Village *</Text>
            <TextInput
              style={styles.input}
              value={incidentFormik.values.village}
              onChangeText={(text) =>
                incidentFormik.setFieldValue("village", text)
              }
              onBlur={() => incidentFormik.setFieldTouched("village", true)}
              placeholder="Enter village"
            />
            {renderError("village")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Mobile No *</Text>
            <TextInput
              style={[styles.input, status && styles.disabledInput]}
              value={incidentFormik.values.mobileNo}
              onChangeText={(text) =>
                incidentFormik.setFieldValue(
                  "mobileNo",
                  text.replace(/[^0-9]/g, "")
                )
              }
              onBlur={() => incidentFormik.setFieldTouched("mobileNo", true)}
              keyboardType="numeric"
              maxLength={10}
              editable={!status}
              placeholder="Enter mobile number"
            />
            {renderError("mobileNo")}
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Description / Notes *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={incidentFormik.values.description}
              onChangeText={(text) =>
                incidentFormik.setFieldValue("description", text)
              }
              onBlur={() => incidentFormik.setFieldTouched("description", true)}
              placeholder="Enter description"
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            {renderError("description")}
            <Text style={styles.charCount}>
              {incidentFormik.values.description.length}/500 characters
            </Text>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => GetOtp(incidentFormik.values.mobileNo)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="paper-plane-outline"
                  size={20}
                  color="#fff"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitButtonText}>
                  Get OTP & Submit Incident
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {showDatePicker && (
        <DateTimePicker
          value={
            incidentFormik.values.incidentDate
              ? new Date(incidentFormik.values.incidentDate)
              : new Date()
          }
          mode="date"
          maximumDate={new Date()}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              incidentFormik.setFieldValue(
                "incidentDate",
                formatDateForInput(selectedDate)
              );
            }
          }}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={new Date()}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedTime) => {
            setShowTimePicker(false);
            if (selectedTime) {
              incidentFormik.setFieldValue(
                "incidentTime",
                formatTimeForInput(selectedTime)
              );
            }
          }}
        />
      )}

      {/* Validation Modal */}
      <Modal
        visible={showValidationModal}
        transparent
        animationType="fade"
        onRequestClose={handleCloseValidationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Please fix the below Fields</Text>

            <ScrollView style={{ maxHeight: 300 }}>
              {validationErrors.map((error, index) => (
                <View key={index} style={styles.validationItem}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color="#dc2626"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.validationText}>
                    <Text style={{ fontWeight: "700" }}>
                      {getFieldLabel(error.field)}:
                    </Text>{" "}
                    {error.message}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, { marginTop: 16 }]}
              onPress={handleCloseValidationModal}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OTP Modal */}
      <Modal
        visible={showOtpModal}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter OTP</Text>
            <Text style={styles.modalSubTitle}>
              Please enter the 6-digit OTP sent to{" "}
              {incidentFormik.values.mobileNo}
            </Text>

            <View style={styles.otpRow}>
              {otpValues.map((value, index) => (
                <TextInput
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  style={styles.otpInput}
                  value={value}
                  onChangeText={(text) => handleOtpChange(index, text)}
                  onKeyPress={(e) => handleOtpKeyPress(index, e)}
                  keyboardType="numeric"
                  maxLength={1}
                  textAlign="center"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[
                styles.modalButton,
                (isSubmitting || otpValues.join("").length !== 6) &&
                  styles.disabledButton,
              ]}
              onPress={handleSubmitWithOtp}
              disabled={isSubmitting || otpValues.join("").length !== 6}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.modalButtonText}>Verify OTP & Submit</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCloseModal}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default IncidentReporting;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#eef3ff",
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#102a43",
    textAlign: "center",
    marginBottom: 6,
  },
  subTitle: {
    textAlign: "center",
    color: "#52708f",
    marginBottom: 18,
    fontSize: 13,
    fontWeight: "500",
  },
  fieldBlock: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe4ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#111827",
  },
  disabledInput: {
    backgroundColor: "#eef2f7",
    color: "#6b7280",
  },
  textArea: {
    minHeight: 100,
  },
  pickerWrapper: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe4ff",
    borderRadius: 12,
    overflow: "hidden",
  },
  selectorBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe4ff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectorText: {
    color: "#111827",
    fontSize: 14,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 2,
  },
  charCount: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "right",
    marginTop: 5,
  },
  loadingBox: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#dbe4ff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  loadingText: {
    marginLeft: 10,
    color: "#3856b5",
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#16a34a",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
  imagePickerButton: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  imagePickerButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  previewWrapper: {
    marginTop: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#dbe4ff",
  },
  previewImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#e5e7eb",
  },
  previewActions: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  previewText: {
    flex: 1,
    color: "#334155",
    fontWeight: "600",
    marginRight: 10,
  },
  removeButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    marginLeft: 6,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 10,
    textAlign: "center",
  },
  modalSubTitle: {
    textAlign: "center",
    color: "#475569",
    marginBottom: 18,
    fontSize: 14,
  },
  validationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  validationText: {
    flex: 1,
    color: "#334155",
    lineHeight: 20,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  otpInput: {
    width: 46,
    height: 54,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
  },
  modalButton: {
    backgroundColor: "#16a34a",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: "#64748b",
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
import Toast from "react-native-toast-message";

export const showSuccessToast = (msg) => {
  Toast.show({
    type: "success",
    text1: "Success",
    text2: msg,
    topOffset: 80, // distance from top in pixels
    position: "top",
  });
};

export const showErrorToast = (msg) => {
  Toast.show({
    type: "error",
    text1: "Error",
    text2: msg,
    position: "top",
  });
};

export const showInfoToast = (msg) => {
  Toast.show({
    type: "info",
    text1: "Info",
    text2: msg,
    position: "top",
  });
};

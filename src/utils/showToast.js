// toast.js
import { Toast } from 'react-native-sprinkle-toast';
import { Platform, StatusBar } from 'react-native';

// Get proper top offset based on platform and header
const getTopOffset = () => {
  return Platform.select({
    ios: 60, // Below iOS header
    android: StatusBar.currentHeight + 20 || 50, // Below Android status bar
    default: 50,
  });
};

export const showSuccessToast = (msg) => {
  Toast.show({
    message: msg,
    type: 'success',
    showSprinkles: true,
    sprinkleStyle: 'stars',
    position: 'top',
    topOffset: 50, // Dynamic offset based on platform
    duration: 3000,
  });
};

export const showErrorToast = (msg) => {
  Toast.show({
    message: msg,
    type: 'error',
    position: 'top',
    topOffset: getTopOffset(), // Dynamic offset based on platform
    showProgress: true,
    duration: 4000,
  });
};

export const showInfoToast = (msg) => {
  Toast.show({
    message: msg,
    type: 'info',
    position: 'top',
    topOffset: getTopOffset(), // Dynamic offset based on platform
    duration: 3000,
  });
};

// Alternative: Bottom positioning if you prefer
export const showSuccessToastBottom = (msg) => {
  Toast.show({
    message: msg,
    type: 'success',
    showSprinkles: true,
    sprinkleStyle: 'stars',
    position: 'bottom',
    bottomOffset: 80, // Above bottom tabs/navigation
    duration: 3000,
  });
};

export const showErrorToastBottom = (msg) => {
  Toast.show({
    message: msg,
    type: 'error',
    position: 'bottom',
    bottomOffset: 80,
    showProgress: true,
    duration: 4000,
  });
};

export const showInfoToastBottom = (msg) => {
  Toast.show({
    message: msg,
    type: 'info',
    position: 'bottom',
    bottomOffset: 80,
    duration: 3000,
  });
};
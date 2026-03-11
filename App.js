import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./src/screens/HomeScreen";

import { persistedStore, store } from "./src/reducers/allReducers";
import SessionChecking from "./src/sitelayout/SessionChecking";
import SiteLayout from "./src/sitelayout/SiteLayout";
import IncidentReporting from "./src/hanuman/IncidentReporting";
import ChangePassword from "./src/sitelayout/ChangePassword";
import ProfileUpdate from "./src/sitelayout/ProfileUpdate";
import Toast from "react-native-toast-message";
import ModalPopup from "./src/sitelayout/ModalPopup";
import Overlay from "./src/sitelayout/Overlay";
import LoginCommon from "./src/screens/LoginCommon";
import { ToastProvider } from "react-native-sprinkle-toast";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistedStore}>
        <ToastProvider>
          <NavigationContainer>
            <ModalPopup />
            <Overlay />
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{ headerShown: false }}
            >
              {/* Login Screen */}
              <Stack.Screen name="Login" component={LoginCommon} />
              <Stack.Screen
                name="IncidentReporting"
                component={IncidentReporting}
              />
              {/* <Stack.Screen name="ProfileUpdate" component={ProfileUpdate} /> */}

              <Stack.Screen name="ProfileUpdate">
                {(props) => (
                  <SiteLayout
                    navigation={props.navigation}
                    currentScreenName="ProfileUpdate"
                  >
                    <ProfileUpdate {...props} />
                  </SiteLayout>
                )}
              </Stack.Screen>
              <Stack.Screen name="ChangePassword">
                {(props) => (
                  <SiteLayout
                    navigation={props.navigation}
                    currentScreenName="ChangePassword"
                  >
                    <ChangePassword {...props} />
                  </SiteLayout>
                )}
              </Stack.Screen>
              {/* Protected HOME Screen */}
              <Stack.Screen name="HOME">
                {(props) => (
                  <SessionChecking navigation={props.navigation}>
                    <SiteLayout
                      navigation={props.navigation}
                      currentScreenName="HOME"
                    >
                      <HomeScreen {...props} />
                    </SiteLayout>
                  </SessionChecking>
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </ToastProvider>
      </PersistGate>
    </Provider>
  );
}

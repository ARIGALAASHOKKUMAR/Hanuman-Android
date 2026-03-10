import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginCommon from "./src/screens/LoginCommon";
import HomeScreen from "./src/screens/HomeScreen";


import { persistedStore, store } from "./src/reducers/allReducers";
import SessionChecking from "./src/sitelayout/SessionChecking";
import SiteLayout from "./src/sitelayout/SiteLayout";
import IncidentReporting from "./src/hanuman/IncidentReporting";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistedStore}>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Login"
            screenOptions={{ headerShown: false }}
          >
            {/* Login Screen */}
            <Stack.Screen name="Login" component={LoginCommon} />
            <Stack.Screen name="IncidentReporting" component={IncidentReporting} />

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
      </PersistGate>
    </Provider>
  );
}
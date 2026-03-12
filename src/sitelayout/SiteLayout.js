import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  AppState,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import BreadCrumb from "./BreadCrumb";
import { hideLoader, hideMessage, logOut } from "../actions";
import {
  LOGOUT_ALL_END_POINT,
  LOGOUT_ALL_EXCEPT_THIS_END_POINT,
  SERVICE_AUTH_END_POINT,
  commonAPICall,
  myAxios,
} from "../utils/utils";
import SessionTime from "./SessionTime";
import Icon from "react-native-vector-icons/Feather";
import { Ionicons } from "@expo/vector-icons";
import UserMessage from "./UserMessage";
import { showSuccessToast } from "../utils/showToast";

const FALLBACK_PROFILE =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const SiteLayout = ({
  children,
  navigation,
  currentScreenName = "HOME",
  showProfile = true,
}) => {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.LoginReducer);

  const [randomTrigger, setRandomTrigger] = useState(Math.random());

  const {
    username,
    userId,
    roleName,
    roleId,
    parents,
    services = [],
    photoPath,
    lastLoginTime,
    lastLogoutTime,
    lastFailureAttemptTime,
    loginLocation,
    activeUsers,
    token,
  } = state;

  const userName = username || "User";

  const [profileVisible, setProfileVisible] = useState(false);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [sessionAlertVisible, setSessionAlertVisible] = useState(false);
  const [profileMenuVisible, setProfileMenuVisible] = useState(false); // New state for profile dropdown

  const [bottomMenuVisible, setBottomMenuVisible] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [expandedChildIndex, setExpandedChildIndex] = useState(null);

  const [activeUsersCount, setActiveUsersCount] = useState(
    Number(activeUsers || 0),
  );
  const [sessionDetails, setSessionDetails] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);

  const lastActivityRef = useRef(Date.now());
  const idlePopupShownRef = useRef(false);
  const appState = useRef(AppState.currentState);
  const profileButtonRef = useRef(null); // Ref for profile button
  const [profileMenuPosition, setProfileMenuPosition] = useState({
    top: 0,
    left: 0,
  }); // Position for dropdown

  const profileSource = useMemo(() => {
    if (photoPath && typeof photoPath === "string") {
      return { uri: photoPath };
    }
    return { uri: FALLBACK_PROFILE };
  }, [photoPath]);

  const formatSessionDetails = (value) => {
    if (!value) return "No session details available.";
    return String(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?[^>]+(>|$)/g, "");
  };

  const formatSimpleHtmlText = (value) => {
    if (!value) return "-";
    return String(value)
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?[^>]+(>|$)/g, "");
  };

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    idlePopupShownRef.current = false;
  }, []);

  useEffect(() => {
    dispatch(hideLoader());
    dispatch(hideMessage());
  }, [dispatch]);

  const serviceChecking = useCallback(() => {
    if (!Array.isArray(services) || services.length === 0) return true;

    const pathName = String(currentScreenName || "").toUpperCase();

    for (let i = 0; i < services.length; i++) {
      const service = services[i];
      if (service?.[2]?.toUpperCase() === pathName) {
        return true;
      }
    }
    return false;
  }, [services, currentScreenName]);

  const [isConcurrentLoginDetected, setIsConcurrentLoginDetected] =
    useState(false);
  const intervalRef = useRef(null);

  const serviceAuthentication = useCallback(async () => {
    try {
      const response = await myAxios.get(SERVICE_AUTH_END_POINT);
      if (response.status === 200) {
        const usersCount = parseInt(
          response?.data?.activeusers?.count || 0,
          10,
        );

        let remainingSeconds = parseInt(response.data.remainingSeconds);

        setActiveUsersCount(usersCount);
        setSessionDetails(response?.data?.activeusers?.sessionDetails || "");
        setRemainingTime(remainingSeconds);
        setRandomTrigger(Math.random());
      }
    } catch (error) {
      console.log("serviceAuthentication error", error?.message || error);
    }
  }, []);

  const concurrentLoginDetection = useCallback(async () => {
    try {
      const response = await myAxios.get(SERVICE_AUTH_END_POINT);
      if (response.status === 200) {
        const activeCount = parseInt(
          response?.data?.activeusers?.count || 0,
          10,
        );
        const serverSessionDetails =
          response?.data?.activeusers?.sessionDetails || "";

        // Always update the count - this will show/hide the banner automatically
        setActiveUsersCount(activeCount);
        setSessionDetails(serverSessionDetails);

        // Only show the alert modal when user clicks the banner
        // Don't automatically set sessionAlertVisible true
        if (activeCount > 0) {
          setSessionAlertVisible(true); // Remove this line to not auto-show modal
        }
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      showSuccessToast("Error", `Concurrent login check failed: ${message}`);
      navigation?.reset?.({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }, []);

  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      concurrentLoginDetection();
    }, 3000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [concurrentLoginDetection]);

  useEffect(() => {
    serviceAuthentication();
  }, []);

  // Optional: If you want to stop the interval when the user views the session details
  // You can add this effect to clear interval when modal is open
  useEffect(() => {
    if (sessionAlertVisible && intervalRef.current) {
      // Optionally pause interval when modal is open to save resources
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (!sessionAlertVisible && !intervalRef.current) {
      // Restart interval when modal closes
      intervalRef.current = setInterval(() => {
        concurrentLoginDetection();
      }, 3000);
    }
  }, [sessionAlertVisible]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        serviceAuthentication();
        resetActivity();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      subscription.remove();
    };
  }, [serviceAuthentication, resetActivity]);

  useEffect(() => {
    if (!serviceChecking()) {
      Alert.alert("Access Denied", "You are not authorized for this screen.");
      navigation?.reset?.({
        index: 0,
        routes: [{ name: "HOME" }],
      });
    }
  }, [serviceChecking, navigation]);

  const handleLogout = () => {
    dispatch(logOut());
    setLogoutVisible(false);
    setProfileMenuVisible(false);
    navigation?.reset?.({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const logoutAll = async (type) => {
      let response;

      if (type === "A") {
        response = await commonAPICall(LOGOUT_ALL_END_POINT, {}, "POST",dispatch);
        if (response?.status === 200) {
          dispatch(logOut());
          navigation?.reset?.({
            index: 0,
            routes: [{ name: "Login" }],
          });
        }
      } else if (type === "E") {
        response = await commonAPICall(
          LOGOUT_ALL_EXCEPT_THIS_END_POINT,
          {},
          "POST",
          dispatch
        );
        if (response?.status === 200) {
          setSessionAlertVisible(false);
          serviceAuthentication();
        }
      }
    } 
  

  // Modified to show dropdown menu
  const toggleProfileMenu = () => {
    resetActivity();
    // Measure button position for dropdown placement
    if (profileButtonRef.current) {
      profileButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setProfileMenuPosition({
          top: pageY + height + 5,
          left: pageX + width - 150, // Adjust dropdown width
        });
      });
    }
    setProfileMenuVisible(!profileMenuVisible);
  };

  const openProfile = () => {
    resetActivity();
    setProfileVisible(true);
    setProfileMenuVisible(false);
  };

  const openLogoutPopup = () => {
    resetActivity();
    setLogoutVisible(true);
    setProfileMenuVisible(false);
  };

  const openNotifications = () => {
    resetActivity();
    setNotificationVisible(true);
  };

  const handleBackPress = () => {
    openLogoutPopup();
  };

  const isParentActive = (item) => {
    const current = String(currentScreenName || "").toUpperCase();

    if (String(item?.targeturl || "").toUpperCase() === current) return true;

    return (item?.childs || []).some((child) => {
      if (String(child?.targeturl_c || "").toUpperCase() === current) {
        return true;
      }

      return (child?.subchilds || []).some(
        (sub) => String(sub?.targeturl_sc || "").toUpperCase() === current,
      );
    });
  };

  const handleParentPress = (item) => {
    resetActivity();

    if (item?.childs && item.childs.length > 0) {
      setSelectedParent(item);
      setExpandedChildIndex(null);
      setBottomMenuVisible(true);
      return;
    }

    if (item?.targeturl) {
      navigation?.navigate?.(item.targeturl);
    }
  };

  const handleChildPress = (child, index) => {
    resetActivity();

    if (child?.subchilds && child.subchilds.length > 0) {
      setExpandedChildIndex((prev) => (prev === index ? null : index));
      return;
    }

    if (child?.targeturl_c) {
      setBottomMenuVisible(false);
      navigation?.navigate?.(child.targeturl_c);
    }
  };

  const handleSubChildPress = (subchild) => {
    resetActivity();
    setBottomMenuVisible(false);

    if (subchild?.targeturl_sc) {
      navigation?.navigate?.(subchild.targeturl_sc);
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <StatusBar backgroundColor="#1e7e34" />
      <Pressable
        style={styles.flex1}
        onPress={() => {
          resetActivity();
          setProfileMenuVisible(false); // Close dropdown when tapping elsewhere
        }}
      >
        {/* Enhanced Header with Green Theme */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Image
                source={require("../../assets/logo_new.png")}
                style={styles.headerLogo}
              />
              <Text style={styles.headerTitle}>H.A.N.U.M.A.N.</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            {/* <SessionTime
              remainingTime={remainingTime}
              randomTrigger={randomTrigger}
              navigation={navigation}
              style={styles.sessionTimeCompact}
            /> */}

            {showProfile && (
              <TouchableOpacity
                ref={profileButtonRef}
                style={styles.headerIconBtn}
                onPress={toggleProfileMenu}
                activeOpacity={0.7}
              >
                <View style={styles.profileImageContainer}>
                  <Image source={profileSource} style={styles.profileImage} />
                  <View style={styles.onlineIndicator} />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Profile Dropdown Menu */}
        {profileMenuVisible && (
          <View style={[styles.profileDropdown, profileMenuPosition]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={openProfile}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownIcon}>👤</Text>
              <Text style={styles.dropdownText}>Profile</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={openLogoutPopup}
              activeOpacity={0.7}
            >
              <Icon name="log-out" size={24} color="green" />
              <Text style={styles.dropdownText}> Logout</Text>
            </TouchableOpacity>
          </View>
        )}

        <UserMessage></UserMessage>

        {activeUsersCount > 0 && (
          <TouchableOpacity
            style={styles.securityBanner}
            onPress={() => setSessionAlertVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.securityBannerText}>
              ⚠ {activeUsersCount} other active session(s) detected
            </Text>
          </TouchableOpacity>
        )}

        {/* <View style={styles.breadcrumbContainer}>
          <BreadCrumb
            parents={parents || []}
            SERVLETNAME={currentScreenName}
            navigation={navigation}
          />
          <View style={styles.lastLoginContainer}>
            <Text style={styles.lastLoginText}>
              Last login: {formatSimpleHtmlText(lastLoginTime)}
            </Text>
          </View>
        </View> */}
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={resetActivity}
        >
          {children}
        </ScrollView>

        {/* <div className="col-xs-12 col-sm-12 col-lg-12 col-md-12"> */}
        {/* </div> */}

        <View style={styles.bottomNav}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomNavScroll}
          >
            {(parents || [])
              .filter(
                (item) =>
                  item?.menuitemname === "Home" ||
                  item?.menuitemname === "User Services" ||
                  item?.menuitemname === "Services" ||
                  item?.menuitemname === "Reports",
              )
              .map((item, index) => {
                const active = isParentActive(item);

                const getIcon = (name) => {
                  switch (name) {
                    case "Home":
                      return "home-outline";
                    case "User Services":
                      return "people-outline";
                    case "Services":
                      return "grid-outline";
                    case "Reports":
                      return "document-text-outline";
                    default:
                      return "apps-outline";
                  }
                };

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.bottomNavItem,
                      active && styles.bottomNavItemActive,
                    ]}
                    onPress={() => handleParentPress(item)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={getIcon(item?.menuitemname)}
                      size={24}
                      color={"#555"}
                    />
                    <Text>{item?.menuitemname}</Text>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </View>

        <Modal
          visible={bottomMenuVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setBottomMenuVisible(false)}
        >
          <Pressable
            style={styles.bottomSheetOverlay}
            onPress={() => setBottomMenuVisible(false)}
          >
            <Pressable style={styles.bottomSheet}>
              <View style={styles.sheetHandle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>
                  {selectedParent?.menuitemname || "Menu"}
                </Text>
                <TouchableOpacity onPress={() => setBottomMenuVisible(false)}>
                  <Text style={styles.sheetClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetScrollContent}
              >
                {(selectedParent?.childs || []).map((child, index) => {
                  const hasSubchilds =
                    child?.subchilds && child.subchilds.length > 0;

                  const childActive =
                    String(child?.targeturl_c || "").toUpperCase() ===
                      String(currentScreenName || "").toUpperCase() ||
                    (child?.subchilds || []).some(
                      (sub) =>
                        String(sub?.targeturl_sc || "").toUpperCase() ===
                        String(currentScreenName || "").toUpperCase(),
                    );

                  return (
                    <View key={index} style={styles.childBlock}>
                      <TouchableOpacity
                        style={[
                          styles.childRow,
                          childActive && styles.childRowActive,
                        ]}
                        onPress={() => handleChildPress(child, index)}
                        activeOpacity={0.85}
                      >
                        <Text
                          style={[
                            styles.childRowText,
                            childActive && styles.childRowTextActive,
                          ]}
                        >
                          {child?.menuitemname_c || "Untitled"}
                        </Text>

                        {hasSubchilds && (
                          <Text
                            style={[
                              styles.childArrow,
                              childActive && styles.childRowTextActive,
                            ]}
                          >
                            {expandedChildIndex === index ? "▲" : "▼"}
                          </Text>
                        )}
                      </TouchableOpacity>

                      {hasSubchilds && expandedChildIndex === index && (
                        <View style={styles.subChildWrapper}>
                          {child.subchilds.map((subchild, subIndex) => {
                            const isSubActive =
                              String(
                                subchild?.targeturl_sc || "",
                              ).toUpperCase() ===
                              String(currentScreenName || "").toUpperCase();

                            return (
                              <TouchableOpacity
                                key={subIndex}
                                style={[
                                  styles.subChildRow,
                                  isSubActive && styles.subChildRowActive,
                                ]}
                                onPress={() => handleSubChildPress(subchild)}
                                activeOpacity={0.85}
                              >
                                <Text
                                  style={[
                                    styles.subChildRowText,
                                    isSubActive && styles.subChildRowTextActive,
                                  ]}
                                >
                                  {subchild?.menuitemname_sc || "Untitled"}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={profileVisible} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Profile Details</Text>
              <Image source={profileSource} style={styles.modalProfileImage} />

              <Text style={styles.detailText}>USER ID: {userId || "-"}</Text>
              <Text style={styles.detailText}>Name: {username || "-"}</Text>
              <Text style={styles.detailText}>Role: {roleName || "-"}</Text>
              <Text style={styles.detailText}>
                Last Login Time: {formatSimpleHtmlText(lastLoginTime)}
              </Text>
              <Text style={styles.detailText}>
                Last Logout Time: {formatSimpleHtmlText(lastLogoutTime)}
              </Text>
              <Text style={styles.detailText}>
                Last Failure Login Time:{" "}
                {formatSimpleHtmlText(lastFailureAttemptTime)}
              </Text>

              {!!loginLocation && roleId === 1 && (
                <Text style={styles.detailText}>
                  Login Location: {loginLocation}
                </Text>
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setProfileVisible(false)}
              >
                <Text style={styles.primaryBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={notificationVisible} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Notifications</Text>

              <View style={styles.notificationBox}>
                <Text style={styles.notificationTitle}></Text>
                <Text style={styles.notificationMsg}>REACT</Text>
                <Text style={styles.notificationTime}>Just now</Text>
              </View>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setNotificationVisible(false)}
              >
                <Text style={styles.primaryBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal visible={logoutVisible} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Logout</Text>
              <Text style={styles.modalSubTitle}>
                Are you sure you want to logout?
              </Text>

              <View style={styles.rowButtons}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setLogoutVisible(false);
                    serviceAuthentication();
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Stay Connected</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dangerBtn}
                  onPress={handleLogout}
                >
                  <Text style={styles.dangerBtnText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={sessionAlertVisible} animationType="fade" transparent>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalCard, { maxHeight: "80%" }]}>
              <Text style={[styles.modalTitle, { color: "#d9534f" }]}>
                Security Alert
              </Text>

              <Text style={styles.alertHeading}>
                There are {activeUsersCount} other active session(s) using this
                account.
              </Text>

              <ScrollView style={styles.sessionDetailsBox}>
                <Text style={styles.sessionDetailsText}>
                  {formatSessionDetails(sessionDetails)}
                </Text>
              </ScrollView>

              <Text style={styles.alertInstruction}>
                Review the session details above. If this looks suspicious,
                logout from all sessions.
              </Text>

              <View style={styles.columnButtons}>
                <TouchableOpacity
                  style={styles.dangerFullBtn}
                  onPress={() => logoutAll("A")}
                >
                  <Text style={styles.dangerBtnText}>
                    Logout from All Sessions
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.warningFullBtn}
                  onPress={() => logoutAll("E")}
                >
                  <Text style={styles.warningBtnText}>
                    Logout from All Except This Session
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtnFull}
                  onPress={() => setSessionAlertVisible(false)}
                >
                  <Text style={styles.secondaryBtnText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </Pressable>
    </SafeAreaView>
  );
};

export default SiteLayout;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    // backgroundColor: "white", // Light greenish background
  },
  // Enhanced Header with Green Theme
  header: {
    backgroundColor: "white", // Deep green
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
    lineHeight: 28,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerLogo: {
    width: 60,
    height: 60,
    borderRadius: 32,
    marginRight: 8,
    backgroundColor: "#fff",
  },
  headerTitle: {
    color: "green",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  sessionTimeCompact: {
    marginRight: 8,
  },
  headerIconBtn: {
    marginLeft: 8,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  headerIconText: {
    fontSize: 18,
    color: "#fff",
  },
  logoutBtn: {
    backgroundColor: "transparent",
  },
  logoutIconText: {
    color: "#fff",
  },
  // Profile Dropdown Menu
  profileDropdown: {
    position: "absolute",
    width: 150,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  dropdownIcon: {
    fontSize: 16,
    marginRight: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 4,
  },
  // Enhanced Profile Strip
  profileStrip: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f0e0",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginHorizontal: 12,
    borderRadius: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    height: 56,
    width: 56,
    borderRadius: 28,
    backgroundColor: "#e8f5e8",
    borderWidth: 3,
    borderColor: "#1e7e34",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4caf50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a3b1a",
  },
  profileRole: {
    fontSize: 14,
    color: "#4a784a",
    marginTop: 2,
    fontWeight: "500",
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f0faf0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  bellIcon: {
    fontSize: 20,
  },
  notificationDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ff4444",
    borderWidth: 1,
    borderColor: "#fff",
  },
  securityBanner: {
    backgroundColor: "#fff3e0",
    borderColor: "#ffb74d",
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  securityBannerText: {
    color: "#e65100",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  breadcrumbContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e0f0e0",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lastLoginContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f8fff8",
  },
  lastLoginText: {
    fontSize: 12,
    color: "#4a6a4a",
    fontWeight: "500",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#d0e8d0",
    paddingVertical: 7,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  bottomNavScroll: {
    paddingHorizontal: 10,
    alignItems: "center",
  },
  bottomNavItem: {
    minWidth: 90,
    maxWidth: 140,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    // borderWidth: 1,
    // backgroundColor: "#1e7e34",
    // borderColor: "#1e7e34",
  },
  bottomNavItemActive: {
    // backgroundColor: "#1e7e34",
    // borderColor: "#1e7e34",
  },
  bottomNavText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  bottomNavTextActive: {
    color: "#fff",
  },
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    maxHeight: "75%",
  },
  sheetHandle: {
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#d0d7e2",
    alignSelf: "center",
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  sheetClose: {
    fontSize: 20,
    color: "#6b7280",
    fontWeight: "700",
  },
  sheetScrollContent: {
    paddingBottom: 10,
  },
  childBlock: {
    marginBottom: 10,
  },
  childRow: {
    backgroundColor: "#f8faff",
    borderWidth: 1,
    borderColor: "#e7edff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  childRowActive: {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
  },
  childRowText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    flex: 1,
    paddingRight: 10,
  },
  childRowTextActive: {
    color: "#2948c7",
    fontWeight: "700",
  },
  childArrow: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "700",
  },
  subChildWrapper: {
    marginTop: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: "#dbe4ff",
    marginLeft: 8,
  },
  subChildRow: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#edf1ff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  subChildRowActive: {
    backgroundColor: "#eaf0ff",
    borderColor: "#bdd0ff",
  },
  subChildRowText: {
    fontSize: 13,
    color: "#475467",
    fontWeight: "600",
  },
  subChildRowTextActive: {
    color: "#2442bf",
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
    marginBottom: 12,
  },
  modalSubTitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 16,
  },
  modalProfileImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignSelf: "center",
    marginBottom: 16,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#1e7e34",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: "#eef2ff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginRight: 8,
  },
  secondaryBtnFull: {
    width: "100%",
    backgroundColor: "#eef2ff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#334",
    fontWeight: "700",
  },
  dangerBtn: {
    flex: 1,
    backgroundColor: "#d9534f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginLeft: 8,
  },
  dangerBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  rowButtons: {
    flexDirection: "row",
    marginTop: 4,
  },
  columnButtons: {
    gap: 10,
    marginTop: 14,
  },
  dangerFullBtn: {
    width: "100%",
    backgroundColor: "#d9534f",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  warningFullBtn: {
    width: "100%",
    backgroundColor: "#fff3cd",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  warningBtnText: {
    color: "#8a6d3b",
    fontWeight: "700",
  },
  alertHeading: {
    fontSize: 15,
    color: "#c0392b",
    fontWeight: "700",
    marginBottom: 12,
  },
  alertInstruction: {
    fontSize: 13,
    color: "#555",
    marginTop: 12,
  },
  sessionDetailsBox: {
    maxHeight: 220,
    borderWidth: 1,
    borderColor: "#f1d1cf",
    backgroundColor: "#fff8f7",
    borderRadius: 10,
    padding: 10,
  },
  sessionDetailsText: {
    color: "#8d1f1a",
    fontSize: 13,
    lineHeight: 20,
  },
  notificationBox: {
    backgroundColor: "#f7f9ff",
    borderWidth: 1,
    borderColor: "#e3e9ff",
    borderRadius: 12,
    padding: 14,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#233",
  },
  notificationMsg: {
    fontSize: 14,
    color: "#4a6cf7",
    marginTop: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: "#777",
    marginTop: 6,
  },
});

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
import {
  hideLoader,
  hideMessage,
  logOut,
  showModal,
  hideModal,
} from "../actions";
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
import { showErrorToast, showSuccessToast } from "../utils/showToast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import IconFA from "react-native-vector-icons/FontAwesome";

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
  const [profileMenuVisible, setProfileMenuVisible] = useState(false);

  const [bottomMenuVisible, setBottomMenuVisible] = useState(false);
  const [selectedParent, setSelectedParent] = useState(null);
  const [expandedChildIndex, setExpandedChildIndex] = useState(null);

  const [activeUsersCount, setActiveUsersCount] = useState(
    Number(activeUsers || 0),
  );
  const [sessionDetails, setSessionDetails] = useState("");
  const [remainingTime, setRemainingTime] = useState(0);

  const [lastActivity, setLastActivity] = useState(Date.now());
  const idlePopupShownRef = useRef(false);
  const appState = useRef(AppState.currentState);
  const profileButtonRef = useRef(null);
  const [profileMenuPosition, setProfileMenuPosition] = useState({
    top: 0,
    left: 0,
  });

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
    setLastActivity(Date.now());
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
        console.log("Concurrent login check response", response);

        const activeCount = parseInt(
          response?.data?.activeusers?.count || 0,
          10,
        );
        const serverSessionDetails =
          response?.data?.activeusers?.sessionDetails || "";

        setActiveUsersCount(activeCount);
        setSessionDetails(serverSessionDetails);
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";

      console.log("Concurrent login check error", message);

      showErrorToast(`${message}`);
      navigation?.reset?.({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }
  }, []);

  // Idle Timeout Effect
  // useEffect(() => {
  //   const resetActivityTimeout = () => {
  //     setLastActivity(Date.now());
  //     idlePopupShownRef.current = false;
  //   };

  //   const subscription = AppState.addEventListener('change', (nextAppState) => {
  //     if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
  //       resetActivityTimeout();
  //     }
  //     appState.current = nextAppState;
  //   });

  //   const intervalId = setInterval(() => {
  //     if (Date.now() - lastActivity >= 1 * 60 * 1000 && !idlePopupShownRef.current) {
  //       showLogoutPopupWarning();
  //     }
  //   }, 1000);

  //   return () => {
  //     clearInterval(intervalId);
  //     subscription.remove();
  //   };
  // }, [lastActivity, dispatch]);

  const showLogoutPopupWarning = () => {
    idlePopupShownRef.current = true;

    dispatch(
      showModal(
        <View style={styles.idleModalContent}>
          <Text style={styles.idleModalIcon}>⚠️</Text>
          <Text style={styles.idleModalText}>
            It seems you've been idle for more than 15 minutes. Click 'Stay
            Connected' to stay logged in or 'Logout' to log out.
          </Text>
          <View style={styles.idleModalButtons}>
            <TouchableOpacity
              style={[styles.idleButton, styles.logoutButton]}
              onPress={handleLogout}
            >
              <IconFA name="power-off" size={16} color="black" />
              <Text style={styles.buttonText}> Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.idleButton, styles.stayConnectedButton]}
              onPress={() => {
                serviceAuthentication();
                idlePopupShownRef.current = false;
                dispatch(hideModal());
                resetActivity();
              }}
            >
              <IconFA name="check" size={16} color="black" />
              <Text style={styles.buttonText}> Stay Connected</Text>
            </TouchableOpacity>
          </View>
        </View>,
      ),
    );
  };

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      concurrentLoginDetection();
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [concurrentLoginDetection]);

  useEffect(() => {
    serviceAuthentication();
  }, []);

  useEffect(() => {
    if (sessionAlertVisible && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (!sessionAlertVisible && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        concurrentLoginDetection();
      }, 3000);
    }
  }, [sessionAlertVisible]);

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
    dispatch(hideModal());
    navigation?.reset?.({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const logoutAll = async (type) => {
    let response;

    if (type === "A") {
      response = await commonAPICall(
        LOGOUT_ALL_END_POINT,
        {},
        "POST",
        dispatch,
      );
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
        dispatch,
      );
      if (response?.status === 200) {
        setSessionAlertVisible(false);
        serviceAuthentication();
      }
    }
  };

  const toggleProfileMenu = () => {
    resetActivity();
    if (profileButtonRef.current) {
      profileButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setProfileMenuPosition({
          top: 62,
          right: 5,
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

  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setBlink((prev) => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <StatusBar backgroundColor="#1e7e34" />
      <Pressable
        style={styles.flex1}
        onPress={() => {
          resetActivity();
          setProfileMenuVisible(false);
        }}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.headerTitle}>LABOUR DEPARTMENT</Text>
              <Text style={styles.username}>Welcome: {username}</Text>
            </View>
          </View>

          {activeUsersCount > 0 && (
            <TouchableOpacity
              style={styles.iconWrapper}
              onPress={() => setSessionAlertVisible(true)}
            >
              <MaterialCommunityIcons
                name="incognito"
                size={24}
                color="#374151"
                style={[blink && styles.blinkIcon]}
              />
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeUsersCount}</Text>
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.headerRight}>
            <SessionTime
              remainingTime={remainingTime}
              randomTrigger={randomTrigger}
              navigation={navigation}
              style={styles.sessionTimeCompact}
            />

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

        {profileMenuVisible && (
          <View style={[styles.profileDropdown, profileMenuPosition]}>
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() =>
                dispatch(
                  showModal(
                    <View>
                      <Text style={styles.modalTitle}>Profile Details</Text>
                      <Image
                        source={profileSource}
                        style={styles.modalProfileImage}
                      />

                      <Text style={styles.detailText}>
                        USER ID: {userId || "-"}
                      </Text>
                      <Text style={styles.detailText}>
                        Name: {username || "-"}
                      </Text>
                      <Text style={styles.detailText}>
                        Role: {roleName || "-"}
                      </Text>
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
                    </View>,
                  ),
                )
              }
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

        <UserMessage />

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={resetActivity}
          onTouchStart={resetActivity}
          onMomentumScrollBegin={resetActivity}
          scrollEventThrottle={16} // Add this for smoother scrolling
          removeClippedSubviews={true} // Improve performance by removing off-screen views
          maxToRenderPerBatch={10} // Limit rendering batch size
          windowSize={5}
        >
          {children}
        </ScrollView>

        <View style={styles.bottomNav}>
          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
              width: "100%",
              gap: 0.5,
            }}
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
                    <Text>
                      {item?.menuitemname === "User Services"
                        ? "Settings"
                        : item?.menuitemname}
                    </Text>
                  </TouchableOpacity>
                );
              })}
          </View>
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
  },
  header: {
    backgroundColor: "white",
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
    flexDirection: "column",
    alignItems: "flex-start",
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
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  headerTitle2: {
    color: "green",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    color: "black",
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
    height: 36,
    width: 36,
    borderRadius: 25,
    backgroundColor: "#e8f5e8",
    borderWidth: 1,
    borderColor: "#1e7e34",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 7,
    backgroundColor: "#4caf50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  iconWrapper: {
    position: "relative",
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
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
    width: "100%",
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
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNavItemActive: {},
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
  username: {
    fontSize: 11,
    color: "#2563EB",
    fontWeight: "600",
    textShadowColor: "transparent",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 0,
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
  blinkIcon: {
    opacity: 0.4,
  },
  // Idle Modal Styles
  idleModalContent: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  idleModalIcon: {
    fontSize: 40,
    marginBottom: 15,
    color: "#FF7900",
  },
  idleModalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
  },
  idleModalButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  idleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  // Add these to your existing StyleSheet, preferably after the existing modal styles

  idleModalContent: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
  },
  idleModalIcon: {
    fontSize: 40,
    marginBottom: 15,
    color: "#FF7900",
  },
  idleModalText: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  idleModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  idleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  logoutButton: {
    backgroundColor: "#d9534f",
  },
  stayConnectedButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 8,
  },
});

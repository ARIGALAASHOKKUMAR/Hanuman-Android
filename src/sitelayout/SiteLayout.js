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

        setActiveUsersCount(activeCount);
        setSessionDetails(serverSessionDetails);

        if (activeCount > 0) {
          setSessionAlertVisible(true);
        }
      }
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      Alert.alert("Error", `Concurrent login check failed: ${message}`);
    }
  }, []);

  useEffect(() => {
    serviceAuthentication();
  }, [serviceAuthentication]);

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
    navigation?.reset?.({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  const logoutAll = async (type) => {
    try {
      let response;

      if (type === "A") {
        response = await commonAPICall(LOGOUT_ALL_END_POINT, {}, "POST");
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
        );
        if (response?.status === 200) {
          setSessionAlertVisible(false);
          serviceAuthentication();
        }
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "Something went wrong while processing session logout.",
      );
    }
  };

  const openProfile = () => {
    resetActivity();
    setProfileVisible(true);
  };

  const openNotifications = () => {
    resetActivity();
    setNotificationVisible(true);
  };

  const openLogoutPopup = () => {
    resetActivity();
    setLogoutVisible(true);
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
      <Pressable style={styles.flex1} onPress={resetActivity}>
        <View style={styles.header}>
          <View style={styles.headerLeftWrap}>
            <View style={styles.headerLeft}>
              <Text style={styles.appTitle}>H.A.N.U.M.A.N.</Text>
              <Text style={styles.welcomeText}>
                {userName}
                {roleName ? ` (${roleName})` : ""}
              </Text>
            </View>
          </View>

          
          <SessionTime
            remainingTime={remainingTime}
            randomTrigger={randomTrigger}
            navigation={navigation}
          />

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.smallActionBtn}
              onPress={openNotifications}
            >
              <Text style={styles.smallActionText}>🔔</Text>
            </TouchableOpacity>

            {showProfile && (
              <TouchableOpacity
                style={styles.smallActionBtn}
                onPress={openProfile}
              >
                <Text style={styles.smallActionText}>👤</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.smallActionBtn, styles.logoutMiniBtn]}
              onPress={openLogoutPopup}
            >
              <Text style={[styles.smallActionText, styles.logoutMiniText]}>
                ⏻
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.profileStrip}>
          <View style={styles.profileLeft}>
            <Image source={profileSource} style={styles.profileImage} />
            <View style={styles.profileTextContainer}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileRole}>{roleName || "-"}</Text>
            </View>
          </View>
        </View>

        {activeUsersCount > 0 && (
          <TouchableOpacity
            style={styles.securityBanner}
            onPress={() => setSessionAlertVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.securityBannerText}>
              ⚠ Duplicate or suspicious login activity detected for{" "}
              {activeUsersCount} session(s). Tap to review.
            </Text>
          </TouchableOpacity>
        )}

        <View style={styles.breadcrumbContainer}>
          <BreadCrumb
            parents={parents || []}
            SERVLETNAME={currentScreenName}
            navigation={navigation}
          />
        </View>

        <View style={styles.lastLoginContainer}>
          <Text style={styles.lastLoginText}>
            Last successful login: {formatSimpleHtmlText(lastLoginTime)}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={resetActivity}
        >
          {children}
        </ScrollView>

        <View style={styles.bottomNav}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.bottomNavScroll}
          >
            {(parents || []).map((item, index) => {
              const active = isParentActive(item);
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
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.bottomNavText,
                      active && styles.bottomNavTextActive,
                    ]}
                  >
                    {item?.menuitemname || "Menu"}
                  </Text>
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
                <Text style={styles.notificationTitle}>
                  Andhra Pradesh Public Libraries
                </Text>
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
    backgroundColor: "#f2f5ff",
  },
  header: {
    backgroundColor: "#4a6cf7",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeftWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 8,
  },
  appTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  welcomeText: {
    color: "#eaf0ff",
    fontSize: 12,
    marginTop: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  smallActionBtn: {
    backgroundColor: "#fff",
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  smallActionText: {
    fontSize: 16,
  },
  logoutMiniBtn: {
    backgroundColor: "#fff5f5",
  },
  logoutMiniText: {
    color: "#d9534f",
  },
  profileStrip: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e7ebf3",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  profileImage: {
    height: 50,
    width: 50,
    borderRadius: 25,
    backgroundColor: "#ddd",
  },
  profileTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  profileRole: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  securityBanner: {
    backgroundColor: "#fff1f0",
    borderColor: "#ffd1cf",
    borderWidth: 1,
    marginHorizontal: 12,
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
  },
  securityBannerText: {
    color: "#c0392b",
    fontSize: 13,
    fontWeight: "600",
  },
  breadcrumbContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e7ebf3",
  },
  lastLoginContainer: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#f8faff",
  },
  lastLoginText: {
    fontSize: 12,
    color: "#6a6a6a",
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
    borderTopColor: "#e5e7eb",
    paddingVertical: 10,
    elevation: 12,
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
    backgroundColor: "#f3f6ff",
    borderRadius: 14,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e7ff",
  },
  bottomNavItemActive: {
    backgroundColor: "#4a6cf7",
    borderColor: "#4a6cf7",
  },
  bottomNavText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
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
    backgroundColor: "#4a6cf7",
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

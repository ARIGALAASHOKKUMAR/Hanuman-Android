import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
} from "react-native";
import { useSelector } from "react-redux";
import Icon from "react-native-vector-icons/MaterialIcons";
import { SafeAreaView } from "react-native-safe-area-context";

const HomeScreen = ({ navigation }) => {
  const state = useSelector((state) => state.LoginReducer);

  const portals = [
    {
      name: "E-Shram",
      url: "https://eshram.gov.in/",
      color: "#FF6B6B",
      description: "National Database of Unorganised Workers",
    },
    {
      name: "AP BOCWWB",
      url: "https://apbocwwb.ap.gov.in/apbocwwb/",
      color: "#4ECDC4",
      description: "Building & Construction Workers Welfare Board",
    },
    {
      name: "Online Inspections (LIS)",
      url: "https://lis.ap.gov.in/",
      color: "#45B7D1",
      description: "Labour Inspection System",
    },
    {
      name: "Joint Inspections (CIS)",
      url: "https://apindustries.gov.in/cis/Public/CISReport.aspx",
      color: "#96CEB4",
      description: "Common Inspection System",
    },
    {
      name: "Samadhaan",
      url: "https://samadhan.labour.gov.in/",
      color: "#FFEAA7",
      description: "Grievance Redressal Portal",
    },
    {
      name: "Pencil Portal",
      url: "https://Pencil.gov.in",
      color: "#D4A5A5",
      description: "Platform for Effective Enforcement for No Child Labour",
    },
    {
      name: "Meeseva",
      url: "https://ap.meeseva.gov.in/",
      color: "#9B59B6",
      description: "Citizen Service Delivery Platform",
    },
    {
      name: "Swarnandhra",
      url: "https://swarnandhra.ap.gov.in/",
      color: "#3498DB",
      description: "Integrated Development Portal",
    },
  ];

  const openPortal = (url) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  const quickStats = [
    {
      label: "Active Inspections",
      value: "24",
      icon: "assignment",
      color: "#4CAF50",
    },
    {
      label: "Pending Complaints",
      value: "12",
      icon: "warning",
      color: "#FF9800",
    },
    {
      label: "Workers Registered",
      value: "1,234",
      icon: "people",
      color: "#2196F3",
    },
    {
      label: "Establishments",
      value: "567",
      icon: "business",
      color: "#9C27B0",
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#1a237e" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>
                {state.officerName || "Labour Officer"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.profileIcon}
              onPress={() => navigation.navigate("Profile")}
            >
              <Icon name="account-circle" size={40} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.userInfoContainer}>
            <View style={styles.userInfoItem}>
              <Icon name="badge" size={16} color="#ffd700" />
              <Text style={styles.userInfoText}>
                {state.roleName || "Labour Department"}
              </Text>
            </View>
            <View style={styles.userInfoItem}>
              <Icon name="phone" size={16} color="#ffd700" />
              <Text style={styles.userInfoText}>
                {state.mobile || "+91 XXXXXXXX"}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Section */}
        {/* <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Quick Overview</Text>
          <View style={styles.statsGrid}>
            {quickStats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { borderTopColor: stat.color }]}>
                <Icon name={stat.icon} size={28} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View> */}

        {/* Labour Portals Section */}
        <View style={styles.portalsContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Labour Department Portals</Text>
            <Text style={styles.sectionSubtitle}>
              Tap to access labour welfare portals
            </Text>
          </View>

          <View style={styles.portalsGrid}>
            {portals.map((portal, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.portalCard,
                  { backgroundColor: `${portal.color}15` },
                ]}
                onPress={() => openPortal(portal.url)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.portalIconContainer,
                    { backgroundColor: portal.color },
                  ]}
                >
                  <Text style={styles.portalIconText}>
                    {portal.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.portalInfo}>
                  <Text style={styles.portalName}>{portal.name}</Text>
                  <Text style={styles.portalDescription} numberOfLines={2}>
                    {portal.description}
                  </Text>
                </View>
                <Icon name="open-in-new" size={20} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Important Links Section */}
        <View style={styles.linksContainer}>
          <Text style={styles.sectionTitle}>Important Links</Text>
          <View style={styles.linksGrid}>
            <TouchableOpacity style={styles.linkCard}>
              <Icon name="gavel" size={24} color="#1a237e" />
              <Text style={styles.linkText}>Labour Laws</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkCard}>
              <Icon name="assignment-turned-in" size={24} color="#1a237e" />
              <Text style={styles.linkText}>Compliance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkCard}>
              <Icon name="event" size={24} color="#1a237e" />
              <Text style={styles.linkText}>Schemes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkCard}>
              <Icon name="contact-support" size={24} color="#1a237e" />
              <Text style={styles.linkText}>Support</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#1a237e",
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  greeting: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 14,
  },
  userName: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  userInfoContainer: {
    flexDirection: "row",
    marginTop: 5,
    flexWrap: "wrap",
  },
  userInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    marginBottom: 5,
  },
  userInfoText: {
    color: "#fff",
    marginLeft: 5,
    fontSize: 13,
  },
  statsContainer: {
    padding: 20,
    paddingBottom: 10,
  },
  sectionHeader: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statCard: {
    width: "48%",
    // backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    borderTopWidth: 3,
    // shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  portalsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  portalsGrid: {
    flexDirection: "column",
  },
  portalCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 15,
    marginBottom: 10,
    padding: 20,
    // shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderRadius: 10,
  },
  portalIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  portalIconText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  portalInfo: {
    flex: 1,
  },
  portalName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  portalDescription: {
    fontSize: 12,
    color: "#666",
  },
  linksContainer: {
    padding: 20,
    paddingTop: 0,
  },
  linksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  linkCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  linkText: {
    marginTop: 8,
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc3545",
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default HomeScreen;

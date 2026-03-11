import React, { useEffect, useState } from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";
import { useSelector } from "react-redux";

function Overlay() {
  const { loading, loadingText } = useSelector((state) => state.LoadingReducer);

  const [userLoading, setUserLoading] = useState("Loading, Please Wait...");
  const [randomFact, setRandomFact] = useState("");

  const facts = [
    "India is the world's largest democracy.",
    "India has the third-largest startup ecosystem in the world.",
    "The first successful Indian satellite was launched in 1980.",
    "Aadhaar, India's biometric identification system, is the largest of its kind globally.",
    "ISRO's Mars Orbiter Mission made India the first Asian nation to reach Martian orbit.",
    "Kuchipudi dance originated in Andhra Pradesh.",
    "Sriharikota in Andhra Pradesh is home to ISRO's main launch center.",
    "Andhra Pradesh forests are home to tigers, elephants, deer and birds.",
    "Forest guards patrol forests to prevent poaching and illegal logging.",
    "Eco-tourism in Andhra Pradesh promotes forest conservation.",
    "భారత అటవీ శాఖ 1864 లో స్థాపించబడింది.",
    "అటవీ సంరక్షణ చట్టం 1927 లో అమలులోకి వచ్చింది.",
    "వన్యప్రాణి సంరక్షణ చట్టం 1972 లో ప్రవేశపెట్టబడింది.",
    "ఆంధ్రప్రదేశ్ అటవీ శాఖ పర్యావరణ అవగాహన కార్యక్రమాలు నిర్వహిస్తుంది.",
    "డ్రోన్ల సహాయంతో అటవీ సంరక్షణ జరుగుతోంది.",
  ];

  const getSecureRandomIndex = (length) => {
    try {
      const randomArray = new Uint32Array(1);
      if (global?.crypto?.getRandomValues) {
        global.crypto.getRandomValues(randomArray);
        return randomArray[0] % length;
      }
      return Math.floor(Math.random() * length);
    } catch {
      return Math.floor(Math.random() * length);
    }
  };

  useEffect(() => {
    setUserLoading(
      typeof loadingText === "string" && loadingText.trim()
        ? loadingText
        : "Loading, Please Wait...",
    );

    const randomIndex = getSecureRandomIndex(facts.length);
    setRandomFact(facts[randomIndex]);
  }, [loading, loadingText]);

  const isTeluguFact = /[\u0C00-\u0C7F]/.test(randomFact);

  if (!loading) return null;


  return (
    <Modal visible={loading} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>{userLoading}</Text>

          {randomFact && (
            <Text
              style={[
                styles.factText,
                isTeluguFact ? styles.teluguFactText : styles.englishFactText,
              ]}
            >
              {randomFact}
            </Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default Overlay;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    width: "90%",
    padding: 24,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  factText: {
    color: "#fff",
    marginTop: 18,
    textAlign: "center",
  },
  englishFactText: {
    fontSize: 18,
    lineHeight: 28,
  },
  teluguFactText: {
    fontSize: 24,
    lineHeight: 34,
  },
});

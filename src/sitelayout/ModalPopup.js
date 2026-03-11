import React from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { hideModal } from "../actions";

const ModalPopup = () => {
  const dispatch = useDispatch();

  const { modal, modalText } = useSelector((state) => state.ModalReducer);

  const handleClose = () => {
    dispatch(hideModal());
  };

  return (
    <Modal
      visible={modal}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>

          <Text style={styles.title}>Please fix the below Fields</Text>

          <ScrollView style={{ maxHeight: 300 }}>
            {modalText}
          </ScrollView>

          <TouchableOpacity style={styles.button} onPress={handleClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
};

export default ModalPopup;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalCard: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 10,
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginTop: 16,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
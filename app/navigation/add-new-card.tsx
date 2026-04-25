import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

type PaymentType = "card" | "paypal" | "bank";

export default function AddNewCardScreen() {
  const [paymentType, setPaymentType] = useState<PaymentType>("card");
  const [cardOwner, setCardOwner] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [saving, setSaving] = useState(false);

  const formatCardNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExp = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);

    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }

    return digits;
  };

  const handleAdd = async () => {
    if (!cardOwner.trim()) {
      Alert.alert("Required", "Please enter the card owner name.");
      return;
    }

    if (cardNumber.replace(/\s/g, "").length < 16) {
      Alert.alert("Required", "Please enter a valid 16-digit card number.");
      return;
    }

    if (!exp.trim() || !cvv.trim()) {
      Alert.alert("Required", "Please fill in EXP and CVV.");
      return;
    }

    try {
      setSaving(true);

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user?.email) {
        Alert.alert("Error", "You must be logged in.");
        return;
      }

      const last4 = cardNumber.replace(/\s/g, "").slice(-4);

      await addDoc(collection(db, "payment_methods"), {
        email: user.email,
        owner: cardOwner,
        number: cardNumber,
        exp,
        cvv,
        type: paymentType,
        last4,
        createdAt: new Date(),
      });

      Alert.alert("Card Added", "Your new card has been saved!", [
        { text: "OK", onPress: () => router.push("/navigation/payment") },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not add card. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/navigation/payment")}>
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Add New Card</Text>

          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[
                styles.typeBtn,
                paymentType === "card" && styles.typeBtnActive,
              ]}
              onPress={() => setPaymentType("card")}
            >
              <View style={styles.mastercardIcon}>
                <View
                  style={[
                    styles.mcCircle,
                    { backgroundColor: "#EB001B", marginRight: -8 },
                  ]}
                />
                <View style={[styles.mcCircle, { backgroundColor: "#F79E1B" }]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                paymentType === "paypal" && styles.typeBtnActive,
              ]}
              onPress={() => setPaymentType("paypal")}
            >
              <Text style={styles.paypalP}>
                <Text style={{ color: "#003087" }}>Pay</Text>
                <Text style={{ color: "#009cde" }}>Pal</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeBtn,
                paymentType === "bank" && styles.typeBtnActive,
              ]}
              onPress={() => setPaymentType("bank")}
            >
              <Ionicons name="business-outline" size={22} color="#555" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Card Owner</Text>
          <TextInput
            style={styles.input}
            value={cardOwner}
            onChangeText={setCardOwner}
            placeholder="Eco Lover"
            placeholderTextColor="#C5C5C5"
          />

          <Text style={styles.label}>Card Number</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={(t) => setCardNumber(formatCardNumber(t))}
            placeholder="5254 7634 8734 7690"
            placeholderTextColor="#C5C5C5"
            keyboardType="number-pad"
            maxLength={19}
          />

          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>EXP</Text>
              <TextInput
                style={styles.input}
                value={exp}
                onChangeText={(t) => setExp(formatExp(t))}
                placeholder="24/24"
                placeholderTextColor="#C5C5C5"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={[styles.halfCol, { marginLeft: 14 }]}>
              <Text style={styles.label}>CVV</Text>
              <TextInput
                style={styles.input}
                value={cvv}
                onChangeText={setCvv}
                placeholder="7763"
                placeholderTextColor="#C5C5C5"
                keyboardType="number-pad"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.addBtn, saving && { opacity: 0.7 }]}
            onPress={handleAdd}
            disabled={saving}
          >
            <Text style={styles.addBtnText}>
              {saving ? "Adding..." : "Add Card"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F4F4F4",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2D2D2D",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 48,
  },
  typeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  typeBtn: {
    width: 72,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
  },
  typeBtnActive: {
    borderColor: "#F4A347",
    backgroundColor: "#FFF8EE",
  },
  mastercardIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
  mcCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    opacity: 0.9,
  },
  paypalP: {
    fontSize: 13,
    fontWeight: "800",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A3A3A",
    marginBottom: 8,
    marginTop: 18,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  row: {
    flexDirection: "row",
  },
  halfCol: {
    flex: 1,
  },
  addBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D0D0D0",
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 40,
    marginTop: 40,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
});
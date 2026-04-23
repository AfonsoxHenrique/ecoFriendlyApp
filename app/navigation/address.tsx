import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, updateDoc, doc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

export default function AddressScreen() {
  const [docId, setDocId] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [savePrimary, setSavePrimary] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user?.email) return;

        const q = query(collection(db, "users"), where("email", "==", user.email));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const d = snap.docs[0];
          const data = d.data();
          setDocId(d.id);
          setName(data.name || "");
          setCountry(data.country || "");
          setCity(data.city || "");
          setPhone(data.phone || "");
          setAddress(data.address || "");
          setSavePrimary(data.isPrimaryAddress ?? true);
        }
      } catch (e) {
        console.error("Error loading address:", e);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !address.trim()) {
      Alert.alert("Required", "Please fill in your name and address.");
      return;
    }

    try {
      setSaving(true);
      if (docId) {
        await updateDoc(doc(db, "users", docId), {
          name,
          country,
          city,
          phone,
          address,
          isPrimaryAddress: savePrimary,
        });
      }
      Alert.alert("Saved", "Address saved successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Could not save address.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Address</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Eco lover"
            placeholderTextColor="#C5C5C5"
          />

          {/* Country + City */}
          <View style={styles.row}>
            <View style={styles.halfCol}>
              <Text style={styles.label}>Country</Text>
              <TextInput
                style={styles.input}
                value={country}
                onChangeText={setCountry}
                placeholder="Australia"
                placeholderTextColor="#C5C5C5"
              />
            </View>
            <View style={[styles.halfCol, { marginLeft: 12 }]}>
              <Text style={styles.label}>City</Text>
              <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Melbourne"
                placeholderTextColor="#C5C5C5"
              />
            </View>
          </View>

          {/* Phone */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+61 1234 5678"
            placeholderTextColor="#C5C5C5"
            keyboardType="phone-pad"
          />

          {/* Address */}
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={[styles.input, styles.addressInput]}
            value={address}
            onChangeText={setAddress}
            placeholder="555 Swanston st, Melbourne"
            placeholderTextColor="#C5C5C5"
            multiline
          />

          {/* Save as primary toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Save as primary address</Text>
            <Switch
              value={savePrimary}
              onValueChange={setSavePrimary}
              trackColor={{ false: "#E0E0E0", true: "#6DB56C" }}
              thumbColor={"#fff"}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save Address"}
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#3A3A3A",
    marginBottom: 8,
    marginTop: 16,
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
  addressInput: {
    minHeight: 52,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
  },
  halfCol: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 32,
  },
  toggleLabel: {
    fontSize: 13,
    color: "#555",
    fontWeight: "500",
  },
  saveBtn: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D0D0D0",
    paddingVertical: 14,
    alignItems: "center",
    marginHorizontal: 40,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
});

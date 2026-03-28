import { router } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

export default function ProfileScreen() {
  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user?.email) {
          setEmail(user.email);

          const q = query(collection(db, "users"), where("email", "==", user.email));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const data = querySnapshot.docs[0].data();
            setUsername(data.name || "User");
            setPhone(data.phone || "");
            setAddress(data.address || "");
          }
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Could not sign out.");
    }
  };

  const renderField = (label: string, value: string, onEdit: () => void) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <Text style={styles.fieldValue}>{value}</Text>
        <TouchableOpacity onPress={onEdit}>
          <Text style={styles.editIcon}>✎</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>

          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={{ fontSize: 20 }}>←</Text>
          </TouchableOpacity>

          <View style={styles.profileIcon}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>

          <Text style={styles.title}>Profile</Text>

          {renderField("Username", username, () => Alert.alert("Edit Username"))}
          {renderField("Email Address", email, () => Alert.alert("Edit Email"))}
          {renderField("Phone Number", phone, () => Alert.alert("Edit Phone"))}
          {renderField("Delivery Address", address, () => Alert.alert("Edit Address"))}

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContainer: { padding: 20, alignItems: "center" },
  backButton: { alignSelf: "flex-start", marginBottom: 10 },
  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#c8d6c2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  fieldContainer: { width: "100%", marginBottom: 15 },
  fieldLabel: { fontSize: 14, fontWeight: "600", color: "#555", marginBottom: 5 },
  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12
  },
  fieldValue: { fontSize: 16 },
  editIcon: { fontSize: 16, color: "green" },
  signOutButton: {
    backgroundColor: "#6B8E5A",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 50,
    marginTop: 30
  },
  signOutText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});
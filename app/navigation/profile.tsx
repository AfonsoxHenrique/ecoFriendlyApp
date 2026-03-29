import { router } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import { collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

export default function ProfileScreen() {
  const [docId, setDocId] = useState("");

  const [username, setUsername] = useState("User");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

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
            const docSnap = querySnapshot.docs[0];
            const data = docSnap.data();

            setDocId(docSnap.id);
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

  const handleSave = async () => {
    try {
      if (!docId) return;

      const userRef = doc(db, "users", docId);

      let updatedData: any = {};

      if (editingField === "username") {
        updatedData.name = tempValue;
        setUsername(tempValue);
      } else if (editingField === "phone") {
        updatedData.phone = tempValue;
        setPhone(tempValue);
      } else if (editingField === "address") {
        updatedData.address = tempValue;
        setAddress(tempValue);
      }

      await updateDoc(userRef, updatedData);

      setEditingField(null);
      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      Alert.alert("Error", "Could not update profile.");
    }
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const renderField = (label: string, value: string, fieldKey: string) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.fieldRow}>
        {editingField === fieldKey ? (
          <TextInput
            value={tempValue}
            onChangeText={setTempValue}
            style={styles.input}
          />
        ) : (
          <Text style={styles.fieldValue}>{value}</Text>
        )}

        {editingField === fieldKey ? (
          <TouchableOpacity onPress={handleSave}>
            <Text style={styles.saveText}>✔</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => startEditing(fieldKey, value)}>
            <Text style={styles.editIcon}>✎</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const handleSignOut = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      router.replace("/login");
    } catch {
      Alert.alert("Error", "Could not sign out.");
    }
  };

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

          {renderField("Username", username, "username")}
          {renderField("Email Address", email, "email")}
          {renderField("Phone Number", phone, "phone")}
          {renderField("Delivery Address", address, "address")}

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

  input: {
    flex: 1,
    fontSize: 16
  },

  editIcon: { fontSize: 16, color: "green" },
  saveText: { fontSize: 16, color: "blue" },

  signOutButton: {
    backgroundColor: "#6B8E5A",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 50,
    marginTop: 30
  },

  signOutText: { color: "#fff", fontWeight: "bold", fontSize: 16 }
});
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { getAuth, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
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

        if (!user?.email) return;

        setEmail(user.email);

        const q = query(
          collection(db, "users"),
          where("email", "==", user.email)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data() as any;

          setDocId(docSnap.id);
          setUsername(data.name || "User");
          setPhone(data.phone || "");
          setAddress(data.address || "");
        } else {
          Alert.alert("Error", "User document not found in database.");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      if (!docId) {
        Alert.alert("Error", "User document not found.");
        return;
      }

      if (!editingField) return;

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
      } else {
        Alert.alert("Error", "This field cannot be edited here.");
        setEditingField(null);
        return;
      }

      await updateDoc(userRef, updatedData);

      setEditingField(null);
      setTempValue("");

      Alert.alert("Success", "Profile updated!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Could not update profile.");
    }
  };

  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const renderEditableField = (
    label: string,
    value: string,
    fieldKey: string
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.fieldRow}>
        {editingField === fieldKey ? (
          <TextInput
            value={tempValue}
            onChangeText={setTempValue}
            style={styles.input}
            placeholder={label}
            placeholderTextColor="#999"
          />
        ) : (
          <Text style={styles.fieldValue}>
            {value || `No ${label.toLowerCase()} added`}
          </Text>
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

  const renderReadOnlyField = (label: string, value: string) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.fieldRow}>
        <Text style={styles.fieldValue}>{value}</Text>
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
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>

            <Text style={styles.title}>Profile</Text>

            <View style={{ width: 44 }} />
          </View>

          <View style={styles.profileIcon}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>

          {renderEditableField("Username", username, "username")}
          {renderReadOnlyField("Email Address", email)}
          {renderEditableField("Phone Number", phone, "phone")}
          {renderEditableField("Delivery Address", address, "address")}

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => router.push("/navigation/orders")}
          >
            <View style={styles.menuLeft}>
              <Ionicons name="receipt-outline" size={22} color="#555" />
              <Text style={styles.menuText}>My Orders</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  scrollContainer: {
    padding: 20,
    alignItems: "center",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e8e8e8",
    justifyContent: "center",
    alignItems: "center",
  },

  profileIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#c8d6c2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  fieldContainer: {
    width: "100%",
    marginBottom: 15,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 5,
  },

  fieldRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    minHeight: 48,
  },

  fieldValue: {
    fontSize: 16,
    flex: 1,
    color: "#333",
  },

  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  editIcon: {
    fontSize: 16,
    color: "green",
    marginLeft: 10,
  },

  saveText: {
    fontSize: 16,
    color: "blue",
    marginLeft: 10,
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    width: "100%",
    marginTop: 10,
    marginBottom: 5,
  },

  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  menuText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  signOutButton: {
    backgroundColor: "#6B8E5A",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 50,
    marginTop: 30,
  },

  signOutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
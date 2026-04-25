import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

type SavedAddress = {
  id: string;
  name: string;
  country: string;
  city: string;
  phone: string;
  address: string;
};

export default function AddressScreen() {
  const [userDocId, setUserDocId] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [activeAddressIndex, setActiveAddressIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const loadAddresses = async () => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user?.email) return;

          const userQuery = query(
            collection(db, "users"),
            where("email", "==", user.email)
          );

          const userSnap = await getDocs(userQuery);

          if (!userSnap.empty) {
            setUserDocId(userSnap.docs[0].id);
          }

          const addressQuery = query(
            collection(db, "addresses"),
            where("email", "==", user.email)
          );

          const addressSnap = await getDocs(addressQuery);

          const addresses: SavedAddress[] = addressSnap.docs.map((docSnap) => {
            const data = docSnap.data() as any;

            return {
              id: docSnap.id,
              name: data.recipientName || "User",
              country: data.country || "",
              city: data.city || "",
              phone: data.phone || "",
              address: data.address || "",
            };
          });

          setSavedAddresses(addresses);
          setActiveAddressIndex(0);
        } catch (error) {
          console.error("Error loading addresses:", error);
        }
      };

      loadAddresses();
    }, [])
  );

  const handleDeleteAddress = (addressId: string) => {
    Alert.alert("Delete address", "Do you want to delete this address?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "addresses", addressId));

            const updated = savedAddresses.filter(
              (item) => item.id !== addressId
            );

            setSavedAddresses(updated);
            setActiveAddressIndex(0);

            Alert.alert("Deleted", "Address removed successfully.");
          } catch (error) {
            console.error("Error deleting address:", error);
            Alert.alert("Error", "Could not delete address.");
          }
        },
      },
    ]);
  };

  const handleUseAddress = async () => {
    try {
      if (!userDocId || savedAddresses.length === 0) {
        Alert.alert("No address", "Please add an address first.");
        return;
      }

      const selectedAddress = savedAddresses[activeAddressIndex];

      setLoading(true);

      await updateDoc(doc(db, "users", userDocId), {
        country: selectedAddress.country,
        city: selectedAddress.city,
        phone: selectedAddress.phone,
        address: selectedAddress.address,
        selectedAddressId: selectedAddress.id,
        isPrimaryAddress: true,
      });

      Alert.alert("Selected", "Address selected successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Error selecting address:", error);
      Alert.alert("Error", "Could not select this address.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Address</Text>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {savedAddresses.length > 0 ? (
            <>
              <FlatList
                data={savedAddresses}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => setActiveAddressIndex(index)}
                    style={[
                      styles.addressCard,
                      index === activeAddressIndex &&
                      styles.activeAddressCard,
                    ]}
                  >
                    <View style={styles.iconCircle}>
                      <Ionicons
                        name="location-outline"
                        size={24}
                        color="#6B8E5A"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.addressName}>{item.name}</Text>
                      <Text style={styles.addressText}>{item.address}</Text>
                      <Text style={styles.addressSubText}>
                        {item.city}
                        {item.country ? `, ${item.country}` : ""}
                      </Text>
                      <Text style={styles.addressSubText}>{item.phone}</Text>
                    </View>

                    {index === activeAddressIndex && (
                      <View style={styles.checkCircle}>
                        <Ionicons
                          name="checkmark"
                          size={16}
                          color="#fff"
                        />
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteAddress(item.id)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#B94A48"
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />

              <Text style={styles.selectedText}>
                Selected address {activeAddressIndex + 1} of{" "}
                {savedAddresses.length}
              </Text>
            </>
          ) : (
            <View style={styles.noAddressPlaceholder}>
              <Ionicons
                name="location-outline"
                size={42}
                color="#C5C5C5"
              />
              <Text style={styles.noAddressText}>
                No saved address yet
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.addAddressBtn}
            onPress={() => router.push("/add-address")}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color="#6B8E5A"
            />
            <Text style={styles.addAddressText}>
              Add new address
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectAddressBtn,
              (savedAddresses.length === 0 || loading) && {
                opacity: 0.6,
              },
            ]}
            onPress={handleUseAddress}
            disabled={savedAddresses.length === 0 || loading}
          >
            <Text style={styles.selectAddressText}>
              {loading ? "Selecting..." : "Use This Address"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F3" },

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

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  addressCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },

  activeAddressCard: {
    borderColor: "#6B8E5A",
    borderWidth: 1.5,
  },

  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#EEF5EA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  addressName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#333",
    marginBottom: 4,
  },

  addressText: {
    fontSize: 13,
    color: "#555",
    marginBottom: 3,
  },

  addressSubText: {
    fontSize: 12,
    color: "#999",
    marginTop: 2,
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#6B8E5A",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },

  deleteBtn: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF1F1",
    justifyContent: "center",
    alignItems: "center",
  },

  selectedText: {
    textAlign: "center",
    color: "#777",
    marginTop: 14,
    marginBottom: 24,
    fontSize: 13,
  },

  noAddressPlaceholder: {
    backgroundColor: "#fff",
    borderRadius: 20,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderStyle: "dashed",
  },

  noAddressText: {
    color: "#C5C5C5",
    marginTop: 8,
    fontSize: 13,
  },

  addAddressBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#8EA17A",
    borderRadius: 14,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: "#fff",
    gap: 8,
  },

  addAddressText: {
    color: "#6B8E5A",
    fontSize: 14,
    fontWeight: "700",
  },

  selectAddressBtn: {
    backgroundColor: "#6B8E5A",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  selectAddressText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
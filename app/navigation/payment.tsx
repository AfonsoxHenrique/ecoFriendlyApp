import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 64;

type SavedCard = {
  id: string;
  owner: string;
  number: string;
  exp: string;
  cvv: string;
  last4?: string;
};

export default function PaymentScreen() {
  const [docId, setDocId] = useState("");
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const flatRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      const loadCards = async () => {
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
            setDocId(userSnap.docs[0].id);
          }

          const cardsQuery = query(
            collection(db, "payment_methods"),
            where("email", "==", user.email)
          );

          const cardsSnap = await getDocs(cardsQuery);

          const cards: SavedCard[] = cardsSnap.docs.map((cardDoc) => {
            const data = cardDoc.data();

            return {
              id: cardDoc.id,
              owner: data.owner || "Eco Lover",
              number: data.number || "",
              exp: data.exp || "",
              cvv: data.cvv || "",
              last4: data.last4 || data.number?.replace(/\s/g, "").slice(-4),
            };
          });

          setSavedCards(cards);
          setActiveCardIndex(0);
        } catch (error) {
          console.error("Error loading cards:", error);
        }
      };

      loadCards();
    }, [])
  );

  const getCardGradient = (index: number): [string, string, string] => {
    const palettes: [string, string, string][] = [
      ["#F4A347", "#E05B2B", "#C03535"],
      ["#6B8E5A", "#4A7A5C", "#2D5F45"],
      ["#5A7DB8", "#3A5A9A", "#1E3A7A"],
    ];

    return palettes[index % palettes.length];
  };

  const maskedNumber = (num: string) => {
    const digits = num.replace(/\s/g, "");

    if (digits.length < 16) return num;

    return `${digits.slice(0, 4)} **** **** ${digits.slice(12)}`;
  };

  const handleSelectCard = async () => {
    try {
      if (!docId) {
        Alert.alert("Error", "User not found.");
        return;
      }

      if (savedCards.length === 0) {
        Alert.alert("No card", "Please add a card first.");
        return;
      }

      const selectedCard = savedCards[activeCardIndex];

      setLoading(true);

      await updateDoc(doc(db, "users", docId), {
        paymentMethodName: "Visa Classic",
        paymentLast4:
          selectedCard.last4 ||
          selectedCard.number.replace(/\s/g, "").slice(-4),
        selectedPaymentCardId: selectedCard.id,
      });

      Alert.alert("Selected", "Payment card selected successfully!", [
        { text: "OK", onPress: () => router.push("/navigation/cart") },
      ]);
    } catch (error) {
      console.error("Error selecting card:", error);
      Alert.alert("Error", "Could not select this card.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = () => {
    if (savedCards.length === 0) return;

    const selectedCard = savedCards[activeCardIndex];

    Alert.alert("Delete card", "Do you want to delete this card?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "payment_methods", selectedCard.id));

            const updatedCards = savedCards.filter(
              (card) => card.id !== selectedCard.id
            );

            setSavedCards(updatedCards);
            setActiveCardIndex(0);

            Alert.alert("Deleted", "Card removed successfully.");
          } catch (error) {
            console.error("Error deleting card:", error);
            Alert.alert("Error", "Could not delete card.");
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/navigation/cart")}>
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Payment</Text>

          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          {savedCards.length > 0 ? (
            <>
              <View style={styles.carouselWrapper}>
                <FlatList
                  ref={flatRef}
                  data={savedCards}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  snapToInterval={CARD_WIDTH + 16}
                  decelerationRate="fast"
                  contentContainerStyle={{ paddingHorizontal: 4 }}
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(
                      e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16)
                    );
                    setActiveCardIndex(idx);
                  }}
                  renderItem={({ item, index }) => {
                    const grad = getCardGradient(index);

                    return (
                      <LinearGradient
                        colors={grad}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.creditCard}
                      >
                        <View style={styles.cardTopRow}>
                          <Text style={styles.cardOwnerName}>{item.owner}</Text>
                          <Text style={styles.visaLabel}>VISA</Text>
                        </View>

                        <View style={styles.chip} />

                        <Text style={styles.cardNumber}>
                          {maskedNumber(item.number)}
                        </Text>

                        <View style={styles.cardBottomRow}>
                          <Text style={styles.expText}>
                            EXP {item.exp || "--/--"}
                          </Text>
                        </View>
                      </LinearGradient>
                    );
                  }}
                />

                {savedCards.length > 1 && (
                  <View style={styles.dotsRow}>
                    {savedCards.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          styles.dot,
                          i === activeCardIndex && styles.dotActive,
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.selectedText}>
                Selected card: **** {savedCards[activeCardIndex]?.last4}
              </Text>
            </>
          ) : (
            <View style={styles.noCardPlaceholder}>
              <Ionicons name="card-outline" size={42} color="#C5C5C5" />
              <Text style={styles.noCardText}>No saved cards yet</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.addNewCardBtn}
            onPress={() => router.push("/navigation/add-new-card")}
          >
            <Ionicons name="add-circle-outline" size={18} color="#6B8E5A" />
            <Text style={styles.addNewCardText}>Add new card</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.selectCardBtn,
              (savedCards.length === 0 || loading) && { opacity: 0.6 },
            ]}
            onPress={handleSelectCard}
            disabled={savedCards.length === 0 || loading}
          >
            <Text style={styles.selectCardText}>
              {loading ? "Selecting..." : "Use This Card"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteCardBtn,
              savedCards.length === 0 && { opacity: 0.6 },
            ]}
            onPress={handleDeleteCard}
            disabled={savedCards.length === 0}
          >
            <Ionicons name="trash-outline" size={18} color="#B94A48" />
            <Text style={styles.deleteCardText}>Delete This Card</Text>
          </TouchableOpacity>
        </View>
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

  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },

  carouselWrapper: {
    marginBottom: 16,
    marginHorizontal: -4,
  },

  creditCard: {
    width: CARD_WIDTH,
    height: 180,
    borderRadius: 20,
    padding: 22,
    marginRight: 16,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  cardOwnerName: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  visaLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
  },

  chip: {
    width: 30,
    height: 22,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.28)",
  },

  cardNumber: {
    color: "#fff",
    fontSize: 14,
    letterSpacing: 2,
    fontWeight: "600",
  },

  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },

  expText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },

  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 12,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D0D0D0",
    marginHorizontal: 3,
  },

  dotActive: {
    backgroundColor: "#6B8E5A",
    width: 16,
  },

  selectedText: {
    textAlign: "center",
    color: "#777",
    marginBottom: 24,
    fontSize: 13,
  },

  noCardPlaceholder: {
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

  noCardText: {
    color: "#C5C5C5",
    marginTop: 8,
    fontSize: 13,
  },

  addNewCardBtn: {
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

  addNewCardText: {
    color: "#6B8E5A",
    fontSize: 14,
    fontWeight: "700",
  },

  selectCardBtn: {
    backgroundColor: "#6B8E5A",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },

  selectCardText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  deleteCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#D9A3A3",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: "#fff",
    gap: 8,
  },

  deleteCardText: {
    color: "#B94A48",
    fontSize: 14,
    fontWeight: "700",
  },
});
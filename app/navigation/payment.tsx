import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
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

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 64;

type SavedCard = {
  id: string;
  owner: string;
  number: string;
  exp: string;
  cvv: string;
  balance?: string;
};

export default function PaymentScreen() {
  const [docId, setDocId] = useState("");
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // checkout card form
  const [cardOwner, setCardOwner] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [saveInfo, setSaveInfo] = useState(true);
  const [saving, setSaving] = useState(false);

  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user?.email) return;

        const q = query(
          collection(db, "users"),
          where("email", "==", user.email)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          const data = d.data();
          setDocId(d.id);

          // pre-fill checkout form with saved primary card
          setCardOwner(data.paymentOwner || data.name || "");
          setCardNumber(data.paymentCardNumber || "");
          setExp(data.paymentExp || "");
          setCvv(data.paymentCvv || "");

          // build saved-cards array from stored data
          if (data.paymentCardNumber) {
            setSavedCards([
              {
                id: "primary",
                owner: data.paymentOwner || data.name || "Eco Lover",
                number: data.paymentCardNumber || "5254 7634 8734 7690",
                exp: data.paymentExp || "24/24",
                cvv: data.paymentCvv || "***",
                balance: data.paymentBalance || "$3,783.87",
              },
            ]);
          }
        }
      } catch (e) {
        console.error("Error loading payment data:", e);
      }
    };
    load();
  }, []);

  const formatCardNumber = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const handleSave = async () => {
    if (!cardOwner.trim() || cardNumber.replace(/\s/g, "").length < 16) {
      Alert.alert("Required", "Please fill in your card owner and full card number.");
      return;
    }
    try {
      setSaving(true);
      if (docId) {
        await updateDoc(doc(db, "users", docId), {
          paymentOwner: cardOwner,
          paymentCardNumber: cardNumber,
          paymentExp: exp,
          paymentCvv: cvv,
          paymentMethodName: "Visa Classic",
          paymentLast4: cardNumber.replace(/\s/g, "").slice(-4),
        });
      }
      Alert.alert("Saved", "Card saved successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "Could not save card.");
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Card Carousel ── */}
          {savedCards.length > 0 ? (
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
                      <View style={styles.cardChipRow}>
                        <View style={styles.chip} />
                      </View>
                      <Text style={styles.cardNumber}>
                        {maskedNumber(item.number)}
                      </Text>
                      <View style={styles.cardBottomRow}>
                        <Text style={styles.cardBalance}>{item.balance}</Text>
                      </View>
                    </LinearGradient>
                  );
                }}
              />
              {/* Dot indicators */}
              {savedCards.length > 1 && (
                <View style={styles.dotsRow}>
                  {savedCards.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, i === activeCardIndex && styles.dotActive]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.noCardPlaceholder}>
              <Ionicons name="card-outline" size={40} color="#C5C5C5" />
              <Text style={styles.noCardText}>No saved cards yet</Text>
            </View>
          )}

          {/* ── Add New Card Button ── */}
          <TouchableOpacity
            style={styles.addNewCardBtn}
            onPress={() => router.push("/navigation/add-new-card")}
          >
            <Ionicons name="add-circle-outline" size={18} color="#6B8E5A" />
            <Text style={styles.addNewCardText}>Add new card</Text>
          </TouchableOpacity>

          {/* ── Divider ── */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Card for this checkout</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ── Card Form ── */}
          <Text style={styles.label}>Card Owner</Text>
          <TextInput
            style={styles.input}
            value={cardOwner}
            onChangeText={setCardOwner}
            placeholder="Miss Sarah"
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
                onChangeText={setExp}
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

          {/* Save toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Save card info</Text>
            <Switch
              value={saveInfo}
              onValueChange={setSaveInfo}
              trackColor={{ false: "#E0E0E0", true: "#6DB56C" }}
              thumbColor={"#fff"}
            />
          </View>

          {/* Save Card Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.7 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>
              {saving ? "Saving..." : "Save Card"}
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
    paddingTop: 20,
    paddingBottom: 48,
  },

  // ── Carousel ──
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
    opacity: 0.92,
  },
  visaLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 2,
    opacity: 0.85,
  },
  cardChipRow: {
    flexDirection: "row",
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
    opacity: 0.9,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cardBalance: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
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
  noCardPlaceholder: {
    backgroundColor: "#fff",
    borderRadius: 20,
    height: 150,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "#E8E8E8",
    borderStyle: "dashed",
  },
  noCardText: {
    color: "#C5C5C5",
    marginTop: 8,
    fontSize: 13,
  },

  // ── Add new card btn ──
  addNewCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#8EA17A",
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 24,
    backgroundColor: "#fff",
    gap: 8,
  },
  addNewCardText: {
    color: "#6B8E5A",
    fontSize: 14,
    fontWeight: "700",
  },

  // ── Divider ──
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E8E8E8",
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    color: "#AEAEAE",
    fontWeight: "600",
  },

  // ── Form ──
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
    marginTop: 20,
    marginBottom: 28,
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

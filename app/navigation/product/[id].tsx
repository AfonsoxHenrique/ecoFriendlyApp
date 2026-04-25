import { Ionicons } from "@expo/vector-icons";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebase";
import { useFavorites } from "../../context/FavoritesContext";

type Product = {
  name?: string;
  price?: number | string;
  image?: string;
  description?: string;
  category?: string;
  brand?: string;
};

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(2);
  const { favorites, toggleFavorite } = useFavorites();

  const isFavorite = favorites.includes(id as string);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        if (!id) return;

        const docRef = doc(db, "products", id as string);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setProduct(docSnap.data() as Product);
        }
      } catch (error) {
        console.log("Error loading product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const unitPrice = useMemo(() => {
    if (!product?.price) return 0;
    return typeof product.price === "string"
      ? Number(product.price.replace("$", ""))
      : product.price;
  }, [product]);

  const totalPrice = useMemo(() => unitPrice * quantity, [unitPrice, quantity]);

  // 1 dollar = 1 green point
  const greenPoints = Math.floor(totalPrice);

  const handleAddToCart = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user?.email || !product) return;

      const cartQuery = query(
        collection(db, "cart"),
        where("email", "==", user.email),
        where("productId", "==", id as string)
      );

      const cartSnapshot = await getDocs(cartQuery);

      if (!cartSnapshot.empty) {
        const existingDoc = cartSnapshot.docs[0];
        const currentQty = Number(existingDoc.data().quantity || 0);

        await updateDoc(doc(db, "cart", existingDoc.id), {
          quantity: currentQty + quantity,
        });
      } else {
        await addDoc(collection(db, "cart"), {
          email: user.email,
          productId: id as string,
          name: product.name || "Product",
          price: unitPrice,
          image: product.image || "",
          quantity,
          addedAt: serverTimestamp(),
        });
      }

      alert("Added to cart!");
    } catch (error) {
      console.log("Error adding to cart:", error);
      alert("Could not add item to cart.");
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaProvider>
          <SafeAreaView style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#5E7452" />
          </SafeAreaView>
        </SafeAreaProvider>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaProvider>
          <SafeAreaView style={styles.centerContainer}>
            <Text>Product not found</Text>
          </SafeAreaView>
        </SafeAreaProvider>
      </>
    );
  }

  const imageSource = product.image || "https://via.placeholder.com/300";

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.topSection}>
              <View style={styles.topButtonsRow}>
                <TouchableOpacity style={styles.circleButton} onPress={() => router.push("/navigation/home")}>
                  <Ionicons name="arrow-back" size={20} color="#4A4A4A" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={() => toggleFavorite(id as string)}
                >
                  <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteActive]}>
                    {isFavorite ? "♥" : "♡"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Image source={{ uri: imageSource }} style={styles.mainImage} />
            </View>

            <View style={styles.content}>
              <View style={styles.miniRow}>
                <Text style={styles.smallInfo}>{product.category || "Eco Product"}</Text>
                <Text style={styles.smallInfo}>Price</Text>
              </View>

              <View style={styles.namePriceRow}>
                <Text style={styles.name}>{product.name || "Product"}</Text>
                <Text style={styles.price}>${unitPrice.toFixed(2)}</Text>
              </View>

              <View style={styles.thumbnailRow}>
                {[1, 2, 3, 4].map((item) => (
                  <View key={item} style={styles.thumbCard}>
                    <Image source={{ uri: imageSource }} style={styles.thumbImage} />
                  </View>
                ))}
              </View>

              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {product.description || "No description available."}
              </Text>

              <Text style={styles.sectionTitle}>Brand</Text>
              <Text style={styles.brandText}>{product.brand || "EcoPlus"}</Text>

              <View style={styles.confirmedRow}>
                <Text style={styles.checkBox}>✓</Text>
                <View>
                  <Text style={styles.confirmedTitle}>3R Confirmed</Text>
                  <Text style={styles.confirmedSub}>Reuse, Recycle and Reduce</Text>
                </View>
              </View>

              <View style={styles.pointsCard}>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>{greenPoints}</Text>
                </View>

                <View>
                  <Text style={styles.pointsTitle}>Green points</Text>
                  <Text style={styles.pointsSubtitle}>1 $ = 1 Green points</Text>
                </View>
              </View>

              <View style={styles.quantityHeaderRow}>
                <Text style={styles.sectionTitle}>Quantity</Text>

                <View style={styles.quantityBox}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  >
                    <Text style={styles.qtyButtonText}>−</Text>
                  </TouchableOpacity>

                  <View style={styles.qtyNumberBox}>
                    <Text style={styles.qtyNumber}>{quantity}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => setQuantity((prev) => prev + 1)}
                  >
                    <Text style={styles.qtyButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.totalSection}>
                <Text style={styles.totalLabel}>Total Price</Text>
                <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
              </View>

              <TouchableOpacity style={styles.addButton} onPress={handleAddToCart}>
                <Text style={styles.addButtonText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F0" },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F5F5F0",
    justifyContent: "center",
    alignItems: "center",
  },
  topSection: {
    backgroundColor: "#B8C4AE",
    paddingBottom: 0,
  },
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    marginBottom: 4,
  },
  circleButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F7F7F4",
    justifyContent: "center",
    alignItems: "center",
  },
  circleButtonText: { fontSize: 18, color: "#4A4A4A" },
  favoriteIcon: { fontSize: 18, color: "#FF4D6D" },
  favoriteActive: { fontWeight: "bold" },
  mainImage: {
    width: "100%",
    height: 270,
    resizeMode: "cover",
    backgroundColor: "#EEE",
  },
  content: {
    backgroundColor: "#F5F5F0",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 28,
  },
  miniRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  smallInfo: {
    fontSize: 10,
    color: "#9C9C9C",
    marginBottom: 2,
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#6E8172",
    marginRight: 12,
  },
  price: {
    fontSize: 13,
    fontWeight: "800",
    color: "#6E8172",
  },
  thumbnailRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  thumbCard: {
    width: 58,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#E8E2D8",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#333",
    marginTop: 4,
    marginBottom: 3,
  },
  description: {
    fontSize: 11,
    color: "#7E7E7E",
    lineHeight: 14,
    marginBottom: 6,
  },
  brandText: {
    fontSize: 11,
    color: "#7E7E7E",
    marginBottom: 8,
  },
  confirmedRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  checkBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: "#333",
    color: "#fff",
    textAlign: "center",
    marginRight: 8,
    fontSize: 12,
  },
  confirmedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },
  confirmedSub: {
    fontSize: 11,
    color: "#9A9A9A",
  },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  pointsBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7A9568",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    paddingHorizontal: 8,
  },
  pointsBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  pointsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4C4C4C",
  },
  pointsSubtitle: {
    fontSize: 10,
    color: "#7FA05F",
    marginTop: 2,
  },
  quantityHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 10,
  },
  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#555",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: {
    fontSize: 15,
    color: "#444",
    marginTop: -1,
  },
  qtyNumberBox: {
    width: 42,
    height: 24,
    borderWidth: 1,
    borderColor: "#555",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 6,
    backgroundColor: "#FFF",
  },
  qtyNumber: {
    fontSize: 12,
    fontWeight: "700",
  },
  totalSection: {
    backgroundColor: "#C7D2BB",
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#333",
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: "900",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#425238",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginHorizontal: 72,
    marginTop: 14,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "800",
  },
});
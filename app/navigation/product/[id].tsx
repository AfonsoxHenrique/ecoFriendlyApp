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
  const [isFavorite, setIsFavorite] = useState(false);

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

  const handleAddToCart = async () => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user?.email) {
      alert("You need to be logged in to add items to cart.");
      return;
    }

    if (!product) return;

    const cartQuery = query(
      collection(db, "cart"),
      where("email", "==", user.email),
      where("productId", "==", id as string)
    );

    const cartSnapshot = await getDocs(cartQuery);

    if (!cartSnapshot.empty) {
      const existingDoc = cartSnapshot.docs[0];
      const existingData = existingDoc.data();
      const currentQty = Number(existingData.quantity || 0);

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
        quantity: quantity,
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
                <TouchableOpacity style={styles.circleButton} onPress={() => router.back()}>
                  <Text style={styles.circleButtonText}>←</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.circleButton}
                  onPress={() => setIsFavorite(!isFavorite)}
                >
                  <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteActive]}>
                    ♡
                  </Text>
                </TouchableOpacity>
              </View>

              <Image source={{ uri: imageSource }} style={styles.mainImage} />
            </View>

            <View style={styles.content}>
              <Text style={styles.smallInfo}>
                {product.category || "Eco Product"}
              </Text>

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

              <View style={styles.pointsCard}>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>13</Text>
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
                <View>
                  <Text style={styles.totalLabel}>Total Price</Text>
                </View>

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
  container: {
    flex: 1,
    backgroundColor: "#F5F5F0",
  },
  centerContainer: {
    flex: 1,
    backgroundColor: "#F5F5F0",
    justifyContent: "center",
    alignItems: "center",
  },
  topSection: {
    backgroundColor: "#B8C4AE",
    paddingBottom: 18,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 10,
    marginBottom: 8,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F7F7F4",
    justifyContent: "center",
    alignItems: "center",
  },
  circleButtonText: {
    fontSize: 20,
    color: "#4A4A4A",
  },
  favoriteIcon: {
    fontSize: 20,
    color: "#D65C5C",
  },
  favoriteActive: {
    fontWeight: "bold",
  },
  mainImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
    backgroundColor: "#EEE",
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  smallInfo: {
    fontSize: 13,
    color: "#A5A5A5",
    marginBottom: 6,
  },
  namePriceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  name: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: "#6E8172",
    marginRight: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    color: "#6E8172",
  },
  thumbnailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  thumbCard: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: "#E8E2D8",
    overflow: "hidden",
  },
  thumbImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: "#8E8E8E",
    lineHeight: 20,
    marginBottom: 14,
  },
  brandText: {
    fontSize: 14,
    color: "#6E6E6E",
    marginBottom: 16,
  },
  pointsCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  pointsBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#7A9568",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  pointsBadgeText: {
    color: "#fff",
    fontWeight: "700",
  },
  pointsTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4C4C4C",
  },
  pointsSubtitle: {
    fontSize: 12,
    color: "#7FA05F",
    marginTop: 2,
  },
  quantityHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 16,
  },
  quantityBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyButtonText: {
    fontSize: 18,
    color: "#444",
    marginTop: -1,
  },
  qtyNumberBox: {
    width: 44,
    height: 30,
    borderWidth: 1,
    borderColor: "#666",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
    borderRadius: 4,
    backgroundColor: "#FFF",
  },
  qtyNumber: {
    fontSize: 15,
    fontWeight: "600",
  },
  totalSection: {
    backgroundColor: "#C7D2BB",
    marginHorizontal: -16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
  },
  totalSub: {
    fontSize: 11,
    color: "#666",
    marginTop: 2,
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: "800",
    color: "#333",
  },
  addButton: {
    backgroundColor: "#425238",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 64,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
  },
});
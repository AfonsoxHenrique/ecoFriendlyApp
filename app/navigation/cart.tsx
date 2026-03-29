import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator, Alert, Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

type CartItem = {
  id: string;
  productId?: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

export default function CartScreen() {
  const [loading, setLoading] = useState(true);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("No address added");
  const [postcode, setPostcode] = useState("");
  const [paymentLabel, setPaymentLabel] = useState("Visa Classic");
  const [paymentLast4, setPaymentLast4] = useState("1234");

  useFocusEffect(
  useCallback(() => {
    const fetchCartAndUser = async () => {
      try {
        setLoading(true);

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user?.email) {
          setCartItems([]);
          setLoading(false);
          return;
        }

        // fetch user by email instead of uid
        const userQuery = query(
          collection(db, "users"),
          where("email", "==", user.email)
        );
        const userSnap = await getDocs(userQuery);

        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          setAddress(userData.address || "No address added");
          setPostcode(userData.postcode || "");
          setPaymentLabel(userData.paymentMethodName || "Visa Classic");
          setPaymentLast4(userData.paymentLast4 || "1234");
        } else {
          setAddress("No address added");
          setPostcode("");
        }

        const cartQuery = query(
          collection(db, "cart"),
          where("email", "==", user.email)
        );

        const cartSnap = await getDocs(cartQuery);

        const items = await Promise.all(
          cartSnap.docs.map(async (cartDoc) => {
            const data = cartDoc.data();

            if (data.productId) {
              const productRef = doc(db, "products", data.productId);
              const productSnap = await getDoc(productRef);

              if (productSnap.exists()) {
                const productData = productSnap.data();
                return {
                  id: cartDoc.id,
                  productId: data.productId,
                  name: productData.name || "Product",
                  price: Number(productData.price || 0),
                  image: productData.image || "https://via.placeholder.com/150",
                  quantity: Number(data.quantity || 1),
                } as CartItem;
              }
            }

            return {
              id: cartDoc.id,
              productId: data.productId,
              name: data.name || "Product",
              price: Number(data.price || 0),
              image: data.image || "https://via.placeholder.com/150",
              quantity: Number(data.quantity || 1),
            } as CartItem;
          })
        );

        setCartItems(items.filter(Boolean));
      } catch (error) {
        console.error("Error loading cart:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCartAndUser();
  }, [])
);

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;

    try {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, quantity: newQty } : item
        )
      );

      const cartRef = doc(db, "cart", itemId);
      await updateDoc(cartRef, { quantity: newQty });
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  };

  const handleDeleteItem = (itemId: string) => {
  Alert.alert(
    "Remove item",
    "Do you want to remove this item from the cart?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            setCartItems((prev) => prev.filter((item) => item.id !== itemId));
            await deleteDoc(doc(db, "cart", itemId));
          } catch (error) {
            console.error("Error deleting item:", error);
          }
        },
      },
    ]
  );
};
  const subtotal = useMemo(
    () =>
      cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cartItems]
  );

  const shipping = cartItems.length > 0 ? 10 : 0;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator size="large" color="#8EA17A" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.headerTitle}>Cart</Text>

          <View style={styles.itemsWrapper}>
            {cartItems.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Your cart is empty</Text>
              </View>
            ) : (
              cartItems.map((item) => (
                <View key={item.id} style={styles.cartCard}>
                  <Image source={{ uri: item.image }} style={styles.productImage} />

                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.productPrice}>
                      ${item.price.toFixed(2)} (including Tax)
                    </Text>

                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Ionicons name="remove" size={14} color="#777" />
                      </TouchableOpacity>

                      <Text style={styles.qtyText}>{item.quantity}</Text>

                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Ionicons name="add" size={14} color="#777" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.trashBtn}
                    onPress={() => handleDeleteItem(item.id)} >
                    <Ionicons name="trash-outline" size={18} color="#B5B5B5" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.infoLeft}>
              <View style={styles.iconBadge}>
                <Ionicons name="location-outline" size={16} color="#FF8C52" />
              </View>
              <View>
                <Text style={styles.infoTitle}>Delivery Address</Text>
                <Text style={styles.infoMainText}>{address}</Text>
                {!!postcode && <Text style={styles.infoSubText}>Postcode {postcode}</Text>}
              </View>
            </View>

            <View style={styles.infoRight}>
              <Ionicons name="chevron-forward" size={18} color="#777" />
              <View style={styles.greenCheck}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.infoCard}>
            <View style={styles.infoLeft}>
              <View style={styles.cardLogo}>
                <Text style={styles.cardLogoText}>VISA</Text>
              </View>
              <View>
                <Text style={styles.infoTitle}>Payment Method</Text>
                <Text style={styles.infoMainText}>{paymentLabel}</Text>
                <Text style={styles.infoSubText}>**** {paymentLast4}</Text>
              </View>
            </View>

            <View style={styles.infoRight}>
              <Ionicons name="chevron-forward" size={18} color="#777" />
              <View style={styles.greenCheck}>
                <Ionicons name="checkmark" size={12} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.orderInfoBox}>
            <Text style={styles.orderTitle}>Order Info</Text>

            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Subtotal</Text>
              <Text style={styles.orderValue}>${subtotal.toFixed(2)}</Text>
            </View>

            <View style={styles.orderRow}>
              <Text style={styles.orderLabel}>Shipping cost</Text>
              <Text style={styles.orderValue}>${shipping.toFixed(2)}</Text>
            </View>

            <View style={styles.orderRow}>
              <Text style={styles.orderTotalLabel}>Total</Text>
              <Text style={styles.orderTotalValue}>${total.toFixed(2)}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.checkoutButton}>
            <Text style={styles.checkoutText}>Check Out</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  centered: {
    flex: 1,
    backgroundColor: "#F6F6F3",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#444",
    marginBottom: 18,
    marginTop: 6,
  },
  itemsWrapper: {
    marginBottom: 14,
  },
  emptyBox: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    color: "#777",
    fontSize: 14,
  },
  cartCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
  },
  productImage: {
    width: 62,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#eee",
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 11,
    color: "#A1A1A1",
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  qtyBtn: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#D1D1D1",
    justifyContent: "center",
    alignItems: "center",
  },
  qtyText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: "#777",
    minWidth: 10,
    textAlign: "center",
  },
  trashBtn: {
    paddingLeft: 10,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFF2E9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardLogo: {
    width: 34,
    height: 24,
    borderRadius: 6,
    backgroundColor: "#EAF1FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cardLogoText: {
    color: "#2563EB",
    fontSize: 10,
    fontWeight: "800",
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#444",
    marginBottom: 3,
  },
  infoMainText: {
    fontSize: 13,
    color: "#606060",
  },
  infoSubText: {
    fontSize: 11,
    color: "#A0A0A0",
    marginTop: 2,
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  greenCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#69B96A",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  orderInfoBox: {
    marginTop: 4,
    marginBottom: 18,
  },
  orderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#444",
    marginBottom: 10,
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  orderLabel: {
    fontSize: 13,
    color: "#999",
  },
  orderValue: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  orderTotalLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "700",
  },
  orderTotalValue: {
    fontSize: 16,
    color: "#444",
    fontWeight: "800",
  },
  checkoutButton: {
    backgroundColor: "#92A97E",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
    marginHorizontal: 40,
  },
  checkoutText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
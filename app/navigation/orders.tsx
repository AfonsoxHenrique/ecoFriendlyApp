import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  createdAt: any;
  total: number;
  status: string;
  items: OrderItem[];
  address: string;
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Delivered: { bg: "#E8F5E9", text: "#2E7D32" },
  Processing: { bg: "#FFF8E1", text: "#F57F17" },
  Shipped: { bg: "#E3F2FD", text: "#1565C0" },
  Cancelled: { bg: "#FFEBEE", text: "#C62828" },
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const fetchOrders = async () => {
        try {
          setLoading(true);
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user?.email) {
            setOrders([]);
            setLoading(false);
            return;
          }

          const q = query(
            collection(db, "orders"),
            where("email", "==", user.email)
          );
          const snap = await getDocs(q);
          const data: Order[] = snap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<Order, "id">),
            }))
            .sort((a, b) => {
              const aTime = a.createdAt?.toDate?.()?.getTime() ?? 0;
              const bTime = b.createdAt?.toDate?.()?.getTime() ?? 0;
              return bTime - aTime;
            });
          setOrders(data);
        } catch (err) {
          console.error("Error fetching orders:", err);
          setOrders([]);
        } finally {
          setLoading(false);
        }
      };
      fetchOrders();
    }, [])
  );

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color="#444" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Orders</Text>
          <View style={{ width: 36 }} />
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3D6B3B" />
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={72} color="#C8D8C0" />
            <Text style={styles.emptyTitle}>No orders yet</Text>
            <Text style={styles.emptySubtitle}>
              When you place an order, it will appear here.
            </Text>
            <TouchableOpacity
              style={styles.shopBtn}
              onPress={() => router.push("/navigation/home")}
            >
              <Text style={styles.shopBtnText}>Start Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {orders.map((order) => {
              const statusStyle =
                STATUS_COLORS[order.status] ?? STATUS_COLORS["Processing"];
              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Card top row */}
                  <View style={styles.cardTopRow}>
                    <View>
                      <Text style={styles.orderId}>
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </Text>
                      <Text style={styles.orderDate}>
                        {formatDate(order.createdAt)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusStyle.bg },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: statusStyle.text }]}
                      >
                        {order.status ?? "Processing"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {/* Items */}
                  {(order.items ?? []).slice(0, 3).map((item, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <View style={styles.itemDot} />
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemQty}>x{item.quantity}</Text>
                      <Text style={styles.itemPrice}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                  {(order.items ?? []).length > 3 && (
                    <Text style={styles.moreItems}>
                      +{order.items.length - 3} more items
                    </Text>
                  )}

                  <View style={styles.divider} />

                  {/* Total & address */}
                  <View style={styles.cardBottomRow}>
                    <View style={styles.addressRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color="#999"
                      />
                      <Text style={styles.addressText} numberOfLines={1}>
                        {order.address || "—"}
                      </Text>
                    </View>
                    <Text style={styles.totalText}>
                      Total:{" "}
                      <Text style={styles.totalAmount}>
                        ${order.total?.toFixed(2)}
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFEFEF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#444",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  shopBtn: {
    marginTop: 28,
    backgroundColor: "#3D5C30",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 36,
  },
  shopBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  orderCard: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  orderDate: {
    fontSize: 12,
    color: "#aaa",
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0EE",
    marginVertical: 10,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  itemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#B0C8A0",
    marginRight: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    color: "#555",
  },
  itemQty: {
    fontSize: 12,
    color: "#aaa",
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  moreItems: {
    fontSize: 12,
    color: "#aaa",
    marginLeft: 14,
    marginTop: 2,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  addressText: {
    fontSize: 12,
    color: "#aaa",
    marginLeft: 4,
    flex: 1,
  },
  totalText: {
    fontSize: 13,
    color: "#777",
  },
  totalAmount: {
    fontWeight: "800",
    color: "#3D5C30",
    fontSize: 14,
  },
});

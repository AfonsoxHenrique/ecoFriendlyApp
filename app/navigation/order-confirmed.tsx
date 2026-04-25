import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

export default function OrderConfirmedScreen() {
  // Animated values for the ripple arcs
  const arc1 = useRef(new Animated.Value(0)).current;
  const arc2 = useRef(new Animated.Value(0)).current;
  const arc3 = useRef(new Animated.Value(0)).current;
  const cartScale = useRef(new Animated.Value(0.6)).current;
  const cartOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Cart pop-in
    Animated.parallel([
      Animated.spring(cartScale, {
        toValue: 1,
        friction: 5,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(cartOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Ripple arcs staggered
    const ripple = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    ripple(arc1, 0).start();
    ripple(arc2, 400).start();
    ripple(arc3, 800).start();

    // Fade in text/buttons
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 600,
      delay: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const arcStyle = (val: Animated.Value, size: number) => ({
    position: "absolute" as const,
    width: size,
    height: size / 2,
    borderTopLeftRadius: size / 2,
    borderTopRightRadius: size / 2,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: "#3D6B3B",
    bottom: 0,
    opacity: val.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.8, 0] }),
    transform: [
      {
        scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
      },
    ],
  });

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push("/navigation/cart")}
          >
            <Ionicons name="arrow-back" size={20} color="#444" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check out</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Illustration area */}
        <View style={styles.illustrationArea}>
          {/* Ripple arcs */}
          <View style={styles.arcContainer}>
            <Animated.View style={arcStyle(arc3, 300)} />
            <Animated.View style={arcStyle(arc2, 220)} />
            <Animated.View style={arcStyle(arc1, 140)} />

            {/* Cart icon */}
            <Animated.View
              style={[
                styles.cartIconWrapper,
                { opacity: cartOpacity, transform: [{ scale: cartScale }] },
              ]}
            >
              <Ionicons name="cart-outline" size={72} color="#1A1A1A" />
            </Animated.View>
          </View>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
          <Text style={styles.confirmTitle}>Order Confirmed!</Text>
          <Text style={styles.confirmSubtitle}>
            Your order has been confirmed, we will send{"\n"}you confirmation
            email shortly.
          </Text>

          {/* Go to Orders button */}
          <TouchableOpacity
            style={styles.ordersBtn}
            onPress={() => router.push("/navigation/orders")}
          >
            <Text style={styles.ordersBtnText}>Go to Orders</Text>
          </TouchableOpacity>

          {/* Continue Shopping button */}
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.push("/navigation/home")}
          >
            <Text style={styles.shopBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
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
    paddingBottom: 4,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#444",
  },
  illustrationArea: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 32,
  },
  arcContainer: {
    width: 300,
    height: 200,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  cartIconWrapper: {
    position: "absolute",
    bottom: 12,
    alignSelf: "center",
  },
  content: {
    paddingHorizontal: 32,
    paddingBottom: 40,
    alignItems: "center",
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#3D6B3B",
    marginBottom: 10,
    textAlign: "center",
  },
  confirmSubtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  ordersBtn: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#EBEBEB",
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 12,
  },
  ordersBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
  },
  shopBtn: {
    width: "100%",
    borderRadius: 14,
    backgroundColor: "#3D5C30",
    paddingVertical: 15,
    alignItems: "center",
  },
  shopBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});

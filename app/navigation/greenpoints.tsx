import { router } from "expo-router";
import React from "react";
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const impactData = [
  {
    id: "1",
    title: "3 Millions tree\nplanting campaign",
    image: require("../../assets/images/tree_planting_1776560041763.png"),
  },
  {
    id: "2",
    title: "Clean Water for\nRural Communities",
    image: require("../../assets/images/clean_water_1776560118368.png"),
  },
  {
    id: "3",
    title: "Ocean Plastic Clean up",
    image: require("../../assets/images/ocean_cleanup_1776560268864.png"),
  },
];

export default function GreenPointsScreen() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Green Points</Text>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.pointsCard}>
            <View style={styles.pointsCircle}>
              <Text style={styles.pointsNumber}>50</Text>
            </View>
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsTitle}>My Points</Text>
              <Text style={styles.pointsSubtitle}>
                Congratulations! you 've got enough points to get <Text style={styles.boldText}>10% discounts</Text> or collect more <Text style={styles.boldText}>250 points</Text> to plant a tree in forest!
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Turn Points Into Impact</Text>
            
            {impactData.map((item) => (
              <TouchableOpacity key={item.id} activeOpacity={0.9} style={styles.impactCard}>
                <ImageBackground
                  source={item.image}
                  style={styles.impactBg}
                  imageStyle={{ borderRadius: 20 }}
                >
                  <View style={styles.impactOverlay}>
                    <Text style={styles.impactTitle}>{item.title}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>

        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F6",
  },
  header: {
    backgroundColor: "#B8C4AE",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    flex: 1,
    textAlign: "center",
  },
  pointsCard: {
    backgroundColor: "#425238",
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginTop: -25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  pointsCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
  },
  pointsNumber: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#425238",
  },
  pointsInfo: {
    flex: 1,
    marginLeft: 15,
  },
  pointsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
  },
  pointsSubtitle: {
    fontSize: 12,
    color: "#D3D7CF",
    lineHeight: 16,
  },
  boldText: {
    fontWeight: "bold",
    color: "#FFF",
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111",
    marginBottom: 20,
  },
  impactCard: {
    width: "100%",
    height: 140,
    borderRadius: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  impactBg: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  impactOverlay: {
    backgroundColor: "rgba(0,0,0,0.3)",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingTop: 40,
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  impactTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

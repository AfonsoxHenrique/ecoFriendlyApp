import React from "react";
import { FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const products = [
  { id: "1", name: "Item 1", price: "$50", image: "https://via.placeholder.com/150" },
  { id: "2", name: "Item 2", price: "$70", image: "https://via.placeholder.com/150" },
  { id: "3", name: "Item 3", price: "$90", image: "https://via.placeholder.com/150" },
  { id: "4", name: "Item 4", price: "$120", image: "https://via.placeholder.com/150" },
];

export default function HomeScreen() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
      {/* HOME SCREEN (based on your sketch) */}

      {/* Search Bar */}
      <View style={styles.header}>
        <TextInput placeholder="Search..." style={styles.search} />
        <View style={styles.profileIcon} />
      </View>

      {/* Filter / Categories */}
      <View style={styles.filterRow}>
        {["All", "Clothes", "Tech", "Other"].map((item, index) => (
          <TouchableOpacity key={index} style={styles.filterBtn}>
            <Text>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Product Grid */}
      <View style={{ flex: 1 }}>
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }} // prevents overlap
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text>{item.name}</Text>
              <Text>{item.price}</Text>
            </View>
          )}
        />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.navbar}>
        <Text>🏠</Text>
        <Text>🛒</Text>
        <Text>❤️</Text>
        <Text>🍃</Text>
        <Text>⚙️</Text>
      </View>
    </SafeAreaView>
    </SafeAreaProvider>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
  },
  search: {
    flex: 1,
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 10,
  },
  profileIcon: {
    width: 35,
    height: 35,
    backgroundColor: "#ccc",
    borderRadius: 20,
    marginLeft: 10,
  },
  filterRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  filterBtn: {
    padding: 8,
    backgroundColor: "#ddd",
    borderRadius: 20,
  },
  card: {
    flex: 1,
    margin: 10,
    height: 120,
    backgroundColor: "#fff",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: 80,
    height: 80,
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 15,
    backgroundColor: "#e0e0e0",
  },
});
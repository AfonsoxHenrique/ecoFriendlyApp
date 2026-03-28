import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";

type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
};

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        
        const productsArray: Product[] = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Product",
            price: data.price !== undefined ? `$${data.price}` : "$0",
            image: data.image || "https://via.placeholder.icon/150",
          };
        });

        setProducts(productsArray);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <ActivityIndicator size="large" color="black" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
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
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 80 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.price}>{item.price}</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: { flexDirection: "row", padding: 10, alignItems: "center" },
  search: { flex: 1, backgroundColor: "#eee", padding: 10, borderRadius: 10 },
  profileIcon: { width: 35, height: 35, backgroundColor: "#ccc", borderRadius: 20, marginLeft: 10 },
  filterRow: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10 },
  filterBtn: { padding: 8, backgroundColor: "#ddd", borderRadius: 20 },
  card: { flex: 1, margin: 10, height: 180, backgroundColor: "#fff", borderRadius: 10, justifyContent: "center", alignItems: "center" },
  image: { width: 80, height: 80, marginBottom: 5 },
  name: { fontWeight: "bold" },
  price: { color: "green" },
  navbar: { flexDirection: "row", justifyContent: "space-around", paddingVertical: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#ddd",},
  navItem: { alignItems: "center", },
  navText: { fontSize: 12, color: "gray", },
  activeText: { color: "black", fontWeight: "bold", },
});
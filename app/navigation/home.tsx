import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebase";



type Product = {
  id: string;
  name: string;
  price: string;
  image: string;
  category: string;
};

export default function HomeScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [userName, setUserName] = useState("User");
  const categories = ["All", "Home Goods", "Healthcare", "Clothes"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => { 
    const fetchUserName = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserName(docSnap.data().Name || "User");
          }
        }
      } catch (error) {
        console.error("Error fetching user name:", error);
        setUserName("User");
      }
    };

    fetchUserName();
  }, []);

  // Fetch products from Firebase
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
            image: data.image || "https://via.placeholder.com/150",
            category: data.category || "Other"
          };
        });

        setProducts(productsArray);
        setFilteredProducts(productsArray);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Search products
  const handleSearch = (text: string) => {
    setSearchText(text);
    if (!text) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredProducts(filtered);
  };


  const filterByCategory = (category: string) => {
  setSelectedCategory(category);

  if (category === "All") {
    setFilteredProducts(products);
    return;
  }

  const filtered = products.filter((p) =>
    p.category.replace(/\s+/g, "").toLowerCase() === category.replace(/\s+/g, "").toLowerCase()
  );

  setFilteredProducts(filtered);
  };

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
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName}</Text>
            <Text style={styles.subGreeting}>Welcome to EcoPlus!</Text>
          </View>
          <TouchableOpacity
            style={styles.profileIcon}
            onPress={() => router.push("/navigation/profile")}
          />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            placeholder="Search for products..."
            style={styles.searchInput}
            value={searchText}
            onChangeText={handleSearch}
          />
        </View>

        {/* Categories */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryButton, {  backgroundColor: selectedCategory === cat ? "#6B8E5A" : "#ddd", },]}
              onPress={() => filterByCategory(cat)}>
              <Text
                style={[ styles.categoryText, { color: selectedCategory === cat ? "#fff" : "#000" },]}>
                {cat}
              </Text>
            </TouchableOpacity>
        ))}
      </ScrollView>
        </View>

        {/* Products Grid */}
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.productPrice}>{item.price}</Text>
            </View>
          )}
          numColumns={2}
          columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 10 }}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingTop: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 15
  },
  greeting: { fontSize: 22, fontWeight: "bold" },
  subGreeting: { fontSize: 14, color: "#555" },
  profileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#ccc" },
  searchContainer: { paddingHorizontal: 15, marginBottom: 15 },
  searchInput: {
    backgroundColor: "#eee",
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 40,
    fontSize: 16
  },
  categoryContainer: { paddingHorizontal: 15, marginBottom: 15 },
  categoryButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "#ddd",
    borderRadius: 20,
    marginRight: 10
  },
  categoryText: { fontSize: 14 },
  productCard: {
    flex: 1,
    margin: 5,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center"
  },
  productImage: { width: 80, height: 80, marginBottom: 5 },
  productName: { fontWeight: "bold", fontSize: 14, textAlign: "center" },
  productPrice: { color: "green", marginTop: 3 }
});
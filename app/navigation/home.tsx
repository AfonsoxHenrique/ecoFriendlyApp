import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
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
import { useFavorites } from "../context/FavoritesContext";

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
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", "Home Goods", "Healthcare", "Clothes", "Test"];
  const { favorites, toggleFavorite } = useFavorites();

  const fetchUserName = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user?.email) return;

      const q = query(
        collection(db, "users"),
        where("email", "==", user.email)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data() as any;
        setUserName(data.name || "User");
      }
    } catch (error) {
      console.error("Error fetching user name:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUserName();
    }, [])
  );

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
            category: data.category || "Other",
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

  const applyFilters = (text: string, category: string) => {
    let result = products;

    if (category !== "All") {
      result = result.filter(
        (p) =>
          p.category.replace(/\s+/g, "").toLowerCase() ===
          category.replace(/\s+/g, "").toLowerCase()
      );
    }

    if (text) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(text.toLowerCase())
      );
    }

    setFilteredProducts(result);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    applyFilters(text, selectedCategory);
  };

  const filterByCategory = (category: string) => {
    setSelectedCategory(category);
    applyFilters(searchText, category);
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B8E5A" />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.topGreen} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>Hello, {userName}</Text>
              <Text style={styles.subGreeting}>Welcome to EcoPlus!</Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push("/navigation/profile")}
            >
              <Ionicons name="person-outline" size={22} color="#222" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#9CA3AF" />
              <TextInput
                placeholder="Search..."
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                value={searchText}
                onChangeText={handleSearch}
              />
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Choose Category</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>

          <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => filterByCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.newArrivalTitle}>New Arrival</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            columnWrapperStyle={styles.productRow}
            contentContainerStyle={styles.productList}
            renderItem={({ item }) => {
              const isFav = favorites.includes(item.id);

              return (
                <TouchableOpacity
                  style={styles.productCard}
                  activeOpacity={0.85}
                  onPress={() =>
                    router.push({
                      pathname: "/navigation/product/[id]",
                      params: { id: item.id },
                    })
                  }
                >
                  <View style={styles.imageWrapper}>
                    <Image source={{ uri: item.image }} style={styles.productImage} />

                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => toggleFavorite(item.id)}
                    >
                      <Ionicons
                        name={isFav ? "heart" : "heart-outline"}
                        size={19}
                        color={isFav ? "#FF4D6D" : "#9CA3AF"}
                      />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.productName} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <Text style={styles.productPrice}>{item.price}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  topGreen: {
    height: 90,
    backgroundColor: "#B7C7AE",
  },

  content: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -28,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 14,
    paddingTop: 12,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  greeting: {
    fontSize: 26,
    fontWeight: "800",
    color: "#222",
  },

  subGreeting: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 2,
  },

  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F6FA",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -28,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  searchBox: {
    flex: 1,
    height: 52,
    backgroundColor: "#F6F7FB",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#222",
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#222",
  },

  newArrivalTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
  },

  viewAll: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  categoryContainer: {
    marginBottom: 18,
  },

  categoryButton: {
    backgroundColor: "#F6F7FB",
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 10,
    marginRight: 10,
  },

  categoryButtonActive: {
    backgroundColor: "#6B8E5A",
  },

  categoryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#222",
  },

  categoryTextActive: {
    color: "#FFFFFF",
  },

  productList: {
    paddingBottom: 90,
  },

  productRow: {
    justifyContent: "space-between",
  },

  productCard: {
    width: "48%",
    marginBottom: 18,
    backgroundColor: "#FFFFFF",
  },

  imageWrapper: {
    width: "100%",
    height: 185,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F6F7FB",
    position: "relative",
  },

  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  heartButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  productName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#222",
    marginTop: 8,
    minHeight: 32,
  },

  productPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: "#222",
    marginTop: 3,
  },
});
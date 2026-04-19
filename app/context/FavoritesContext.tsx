import { getAuth } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../../firebase";

type FavoriteContextType = {
  favorites: string[];
  toggleFavorite: (productId: string) => Promise<void>;
  loading: boolean;
};

const FavoritesContext = createContext<FavoriteContextType>({
  favorites: [],
  toggleFavorite: async () => {},
  loading: true,
});

export const useFavorites = () => useContext(FavoritesContext);

export const FavoritesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user?.email) return;

        const favQuery = query(
          collection(db, "favorites"),
          where("email", "==", user.email)
        );
        const snapshot = await getDocs(favQuery);
        const favIds = snapshot.docs.map((doc) => doc.data().productId as string);
        setFavorites(favIds);
      } catch (error) {
        console.error("Error fetching favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const toggleFavorite = async (productId: string) => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user?.email) {
      alert("You need to be logged in to manage favorites.");
      return;
    }

    const isFav = favorites.includes(productId);

    // Optimistic UI update
    setFavorites((prev) =>
      isFav ? prev.filter((id) => id !== productId) : [...prev, productId]
    );

    try {
      if (isFav) {
        // Remove from favorites
        const favQuery = query(
          collection(db, "favorites"),
          where("email", "==", user.email),
          where("productId", "==", productId)
        );
        const snapshot = await getDocs(favQuery);
        snapshot.forEach(async (docSnap) => {
          await deleteDoc(docSnap.ref);
        });
      } else {
        // Add to favorites
        await addDoc(collection(db, "favorites"), {
          email: user.email,
          productId,
        });
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Revert on failure
      setFavorites((prev) =>
        isFav ? [...prev, productId] : prev.filter((id) => id !== productId)
      );
    }
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
};

import { createSlice } from "@reduxjs/toolkit";

const loadWishlistFromStorage = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user ? user.id : null;
    if (!userId) return [];

    const savedWishlist = localStorage.getItem(`wishlist_${userId}`);
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  } catch (error) {
    console.error("Error loading wishlist:", error);
    return [];
  }
};

const saveWishlistToStorage = (items) => {
  try {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user ? user.id : null;
    if (!userId) return;

    localStorage.setItem(`wishlist_${userId}`, JSON.stringify(items));
  } catch (error) {
    console.error("Error saving wishlist:", error);
  }
};

const initialState = {
  items: loadWishlistFromStorage(),
};

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const existing = state.items.find((item) => item._key === action.payload._key);
      if (!existing) {
        state.items.push(action.payload);
        saveWishlistToStorage(state.items);
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item._key !== action.payload);
      saveWishlistToStorage(state.items);
    },
    clearWishlist: (state) => {
      state.items = [];
      saveWishlistToStorage(state.items);
    },
    setWishlist: (state, action) => {
      state.items = action.payload;
      saveWishlistToStorage(state.items);
    },
  },
});

export const { addToWishlist, removeFromWishlist, clearWishlist, setWishlist } =
  wishlistSlice.actions;

export default wishlistSlice.reducer;

import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api";
import { loginSuccess, logout, sessionChecking } from "./authSlice";

const itemProductId = (item) => {
  const product = item?.productId;
  return String(product && typeof product === "object" ? product._id || product.id || "" : product || "");
};

export const cartContainsProduct = (items, productId) =>
  (items || []).some((item) => itemProductId(item) === String(productId || ""));

const getOwnedCart = async (userId) => {
  const { data } = await api.get(`/cart/${userId}`);
  return { userId: String(userId), items: data.cart?.items || [] };
};

export const fetchCartForUser = createAsyncThunk("cart/fetchForUser", getOwnedCart, {
  condition: (userId, { getState }) => {
    const cart = getState().cart;
    return Boolean(userId) && !(cart.userId === String(userId) && ["loading", "succeeded"].includes(cart.status));
  },
});

export const addCartProduct = createAsyncThunk("cart/addProduct", async ({ productId, quantity = 1 }, { getState }) => {
  const userId = getState().auth.userId;
  const { data } = await api.post("/cart/add", { userId, productId, quantity });
  return { userId: String(userId), items: data.cart?.items || [] };
}, {
  condition: ({ productId }, { getState }) => {
    const { auth, cart } = getState();
    return auth.status === "authenticated" && cart.status === "succeeded" && cart.userId === String(auth.userId) && !cart.mutationRequestId && !cartContainsProduct(cart.items, productId);
  },
});

export const removeCartProduct = createAsyncThunk("cart/removeProduct", async ({ productId }, { getState }) => {
  const userId = getState().auth.userId;
  const { data } = await api.post("/cart/remove", { userId, productId });
  return { userId: String(userId), items: data.cart?.items || [] };
}, {
  condition: ({ productId }, { getState }) => {
    const { auth, cart } = getState();
    return auth.status === "authenticated" && cart.userId === String(auth.userId) && !cart.mutationRequestId && cartContainsProduct(cart.items, productId);
  },
});

export const updateCartProductQuantity = createAsyncThunk("cart/updateQuantity", async ({ productId, quantity }, { getState }) => {
  const userId = getState().auth.userId;
  const { data } = await api.put("/cart/quantity", { userId, productId, quantity });
  return { userId: String(userId), items: data.cart?.items || [] };
}, {
  condition: ({ productId, quantity }, { getState }) => {
    const { auth, cart } = getState();
    return auth.status === "authenticated" && cart.userId === String(auth.userId) && !cart.mutationRequestId && Number.isInteger(quantity) && quantity > 0 && cartContainsProduct(cart.items, productId);
  },
});

const initialState = {
  items: [],
  userId: null,
  status: "idle",
  error: null,
  fetchRequestId: null,
  mutationRequestId: null,
  mutationProductId: null,
};

const clearCartState = (state) => {
  state.items = [];
  state.userId = null;
  state.status = "idle";
  state.error = null;
  state.fetchRequestId = null;
  state.mutationRequestId = null;
  state.mutationProductId = null;
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setCart: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
      state.status = "succeeded";
      state.error = null;
    },
    addToCart: (state, action) => {
      const productId = itemProductId(action.payload);
      const existing = state.items.find((item) => itemProductId(item) === productId);
      if (existing) existing.quantity += action.payload.quantity;
      else state.items.push(action.payload);
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => itemProductId(item) !== String(action.payload));
    },
    incrementQuantity: (state, action) => {
      const item = state.items.find((entry) => itemProductId(entry) === String(action.payload));
      if (item) item.quantity += 1;
    },
    decrementQuantity: (state, action) => {
      const productId = String(action.payload);
      const item = state.items.find((entry) => itemProductId(entry) === productId);
      if (!item) return;
      if (item.quantity > 1) item.quantity -= 1;
      else state.items = state.items.filter((entry) => itemProductId(entry) !== productId);
    },
    clearCart: clearCartState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginSuccess, clearCartState)
      .addCase(logout, clearCartState)
      .addCase(sessionChecking, clearCartState)
      .addCase(fetchCartForUser.pending, (state, action) => {
        const userId = String(action.meta.arg);
        if (state.userId !== userId) state.items = [];
        state.userId = userId;
        state.status = "loading";
        state.error = null;
        state.fetchRequestId = action.meta.requestId;
      })
      .addCase(fetchCartForUser.fulfilled, (state, action) => {
        if (state.fetchRequestId !== action.meta.requestId || state.userId !== action.payload.userId) return;
        state.items = action.payload.items;
        state.status = "succeeded";
        state.fetchRequestId = null;
      })
      .addCase(fetchCartForUser.rejected, (state, action) => {
        if (state.fetchRequestId !== action.meta.requestId) return;
        state.status = "failed";
        state.error = action.error.message;
        state.fetchRequestId = null;
      })
      .addCase(addCartProduct.pending, (state, action) => {
        state.mutationRequestId = action.meta.requestId;
        state.mutationProductId = String(action.meta.arg.productId);
      })
      .addCase(removeCartProduct.pending, (state, action) => {
        state.mutationRequestId = action.meta.requestId;
        state.mutationProductId = String(action.meta.arg.productId);
      })
      .addCase(updateCartProductQuantity.pending, (state, action) => {
        state.mutationRequestId = action.meta.requestId;
        state.mutationProductId = String(action.meta.arg.productId);
      })
      .addMatcher((action) => [addCartProduct.fulfilled.type, removeCartProduct.fulfilled.type, updateCartProductQuantity.fulfilled.type].includes(action.type), (state, action) => {
        if (state.mutationRequestId !== action.meta.requestId || state.userId !== action.payload.userId) return;
        state.items = action.payload.items;
        state.status = "succeeded";
        state.mutationRequestId = null;
        state.mutationProductId = null;
        state.error = null;
      })
      .addMatcher((action) => [addCartProduct.rejected.type, removeCartProduct.rejected.type, updateCartProductQuantity.rejected.type].includes(action.type), (state, action) => {
        if (state.mutationRequestId !== action.meta.requestId) return;
        state.mutationRequestId = null;
        state.mutationProductId = null;
        if (!action.meta.condition) state.error = action.error.message;
      });
  },
});

export const {
  setCart,
  addToCart,
  removeFromCart,
  incrementQuantity,
  decrementQuantity,
  clearCart,
} = cartSlice.actions;

export default cartSlice.reducer;

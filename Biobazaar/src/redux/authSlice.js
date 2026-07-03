import { createSlice } from "@reduxjs/toolkit";

// Initial State
const initialState = {
  token: localStorage.getItem("token") || null,
  userId: localStorage.getItem("userId") || null,
  email: localStorage.getItem("userEmail") || null,
  isAuthenticated: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {
    // Login / Auto Login after Signup
    loginSuccess: (state, action) => {
      const { token, userId } = action.payload;

      state.token = token;
      state.userId = userId;
      state.email = action.payload.email || state.email;
      state.isAuthenticated = true;

      // Persist Authentication
      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      if (action.payload.email) localStorage.setItem("userEmail", action.payload.email);
    },

    // Logout
    logout: (state) => {
      state.token = null;
      state.userId = null;
      state.email = null;
      state.isAuthenticated = false;

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
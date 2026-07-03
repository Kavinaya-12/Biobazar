import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";

import Header from "./Components/Header";
import CheckAuth from "./Components/CheckAuth";
import { logout } from "./redux/authSlice";
import { Toaster, toast } from "react-hot-toast";

import Home from "./Components/Home";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import CartPage from "./Components/Cart";
import Profile from "./Components/Profile";
import Sell from "./Components/Sell";
import Wishlist from "./Components/Wishlist";
import Collec from "./Components/Collec";
import AboutUs from "./Components/AboutUs";
import Foods from "./Components/Foods";
import PersonalCare from "./Components/PersonalCare";
import LifeStyle from "./Components/Lifestyle";
import Household from "./Components/Household";
import SearchResults from "./Components/SearchResults";
import { fetchProducts } from "./redux/productSlice";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) return;

    const decodeToken = (jwt) => {
      try {
        const base64Url = jwt.split(".")[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
            .join("")
        );

        return JSON.parse(jsonPayload);
      } catch (error) {
        return null;
      }
    };

    const payload = decodeToken(token);
    if (!payload || typeof payload.exp !== "number") {
      dispatch(logout());
      return;
    }

    const expiresAt = payload.exp * 1000;
    const now = Date.now();
    const remainingTime = expiresAt - now;

    if (remainingTime <= 0) {
      dispatch(logout());
      return;
    }

    const logoutTimer = setTimeout(() => {
      dispatch(logout());
      toast.error("Your session has expired. Please login again.");
      window.location.href = "/login";
    }, remainingTime);

    return () => clearTimeout(logoutTimer);
  }, [dispatch]);

  return (
    <Router>
      <Header />
      <Toaster position="top-right" />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route
          path="/login"
          element={
            <CheckAuth>
              <Login />
            </CheckAuth>
          }
        />

        <Route
          path="/signup"
          element={
            <CheckAuth>
              <Signup />
            </CheckAuth>
          }
        />

        <Route
          path="/cart"
          element={
            <CheckAuth>
              <CartPage />
            </CheckAuth>
          }
        />

        <Route
          path="/profile"
          element={
            <CheckAuth>
              <Profile />
            </CheckAuth>
          }
        />

        <Route
          path="/profile/:userId"
          element={
            <CheckAuth>
              <Profile />
            </CheckAuth>
          }
        />

        <Route
          path="/sell"
          element={
            <CheckAuth>
              <Sell />
            </CheckAuth>
          }
        />

        <Route
          path="/wishlist"
          element={
            <CheckAuth>
              <Wishlist />
            </CheckAuth>
          }
        />

        <Route
          path="/collections"
          element={
            <CheckAuth>
              <Collec />
            </CheckAuth>
          }
        />

        <Route
          path="/aboutus"
          element={
            <CheckAuth>
              <AboutUs />
            </CheckAuth>
          }
        />

        <Route
          path="/collections/foods"
          element={
            <CheckAuth>
              <Foods />
            </CheckAuth>
          }
        />

        <Route
          path="/collections/personalcare"
          element={
            <CheckAuth>
              <PersonalCare />
            </CheckAuth>
          }
        />

        <Route
          path="/collections/lifestyle"
          element={
            <CheckAuth>
              <LifeStyle />
            </CheckAuth>
          }
        />

        <Route
          path="/collections/household"
          element={
            <CheckAuth>
              <Household />
            </CheckAuth>
          }
        />

        <Route
          path="/search-results"
          element={
            <CheckAuth>
              <SearchResults />
            </CheckAuth>
          }
        />

      </Routes>

    </Router>
  );
}

export default App;
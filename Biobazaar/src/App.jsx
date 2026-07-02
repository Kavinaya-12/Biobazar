import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import Header from "./Components/Header";
import CheckAuth from "./Components/CheckAuth";

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

function App() {

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) return;

    const logoutTimer = setTimeout(() => {

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userEmail");

      alert("Your session has expired. Please login again.");

      window.location.href = "/login";

    }, 60 * 60 * 1000);

    return () => clearTimeout(logoutTimer);

  }, []);

  return (
    <Router>
      <Header />

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
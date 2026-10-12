import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import Header from "./Components/Header";
import CheckAuth from "./Components/CheckAuth";
import { logout, restoreSession } from "./redux/authSlice";
import { clearCart, fetchCartForUser } from "./redux/cartSlice";
import { clearWishlist } from "./redux/wishlistSlice";
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
import OnboardingTourManager from "./Components/OnboardingTourManager";
import ImpactDashboard from "./Components/ImpactDashboard";
import AdminConsole from "./Components/AdminConsole";
import SellerApplication from "./Components/SellerApplication";
import SellerHub from "./Components/SellerHub";
import SellerProducts, { SellerProductForm } from "./Components/SellerProducts";
import SellerCommerceStatus from "./Components/SellerCommerceStatus";
import SellerApplicationsAdmin from "./Components/SellerApplicationsAdmin";
import SellerSettings from "./Components/SellerSettings";
import AdminRoute from "./Components/AdminRoute";
import { fetchProducts } from "./redux/productSlice";

function App() {
  const dispatch = useDispatch();
  const authStatus = useSelector((state) => state.auth.status);
  const token = useSelector((state) => state.auth.token);
  const userId = useSelector((state) => state.auth.userId);

  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  useEffect(() => {
    if (authStatus === "checking") dispatch(restoreSession());
    if (authStatus === "authenticated" && userId) dispatch(fetchCartForUser(userId));
  }, [authStatus, userId, dispatch]);

  useEffect(() => {
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
      dispatch(clearCart());
      dispatch(clearWishlist());
      toast.error("Your session has expired. Please login again.");
      window.location.href = "/login";
    }, remainingTime);

    return () => clearTimeout(logoutTimer);
  }, [dispatch, token]);

  return (
    <Router>
      <Header />
      <OnboardingTourManager />
      <Toaster position="top-right" />

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/impact" element={<CheckAuth><ImpactDashboard /></CheckAuth>} />

        <Route path="/admin" element={<CheckAuth><AdminRoute><AdminConsole /></AdminRoute></CheckAuth>} />
        <Route path="/admin/sellers" element={<CheckAuth><AdminRoute><SellerApplicationsAdmin /></AdminRoute></CheckAuth>} />
        <Route path="/seller/apply" element={<CheckAuth><SellerApplication /></CheckAuth>} />
        <Route path="/seller/application-status" element={<CheckAuth><SellerApplication /></CheckAuth>} />
        <Route path="/seller/dashboard" element={<CheckAuth><SellerHub /></CheckAuth>} />
        <Route path="/seller/settings" element={<CheckAuth><SellerSettings /></CheckAuth>} />
        <Route path="/seller/products" element={<CheckAuth><SellerProducts /></CheckAuth>} />
        <Route path="/seller/products/new" element={<CheckAuth><SellerProductForm /></CheckAuth>} />
        <Route path="/seller/products/:id/edit" element={<CheckAuth><SellerProductForm /></CheckAuth>} />
        <Route path="/seller/orders" element={<CheckAuth><SellerCommerceStatus section="orders" /></CheckAuth>} />
        <Route path="/seller/orders/:id" element={<CheckAuth><SellerCommerceStatus section="orders" /></CheckAuth>} />
        <Route path="/seller/earnings" element={<CheckAuth><SellerCommerceStatus section="earnings" /></CheckAuth>} />
        <Route path="/seller/payouts" element={<CheckAuth><SellerCommerceStatus section="payouts" /></CheckAuth>} />

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

        <Route path="/collections" element={<Collec />} />

        <Route path="/aboutus" element={<AboutUs />} />

        <Route path="/collections/foods" element={<Foods />} />

        <Route path="/collections/personalcare" element={<PersonalCare />} />

        <Route path="/collections/lifestyle" element={<LifeStyle />} />

        <Route path="/collections/household" element={<Household />} />

        <Route path="/search-results" element={<SearchResults />} />

      </Routes>

    </Router>
  );
}

export default App;

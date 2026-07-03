import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/authSlice";
import { clearCart } from "../redux/cartSlice";
import { clearWishlist } from "../redux/wishlistSlice";
import "./header.css";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const isAuthenticated = useSelector(
    (state) => state.auth.isAuthenticated
  );

  const userId = useSelector(
    (state) => state.auth.userId
  );

  const cart = useSelector(
    (state) => state.cart.items
  );

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const handleLogout = () => {

    dispatch(logout());

    dispatch(clearCart());

    dispatch(clearWishlist());

    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");

    setDropdownOpen(false);

    navigate("/");
  };

  return (
    <div className="header-container">

      <div className="header-title">
        BIO <span>BAZAAR</span>
      </div>

      <div className="header-links">

        <Link to="/">
          <span>Home</span>
        </Link>

        {isAuthenticated ? (
          <>

            <Link to="/aboutus">
              <span>About Us</span>
            </Link>

            <Link to="/collections">
              <span>Collections</span>
            </Link>

            <div className="dropdown">

              <span
                className="dropdown-toggle"
                onClick={toggleDropdown}
              >
                Me 
              </span>

              <div
                className={`dropdown-menu ${
                  dropdownOpen ? "show" : ""
                }`}
              >

                <Link
                  to={`/profile/${userId}`}
                  onClick={closeDropdown}
                >
                  <span>User Profile</span>
                </Link>

                <Link
                  to="/sell"
                  onClick={closeDropdown}
                >
                  <span>Sell Product</span>
                </Link>

                <Link
                  to="/cart"
                  onClick={closeDropdown}
                >
                  <span>Cart ({cart.length})</span>
                </Link>

                <Link
                  to="/wishlist"
                  onClick={closeDropdown}
                >
                  <span>Wishlist</span>
                </Link>

                <span
                  onClick={handleLogout}
                  style={{ cursor: "pointer" }}
                >
                  Logout
                </span>

              </div>

            </div>

          </>
        ) : (
          <>
            <Link to="/login">
              <span>Login</span>
            </Link>

            <Link to="/signup">
              <span>Signup</span>
            </Link>
          </>
        )}

      </div>

    </div>
  );
};

export default Header;
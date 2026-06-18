import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../redux/authSlice';
import './header.css';

const Header = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const cart = useSelector((state) => state.cart.items);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const userId = useSelector((state) => state.auth.userId);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleLogout = () => {
    dispatch(logout());
    setDropdownOpen(false);
    navigate("/");  };

  const closeDropdown = () => setDropdownOpen(false);

  return (
    <div className="header-container">
      <div className="header-title">BIO <span>BAZAAR</span></div>
      <div className="header-links">
        <Link to="/"><span>Home</span></Link>
        {isAuthenticated ? (
          <>
            <Link to='/aboutus'><span>About US</span></Link>
            <div className="dropdown">
              <span className="dropdown-toggle" onClick={toggleDropdown}>
                Me
              </span>
              <div className={`dropdown-menu ${dropdownOpen ? "show" : ""}`}>
                <Link to={`/profile/${userId}`} onClick={closeDropdown}><span>User Profile</span></Link>
                <Link to="/sell" onClick={closeDropdown}><span>Sell</span></Link>
                <Link to="/cart" onClick={closeDropdown}><span>Cart ({cart.length})</span></Link>
                <Link to="/wishlist" onClick={closeDropdown}><span>Wishlist</span></Link>
                <span onClick={handleLogout}>Logout</span>
              </div>
            </div>
            <Link to='/collections'><span>Collections</span></Link>
          </>
        ) : (
          <>
            <Link to="/login"><span>Login</span></Link>
            <Link to="/signup"><span>Signup</span></Link>
          </>
        )}
      </div>
    </div>
  );
};

export default Header;

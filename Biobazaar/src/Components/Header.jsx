import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowUpRight, FiHeart, FiMenu, FiShoppingBag, FiUser, FiX } from "react-icons/fi";
import { logout } from "../redux/authSlice";
import { clearCart } from "../redux/cartSlice";
import { clearWishlist } from "../redux/wishlistSlice";
import { api } from "../api";
import { PRODUCT_CATEGORIES } from "../productCategories";
import { restoreSession } from "../redux/authSlice";
import "./header.css";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sellerStatus, setSellerStatus] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const authStatus = useSelector((state) => state.auth.status);
  const isAuthenticated = authStatus === "authenticated";
  const userId = useSelector((state) => state.auth.userId);
  const cart = useSelector((state) => state.cart.items || []);

  useEffect(() => {
    let active = true;
    if (!isAuthenticated) {
      setSellerStatus(null);
      setIsAdmin(false);
      return () => { active = false; };
    }
    setSellerStatus("checking");
    setIsAdmin(false);
    Promise.allSettled([api.get("/seller/me"), api.get("/admin/session")]).then(([sellerResult, adminResult]) => {
      if (!active) return;
      setSellerStatus(sellerResult.status === "fulfilled" ? sellerResult.value.data.profile?.status || "none" : "unavailable");
      setIsAdmin(adminResult.status === "fulfilled" && adminResult.value.data.isAdmin === true);
    });
    return () => { active = false; };
  }, [isAuthenticated, userId]);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    dispatch(logout()); dispatch(clearCart()); dispatch(clearWishlist());
    localStorage.removeItem("token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail");
    closeMenu(); navigate("/");
  };

  return <>
    <div className="announcement-bar"><span>Small choices. A lighter footprint.</span><span className="announcement-right">Conscious living, made simpler <FiArrowUpRight /></span></div>
    <header className="site-header">
      <Link to="/" className="brand-lockup" aria-label="BioBazaar home" data-tour="site-brand" onClick={closeMenu}>
        <span className="brand-mark">b<span>.</span></span><span className="brand-name">bio<span>bazaar</span><small>THE CONSCIOUS MARKETPLACE</small></span>
      </Link>
      <button className="mobile-menu-toggle" data-tour="mobile-menu" aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <FiX /> : <FiMenu />}</button>
      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`}>
        <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
        <NavLink to="/collections" end onClick={closeMenu}>Shop all</NavLink>
        {PRODUCT_CATEGORIES.map((category) => <NavLink key={category.value} to={`/collections/${category.slug}`} onClick={closeMenu}>{category.label}</NavLink>)}
        <NavLink to="/aboutus" onClick={closeMenu}>About Us</NavLink>
        {isAuthenticated && <NavLink to="/impact" onClick={closeMenu}>My impact</NavLink>}
        {isAuthenticated && ["none", "draft", "pending", "action_required", "approved", "rejected"].includes(sellerStatus) && <NavLink to={sellerStatus === "approved" ? "/seller/dashboard" : ["pending", "action_required", "rejected"].includes(sellerStatus) ? "/seller/application-status" : "/seller/apply"} onClick={closeMenu}>{sellerStatus === "approved" ? "Seller Hub" : sellerStatus === "pending" ? "Application status" : sellerStatus === "action_required" ? "Respond to seller request" : sellerStatus === "rejected" ? "Update rejected application" : "Apply to Sell"}</NavLink>}
        {isAdmin && <><NavLink to="/admin" onClick={closeMenu}>Admin console</NavLink><NavLink to="/admin/sellers" onClick={closeMenu}>Seller review</NavLink></>}
        {isAuthenticated ? <>
          <NavLink to={`/profile/${userId}`} onClick={closeMenu} className="mobile-only-link" data-tour="profile-link-mobile">My profile</NavLink>
          <NavLink to="/wishlist" onClick={closeMenu} className="mobile-only-link" data-tour="wishlist-link-mobile">Wishlist</NavLink>
          <NavLink to="/cart" onClick={closeMenu} className="mobile-only-link" data-tour="cart-link-mobile">Cart</NavLink>
          <button className="mobile-only-link nav-logout" onClick={handleLogout}>Log out</button>
        </> : authStatus === "anonymous" ? <><NavLink to="/login" onClick={closeMenu} className="mobile-only-link">Log in</NavLink><NavLink to="/signup" onClick={closeMenu} className="mobile-only-link">Create account</NavLink></> : <span className="mobile-only-link session-nav-state">{authStatus === "unavailable" ? "Session verification unavailable" : "Verifying session..."}</span>}
      </nav>
      <div className="header-actions">
        {isAuthenticated ? <>
          <Link to={`/profile/${userId}`} className="icon-link" aria-label="Profile" data-tour="profile-link"><FiUser /></Link>
          <Link to="/wishlist" className="icon-link" aria-label="Wishlist" data-tour="wishlist-link"><FiHeart /></Link>
          <Link to="/cart" className="bag-link" aria-label={`Cart with ${cart.length} items`} data-tour="cart-link"><FiShoppingBag /><span>Bag <b>{cart.length}</b></span></Link>
          <button className="header-signin" onClick={handleLogout}>Log out</button>
        </> : authStatus === "anonymous" ? <><Link to="/login" className="header-signin">Log in</Link><Link to="/signup" className="bag-link"><span>Create account</span><FiArrowUpRight /></Link></> : <span className="session-nav-state">{authStatus === "unavailable" ? <button type="button" onClick={() => dispatch(restoreSession())}>Retry session</button> : "Verifying session..."}</span>}
      </div>
    </header>
  </>;
};
export default Header;

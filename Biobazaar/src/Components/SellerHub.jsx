import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiAlertCircle, FiArrowUpRight, FiPackage, FiShoppingBag } from "react-icons/fi";
import { api } from "../api";
import "./seller-hub.css";

// eslint-disable-next-line react/prop-types
export function SellerNavigation({ active = "dashboard" }) {
  const links = [["dashboard", "Overview", "/seller/dashboard"], ["products", "Products", "/seller/products"], ["orders", "Orders", "/seller/orders"], ["earnings", "Earnings", "/seller/earnings"], ["payouts", "Payouts", "/seller/payouts"], ["settings", "Settings", "/seller/settings"]];
  return <nav className="seller-hub-nav" aria-label="Seller Hub">{links.map(([id, label, to]) => <Link key={id} to={to} className={active === id ? "active" : ""}>{label}</Link>)}</nav>;
}

export default function SellerHub() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/seller/me").then(({ data }) => {
      if (!active) return;
      if (data.profile?.status !== "approved") {
        navigate(data.profile ? "/seller/application-status" : "/seller/apply", { replace: true });
        return null;
      }
      return api.get("/seller/dashboard");
    }).then((response) => { if (active && response) setDashboard(response.data); }).catch((requestError) => {
      if (active) setError(requestError.response?.data?.message || "Seller dashboard is unavailable.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [navigate]);

  return <main className="seller-shell"><SellerNavigation /><header className="seller-page-heading"><p className="seller-eyebrow">YOUR STORE</p><h1>Seller overview.</h1><p>A clear view of your product listings and the marketplace tools available to you.</p></header>
    {loading ? <p className="seller-state">Loading seller overview...</p> : error ? <p className="seller-alert" role="alert">{error}</p> : dashboard && <>
      <section className="seller-metric-grid"><article><span><FiPackage /></span><small>Products listed</small><strong>{dashboard.products.total}</strong></article><article><span><FiShoppingBag /></span><small>Published</small><strong>{dashboard.products.published}</strong></article><article><span><FiAlertCircle /></span><small>Low stock</small><strong>{dashboard.products.lowStock}</strong></article><article className="seller-metric-unavailable"><span>₹</span><small>Sales and earnings</small><strong>Not available</strong></article></section>
      <section className="seller-alert seller-commerce-alert"><strong>Orders and payments are not enabled</strong><p>{dashboard.commerce.message} No sales, commissions, or payout balances are estimated.</p><Link to="/seller/earnings">Setup requirements <FiArrowUpRight /></Link></section>
      <div className="seller-dashboard-actions"><Link className="seller-primary-link" to="/seller/products/new">Add a product <FiArrowUpRight /></Link><Link className="seller-secondary-link" to="/seller/products">Manage products <FiArrowUpRight /></Link></div>
    </>}
  </main>;
}

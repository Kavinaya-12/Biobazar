import { useEffect, useState } from "react";
import { FiAlertCircle, FiArrowUpRight } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import { SellerNavigation } from "./SellerHub";
import "./seller-hub.css";

const config = {
  orders: { title: "Seller orders.", label: "ORDERS & FULFILMENT", endpoint: (id) => id ? `/seller/orders/${id}` : "/seller/orders", message: "Orders will appear after customer checkout and payment verification are implemented." },
  earnings: { title: "Earnings.", label: "SELLER FINANCE", endpoint: () => "/seller/earnings/summary", message: "Earnings are not available until verified payments, order snapshots, refunds, and the seller ledger are implemented." },
  payouts: { title: "Payouts.", label: "PAYOUT SETUP", endpoint: () => "/seller/payouts", message: "Payout onboarding is blocked until BioBazaar receives and configures an eligible, approved Razorpay Route marketplace account." },
};

// eslint-disable-next-line react/prop-types
export default function SellerCommerceStatus({ section }) {
  const { id } = useParams();
  const current = config[section];
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { let active = true; api.get(current.endpoint(id)).then(({ data }) => { if (active) setResult(data); }).catch((requestError) => { if (active) setError(requestError.response?.data?.message || current.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [current, id]);
  return <main className="seller-shell"><SellerNavigation active={section} /><header className="seller-page-heading"><p className="seller-eyebrow">{current.label}</p><h1>{current.title}</h1><p>Seller-specific records are private and are not inferred from customer or storefront data.</p></header>{loading ? <p className="seller-state">Checking marketplace configuration...</p> : <section className="seller-alert seller-commerce-alert" role="status"><span className="seller-commerce-icon"><FiAlertCircle /></span><div><strong>{section === "payouts" ? result?.status?.replaceAll("_", " ") || "Setup required" : "Not configured"}</strong><p>{error || current.message}</p>{section === "payouts" && result?.message && <p>{result.message}</p>}<small>No successful payments, order totals, or payout balances are being simulated.</small></div></section>}<Link className="seller-secondary-link" to="/seller/dashboard">Back to overview <FiArrowUpRight /></Link></main>;
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiCheckCircle, FiDroplet, FiFeather, FiRefreshCw, FiTarget } from "react-icons/fi";
import { useSelector } from "react-redux";
import "./impact.css";

const KEY = "biobazaar-impact-v1";
const defaults = { goal: 12, refills: 0, reusable: 0, notes: [] };
const readSaved = () => { try { return { ...defaults, ...(JSON.parse(localStorage.getItem(KEY) || "{}")) }; } catch { return defaults; } };

export default function ImpactDashboard() {
  const [data, setData] = useState(readSaved);
  const productsState = useSelector(state => state.products || {});
  const products = useMemo(() => [ ...(productsState.foods || []), ...(productsState.personalCare || []), ...(productsState.household || []), ...(productsState.lifestyle || []) ], [productsState]);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(data)); }, [data]);
  const evidenceCount = products.filter(p => p.certification || p.certifications || p.ingredients || p.materials || p.packaging || p.reusable || p.refillable || p.recyclable).length;
  const progress = Math.min(100, Math.round((data.refills + data.reusable) / Math.max(1, Number(data.goal)) * 100));
  const update = (field, value) => setData(current => ({ ...current, [field]: value }));
  const add = field => update(field, Number(data[field] || 0) + 1);
  return <main className="impact-page">
    <section className="impact-hero"><p className="impact-kicker"><FiFeather /> YOUR PERSONAL IMPACT</p><h1>Small rituals.<br/><em>Meaningful change.</em></h1><p>Keep track of the everyday habits you choose. Your dashboard is personal to this browser and makes no claims about measured carbon or water savings.</p><Link className="impact-link" to="/collections">Explore thoughtful essentials <FiArrowUpRight /></Link><div className="impact-orbit" aria-hidden="true"><span>less waste</span><FiFeather /><span>more mindful</span></div></section>
    <section className="impact-stats"><article><span className="impact-stat-icon"><FiRefreshCw /></span><strong>{data.refills}</strong><h2>Refills logged</h2><p>Refill or reuse moments you have recorded.</p><button onClick={() => add("refills")}>+ Log a refill</button></article><article><span className="impact-stat-icon"><FiDroplet /></span><strong>{data.reusable}</strong><h2>Reusable swaps</h2><p>Reusable choices you have made this month.</p><button onClick={() => add("reusable")}>+ Log a swap</button></article><article><span className="impact-stat-icon"><FiCheckCircle /></span><strong>{evidenceCount}</strong><h2>Products with details</h2><p>Listed products with at least one sustainability detail provided.</p><Link to="/collections">Review products <FiArrowUpRight /></Link></article></section>
    <section className="impact-goal"><div><p className="impact-kicker"><FiTarget /> YOUR MONTHLY INTENTION</p><h2>Build a habit, not a perfect score.</h2><p>Set a target for refill and reusable moments combined. Progress counts your manual logs only.</p><label htmlFor="impact-goal">Monthly target</label><input id="impact-goal" type="number" min="1" max="1000" value={data.goal} onChange={e => update("goal", Math.max(1, Number(e.target.value) || 1))}/><small>Enter a target from 1 to 1,000 combined moments.</small></div><div className="impact-progress-wrap"><div className="impact-progress-number">{progress}%</div><div className="impact-progress"><span style={{ width: `${progress}%` }} /></div><p>{data.refills + data.reusable} of {data.goal} moments logged</p><button className="impact-reset" onClick={() => { if (window.confirm("Reset this browser's impact log?")) setData(defaults); }}>Reset this month&apos;s log</button></div></section>
    <aside className="impact-note"><strong>A note on the numbers</strong><p>BioBazaar currently tracks actions you enter and counts product records with sustainability details. It does not calculate verified emissions avoided, water saved, certifications, or lifecycle impacts. Your entries are stored in this browser, not synced to an account or purchase history.</p></aside>
  </main>;
}

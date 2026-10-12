import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";

// eslint-disable-next-line react/prop-types
export default function AdminRoute({ children }) {
  const [access, setAccess] = useState("checking");

  useEffect(() => {
    let active = true;
    api.get("/admin/session").then(({ data }) => {
      if (active) setAccess(data.isAdmin === true ? "allowed" : "denied");
    }).catch((error) => {
      if (!active) return;
      if (error.response?.status === 401 || error.response?.status === 403 || error.response?.status === 503) setAccess("denied");
      else setAccess("unavailable");
    });
    return () => { active = false; };
  }, []);

  if (access === "checking") return <main className="session-gate" role="status"><p>Verifying administrator access...</p></main>;
  if (access === "denied") return <Navigate to="/" replace />;
  if (access === "unavailable") return <main className="session-gate" role="alert"><h1>Admin access unavailable</h1><p>We could not verify administrator access. Please check your connection and retry.</p><button onClick={() => window.location.reload()}>Retry</button></main>;
  return children;
}

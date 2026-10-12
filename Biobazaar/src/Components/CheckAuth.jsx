import { Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { restoreSession } from "../redux/authSlice";

// eslint-disable-next-line react/prop-types
function CheckAuth({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, status, restoreError } = useSelector((state) => state.auth);
  const location = useLocation();

  const protectedRoutes = [
    "/cart",
    "/profile",
    "/sell",
    "/wishlist",
    "/seller",
    "/admin",
    "/impact",
  ];

  const authRoutes = [
    "/login",
    "/signup",
  ];

  const requiresAuth = protectedRoutes.some((route) => location.pathname.startsWith(route));

  if (["checking", "verifying"].includes(status) && (requiresAuth || authRoutes.includes(location.pathname))) {
    return <main className="session-gate" role="status"><span className="session-gate-mark">b.</span><p>Verifying your session...</p></main>;
  }

  if (status === "unavailable" && (requiresAuth || authRoutes.includes(location.pathname))) {
    return <main className="session-gate"><span className="session-gate-mark">b.</span><h1>Session unavailable</h1><p>{restoreError || "Your session could not be verified."}</p><button type="button" onClick={() => dispatch(restoreSession())}>Retry verification</button><button type="button" onClick={() => { localStorage.removeItem("token"); localStorage.removeItem("userId"); localStorage.removeItem("userEmail"); window.location.assign("/login"); }}>Sign in again</button></main>;
  }

  if (requiresAuth && !isAuthenticated && status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (
    isAuthenticated &&
    authRoutes.includes(location.pathname)
  ) {
    return <Navigate to="/collections" replace />;
  }

  return children;
}

export default CheckAuth;

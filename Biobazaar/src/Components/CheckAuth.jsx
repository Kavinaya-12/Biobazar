import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function CheckAuth({ children }) {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();

  const isAuthenticated = Boolean(token);

  const protectedRoutes = ["/cart", "/profile", "/sell", "/wishlist"];

  if (
    !isAuthenticated &&
    protectedRoutes.some((path) => location.pathname.startsWith(path))
  ) {
    return <Navigate to="/login" replace />;
  }

  if (
    isAuthenticated &&
    ["/login", "/signup"].includes(location.pathname)
  ) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export default CheckAuth;
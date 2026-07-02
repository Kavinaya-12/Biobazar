import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

function CheckAuth({ children }) {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();

  const isAuthenticated = Boolean(token);

  const protectedRoutes = [
    "/cart",
    "/profile",
    "/sell",
    "/wishlist",
    "/collections",
    "/aboutus",
    "/search-results",
  ];

  const authRoutes = [
    "/login",
    "/signup",
  ];

  if (
    !isAuthenticated &&
    protectedRoutes.some((route) =>
      location.pathname.startsWith(route)
    )
  ) {
    return <Navigate to="/login" replace />;
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
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";

interface ProtectedRouteProps {
  allowedRoles?: ("user" | "host" | "admin")[];
}

const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useSelector(
    (state: RootState) => state.auth,
  );

  // 1. If not logged in, boot them to the home page (you could also route to a /login page)
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // 2. If the route requires specific roles and the user doesn't have them, boot them
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // 3. If they pass all checks, render the child components securely
  return <Outlet />;
};

export default ProtectedRoute;

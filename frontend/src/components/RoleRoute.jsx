import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../context/useAuth";
export function RoleRoute({ roles, children }) {
  const { user } = useAuth(); const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!roles.includes(user.role)) return <Navigate to="/jobs" replace />;
  return children;
}

import { Navigate } from "react-router-dom";
import { getUserRole } from "../auth";

export default function ProtectedRoute({ children, role }) {
  const userRole = getUserRole();

  if (!userRole) return <Navigate to="/login" />;
  
  if (role) {
    const allowed = Array.isArray(role) ? role.includes(userRole) : userRole === role;
    if (!allowed) return <Navigate to="/login" />;
  }

  return children;
}
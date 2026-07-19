import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader } from "lucide-react";
import { useAuthStore, type AppRole } from "../store/authStore";

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}> = ({ children, allowedRoles }) => {
  const { user, initialized, loading, checkSession } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    if (!initialized) {
      checkSession();
    }
  }, [initialized, checkSession]);

  if (!initialized || loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100vh",
          gap: 16,
          background: "var(--bg, #f3f6f9)",
        }}
      >
        <Loader size={28} className="spin" style={{ color: "var(--azul-armada)" }} />
        <span style={{ color: "var(--muted)", fontSize: 15 }}>
          Verificando sesion...
        </span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

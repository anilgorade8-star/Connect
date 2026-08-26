import { Navigate } from "react-router-dom";

const withAuth = (Component) => {
  function AuthenticatedComponent(props) {
    const token = localStorage.getItem("token");

    if (!token) {
      return <Navigate to="/auth" replace />;
    }

    return <Component {...props} />;
  }

  AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name || "Component"})`;
  return AuthenticatedComponent;
};

export default withAuth;

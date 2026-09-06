import { cloneElement } from "react";
import AuthLoadingScreen from "./AuthLoadingScreen";
import LoginPage from "../pages/LoginPage";
import { useAuth } from "../hooks/useAuth";

function AuthGate({ children }) {
  const {
    session,
    user,
    profile,
    loading,
    profileError,
  } = useAuth();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!session || !user) {
    return (
      <LoginPage profileError={profileError} />
    );
  }

  if (!profile) {
    return (
      <LoginPage profileError={profileError} />
    );
  }

  return cloneElement(children, {
    authUser: user,
    authProfile: profile,
  });
}

export default AuthGate;
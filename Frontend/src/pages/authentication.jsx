import React, { useState, useEffect } from "react";
import "../App.css";
import { AuthContext } from "../contexts/auth-context";
import Snackbar from "@mui/material/Snackbar";
import { useNavigate } from "react-router-dom";

function Authentication() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token && token !== "undefined" && token !== "null" && token.trim() !== "") {
      navigate("/home", { replace: true });
    }
  }, [navigate]);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Controls Sign In / Sign Up tab
  const [isSignUp, setIsSignUp] = useState(false);

  // Controls Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") setName(value);
    if (name === "username") setUsername(value);
    if (name === "password") setPassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    try {
      let result;

      if (isSignUp) {
        result = await handleRegister(name, username, password);
      } else {
        result = await handleLogin(username, password);
      }

      setMessage(
        result ||
          (isSignUp
            ? "Account created successfully!"
            : "Signed in successfully!"),
      );

      setSnackbarOpen(true);

      // Clear form
      setName("");
      setUsername("");
      setPassword("");
    } catch (e) {
      const errorMessage =
        e?.response?.data?.message || e?.message || "Something went wrong.";

      setError(errorMessage);
    }
  };

  const switchMode = (signup) => {
    setIsSignUp(signup);
    setError("");
    setMessage("");
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Sign In / Sign Up Buttons */}
          <div className="auth-tabs">
            <button
              type="button"
              className={!isSignUp ? "active-tab" : ""}
              onClick={() => switchMode(false)}
            >
              Sign In
            </button>

            <button
              type="button"
              className={isSignUp ? "active-tab" : ""}
              onClick={() => switchMode(true)}
            >
              Sign Up
            </button>
          </div>

          {/* Header */}
          <div className="login-header">
            <h1>{isSignUp ? "Create Account" : "Welcome Back"}</h1>

            <p>
              {isSignUp
                ? "Create an account to get started"
                : "Sign in to continue to your account"}
            </p>
          </div>

          {/* Error */}
          {error && <p className="error-message">{error}</p>}

          {/* Success */}
          {message && <p className="success-message">{message}</p>}

          {/* Form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Name - only for Sign Up */}
            {isSignUp && (
              <div className="input-group">
                <label>Name</label>

                <input
                  type="text"
                  name="name"
                  value={name}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  autoComplete="name"
                />
              </div>
            )}

            {/* Username */}
            <div className="input-group">
              <label>Username</label>

              <input
                type="text"
                name="username"
                value={username}
                onChange={handleChange}
                placeholder="johndoe"
                required
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="input-group">
              <label>Password</label>

              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {/* Submit */}
            <button type="submit" className="signin-btn">
              {isSignUp ? "Sign Up" : "Sign In"}
            </button>
          </form>

          {/* Bottom switch */}
          <div className="auth-switch">
            {isSignUp ? (
              <p>
                Already have an account?{" "}
                <button type="button" onClick={() => switchMode(false)}>
                  Sign In
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{" "}
                <button type="button" onClick={() => switchMode(true)}>
                  Sign Up
                </button>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={message}
      />
    </div>
  );
}

export default Authentication;

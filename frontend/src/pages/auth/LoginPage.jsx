import React, { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, loading } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const redirectTo = location.state?.from?.pathname || "/inventory";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");

    try {
      await login({
        username: formData.username,
        password: formData.password,
      });

      navigate(redirectTo, { replace: true });
    } catch (error) {
      const status = error?.response?.status;

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        (status === 404
          ? "Login API route not found. Please check backend accounts urls."
          : null) ||
        (status === 401
          ? "Invalid username or password."
          : null) ||
        error?.message ||
        "Login failed. Please try again.";

      setErrorMessage(message);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Login</h1>
        <p style={styles.subtitle}>Enter your credentials to continue</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter username"
              style={styles.input}
              autoComplete="username"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          {errorMessage ? <div style={styles.error}>{errorMessage}</div> : null}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f7fb",
    padding: "24px",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "18px",
    padding: "28px",
    boxShadow: "0 12px 40px rgba(24, 56, 120, 0.12)",
    border: "1px solid #e4e9f2",
  },
  title: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 800,
    color: "#173b8f",
  },
  subtitle: {
    marginTop: "8px",
    marginBottom: "22px",
    color: "#66789c",
    fontSize: "14px",
  },
  form: {
    display: "grid",
    gap: "16px",
  },
  field: {
    display: "grid",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: 700,
    color: "#38507c",
  },
  input: {
    height: "46px",
    borderRadius: "12px",
    border: "1px solid #cfd8ea",
    padding: "0 14px",
    outline: "none",
    fontSize: "14px",
  },
  button: {
    height: "48px",
    border: "none",
    borderRadius: "12px",
    background: "#2f67f6",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: "15px",
    cursor: "pointer",
  },
  error: {
    background: "#fff1f1",
    color: "#c62828",
    border: "1px solid #f3c2c2",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
  },
};

export default LoginPage;
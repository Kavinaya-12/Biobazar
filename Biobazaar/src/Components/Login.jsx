import React, { useState } from "react";
import "./login.css";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { loginSuccess } from "../redux/authSlice";
import { api } from "../api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const validateEmail = (value) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email.trim())) {
      toast.warning("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      toast.warning("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/user/login", {
        email,
        password,
      });

      const { token, userId } = response.data;

      dispatch(loginSuccess({ token, userId, email }));

      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", email);

      toast.success("Successfully Logged In!");

      navigate("/collections");

    } catch (error) {
      console.error(error);

      if (error.response?.status === 400) {
        toast.error("Invalid Email or Password");
      } else {
        toast.error("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-shapes">
        <div className="shape login-shape1"></div>
        <div className="shape login-shape2"></div>
        <div className="shape login-shape3"></div>
      </div>

      <div className="login-box">
        <h1>Login</h1>

        <form onSubmit={handleSubmit}>
          <label>Email:</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password:</label>

          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="login-signup-link">
          Don't have an account? <a href="/signup">Create one</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
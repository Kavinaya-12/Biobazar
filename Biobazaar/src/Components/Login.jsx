import React, { useState } from "react";
import "./login.css";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import { api } from "../api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("/user/login", {
        email,
        password,
      });

      const { token, userId } = response.data;

      dispatch(loginSuccess({ token, userId }));

      localStorage.setItem("token", token);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", email);

      alert("Successfully Logged In!");

      navigate("/collections");

    } catch (error) {
      console.error(error);

      if (error.response?.status === 400) {
        alert("Invalid Email or Password");
      } else {
        alert("Something went wrong.");
      }
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

          <button className="login-btn" type="submit">
            Login
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
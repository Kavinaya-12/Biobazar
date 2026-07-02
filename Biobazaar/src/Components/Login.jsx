import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { loginSuccess } from "../redux/authSlice";
import "./login.css";
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

      // Save in Redux + LocalStorage
      dispatch(loginSuccess({ token, userId }));

      alert("Successfully Logged In!");

      // Redirect
      navigate("/collections");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 400) {
        alert(error.response.data.error);
      } else {
        alert("Login Failed");
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
        <h1>LOGIN</h1>

        <form onSubmit={handleSubmit}>

          <label>Email</label>
          <input
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="login-btn" type="submit">
            Login
          </button>

        </form>

        <p className="login-signup-link">
          Don't have an account?{" "}
          <Link to="/signup">Create one</Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
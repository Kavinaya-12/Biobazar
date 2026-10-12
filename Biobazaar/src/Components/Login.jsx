import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./auth-pages.css";
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
  const location = useLocation();
  const [feedback, setFeedback] = useState("");

  const validateEmail = (value) => {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateEmail(email.trim())) {
      setFeedback("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setFeedback("Password must be at least 6 characters.");
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

      navigate(location.state?.from?.pathname || "/", { replace: true });

    } catch (error) {
      if (error.response?.status === 400) {
        setFeedback("Please check your email and password.");
      } else if (error.response?.status === 401 || error.response?.status === 404) {
        setFeedback("Email or password is incorrect.");
      } else {
        setFeedback("We couldn't sign you in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="login-title">
        <p className="auth-kicker">A more thoughtful way to shop</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="auth-intro">Sign in to pick up where you left off.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email address (required)</label>

          <input
            type="email"
            id="login-email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <small className="auth-help">Use the email address linked to your account.</small>

          <label htmlFor="login-password">Password (required)</label>

          <input
            type="password"
            id="login-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <small className="auth-help">Enter your account password (at least 6 characters).</small>

          <p className="auth-feedback" role="alert">{feedback}</p>
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <p className="auth-note">
          New here? <Link to="/signup">Create your account</Link>
        </p>
      </section>
    </main>
  );
};

export default Login;

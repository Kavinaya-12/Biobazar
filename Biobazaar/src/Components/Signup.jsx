import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { loginSuccess } from "../redux/authSlice";
import { api } from "../api";
import "./auth-pages.css";

const Signup = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState("");

    const validateEmail = (value) => {
        return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value);
    };

    const handleSubmit = async (event) => {

        event.preventDefault();

        if (username.trim().length < 3) {
            setFeedback("Name must be at least 3 characters.");
            return;
        }

        if (!validateEmail(email.trim())) {
            setFeedback("Please enter a valid email address.");
            return;
        }

        if (password.length < 6) {
            setFeedback("Password must be at least 6 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setFeedback("Password and confirm password must match.");
            return;
        }

        setLoading(true);

        try {
            const registrationResponse = await api.post("/user", {
                username,
                email,
                password,
            });

            const { token, userId, email: registeredEmail } = registrationResponse.data;
            if (!token || !userId) throw new Error("The registration response did not establish a session.");
            dispatch(
                loginSuccess({
                    token,
                    userId,
                    email: registeredEmail || email,
                    isNewRegistration: true,
                })
            );
            toast.success("Account Created Successfully!");

            navigate("/collections", { replace: true });

        } catch (error) {

            if (error.response?.data?.error) {
                setFeedback(error.response.data.error);
            } else {
                setFeedback("We couldn't create your account. Please try again.");
            }

        } finally {
            setLoading(false);
        }

    };

    return (

        <main className="auth-page">
            <section className="auth-card" aria-labelledby="signup-title">
                <p className="auth-kicker">Join the conscious marketplace</p>
                <h1 id="signup-title">Create your account</h1>
                <p className="auth-intro">Save your favourites and make everyday choices count.</p>
                <form className="auth-form" onSubmit={handleSubmit}>

                    <label htmlFor="signup-name">Full name (required)</label>

                    <input
                        type="text"
                        id="signup-name"
                        placeholder="Your full name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <small className="auth-help">Enter at least 3 characters.</small>

                    <label htmlFor="signup-email">Email address (required)</label>

                    <input
                        type="email"
                        id="signup-email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <small className="auth-help">Use an email address you can access.</small>

                    <label htmlFor="signup-password">Password (required)</label>

                    <input
                        type="password"
                        id="signup-password"
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <small className="auth-help">Use at least 6 characters.</small>

                    <label htmlFor="signup-confirm">Confirm password (required)</label>

                    <input
                        type="password"
                        id="signup-confirm"
                        placeholder="Re-enter your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? "Creating account..." : "Create Account"}
                    </button>

                    <p className="auth-feedback" role="alert">{feedback}</p>
                </form>
                <p className="auth-note">
                    Already have an account?{" "}
                    <Link to="/login">Sign in</Link>
                </p>

            </section>
        </main>

    );

};

export default Signup;

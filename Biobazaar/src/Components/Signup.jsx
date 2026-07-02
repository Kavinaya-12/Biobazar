import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/authSlice";
import { api } from "../api";
import "./signup.css";

const Signup = () => {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (event) => {

        event.preventDefault();

        try {

            // STEP 1 : Create User
            await api.post("/user", {
                username,
                email,
                password,
            });

            // STEP 2 : Automatically Login
            const loginResponse = await api.post("/user/login", {
                email,
                password,
            });

            const { token, userId } = loginResponse.data;

            // STEP 3 : Update Redux
            dispatch(
                loginSuccess({
                    token,
                    userId,
                })
            );

            // STEP 4 : Save in Local Storage
            localStorage.setItem("token", token);
            localStorage.setItem("userId", userId);
            localStorage.setItem("userEmail", email);

            // STEP 5 : Success Message
            alert("Account Created Successfully!");

            // STEP 6 : Redirect
            navigate("/collections");

        } catch (error) {

            console.error(error);

            if (error.response?.data?.error) {
                alert(error.response.data.error);
            } else {
                alert("Signup Failed");
            }

        }

    };

    return (

        <div className="signup-container">

            <div className="signup-shapes">

                <div className="shape shape1"></div>

                <div className="shape shape2"></div>

                <div className="shape shape3"></div>

            </div>

            <div className="signup-card">

                <h1>SIGN UP</h1>

                <form onSubmit={handleSubmit}>

                    <label>Name:</label>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

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

                    <button
                        type="submit"
                        className="explore-btn"
                    >
                        Signup
                    </button>

                </form>

                <p className="signup-link">
                    Already have an account?{" "}
                    <Link to="/login">Login</Link>
                </p>

            </div>

        </div>

    );

};

export default Signup;
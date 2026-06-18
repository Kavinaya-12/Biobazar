import React, { useState } from 'react';
import axios from 'axios';
import './signup.css';
import { api } from '../api';
const Signup = () => {
    const [username, setUsername] = useState(''); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            await api.post('/user', {
                username, 
                email, 
                password
            });
            alert("Successfully registered");
        } catch (error) {
            console.error(error);
            alert('Failed to register');
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
                    <button type="submit" className="explore-btn">Signup</button>
                </form>
                <p className="signup-link">
                    Already have an account? <a href="/login">Login</a>
                </p>
            </div>
        </div>
    );
};

export default Signup;

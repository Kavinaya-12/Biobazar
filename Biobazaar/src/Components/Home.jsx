import { useNavigate } from "react-router-dom";
import "./home.css";
import { useSelector } from "react-redux";
import Header from "./Header";

const Home = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const handleExplore = () => {
    if (isAuthenticated) {
      navigate("/collections");
    } else {
      navigate("/signup");
    }
  };

  return (
    <div className="home-container">
     

      <div className="bubbles">
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i}></span>
        ))}
      </div>

      <div className="hero-content">
        <div className="left">
          <h1>Discover the Essence of Organic Living</h1>
          <p>Explore a World of Pure, Natural Products</p>
          <span>Join Us in Embracing a Greener Lifestyle</span>
          <button className="explore-btn" onClick={handleExplore}>
            Let’s Explore
          </button>
        </div>

        <div className="right">
          <div className="feature-card">
            <h3>100% Natural</h3>
            <p>Products sourced directly from nature.</p>
          </div>
          <div className="feature-card">
            <h3>Freshly Sourced</h3>
            <p>Delivering freshness to your doorstep.</p>
          </div>
          <div className="feature-card">
            <h3>Eco-Friendly</h3>
            <p>Contribute to a sustainable planet.</p>
          </div>
          <div className="feature-card">
            <h3>Sustainable Living</h3>
            <p>Make greener choices every day.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
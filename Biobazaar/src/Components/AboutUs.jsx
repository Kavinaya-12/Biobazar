import { Link } from "react-router-dom";
import "./aboutus.css";

const AboutUs = () => {
  return (
    <main className="about-wrapper">
      <div className="about-shapes">
        <span className="shape shape1"></span>
        <span className="shape shape2"></span>
        <span className="shape shape3"></span>
      </div>

      <div className="about-grid">
        <div className="about-left">
          <p className="about-eyebrow">THE CONSCIOUS MARKETPLACE</p>
          <h1 className="about-heading">A little more thought behind the everyday.</h1>
          <p className="about-subtext">
            Welcome to <strong>BioBazaar</strong> — your destination for
            organic essentials, mindful living, and everyday products that help
            you feel good and live better.
          </p>
        </div>

        <div className="about-right">
          <section className="about-card">
            <h2>Our Mission</h2>
            <p>
              We aim to make sustainable living simple by bringing together
              natural, safe, and thoughtfully chosen products for healthier homes
              and lifestyles.
            </p>
          </section>

          <section className="about-card">
            <h2>What We Offer</h2>
            <p>
              From nourishing foods to daily essentials, every item in our
              collection is selected with care, quality, and a deeper respect for
              nature.
            </p>
          </section>

          <section className="about-card">
            <h2>Why People Choose Us</h2>
            <ul>
              <li>Organic and thoughtfully sourced</li>
              <li>Curated for daily wellbeing</li>
              <li>Affordable, simple, and conscious</li>
              <li>Designed for a greener lifestyle</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="about-quote">
        <p>
          “We believe small natural choices can lead to a healthier life and a
          better planet.”
        </p>
      </div>
      <div className="about-actions"><Link to="/collections" className="about-shop-link">Explore Shop All <span aria-hidden="true">→</span></Link></div>
    </main>
  );
};

export default AboutUs;

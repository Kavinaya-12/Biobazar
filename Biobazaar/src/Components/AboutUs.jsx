import "./aboutus.css";

const AboutUs = () => {
  return (
    <div className="about-wrapper">
      <div className="about-shapes">
        <span className="shape shape1"></span>
        <span className="shape shape2"></span>
        <span className="shape shape3"></span>
      </div>

      <div className="about-grid">
        <div className="about-left">
          <h1 className="about-heading">About Us</h1>
          <p className="about-subtext">
            Welcome to <strong>BioBazaar</strong>, your trusted destination for
            organic living and eco-conscious choices.
          </p>
        </div>

        <div className="about-right">
          <section className="about-card">
            <h2>Our Mission</h2>
            <p>
              To empower healthier, sustainable lifestyles by offering products
              that are natural, safe, and eco-friendly — because caring for
              yourself means caring for the planet.
            </p>
          </section>

          <section className="about-card">
            <h2>What We Do</h2>
            <p>
              From wholesome foods to lifestyle essentials, every product in our
              collections is curated with love, purity, and responsibility.
            </p>
          </section>

          <section className="about-card">
            <h2>Why Choose Us?</h2>
            <ul>
              <li>100% Organic & Sustainable</li>
              <li>Handpicked with Quality Checks</li>
              <li>Affordable & Conscious Choices</li>
              <li>Trusted by Health Enthusiasts</li>
            </ul>
          </section>
        </div>
      </div>

      <div className="about-quote">
        <p>
          “Together, let’s nurture our planet and ourselves — one step at a
          time.”
        </p>
      </div>
    </div>
  );
};

export default AboutUs;

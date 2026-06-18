import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./collec.css";
import SearchBar from "./SearchBar";

const Collec = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const { filteredProducts, searchQuery } = useSelector((state) => state.products);

  const collections = [
    { id: "foods", text: "Discover the Best Organic Foods for a Healthier You!" },
    { id: "personalcare", text: "Pamper Yourself with Nature’s Finest Personal Care Products!" },
    { id: "household", text: "Eco-Friendly Household Solutions for a Greener Home!" },
    { id: "lifestyle", text: "Elevate Your Lifestyle with Pure Organic Goodness!" },
  ];

  const handleNavigate = (collectionType) => {
    navigate("/collections/" + collectionType, {
      state: { collec: collectionType },
    });
  };

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % collections.length);
  const handlePrevious = () => setCurrentIndex((prev) => (prev - 1 + collections.length) % collections.length);

  const showingSearchResults = Boolean(searchQuery);
  const resultsToShow = filteredProducts;

  return (
    <div className="collec-page">
       <div className="bubbles">
    {Array.from({ length: 15 }).map((_, i) => (
      <span key={i} style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 10}s` }}></span>
    ))}
  </div>

  <SearchBar />

      {showingSearchResults ? (
        <div className="search-results">
          {resultsToShow.length > 0 ? (
            <div className="product-grid">
              {resultsToShow.map((p) => (
                <div key={p._id || p.id} className="product-card">
                  <img src={p.image} alt={p.name || p.title} className="product-image" />
                  <h3 className="product-name">{p.name || p.title}</h3>
                  <p className="product-desc">{p.description}</p>
                  <p className="product-price">₹{p.price}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-results">No results found for "{searchQuery}"</p>
          )}
        </div>
      ) : (
        <div className="overlay-container">
          <div className="overlay-card">
            <h1 className="overlay-title">{collections[currentIndex].text}</h1>
            <div className="overlay-buttons">
              <button className="explore-bttn" onClick={() => handleNavigate(collections[currentIndex].id)}>View</button>
              <button className="explore-bttn" onClick={handleNext}>Next</button>
              <button className="explore-bttn" onClick={handlePrevious}>Previous</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Collec;

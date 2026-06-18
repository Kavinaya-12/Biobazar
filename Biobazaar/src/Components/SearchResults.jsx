import { useLocation } from "react-router-dom";

const SearchResults = () => {
  const location = useLocation();
  const { results = [], query = "" } = location.state || {};

  return (
    <div className="results-page">
      <h2>Search Results for "{query}"</h2>
      {results.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="results-grid">
          {results.map((item) => (
            <div key={item._id} className="result-card">
              <img src={item.image} alt={item.name} />
              <h3>{item.name}</h3>
              <p>₹{item.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;

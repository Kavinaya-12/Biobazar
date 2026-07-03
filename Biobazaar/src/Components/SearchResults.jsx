import { useSelector } from "react-redux";

const SearchResults = () => {
  const { filteredProducts: results, searchQuery: query } = useSelector(
    (state) => state.products
  );

  return (
    <div className="results-page">
      <h2>Search Results{query ? ` for "${query}"` : ""}</h2>
      {results.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div className="results-grid">
          {results.map((item) => (
            <div key={item._id || item.id} className="result-card">
              <img src={item.image} alt={item.name || item.title} />
              <h3>{item.name || item.title}</h3>
              <p>₹{item.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;

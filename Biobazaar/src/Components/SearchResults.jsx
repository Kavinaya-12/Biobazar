import { useSelector } from "react-redux";
import { productCardImageUrl, productCardName } from "../utils/productCardPresentation";
import ProductImage from "./ProductImage";
import ProductCardDescription from "./ProductCardDescription";

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
              <ProductImage src={productCardImageUrl(item.image, undefined, item.sku)} alt={productCardName(item)} frameClassName="search-result-image" />
              <h3>{productCardName(item)}</h3>
              <ProductCardDescription product={item} />
              <p>₹{item.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResults;

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  setWishlist,
  removeFromWishlist,
  setLoading,
  setError,
} from "../redux/wishlistSlice";
import { api } from "../api";
import { productCardImageUrl, productCardName } from "../utils/productCardPresentation";
import ProductImage from "./ProductImage";
import { toast } from "react-hot-toast";
import "./wishlist.css";

const Wishlist = () => {
  const dispatch = useDispatch();
  const [removingId, setRemovingId] = useState(null);

  const { items, loading } = useSelector((state) => state.wishlist);
  const userId = useSelector((state) => state.auth.userId);

  const fetchWishlist = useCallback(async () => {
    try {
      dispatch(setLoading(true));

      const res = await api.get(`/wishlist/${userId}`);

      dispatch(setWishlist(res.data.wishlist.items));
    } catch (err) {
      dispatch(setError(err.message));
      toast.error(err.response?.data?.message || "Unable to load wishlist");
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (userId) fetchWishlist();
  }, [fetchWishlist, userId]);

  const handleRemove = async (productId) => {
    try {
      setRemovingId(productId);
      await api.post("/wishlist/remove", {
        userId,
        productId,
      });
      dispatch(removeFromWishlist(productId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove from wishlist");
    } finally {
      setRemovingId(null);
    }
  };

  if (loading)
    return <main className="wishlist-page"><h2 className="wishlist-loading">Loading your wishlist...</h2></main>;

  return (
    <div className="wishlist-page">
      <div className="wishlist-hero">
        <span className="wishlist-badge">Saved for later</span>
        <h1 className="wishlist-title">My Wishlist</h1>
        <p className="wishlist-subtitle">
          {items.length > 0
            ? `You have ${items.length} item${items.length > 1 ? "s" : ""} saved for later.`
            : "Keep the products you love close and shop when you're ready."}
        </p>
      </div>

      <div className="wishlist-summary">
        <div className="summary-pill">
          <span>{items.length}</span> Saved
        </div>
        <div className="summary-pill soft">
          <span>Fresh</span> Picks
        </div>
      </div>

      <div className="wishlist-grid">
        {items.length === 0 ? (
          <div className="wishlist-empty">
            <div className="empty-icon">♥</div>
            <h2>Your wishlist is empty</h2>
            <p>Start saving items you love and come back to them anytime.</p>
            <Link className="wishlist-shop-link" to="/collections">Explore Shop All <span aria-hidden="true">→</span></Link>
          </div>
        ) : (
          items.map((item) => {
            const product = item.productId || {};
            const image = typeof product.image === "string" ? product.image : "";

            return (
              <article className="wishlist-card" key={product._id || product.id}>
                <div className="wishlist-image-wrap">
                  <ProductImage
                    src={productCardImageUrl(image, api.defaults.baseURL, product.sku)}
                    alt={productCardName(product) || "Wishlist product"}
                    frameClassName="wishlist-image"
                  />
                  <span className="wishlist-tag">
                    {product.category || "Organic"}
                  </span>
                </div>

                <div className="wishlist-content">
                  <h3>{productCardName(product) || "Product name"}</h3>
                  <p className="wishlist-price">₹ {product.price || 0}</p>
                  <div className="wishlist-meta">
                    <span>Ready to ship</span>
                    <span>Eco favorite</span>
                  </div>
                </div>

                <button
                  className="wishlist-remove-btn"
                  onClick={() => handleRemove(product._id)}
                  disabled={removingId === product._id}
                >
                  {removingId === product._id ? "Removing..." : "Remove"}
                </button>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Wishlist;

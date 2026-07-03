import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setWishlist,
  removeFromWishlist,
  setLoading,
  setError,
} from "../redux/wishlistSlice";
import { api } from "../api";
import { toast } from "react-hot-toast";
import "./wishlist.css";

const Wishlist = () => {
  const dispatch = useDispatch();
  const [removingId, setRemovingId] = useState(null);

  const { items, loading } = useSelector((state) => state.wishlist);
  const userId = useSelector((state) => state.auth.userId);

  useEffect(() => {
    if (userId) {
      fetchWishlist();
    }
  }, [userId]);

  const fetchWishlist = async () => {
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
  };

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
    return <h2 style={{ textAlign: "center" }}>Loading Wishlist...</h2>;

  return (
    <div className="wishlist-container">
      <h1 className="wishlist-title">My Wishlist</h1>

      <div className="wishlist-grid">
        {items.length === 0 ? (
          <p>Your Wishlist is Empty</p>
        ) : (
          items.map((item) => {
            const product = item.productId || {};
            const image =
              product.image && product.image.trim()
                ? product.image
                : "https://via.placeholder.com/300x300?text=No+Image";

            return (
              <div
                className="wishlist-card"
                key={product._id || product.id}
              >
                <img
                  src={image}
                  alt={product.name || "Wishlist product"}
                  className="wishlist-image"
                />

                <h3>{product.name}</h3>

                <p>₹ {product.price}</p>

                <button
                  className="wishlist-remove-btn"
                  onClick={() => handleRemove(product._id)}
                  disabled={removingId === product._id}
                >
                  {removingId === product._id ? "Removing..." : "Remove"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Wishlist;
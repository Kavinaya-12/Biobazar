import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setWishlist,
  removeFromWishlist,
  setLoading,
  setError,
} from "../redux/wishlistSlice";
import { api } from "../api";
import "./wishlist.css";

const Wishlist = () => {
  const dispatch = useDispatch();

  const { items, loading } = useSelector((state) => state.wishlist);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      dispatch(setLoading(true));

      const res = await api.get(`/wishlist/${userId}`);

      dispatch(setWishlist(res.data.items));

      dispatch(setLoading(false));
    } catch (err) {
      dispatch(setLoading(false));
      dispatch(setError(err.message));
      console.log(err);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await api.post("/wishlist/remove", {
        userId,
        productId,
      });

      dispatch(removeFromWishlist(productId));
    } catch (err) {
      console.log(err);
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
          items.map((item) => (
            <div
              className="wishlist-card"
              key={item.productId._id}
            >
              <img
                src={item.productId.image}
                alt={item.productId.name}
                className="wishlist-image"
              />

              <h3>{item.productId.name}</h3>

              <p>₹ {item.productId.price}</p>

              <button
                className="wishlist-remove-btn"
                onClick={() =>
                  handleRemove(item.productId._id)
                }
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Wishlist;
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { removeFromWishlist, setWishlist } from "../redux/wishlistSlice";
import "./wishlist.css";

const Wishlist = () => {
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.items);

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.id : null;

  useEffect(() => {
    if (userId) {
      const saved = localStorage.getItem(`wishlist_${userId}`);
      if (saved) dispatch(setWishlist(JSON.parse(saved)));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId) localStorage.setItem(`wishlist_${userId}`, JSON.stringify(wishlist));
  }, [wishlist, userId]);

  const handleRemove = (_key) => {
    dispatch(removeFromWishlist(_key));
  };

  return (
    <div className="wishlist-container">
      <h1 className="wishlist-title"> My Wishlist</h1>
      <div className="wishlist-grid">
        {wishlist.length === 0 ? (
          <p className="wishlist-empty">✨ Your wishlist is empty. Start adding your favorites!</p>
        ) : (
          wishlist.map((item) => (
            <div key={item._key} className="wishlist-card">
              {item.image ? (
                <img src={item.image} alt={item.name} className="wishlist-image" />
              ) : (
                <div className="wishlist-no-image">No Image</div>
              )}
              <h3 className="wishlist-name">{item.name}</h3>
              <p className="wishlist-price">
                {item.price ? `$${item.price.toFixed(2)}` : "Price not available"}
              </p>
              <button className="wishlist-remove-btn" onClick={() => handleRemove(item._key)}>
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

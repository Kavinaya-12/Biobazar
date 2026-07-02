import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setWishlist,
  removeFromWishlist,
} from "../redux/wishlistSlice";
import { api } from "../api";
import "./wishlist.css";

const Wishlist = () => {

  const dispatch = useDispatch();

  const wishlist = useSelector(
    (state) => state.wishlist.items
  );

  const userId = localStorage.getItem("userId");

  useEffect(() => {

    if (userId) {
      fetchWishlist();
    }

  }, []);

  const fetchWishlist = async () => {

    try {

      const res = await api.get(`/wishlist/${userId}`);

      if (res.data.success) {

        dispatch(
          setWishlist(res.data.wishlist.items)
        );

      }

    } catch (err) {

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

  return (
    <div className="wishlist-container">

      <h1 className="wishlist-title">
        My Wishlist
      </h1>

      <div className="wishlist-grid">

        {wishlist.length === 0 ? (

          <p className="wishlist-empty">
            Your wishlist is empty.
          </p>

        ) : (

          wishlist.map((item) => (

            <div
              key={item.productId._id}
              className="wishlist-card"
            >

              <img
                src={item.productId.image}
                alt={item.productId.name}
                className="wishlist-image"
              />

              <h3 className="wishlist-name">
                {item.productId.name}
              </h3>

              <p className="wishlist-price">
                ₹{item.productId.price}
              </p>

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
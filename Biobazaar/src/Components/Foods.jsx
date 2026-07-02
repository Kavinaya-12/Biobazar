import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { api } from "../api";

import { setCart } from "../redux/cartSlice";
import { setWishlist } from "../redux/wishlistSlice";
import { clearSearch } from "../redux/productSlice";

import SearchBar from "./SearchBar";
import "./collec.css";

const Foods = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const foods = useSelector((state) => state.products.foods);
  const filteredProducts = useSelector(
    (state) => state.products.filteredProducts
  );

  const wishlist = useSelector((state) => state.wishlist.items);
  const userId = useSelector((state) => state.auth.userId);

  const [addedToCart, setAddedToCart] = useState({});

  useEffect(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  useEffect(() => {
    if (!userId) return;

    fetchWishlist();
    fetchCart();
  }, [userId]);

  const fetchWishlist = async () => {
    try {
      const res = await api.get(`/wishlist/${userId}`);
      dispatch(setWishlist(res.data.wishlist.items));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCart = async () => {
    try {
      const res = await api.get(`/cart/${userId}`);

      dispatch(setCart(res.data.cart.items));

      const added = {};

      res.data.cart.items.forEach((item) => {
        added[item.productId._id] = true;
      });

      setAddedToCart(added);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const res = await api.post("/cart/add", {
        userId,
        productId: product._id,
        quantity: 1,
      });

      dispatch(setCart(res.data.cart.items));

      setAddedToCart((prev) => ({
        ...prev,
        [product._id]: true,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoToCart = () => {
    navigate("/cart");
  };

  const handleWishlistToggle = async (product) => {
    try {
      const exists = wishlist.some(
        (item) => item.productId._id === product._id
      );

      if (exists) {
        const res = await api.post("/wishlist/remove", {
          userId,
          productId: product._id,
        });

        if (res.data.success) {
          dispatch(setWishlist(res.data.wishlist.items));
        }
      } else {
        const res = await api.post("/wishlist/add", {
          userId,
          productId: product._id,
        });

        if (res.data.success) {
          dispatch(setWishlist(res.data.wishlist.items));
        }
      }
    } catch (err) {
      console.error("Wishlist error:", err);
      alert(err.response?.data?.message || "Error updating wishlist");
    }
  };

  const products =
    filteredProducts.length > 0 ? filteredProducts : foods;

  return (
    <div className="foods-container">
      <h1 className="foods-title">Food Products</h1>

      <SearchBar />

      <div className="foods-grid">
        {products.map((product) => {
          const image =
            product.image && product.image.startsWith("http")
              ? product.image
              : `${api.defaults.baseURL}/${product.image}`;

          const inWishlist = wishlist.some(
            (item) => item.productId._id === product._id
          );

          return (
            <div className="foods-card" key={product._id}>
              <img
                src={image}
                alt={product.name}
                className="collec-image"
              />

              <h3 className="collec-name">
                {product.name}
              </h3>

              <p className="collec-price">
                ₹{product.price}
              </p>

              {addedToCart[product._id] ? (
                <button
                  className="collec-btn"
                  onClick={handleGoToCart}
                >
                  Go To Cart
                </button>
              ) : (
                <button
                  className="collec-btn"
                  onClick={() => handleAddToCart(product)}
                >
                  Add To Cart
                </button>
              )}

              <button
                className="wishlist-btn"
                onClick={() => handleWishlistToggle(product)}
              >
                {inWishlist
                  ? "Remove from Wishlist"
                  : "Add to Wishlist"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Foods;
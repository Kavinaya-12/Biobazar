import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../redux/cartSlice';
import { addToWishlist, removeFromWishlist, setWishlist } from '../redux/wishlistSlice';
import { clearSearch } from '../redux/productSlice';
import SearchBar from './SearchBar';
import './collec.css';

const Household = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { household, filteredProducts } = useSelector((state) => state.products);
  const wishlist = useSelector((state) => state.wishlist.items);

  const [addedToCart, setAddedToCart] = useState({});

  const section = "Household";
  const user = JSON.parse(localStorage.getItem("user"));
  const userId = user ? user.id : null;

  useEffect(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  useEffect(() => {
    if (userId) {
      const savedWishlist = localStorage.getItem(`wishlist_${userId}`);
      dispatch(setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []));
    }
  }, [userId, dispatch]);

  useEffect(() => {
    if (userId) {
      localStorage.setItem(`wishlist_${userId}`, JSON.stringify(wishlist));
    }
  }, [wishlist, userId]);

  const handleAddToCart = (product) => {
    dispatch(addToCart(product));
    setAddedToCart((prev) => ({ ...prev, [product._id || product.id]: true }));
  };

  const handleGoToCart = () => navigate('/cart');

  const handleWishlistToggle = (product) => {
    const _key = `${section}_${product._id || product.id}`;
    const isInWishlist = wishlist.some((i) => i._key === _key);

    if (isInWishlist) dispatch(removeFromWishlist(_key));
    else dispatch(addToWishlist({ ...product, _key, section }));
  };

  const getImageSrc = (product) =>
    product.image.startsWith('http') ? product.image : `http://localhost:8000${product.image}`;

  const productsToShow = filteredProducts?.length ? filteredProducts : household;

  return (
    <div className="household-container">
  <h1 className="household-title">Household Products</h1>
  <SearchBar />
  <div className="household-grid">
    {productsToShow.map((product) => {
      const _key = `${section}_${product._id || product.id}`;
      const isInWishlist = wishlist.some((i) => i._key === _key);
      return (
        <div key={_key} className="household-card">
          <img src={getImageSrc(product)} alt={product.name} className="collec-image" />
          <h3 className="collec-name">{product.name}</h3>
          <p className="collec-price">${product.price.toFixed(2)}</p>

          {addedToCart[product._id || product.id] ? (
            <button className="collec-btn" onClick={handleGoToCart}>Go to Cart</button>
          ) : (
            <button className="collec-btn" onClick={() => handleAddToCart(product)}>Add to Cart</button>
          )}

          <button className="wishlist-btn" onClick={() => handleWishlistToggle(product)}>
            {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>
        </div>
      );
    })}
  </div>
</div>

  );
};

export default Household;

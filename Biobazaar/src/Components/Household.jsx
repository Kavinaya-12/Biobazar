import { useCallback, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { api } from "../api";
import { addCartProduct, cartContainsProduct, fetchCartForUser } from "../redux/cartSlice";
import { setWishlist } from "../redux/wishlistSlice";
import { clearSearch, removeProduct } from "../redux/productSlice";
import { productCardImageUrl, productCardName } from "../utils/productCardPresentation";
import ProductImage from "./ProductImage";
import ProductCardDescription from "./ProductCardDescription";
import SearchBar from "./SearchBar";
import "./collec.css";

const getProductImageUrl = (image, sku) => typeof image === "string" ? productCardImageUrl(image, api.defaults.baseURL, sku) : "";

const Household = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const household = useSelector(
    (state) => state.products.household
  );

  const filteredProducts = useSelector(
    (state) => state.products.filteredProducts
  );
  const searchQuery = useSelector((state) => state.products.searchQuery);
  const productStatus = useSelector((state) => state.products.status);

  const wishlist = useSelector(
    (state) => state.wishlist.items
  );
  const userId = useSelector((state) => state.auth.userId);
  const isAuthenticated = useSelector((state) => state.auth.status === "authenticated");

  const cartItems = useSelector((state) => state.cart.items);
  const cartStatus = useSelector((state) => state.cart.status);
  const mutationProductId = useSelector((state) => state.cart.mutationProductId);

  useEffect(() => {
    dispatch(clearSearch());
  }, [dispatch]);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await api.get(`/wishlist/${userId}`);
      dispatch(setWishlist(res.data.wishlist.items));
    } catch (err) {
      console.error(err);
    }
  }, [dispatch, userId]);

  useEffect(() => {
    if (isAuthenticated && userId) fetchWishlist();
  }, [userId, isAuthenticated, fetchWishlist]);

  const handleAddToCart = async (product) => {
    try {
      await dispatch(addCartProduct({ productId: product._id || product.id })).unwrap();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to add this item to your cart.");
    }
  };

  const handleGoToCart = () => {
    navigate("/cart");
  };

  const handleShareProduct = async (product) => {
    const url = `${window.location.origin}/collections/household?product=${product._id}`;
    const text = `${product.name} - ₹${product.price}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text, url });
        return;
      }

      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success("Product link copied.");
    } catch (error) {
      toast.error("Unable to share this product right now.");
    }
  };

  const handleEditProduct = (product) => {
    navigate("/sell", { state: { editProduct: product } });
  };

  const handleDeleteProduct = async (product) => {
    if (!window.confirm("Remove this product from your listing?")) return;

    try {
      const response = await api.delete(`/products/${product._id}`);
      if (response.data.success) {
        dispatch(removeProduct({ category: product.collec, productId: product._id }));
        toast.success("Product removed successfully.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to remove this product.");
    }
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
      toast.error(err.response?.data?.message || "Error updating wishlist");
    }
  };

  const [sortMode, setSortMode] = useState("featured");
  const categorySearchResults = filteredProducts.filter((product) =>
    household.some((categoryProduct) => (categoryProduct._id || categoryProduct.id) === (product._id || product.id))
  );
  const baseProducts = searchQuery ? categorySearchResults : household;
  const products = [...baseProducts].sort((a, b) => {
    if (sortMode === "low") return Number(a.price) - Number(b.price);
    if (sortMode === "high") return Number(b.price) - Number(a.price);
    if (sortMode === "name") return (a.name || "").localeCompare(b.name || "");
    return 0;
  });


  return (
    <div className="household-container">
      <div className="category-breadcrumb"><Link to="/collections">Shop all</Link><span>/</span><span>Home &amp; Living</span></div>
      <div className="products-topbar">
        <div><p className="category-eyebrow">HOME & LIVING</p><h1 className="household-title">A thoughtful home.</h1><p className="category-intro">Practical home essentials for the spaces and routines that make up your day.</p></div>
        <div className="toolbar-actions">
          <span className="toolbar-label">Sort</span>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="featured">Featured</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <SearchBar />

      <div className="household-grid">
        {productStatus === "loading" && household.length === 0 ? (
          <div className="empty-listings" role="status">Loading home products...</div>
        ) : products.length === 0 ? (
          <div className="empty-listings">No household products are available right now.</div>
        ) : products.map((product) => {
          const image = getProductImageUrl(product.image, product.sku);
          const hasStockInfo = product.inventoryQuantity !== null && product.inventoryQuantity !== undefined && Number.isFinite(Number(product.inventoryQuantity));
          const isOutOfStock = hasStockInfo && Number(product.inventoryQuantity) <= 0;

          const inWishlist = wishlist.some(
            (item) => item.productId._id === product._id
          );

          return (
            <div
              key={product._id}
              className="household-card"
            >
              <ProductImage src={image} alt={productCardName(product)} frameClassName="collec-image" />

              <h3 className="collec-name">
                {productCardName(product)}
              </h3>

              <ProductCardDescription product={product} />

              <p className="collec-price">
                ₹{product.price}
              </p>
              <p className={`collec-stock${isOutOfStock ? " unavailable" : ""}`}>{hasStockInfo ? isOutOfStock ? "Out of stock" : `${product.inventoryQuantity} available` : "Availability not provided"}</p>

              {isOutOfStock ? <button className="collec-btn" disabled>Out of stock</button> : !isAuthenticated ? <button className="collec-btn" onClick={() => navigate("/login")}>Log in to add</button> : cartContainsProduct(cartItems, product._id || product.id) ? (
                <button
                  className="collec-btn"
                  onClick={handleGoToCart}
                >
                  Go To Cart
                </button>
              ) : (
                <button
                  className="collec-btn"
                  onClick={() => cartStatus === "failed" ? dispatch(fetchCartForUser(userId)) : handleAddToCart(product)}
                  disabled={cartStatus === "loading" || Boolean(mutationProductId)}
                >
                  {cartStatus === "loading" || cartStatus === "idle" ? "Checking cart..." : mutationProductId === String(product._id || product.id) ? "Adding..." : cartStatus === "failed" ? "Retry cart" : "Add To Cart"}
                </button>
              )}

              {isAuthenticated && <button
                className="wishlist-btn"
                onClick={() =>
                  handleWishlistToggle(product)
                }
              >
                {inWishlist
                  ? "Remove from Wishlist"
                  : "Add to Wishlist"}
              </button>}

              <div className="store-card-actions">
                <button className="share-btn" onClick={() => handleShareProduct(product)}>
                  Share
                </button>
                {isAuthenticated && String(product.userId || "") === String(userId) && (
                  <>
                    <button className="mini-action-btn" onClick={() => handleEditProduct(product)}>
                      Edit
                    </button>
                    <button className="mini-action-btn danger" onClick={() => handleDeleteProduct(product)}>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Household;

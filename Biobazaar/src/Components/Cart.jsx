import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import { fetchCartForUser, removeCartProduct, updateCartProductQuantity } from "../redux/cartSlice";
import { productCardDescription, productCardImageUrl, productCardName } from "../utils/productCardPresentation";
import ProductImage from "./ProductImage";
import "./cart.css";

const CartPage = () => {
  const dispatch = useDispatch();
  const [actionLoading, setActionLoading] = useState(null);

  const cartItems = useSelector((state) => state.cart.items);
  const cartStatus = useSelector((state) => state.cart.status);
  const cartError = useSelector((state) => state.cart.error);
  const mutationRequestId = useSelector((state) => state.cart.mutationRequestId);
  const userId = useSelector((state) => state.auth.userId);

  useEffect(() => {
    if (userId) dispatch(fetchCartForUser(userId));
  }, [userId, dispatch]);

  const handleIncrement = async (productId, quantity) => {
    try {
      setActionLoading(productId);
      await dispatch(updateCartProductQuantity({ productId, quantity: quantity + 1 })).unwrap();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update cart quantity.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecrement = async (productId, quantity) => {
    if (quantity <= 1) {
      return;
    }

    try {
      setActionLoading(productId);
      await dispatch(updateCartProductQuantity({ productId, quantity: quantity - 1 })).unwrap();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update cart quantity.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (productId) => {
    try {
      setActionLoading(productId);
      await dispatch(removeCartProduct({ productId })).unwrap();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove item.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckout = () => {
    toast.error("Secure checkout is not configured yet. Your cart has been kept.");
  };

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalAmount = cartItems
    .reduce((sum, item) => {
      return sum + item.quantity * item.productId.price;
    }, 0)
    .toFixed(2);

  return (
    <div className="cart-container">
      <div className="cart-heading"><p className="account-eyebrow">YOUR EVERYDAY EDIT</p><h1>Your shopping bag.</h1><p>Review your considered finds before you continue.</p></div>

      <div className="cart-items">

        {cartItems.length === 0 && (
          <div className="cart-empty"><span className="cart-empty-mark">b.</span><h2>{cartStatus === "loading" ? "Loading your bag..." : "Your bag is waiting."}</h2><p>{cartStatus === "loading" ? "Gathering your saved items." : cartStatus === "failed" ? (cartError || "We could not load your bag. Please try again.") : "Find something useful, lovely or a little of both."}</p>{cartStatus === "failed" && <button type="button" className="cart-shop-link" onClick={() => dispatch(fetchCartForUser(userId))}>Retry</button>}{cartStatus !== "loading" && <Link to="/collections" className="cart-shop-link">Explore Shop All <span aria-hidden="true">→</span></Link>}</div>
        )}

        {cartItems.map((item) => (
          <div
            key={item.productId._id}
            className="cart-item"
          >

            <ProductImage
              src={productCardImageUrl(item.productId.image, undefined, item.productId.sku)}
              alt={productCardName(item.productId)}
              frameClassName="product-image-frame--cart"
            />

            <div className="item-details">

              <h3>{productCardName(item.productId)}</h3>

              <p>{productCardDescription(item.productId)}</p>

              <p>
                Price : ₹{item.productId.price}
              </p>

              <p>
                Quantity : {item.quantity}
              </p>

              <div className="item-controls">

                <button
                  onClick={() =>
                    handleIncrement(
                      item.productId._id,
                      item.quantity
                    )
                  }
                  disabled={actionLoading === item.productId._id}
                >
                  {actionLoading === item.productId._id ? "+" : "+"}
                </button>

                <button
                  onClick={() =>
                    handleDecrement(
                      item.productId._id,
                      item.quantity
                    )
                  }
                  disabled={item.quantity <= 1 || actionLoading === item.productId._id}
                >
                  -
                </button>

                <button
                  onClick={() =>
                    handleRemove(item.productId._id)
                  }
                  disabled={actionLoading === item.productId._id}
                >
                  {actionLoading === item.productId._id ? "Removing..." : "Remove"}
                </button>

              </div>

            </div>

          </div>
        ))}
      </div>

      {cartItems.length > 0 && (
        <div className="cart-summary">

          <h2>Cart Summary</h2>

          <p>Total Items : {totalItems}</p>

          <p>Total Amount : ₹{totalAmount}</p>

          <button
            className="checkout-button"
            onClick={handleCheckout}
            disabled={Boolean(mutationRequestId)}
          >
            {mutationRequestId ? "Updating bag..." : "Checkout unavailable"}
          </button>

        </div>
      )}
    </div>
  );
};

export default CartPage;

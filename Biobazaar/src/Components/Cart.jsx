import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import {
  clearCart,
  setCart,
} from "../redux/cartSlice";
import { api } from "../api";
import "./cart.css";

const CartPage = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const cartItems = useSelector((state) => state.cart.items);
  const userId = useSelector((state) => state.auth.userId);

  useEffect(() => {
    if (userId) {
      loadCart();
    }
  }, [userId]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/cart/${userId}`);

      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load cart");
    } finally {
      setLoading(false);
    }
  };

  const handleIncrement = async (productId, quantity) => {
    try {
      setActionLoading(productId);
      const res = await api.put("/cart/quantity", {
        userId,
        productId,
        quantity: quantity + 1,
      });

      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
      } else {
        toast.error(res.data.message || "Unable to update cart quantity.");
      }
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
      const res = await api.put("/cart/quantity", {
        userId,
        productId,
        quantity: quantity - 1,
      });

      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
      } else {
        toast.error(res.data.message || "Unable to update cart quantity.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update cart quantity.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (productId) => {
    try {
      setActionLoading(productId);
      const res = await api.post("/cart/remove", {
        userId,
        productId,
      });

      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
      } else {
        toast.error(res.data.message || "Unable to remove item.");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to remove item.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckout = () => {
    toast.success("Proceeding to checkout");
    dispatch(clearCart());
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
      <h1>Shopping Cart</h1>

      <div className="cart-items">

        {cartItems.length === 0 && (
          <p>Your cart is empty</p>
        )}

        {cartItems.map((item) => (
          <div
            key={item.productId._id}
            className="cart-item"
          >

            <img
              src={item.productId.image}
              alt={item.productId.name}
            />

            <div className="item-details">

              <h3>{item.productId.name}</h3>

              <p>{item.productId.description}</p>

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
            disabled={loading}
          >
            {loading ? "Loading..." : "Checkout"}
          </button>

        </div>
      )}
    </div>
  );
};

export default CartPage;
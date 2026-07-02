import React, { useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart,
  setCart,
} from "../redux/cartSlice";
import { api } from "../api";
import "./cart.css";

const CartPage = () => {
  const dispatch = useDispatch();

  const cartItems = useSelector((state) => state.cart.items);
  const userId = useSelector((state) => state.auth.userId);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      const res = await api.get(`/cart/${userId}`);

      if (res.data.success) {
        dispatch(setCart(res.data.cart.items));
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleIncrement = async (productId, quantity) => {
    try {
      await api.post("/cart/add", {
        userId,
        productId,
        quantity: quantity + 1,
      });

      loadCart();
    } catch (err) {
      console.log(err);
    }
  };

  const handleDecrement = async (productId, quantity) => {
    try {
      if (quantity <= 1) {
        await api.post("/cart/remove", {
          userId,
          productId,
        });
      } else {
        await api.post("/cart/add", {
          userId,
          productId,
          quantity: quantity - 1,
        });
      }

      loadCart();
    } catch (err) {
      console.log(err);
    }
  };

  const handleRemove = async (productId) => {
    try {
      await api.post("/cart/remove", {
        userId,
        productId,
      });

      loadCart();
    } catch (err) {
      console.log(err);
    }
  };

  const handleCheckout = () => {
    alert("Proceeding to checkout");
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
                >
                  +
                </button>

                <button
                  onClick={() =>
                    handleDecrement(
                      item.productId._id,
                      item.quantity
                    )
                  }
                >
                  -
                </button>

                <button
                  onClick={() =>
                    handleRemove(item.productId._id)
                  }
                >
                  Remove
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
          >
            Checkout
          </button>

        </div>
      )}
    </div>
  );
};

export default CartPage;
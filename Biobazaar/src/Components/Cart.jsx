import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { incrementQuantity, decrementQuantity, removeFromCart, clearCart } from '../redux/cartSlice';
import './cart.css'; 

const CartPage = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);

  const handleIncrement = (id) => {
    dispatch(incrementQuantity(id));
  };

  const handleDecrement = (id) => {
    dispatch(decrementQuantity(id));
  };

  const handleRemove = (id) => {
    dispatch(removeFromCart(id));
  };

  const handleCheckout = () => {
    alert('Proceeding to checkout');
    dispatch(clearCart());
  };

  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cartItems.reduce((total, item) => total + item.quantity * item.price, 0).toFixed(2);

  return (
    <div className="cart-container">
      <h1>Shopping Cart</h1>
      <div className="cart-items">
        {cartItems.length === 0 && <p>Your cart is empty</p>}
        {cartItems.map((item) => (
          <div key={item.id} className="cart-item">
            <img src={item.image} alt={item.name} />
            <div className="item-details">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>Price: ${item.price}</p>
              <p>Quantity: {item.quantity}</p>
              <div className="item-controls">
                <button onClick={() => handleIncrement(item.id)}>+</button>
                <button onClick={() => handleDecrement(item.id)}>-</button>
                <button onClick={() => handleRemove(item.id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {cartItems.length > 0 && (
        <div className="cart-summary">
          <h2>Cart Summary</h2>
          <p>Total Items: {totalItems}</p>
          <p>Total Amount: ${totalAmount}</p>
          <button className="checkout-button" onClick={handleCheckout}>
            Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default CartPage;

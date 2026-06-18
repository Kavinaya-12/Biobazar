import React, { useState } from 'react';
import axios from 'axios';
import './sell.css';
import { api } from '../api';

const Sell = () => {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [collec, setcollec] = useState('Foods');

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('image', image);
    formData.append('collec', collec);

    try {
      const response = await api.post('/products/sell', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error adding product:', error);
      alert('Failed to add product');
    }
  };

  return (
    <div className="sell-container">
      <h2>Sell Your Product</h2>
      <form onSubmit={handleSubmit} className="sell-form">
        <label>Name:</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <label>Type:</label>
        <input
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          required
        />

        <label>Price:</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <label>Description:</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <label>Image:</label>
        <input type="file" onChange={handleImageChange} required />

        <label>collec:</label>
        <select
          value={collec}
          onChange={(e) => setcollec(e.target.value)}
          required
        >
          <option value="Foods">Foods</option>
          <option value="Household">Household</option>
          <option value="PersonalCare">Personal Care</option>
          <option value="Lifestyle">Lifestyle</option>
        </select>

        <button type="submit">Sell Product</button>
      </form>
    </div>
  );
};

export default Sell;

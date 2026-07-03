import { useState, useRef, useEffect } from 'react';
import './sell.css';
import { toast } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { api } from '../api';
import { addProduct } from '../redux/productSlice';

const Sell = () => {
  const [name, setName] = useState('');
  const dispatch = useDispatch();
  const [type, setType] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [collec, setcollec] = useState('Foods');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }

    const url = URL.createObjectURL(image);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    setImage(selected || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.trim().length < 3) {
      toast.warning('Name must be at least 3 characters.');
      return;
    }

    if (!price || Number(price) <= 0) {
      toast.warning('Price must be greater than 0.');
      return;
    }

    if (description.trim().length < 10) {
      toast.warning('Description must be at least 10 characters.');
      return;
    }

    if (!image) {
      toast.warning('Please select an image');
      return;
    }

    setLoading(true);

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

      if (response.data.success) {
        toast.success('Product added successfully!');
        dispatch(addProduct({
          category: response.data.product.collec,
          product: response.data.product,
        }));
        setName('');
        setType('');
        setPrice('');
        setDescription('');
        setImage(null);
        setcollec('Foods');
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sell-page">
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
          <input
            type="file"
            onChange={handleImageChange}
            ref={fileInputRef}
            required
          />

          {imagePreview && (
            <div className="image-preview">
              <img src={imagePreview} alt="Preview" />
            </div>
          )}

          <label>Collection:</label>
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

          <button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : 'Sell Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Sell;

import { useState, useRef, useEffect, useCallback } from 'react';
import './sell.css';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { addProduct, updateProduct, removeProduct } from '../redux/productSlice';
import ProductImage from './ProductImage';
import { productCardImageUrl } from '../utils/productCardPresentation';
import { CLASSIFICATION_TAXONOMY, classificationCategoryLabel, classificationTypeLabel, isValidProductClassification } from '../utils/productClassification';

const informationFields = [
  ['certification', 'Certification'], ['ingredients', 'Ingredients / materials'], ['packaging', 'Packaging'],
  ['reusable', 'Reuse / refill information'], ['recyclable', 'Recycling information'], ['evidenceNotes', 'Evidence source / notes'],
];

const Sell = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const userId = useSelector((state) => state.auth.userId);

  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [price, setPrice] = useState('');
  const [inventoryQuantity, setInventoryQuantity] = useState('0');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageMode, setImageMode] = useState('upload');
  const [collec, setcollec] = useState('Foods');
  const [productCategory, setProductCategory] = useState('');
  const [productType, setProductType] = useState('');
  const [packageQuantity, setPackageQuantity] = useState('');
  const [packageUnit, setPackageUnit] = useState('');
  const [productInformation, setProductInformation] = useState(Object.fromEntries(informationFields.map(([key]) => [key, ''])));
  const [loading, setLoading] = useState(false);
  const [userProducts, setUserProducts] = useState([]);
  const [editingProductId, setEditingProductId] = useState(null);
  const [sellerAccessReady, setSellerAccessReady] = useState(false);
  const fileInputRef = useRef(null);

  const isValidImageUrl = (value) => {
    if (!value || !value.trim()) return false;
    try {
      const parsed = new URL(value.trim());
      const pathname = parsed.pathname.toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp'];
      const hasDirectImageExtension = allowedExtensions.some((extension) => pathname.endsWith(extension));
      return ['http:', 'https:'].includes(parsed.protocol) && Boolean(parsed.hostname) && hasDirectImageExtension;
    } catch {
      return false;
    }
  };

  const fetchUserProducts = useCallback(async () => {
    if (!userId) {
      setUserProducts([]);
      return;
    }

    try {
      const response = await api.get('/products/my-products');
      setUserProducts(response.data.products || []);
    } catch (error) {
      console.error('Failed to fetch seller products:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  useEffect(() => {
    fetchUserProducts();
  }, [fetchUserProducts]);

  useEffect(() => {
    api.get('/seller/me').then(({ data }) => {
      if (data.profile?.status === 'approved') setSellerAccessReady(true);
      else navigate('/seller/apply', { replace: true });
    }).catch(() => navigate('/seller/apply', { replace: true }));
  }, [navigate]);

  useEffect(() => {
    const editProduct = location.state?.editProduct;
    if (editProduct) {
      fillFormForEdit(editProduct);
    }
  }, [location.state]);

  const handleImageChange = (e) => {
    const selected = e.target.files[0];
    setImage(selected || null);
    if (selected) {
      setImageUrl('');
      setImagePreview(null);
    }
  };

  const clearForm = () => {
    setName('');
    setType('');
    setPrice('');
    setInventoryQuantity('0');
    setDescription('');
    setImage(null);
    setImageUrl('');
    setcollec('Foods');
    setProductCategory('');
    setProductType('');
    setPackageQuantity('');
    setPackageUnit('');
    setProductInformation(Object.fromEntries(informationFields.map(([key]) => [key, ''])));
    setImagePreview(null);
    setImageMode('upload');
    setEditingProductId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const fillFormForEdit = (product) => {
    setEditingProductId(product._id);
    setName(product.name || '');
    setType(product.type || '');
    setPrice(String(product.price || ''));
    setInventoryQuantity(String(product.inventoryQuantity ?? 0));
    setDescription(product.description || '');
    setcollec(product.collec || 'Foods');
    setProductCategory(product.productCategory || '');
    setProductType(product.productType || '');
    setPackageQuantity(product.packageQuantity === null || product.packageQuantity === undefined ? '' : String(product.packageQuantity));
    setPackageUnit(product.packageUnit || '');
    setProductInformation(Object.fromEntries(informationFields.map(([key]) => [key, product[key] || ''])));

    const hasRemoteImage = typeof product.image === 'string' && product.image.startsWith('http');
    if (hasRemoteImage) {
      setImageMode('url');
      setImageUrl(product.image);
      setImage(null);
      setImagePreview(null);
    } else if (product.image) {
      setImageMode('upload');
      setImageUrl('');
      setImage(null);
      setImagePreview(`${api.defaults.baseURL}/uploads/${product.image}`);
    } else {
      setImageMode('upload');
      setImageUrl('');
      setImage(null);
      setImagePreview(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteProduct = async (productId, productCategory) => {
    if (!window.confirm('Remove this product from your listing?')) return;

    try {
      const response = await api.delete(`/products/${productId}`);
      if (response.data.success) {
        dispatch(removeProduct({ category: productCategory, productId }));
        setUserProducts((prev) => prev.filter((item) => item._id !== productId));
        if (editingProductId === productId) {
          clearForm();
        }
        toast.success('Product removed successfully.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to remove this product.');
    }
  };

  const shareProduct = async (product) => {
    if (!product) return;

    const url = `${window.location.origin}/collections/${product.collec?.toLowerCase?.() || 'foods'}?product=${product._id}`;
    const text = `${product.name} - ₹${product.price}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text,
          url,
        });
        return;
      }

      await navigator.clipboard.writeText(`${text} ${url}`);
      toast.success('Product link copied to clipboard.');
    } catch (error) {
      toast.error('Unable to share this product right now.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (name.trim().length < 3) {
      toast('Name must be at least 3 characters.');
      return;
    }

    if (!price || Number(price) <= 0) {
      toast('Price must be greater than 0.');
      return;
    }
    if (!Number.isInteger(Number(inventoryQuantity)) || Number(inventoryQuantity) < 0) { toast('Enter available stock as a whole number.'); return; }

    if (description.trim().length < 10) {
      toast('Description must be at least 10 characters.');
      return;
    }

    if (!isValidProductClassification(collec, productCategory, productType)) {
      toast('Choose a product type that belongs to the selected category.');
      return;
    }
    if ((packageQuantity || packageUnit) && (!Number.isFinite(Number(packageQuantity)) || Number(packageQuantity) <= 0 || !packageUnit)) {
      toast('Enter a positive package quantity and unit together, or leave both empty.');
      return;
    }

    const trimmedUrl = imageUrl.trim();
    const hasUpload = Boolean(image);
    const hasValidUrl = isValidImageUrl(trimmedUrl);

    if (!hasUpload && !hasValidUrl) {
      toast('Please upload an image or paste a valid image URL.');
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('type', type);
    formData.append('price', price);
    formData.append('inventoryQuantity', inventoryQuantity);
    formData.append('description', description);
    formData.append('collec', collec);
    formData.append('productCategory', productCategory);
    formData.append('productType', productType);
    formData.append('packageQuantity', packageQuantity);
    formData.append('packageUnit', packageUnit);
    Object.entries(productInformation).forEach(([key, value]) => formData.append(key, value));

    if (imageMode === 'url') {
      formData.append('imageUrl', trimmedUrl);
    } else if (image) {
      formData.append('image', image);
    }

    try {
      const endpoint = editingProductId ? `/products/${editingProductId}` : '/products/sell';
      const method = editingProductId ? 'put' : 'post';
      const response = await api({
        method,
        url: endpoint,
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        const updatedProduct = response.data.product;
        const category = updatedProduct.collec;

        if (editingProductId) {
          dispatch(updateProduct({ category, product: updatedProduct }));
          toast.success('Product updated successfully!');
        } else {
          dispatch(addProduct({
            category,
            product: updatedProduct,
          }));
          toast.success('Product added successfully!');
        }

        await fetchUserProducts();
        clearForm();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  if (!sellerAccessReady) return <main className="sell-page"><div className="sell-container"><p role="status">Checking seller approval...</p></div></main>;

  return (
    <div className="sell-page">
      <div className="sell-container">
        <div className="sell-header">
          <span className="sell-tag">Seller Dashboard</span>
          <h2>{editingProductId ? 'Edit Your Product' : 'Sell Your Product'}</h2>
        </div>

        <form onSubmit={handleSubmit} className="sell-form">
          <div className="field-row two-col">
            <div className="field-box">
              <label>Name (required)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Organic rice or a skincare set"
                required
              />
            </div>

            <div className="field-box">
              <label>Product type (required)</label>
              <select value={productType} disabled={!productCategory} required onChange={(e) => { setProductType(e.target.value); setType(classificationTypeLabel(e.target.value)); }}>
                <option value="">Choose a product type</option>
                {(CLASSIFICATION_TAXONOMY[collec]?.[productCategory] || []).map((value) => <option key={value} value={value}>{classificationTypeLabel(value)}</option>)}
              </select>
            </div>
          </div>

          <div className="field-row two-col">
            <div className="field-box">
              <label>Price (required)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price in rupees"
                required
              />
            </div>
            <div className="field-box"><label>Available stock (required)</label><input type="number" min="0" step="1" value={inventoryQuantity} onChange={(e) => setInventoryQuantity(e.target.value)} required /></div>

            <div className="field-box">
              <label>Collection (required)</label>
              <select
                value={collec}
                onChange={(e) => { setcollec(e.target.value); setProductCategory(''); setProductType(''); setType(''); }}
                required
              >
                <option value="Foods">Foods</option>
                <option value="Household">Household</option>
                <option value="PersonalCare">Personal Care</option>
                <option value="Lifestyle">Lifestyle</option>
              </select>
            </div>
          </div>

          <div className="field-row two-col">
            <div className="field-box"><label>Product category (required)</label><select value={productCategory} onChange={(e) => { setProductCategory(e.target.value); setProductType(''); setType(''); }} required><option value="">Choose a product category</option>{Object.keys(CLASSIFICATION_TAXONOMY[collec] || {}).map((value) => <option key={value} value={value}>{classificationCategoryLabel(value)}</option>)}</select></div>
            <div className="field-box"><label>Package quantity (optional)</label><input type="number" min="0.001" step="any" value={packageQuantity} onChange={(e) => setPackageQuantity(e.target.value)} placeholder="Actual quantity on package" /></div>
            <div className="field-box"><label>Package unit (optional)</label><select value={packageUnit} onChange={(e) => setPackageUnit(e.target.value)}><option value="">Not provided</option>{['g','kg','ml','l','piece','count'].map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
          </div>
          <fieldset className="field-box"><legend>Product information (optional)</legend>{informationFields.map(([key, label]) => <label key={key}>{label}<textarea maxLength="2000" value={productInformation[key]} onChange={(e) => setProductInformation((current) => ({ ...current, [key]: e.target.value }))} /></label>)}</fieldset>

          <div className="field-box">
            <label>Description (required)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the product, its use, and key details"
              required
            />
          </div>

          <div className="field-box">
            <label>Product image</label>
            <div className="image-source-toggle">
              <button
                type="button"
                className={imageMode === 'upload' ? 'source-option active' : 'source-option'}
                onClick={() => {
                  setImageMode('upload');
                  setImageUrl('');
                  setImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Upload from device
              </button>
              <button
                type="button"
                className={imageMode === 'url' ? 'source-option active' : 'source-option'}
                onClick={() => {
                  setImageMode('url');
                  setImage(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
              >
                Use image link
              </button>
            </div>

            {imageMode === 'upload' ? (
              <div className="upload-box">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  ref={fileInputRef}
                />
                <small className="image-url-hint">JPEG, PNG, WebP, GIF, AVIF, or BMP; maximum 5 MB. An image or direct image URL is required to publish.</small>
              </div>
            ) : (
              <div className="link-box">
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/product.jpg"
                  aria-label="Direct product image URL"
                />
                <small className="image-url-hint">
                  Use a direct image URL ending with .jpg, .jpeg, .png, .gif, .webp, .svg, .avif, or .bmp.
                </small>
              </div>
            )}
          </div>

          {(imagePreview || imageUrl) && (
            <div className="image-preview-card">
              <ProductImage src={imagePreview || imageUrl} alt="Product preview" frameClassName="product-image-frame--preview" />
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (editingProductId ? 'Updating...' : 'Uploading...') : (editingProductId ? 'Update Product' : 'Publish Product')}
          </button>

          {editingProductId && (
            <button type="button" className="cancel-edit-btn" onClick={clearForm}>
              Cancel edit
            </button>
          )}
        </form>

        {userId && (
          <div className="my-listings">
            <div className="listing-header-row">
              <h3>Your listings</h3>
              <span>{userProducts.length} item{userProducts.length === 1 ? '' : 's'}</span>
            </div>

            {userProducts.length === 0 ? (
              <div className="empty-listings">No products listed yet.</div>
            ) : (
              <div className="listing-grid">
                {userProducts.map((product) => (
                  <div key={product._id} className="listing-card">
                    <ProductImage src={productCardImageUrl(product.image, api.defaults.baseURL, product.sku)} alt={product.name} frameClassName="product-image-frame--legacy-listing" />
                    <div className="listing-info">
                      <h4>{product.name}</h4>
                      <p className="listing-meta">{product.collec}</p>
                      <p className="listing-price">₹{product.price}</p>
                    </div>
                    <div className="listing-actions">
                      <button type="button" onClick={() => fillFormForEdit(product)}>
                        Edit
                      </button>
                      <button type="button" className="danger" onClick={() => handleDeleteProduct(product._id, product.collec)}>
                        Delete
                      </button>
                      <button type="button" onClick={() => shareProduct(product)}>
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sell;

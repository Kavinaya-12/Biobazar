import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { searchProduct, clearSearch } from '../redux/productSlice';
import { FaSearch } from 'react-icons/fa';
import './searchbar.css';

const SearchBar = () => {
  const [searchText, setSearchText] = useState('');
  const dispatch = useDispatch();

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchText(val);
    if (!val.trim()) dispatch(clearSearch());
  };

  const handleSearch = () => {
    const query = searchText.trim();
    if (!query) return dispatch(clearSearch());
    dispatch(searchProduct(query));
  };

  const handleClear = () => {
    setSearchText('');
    dispatch(clearSearch());
  };

  return (
    <div className="search-container">
      <FaSearch className="search-icon" onClick={handleSearch} />
      <input
        type="text"
        className="search-input"
        placeholder="Search products..."
        value={searchText}
        onChange={handleInputChange}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      />
      {searchText && (
        <button className="clear-btn" onClick={handleClear}>
          ✕
        </button>
      )}
    </div>
  );
};

export default SearchBar;

import React, { useState } from 'react';

const AddProduct = ({ productContract, accounts, loadProducts, onBack }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    weight: '',
    price: '',
    itemsPerPack: '',
    transportMode: '0' // Defaulting to '0' for Refrigerated
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(''); // State for managing success notifications

  // Function to format labels dynamically based on the field name
  const formatLabel = (key) => {
    let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    if (key === 'weight') label += ' (grams)';
    if (key === 'price') label += ' (SAR)';
    return label;
  };

  // Function to handle changes and validation in input fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = null;

    // Validation for numeric fields to ensure they are positive
    if (['weight', 'price'].includes(name) && parseFloat(value) <= 0) {
      errorMsg = `${formatLabel(name)} must be positive.`;
    } else if (name === 'weight' && (parseInt(value, 10) < 1 || parseInt(value, 10) > 10000)) {
      errorMsg = 'Weight must be between 1 and 10,000 grams.';
    } else if (name === 'itemsPerPack' && (parseInt(value, 10) < 1 || parseInt(value, 10) > 500)) {
      errorMsg = 'Items per pack must be between 1 and 500.';
    } else if (name === 'name' && (value.length < 3 || value.length > 50)) {
      errorMsg = 'Name must be between 3 and 50 characters long.';
    }

    setErrors({ ...errors, [name]: errorMsg });
    setNewProduct(prev => ({ ...prev, [name]: value }));
  };

  // Function to validate description length on input
  const validateDescription = (e) => {
    const value = e.target.value;
    let errorMsg = value.length > 255 ? 'Description must be within 255 characters.' : null;
    setErrors({
      ...errors,
      description: errorMsg
    });
    setNewProduct(prev => ({ ...prev, description: value }));
  };

  const addProduct = async () => {
    if (Object.values(errors).some(error => error) || Object.values(newProduct).some(val => val.trim() === '')) {
      console.error("Invalid input: Fix errors before submitting.");
      return;
    }
  
    const { name, description, weight, price, itemsPerPack, transportMode } = newProduct;
    try {
      await productContract.methods.addProduct(
        name, description, parseInt(weight), parseInt(price), parseInt(itemsPerPack), parseInt(transportMode)
      ).send({ from: accounts[0], gas: 3000000 });
      setSuccessMessage('Product added successfully!');
      setTimeout(() => {
        loadProducts();
        setSuccessMessage(''); // Clear message
        onBack();
      }, 5000); // Wait 5 seconds before redirecting
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };
  

  // Function to handle going back
  const handleBack = () => {
    onBack();
  };

  const isFormValid = () => Object.values(newProduct).every(val => val.trim() !== '') && Object.values(errors).every(val => !val);

  return (
    <div>
      <h2>Add New Product</h2>
      <button onClick={handleBack}>Back to Dashboard</button>
      {Object.keys(newProduct).filter(key => key !== 'transportMode').map(key => (
        <div key={key}>
          <label>
            {formatLabel(key)}
          </label>
          {key === 'description' ? (
            <textarea
              name="description"
              placeholder="Description (1-255 characters)"
              value={newProduct.description}
              onChange={handleInputChange}
              onInput={validateDescription}
              style={{ borderColor: errors[key] ? 'red' : undefined, width: '99%' }}
            />
          ) : (
            <input
              type={key.includes('weight') || key === 'price' || key === 'itemsPerPack' ? 'number' : 'text'}
              name={key}
              placeholder={formatLabel(key)}
              value={newProduct[key]}
              onInput={handleInputChange}
              style={{ borderColor: errors[key] ? 'red' : undefined }}
            />
          )}
          <span style={{color: newProduct[key] ? 'transparent' : 'red'}}>*</span>
          <div style={{ color: errors[key] ? 'red' : 'grey', fontSize: '12px' }}>
            {errors[key] || (key === 'weight' ? '1-10,000 grams' : key === 'itemsPerPack' ? '1-500 items' : key === 'name' ? '3-50 characters' : '')}
          </div>
        </div>
      ))}
      <div>
        <label>
          Transport Mode
        </label>
        <select
          name="transportMode"
          value={newProduct.transportMode}
          onChange={handleInputChange}
        >
          <option value="0">Refrigerated</option>
          <option value="1">Frozen</option>
          <option value="2">Ambient</option>
        </select>
      </div>
      <button onClick={addProduct} disabled={!isFormValid()}>Add Product</button>
      <p><span style={{color: 'red'}}>*</span> indicates required field</p>
      {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
    </div>
  );
};

export default AddProduct;

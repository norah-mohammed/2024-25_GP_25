import React, { useState } from 'react';
import './AddProduct.css';
import './HeaderFooter.css'; // Header and Footer styling

const AddProduct = ({ productContract, accounts, loadProducts, onBack }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    weight: '',
    price: '',
    itemsPerPack: '',
    transportMode: '0', // Defaulting to '0' for Refrigerated
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(''); // Success message
  const [step, setStep] = useState(1); // State for current step

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

  // Handle Next Step
  const handleNext = () => {
    if (step === 1 && isStep1Valid()) {
      setStep(2);
    } else if (step === 2) {
      addProduct();
    }
  };

  // Handle Back Step
  const handleBack = () => {
    setStep(1);
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

  const isStep1Valid = () => {
    return (
      newProduct.name &&
      newProduct.description &&
      !errors.name &&
      !errors.description
    );
  };

  const isFormValid = () => Object.values(newProduct).every(val => val.trim() !== '') && Object.values(errors).every(val => !val);

  return (
    <div className="add-product-form">
      <h2>Add New Product</h2>
      <button onClick={handleBack}>Back to Dashboard</button>

      {/* Step Tracker */}
      <div className="step-tracker">
        <div className={`step ${step === 1 ? 'active' : ''}`}>1. Basic Product Information</div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>2. Product Specifications</div>
      </div>

      {/* Basic Product Info Section */}
      {step === 1 && (
        <div className="basic-product-info">
          {['name', 'description'].map(key => (
            <div key={key}>
              <label>{formatLabel(key)}</label>
              {key === 'description' ? (
                <textarea
                  name="description"
                  placeholder="Description (1-255 characters)"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  onInput={validateDescription}
                  style={{ borderColor: errors[key] ? 'red' : undefined }}
                />
              ) : (
                <input
                  type="text"
                  name={key}
                  placeholder={formatLabel(key)}
                  value={newProduct[key]}
                  onChange={handleInputChange}
                  style={{ borderColor: errors[key] ? 'red' : undefined }}
                />
              )}
              <div style={{ color: errors[key] ? 'red' : 'grey', fontSize: '12px' }}>
                {errors[key] || (key === 'weight' ? '1-10,000 grams' : key === 'itemsPerPack' ? '1-500 items' : key === 'name' ? '3-50 characters' : '')}
              </div>
            </div>
          ))}
          <button onClick={handleNext} disabled={!isStep1Valid()}>Next</button>
        </div>
      )}

      {/* Product Specifications Section */}
      {step === 2 && (
        <div className="product-specifications">
          {['weight', 'price', 'itemsPerPack'].map(key => (
            <div key={key}>
              <label>{formatLabel(key)}</label>
              <input
                type="number"
                name={key}
                placeholder={formatLabel(key)}
                value={newProduct[key]}
                onChange={handleInputChange}
                style={{ borderColor: errors[key] ? 'red' : undefined }}
              />
              <div style={{ color: errors[key] ? 'red' : 'grey', fontSize: '12px' }}>
                {errors[key]}
              </div>
            </div>
          ))}
          <div>
            <label>Transport Mode</label>
            <select name="transportMode" value={newProduct.transportMode} onChange={handleInputChange}>
              <option value="0">Refrigerated</option>
              <option value="1">Frozen</option>
              <option value="2">Ambient</option>
            </select>
          </div>
          <button onClick={addProduct} disabled={!isFormValid()}>Add Product</button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
    </div>
  );
};

export default AddProduct;

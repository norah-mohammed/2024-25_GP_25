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
  const [productAdded, setProductAdded] = useState(false); // Track product addition status

  const formatLabel = (key) => {
    let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
    if (key === 'weight') label += ' (grams)';
    if (key === 'price') label += ' (SAR)';
    return label;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = null;

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
    setNewProduct((prev) => ({ ...prev, [name]: value }));
  };

  const validateDescription = (e) => {
    const value = e.target.value;
    let errorMsg = value.length > 255 ? 'Description must be within 255 characters.' : null;
    setErrors({ ...errors, description: errorMsg });
    setNewProduct((prev) => ({ ...prev, description: value }));
  };

  const handleNext = () => {
    if (step === 1 && isStep1Valid()) {
      setStep(2);
    } else if (step === 2) {
      addProduct();
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const addProduct = async () => {
    if (
      Object.values(errors).some((error) => error) ||
      Object.values(newProduct).some((val) => val.trim() === '')
    ) {
      console.error('Invalid input: Fix errors before submitting.');
      return;
    }

    const { name, description, weight, price, itemsPerPack, transportMode } = newProduct;
    try {
      await productContract.methods
        .addProduct(
          name,
          description,
          parseInt(weight),
          parseInt(price),
          parseInt(itemsPerPack),
          parseInt(transportMode)
        )
        .send({ from: accounts[0], gas: 3000000 });

      setSuccessMessage('Product added successfully!');
      setProductAdded(true); // Mark the product as added
      setTimeout(() => {
        loadProducts();
        setSuccessMessage(''); // Clear message
        onBack();
      }, 2000);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const isStep1Valid = () => {
    return newProduct.name && newProduct.description && !errors.name && !errors.description;
  };

  const isFormValid = () =>
    Object.values(newProduct).every((val) => val.trim() !== '') &&
    Object.values(errors).every((val) => !val);

  return (
    <div className="add-product-form">
      <h2>Add New Product</h2>
      <button onClick={handleBack}>Back to Dashboard</button>

      <div className="step-tracker">
        <div className={`step ${step === 1 ? 'active' : ''}`}>1. Basic Product Information</div>
        <div className={`step ${step === 2 ? 'active' : ''}`}>2. Product Specifications</div>
      </div>

      {step === 1 && (
        <div className="basic-product-info">
          {['name', 'description'].map((key) => (
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
                {errors[key] || (key === 'name' ? '3-50 characters' : '')}
              </div>
            </div>
          ))}
          <button onClick={handleNext} disabled={!isStep1Valid()}>
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="product-specifications">
          {['weight', 'price', 'itemsPerPack'].map((key) => (
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
          <button onClick={addProduct} disabled={!isFormValid() || productAdded}>
            {productAdded ? 'Product Added' : 'Add Product'}
          </button>
        </div>
      )}

      {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
    </div>
  );
};

export default AddProduct;

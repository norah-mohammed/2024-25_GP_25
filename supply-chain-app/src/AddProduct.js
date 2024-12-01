import React, { useState, useEffect } from 'react';
import './AddProduct.css';
import './HeaderFooter.css'; // Header and Footer styling
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';


const AddProduct = ({ productContract, accounts, loadProducts, onBack, setCurrentPage, currentPage }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    weight: '',
    price: '',
    itemsPerPack: '',
    transportMode: '0', // Defaulting to '0' for Refrigerated
  });

  useEffect(() => {
    // Set the current page to "AddProduct" when this component mounts
    if (setCurrentPage) {
      setCurrentPage('AddProduct');
    }
  }, [setCurrentPage]);

  const [errors, setErrors] = useState({});
  const [formErrorMessage, setFormErrorMessage] = useState(''); // General form error message
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
    setFormErrorMessage(''); // Clear general error message on input change
  };
  const validateDescription = (e) => {
    const value = e.target.value;
  
    // Check if the length exceeds 255 characters
    let errorMsg = null;
    if (value.length > 255) {
      errorMsg = 'Description must be within 255 characters.';
    } else if (!value.trim()) {
      errorMsg = 'Description is required.';
    }
  
    // Update the errors state with the validation result
    setErrors({ ...errors, description: errorMsg });
  
    // Update the description field in the newProduct state
    setNewProduct((prev) => ({ ...prev, description: value }));
  };
  

  const handleNext = () => {
    const newErrors = {
      ...errors,
      name: newProduct.name ? null : 'Name is required.',
      description: newProduct.description ? null : 'Description is required.',
    };
  
    setErrors(newErrors);
  
    if (!newProduct.name || !newProduct.description) {
      setFormErrorMessage('Please fix the errors above before proceeding.');
      return;
    }
  
    if (step === 1) {
      setStep(2);
    }
  };
  

  const handleBack = () => {
    onBack();
  };

  const addProduct = async () => {
    if (
      Object.values(errors).some((error) => error) ||
      Object.values(newProduct).some((val) => val.trim() === '')
    ) {
      setFormErrorMessage('Please fill out all fields correctly before submitting.');
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
        onBack();const validateDescription = (e) => {
  const value = e.target.value;

  // Check if the length exceeds 255 characters
  let errorMsg = null;
  if (value.length > 255) {
    errorMsg = 'Description must be within 255 characters.';
  } else if (!value.trim()) {
    errorMsg = 'Description is required.';
  }

  // Update the errors state with the validation result
  setErrors({ ...errors, description: errorMsg });

  // Update the description field in the newProduct state
  setNewProduct((prev) => ({ ...prev, description: value }));
};

      }, 2000);
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const isStep1Valid = () => {
    const isNameValid = newProduct.name && !errors.name;
    const isDescriptionValid = newProduct.description && !errors.description;
    return isNameValid && isDescriptionValid;
  };
  

  const isFormValid = () =>
    Object.values(newProduct).every((val) => val.trim() !== '') &&
    Object.values(errors).every((val) => !val);

  return (

    <div className="add-product-container">
<div className="breadcrumb">
  <a
    href="#Dashboard"
    onClick={() => setCurrentPage('nonUserPage')}
    className={`breadcrumb-link ${currentPage === 'nonuserpage' ? 'active' : ''}`}
  >
    Home
  </a>
  &gt;
  <a
    href="#products"
    onClick={() => setCurrentPage('products')}
    className={`breadcrumb-link ${currentPage === 'products' ? 'active' : ''}`}
  >
    Products
  </a>
  &gt;
  <span className="breadcrumb-link current-page">Add Product</span>
</div>    {/* Breadcrumb */}
      <button className="back-button" onClick={handleBack}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </button>

      {/* Page Title */}
      <h2>Add New Product</h2>

      {/* Form */}
      <div className="add-product-form">
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
                    placeholder="Enter description here"
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
                  {errors[key] || (key === 'name' ? '3-50 characters' : '1-255 characters')}
                </div>
              </div>
            ))}
            <button onClick={handleNext} disabled={!isStep1Valid()}>
              Next
            </button>
            {formErrorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{formErrorMessage}</div>}
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
      {errors[key] || (key === 'weight' 
        ? 'Enter a weight between 1 and 10,000 grams.' 
        : key === 'itemsPerPack' 
        ? 'Enter items per pack between 1 and 500.' 
        : '')
      }
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
            {formErrorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{formErrorMessage}</div>}
          </div>
        )}

        {successMessage && <div style={{ color: 'green', marginTop: '10px' }}>{successMessage}</div>}
      </div>
    </div>
  );
};

export default AddProduct;

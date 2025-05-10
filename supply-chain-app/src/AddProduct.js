import React, { useState, useEffect } from 'react';
import './AddProduct.css';
import './HeaderFooter.css'; // Header and Footer styling
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';


const AddProduct = ({ productContract, accounts, loadProducts, onBack, setCurrentPage, currentPage }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    weight: '',
    price: '',
    itemsPerPack: '',
    transportMode: '0',
    minOrderQuantity: '',
    maxOrderQuantity: '',
  });

  useEffect(() => {
    if (setCurrentPage) {
      setCurrentPage('AddProduct');
    }
  }, [setCurrentPage]);

  const [errors, setErrors] = useState({});
  const [formErrorMessage, setFormErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [step, setStep] = useState(1);
  const [productAdded, setProductAdded] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);


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
    } else if (name === 'minOrderQuantity' && parseInt(value, 10) < 1) {
      errorMsg = 'Minimum order quantity must be at least 1.';
    } else if (name === 'maxOrderQuantity' && parseInt(value, 10) < 1) {
      errorMsg = 'Maximum order quantity must be at least 1.';
    } else if (name === 'maxOrderQuantity' && parseInt(value, 10) <= parseInt(newProduct.minOrderQuantity || '0')) {
      errorMsg = 'Maximum must be greater than minimum.';
    } else if (name === 'name' && (value.length < 3 || value.length > 50)) {
      errorMsg = 'Name must be between 3 and 50 characters long.';
    }
  
    setErrors({ ...errors, [name]: errorMsg });
    setNewProduct((prev) => ({ ...prev, [name]: value }));
    setFormErrorMessage('');
  };
  

  const validateDescription = (e) => {
    const value = e.target.value;
    let errorMsg = null;
    if (value.length > 255) {
      errorMsg = 'Description must be within 255 characters.';
    } else if (!value.trim()) {
      errorMsg = 'Description is required.';
    }
    setErrors({ ...errors, description: errorMsg });
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

    try {await productContract.methods
      .addProduct({
        name: newProduct.name,
        description: newProduct.description,
        details: {
          weight: parseInt(newProduct.weight),
          price: parseInt(newProduct.price),
          itemsPerPack: parseInt(newProduct.itemsPerPack),
          transportMode: parseInt(newProduct.transportMode),
          minOrderQuantity: parseInt(newProduct.minOrderQuantity),
          maxOrderQuantity: parseInt(newProduct.maxOrderQuantity),
        },
      })
      .send({ from: accounts[0], gas: 3000000 });
    
    

      setProductAdded(true);
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        loadProducts();
        onBack();
      }, 2500);
      
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };
  const getHelperText = (key) => {
    switch (key) {
      case 'weight':
        return 'Weight must be between 1 and 10,000 grams.';
      case 'price':
        return 'Price must be positive.';
      case 'itemsPerPack':
        return 'Items per pack must be between 1 and 500.';
      case 'minOrderQuantity':
        return 'Minimum order quantity must be at least 1.';
      case 'maxOrderQuantity':
        return 'Maximum order quantity must be greater than minimum.';
      default:
        return '';
    }
  };
  

  const isStep1Valid = () => {
    const isNameValid = newProduct.name && !errors.name;
    const isDescriptionValid = newProduct.description && !errors.description;
    return isNameValid && isDescriptionValid;
  };
  const isFormValid = () =>
    Object.entries(newProduct).every(([key, val]) => {
      if (typeof val === 'string') {
        return val.trim() !== '';
      }
      return val !== '';
    }) && Object.values(errors).every((val) => !val);
  
  return (
    <div className="add-product-container">
      <div className="page-header">
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
      </div>

      <button className="back-button" onClick={handleBack}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </button>
      </div>
      <h2>Add New Product</h2>

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
      {errors[key] || (key === 'name'
        ? '3-50 characters'
        : key === 'description'
        ? '1-255 characters'
        : '')
      }
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
<div className="form-row">
  {['weight', 'price'].map((key) => (
    <div className="form-group" key={key}>
      <label>{formatLabel(key)}</label>
      <input
        type="number"
        name={key}
        placeholder={`Enter ${formatLabel(key)}`}
        value={newProduct[key]}
        onChange={handleInputChange}
        style={{ borderColor: errors[key] ? 'red' : undefined }}
      />
      <div style={{ fontSize: '12px', color: errors[key] ? 'red' : 'grey' }}>
        {errors[key] || getHelperText(key)}
      </div>
    </div>
  ))}
</div>

<div className="form-row">
  <div className="form-group">
    <label>Minimum Order Quantity</label>
    <input
      type="number"
      name="minOrderQuantity"
      placeholder="Minimum Order Quantity"
      value={newProduct.minOrderQuantity}
      onChange={handleInputChange}
      style={{ borderColor: errors.minOrderQuantity ? 'red' : undefined }}
    />
    <div style={{ fontSize: '12px', color: errors.minOrderQuantity ? 'red' : 'grey' }}>
      {errors.minOrderQuantity || getHelperText('minOrderQuantity')}
    </div>
  </div>

  <div className="form-group">
    <label>Maximum Order Quantity</label>
    <input
      type="number"
      name="maxOrderQuantity"
      placeholder="Maximum Order Quantity"
      value={newProduct.maxOrderQuantity}
      onChange={handleInputChange}
      style={{ borderColor: errors.maxOrderQuantity ? 'red' : undefined }}
    />
    <div style={{ fontSize: '12px', color: errors.maxOrderQuantity ? 'red' : 'grey' }}>
      {errors.maxOrderQuantity || getHelperText('maxOrderQuantity')}
    </div>
  </div>
</div>

<div className="form-row">
  <div className="form-group">
    <label>Items Per Pack</label>
    <input
      type="number"
      name="itemsPerPack"
      placeholder="Enter Items Per Pack"
      value={newProduct.itemsPerPack}
      onChange={handleInputChange}
      style={{ borderColor: errors.itemsPerPack ? 'red' : undefined }}
    />
    <div style={{ fontSize: '12px', color: errors.itemsPerPack ? 'red' : 'grey' }}>
      {errors.itemsPerPack || getHelperText('itemsPerPack')}
    </div>
  </div>

  <div className="form-group">
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
</div>





            <button onClick={addProduct} disabled={!isFormValid() || productAdded}>
              {productAdded ? 'Product Added' : 'Add Product'}
            </button>

            {formErrorMessage && <div style={{ color: 'red', marginTop: '10px' }}>{formErrorMessage}</div>}
          </div>
        )}

{showSuccessModal && (
  <div className="modal-overlay">
    <div className="modal-content">
    <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
    <h2>Thank you!</h2>
      <p>Your product has been added successfully.</p>
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default AddProduct;

import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';
import RoleContract from './contracts/RoleContract.json';
import './PlaceOrder.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';


const PlaceOrder = ({ productId, manufacturerAddress, goBack }) => {
  const [form, setForm] = useState({
    quantity: '',
    deliveryDate: '',
    deliveryTime: 'AM',
  });
  const [accounts, setAccounts] = useState([]);
  const [orderInstance, setOrderInstance] = useState(null);
  const [productPrice, setProductPrice] = useState(0);
  const [shippingAddress, setShippingAddress] = useState('');
  const [productInfo, setProductInfo] = useState({});
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        const userAccounts = await web3Instance.eth.getAccounts();
        setAccounts(userAccounts);
        const networkId = await web3Instance.eth.net.getId();

        const orderContract = new web3Instance.eth.Contract(
          OrderContract.abi,
          OrderContract.networks[networkId]?.address
        );
        const productContract = new web3Instance.eth.Contract(
          ProductContract.abi,
          ProductContract.networks[networkId]?.address
        );
        const roleContract = new web3Instance.eth.Contract(
          RoleContract.abi,
          RoleContract.networks[networkId]?.address
        );

        setOrderInstance(orderContract);
      

        const productDetails = await productContract.methods
        .getProductById(productId)
        .call();
      
      setProductInfo({
        id: Number(productDetails.productId) || 'N/A',
        name: productDetails.name || 'N/A',
        description: productDetails.description || 'N/A',
        weight: Number(productDetails.details.weight) || 'N/A',
        price: Number(productDetails.details.price) || 0,
        itemsPerPack: Number(productDetails.details.itemsPerPack) || 'N/A',
        status: productDetails.status || 'N/A',
        transportMode: getTransportMode(productDetails.details.transportMode),
        minOrderQuantity: Number(productDetails.details.minOrderQuantity) || 1,
        maxOrderQuantity: Number(productDetails.details.maxOrderQuantity) || 1000,
      });
      
        setProductPrice(Number(productDetails.price) || 0);

        const retailerDetails = await roleContract.methods.getRetailer().call();
        setShippingAddress(retailerDetails.physicalAddress);
      } catch (error) {
        console.error('Error initializing web3 or contracts:', error);
      }
    };
    init();
  }, [productId]);

  const getTransportMode = (mode) => {
    switch (Number(mode)) {
      case 0:
        return 'Refrigerated';
      case 1:
        return 'Frozen';
      case 2:
        return 'Ambient';
      default:
        return 'Unknown';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = null;

    if (name === 'quantity') {
      const quantity = parseInt(value, 10);
      if (value === '' || quantity < productInfo.minOrderQuantity) {
        errorMsg = `Quantity must be at least ${productInfo.minOrderQuantity}.`;
      } else if (quantity > productInfo.maxOrderQuantity) {
        errorMsg = `Quantity must not exceed ${productInfo.maxOrderQuantity}.`;
      }
    }
    
    if (name === 'deliveryDate') {
      const chosenDate = new Date(value);
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      if (value === '' || chosenDate < new Date(today)) {
        errorMsg = 'The delivery date cannot be in the past.';
      } else if (chosenDate > nextYear) {
        errorMsg = 'The delivery date must be within one year from today.';
      }
    }

    setErrors({ ...errors, [name]: errorMsg });
    setForm({ ...form, [name]: value });
    setNotification(''); // Clear notifications on input change
  };

  const placeOrder = async () => {
    if (
      Object.values(errors).some((error) => error) ||
      Object.values(form).some((value) => value === '')
    ) {
      console.error('Invalid input: Fix errors before submitting.');
      setNotification('Please correct the highlighted errors before submitting.');
      return;
    }

    const { quantity, deliveryDate, deliveryTime } = form;
    try {
      const defaultTemperature = 0;
await orderInstance.methods
  .createOrder(
    productId,
    parseInt(quantity, 10),
    manufacturerAddress,
    deliveryDate,
    deliveryTime,
    shippingAddress,
    productPrice,
    defaultTemperature
  )
  .send({ from: accounts[0], gas: 3000000 });


  setOrderPlaced(true);
  setShowSuccessModal(true);
  setTimeout(() => {
    setShowSuccessModal(false);
    goBack();
  }, 2500);
  
    } catch (error) {
      console.error('Error placing order:', error);
      setNotification('Failed to place the order. Please try again.');
    } finally {
    }
  };

  const isFormValid = () =>
    Object.values(form).every((val) => val.trim() !== '') &&
    Object.values(errors).every((val) => !val);

  return (
    <div className="place-order-container">
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => console.log('Home')}>Home</span>
        &nbsp;&gt;&nbsp;
        <span
          className="breadcrumb-link"
          onClick={() => console.log('View Manufacturers')}
        >View Manufacturers</span>
        &nbsp;&gt;&nbsp;
        <span className="breadcrumb-link" onClick={goBack}>Manufacturer Products</span>
        &nbsp;&gt;&nbsp;
        <span className="breadcrumb-current">Place Order</span>
      </div>

      <div className="back-title-container">
        <button onClick={goBack} className="back-button">&#8592; Back</button>
      </div>

      <div className="place-order-form">
        <div className="product-info">
          <h2>Product Information</h2>
          <p><strong>ID:</strong> {productInfo.id}</p>
          <p><strong>Name:</strong> {productInfo.name}</p>
          <p><strong>Description:</strong> {productInfo.description}</p>
          <p><strong>Weight:</strong> {productInfo.weight} g</p>
          <p><strong>Price:</strong> {productInfo.price} SAR</p>
          <p><strong>Items per Pack:</strong> {productInfo.itemsPerPack}</p>
          <p><strong>Transport Mode:</strong> {productInfo.transportMode}</p>
        </div>

        <div className="order-form">
          <h2>Place Order</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              placeOrder();
            }}
          >
            <div>
              <label>Quantity:</label>
<input
  type="number"
  name="quantity"
  value={form.quantity}
  onChange={handleInputChange}
  min={productInfo.minOrderQuantity}
  max={productInfo.maxOrderQuantity}
  style={{ borderColor: errors.quantity ? 'red' : undefined }}
/>

<small className={errors.quantity ? 'error' : ''}>
  {errors.quantity || `Enter a quantity between ${productInfo.minOrderQuantity} and ${productInfo.maxOrderQuantity}.`}
</small>

            </div>

            <div>
              <label>Delivery Date:</label>
              <input
                type="date"
                name="deliveryDate"
                value={form.deliveryDate}
                onChange={handleInputChange}
                min={today}
                style={{ borderColor: errors.deliveryDate ? 'red' : undefined }}
              />
              <small className={errors.deliveryDate ? 'error' : ''}>
                {errors.deliveryDate || 'Select a valid delivery date.'}
              </small>
            </div>

            <div>
              <label>Delivery Slot:</label>
              <select
                name="deliveryTime"
                value={form.deliveryTime}
                onChange={handleInputChange}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            <button type="submit" disabled={!isFormValid() || orderPlaced}>
              {orderPlaced ? 'Order Placed' : 'Place Order'}
            </button>
          </form>
        </div>
      </div>
      {showSuccessModal && (
  <div className="modal-overlay">
    <div className="modal-content">
      <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
      <h2>Thank you!</h2>
      <p>Your order has been placed successfully.</p>
    </div>
  </div>
)}

    </div>
  );
};

export default PlaceOrder;

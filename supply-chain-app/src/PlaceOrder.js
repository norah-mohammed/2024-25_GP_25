<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';
import RoleContract from './contracts/RoleContract.json';
import './PlaceOrder.css';

const PlaceOrder = ({ productId, manufacturerAddress, goBack }) => {
  const [form, setForm] = useState({
    quantity: '',
    deliveryDate: '',
    deliveryTime: 'AM',
  });
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [orderInstance, setOrderInstance] = useState(null);
  const [productInstance, setProductInstance] = useState(null);
  const [roleInstance, setRoleInstance] = useState(null);
  const [productPrice, setProductPrice] = useState(0);
  const [shippingAddress, setShippingAddress] = useState('');
  const [productInfo, setProductInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);
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
        setProductInstance(productContract);
        setRoleInstance(roleContract);

        const productDetails = await productContract.methods
          .getProductById(productId)
          .call();
        setProductInfo({
          id: Number(productDetails.productId) || 'N/A',
          name: productDetails.name || 'N/A',
          description: productDetails.description || 'N/A',
          weight: Number(productDetails.weight) || 'N/A',
          price: Number(productDetails.price) || 'N/A',
          itemsPerPack: Number(productDetails.itemsPerPack) || 'N/A',
          status: productDetails.status || 'N/A',
          transportMode: getTransportMode(productDetails.transportMode),
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = null;

    if (name === 'quantity') {
      if (value === '' || parseInt(value, 10) < 1) {
        errorMsg = 'The quantity cannot be less than 1.';
      } else if (parseInt(value, 10) > 64) {
        errorMsg = 'The quantity cannot exceed 64.';
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
  };

  const placeOrder = async () => {
    if (
      Object.values(errors).some((error) => error) ||
      Object.values(form).some((value) => value === '')
    ) {
      console.error('Invalid input: Fix errors before submitting.');
      return;
    }
    if (!orderInstance || !productInstance || !roleInstance) {
      console.error('Contract instances not initialized');
      return;
    }
    try {
      setLoading(true);
      await orderInstance.methods
        .createOrder(
          productId,
          parseInt(form.quantity, 10),
          manufacturerAddress,
          form.deliveryDate,
          form.deliveryTime,
          shippingAddress,
          productPrice
        )
        .send({ from: accounts[0] });

      setNotification('Order placed successfully!');
      setOrderPlaced(true);

      setTimeout(() => {
        setNotification('');
        goBack();
      }, 2000);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      Object.values(errors).every((error) => !error) &&
      Object.values(form).every((value) => value !== '') &&
      !loading &&
      !orderPlaced
    );
  };

  return (
    <div className="place-order-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => console.log('Home')}>
          Home
        </span>
        &nbsp;&gt;&nbsp;
        <span
          className="breadcrumb-link"
          onClick={() => console.log('View Manufacturers')}
        >
          View Manufacturers
        </span>
        &nbsp;&gt;&nbsp;
        <span className="breadcrumb-link" onClick={goBack}>
          Manufacturer Products
        </span>
        &nbsp;&gt;&nbsp;
        <span className="breadcrumb-current">Place Order</span>
      </div>

      {/* Back Button */}
      <div className="back-title-container">
        <button onClick={goBack} className="back-button">
          &#8592; Back
        </button>
      </div>

      <div className="place-order-form">
        {/* Product Information */}
        <div className="product-info">
          <h2>Product Information</h2>
          <p>
            <strong>ID:</strong> {productInfo.id}
          </p>
          <p>
            <strong>Name:</strong> {productInfo.name}
          </p>
          <p>
            <strong>Description:</strong> {productInfo.description}
          </p>
          <p>
            <strong>Weight:</strong> {productInfo.weight} kg
          </p>
          <p>
            <strong>Price:</strong> {productInfo.price} SAR
          </p>
          <p>
            <strong>Items per Pack:</strong> {productInfo.itemsPerPack}
          </p>
          <p>
            <strong>Transport Mode:</strong> {productInfo.transportMode}
          </p>
        </div>

        {/* Order Form */}
        <div className="order-form">
          <h2>Place Order</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              placeOrder();
            }}
          >
            <div>
              <label>
                Quantity: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="1"
                max="64"
                style={{ borderColor: errors.quantity ? 'red' : undefined }}
              />
              <small className={errors.quantity ? 'error' : ''}>
                {errors.quantity || 'Enter a quantity between 1 and 64.'}
              </small>
            </div>

            <div>
              <label>
                Delivery Date: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                name="deliveryDate"
                value={form.deliveryDate}
                onChange={handleChange}
                min={today}
                style={{ borderColor: errors.deliveryDate ? 'red' : undefined }}
              />
              <small className={errors.deliveryDate ? 'error' : ''}>
                {errors.deliveryDate || 'Select a valid delivery date.'}
              </small>
            </div>

            <div>
              <label>Delivery Time:</label>
              <select
                name="deliveryTime"
                value={form.deliveryTime}
                onChange={handleChange}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            <button type="submit" disabled={!isFormValid()}>
              {orderPlaced ? 'Order Placed' : loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
          {notification && <div className="notification">{notification}</div>}
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
=======
import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';
import RoleContract from './contracts/RoleContract.json';
import './PlaceOrder.css';

const PlaceOrder = ({ productId, manufacturerAddress, goBack }) => {
  const [form, setForm] = useState({
    quantity: '',
    deliveryDate: '',
    deliveryTime: 'AM',
  });
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [orderInstance, setOrderInstance] = useState(null);
  const [productInstance, setProductInstance] = useState(null);
  const [roleInstance, setRoleInstance] = useState(null);
  const [productPrice, setProductPrice] = useState(0);
  const [shippingAddress, setShippingAddress] = useState('');
  const [productInfo, setProductInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);
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
        setProductInstance(productContract);
        setRoleInstance(roleContract);

        const productDetails = await productContract.methods
          .getProductById(productId)
          .call();
        setProductInfo({
          id: Number(productDetails.productId) || 'N/A',
          name: productDetails.name || 'N/A',
          description: productDetails.description || 'N/A',
          weight: Number(productDetails.weight) || 'N/A',
          price: Number(productDetails.price) || 'N/A',
          itemsPerPack: Number(productDetails.itemsPerPack) || 'N/A',
          status: productDetails.status || 'N/A',
          transportMode: getTransportMode(productDetails.transportMode),
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    let errorMsg = null;

    if (name === 'quantity') {
      if (value === '' || parseInt(value, 10) < 1) {
        errorMsg = 'The quantity cannot be less than 1.';
      } else if (parseInt(value, 10) > 64) {
        errorMsg = 'The quantity cannot exceed 64.';
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
  };

  const placeOrder = async () => {
    if (
      Object.values(errors).some((error) => error) ||
      Object.values(form).some((value) => value === '')
    ) {
      console.error('Invalid input: Fix errors before submitting.');
      return;
    }
    if (!orderInstance || !productInstance || !roleInstance) {
      console.error('Contract instances not initialized');
      return;
    }
    try {
      setLoading(true);
      await orderInstance.methods
        .createOrder(
          productId,
          parseInt(form.quantity, 10),
          manufacturerAddress,
          form.deliveryDate,
          form.deliveryTime,
          shippingAddress,
          productPrice
        )
        .send({ from: accounts[0] });

      setNotification('Order placed successfully!');
      setOrderPlaced(true);

      setTimeout(() => {
        setNotification('');
        goBack();
      }, 2000);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      Object.values(errors).every((error) => !error) &&
      Object.values(form).every((value) => value !== '') &&
      !loading &&
      !orderPlaced
    );
  };

  return (
    <div className="place-order-container">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span className="breadcrumb-link" onClick={() => console.log('Home')}>
          Home
        </span>
        &nbsp;&gt;&nbsp;
        <span
          className="breadcrumb-link"
          onClick={() => console.log('View Manufacturers')}
        >
          View Manufacturers
        </span>
        &nbsp;&gt;&nbsp;
        <span className="breadcrumb-link" onClick={goBack}>
          Manufacturer Products
        </span>
        &nbsp;&gt;&nbsp;
        <span className="breadcrumb-current">Place Order</span>
      </div>

      {/* Back Button */}
      <div className="back-title-container">
        <button onClick={goBack} className="back-button">
          &#8592; Back
        </button>
      </div>

      <div className="place-order-form">
        {/* Product Information */}
        <div className="product-info">
          <h2>Product Information</h2>
          <p>
            <strong>ID:</strong> {productInfo.id}
          </p>
          <p>
            <strong>Name:</strong> {productInfo.name}
          </p>
          <p>
            <strong>Description:</strong> {productInfo.description}
          </p>
          <p>
            <strong>Weight:</strong> {productInfo.weight} kg
          </p>
          <p>
            <strong>Price:</strong> {productInfo.price} SAR
          </p>
          <p>
            <strong>Items per Pack:</strong> {productInfo.itemsPerPack}
          </p>
          <p>
            <strong>Transport Mode:</strong> {productInfo.transportMode}
          </p>
        </div>

        {/* Order Form */}
        <div className="order-form">
          <h2>Place Order</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              placeOrder();
            }}
          >
            <div>
              <label>
                Quantity: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="1"
                max="64"
                style={{ borderColor: errors.quantity ? 'red' : undefined }}
              />
              <small className={errors.quantity ? 'error' : ''}>
                {errors.quantity || 'Enter a quantity between 1 and 64.'}
              </small>
            </div>

            <div>
              <label>
                Delivery Date: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="date"
                name="deliveryDate"
                value={form.deliveryDate}
                onChange={handleChange}
                min={today}
                style={{ borderColor: errors.deliveryDate ? 'red' : undefined }}
              />
              <small className={errors.deliveryDate ? 'error' : ''}>
                {errors.deliveryDate || 'Select a valid delivery date.'}
              </small>
            </div>

            <div>
              <label>Delivery Time:</label>
              <select
                name="deliveryTime"
                value={form.deliveryTime}
                onChange={handleChange}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>

            <button type="submit" disabled={!isFormValid()}>
              {orderPlaced ? 'Order Placed' : loading ? 'Placing Order...' : 'Place Order'}
            </button>
          </form>
          {notification && <div className="notification">{notification}</div>}
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240

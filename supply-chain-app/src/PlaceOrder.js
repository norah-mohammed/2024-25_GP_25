import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';
import RoleContract from './contracts/RoleContract.json';

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
  const [shippingAddress, setShippingAddress] = useState(''); // Used internally only
  const [productInfo, setProductInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState('');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const init = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);
        const userAccounts = await web3Instance.eth.getAccounts();
        setAccounts(userAccounts);
        const networkId = await web3Instance.eth.net.getId();

        const orderContract = new web3Instance.eth.Contract(OrderContract.abi, OrderContract.networks[networkId]?.address);
        const productContract = new web3Instance.eth.Contract(ProductContract.abi, ProductContract.networks[networkId]?.address);
        const roleContract = new web3Instance.eth.Contract(RoleContract.abi, RoleContract.networks[networkId]?.address);

        setOrderInstance(orderContract);
        setProductInstance(productContract);
        setRoleInstance(roleContract);

        // Fetch product details and store them in state
        const productDetails = await productContract.methods.getProductById(productId).call();
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

        // Fetch the retailer's shipping address for internal use only
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

    if (name === 'quantity' && (parseInt(value, 10) < 1 || parseInt(value, 10) > 64)) {
      errorMsg = 'Quantity must be between 1 and 64.';
    }
    if (name === 'deliveryDate') {
      const chosenDate = new Date(value);
      const nextYear = new Date(today);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      if (chosenDate < new Date(today) || chosenDate > nextYear) {
        errorMsg = 'Delivery date must be within the next year and from today onwards.';
      }
    }

    setErrors({ ...errors, [name]: errorMsg });
    setForm({ ...form, [name]: value });
  };

  const placeOrder = async () => {
    if (Object.values(errors).some((error) => error)) {
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
          shippingAddress, // Use shipping address internally here
          productPrice
        )
        .send({ from: accounts[0] });

      setNotification('Order placed successfully!');
      setTimeout(() => {
        setNotification('');
        goBack(); // Transition back after success message
      }, 5000);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Product Information</h2>
      <div style={{ marginBottom: '20px' }}>
        <p><strong>ID:</strong> {productInfo.id}</p>
        <p><strong>Name:</strong> {productInfo.name}</p>
        <p><strong>Description:</strong> {productInfo.description}</p>
        <p><strong>Weight:</strong> {productInfo.weight} kg</p>
        <p><strong>Price:</strong> {productInfo.price} SAR</p>
        <p><strong>Items per Pack:</strong> {productInfo.itemsPerPack}</p>        <p><strong>Transport Mode:</strong> {productInfo.transportMode}</p>
      </div>

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
      onChange={handleChange}
      disabled={loading}
      min="1"
      max="64"
      style={{ borderColor: errors.quantity ? 'red' : undefined }}
    />
    {form.quantity === '' && <span style={{ color: 'red', marginLeft: '5px' }}>*</span>}
    {errors.quantity && <div style={{ color: 'red' }}>{errors.quantity}</div>}
    <div style={{ color: 'grey' }}>Quantity should be between 1 and 64.</div>
  </div>

  <div>
    <label>Delivery Date:</label>
    <input
      type="date"
      name="deliveryDate"
      value={form.deliveryDate}
      onChange={handleChange}
      disabled={loading}
      min={today}
      style={{ borderColor: errors.deliveryDate ? 'red' : undefined }}
    />
    {form.deliveryDate === '' && <span style={{ color: 'red', marginLeft: '5px' }}>*</span>}
    {errors.deliveryDate && <div style={{ color: 'red' }}>{errors.deliveryDate}</div>}
    <div style={{ color: 'grey' }}>Date should be in the future and within the next year.</div>
  </div>

  <div>
    <label>Delivery Time:</label>
    <select
      name="deliveryTime"
      value={form.deliveryTime}
      onChange={handleChange}
      disabled={loading}
    >
      <option value="AM">AM</option>
      <option value="PM">PM</option>
    </select>
  </div>

  <button
    type="submit"
    disabled={
      loading ||
      !form.quantity ||
      !form.deliveryDate ||
      !form.deliveryTime ||
      Object.keys(errors).some((k) => errors[k])
    }
  >
    {loading ? 'Placing Order...' : 'Place Order'}
  </button>
</form>

      {notification && <div style={{ color: 'green', marginTop: '10px' }}>{notification}</div>}
      <button onClick={goBack} disabled={loading}>
        Go Back
      </button>
    </div>
  );
};

export default PlaceOrder;

import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';
import './RetailerHomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen, faBell, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';


const RetailerHomePage = () => {
  const [web3, setWeb3] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [productContract, setProductContract] = useState(null);
  const [account, setAccount] = useState('');
  const [retailer, setRetailer] = useState({});
  const [orders, setOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [notification, setNotification] = useState('');
  const [invalidTempOrders, setInvalidTempOrders] = useState([]);
  const [rejectedOrders, setRejectedOrders] = useState([]);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);

  const [acknowledgedOrders, setAcknowledgedOrders] = useState([]);
  const [acknowledgedLoaded, setAcknowledgedLoaded] = useState(false);
    const [invalidTempNotifications, setInvalidTempNotifications] = useState([]); 
    const [notifications, setNotifications] = useState([]);
const [rejectedOrderNotifications, setRejectedOrderNotifications] = useState([]);

    const [dismissedNotifications, setDismissedNotifications] = useState(() => {
      const saved = localStorage.getItem('dismissedNotifications');
      return saved ? JSON.parse(saved) : [];
    });
    
    
  

  // Step 1: Load acknowledged orders from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('acknowledgedOrders');
    if (stored) {
      setAcknowledgedOrders(JSON.parse(stored));
    }
    setAcknowledgedLoaded(true);
  }, []);

  // Step 2: Initialize Web3 and contracts only
  useEffect(() => {
    const init = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();

        const instanceRole = new web3.eth.Contract(RoleContract.abi, RoleContract.networks[networkId]?.address);
        const instanceOrder = new web3.eth.Contract(OrderContract.abi, OrderContract.networks[networkId]?.address);
        const instanceProduct = new web3.eth.Contract(ProductContract.abi, ProductContract.networks[networkId]?.address);

        setWeb3(web3);
        setAccount(accounts[0]);
        setRoleContract(instanceRole);
        setOrderContract(instanceOrder);
        setProductContract(instanceProduct);

      } catch (error) {
        console.error('Error loading web3 or contracts:', error);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const handler = () => {
      if (orderContract && productContract) {
        fetchAndCheckOrders(orderContract, productContract);
      }
    };
  
    window.addEventListener("refreshRetailerOrders", handler);
    return () => window.removeEventListener("refreshRetailerOrders", handler);
  }, [orderContract, productContract]);
  


  useEffect(() => {
    if (roleContract && account) {
      fetchRetailerDetails();
    }
    if (orderContract && account && productContract) {
      fetchOrders();
    }
  }, [roleContract, orderContract, productContract, account]);

  useEffect(() => {
    if (!orderContract || !productContract) return;
  
    const interval = setInterval(() => {
      fetchAndCheckOrders(orderContract, productContract);
    }, 10000); // every 10 seconds
  
    return () => clearInterval(interval);
  }, [orderContract, productContract]);
  


  const handleRemoveNotification = (index) => {
    setNotifications((prev) => {
      const removedNotification = prev[index];
      const updated = prev.filter((_, i) => i !== index);
  
      const updatedDismissed = [...dismissedNotifications, removedNotification];
      setDismissedNotifications(updatedDismissed);
      localStorage.setItem('dismissedNotifications', JSON.stringify(updatedDismissed));
  
      return updated;
    });
  };
  
  

  const handleRemoveInvalidNotification = (index) => {
    const removed = invalidTempNotifications[index];
    const updated = invalidTempNotifications.filter((_, i) => i !== index);
    setInvalidTempNotifications(updated);
    const dismissed = JSON.parse(localStorage.getItem('dismissedInvalidTemp') || '[]');
    localStorage.setItem('dismissedInvalidTemp', JSON.stringify([...dismissed, removed]));
  };
  
  const handleRemoveRejectedNotification = (index) => {
    const removed = rejectedOrderNotifications[index];
    const updated = rejectedOrderNotifications.filter((_, i) => i !== index);
    setRejectedOrderNotifications(updated);
    const dismissed = JSON.parse(localStorage.getItem('dismissedRejected') || '[]');
    localStorage.setItem('dismissedRejected', JSON.stringify([...dismissed, removed]));
  };
  
  

  const fetchRetailerDetails = async () => {
    setLoading(true);
    try {
      const details = await roleContract.methods.getRetailer(account).call();
      setRetailer({
        name: details.name,
        address: details.physicalAddress,
        email: details.email,
        phone: details.phoneNumber,
      });
    } catch (error) {
      console.error('Error fetching retailer details:', error);
      setErrorMessage('Failed to fetch retailer details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersList = await orderContract.methods.getAllOrders().call();
      const awaitingPaymentOrders = [];
      const delivered = [];
      const invalidTemps = [];
      const rejected = [];
  
      for (const order of ordersList) {
        const product = await productContract.methods.getProductById(order.productId).call();
        const processedOrder = {
          ...order,
          orderId: parseInt(order.orderId),
          productId: parseInt(order.productId),
          quantity: parseInt(order.quantity),
          productName: product.name,
          totalPrice: Number(order.quantity) * Number(product.details.price), // <-- FIXED
          deliveryInfo: order.deliveryInfo,
          temperature: order.temperature !== null ? parseInt(order.temperature, 10) : null,
          minTemp: parseInt(product.minTemp, 10),
          maxTemp: parseInt(product.maxTemp, 10),
        };
  
        // Check for invalid temp
        if (
          ['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status) &&
          processedOrder.temperature !== null &&
          (processedOrder.temperature < processedOrder.minTemp || processedOrder.temperature > processedOrder.maxTemp) &&
          !acknowledgedOrders.includes(processedOrder.orderId.toString())
        ) {
          invalidTemps.push(processedOrder);
        }
  
        // Check for rejected orders
        if (
          order.status === 'Rejected due to Unsafe Temperature' &&
          !acknowledgedOrders.includes(processedOrder.orderId.toString())
        ) {
          rejected.push(processedOrder);
        }
  
        // Categorize
        if (order.status === 'Waiting for payment') {
          awaitingPaymentOrders.push(processedOrder);
        } else if (order.status === 'Delivered to Retailer') {
          delivered.push(processedOrder);
        }
      }
  
      setOrders(awaitingPaymentOrders);
      setDeliveredOrders(delivered);
      setInvalidTempOrders(invalidTemps);
      setRejectedOrders(rejected);
  
    } catch (error) {
      console.error('Error fetching orders:', error);
      setErrorMessage('Failed to fetch orders.');
    } finally {
      setLoading(false);
    }
  };
  

  const checkTemperatureViolations = (ordersToCheck) => {
    const invalidNotifications = ordersToCheck
      .filter(
        (order) =>
          ['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status) &&
          order.temperature !== null
      )
      .filter(
        (order) =>
          order.temperature < order.minTemp || order.temperature > order.maxTemp
      )
      .map((order) => ({
        message: `🚨 Order ${order.orderId}: Temperature (${order.temperature}°C) is out of range (${order.minTemp}°C to ${order.maxTemp}°C).`,
        type: "error",
      }));
  
    setInvalidTempNotifications(invalidNotifications);
  
    if (invalidNotifications.length > 0) {
      const dismissed = localStorage.getItem('dismissedNotifications');
      const dismissedList = dismissed ? JSON.parse(dismissed) : [];

  
      invalidNotifications.forEach(n => {
        const dismissed = localStorage.getItem('dismissedInvalidTemp') || '[]';
        const dismissedList = JSON.parse(dismissed);
        
        invalidNotifications.forEach(n => {
          if (!dismissedList.includes(n.message)) {
            setInvalidTempNotifications(prev => [...prev, n.message]);
          }
        });
        
      });
    }
    
  };

  const getSeenRejectedOrderIds = () => {
    const stored = localStorage.getItem('seenRejectedOrders');
    return stored ? JSON.parse(stored) : [];
  };
  const markOrderAsSeen = (orderId) => {
    const seen = getSeenRejectedOrderIds();
    if (!seen.includes(orderId)) {
      const updated = [...seen, orderId];
      localStorage.setItem('seenRejectedOrders', JSON.stringify(updated));
    }
  };
  
  const fetchAndCheckOrders = async (orderInstance, productInstance) => {
    try {
      const ordersList = await orderInstance.methods.getAllOrders().call();
      const ordersWithProducts = await Promise.all(
        ordersList.map(async (order) => {
          const product = await productInstance.methods.getProductById(order.productId).call();
          return {
            ...order,
            orderId: order.orderId.toString(),
            productId: order.productId.toString(),
            quantity: order.quantity.toString(),
            productName: product.name,
            minTemp: parseInt(product.minTemp, 10),
            maxTemp: parseInt(product.maxTemp, 10),
            temperature: order.temperature !== null ? parseInt(order.temperature, 10) : null,
            status: order.status,
          };
        })
      );
  
      // ✅ Check for temperature violations first
      checkTemperatureViolations(ordersWithProducts);
      // ✅ Then handle rejected notifications
const dismissed = localStorage.getItem('dismissedRejected') || '[]';
const dismissedList = JSON.parse(dismissed);

ordersWithProducts.forEach(order => {
  if (order.status === "Rejected due to Unsafe Temperature") {
    const seenRejected = getSeenRejectedOrderIds();
    if (!seenRejected.includes(order.orderId)) {
      const message = `❌ Order ${order.orderId} was rejected due to unsafe temperature (Detected: ${order.temperature}°C, Allowed: ${order.minTemp}°C–${order.maxTemp}°C).`;
      if (!dismissedList.includes(message)) {
        setRejectedOrderNotifications((prev) => [...prev, message]);
      }
      markOrderAsSeen(order.orderId);
    }
  }
});

  
 
  
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };
  

  

  

  const openRejectPopup = (orderId) => {
    setSelectedOrderId(orderId);
    setShowRejectPopup(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      alert('Please enter a reason.');
      return;
    }
    try {
      await orderContract.methods.rejectOrderWithReason(selectedOrderId, rejectReason).send({ from: account });
      setShowRejectPopup(false);
      setRejectReason('');
      setSelectedOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, newStatus).send({ from: account });
      setNotification(`Order ${orderId} status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;

  return (
    <div className="container">
      <div style={{ position: 'fixed', top: '20px', right: '30px', zIndex: 1000 }}>
  <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowNotificationPopup(!showNotificationPopup)}>
    <FontAwesomeIcon icon={faBell} size="2x" />
    {notifications.length > 0 && (
      <span style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '12px',
        height: '12px',
        backgroundColor: 'red',
        borderRadius: '50%',
        border: '2px solid white'
      }}></span>
    )}
  </div>
</div>


      {/* Retailer Info */}
      <div className="retailer-info">
        <h2>{retailer.name}</h2>
        <p><strong>Address:</strong> {retailer.address}</p>
        <p><strong>Phone:</strong> {retailer.phone}</p>
        <p><strong>Email:</strong> {retailer.email}</p>
      </div>



{showNotificationPopup && (
  <div style={{
    position: 'fixed',
    top: '60px',
    right: '30px',
    width: '300px',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '10px',
    boxShadow: '0px 2px 10px rgba(0,0,0,0.2)',
    zIndex: 1000,
    padding: '10px',
  }}>
    <h4 style={{ marginBottom: '10px' }}>Notifications</h4>
    {notifications.length === 0 ? (
      <p>No new notifications</p>
    ) : (
      notifications.map((note, index) => (
        <div key={index} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          background: '#f9f9f9',
          padding: '6px 10px',
          borderRadius: '6px'
        }}>
          <span>{note}</span>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: 'red',
            cursor: 'pointer',
            fontSize: '16px'
          }} onClick={() => handleRemoveNotification(index)}>×</button>
        </div>
      ))
    )}
  </div>
)}


      {/* Orders Awaiting Payment */}
      <h2>Orders Awaiting Payment</h2>
      {notification && <div className="notification">{notification}</div>}
      <div className="orders-section">
        {orders.length > 0 ? (
          orders.map(order => (
            <div className="order-card" key={order.orderId}>
              <p><strong>Total Price:</strong> {order.totalPrice} SAR</p>
              <p><strong>Order ID:</strong> {order.orderId}</p>
              <p><strong>Product Name:</strong> {order.productName}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p><strong>Delivery Date:</strong> {order.deliveryInfo?.deliveryDate}</p>
              <p><strong>Delivery Time:</strong> {order.deliveryInfo?.deliveryTime}</p>

              <div className="actions">
                <button onClick={() => updateOrderStatus(order.orderId, 'Paid')}>Pay</button>
                <button onClick={() => updateOrderStatus(order.orderId, 'Canceled')}>Cancel</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-orders-message">
            No orders awaiting payment at the moment. <FontAwesomeIcon icon={faBoxOpen} />
          </p>
        )}
      </div>

      {/* Delivered Orders */}
      <h2>Delivered Orders</h2>
      <div className="orders-section">
        {deliveredOrders.length > 0 ? (
          deliveredOrders.map(order => (
            <div className="order-card" key={order.orderId}>
              <p><strong>Order ID:</strong> {order.orderId}</p>
              <p><strong>Product ID:</strong> {order.productId}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p><strong>Delivery Date:</strong> {order.deliveryInfo?.deliveryDate}</p>
              <p><strong>Delivery Time:</strong> {order.deliveryInfo?.deliveryTime}</p>

              <div className="actions">
                <button onClick={() => updateOrderStatus(order.orderId, 'Completed')}>Accept</button>
                <button onClick={() => openRejectPopup(order.orderId)}>Reject</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-orders-message">
            No delivered orders at the moment. <FontAwesomeIcon icon={faBoxOpen} />
          </p>
        )}
      </div>

      {/* Reject Reason Popup */}
      {showRejectPopup && (
  <div className="popup-overlay">
    <div className="rejection-popup">
    <div className="rejection-icon-wrapper">
  <FontAwesomeIcon icon={faCircleInfo} className="rejection-icon" />
</div>
<h3>Enter Rejection Reason</h3>

      <textarea
        value={rejectReason}
        onChange={(e) => {
          if (e.target.value.length <= 200) setRejectReason(e.target.value);
        }}
        placeholder="Enter reason for rejection... (max 200 characters)"
      />
      {rejectReason.trim() === '' && (
        <div className="error">Rejection reason is required.</div>
      )}
      <div className="popup-buttons">
        <button className="confirm" onClick={handleRejectConfirm} disabled={rejectReason.trim() === ''}>
          Confirm
        </button>
        <button className="cancel" onClick={() => setShowRejectPopup(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}
{showNotificationPopup && (
  <div style={{
    position: 'fixed',
    top: '60px',
    right: '30px',
    width: '300px',
    backgroundColor: 'white',
    border: '1px solid #ccc',
    borderRadius: '10px',
    boxShadow: '0px 2px 10px rgba(0,0,0,0.2)',
    zIndex: 1000,
    padding: '10px',
  }}>
    <h4 style={{ marginBottom: '10px' }}>Notifications</h4>
    {notifications.length === 0 ? (
      <p>No new notifications</p>
    ) : (
      notifications.map((note, index) => (
        <div key={index} style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
          background: '#f9f9f9',
          padding: '6px 10px',
          borderRadius: '6px'
        }}>
          <span>{note}</span>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: 'red',
            cursor: 'pointer',
            fontSize: '16px'
          }} onClick={() => handleRemoveNotification(index)}>×</button>
        </div>
      ))
    )}
  </div>
)}



    </div>
  );
};

export default RetailerHomePage;

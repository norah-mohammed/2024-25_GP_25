import React, { useEffect, useState, useCallback } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';
import './DistributorHomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';
import { faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { faBell } from "@fortawesome/free-solid-svg-icons";
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';




const DistributorHomePage = () => {
  const [distributorInfo, setDistributorInfo] = useState(null);
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [productContract, setProductContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [notification, setNotification] = useState('');
  const [invalidTempNotifications, setInvalidTempNotifications] = useState([]); 
  const [showRejectPopup, setShowRejectPopup] = useState(false);
const [rejectReason, setRejectReason] = useState('');
const [selectedOrderId, setSelectedOrderId] = useState(null);
const [notifications, setNotifications] = useState([]);
const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [products, setProducts] = useState({}); // Store products by productId


  

  // Initialize web3 and contracts
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);

        const networkId = await web3Instance.eth.net.getId();

        const roleDeployedNetwork = RoleContract.networks[networkId];
        const roleInstance = new web3Instance.eth.Contract(
          RoleContract.abi,
          roleDeployedNetwork && roleDeployedNetwork.address
        );
        setRoleContract(roleInstance);

        const orderDeployedNetwork = OrderContract.networks[networkId];
        const orderInstance = new web3Instance.eth.Contract(
          OrderContract.abi,
          orderDeployedNetwork && orderDeployedNetwork.address
        );
        setOrderContract(orderInstance);

        const productDeployedNetwork = ProductContract.networks[networkId];
        const productInstance = new web3Instance.eth.Contract(
          ProductContract.abi,
          productDeployedNetwork && productDeployedNetwork.address
        );
        setProductContract(productInstance);

        fetchDistributorInfo(roleInstance, accounts[0]);
        fetchDeliveryRequests(orderInstance, accounts[0], roleInstance, productInstance);
      } catch (error) {
        console.error('Error initializing Web3 or contracts:', error);
      }
    };

    initWeb3();
  }, []);
  
      useEffect(() => {
          const fetchOrdersAndCheckTemps = async () => {
            if (orderContract && productContract) {
              await fetchAndCheckOrders(orderContract, productContract);
            }
          };
        
          fetchOrdersAndCheckTemps();
        }, [orderContract, productContract]); // Fetch and check after contracts are initialized
        
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

        useEffect(() => {
          const handleOrderRejected = (event) => {
            const { orderId, temperature, minTemp, maxTemp } = event.detail;
            const message = `❌ Order ${orderId} was rejected due to unsafe temperature (Detected: ${temperature}°C, Allowed: ${minTemp}°C–${maxTemp}°C).`;
        
            setNotifications((prev) => {
              if (!prev.includes(message)) {
                return [...prev, message];
              }
              return prev;
            });
          };
        
          window.addEventListener("orderRejectedNotification", handleOrderRejected);
        
          return () => {
            window.removeEventListener("orderRejectedNotification", handleOrderRejected);
          };
        }, []);
        
        useEffect(() => {
          const stored = localStorage.getItem('queuedDistributorNotifications');
          if (stored) {
            const messages = JSON.parse(stored);
            if (messages.length > 0) {
setNotifications(prev => [...prev, ...messages.filter(m => !prev.includes(m))]);
              localStorage.removeItem('queuedDistributorNotifications'); // clear after showing
            }
          }
        }, []);
        

  const fetchDistributorInfo = async (contract, account) => {
    try {
      setLoadingInfo(true);
      const distributor = await contract.methods.getDistributor(account).call();
      setDistributorInfo(distributor);
    } catch (error) {
      console.error('Error fetching distributor info:', error);
    } finally {
      setLoadingInfo(false);
    }
  };

  const transportModeMapping = {
    0: 'Refrigerated',
    1: 'Frozen',
    2: 'Ambient',
  };

  const fetchDeliveryRequests = useCallback(async (orderContract, account, roleContract, productContract) => {
    try {
      setLoadingRequests(true);
      const requests = await orderContract.methods.getOrdersByDistributor(account).call();
      const dispatchedOrders = requests.filter(order => order.status === 'Dispatched');

      const enrichedOrders = await Promise.all(
        dispatchedOrders.map(async (order) => {
          const manufacturer = await roleContract.methods.getManufacturer(order.manufacturer).call();
          const product = await productContract.methods.getProductById(order.productId).call();

          return {
            ...order,
            manufacturerName: manufacturer.name || 'Unknown Manufacturer',
            transportMode: transportModeMapping[parseInt(product.details?.transportMode)] || 'Unknown',         
            weight: parseInt(product.details?.weight) || 0,   
            temperatureRange: `${product.minTemp}°C - ${product.maxTemp}°C`,
          };
        })
      );

      setDeliveryRequests(enrichedOrders);
    } catch (error) {
      console.error('Error fetching delivery requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const handleNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
  };

  const handleAcceptRequest = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'Accepted by Distributor').send({ from: account });
      handleNotification(`Order ${orderId} has been accepted.`);
      fetchDeliveryRequests(orderContract, account, roleContract, productContract);
    } catch (error) {
      console.error('Error accepting delivery request:', error);
    }
  };

  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    const saved = localStorage.getItem('dismissedNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  
  const handleRemoveNotification = (index) => {
    setNotifications((prev) => {
      const removedNotification = prev[index];
      const updated = prev.filter((_, i) => i !== index);
  
      // Save the removed notification to localStorage
      const updatedDismissed = [...dismissedNotifications, removedNotification];
      setDismissedNotifications(updatedDismissed);
      localStorage.setItem('dismissedNotifications', JSON.stringify(updatedDismissed));
  
      return updated;
    });
  };
  

  const handleRejectRequest = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'Rejected by Distributor').send({ from: account });
      setNotifications(prev => [...prev, `Order ${orderId} has been rejected.`]);
      fetchDeliveryRequests(orderContract, account, roleContract, productContract);
    } catch (error) {
      console.error('Error rejecting delivery request:', error);
    }
  };
  
  const openRejectPopup = (orderId) => {
    setSelectedOrderId(orderId);
    setShowRejectPopup(true);
  };
  
  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) {
      alert("Please enter a reason.");
      return;
    }
  
    try {
      await orderContract.methods.rejectOrderWithReason(selectedOrderId, rejectReason).send({ from: account });
  
      handleNotification(`Order ${selectedOrderId} has been rejected.`); 
  
      setShowRejectPopup(false);
      setRejectReason('');
      setSelectedOrderId(null);
      fetchDeliveryRequests(orderContract, account, roleContract, productContract);
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };
  

  const checkTemperatureViolations = (ordersToCheck) => {
    const dismissed = JSON.parse(localStorage.getItem('dismissedNotifications') || '[]');
    const seenEmailOrders = JSON.parse(localStorage.getItem('emailSentForOrders') || '[]');
    const seenRejected = JSON.parse(localStorage.getItem('seenRejectedOrders') || '[]');
  
    ordersToCheck.forEach(order => {
      const temp = order.temperature;
      const orderId = order.orderId;
      const isTempInvalid = temp !== null && (temp < order.minTemp || temp > order.maxTemp);
      const isRejectedStatus = order.status === "Rejected due to Unsafe Temperature";
  
      // ✅ 1. Show invalid temp notification
      if (
        ['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status) &&
        isTempInvalid
      ) {
        const tempMessage = `🚨 Order ${orderId}: Temperature (${temp}°C) is out of range (${order.minTemp}°C to ${order.maxTemp}°C).`;
  
        if (!notifications.includes(tempMessage) && !dismissed.includes(tempMessage)) {
          setNotifications(prev => [...prev, tempMessage]);
        }
  
        // ✅ 2. Send email ONCE for invalid temp
        if (!seenEmailOrders.includes(orderId)) {
          fetch("http://localhost:5000/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              orderId: Number(orderId),
              temperature: temp,
              minTemp: order.minTemp,
              maxTemp: order.maxTemp,
              status: order.status,
            }),
          }).then(() => {
            localStorage.setItem(
              'emailSentForOrders',
              JSON.stringify([...seenEmailOrders, orderId])
            );
          }).catch(console.error);
        }
      }
  
      // ✅ 3. Show rejection notification if status is already rejected
      if (isRejectedStatus && !seenRejected.includes(orderId)) {
        const rejectMessage = `❌ Order ${orderId} was rejected due to unsafe temperature (Detected: ${temp}°C, Allowed: ${order.minTemp}°C–${order.maxTemp}°C).`;
  
        if (!notifications.includes(rejectMessage) && !dismissed.includes(rejectMessage)) {
          setNotifications(prev => [...prev, rejectMessage]);
        }
  
        localStorage.setItem(
          'seenRejectedOrders',
          JSON.stringify([...seenRejected, orderId])
        );
      }
    });
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
  
      // Check normal temperature violations (for non-rejected orders)
      checkTemperatureViolations(ordersWithProducts);
  
      const dismissed = localStorage.getItem('dismissedNotifications');
      const dismissedList = dismissed ? JSON.parse(dismissed) : [];
  
      ordersWithProducts.forEach(order => {
        if (order.status === "Rejected due to Unsafe Temperature") {
          const seenRejected = getSeenRejectedOrderIds();
          if (!seenRejected.includes(order.orderId)) {
            const combinedMessage = `❌ Order ${order.orderId} was rejected due to unsafe temperature (Detected: ${order.temperature}°C, Allowed: ${order.minTemp}°C–${order.maxTemp}°C).`;
  
            if (!dismissedList.includes(combinedMessage)) {
              setNotifications(prev => {
                if (!prev.includes(combinedMessage)) {
                  return [...prev, combinedMessage];
                }
                return prev;
              });
            }
  
            markOrderAsSeen(order.orderId);
          }
        }
      });
  
    } catch (error) {
      console.error("Error fetching orders for temperature check:", error);
    }
  };
  


  return (
    <div className="container">
       {/* 🔔 Notification Bell */}
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
      {/* Distributor Info Section */}
      <div className="distributor-info">
        {loadingInfo ? (
          <p>Loading distributor info...</p>
        ) : distributorInfo ? (
          <>
            <h2>{distributorInfo.name}</h2>
            <p><strong>Address:</strong> {distributorInfo.physicalAddress}</p>
            <p><strong>Phone:</strong> {distributorInfo.phoneNumber}</p>
            <p><strong>Email:</strong> {distributorInfo.email}</p>
          </>
        ) : (
          <p>Distributor info not available.</p>
        )}
      </div>


      {/* Delivery Requests Section */}
      <h2>Delivery Requests</h2>
      {notification && <div className="notification">{notification}</div>}
      <div className="orders-section">
        {loadingRequests ? (
          <p>Loading delivery requests...</p>
        ) : deliveryRequests.length > 0 ? (
          deliveryRequests.map((order, index) => (
            <div className="order-card" key={index}>
              <p><strong>Order ID:</strong> {parseInt(order.orderId)}</p>
              <p><strong>Quantity:</strong> {parseInt(order.quantity)}</p>
              <p><strong>Weight (g):</strong> {parseInt(order.weight)}</p>
              <p><strong>Delivery Time:</strong> {order.deliveryInfo.deliveryTime}</p>
              <p><strong>Delivery Date:</strong> {order.deliveryInfo.deliveryDate}</p>
              <p><strong>Day:</strong> {new Date(order.deliveryInfo.deliveryDate).toLocaleDateString('en-SA', { weekday: 'long' })}</p>
              <p><strong>Delivery Address:</strong> {order.deliveryInfo.shippingAddress}</p>
              <p><strong>Manufacturer:</strong> {order.manufacturerName}</p>
              <p><strong>Transport Mode:</strong> {order.transportMode}</p>
              <p><strong>Temperature Range:</strong> {order.temperatureRange}</p>
              <div className="actions">
  <button className="btn-accept" onClick={() => handleAcceptRequest(order.orderId)}>Accept</button>
  <button className="btn-reject" onClick={() => openRejectPopup(order.orderId)}>Reject</button>
</div>
            </div>
          ))
        ) : (
         <p className="no-orders-message">
          No delivery requests available at the moment.<FontAwesomeIcon icon={faBoxOpen} />
          </p>
        )}
      </div>
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

export default DistributorHomePage;

import React, { useEffect, useState } from "react";
import getWeb3 from "./web3";
import RoleContract from "./contracts/RoleContract.json";
import OrderContract from "./contracts/OrderContract.json";
import ProductContract from "./contracts/ProductContract.json";
import "./ManufacturerHomePage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { faCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';

const ManufacturerHomePage = () => {
  const [roleContract, setRoleContract] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [productContract, setProductContract] = useState(null);
  const [account, setAccount] = useState("");
  const [manufacturer, setManufacturer] = useState({});
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [showRejectPopup, setShowRejectPopup] = useState(false);
const [rejectReason, setRejectReason] = useState('');
const [selectedOrderId, setSelectedOrderId] = useState(null);
const [invalidTempOrders, setInvalidTempOrders] = useState([]);
const [rejectedOrders, setRejectedOrders] = useState([]);
const [showNotificationPopup, setShowNotificationPopup] = useState(false);





  useEffect(() => {
    const init = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();

        const instanceRole = new web3.eth.Contract(
          RoleContract.abi,
          RoleContract.networks[networkId]?.address
        );
        const instanceOrder = new web3.eth.Contract(
          OrderContract.abi,
          OrderContract.networks[networkId]?.address
        );
        const instanceProduct = new web3.eth.Contract(
          ProductContract.abi,
          ProductContract.networks[networkId]?.address
        );

        setAccount(accounts[0]);
        setRoleContract(instanceRole);
        setOrderContract(instanceOrder);
        setProductContract(instanceProduct);

        // Fetch orders and check temperature violations
        await fetchAndCheckOrders(instanceOrder, instanceProduct);
      } catch (error) {
        console.error("Error loading web3 or contracts:", error);
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (roleContract && account) {
      fetchManufacturerDetails();
    }
    if (orderContract && account && productContract) {
      fetchOrders();
    }
  }, [roleContract, orderContract, productContract, account]);

  const fetchManufacturerDetails = async () => {
    setLoading(true);
    try {
      const details = await roleContract.methods.getManufacturer(account).call();
      setManufacturer({
        ethAddress: details.ethAddress,
        name: details.name,
        addressLine: details.addressLine,
        phoneNumber: details.phoneNumber,
        email: details.email,
      });
    } catch (error) {
      console.error("Error fetching manufacturer details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersList = await orderContract.methods.getOrdersByManufacturer(account).call();
      const filteredOrders = ordersList.filter((order) => order.status === "Waiting for manufacturer acceptance");

      const ordersWithProducts = await Promise.all(
        filteredOrders.map(async (order) => {
          const product = await productContract.methods.getProductById(order.productId).call();
          return {
            ...order,
            productId: order.productId.toString(),
            orderId: order.orderId.toString(),
            quantity: order.quantity.toString(),
            productName: product.name,
            productDescription: product.description,
            transportMode: product.transportMode,
            deliveryDate: order.deliveryInfo.deliveryDate,
            deliveryTime: order.deliveryInfo.deliveryTime,
            shippingAddress: order.deliveryInfo.shippingAddress,
          };
        })
      );

      setOrders(ordersWithProducts);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setErrorMessage("Failed to fetch orders. Please try again later.");
    } finally {
      setLoading(false);
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
  
      const invalidTemps = ordersWithProducts.filter(order =>
        ['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status) &&
        order.temperature !== null &&
        order.temperature !== 0 &&
        (order.temperature < order.minTemp || order.temperature > order.maxTemp) &&
        !isOrderDeleted(order.orderId) // Ignore deleted
      );
  
      const rejected = ordersWithProducts.filter(order =>
        order.status === "Rejected due to Unsafe Temperature" &&
        !isOrderDeleted(order.orderId) // Ignore deleted
      );
  
      setInvalidTempOrders(invalidTemps);
      setRejectedOrders(rejected);
    } catch (error) {
      console.error("Error fetching orders for temperature check:", error);
    }
  };
  
  

  

  useEffect(() => {
    if (notificationQueue.length > 0) {
      const timeout = setTimeout(() => {
        setNotificationQueue((prevQueue) => prevQueue.slice(1)); // Remove first notification after 5 seconds
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [notificationQueue]);

  if (loading) return <p>Loading...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;

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
      
      setShowRejectPopup(false);
      setRejectReason('');
      setSelectedOrderId(null);
      fetchOrders();
    } catch (error) {
      console.error('Error rejecting order:', error);
    }
  };
  // Save deleted order ID to localStorage
const markOrderAsDeleted = (orderId) => {
  const deleted = JSON.parse(localStorage.getItem("deletedNotifications")) || [];
  if (!deleted.includes(orderId)) {
    deleted.push(orderId);
    localStorage.setItem("deletedNotifications", JSON.stringify(deleted));
  }
};

// Check if order is already deleted
const isOrderDeleted = (orderId) => {
  const deleted = JSON.parse(localStorage.getItem("deletedNotifications")) || [];
  return deleted.includes(orderId);
};

  

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, newStatus).send({ from: account });

      const successMessage =
        newStatus === "Waiting for payment"
          ? `Order ${orderId} has been successfully accepted.`
          : `Order ${orderId} has been successfully rejected.`;

      setNotificationQueue((prevQueue) => [
        ...prevQueue,
        { message: successMessage, type: "success" },
      ]);

      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      setErrorMessage(`Failed to update order status to ${newStatus}. Please try again later.`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;

  return (
    <div className="container">
      <section className="manufacturer-info">
        <h2>{manufacturer.name || "Manufacturer"}</h2>
        <p><strong>Address:</strong> {manufacturer.addressLine || "Not Available"}</p>
        <p><strong>Phone:</strong> {manufacturer.phoneNumber || "Not Available"}</p>
        <p><strong>Email:</strong> {manufacturer.email || "Not Available"}</p>
       </section>
      <section className="orders-sectionM">



{notificationQueue.length > 0 && (
  <div className="notification success-notification">
    {notificationQueue[0].message}
  </div>
)}


<h2>Upcoming Orders</h2>

        {orders.length > 0 ? (
          <div className="order-gridM">
            {orders.map((order) => (
              <div key={order.orderId} className="order-cardM">
                <h4>Order ID: {order.orderId}</h4>
                <p><strong>Product ID:</strong> {order.productId}</p>
                <p><strong>Product Name:</strong> {order.productName}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>
                <p><strong>Delivery Date:</strong> {order.deliveryDate}</p>
                <p><strong>Delivery Time:</strong> {order.deliveryTime}</p>
                <p><strong>Shipping Address:</strong> {order.shippingAddress}</p>

                <div className="order-actions">
                  <button onClick={() => updateOrderStatus(order.orderId, "Waiting for payment")}>Accept</button>
                  <button onClick={() => openRejectPopup(order.orderId)}>Reject</button>
                  </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-orders-message">
            No upcoming orders at the moment. <FontAwesomeIcon icon={faBoxOpen} />
          </p>
        )}{showRejectPopup && (
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
        
  </section>

    </div>
  );
};

export default ManufacturerHomePage;

<<<<<<< HEAD
import React, { useEffect, useState, useCallback } from 'react';
import getWeb3 from "./web3";
import RoleContract from "./contracts/RoleContract.json";
import OrderContract from "./contracts/OrderContract.json";
import ProductContract from "./contracts/ProductContract.json";
import "./ManufacturerHomePage.css"; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';



const ManufacturerHomePage = () => {
  const [web3, setWeb3] = useState(null);
    const [roleContract, setRoleContract] = useState(null);
    const [orderContract, setOrderContract] = useState(null);
    const [productContract, setProductContract] = useState(null);
    const [account, setAccount] = useState('');
    const [manufacturer, setManufacturer] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [notification, setNotification] = useState('');  // State to manage success/error notifications
  

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

        setWeb3(web3);
        setAccount(accounts[0]);
        setRoleContract(instanceRole);
        setOrderContract(instanceOrder);
        setProductContract(instanceProduct);
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
        const filteredOrders = ordersList.filter(order => order.status === "Waiting for manufacturer acceptance");

        const ordersWithProducts = await Promise.all(filteredOrders.map(async order => {
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
        }));
        setOrders(ordersWithProducts);
    } catch (error) {
        console.error("Error fetching orders:", error);
        setErrorMessage("Failed to fetch orders. Please try again later.");
    } finally {
        setLoading(false);
    }
};





const updateOrderStatus = async (orderId, newStatus) => {
try {
    await orderContract.methods.updateOrderStatus(orderId, newStatus).send({ from: account });
    
    // Determine the message based on the newStatus
    let successMessage = "";
    if (newStatus === "Waiting for payment") {
        successMessage = `Order ${orderId} has been successfully accepted.`;
    } else if (newStatus === "Rejected by manufacturer") {
        successMessage = `Order ${orderId} has been successfully rejected.`;
    } else {
        successMessage = `Order ${orderId} status updated to ${newStatus}.`;
    }
    
    setNotification(successMessage);  // Set the appropriate success notification
    setTimeout(() => setNotification(''), 5000);  // Clear notification after 5 seconds
    
    fetchOrders();  // Refresh orders after the update to reflect changes
} catch (error) {
    console.error("Error updating order status:", error);
    setErrorMessage(`Failed to update order status to ${newStatus}. Please try again later.`);
}
};


if (loading) return <p>Loading...</p>;
if (errorMessage) return <p>{errorMessage}</p>;

return (
    <div className="container">
      
        
        {/* Manufacturer Info Section */}
        <section className="manufacturer-info">
          <h2>{manufacturer.name || "Manufacturer"}</h2>
          <p><strong>Address:</strong> {manufacturer.addressLine || "Not Available"}</p>
          <p><strong>Phone:</strong> {manufacturer.phoneNumber || "Not Available"}</p>
          <p><strong>Email:</strong> {manufacturer.email || "Not Available"}</p>
        </section>

 {/* Orders Section */}
<section className="orders-sectionM">
  <h2>Upcoming Orders</h2>
  {notification && <div className="notification">{notification}</div>}

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
            <button onClick={() => updateOrderStatus(order.orderId, "Rejected by manufacturer")}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  ) : (
<p className="no-orders-message">
  No upcoming orders at the moment. <FontAwesomeIcon icon={faBoxOpen} />
</p>
  )}
</section>


    </div>
  );
};

export default ManufacturerHomePage;
=======
import React, { useEffect, useState, useCallback } from 'react';
import getWeb3 from "./web3";
import RoleContract from "./contracts/RoleContract.json";
import OrderContract from "./contracts/OrderContract.json";
import ProductContract from "./contracts/ProductContract.json";
import "./ManufacturerHomePage.css"; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';



const ManufacturerHomePage = () => {
  const [web3, setWeb3] = useState(null);
    const [roleContract, setRoleContract] = useState(null);
    const [orderContract, setOrderContract] = useState(null);
    const [productContract, setProductContract] = useState(null);
    const [account, setAccount] = useState('');
    const [manufacturer, setManufacturer] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [notification, setNotification] = useState('');  // State to manage success/error notifications
  

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

        setWeb3(web3);
        setAccount(accounts[0]);
        setRoleContract(instanceRole);
        setOrderContract(instanceOrder);
        setProductContract(instanceProduct);
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

        if (!ordersList || ordersList.length === 0) {
            throw new Error("No orders found or empty response.");
        }

        const filteredOrders = ordersList.filter(order => order.status && order.status === "Waiting for manufacturer acceptance");

        const ordersWithProducts = await Promise.all(filteredOrders.map(async order => {
            try {
                const product = await productContract.methods.getProductById(order.productId).call();
                return {
                    ...order,
                    productId: order.productId.toString(),
                    orderId: order.orderId.toString(),
                    quantity: order.quantity.toString(),
                    productName: product?.name || "Unknown Product",
                    productDescription: product?.description || "No description",
                    transportMode: product?.transportMode || "Unknown",
                    deliveryDate: order.deliveryInfo?.deliveryDate || "N/A",
                    deliveryTime: order.deliveryInfo?.deliveryTime || "N/A",
                    shippingAddress: order.deliveryInfo?.shippingAddress || "N/A",
                };
            } catch (error) {
                console.warn(`Error fetching product for order ${order.orderId}:`, error);
                return null;  // Skip problematic orders
            }
        }));

        setOrders(ordersWithProducts.filter(order => order !== null));
    } catch (error) {
        console.error("Error fetching orders:", error);
        setErrorMessage("Failed to fetch orders. Please try again later.");
    } finally {
        setLoading(false);
    }
};






const updateOrderStatus = async (orderId, newStatus) => {
try {
    await orderContract.methods.updateOrderStatus(orderId, newStatus).send({ from: account });
    
    // Determine the message based on the newStatus
    let successMessage = "";
    if (newStatus === "Waiting for payment") {
        successMessage = `Order ${orderId} has been successfully accepted.`;
    } else if (newStatus === "Rejected by manufacturer") {
        successMessage = `Order ${orderId} has been successfully rejected.`;
    } else {
        successMessage = `Order ${orderId} status updated to ${newStatus}.`;
    }
    
    setNotification(successMessage);  // Set the appropriate success notification
    setTimeout(() => setNotification(''), 5000);  // Clear notification after 5 seconds
    
    fetchOrders();  // Refresh orders after the update to reflect changes
} catch (error) {
    console.error("Error updating order status:", error);
    setErrorMessage(`Failed to update order status to ${newStatus}. Please try again later.`);
}
};


if (loading) return <p>Loading...</p>;
if (errorMessage) return <p>{errorMessage}</p>;

return (
    <div className="container">
      
        
        {/* Manufacturer Info Section */}
        <section className="manufacturer-info">
          <h2>{manufacturer.name || "Manufacturer"}</h2>
          <p><strong>Address:</strong> {manufacturer.addressLine || "Not Available"}</p>
          <p><strong>Phone:</strong> {manufacturer.phoneNumber || "Not Available"}</p>
          <p><strong>Email:</strong> {manufacturer.email || "Not Available"}</p>
        </section>

 {/* Orders Section */}
<section className="orders-sectionM">
  <h2>Upcoming Orders</h2>
  {notification && <div className="notification">{notification}</div>}

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
            <button onClick={() => updateOrderStatus(order.orderId, "Rejected by manufacturer")}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  ) : (
<p className="no-orders-message">
  No upcoming orders at the moment. <FontAwesomeIcon icon={faBoxOpen} />
</p>
  )}
</section>


    </div>
  );
};

export default ManufacturerHomePage;
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240

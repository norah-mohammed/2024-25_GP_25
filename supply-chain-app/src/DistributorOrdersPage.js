import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import RoleContract from './contracts/RoleContract.json';
import TrackOrderPage from './TrackOrderPage'; // Import TrackOrderPage
import "./ordersPage.css";

const DistributorOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [web3, setWeb3] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState(null); // Track order ID for navigation

const [currentPage, setCurrentPage] = useState('orders');


  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);

        const networkId = await web3Instance.eth.net.getId();

        const orderDeployedNetwork = OrderContract.networks[networkId];
        const roleDeployedNetwork = RoleContract.networks[networkId];

        const orderInstance = new web3Instance.eth.Contract(
          OrderContract.abi,
          orderDeployedNetwork && orderDeployedNetwork.address
        );
        const roleInstance = new web3Instance.eth.Contract(
          RoleContract.abi,
          roleDeployedNetwork && roleDeployedNetwork.address
        );

        setOrderContract(orderInstance);
        setRoleContract(roleInstance);

        fetchOrders(orderInstance, accounts[0], roleInstance);
      } catch (error) {
        console.error('Error initializing Web3 or contracts:', error);
      }
    };

    initWeb3();
  }, []);

  const fetchOrders = async (orderContract, account, roleContract) => {
    try {
      setLoading(true);
      const distributorOrders = await orderContract.methods.getOrdersByDistributor(account).call();
  
      const ordersWithManufacturerNames = await Promise.all(
        distributorOrders.map(async (order) => {
          const manufacturer = await roleContract.methods.getManufacturer(order.manufacturer).call();
          return {
            ...order,
            orderId: order.orderId.toString(), // Convert to string
            productId: order.productId.toString(), // Convert to string
            quantity: order.quantity.toString(), // Convert to string
            manufacturerName: manufacturer.name,
          };
        })
      );
  
      setOrders(ordersWithManufacturerNames);
      setFilteredOrders(ordersWithManufacturerNames);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleStartTransmission = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'In Transit').send({ from: account });
      showTemporaryNotification(`Order ${orderId} is now In Transit.`);
      fetchOrders(orderContract, account, roleContract); // Refresh the orders
    } catch (error) {
      console.error('Error starting transmission:', error);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'Delivered to Retailer').send({ from: account });
      showTemporaryNotification(`Order ${orderId} has been Delivered.`);
      fetchOrders(orderContract, account, roleContract); // Refresh the orders
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };

  const showTemporaryNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const filterOrders = (filterType) => {
    let filtered = [];
    if (filterType === 'Running') {
      filtered = orders.filter(order =>
        order.status === "Rejected by Distributor" || !/(completed|cancelled|rejected)/i.test(order.status)
      );
    } else if (filterType === 'Previous') {
      filtered = orders.filter(order =>
        order.status !== "Rejected by Distributor" && /(completed|cancelled|rejected)/i.test(order.status)
      );
    } else {
      filtered = orders;
    }
    setFilteredOrders(filtered);
    setFilter(filterType);
  };

  const goBack = () => {
    setTrackingOrderId(null); // Reset tracking order ID to show DistributorOrdersPage
  };

  if (trackingOrderId) {
    return <TrackOrderPage orderId={trackingOrderId} goBack={() => setTrackingOrderId(null)} />;
  }

  return (
    <div className="distributor-orders-page">
      {trackingOrderId ? (
        <TrackOrderPage trackingOrderId={trackingOrderId} goBack={goBack} />
      ) : (
        <>
          <h2>Orders</h2>
          {notification && <div className="notification">{notification}</div>}

          <div className="filter-buttons">
            <button onClick={() => filterOrders('All')} className={filter === 'All' ? 'active' : ''}>
              All
            </button>
            <button onClick={() => filterOrders('Running')} className={filter === 'Running' ? 'active' : ''}>
              Running
            </button>
            <button onClick={() => filterOrders('Previous')} className={filter === 'Previous' ? 'active' : ''}>
              Previous
            </button>
          </div>

          {loading ? (
            <p className="loading-message">Loading orders...</p>
          ) : filteredOrders.length > 0 ? (
            <table className="orders-table">
              <thead>
                <tr className="table-header">
                  <th className="header-cell">Order ID</th>
                  <th className="header-cell">Product ID</th>
                  <th className="header-cell">Quantity</th>
                  <th className="header-cell">Delivery Date</th>
                  <th className="header-cell">Delivery Time</th>
                  <th className="header-cell">Shipping Address</th>
                  <th className="header-cell">Status</th>
                  <th className="header-cell">Manufacturer</th>
                  <th className="header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
  {filteredOrders.map((order, index) => (
    <tr key={index} className="table-row">
      <td className="table-cell">{order.orderId}</td>
      <td className="table-cell">{order.productId}</td>
      <td className="table-cell">{order.quantity}</td>
      <td>{order.deliveryInfo.deliveryDate || 'N/A'}</td>
      <td className="table-cell">{order.deliveryInfo.deliveryTime || 'N/A'}</td>
      <td className="table-cell">{order.deliveryInfo.shippingAddress || 'N/A'}</td>
      <td className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</td>
      <td className="table-cell">{order.manufacturerName}</td>
      <td className="actions-cell">
        {order.status === 'Accepted by Distributor' && (
          <button onClick={() => handleStartTransmission(order.orderId)}>
            Transmit
          </button>
        )}
        {order.status === 'In Transit' && (
          <button onClick={() => handleConfirmDelivery(order.orderId)}>
            Confirm Delivery
          </button>
        )}
        <button onClick={() => setTrackingOrderId(order.orderId)}>
          Track
        </button>
      </td>
    </tr>
  ))}
</tbody>

            </table>
          ) : (
            <p className="no-orders-message">No orders assigned.</p>
          )}
        </>
      )}
    </div>
  );
};

export default DistributorOrdersPage;

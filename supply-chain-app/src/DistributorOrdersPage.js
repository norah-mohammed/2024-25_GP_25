import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import RoleContract from './contracts/RoleContract.json';
import "./ordersPage.css";

const DistributorOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

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
            manufacturerName: manufacturer.name,
          };
        })
      );

      setOrders(ordersWithManufacturerNames);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const showTemporaryNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleStartTransmission = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'In Transit').send({ from: account });
      showTemporaryNotification(`Order ${orderId} is now In Transit.`);
      fetchOrders(orderContract, account, roleContract);
    } catch (error) {
      console.error('Error starting transmission:', error);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'Delivered to Retailer').send({ from: account });
      showTemporaryNotification(`Order ${orderId} has been Delivered.`);
      fetchOrders(orderContract, account, roleContract);
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };

  return (
    <div className="distributor-orders-page">
      <h2 >Orders</h2>
      {notification && <div className="notification">{notification}</div>}
      {loading ? (
        <p className="loading-message">Loading orders...</p>
      ) : orders.length > 0 ? (
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
            {orders.map((order, index) => (
              <tr key={index} className="table-row">
                <td className="table-cell">{parseInt(order.orderId)}</td>
                <td className="table-cell">{parseInt(order.productId)}</td>
                <td className="table-cell">{parseInt(order.quantity)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{order.deliveryInfo.deliveryDate}</td>
                <td className="table-cell">{order.deliveryInfo.deliveryTime}</td>
                <td className="table-cell">{order.deliveryInfo.shippingAddress}</td>
                <td className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</td>
                <td className="table-cell">{order.manufacturerName}</td>
                <td className="actions-cell">
                  {order.status === 'Accepted by Distributor' && (
                    <button className="transmit-button" onClick={() => handleStartTransmission(order.orderId)}>
                      Transmit
                    </button>
                  )}
                  {order.status === 'In Transit' && (
                    <button className="confirm-delivery-button" onClick={() => handleConfirmDelivery(order.orderId)}>
                      Confirm Delivery
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-orders-message">No orders assigned.</p>
      )}
    </div>
  );
};

export default DistributorOrdersPage;

import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import RoleContract from './contracts/RoleContract.json';

const DistributorOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(''); // State for notifications

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
    setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
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
    <div>
      <h1>Distributor Orders Page</h1>
      {notification && <div style={{ color: 'green', marginBottom: '10px' }}>{notification}</div>}
      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length > 0 ? (
        <table border="1">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Product ID</th>
              <th>Quantity</th>
              <th>Delivery Date</th>
              <th>Delivery Time</th>
              <th>Shipping Address</th>
              <th>Status</th>
              <th>Manufacturer</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={index}>
                <td>{parseInt(order.orderId)}</td>
                <td>{parseInt(order.productId)}</td>
                <td>{parseInt(order.quantity)}</td>
                <td>{order.deliveryInfo.deliveryDate}</td>
                <td>{order.deliveryInfo.deliveryTime}</td>
                <td>{order.deliveryInfo.shippingAddress}</td>
                <td>{order.status}</td>
                <td>{order.manufacturerName}</td>
                <td>
                  {order.status === 'Accepted by Distributor' && (
                    <button onClick={() => handleStartTransmission(order.orderId)}>Transmit</button>
                  )}
                  {order.status === 'In Transit' && (
                    <button onClick={() => handleConfirmDelivery(order.orderId)}>Confirm Delivery</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No orders assigned.</p>
      )}
    </div>
  );
};

export default DistributorOrdersPage;


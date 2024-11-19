import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';

const DistributorHomePage = () => {
  const [distributorInfo, setDistributorInfo] = useState(null);
  const [deliveryRequests, setDeliveryRequests] = useState([]);
  const [web3, setWeb3] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [productContract, setProductContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(''); // Notification state

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);

        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);

        const networkId = await web3Instance.eth.net.getId();

        // Load contracts
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

        // Fetch initial data
        fetchDistributorInfo(roleInstance, accounts[0]);
        fetchDeliveryRequests(orderInstance, accounts[0], roleInstance, productInstance);
      } catch (error) {
        console.error('Error initializing Web3 or contracts:', error);
      }
    };

    initWeb3();
  }, []);

  const fetchDistributorInfo = async (contract, account) => {
    try {
      const distributor = await contract.methods.getDistributor(account).call();
      setDistributorInfo(distributor);
    } catch (error) {
      console.error('Error fetching distributor info:', error);
    }
  };

  const transportModeMapping = {
    0: 'Refrigerated',
    1: 'Frozen',
    2: 'Ambient',
  };

  const fetchDeliveryRequests = async (orderContract, account, roleContract, productContract) => {
    try {
      setLoading(true);
      const requests = await orderContract.methods.getOrdersByDistributor(account).call();
      const dispatchedOrders = requests.filter(order => order.status === 'Dispatched');

      const enrichedOrders = await Promise.all(
        dispatchedOrders.map(async (order) => {
          const manufacturer = await roleContract.methods.getManufacturer(order.manufacturer).call();
          const product = await productContract.methods.getProductById(order.productId).call();

          return {
            ...order,
            manufacturerName: manufacturer.name,
            transportMode: transportModeMapping[parseInt(product.transportMode)] || 'Unknown',
            weight: parseInt(product.weight),
            temperatureRange: `${product.minTemp}°C - ${product.maxTemp}°C`,
          };
        })
      );

      setDeliveryRequests(enrichedOrders);
    } catch (error) {
      console.error('Error fetching delivery requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'Accepted by Distributor').send({ from: account });
      setNotification(`Order ${orderId} has been accepted.`); // Set notification
      setTimeout(() => setNotification(''), 3000); // Clear notification after 3 seconds
      fetchDeliveryRequests(orderContract, account, roleContract, productContract);
    } catch (error) {
      console.error('Error accepting delivery request:', error);
    }
  };

  const handleRejectRequest = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'Rejected by Distributor').send({ from: account });
      setNotification(`Order ${orderId} has been rejected.`); // Set notification
      setTimeout(() => setNotification(''), 5000); // Clear notification after 5 seconds
      fetchDeliveryRequests(orderContract, account, roleContract, productContract);
    } catch (error) {
      console.error('Error rejecting delivery request:', error);
    }
  };

  return (
    <div>
      <h1>Distributor Home Page</h1>
      {notification && (
        <div style={{ color: 'green', marginBottom: '10px' }}>
          {notification}
        </div>
      )}
      {distributorInfo ? (
        <div>
          <h2>Distributor Info</h2>
          <p><strong>Name:</strong> {distributorInfo.name}</p>
          <p><strong>Address:</strong> {distributorInfo.physicalAddress}</p>
          <p><strong>Phone:</strong> {distributorInfo.phoneNumber}</p>
          <p><strong>Email:</strong> {distributorInfo.email}</p>
        </div>
      ) : (
        <p>Loading distributor info...</p>
      )}

      <h2>Delivery Requests</h2>
      {loading ? (
        <p>Loading delivery requests...</p>
      ) : deliveryRequests.length > 0 ? (
        <table border="1">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Quantity</th>
              <th>Weight (kg)</th>
              <th>Delivery Time</th>
              <th>Delivery Date</th>
              <th>Day</th>
              <th>Delivery Address</th>
              <th>Manufacturer</th>
              <th>Transport Mode</th>
              <th>Temperature Range</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveryRequests.map((order, index) => (
              <tr key={index}>
                <td>{parseInt(order.orderId)}</td>
                <td>{parseInt(order.quantity)}</td>
                <td>{parseInt(order.weight)}</td>
                <td>{order.deliveryInfo.deliveryTime}</td>
                <td>{order.deliveryInfo.deliveryDate}</td>
                <td>{new Date(order.deliveryInfo.deliveryDate).toLocaleDateString('en-SA', { weekday: 'long' })}</td>
                <td>{order.deliveryInfo.shippingAddress}</td>
                <td>{order.manufacturerName}</td>
                <td>{order.transportMode}</td>
                <td>{order.temperatureRange}</td>
                <td>
                  <button onClick={() => handleAcceptRequest(order.orderId)}>Accept</button>
                  <button onClick={() => handleRejectRequest(order.orderId)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No delivery requests available.</p>
      )}
    </div>
  );
};

export default DistributorHomePage;

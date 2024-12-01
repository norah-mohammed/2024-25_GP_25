import React, { useEffect, useState, useCallback } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';
import './DistributorHomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxOpen } from '@fortawesome/free-solid-svg-icons';

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
            transportMode: transportModeMapping[parseInt(product.transportMode)] || 'Unknown',
            weight: parseInt(product.weight) || 0,
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

  const handleRejectRequest = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'Rejected by Distributor').send({ from: account });
      handleNotification(`Order ${orderId} has been rejected.`);
      fetchDeliveryRequests(orderContract, account, roleContract, productContract);
    } catch (error) {
      console.error('Error rejecting delivery request:', error);
    }
  };

  return (
    <div className="container">
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
                <button className="btn-reject" onClick={() => handleRejectRequest(order.orderId)}>Reject</button>
              </div>
            </div>
          ))
        ) : (
         <p className="no-orders-message">
          No delivery requests available at the moment.<FontAwesomeIcon icon={faBoxOpen} />
          </p>
        )}
      </div>
    </div>
  );
};

export default DistributorHomePage;

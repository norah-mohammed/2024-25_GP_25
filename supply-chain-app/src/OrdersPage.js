import React, { useEffect, useState, useRef } from 'react'; 
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import RoleContract from './contracts/RoleContract.json';
import "./ordersPage.css";

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');

  const selectDistributorRef = useRef(null);

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
      const allOrders = await orderContract.methods.getAllOrders().call({ from: account });

      const ordersWithDistributorNames = await Promise.all(
        allOrders.map(async (order) => {
          let distributorName = 'Not Assigned';
          if (order.distributor && order.distributor !== '0x0000000000000000000000000000000000000000') {
            const distributor = await roleContract.methods.getDistributor(order.distributor).call();
            distributorName = distributor.name;
          }
          return { ...order, distributorName };
        })
      );

      setOrders(ordersWithDistributorNames);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributors = async (order) => {
    try {
      const allDistributors = await roleContract.methods.getAllDistributorAddresses().call();
      const filteredDistributors = [];

      for (const distributorAddress of allDistributors) {
        const distributor = await roleContract.methods.getDistributor(distributorAddress).call();
        const deliveryDayIndex = getSaudiDayIndex(order.deliveryInfo.deliveryDate);

        const worksOnDay = distributor.workingDays[deliveryDayIndex - 1];
        const worksOnTime =
          (order.deliveryInfo.deliveryTime === 'AM' && distributor.isAM) ||
          (order.deliveryInfo.deliveryTime === 'PM' && distributor.isPM);

        if (worksOnDay && worksOnTime) {
          filteredDistributors.push({
            name: distributor.name,
            ethAddress: distributorAddress,
          });
        }
      }

      setDistributors(filteredDistributors);
    } catch (error) {
      console.error('Error fetching distributors:', error);
    }
  };

  const getSaudiDayIndex = (dateString) => {
    const date = new Date(dateString);
    const jsDayIndex = date.getDay();

    return (jsDayIndex + 1) % 7 || 7;
  };

  const showTemporaryNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleCreateOrder = async (orderId) => {
    try {
      await orderContract.methods.updateOrderStatus(orderId, 'Preparing for Dispatch').send({ from: account });
      showTemporaryNotification(`Order ${orderId} successfully created.`);
      fetchOrders(orderContract, account, roleContract);
    } catch (error) {
      console.error('Error updating order status to Preparing for Dispatch:', error);
    }
  };
  const handleAssignDistributorClick = async (order) => {
    setSelectedOrder(order.orderId);
    await fetchDistributors(order);
  
    // Delay the popup visibility and smooth scroll to the 'Select Distributor' section
    setShowPopup(true);
  
    setTimeout(() => {
      if (selectDistributorRef.current) {
        selectDistributorRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start', // Align the section to the top of the viewport
          inline: 'nearest', // Ensure it's visible in the viewport
        });
      }
    }, 100); // Adding a 100ms delay after the state update for smooth scrolling
  };
  

  const handleAssignDistributor = async (distributorAddress) => {
    try {
      await orderContract.methods.assignDistributor(selectedOrder, distributorAddress).send({ from: account });
      showTemporaryNotification(`Distributor assigned to Order ${selectedOrder}.`);
      setShowPopup(false);
      fetchOrders(orderContract, account, roleContract);
    } catch (error) {
      console.error('Error assigning distributor:', error);
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await orderContract.methods.cancelOrder(orderId).send({ from: account });
      showTemporaryNotification(`Order ${orderId} successfully canceled.`);
      fetchOrders(orderContract, account, roleContract);
    } catch (error) {
      console.error('Error canceling order:', error);
    }
  };

  return (
    <div className="ordersSection">
      <h1>Orders</h1>
      {notification && <div className="notification">{notification}</div>}
      {loading ? (
        <p>Loading orders...</p>
      ) : (
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
              <th>Distributor</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order, index) => (
                <tr key={index}>
                  <td>{parseInt(order.orderId)}</td>
                  <td>{parseInt(order.productId)}</td>
                  <td>{parseInt(order.quantity)}</td>
                  <td>{order.deliveryInfo.deliveryDate}</td>
                  <td>{order.deliveryInfo.deliveryTime}</td>
                  <td>{order.deliveryInfo.shippingAddress}</td>
                  <td>
                    <span className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{order.distributorName}</td>
                  <td>
                    {order.status === 'Paid' && (
                      <button onClick={() => handleCreateOrder(order.orderId)}>Prepare Order</button>
                    )}
                    {['Preparing for Dispatch', 'Rejected by Distributor'].includes(order.status) && order.status !== 'Rejected by Distributor' && (
                      <>
                        <button onClick={() => handleAssignDistributorClick(order)}>Assign Distributor</button>
                        <button onClick={() => handleCancelOrder(order.orderId)}>Cancel</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showPopup && (
        <div ref={selectDistributorRef} className="popup">
          <h2>Select Distributor</h2>
          <ul>
            {distributors.map((distributor) => (
              <li key={distributor.ethAddress}>
                {distributor.name}
                <button onClick={() => handleAssignDistributor(distributor.ethAddress)}>Select</button>
              </li>
            ))}
          </ul>
          <button className="close-button" onClick={() => setShowPopup(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;

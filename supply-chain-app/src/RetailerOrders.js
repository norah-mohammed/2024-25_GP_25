import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import RoleContract from './contracts/RoleContract.json';
import TrackOrderPage from './TrackOrderPage';  // Import TrackOrderPage
import "./ordersPage.css";

const RetailerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // Filtered list of orders
  const [filter, setFilter] = useState('All'); // Current filter
  const [web3, setWeb3] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(null);
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

        if (!orderDeployedNetwork || !roleDeployedNetwork) {
          console.error("Contracts not deployed to detected network.");
          return;
        }

        const orderInstance = new web3Instance.eth.Contract(
          OrderContract.abi,
          orderDeployedNetwork.address
        );
        const roleInstance = new web3Instance.eth.Contract(
          RoleContract.abi,
          roleDeployedNetwork.address
        );

        setOrderContract(orderInstance);
        setRoleContract(roleInstance);

        fetchOrders(orderInstance, roleInstance);
      } catch (error) {
        console.error('Error initializing Web3 or contracts:', error);
      }
    };

    initWeb3();
  }, []);

  const fetchOrders = async (orderContract, roleContract) => {
    try {
      setLoading(true);
      const allOrders = await orderContract.methods.getAllOrders().call();

      if (allOrders.length === 0) {
        setOrders([]);
        setFilteredOrders([]);
        return;
      }

      const ordersWithManufacturerNames = await Promise.all(
        allOrders.map(async (order) => {
          let manufacturerName = 'N/A';
          if (order.manufacturer !== '0x0000000000000000000000000000000000000000') {
            try {
              const manufacturer = await roleContract.methods.getManufacturer(order.manufacturer).call();
              manufacturerName = manufacturer.name;
            } catch (error) {
              console.error('Error fetching manufacturer details:', error);
            }
          }

          return {
            ...order,
            orderId: parseInt(order.orderId, 10),
            productId: parseInt(order.productId, 10),
            quantity: parseInt(order.quantity, 10),
            deliveryInfo: order.deliveryInfo || {},
            manufacturerName,
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
      filtered = orders; // Show all orders
    }
    setFilteredOrders(filtered);
    setFilter(filterType);
  };

  const handleTrackOrder = (orderId) => {
    console.log("Tracking order ID in parent:", orderId);
    setTrackingOrderId(orderId);
    setCurrentPage('trackOrder');
  };

  if (currentPage === 'trackOrder' && trackingOrderId) {
    return <TrackOrderPage orderId={trackingOrderId} goBack={() => setCurrentPage('orders')} />;
  }

  return (
    <div className="ordersSection">
      <h2>Orders</h2>

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
                <td className="table-cell">
                  <button className="track-button" onClick={() => handleTrackOrder(order.orderId)}>
                    Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-orders-message">No orders available.</p>
      )}
    </div>
  );
};

export default RetailerOrdersPage;

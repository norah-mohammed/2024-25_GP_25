import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import RoleContract from './contracts/RoleContract.json';
import TrackOrderPage from './TrackOrderPage'; // Import TrackOrderPage
import ProductContract from './contracts/ProductContract.json'; 
import "./ordersPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import { faBell,faInfoCircle, faSearch } from "@fortawesome/free-solid-svg-icons";


const DistributorOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [web3, setWeb3] = useState(null);
  const [orderContract, setOrderContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [trackingOrderId, setTrackingOrderId] = useState(null); // Track order ID for navigation
    const [products, setProducts] = useState({}); // Store products by productId
    const [invalidTempOrders, setInvalidTempOrders] = useState([]); // Track invalid temperature orders
      const [invalidTempNotifications, setInvalidTempNotifications] = useState([]); // NEW STATE
      const [showReasonModal, setShowReasonModal] = useState(false);
const [currentRejectionReason, setCurrentRejectionReason] = useState('');





  

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

  
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!orders.length || !orderContract) return;
  
      try {
        const web3Instance = await getWeb3();
        const networkId = await web3Instance.eth.net.getId();
        const productDeployedNetwork = ProductContract.networks[networkId];
        
        if (!productDeployedNetwork) return;
  
        const productInstance = new web3Instance.eth.Contract(
          ProductContract.abi,
          productDeployedNetwork.address
        );
  
        const productDetails = {};
        const promises = orders.map(async (order) => {
          if (order.productId) {
            const product = await productInstance.methods.getProductById(order.productId).call();
            productDetails[order.productId] = {
              minTemp: parseInt(product.minTemp, 10),
              maxTemp: parseInt(product.maxTemp, 10),
            };
          }
        });
  
        await Promise.all(promises);
        setProducts(productDetails);
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    };
  
    fetchProductDetails();
  }, [orders, orderContract]);
  
  useEffect(() => {
    const validateOrderTemperatures = () => {
      const invalidOrders = filteredOrders.filter(order => {
        if (['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status)) {
          const product = products[order.productId];
          if (product) {
            // Check temperature validity
            return (
              order.temperature < product.minTemp ||
              order.temperature > product.maxTemp
            );
          }
        }
        return false;
      });
  
      // Update invalidTempOrders with the filtered invalid orders
      setInvalidTempOrders(invalidOrders);
    };
  
    validateOrderTemperatures();
  }, [filteredOrders, products]);

  useEffect(() => {
    if (!orderContract || !account || !roleContract) return;
  
    const interval = setInterval(() => {
      fetchOrders(orderContract, account, roleContract);
    }, 10000); // every 10 seconds
  
    return () => clearInterval(interval); // Clean up on unmount
  }, [orderContract, account, roleContract]);
  

  useEffect(() => {
    const interval = setInterval(() => {
      const activeOrders = orders.filter(
        (order) => order.status !== "Rejected due to Unsafe Temperature"
      );
  
      if (activeOrders.length > 0 && Object.keys(products).length > 0) {
        activeOrders.forEach((order) => handleTemperatureCheck(order));
      }
    }, 5000); // every 5 seconds
  
    return () => clearInterval(interval); // Clean up
  }, [orders, products]);
  
  
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
            rejectionReason: order.rejectionReason || '',
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
      await orderContract.methods.updateOrderStatus(orderId, 'Delivered to Retailer').send({ from: account, gas: 300000 });
      showTemporaryNotification(`Order ${orderId} has been Delivered.`);
      fetchOrders(orderContract, account, roleContract); // Refresh the orders
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };
  const handleTemperatureCheck = async (order) => {
    const product = products[order.productId];
    if (!product) return;
  
    console.log(`Checking Order ${order.orderId}: Temp ${order.temperature}°C vs Range ${product.minTemp}°C - ${product.maxTemp}°C`);
    console.log(`Current Status: ${order.status}`);
    const isInvalidTemp =
    order.temperature < product.minTemp || order.temperature > product.maxTemp;
  
  // Only reject if status is 'Accepted by Distributor', 'In Transit', or 'Delivered to Retailer'
  const isStatusValidForRejection = ['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status);
  
  if (isInvalidTemp && isStatusValidForRejection) {
    console.log(`🚨 Order ${order.orderId}: Invalid temperature detected and status is valid for rejection.`);
    try {
      await fetch("http://localhost:3001/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: Number(order.orderId) }),
      });
  
      await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: Number(order.orderId),
          temperature: order.temperature,
          minTemp: product.minTemp,
          maxTemp: product.maxTemp,
          status: "Rejected due to Unsafe Temperature",
        }),        
      });

      window.dispatchEvent(new CustomEvent("orderRejectedNotification", {
        detail: {
          role: "distributor",
          orderId: order.orderId,
          temperature: order.temperature,
          minTemp: product.minTemp,
          maxTemp: product.maxTemp
        }
      }));
      const stored = localStorage.getItem('queuedDistributorNotifications') || '[]';
const parsed = JSON.parse(stored);
parsed.push(`❌ Order ${order.orderId} was rejected due to unsafe temperature (Detected: ${order.temperature}°C, Allowed: ${product.minTemp}°C–${product.maxTemp}°C).`);
localStorage.setItem('queuedDistributorNotifications', JSON.stringify(parsed));

      
  
      const updatedOrders = orders.map((o) =>
        o.orderId === order.orderId
          ? { ...o, status: "Rejected due to Unsafe Temperature" }
          : o
      );
      setOrders(updatedOrders);
  
      const updatedFilteredOrders = filteredOrders.map((o) =>
        o.orderId === order.orderId
          ? { ...o, status: "Rejected due to Unsafe Temperature" }
          : o
      );
      setFilteredOrders(updatedFilteredOrders);
  
      showTemporaryNotification(
        `Order ${order.orderId} was rejected due to unsafe temperature.`
      );
  
      setInvalidTempOrders((prevInvalidOrders) => [
        ...prevInvalidOrders,
        order,
      ]);
    } catch (error) {
      console.error(`Error rejecting order ${order.orderId}:`, error);
    }
  }
  
  };
  
  const handleShowRejectionReason = (reason) => {
    setCurrentRejectionReason(reason);
    setShowReasonModal(true);
  };
  
  const showTemporaryNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const filterOrders = (filterType) => {
    applyFilters(orders, filterType, search, sortDirection);
    setFilter(filterType);
  };
  const applyFilters = (ordersList, filterValue = filter, searchValue = search, sortValue = sortDirection) => {
    let filtered = [...ordersList];
  
    // Filter by status
    if (filterValue === 'Running') {
      filtered = filtered.filter(order =>
order.status && !(
  /(completed|canceled)/i.test(order.status) ||
  order.status.toLowerCase().startsWith("rejected"))      );
    } else if (filterValue === 'Previous') {
      filtered = filtered.filter(order =>
order.status && (
  /(completed|canceled)/i.test(order.status) ||
  order.status.toLowerCase().startsWith("rejected")
)      );
    }
  
    // Search filter
    if (searchValue) {
      filtered = filtered.filter(order =>
        order.orderId.toString().includes(searchValue) ||
        (order.manufacturerName && order.manufacturerName.toLowerCase().includes(searchValue.toLowerCase())) ||
        (order.status && order.status.toLowerCase().includes(searchValue.toLowerCase()))
      );
    }
  
    // Sort
    filtered.sort((a, b) =>
      sortValue === 'asc' ? Number(a.orderId) - Number(b.orderId) : Number(b.orderId) - Number(a.orderId)
    );
  
    setFilteredOrders(filtered);
    setPage(1);
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
          <div className="new-search-filter-wrapper">
  <div className="new-search-filter-top">
    <div className="new-search-bar">
      <FontAwesomeIcon icon={faSearch} className="new-search-icon" />
      <input
        type="text"
        className="new-search-input"
        placeholder="Search by Order ID, Status, or Manufacturer..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          applyFilters(orders, filter, e.target.value, sortDirection);
        }}
      />
    </div>

    <div className="new-filter-tabs">
      <button onClick={() => filterOrders('All')} className={filter === 'All' ? 'active' : ''}>
        All
      </button>
      <button onClick={() => filterOrders('Running')} className={filter === 'Running' ? 'active' : ''}>
        Running
      </button>
      <button onClick={() => filterOrders('Previous')} className={filter === 'Previous' ? 'active' : ''}>
        Previous
      </button>
      <button
        onClick={() => {
          const newSort = sortDirection === 'asc' ? 'desc' : 'asc';
          setSortDirection(newSort);
          applyFilters(orders, filter, search, newSort);
        }}
      >
        {sortDirection === 'asc' ? 'Sort by Oldest' : 'Sort by Newest'}
      </button>
    </div>
  </div>
</div>


          <div className="invalid-temp-notifications">
  {invalidTempOrders.length > 0 && (
    <div
      className="notification invalid-temp"
      style={{
        backgroundColor: "red",
        color: "white",
        padding: "10px",
        borderRadius: "5px",
        display: "flex",
        alignItems: "center",
        marginBottom: "10px",
      }}
    >
      <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: "8px" }} />
      <span>There are orders with invalid temperatures!</span>
    </div>
  )}
</div>

          {notification && <div className="notification">{notification}</div>}

         
         


          {loading ? (
            <p className="loading-message">Loading orders...</p>
          ) : filteredOrders.length > 0 ? (
            <table>
              <thead>
                <tr className="table-header">
                  <th className="header-cell">Order ID</th>
                  <th className="header-cell">Quantity</th>
                  <th className="header-cell">Delivery Date</th>
                  <th className="header-cell">Delivery Time</th>
                  <th className="header-cell">Shipping Address</th>
                  <th className="header-cell">Status</th>
                  <th className="header-cell">Manufacturer</th>
                  <th>Temperature</th> {/* New Column for Temperature */}
                  <th className="header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
              {filteredOrders
  .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  .map((order, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell">{parseInt(order.orderId)}</td>
                    <td className="table-cell">{parseInt(order.quantity)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{order.deliveryInfo.deliveryDate}</td>
                    <td className="table-cell">{order.deliveryInfo.deliveryTime}</td>
                    <td className="table-cell">{order.deliveryInfo.shippingAddress}</td>
                    <td>
                    <span className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
  {order.status}
</span>

{['Rejected by Distributor', 'Rejected by Retailer', 'Rejected by Manufacturer'].includes(order.status) && order.rejectionReason && (
 <button 
 onClick={() => handleShowRejectionReason(order.rejectionReason)} 
 style={{
   background: 'none',
   border: 'none',
   marginLeft: '3px',
   cursor: 'pointer',
   color: '#4a5b7d', /* Dark Blue-Gray */
   fontSize: '14px', 
   padding: '0',
 }}
 title="View Rejection Reason"
>
 <FontAwesomeIcon icon={faInfoCircle} />
</button>

)}

                    </td>
                    <td className="table-cell">{order.manufacturerName}</td>
                    <td> <td>
  {['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status) ? (
    order.temperature ? (
      <div>
        <span>{`${order.temperature}°C`}</span>
        {products[order.productId] ? (
          <span
            style={{
              color:
                order.temperature >= products[order.productId].minTemp &&
                order.temperature <= products[order.productId].maxTemp
                  ? 'green'
                  : 'red',
              marginLeft: '10px',
            }}
          >
            {order.temperature >= products[order.productId].minTemp &&
            order.temperature <= products[order.productId].maxTemp
              ? 'Valid'
              : 'Invalid'}
          </span>
        ) : (
          <span style={{ color: 'orange', marginLeft: '10px' }}>Loading...</span>
        )}
      </div>
    ) : (
      'Not Assigned'
    )
  ) : (
    'Not Applicable'
  )}
</td></td>
                    <td className="actions-cell"><div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
  {order.status === 'Accepted by Distributor' && (
    <button
      className="action-button transmit-button"
      onClick={() => handleStartTransmission(order.orderId)}
      disabled={
        products[order.productId] &&
        (order.temperature < products[order.productId].minTemp ||
         order.temperature > products[order.productId].maxTemp)
      }
    >
      Transmit
    </button>
  )}
  {order.status === 'In Transit' && (
    <button
      className="action-button confirm-button"
      onClick={() => handleConfirmDelivery(order.orderId)}
      disabled={
        products[order.productId] &&
        (order.temperature < products[order.productId].minTemp ||
         order.temperature > products[order.productId].maxTemp)
      }
    >
      Confirm Delivery
    </button>
  )}
  <button
    className="action-button track-button"
    onClick={() => setTrackingOrderId(order.orderId)}
  >
    Track
  </button>
</div>

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
     
          ) : (
            <p className="no-orders-message">No orders assigned.</p>
          )}
                  {Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) > 1 && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>Page {page}</span>
                <button
                  className="pagination-button"
                  disabled={page === Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}

{showReasonModal && (
  <div className="modal-overlay" onClick={() => setShowReasonModal(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <FontAwesomeIcon icon={faInfoCircle} className="modal-icon-big" />
      <h2 className="modal-title">Rejection Reason</h2>
      <div className="modal-message-big-card">
        {currentRejectionReason}
      </div>
      <button className="modal-close-button" onClick={() => setShowReasonModal(false)}>
        Close
      </button>
    </div>
  </div>
)}


        </>
      )}
    </div>
  );
};

export default DistributorOrdersPage;

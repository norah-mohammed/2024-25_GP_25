import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import RoleContract from './contracts/RoleContract.json';
import ProductContract from './contracts/ProductContract.json'; 
import "./ordersPage.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBoxOpen, faExclamationTriangle } from "@fortawesome/free-solid-svg-icons";
import TrackOrderPage from './TrackOrderPage';  // Import TrackOrderPage
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
import { faSearch } from "@fortawesome/free-solid-svg-icons";

import { sendEmailAlert } from './utils/emailUtils';



const ITEMS_PER_PAGE = 5;

const RetailerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // Filtered list of orders
  const [filter, setFilter] = useState('All'); // Current filter
    const [notification, setNotification] = useState('');
    const [search, setSearch] = useState('');
  
  const [orderContract, setOrderContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState({}); // Store products by productId
  const [invalidTempOrders, setInvalidTempOrders] = useState([]); // Track invalid temperature orders
  const [currentPage, setCurrentPage] = useState('orders');
  const [trackingOrderId, setTrackingOrderId] = useState(null);
  const [sortDirection, setSortDirection] = useState('desc'); // Default to newest first

  const [page, setPage] = useState(1);
const [currentRejectionReason, setCurrentRejectionReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);





  

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();

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

        fetchOrders(orderInstance, roleInstance);
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
    const interval = setInterval(() => {
      const activeOrders = orders.filter(
        (order) => order.status !== "Rejected due to Unsafe Temperature"
      );
  
      if (activeOrders.length > 0 && Object.keys(products).length > 0) {
        activeOrders.forEach((order) => handleTemperatureCheck(order));
      }
    }, 5000); // Check every 5 seconds
  
    return () => clearInterval(interval); // Cleanup on unmount
  }, [orders, products]);
  
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

   const fetchOrders = async (orderContract, roleContract) => {
    try {
        setLoading(true);
        const allOrders = await orderContract.methods.getAllOrders().call();

        const ordersWithManufacturerNames = await Promise.all(
            allOrders.map(async (order) => {
                let manufacturerName = 'N/A';
                if (order.manufacturer && order.manufacturer !== '0x0000000000000000000000000000000000000000') {
                    const manufacturer = await roleContract.methods.getManufacturer(order.manufacturer).call();
                    manufacturerName = manufacturer.name;
                }

                return {
                    ...order,
                    orderId: parseInt(order.orderId, 10),
                    productId: parseInt(order.productId, 10),
                    quantity: parseInt(order.quantity, 10),
                    deliveryInfo: order.deliveryInfo || {},
                    manufacturerName,
                    temperature: order.temperature ? parseInt(order.temperature, 10) : null, // Ensure temperature is included
                };
            })
        );

        // Sort orders by newest first
        const sortedOrders = ordersWithManufacturerNames.sort((a, b) => b.orderId - a.orderId);

        setOrders(sortedOrders);
        setFilteredOrders(sortedOrders);
    } catch (error) {
        console.error("Error fetching orders:", error);
    } finally {
        setLoading(false);
    }
};


const applyFilters = () => {
  let filtered = orders;
  if (filter === 'Running') {
    filtered = filtered.filter(order => order.status && !(
  /(completed|canceled)/i.test(order.status) ||
  order.status.toLowerCase().startsWith("rejected")));
  } else if (filter === 'Previous') {
    filtered = filtered.filter(order => order.status && (
  /(completed|canceled)/i.test(order.status) ||
  order.status.toLowerCase().startsWith("rejected")
)   );
  }

  if (search) {
    filtered = filtered.filter(order => 
      order.orderId.toString().includes(search) ||
      order.manufacturerName.toLowerCase().includes(search.toLowerCase()) ||
      order.status.toLowerCase().includes(search.toLowerCase())
    );
  }

  filtered.sort((a, b) => (sortDirection === 'asc' ? a.orderId - b.orderId : b.orderId - a.orderId));

  setFilteredOrders(filtered);
  setPage(1); // Reset to first page after filtering
};
 useEffect(() => {
    applyFilters();
  }, [orders, filter, search, sortDirection]);

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

  const handleShowRejectionReason = (reason) => {
    setCurrentRejectionReason(reason);
    setShowReasonModal(true);   };


  


  const showTemporaryNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 10000);
  };
  const handleTrackOrder = (orderId) => {
    console.log("Tracking order ID in parent:", orderId);
    setTrackingOrderId(orderId);
    setCurrentPage('trackOrder');
  };
  const handleRejectOrder = async (orderId) => {
    try {
      await orderContract.methods
        .updateOrderStatus(orderId, "Rejected due to Unsafe Temperature")
        .send({ from: account });
  
      // Update local state to reflect the status change
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.orderId === orderId
            ? { ...order, status: "Rejected due to Unsafe Temperature" }
            : order
        )
      );
  
      setFilteredOrders((prevFilteredOrders) =>
        prevFilteredOrders.map((order) =>
          order.orderId === orderId
            ? { ...order, status: "Rejected due to Unsafe Temperature" }
            : order
        )
      );
  
      showTemporaryNotification(`Order ${orderId} rejected due to unsafe temperature.`);
    } catch (error) {
      console.error(`Error rejecting order ${orderId}:`, error);
    }
  };
  const handleTemperatureCheck = async (order) => {
    const product = products[order.productId];
    if (!product) return;
  
    console.log(`Checking Order ${order.orderId}: Temp ${order.temperature}°C vs Range ${product.minTemp}°C - ${product.maxTemp}°C`);
    console.log(`Current Status: ${order.status}`);
  
    //  New Check: Skip if already rejected
    if (order.status === "Rejected due to Unsafe Temperature") {
      console.log(`Order ${order.orderId} already rejected. Skipping.`);
      return;  // Don't do anything
    }
  
    const isInvalidTemp = order.temperature < product.minTemp || order.temperature > product.maxTemp;
    const isStatusValidForRejection = ['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status);
  
    if (isInvalidTemp && isStatusValidForRejection) {
      console.log(`🚨 Order ${order.orderId}: Invalid temperature detected and status is valid for rejection.`);
      try {
        await fetch("http://localhost:3001/update-order-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId: order.orderId }),
        });
        await sendEmailAlert({
          orderId: order.orderId,
          temperature: order.temperature,
          minTemp: product.minTemp,
          maxTemp: product.maxTemp,
          status: "Rejected due to Unsafe Temperature",
        });
  
        const updatedOrders = orders.map((o) =>
          o.orderId === order.orderId
            ? { ...o, status: "Rejected due to Unsafe Temperature" }
            : o
        );
        setOrders(updatedOrders);
        window.dispatchEvent(new Event("refreshRetailerOrders"));

  
        const updatedFilteredOrders = filteredOrders.map((o) =>
          o.orderId === order.orderId
            ? { ...o, status: "Rejected due to Unsafe Temperature" }
            : o
        );
        setFilteredOrders(updatedFilteredOrders);
  
        showTemporaryNotification(`Order ${order.orderId} was rejected due to unsafe temperature.`);
        const combinedMessage = `❌ Order ${order.orderId} was rejected due to unsafe temperature (Detected: ${order.temperature}°C, Allowed: ${product.minTemp}°C–${product.maxTemp}°C).`;

const dismissed = localStorage.getItem('dismissedNotifications');
const dismissedList = dismissed ? JSON.parse(dismissed) : [];

if (!dismissedList.includes(combinedMessage)) {
  showTemporaryNotification(combinedMessage);
  // Optionally store dismissed message if user dismisses
  localStorage.setItem('dismissedNotifications', JSON.stringify([...dismissedList, combinedMessage]));
}

  
        setInvalidTempOrders((prevInvalidOrders) => [...prevInvalidOrders, order]);
      } catch (error) {
        console.error(`Error rejecting order ${order.orderId}:`, error);
      }
    }
  };
  
  
useEffect(() => {
  const interval = setInterval(() => {
    const activeOrders = orders.filter(
      (order) => order.status !== "Rejected due to Unsafe Temperature"
    );

    if (activeOrders.length > 0 && Object.keys(products).length > 0) {
      activeOrders.forEach((order) => handleTemperatureCheck(order));
    }
  }, 5000); // Check every 5 seconds

  return () => clearInterval(interval); // Cleanup on unmount
}, [orders, products]);

  if (currentPage === 'trackOrder' && trackingOrderId) {
    return <TrackOrderPage orderId={trackingOrderId} goBack={() => setCurrentPage('orders')} />;
  }
  
  return (
    <div className="ordersSection">
        
     
      <h2>Orders</h2>
      <div className="new-search-filter-wrapper">
  <div className="new-search-filter-top">
    <div className="new-search-bar">
      <FontAwesomeIcon icon={faSearch} className="new-search-icon" />
      <input
        type="text"
        className="new-search-input"
        placeholder="Search by Order ID, Manufacturer, or Status..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          applyFilters();
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
          applyFilters();
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
     
{loading ? (
  <p className="loading-message">Loading orders...</p>
) : filteredOrders.length > 0 ? (
  <>
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
          <th className="header-cell">Temperature</th>
          <th className="header-cell">Actions</th>
        </tr>
      </thead>
      <tbody>
        {filteredOrders.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((order, index) => (
          <tr key={index}>
            <td>{order.orderId}</td>
            <td>{order.quantity}</td>
            <td>{order.deliveryInfo.deliveryDate || 'N/A'}</td>
            <td>{order.deliveryInfo.deliveryTime || 'N/A'}</td>
            <td>{order.deliveryInfo.shippingAddress || 'N/A'}</td>
            <td>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
      {order.status}
    </span>

    {order.rejectionReason && (
      <button
        onClick={() => handleShowRejectionReason(order.rejectionReason)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#1d4ed8',
          fontSize: '18px', // a little bigger
          padding: '0',
        }}
        title="View Rejection Reason"
      >
        <FontAwesomeIcon icon={faInfoCircle} />
      </button>
    )}
  </div>
</td>

            <td>{order.manufacturerName}</td>
            <td>
  {['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status) ? (
    order.temperature !== null && order.temperature !== undefined ? (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{order.temperature}°C</span>
        {products[order.productId] ? (
          order.temperature >= products[order.productId].minTemp && order.temperature <= products[order.productId].maxTemp ? (
            <span style={{ color: 'green', fontWeight: 'bold' }}>Valid</span>
          ) : (
            <span style={{ color: 'red', fontWeight: 'bold' }}>Invalid</span>
          )
        ) : (
          <span style={{ color: 'orange' }}>Loading...</span>
        )}
      </div>
    ) : (
      <span style={{ color: 'gray' }}>No Data</span>
    )
  ) : (
    'Not Applicable'
  )}
</td>

            <td>
            <button
    className="action-button track-button"
    onClick={() => handleTrackOrder(order.orderId)}
  >
    Track
  </button>            </td>
          </tr>
        ))}
</tbody>
</table>

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

{/* 👇 Now we open a fragment */}
<>

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

</>
) : (
  <p className="no-orders-message">No orders available.</p>
)}



    </div>
  );
};

export default RetailerOrdersPage;
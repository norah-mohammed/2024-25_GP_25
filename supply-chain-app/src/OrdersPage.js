import React, { useEffect, useState, useRef } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import RoleContract from './contracts/RoleContract.json';
import './ordersPage.css';
import ProductContract from './contracts/ProductContract.json'; 
import TrackOrderPage from './TrackOrderPage'; // Import TrackOrderPage
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExclamationTriangle, faInfoCircle, faSearch } from "@fortawesome/free-solid-svg-icons";



const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]); // For filtered data
  const [filter, setFilter] = useState('All'); // Current filter
  const [trackingOrderId, setTrackingOrderId] = useState(null); // Order ID to track
  const [orderContract, setOrderContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [distributors, setDistributors] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const selectDistributorRef = useRef(null);
  const [productContract, setProductContract] = useState(null);
  const [products, setProducts] = useState({}); // Store products by productId
  const [invalidTempOrders, setInvalidTempOrders] = useState([]); // Track invalid temperature orders
  const [currentPage, setCurrentPage] = useState('orders');
  const [search, setSearch] = useState('');
  const [sortDirection, setSortDirection] = useState('desc');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [showReasonModal, setShowReasonModal] = useState(false);
const [currentRejectionReason, setCurrentRejectionReason] = useState('');


  

  

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();
  
        const accounts = await web3Instance.eth.getAccounts();
        setAccount(accounts[0]);
  
        const networkId = await web3Instance.eth.net.getId();
  
        const orderDeployedNetwork = OrderContract.networks[networkId];
        const roleDeployedNetwork = RoleContract.networks[networkId];
        const productDeployedNetwork = ProductContract.networks[networkId];
  
        const orderInstance = new web3Instance.eth.Contract(
          OrderContract.abi,
          orderDeployedNetwork && orderDeployedNetwork.address
        );
        const roleInstance = new web3Instance.eth.Contract(
          RoleContract.abi,
          roleDeployedNetwork && roleDeployedNetwork.address
        );
        const productInstance = new web3Instance.eth.Contract(
          ProductContract.abi,
          productDeployedNetwork && productDeployedNetwork.address
        );
  
        setOrderContract(orderInstance);
        setRoleContract(roleInstance);
        setProductContract(productInstance);
  
        // Fetch orders after initializing contracts
        fetchOrders(orderInstance, accounts[0], roleInstance);
      } catch (error) {
        console.error('Error initializing Web3 or contracts:', error);
      }
    };
  
    initWeb3();
  }, []);
  
  // Fetch product details and update state
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productContract || orders.length === 0) return;
  
      try {
        const productDetails = {};
        const productFetchPromises = orders.map(async (order) => {
          if (order.productId) {
            const product = await productContract.methods.getProductById(order.productId).call();
            productDetails[order.productId] = {
              minTemp: parseInt(product.minTemp, 10),
              maxTemp: parseInt(product.maxTemp, 10),
            };
          }
        });
  
        await Promise.all(productFetchPromises);
        setProducts(productDetails);
      } catch (error) {
        console.error('Error fetching product details:', error);
      }
    };
  
    fetchProductDetails();
  }, [orders, productContract]);
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
    
  // Fetch orders and include distributor information
  const fetchOrders = async (orderContract, account, roleContract) => {
    try {
      setLoading(true);
      const allOrders = await orderContract.methods.getAllOrders().call({ from: account });
  
      const ordersWithDetails = await Promise.all(
        allOrders.map(async (order) => {
          let distributorName = 'Not Assigned';
          if (order.distributor && order.distributor !== '0x0000000000000000000000000000000000000000') {
            const distributor = await roleContract.methods.getDistributor(order.distributor).call();
            distributorName = distributor.name;
          }
  
          return {
            ...order,
            distributorName,
            temperature: order.temperature || null,
            rejectionReason: order.rejectionReason || '',
          };
        })
      );
  
      setOrders(ordersWithDetails);
      setFilteredOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const filterOrders = (filterType) => {
    applyFilters(orders, filterType);
    setFilter(filterType);
    
  };
  const applyFilters = (ordersList, filterValue = filter, searchValue = search, sortValue = sortDirection) => {
    let filtered = [...ordersList];
  
    // Filter
    if (filterValue === 'Running') {
      filtered = filtered.filter(order =>
order.status && !(
  /(completed|canceled)/i.test(order.status) ||
  order.status.toLowerCase().startsWith("rejected")
)
      );
    } else if (filterValue === 'Previous') {
      filtered = filtered.filter(order =>
order.status && (
  /(completed|canceled)/i.test(order.status) ||
  order.status.toLowerCase().startsWith("rejected")
)
      );
    }
  
    // Search
    if (searchValue) {
      filtered = filtered.filter(order =>
        order.orderId.toString().includes(searchValue) ||
        (order.distributorName && order.distributorName.toLowerCase().includes(searchValue.toLowerCase())) ||
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
  
  const handleShowRejectionReason = (reason) => {
    setCurrentRejectionReason(reason);
    setShowReasonModal(true);
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
  const showTemporaryNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 10000);
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
  const handleTrackOrder = (orderId) => {
    console.log("Tracking order ID:", orderId);
    setTrackingOrderId(orderId);
    setCurrentPage('trackOrder');
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
    console.log(` Order ${order.orderId}: Invalid temperature detected and status is valid for rejection.`);
    try {
      await fetch("http://localhost:3001/update-order-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId: order.orderId }),
      });
  
      await fetch("http://localhost:5000/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.orderId,
          temperature: order.temperature,
          minTemp: product.minTemp,
          maxTemp: product.maxTemp,
          status: "Rejected due to Unsafe Temperature",
        }),
      });
  
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
        placeholder="Search by Order ID, Status, or Distributor..."
        value={search}
        onChange={e => {
          setSearch(e.target.value);
          applyFilters(orders, filter, e.target.value, sortDirection);
        }}
      />
    </div>

    <div className="new-filter-tabs">
  <button onClick={() => filterOrders('All')} className={`filter-button ${filter === 'All' ? 'active' : ''}`}>All</button>
  <button onClick={() => filterOrders('Running')} className={`filter-button ${filter === 'Running' ? 'active' : ''}`}>Running</button>
  <button onClick={() => filterOrders('Previous')} className={`filter-button ${filter === 'Previous' ? 'active' : ''}`}>Previous</button>
  <button onClick={() => {
    const newSort = sortDirection === 'asc' ? 'desc' : 'asc';
    setSortDirection(newSort);
    applyFilters(orders, filter, search, newSort);
  }} className="filter-button">
    {sortDirection === 'asc' ? 'Sort by Oldest' : 'Sort by Newest'}
  </button>
</div>


  </div>
</div>



          {notification && <div className="notification">{notification}</div>}

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
            <p>Loading orders...</p>
          ) : (
            <table border="1">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Quantity</th>
                  <th>Delivery Date</th>
                  <th>Delivery Time</th>
                  <th>Shipping Address</th>
                  <th>Status</th>
                  <th>Distributor</th>
                  <th>Temperature</th> {/* New Column for Temperature */}
                  <th>Actions</th>
                </tr>
              </thead><tbody>
  {filteredOrders.length > 0 ? (
    filteredOrders
      .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
      .map((order, index) => (
        <tr key={index}>
          <td>{parseInt(order.orderId)}</td>
          <td>{parseInt(order.quantity)}</td>
          <td>{order.deliveryInfo.deliveryDate}</td>
          <td>{order.deliveryInfo.deliveryTime}</td>
          <td>{order.deliveryInfo.shippingAddress}</td>
          <td style={{ alignItems: "center" }}>
  <span className={`status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
    {order.status}
  </span>

  {/* Show info icon if rejected */}
  {['Rejected by Retailer', 'Rejected by Distributor', 'Rejected by Manufacturer'].includes(order.status) && order.rejectionReason && (
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



          <td>{order.distributorName}</td>
        <td>
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
</td><td>
<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
  <button className="action-button track-button" onClick={() => handleTrackOrder(order.orderId)}>Track Order</button>

  {order.status === 'Paid' && (
    <button className="action-button prepare-button" onClick={() => handleCreateOrder(order.orderId)}>Prepare Order</button>
  )}

  {['Preparing for Dispatch', 'Rejected by Distributor'].includes(order.status) && (
    <>
      <button className="action-button assign-button" onClick={() => handleAssignDistributorClick(order)}>Assign Distributor</button>
      <button className="action-button cancel-button" onClick={() => handleCancelOrder(order.orderId)}>Cancel</button>
    </>
  )}
</div>




</td>


      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="10">No orders found.</td>
    </tr>
  )}
   </tbody>
            </table>
            
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


              {showPopup && (
  <div className="modal-overlay" onClick={() => setShowPopup(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      <h2 className="modal-title">Assign Distributor</h2>

      <div className="distributor-list">
  {distributors.map((distributor) => (
    <div className="distributor-card" key={distributor.ethAddress}>
      <span className="distributor-name">{distributor.name}</span>
      <button className="select-button" onClick={() => handleAssignDistributor(distributor.ethAddress)}>
        Assign
      </button>
    </div>
  ))}
</div>


      <button
        onClick={() => setShowPopup(false)}
        style={{
          marginTop: '20px',
          backgroundColor: 'transparent',
          color: '#28a745',
          border: '2px solid #28a745',
          padding: '10px 24px',
          borderRadius: '999px',
          fontSize: '14px',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
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



    </div>
  );
};

export default OrdersPage;

import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import OrderContract from './contracts/OrderContract.json';
import "./trackOrderPage.css";

const TrackOrderPage = ({ goBack, orderId }) => {

  const [orderDetails, setOrderDetails] = useState({
    orderId: '',
    status: '',
    orderHistory: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();

        const accounts = await web3Instance.eth.getAccounts();

        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = OrderContract.networks[networkId];
        if (!deployedNetwork) {
          throw new Error("Contract not deployed on this network.");
        }

        const contractInstance = new web3Instance.eth.Contract(
          OrderContract.abi,
          deployedNetwork.address
        );
        fetchOrderDetails(contractInstance, orderId, accounts[0]);
      } catch (error) {
        console.error("Error initializing Web3:", error);
        setLoading(false);
      }
    };

    if (orderId) {
      initWeb3();
    } else {
      console.error("Invalid Order ID received.");
      setLoading(false);
    }
  }, [orderId]);

  const fetchOrderDetails = async (contract, orderId, account) => {
    setLoading(true);
    try {
      const order = await contract.methods.getOrderById(orderId).call({ from: account });
      if (!order || order.orderId === "0") {
        throw new Error("No order found in contract.");
      }
      setOrderDetails({
        orderId: order.orderId.toString(), // Convert orderId to string
        status: order.status,
        orderHistory: parseOrderHistory(order.orderHistory),
      });
    } catch (error) {
      console.error("Error fetching order details:", error.message || error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
};


  const parseOrderHistory = (historyString) => {
    if (!historyString) return [];
    return historyString.split(',').reduce((acc, entry, index, array) => {
      if (index % 2 === 0) { // Timestamp entries
        const date = new Date(parseInt(entry) * 1000);
        acc.push({
          date: date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          status: array[index + 1] || 'N/A'
        });
      }
      return acc;
    }, []);
  };

  const renderOrderHistory = () => (
    orderDetails.orderHistory.map((item, index, array) => {
      const isLastItem = index === array.length - 1;
      const statusClass = item.status.toLowerCase().includes('rejected') || item.status.toLowerCase().includes('canceled')
        ? 'rejected'
        : '';
  
      return (
        <li className={`rb-item ${statusClass} ${isLastItem && statusClass ? 'last-item' : ''}`} key={index}>
          <div className="timestamp">{item.date} at {item.time}</div>
          <div className="item-title">{item.status}</div>
        </li>
      );
    })
  );
  const getStatusClass = (status) => {
    if (!status) return 'yellow';
    const s = status.toLowerCase();
    if (s.includes('rejected') || s.includes('unsafe') || s.includes('canceled')) return 'red';
    if (s.includes('pending') || s.includes('waiting')) return 'yellow';
    return 'green';
  };
  
  

  return (
    <div className="trackOrderPage">
              <h1 className="page-title">Track Order</h1>

  <div className="container">
        <p className="order-id">Order ID: {orderDetails.orderId || "N/A"}</p>
        <div className={`status-box ${getStatusClass(orderDetails.status)}`}>
  <span className="status-label">Current Status:</span>
  <span className="status-value">{orderDetails.status || "N/A"}</span>
</div>

        <div className="rightbox">
          <div className="rb-container">
            {loading ? (
              <p className="loading-message">Loading order history...</p>
            ) : (
              <ul className="rb">{renderOrderHistory()}</ul>
            )}
          </div>
        </div>
        <button onClick={goBack} className="back-button">Back</button>
      </div>
    </div>
  );
};

export default TrackOrderPage;

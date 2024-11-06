import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json'; // Assuming retailer info is stored in the RoleContract
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';

const RetailerHomePage = () => {
    const [web3, setWeb3] = useState(null);
    const [roleContract, setRoleContract] = useState(null);
    const [orderContract, setOrderContract] = useState(null);
    const [productContract, setProductContract] = useState(null);
    const [account, setAccount] = useState('');
    const [retailer, setRetailer] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [notification, setNotification] = useState(''); // Define notification state here


    useEffect(() => {
        const init = async () => {
            try {
                const web3 = await getWeb3();
                const accounts = await web3.eth.getAccounts();
                const networkId = await web3.eth.net.getId();
                const deployedNetworkRole = RoleContract.networks[networkId];
                const deployedNetworkOrder = OrderContract.networks[networkId];
                const deployedNetworkProduct = ProductContract.networks[networkId];

                const instanceRole = new web3.eth.Contract(
                    RoleContract.abi,
                    deployedNetworkRole && deployedNetworkRole.address,
                );
                const instanceOrder = new web3.eth.Contract(
                    OrderContract.abi,
                    deployedNetworkOrder && deployedNetworkOrder.address,
                );
                const instanceProduct = new web3.eth.Contract(
                    ProductContract.abi,
                    deployedNetworkProduct && deployedNetworkProduct.address,
                );

                setWeb3(web3);
                setAccount(accounts[0]);
                setRoleContract(instanceRole);
                setOrderContract(instanceOrder);
                setProductContract(instanceProduct);
            } catch (error) {
                alert(`Failed to load web3, accounts, or contract. Check console for details.`);
                console.error(error);
            }
        };

        init();
    }, []);

    useEffect(() => {
        if (roleContract && account) {
            fetchRetailerDetails();
        }
        if (orderContract && account && productContract) {
            fetchOrders();
        }
    }, [roleContract, orderContract, productContract, account]);

    const fetchRetailerDetails = async () => {
        setLoading(true);
        try {
            const details = await roleContract.methods.getRetailer(account).call();
            setRetailer({
                name: details.name,
                address: details.physicalAddress,
                email: details.email
            });
        } catch (error) {
            console.error("Error fetching retailer details:", error);
            setErrorMessage("Failed to fetch retailer details. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
      setLoading(true);
      try {
          const ordersList = await orderContract.methods.getAllOrders().call();
          const filteredOrders = ordersList.filter(order => order.status === "Waiting for payment");
          const ordersWithProducts = await Promise.all(filteredOrders.map(async order => {
              const product = await productContract.methods.getProductById(order.productId).call();
              const quantity = Number(order.quantity); // Convert quantity to Number
              const productPrice = Number(product.price);
              const totalPrice = quantity * productPrice;
              return {
                  ...order,
                  orderId: order.orderId.toString(), // Ensure orderId is a string
                  productId: order.productId.toString(), // Ensure productId is a string
                  quantity: order.quantity.toString(), // Convert BigNumber to string
                  productName: product.name,
                  productPrice: productPrice, // Product price in Ether
                  totalPrice: totalPrice
              };
          }));
          setOrders(ordersWithProducts);
      } catch (error) {
          console.error("Error fetching orders:", error);
          setErrorMessage("Failed to fetch orders. Please try again later.");
      } finally {
          setLoading(false);
      }
  };
  
  
  

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
        await orderContract.methods.updateOrderStatus(orderId, newStatus).send({ from: account });
        
        // Check the newStatus and set a notification message accordingly
        let message = '';
        if (newStatus === 'Paid') {
            message = `Payment for order ${orderId} was successful.`;
        } else if (newStatus === 'Canceled') {
            message = `Order ${orderId} has been successfully canceled.`;
        }

        setNotification(message);  // Set the notification message
        setTimeout(() => setNotification(''), 5000);  // Clear notification after 5 seconds
        
        fetchOrders();  // Refresh the orders list to reflect the update
    } catch (error) {
        console.error("Error updating order status:", error);
        setErrorMessage(`Failed to update order status to ${newStatus}. Please try again later.`);
    }
};


    if (loading) return <p>Loading...</p>;
    if (errorMessage) return <p>{errorMessage}</p>;

    return (
      <div>
          <h1>Retailer Details</h1>
          {notification && <div style={{ color: 'green', marginTop: '10px' }}>{notification}</div>}  
          {retailer.name ? (
              <>
                  <p><strong>Name:</strong> {retailer.name}</p>
                  <p><strong>Address:</strong> {retailer.address}</p>
                  <p><strong>Email:</strong> {retailer.email}</p>
              </>
          ) : (
              <p>No retailer details found or waiting for data.</p>
          )}
          <h2>Orders Awaiting Payment</h2>
          {orders.length > 0 ? (
              <table border={1}>
                  <thead>
                      <tr>
                          <th>Order ID</th>
                          <th>Product ID</th>
                          <th>Product Name</th>
                          <th>Quantity</th>
                          <th>Total Price</th>
                          <th>Delivery Date</th>
                          <th>Delivery Time</th>
                          <th>Actions</th>
                      </tr>
                  </thead>
                  <tbody>
                      {orders.map(order => (
                          <tr key={order.orderId}>
                              <td>{order.orderId}</td>
                              <td>{order.productId}</td>
                              <td>{order.productName}</td>
                              <td>{order.quantity}</td>
                              <td>{order.totalPrice} SAR</td>
                              <td>{order.deliveryInfo.deliveryDate}</td>
                              <td>{order.deliveryInfo.deliveryTime}</td>
                              <td>
                                  <button onClick={() => updateOrderStatus(order.orderId, 'Paid')}>Pay</button>
                                  <button onClick={() => updateOrderStatus(order.orderId, 'Canceled')}>Cancel</button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          ) : (
              <p>No orders waiting for payment.</p>
          )}
      </div>
  );
  
};

export default RetailerHomePage;

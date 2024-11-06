import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';

const ManufacturerHomePage = () => {
    const [web3, setWeb3] = useState(null);
    const [roleContract, setRoleContract] = useState(null);
    const [orderContract, setOrderContract] = useState(null);
    const [productContract, setProductContract] = useState(null);
    const [account, setAccount] = useState('');
    const [manufacturer, setManufacturer] = useState({});
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [notification, setNotification] = useState('');  // State to manage success/error notifications

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
            fetchManufacturerDetails();
        }
        if (orderContract && account && productContract) {
            fetchOrders();
        }
    }, [roleContract, orderContract, productContract, account]);

    const fetchManufacturerDetails = async () => {
        setLoading(true);
        try {
            const details = await roleContract.methods.getManufacturer(account).call();
            const formattedDetails = {
                ethAddress: details.ethAddress,
                name: details.name,
                addressLine: details.addressLine,
                phoneNumber: details.phoneNumber,
                email: details.email
            };
            setManufacturer(formattedDetails);
        } catch (error) {
            console.error("Error fetching manufacturer details:", error);
            setErrorMessage("Failed to fetch manufacturer details. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const ordersList = await orderContract.methods.getOrdersByManufacturer(account).call();
            const filteredOrders = ordersList.filter(order => order.status === "Waiting for manufacturer acceptance");
    
            const ordersWithProducts = await Promise.all(filteredOrders.map(async order => {
                const product = await productContract.methods.getProductById(order.productId).call();
                return {
                    ...order,
                    productId: order.productId.toString(),
                    orderId: order.orderId.toString(),
                    quantity: order.quantity.toString(),
                    productName: product.name,
                    productDescription: product.description,
                    transportMode: product.transportMode,
                    deliveryDate: order.deliveryInfo.deliveryDate,
                    deliveryTime: order.deliveryInfo.deliveryTime,
                    shippingAddress: order.deliveryInfo.shippingAddress,
                 
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
        
        // Determine the message based on the newStatus
        let successMessage = "";
        if (newStatus === "Waiting for payment") {
            successMessage = `Order ${orderId} has been successfully accepted.`;
        } else if (newStatus === "Rejected by manufacturer") {
            successMessage = `Order ${orderId} has been successfully rejected.`;
        } else {
            successMessage = `Order ${orderId} status updated to ${newStatus}.`;
        }
        
        setNotification(successMessage);  // Set the appropriate success notification
        setTimeout(() => setNotification(''), 5000);  // Clear notification after 5 seconds
        
        fetchOrders();  // Refresh orders after the update to reflect changes
    } catch (error) {
        console.error("Error updating order status:", error);
        setErrorMessage(`Failed to update order status to ${newStatus}. Please try again later.`);
    }
};


    if (loading) return <p>Loading...</p>;
    if (errorMessage) return <p>{errorMessage}</p>;

    return (
        <div>
            <h1>Manufacturer Details</h1>
            {manufacturer && manufacturer.name ? (
                <>
                    <p><strong>Name:</strong> {manufacturer.name}</p>
                    <p><strong>Address:</strong> {manufacturer.addressLine}</p>
                    <p><strong>Phone:</strong> {manufacturer.phoneNumber}</p>
                    <p><strong>Email:</strong> {manufacturer.email}</p>
                </>
            ) : (
                <p>No manufacturer details found or waiting for data.</p>
            )}
            <h2>Orders</h2>
            {notification && <div style={{ color: 'green', marginTop: '10px' }}>{notification}</div>}
            {orders.length > 0 ? (
                <table border="1">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Product ID</th>
                            <th>Product Name</th>
                            <th>Quantity</th> 
                            <th>Delivery Date</th>
                            <th>Delivery Time</th>
                            <th>Shipping Address</th> {/* Assuming you want to show this as well */}
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
                                <td>{order.deliveryDate}</td>
                                <td>{order.deliveryTime}</td>
                                <td>{order.shippingAddress}</td>
                                <td>
                                    <button onClick={() => updateOrderStatus(order.orderId, 'Waiting for payment')}>Accept</button>
                                    <button onClick={() => updateOrderStatus(order.orderId, 'Rejected by manufacturer')}>Reject</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No orders found.</p>
            )}
        </div>
    );
    
  
};

export default ManufacturerHomePage;


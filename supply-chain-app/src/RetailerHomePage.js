import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json';
import './RetailerHomePage.css';

const RetailerHomePage = () => {
    const [web3, setWeb3] = useState(null);
    const [roleContract, setRoleContract] = useState(null);
    const [orderContract, setOrderContract] = useState(null);
    const [productContract, setProductContract] = useState(null);
    const [account, setAccount] = useState('');
    const [retailer, setRetailer] = useState({});
    const [orders, setOrders] = useState([]);
    const [deliveredOrders, setDeliveredOrders] = useState([]); // New state for delivered orders
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [notification, setNotification] = useState('');

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
                email: details.email,
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

            const awaitingPaymentOrders = ordersList.filter((order) => order.status === 'Waiting for payment');
            const deliveredOrders = ordersList.filter((order) => order.status === 'Delivered to Retailer');

            const processedAwaitingPaymentOrders = await Promise.all(
                awaitingPaymentOrders.map(async (order) => {
                    const product = await productContract.methods.getProductById(order.productId).call();
                    const quantity = Number(order.quantity);
                    const productPrice = Number(product.price);
                    const totalPrice = quantity * productPrice;

                    return {
                        ...order,
                        orderId: parseInt(order.orderId),
                        productId: parseInt(order.productId),
                        quantity: parseInt(order.quantity),
                        productName: product.name,
                        productPrice: productPrice,
                        totalPrice: totalPrice,
                    };
                })
            );

            const processedDeliveredOrders = deliveredOrders.map((order) => ({
                ...order,
                orderId: parseInt(order.orderId),
                productId: parseInt(order.productId),
                quantity: parseInt(order.quantity),
            }));

            setOrders(processedAwaitingPaymentOrders);
            setDeliveredOrders(processedDeliveredOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setErrorMessage('Failed to fetch orders. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await orderContract.methods.updateOrderStatus(orderId, newStatus).send({ from: account });

            let message = '';
            if (newStatus === 'Paid') {
                message = `Payment for order ${orderId} was successful.`;
            } else if (newStatus === 'Canceled') {
                message = `Order ${orderId} has been canceled.`;
            } else if (newStatus === 'Completed') {
                message = `Order ${orderId} has been accepted.`;
            } else if (newStatus === 'Rejected by Retailer') {
                message = `Order ${orderId} has been rejected.`;
            }

            setNotification(message);
            setTimeout(() => setNotification(''), 3000);
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            setErrorMessage(`Failed to update order status to ${newStatus}. Please try again later.`);
        }
    };

    if (loading) return <p>Loading...</p>;
    if (errorMessage) return <p>{errorMessage}</p>;

    return (
        <div className="container">
            <div className="retailer-info">
                <h2>{retailer.name}</h2>
                <p><strong>Address:</strong> {retailer.address}</p>
                <p><strong>Phone:</strong> {retailer.phoneNumber}</p>
                <p><strong>Email:</strong> {retailer.email}</p>
            </div>

            <h2>Orders Awaiting Payment</h2>
            {notification && <div className="notification">{notification}</div>}
            <div className="orders-section">
                {orders.length > 0 ? (
                    orders.map(order => (
                        <div className="order-card" key={order.orderId}>
                            <p><strong>Total Price:</strong> {order.totalPrice} SAR</p>
                            <p><strong>Order ID:</strong> {order.orderId}</p>
                            <p><strong>Product Name:</strong> {order.productName}</p>
                            <p><strong>Quantity:</strong> {order.quantity}</p>
                            <p><strong>Delivery Date</strong>{order.deliveryInfo.deliveryDate}</p>
                            <p><strong>Delivery Time</strong> {order.deliveryInfo.deliveryTime}</p>

                            <div className="actions">
                                <button onClick={() => updateOrderStatus(order.orderId, 'Paid')}>Pay</button>
                                <button onClick={() => updateOrderStatus(order.orderId, 'Canceled')}>Cancel</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No orders awaiting payment.</p>
                )}
            </div>

            <h2>Delivered Orders</h2>
            <div className="orders-section">
                {deliveredOrders.length > 0 ? (
                    deliveredOrders.map(order => (
                        <div className="order-card" key={order.orderId}>
                            <p><strong>Order ID:</strong> {order.orderId}</p>
                            <p><strong>Product ID:</strong> {order.productId}</p>
                            <p><strong>Quantity:</strong> {order.quantity}</p>
                            <p><strong>Delivery Date:</strong> {order.deliveryInfo?.deliveryDate}</p>
                            <p><strong>Delivery Time:</strong> {order.deliveryInfo?.deliveryTime}</p>
                            <div className="actions">
                                <button onClick={() => updateOrderStatus(order.orderId, 'Completed')}>Accept</button>
                                <button onClick={() => updateOrderStatus(order.orderId, 'Rejected by Retailer')}>Reject</button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p>No delivered orders available.</p>
                )}
            </div>
        </div>
    );
};

export default RetailerHomePage;

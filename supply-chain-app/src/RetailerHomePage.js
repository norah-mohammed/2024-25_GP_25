import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
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
    const [deliveredOrders, setDeliveredOrders] = useState([]);
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
                    deployedNetworkRole && deployedNetworkRole.address
                );
                const instanceOrder = new web3.eth.Contract(
                    OrderContract.abi,
                    deployedNetworkOrder && deployedNetworkOrder.address
                );
                const instanceProduct = new web3.eth.Contract(
                    ProductContract.abi,
                    deployedNetworkProduct && deployedNetworkProduct.address
                );

                setWeb3(web3);
                setAccount(accounts[0]);
                setRoleContract(instanceRole);
                setOrderContract(instanceOrder);
                setProductContract(instanceProduct);
            } catch (error) {
                alert('Failed to load web3, accounts, or contract. Check console for details.');
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
            console.error('Error fetching retailer details:', error);
            setErrorMessage('Failed to fetch retailer details. Please try again later.');
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
        <div>
            <h1>Retailer Details</h1>
            {notification && <div style={{ color: 'green', marginTop: '10px' }}>{notification}</div>}
            {retailer.name ? (
                <>
                    <p>
                        <strong>Name:</strong> {retailer.name}
                    </p>
                    <p>
                        <strong>Address:</strong> {retailer.address}
                    </p>
                    <p>
                        <strong>Email:</strong> {retailer.email}
                    </p>
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
                            <th>Product Name</th>
                            <th>Quantity</th>
                            <th>Total Price</th>
                            <th>Delivery Date</th>
                            <th>Delivery Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.orderId}>
                                <td>{order.orderId}</td>
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

            <h2>Delivered Orders</h2>
            {deliveredOrders.length > 0 ? (
                <table border={1}>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Product ID</th>
                            <th>Quantity</th>
                            <th>Delivery Date</th>
                            <th>Delivery Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {deliveredOrders.map((order) => (
                            <tr key={order.orderId}>
                                <td>{order.orderId}</td>
                                <td>{order.productId}</td>
                                <td>{order.quantity}</td>
                                <td>{order.deliveryInfo.deliveryDate}</td>
                                <td>{order.deliveryInfo.deliveryTime}</td>
                                <td>
                                    <button onClick={() => updateOrderStatus(order.orderId, 'Completed')}>Accept</button>
                                    <button onClick={() => updateOrderStatus(order.orderId, 'Rejected by Retailer')}>
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No delivered orders available.</p>
            )}
        </div>
    );
};

export default RetailerHomePage;

import React, { useEffect, useState } from 'react';
import Sidebar from './sidebar';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import ManufacturerHomePage from './ManufacturerHomePage';
import RetailerHomePage from './RetailerHomePage';
import DistributorHomePage from './DistributorHomePage';
import DistributorOrdersPage from './DistributorOrdersPage';
import Manufacturer from './Manufacturer';
import ViewManufacturers from './ViewManufacturers';
import ManufacturerProducts from './ManufacturerProducts';
import PlaceOrder from './PlaceOrder';
import NonUserPage from './NonUserPage';
import OrdersPage from './OrdersPage';
import ManufacturerDistributorsPage from './ManufacturerDistributorsPage';
import RetailerOrders from './RetailerOrders';
import TrackOrderPage from './TrackOrderPage'; // Import TrackOrderPage
import OrderContract from './contracts/OrderContract.json';
import ProductContract from './contracts/ProductContract.json'; 
import './App.css';

const App = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(null); // State for tracking order ID
  const [products, setProducts] = useState({}); // Store products by productId
  const [orders, setOrders] = useState([]);
  const [invalidTempOrders, setInvalidTempOrders] = useState([]); // Track invalid temperature orders
   const [orderContract, setOrderContract] = useState(null);
    const [roleContract, setRoleContract] = useState(null);
    const [productContract, setProductContract] = useState(null);


  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);
        initAccountAndRole(web3Instance);
      } catch (error) {
        console.error('Failed to load web3, accounts, or contract.', error);
      }
    };

    initWeb3();const fetchOrdersAndProducts = async (orderContract, productContract, account) => {
      try {
        const allOrders = await orderContract.methods.getAllOrders().call({ from: account });
  
        const productDetails = {};
        const productFetchPromises = allOrders.map(async (order) => {
          if (order.productId) {
            const product = await productContract.methods.getProductById(order.productId).call();
            productDetails[order.productId] = {
              minTemp: parseInt(product.minTemp, 10),
              maxTemp: parseInt(product.maxTemp, 10),
            };
          }
        });
  
        await Promise.all(productFetchPromises);
  
        const invalidOrders = allOrders.filter((order) => {
          const product = productDetails[order.productId];
          return (
            product &&
            ['Accepted by Distributor', 'In Transit', 'Delivered to Retailer'].includes(order.status) &&
            (order.temperature < product.minTemp || order.temperature > product.maxTemp)
          );
        });
  
        setOrders(allOrders);
        setInvalidTempOrders(invalidOrders);
      } catch (error) {
        console.error('Error fetching orders or products:', error);
      }
    };
  
    

    const accountChangedHandler = (accounts) => {
      if (accounts.length === 0) {
        console.log('Please connect to MetaMask.');
      } else {
        setAccount(accounts[0]);
        initAccountAndRole(web3);
      }
    };

    window.ethereum.on('accountsChanged', accountChangedHandler);

    return () => {
      window.ethereum.removeListener('accountsChanged', accountChangedHandler);
    };
  }, []);

  const initAccountAndRole = async (web3Instance) => {
    try {
      setLoading(true);
      const accounts = await web3Instance.eth.getAccounts();
      if (!accounts[0]) throw new Error('No account found.');
      setAccount(accounts[0]);

      const networkId = await web3Instance.eth.net.getId();
      const deployedNetwork = RoleContract.networks[networkId];
      if (!deployedNetwork) {
        throw new Error('RoleContract not deployed on the selected network');
      }

      const roleInstance = new web3Instance.eth.Contract(RoleContract.abi, deployedNetwork.address);

      const isManufacturer = await roleInstance.methods.checkManufacturer(accounts[0]).call();
      const isRetailer = await roleInstance.methods.checkRetailer(accounts[0]).call();
      const isDistributor = await roleInstance.methods.checkDistributor(accounts[0]).call();

      if (isManufacturer) {
        setRole('manufacturer');
        setCurrentPage('manufacturerHomePage');
      } else if (isRetailer) {
        setRole('retailer');
        setCurrentPage('retailerHomePage');
      } else if (isDistributor) {
        setRole('distributor');
        setCurrentPage('distributorHomePage');
      } else {
        setRole('nonUser');
        setCurrentPage('nonUserPage');
      }
    } catch (error) {
      console.error('Error checking role or setting account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = (productId) => {
    setSelectedProduct(productId);
    setCurrentPage('placeOrder');
  };

  const handleViewProducts = (manufacturerAddress) => {
    setSelectedManufacturer(manufacturerAddress);
    setCurrentPage('viewProducts');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'placeOrder':
        return (
          <PlaceOrder
            productId={selectedProduct}
            manufacturerAddress={selectedManufacturer}
            goBack={() => setCurrentPage('viewProducts')}
          />
        );
      case 'viewProducts':
        return (
          <ManufacturerProducts
            manufacturerAddress={selectedManufacturer}
            onPlaceOrder={handlePlaceOrder}
            goBack={() => setCurrentPage('viewManufacturers')}
          />
        );
      case 'manufacturerHomePage':
        return <ManufacturerHomePage />;
      case 'manufacturer':
        return <Manufacturer />;
      case 'ordersPage':
        return <OrdersPage />;
      case 'retailerHomePage':
        return <RetailerHomePage />;
      case 'viewManufacturers':
        return <ViewManufacturers onViewProducts={handleViewProducts} />;
      case 'distributorHomePage':
        return <DistributorHomePage />;
      case 'distributorOrdersPage':
        return <DistributorOrdersPage />;
      case 'retailerOrders':
        return (
          <RetailerOrders
            setTrackingOrderId={setTrackingOrderId} // Pass function to set tracking order ID
            setCurrentPage={setCurrentPage}
          />
        );
      case 'trackOrder': // TrackOrderPage navigation
        return (
          <TrackOrderPage
            trackingOrderId={trackingOrderId}
            goBack={() => setCurrentPage('retailerOrders')}
          />
        );
      case 'manufacturerDistributorsPage':
        return <ManufacturerDistributorsPage />;
      default:
        return <NonUserPage />;
    }
    
  };

  return (
    
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>

      <Sidebar
        role={role}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen) }
        invalidTempOrders={invalidTempOrders}
      />
      <div className="content-container">{loading ? <p>Loading...</p> : renderPage()}</div>
      <footer className="footer">
        <p>&copy; 2024 Farm To Fork. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;

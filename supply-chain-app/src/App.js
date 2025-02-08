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
<<<<<<< HEAD
=======
import RetailerOrders from './RetailerOrders';
import TrackOrderPage from './TrackOrderPage'; // Import TrackOrderPage
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240
import './App.css';

const App = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('');
<<<<<<< HEAD
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // State to manage sidebar
=======
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [trackingOrderId, setTrackingOrderId] = useState(null); // State for tracking order ID
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240

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

    initWeb3();

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
<<<<<<< HEAD
      default:
        return <NonUserPage />;
      case 'manufacturerDistributorsPage':
        return <ManufacturerDistributorsPage />;
      case 'RetailerOrdersPage':
       return <RetailerOrdersPage />;
=======
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
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240
    }
  };

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Sidebar
        role={role}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isSidebarOpen={isSidebarOpen}
<<<<<<< HEAD
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} // Toggle sidebar state
=======
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240
      />
      <div className="content-container">{loading ? <p>Loading...</p> : renderPage()}</div>
      <footer className="footer">
        <p>&copy; 2024 Supply Chain Application. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;

import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import ManufacturerHomePage from './ManufacturerHomePage';
import RetailerHomePage from './RetailerHomePage';
import Manufacturer from './Manufacturer';
import ViewManufacturers from './ViewManufacturers';
import ManufacturerProducts from './ManufacturerProducts';
import PlaceOrder from './PlaceOrder';
import NonUserPage from './NonUserPage';

const Header = ({ currentUser, setCurrentPage }) => {
  return (
    <header>
      <nav>
        {currentUser === 'manufacturer' && (
          <>
            <button onClick={() => setCurrentPage('manufacturerHomePage')}>Home</button>
            <button onClick={() => setCurrentPage('manufacturer')}>Products</button>
          </>
        )}
        {currentUser === 'retailer' && (
          <>
            <button onClick={() => setCurrentPage('retailerHomePage')}>Home</button>
            <button onClick={() => setCurrentPage('viewManufacturers')}>View Manufacturers</button>
          </>
        )}
      </nav>
    </header>
  );
};

const App = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('');

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);
        initAccountAndRole(web3Instance);
      } catch (error) {
        console.error('Failed to load web3, accounts, or contract. Check console for details.', error);
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
      if (!accounts[0]) throw new Error("No account found. Make sure MetaMask is connected.");
      setAccount(accounts[0]);

      const networkId = await web3Instance.eth.net.getId();
      const deployedNetwork = RoleContract.networks[networkId];
      if (!deployedNetwork) {
        throw new Error('RoleContract not deployed on the selected network');
      }

      const roleInstance = new web3Instance.eth.Contract(
        RoleContract.abi,
        deployedNetwork.address
      );

      const isManufacturer = await roleInstance.methods.checkManufacturer(accounts[0]).call();
      const isRetailer = await roleInstance.methods.checkRetailer(accounts[0]).call();

      if (isManufacturer) {
        setRole('manufacturer');
        setCurrentPage('manufacturerHomePage');
      } else if (isRetailer) {
        setRole('retailer');
        setCurrentPage('retailerHomePage');
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
        return <PlaceOrder productId={selectedProduct} manufacturerAddress={selectedManufacturer} goBack={() => setCurrentPage('viewProducts')} />;
      case 'viewProducts':
        return <ManufacturerProducts manufacturerAddress={selectedManufacturer} onPlaceOrder={handlePlaceOrder} goBack={() => setCurrentPage('viewManufacturers')} />;
      case 'manufacturerHomePage':
        return <ManufacturerHomePage />;
      case 'manufacturer':
        return <Manufacturer />;
      case 'retailerHomePage':
        return <RetailerHomePage />;
      case 'viewManufacturers':
        return <ViewManufacturers onViewProducts={handleViewProducts} />;
      case 'nonUserPage':
        return <NonUserPage />;
      default:
        return <p>Page not found</p>;
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {role !== 'nonUser' && <Header currentUser={role} setCurrentPage={setCurrentPage} />}
      {renderPage()}
      <footer>
        <p>&copy; 2024 Supply Chain Application. All rights reserved.</p>
      </footer>
    </>
  );
};

export default App;


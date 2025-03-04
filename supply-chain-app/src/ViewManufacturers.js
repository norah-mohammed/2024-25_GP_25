<<<<<<< HEAD
import React, { useState, useEffect, useCallback } from 'react'; 
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import "./ViewManufacturers.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';


const ViewManufacturers = ({ onViewProducts }) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Maintain the search term for UI only
  const [errorMessage, setErrorMessage] = useState('');
  const [isRetailer, setIsRetailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);


  const fetchManufacturers = useCallback(async (roleInstance) => {
    try {
      const allManufacturers = await roleInstance.methods.getAllManufacturers().call();
      const manufacturerDetails = await Promise.all(
        allManufacturers.map(async (address) => {
          const details = await roleInstance.methods.getManufacturerDetails(address).call();
          return { ethAddress: address, ...details };
        })
      );
      setManufacturers(manufacturerDetails);
    } catch (error) {
      setErrorMessage('Error fetching manufacturers: ' + error.message);
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = RoleContract.networks[networkId];
        setTimeout(() => setIsLoaded(true), 50); 

        if (!deployedNetwork) {
          throw new Error('RoleContract not deployed on the selected network');
        }

        const roleInstance = new web3.eth.Contract(RoleContract.abi, deployedNetwork.address);
        const retailerStatus = await roleInstance.methods.checkRetailer(accounts[0]).call();

        setIsRetailer(retailerStatus);
        if (retailerStatus) {
          await fetchManufacturers(roleInstance);
        } else {
          setErrorMessage("Access denied: You are not a registered retailer.");
        }
      } catch (error) {
        setErrorMessage('Error checking retailer access: ' + error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchManufacturers]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update search term for UI purposes
  };

  if (loading) return <div>Loading...</div>;
  if (!isRetailer) return <div><h2>{errorMessage}</h2></div>;

  return (
<div className={`view-manufacturers-container ${isLoaded ? "loaded" : ""}`}>    
    <h2 className="page-title">Available Manufacturers</h2>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <div className="search-bar-container">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          className="search-bar"
          type="text"
          placeholder="Search manufacturers..."
          value={searchTerm}
          onChange={handleSearchChange} // Update the search term, no filtering applied
          disabled // Disable functionality if needed
        />
        {searchTerm && (
          <FontAwesomeIcon
            icon={faTimes} // FontAwesome clear icon
            className="clear-icon"
            onClick={() => setSearchTerm('')} // Clear the search term
          />
        )}
      </div>

      <div className="manufacturer-cards">
        {manufacturers.length === 0 ? (
          <p className="no-manufacturers">No manufacturers found.</p>
        ) : (
          manufacturers.map((manufacturer, index) => (
            <div className="manufacturer-card" key={index}>
              <h3>{manufacturer.name}</h3>
              <p><strong>Address:</strong> {manufacturer.addressLine}</p>
              <p><strong>Email:</strong> {manufacturer.email}</p>
              <p><strong>Phone:</strong> {manufacturer.phoneNumber}</p>
              <button className="view-products-btn" onClick={() => onViewProducts(manufacturer.ethAddress)}>View Products</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewManufacturers;
=======
import React, { useState, useEffect, useCallback } from 'react'; 
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import "./ViewManufacturers.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';


const ViewManufacturers = ({ onViewProducts }) => {
  const [manufacturers, setManufacturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // Maintain the search term for UI only
  const [errorMessage, setErrorMessage] = useState('');
  const [isRetailer, setIsRetailer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);


  const fetchManufacturers = useCallback(async (roleInstance) => {
    try {
      const allManufacturers = await roleInstance.methods.getAllManufacturers().call();
      const manufacturerDetails = await Promise.all(
        allManufacturers.map(async (address) => {
          const details = await roleInstance.methods.getManufacturerDetails(address).call();
          return { ethAddress: address, ...details };
        })
      );
      setManufacturers(manufacturerDetails);
    } catch (error) {
      setErrorMessage('Error fetching manufacturers: ' + error.message);
      console.error(error);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const web3 = await getWeb3();
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = RoleContract.networks[networkId];
        setTimeout(() => setIsLoaded(true), 50); 

        if (!deployedNetwork) {
          throw new Error('RoleContract not deployed on the selected network');
        }

        const roleInstance = new web3.eth.Contract(RoleContract.abi, deployedNetwork.address);
        const retailerStatus = await roleInstance.methods.checkRetailer(accounts[0]).call();

        setIsRetailer(retailerStatus);
        if (retailerStatus) {
          await fetchManufacturers(roleInstance);
        } else {
          setErrorMessage("Access denied: You are not a registered retailer.");
        }
      } catch (error) {
        setErrorMessage('Error checking retailer access: ' + error.message);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchManufacturers]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value); // Update search term for UI purposes
  };

  if (loading) return <div>Loading...</div>;
  if (!isRetailer) return <div><h2>{errorMessage}</h2></div>;

  return (
    
<div className={`view-manufacturers-container ${isLoaded ? "loaded" : ""}`}>  
    
    <h2 className="page-title">Available Manufacturers</h2>
      {errorMessage && <p className="error-message">{errorMessage}</p>}
      <div className="search-bar-container">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          className="search-bar"
          type="text"
          placeholder="Search manufacturers..."
          value={searchTerm}
          onChange={handleSearchChange} // Update the search term, no filtering applied
          disabled // Disable functionality if needed
        />
        {searchTerm && (
          <FontAwesomeIcon
            icon={faTimes} // FontAwesome clear icon
            className="clear-icon"
            onClick={() => setSearchTerm('')} // Clear the search term
          />
        )}
      </div>

      <div className="manufacturer-cards">
        {manufacturers.length === 0 ? (
          <p className="no-manufacturers">No manufacturers found.</p>
        ) : (
          manufacturers.map((manufacturer, index) => (
            <div className="manufacturer-card" key={index}>
              <h3>{manufacturer.name}</h3>
              <p><strong>Address:</strong> {manufacturer.addressLine}</p>
              <p><strong>Email:</strong> {manufacturer.email}</p>
              <p><strong>Phone:</strong> {manufacturer.phoneNumber}</p>
              <button className="view-products-btn" onClick={() => onViewProducts(manufacturer.ethAddress)}>View Products</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ViewManufacturers;
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240

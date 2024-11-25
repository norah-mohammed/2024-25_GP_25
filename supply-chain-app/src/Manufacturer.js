import React, { useState, useEffect } from "react";
import getWeb3 from './web3';
import ProductContract from './contracts/ProductContract.json';
import RoleContract from './contracts/RoleContract.json';
import AddProduct from './AddProduct';
import './Manufacturer.css'; // Import Manufacturer specific CSS
import './HeaderFooter.css'; // Header and Footer styling
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus } from '@fortawesome/free-solid-svg-icons'

const Manufacturer = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isManufacturer, setIsManufacturer] = useState(false);
  const [productContract, setProductContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'addProduct'

  // Initialize web3 and contracts
  useEffect(() => {
    const initWeb3 = async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      try {
        const web3Instance = await getWeb3();
        setWeb3(web3Instance);
        const accounts = await web3Instance.eth.getAccounts();
        setAccounts(accounts);
        const networkId = await web3Instance.eth.net.getId();
        const deployedProductNetwork = ProductContract.networks[networkId];
        const productInstance = new web3Instance.eth.Contract(
          ProductContract.abi,
          deployedProductNetwork && deployedProductNetwork.address
        );
        setProductContract(productInstance);
        const deployedRoleNetwork = RoleContract.networks[networkId];
        const roleInstance = new web3Instance.eth.Contract(
          RoleContract.abi,
          deployedRoleNetwork && deployedRoleNetwork.address
        );
        setRoleContract(roleInstance);
        const isManufacturer = await roleInstance.methods.checkManufacturer(accounts[0]).call();
        setIsManufacturer(isManufacturer);
        if (isManufacturer) {
          loadProducts(productInstance, accounts[0]);
        }
      } catch (error) {
        console.error("Error initializing web3 or loading contracts:", error);
      }
    };
    initWeb3();
  }, []);const loadProducts = async (contract, account) => {
    try {
      // Fetching products by manufacturer
      const productsByManufacturer = await contract.methods.getProductsByManufacturer(account).call();
      
      // Log the fetched products for debugging
      console.log(productsByManufacturer); 
  
      // Formatting the products and including minTemp and maxTemp
      const formattedProducts = productsByManufacturer.map(product => ({
        ...product,
        productId: product.productId.toString(),
        price: product.price.toString(),
        weight: product.weight.toString(),
        itemsPerPack: product.itemsPerPack.toString(),
        maxTemp: parseInt(product.maxTemp, 10),
        minTemp: parseInt(product.minTemp, 10),
        transportMode: product.transportMode.toString(),
      }));
  
      // Setting the formatted products in the state
      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts); // Initialize filtered products as well
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };
  
  const renderPage = () => {
    switch (currentPage) {
      case 'addProduct':
        return (
          <AddProduct
            productContract={productContract}
            accounts={accounts}
            loadProducts={() => loadProducts(productContract, accounts[0])}
            onBack={() => setCurrentPage('home')}
          />
        );
      case 'home':
      default:
        return (
          <div className="manufacturer-dashboard">
            <h2>products</h2>
  
            <div className="button-group">
  <button className="add-product-btn" onClick={() => setCurrentPage('addProduct')}>
    <FontAwesomeIcon icon={faPlus} style={{ marginRight: '8px' }} /> Add Product
  </button>
  <div className="search-bar-container">
    <input
      type="text"
      className="search-bar"
      placeholder="Search Products"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
    <button className="search-btn">
      <FontAwesomeIcon icon={faSearch} />
    </button>
  </div>
</div>


  
            {/* Display filtered products in a table */}
            {filteredProducts.length > 0 ? (
              <table border>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Price (SAR)</th>
                    <th>Weight (grams)</th>
                    <th>Items Per Pack</th>
                    <th>Temperature Range (°C)</th>
                    <th>Transport Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={index}>
                      <td>{product.productId}</td>
                      <td>{product.name}</td>
                      <td>{product.description}</td>
                      <td>
                    <span className={`status ${product.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {product.status}
                    </span>
                  </td>
                      <td>{product.price}</td>
                      <td>{product.weight}</td>
                      <td>{product.itemsPerPack}</td>
                      <td>{product.minTemp}°C to {product.maxTemp}°C</td>
                      <td>{['Refrigerated', 'Frozen', 'Ambient'][parseInt(product.transportMode)]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No products found.</p>
            )}
          </div>
        );
    }
  };
  

  // If the user is not a manufacturer, show a message
  if (!isManufacturer) {
    return <div><h2>You are not registered as a manufacturer</h2></div>;
  }

  // Return the rendered page
  return renderPage();
};

export default Manufacturer;

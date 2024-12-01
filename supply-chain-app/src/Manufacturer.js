import React, { useState, useEffect } from "react";
import getWeb3 from './web3';
import ProductContract from './contracts/ProductContract.json';
import RoleContract from './contracts/RoleContract.json';
import AddProduct from './AddProduct';
import './Manufacturer.css';
import './HeaderFooter.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

const Manufacturer = () => {
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [isManufacturer, setIsManufacturer] = useState(false);
  const [productContract, setProductContract] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'AddProduct'

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
          await loadProducts(productInstance, accounts[0]);
        }
      } catch (error) {
        console.error("Error initializing web3 or loading contracts:", error);
      }
    };
    initWeb3();
  }, []);

  // Function to load products
  const loadProducts = async (contract, account) => {
    try {
      const productsByManufacturer = await contract.methods.getProductsByManufacturer(account).call();
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
      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts); // Initialize filtered products
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  // Function to add product and immediately refresh the list
  const handleProductAdded = async () => {
    if (productContract && accounts.length > 0) {
      await loadProducts(productContract, accounts[0]);
    }
    setCurrentPage('home'); // Redirect back to the dashboard
  };

  const renderPage = () => {
    switch (currentPage) {
      case "AddProduct":
        return (
          <AddProduct
            productContract={productContract}
            accounts={accounts}
            loadProducts={loadProducts} // Pass the loadProducts function
            onBack={handleProductAdded} // Refresh products after adding
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
          />
        );
      case "home":
      default:
        return (
          <div className="manufacturer-dashboard">
            {/* Breadcrumb */}
            <div className="breadcrumb">
              <a
                href="#Dashboard"
                onClick={() => setCurrentPage('home')}
                className={`breadcrumb-link ${currentPage === 'home' ? 'active' : ''}`}
              >
                Home
              </a>
              &gt;
              <a
                href="#products"
                onClick={() => setCurrentPage('home')}
                className={`breadcrumb-link ${currentPage === 'products' ? 'active' : ''}`}
              >
                Products
              </a>
            </div>

            <h2>Products</h2>

            {/* Button Group */}
            <div className="button-group">
              <button
                className="add-product-btn"
                onClick={() => setCurrentPage('AddProduct')}
              >
                <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} /> Add Product
              </button>

              {/* Search Bar */}
              <div className="search-bar-container">
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
                <input
                  className="search-bar"
                  type="text"
                  placeholder="Search Products by ID or Name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <FontAwesomeIcon
                    icon={faTimes}
                    className="clear-icon"
                    onClick={() => setSearchTerm('')} // Clear search term
                  />
                )}
              </div>
            </div>

            {/* Display Products Table */}
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

  if (!isManufacturer) {
    return <div><h2>You are not registered as a manufacturer</h2></div>;
  }

  return (
    <div>
      {renderPage()}
    </div>
  );
};

export default Manufacturer;

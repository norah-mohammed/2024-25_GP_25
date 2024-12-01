import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import ProductContract from './contracts/ProductContract.json';
import './ManufacturerProduct.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const ManufacturerProducts = ({ manufacturerAddress, onPlaceOrder, goBack }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const transportModes = ['Refrigerated', 'Frozen', 'Ambient'];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const web3 = await getWeb3();
        const networkId = await web3.eth.net.getId();
        const deployedNetwork = ProductContract.networks[networkId];
        if (!deployedNetwork) {
          throw new Error('ProductContract not deployed on the selected network.');
        }

        const productInstance = new web3.eth.Contract(
          ProductContract.abi,
          deployedNetwork.address
        );

        const manufacturerProducts = await productInstance.methods.getProductsByManufacturer(manufacturerAddress).call();
        setTimeout(() => setIsLoaded(true), 50); 

        const formattedProducts = manufacturerProducts.map(product => ({
          ...product,
          weight: parseInt(product.weight, 10),
          itemsPerPack: parseInt(product.itemsPerPack, 10),
          price: parseInt(product.price, 10),
          productId: parseInt(product.productId, 10),
          maxTemp: parseInt(product.maxTemp, 10),
          minTemp: parseInt(product.minTemp, 10),
          transportMode: parseInt(product.transportMode, 10),
        }));

        setProducts(formattedProducts);
      } catch (error) {
        setErrorMessage(`Error fetching products: ${error.message}`);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (manufacturerAddress) {
      fetchProducts();
    }
  }, [manufacturerAddress]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const navigateToViewManufacturers = () => {
    goBack(); // This navigates back to the manufacturers view
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return <div>Error: {errorMessage}</div>;
  }

  return (
    <div className={`manufacturer-products ${isLoaded ? "loaded" : ""}`}>
      {/* Breadcrumb with Navigation */}
      <div className="breadcrumb">
      <span
          className="breadcrumb-link"
          onClick={navigateToViewManufacturers}
          style={{ cursor: 'pointer' }}
        >
          Home
        </span>&nbsp;&gt;&nbsp;
        <span
          className="breadcrumb-link"
          onClick={navigateToViewManufacturers}
          style={{ cursor: 'pointer' }}
        >
          View Manufacturers
        </span>
        &nbsp;&gt;&nbsp;
        <span className="breadcrumb-link">Manufacturer Products</span>
      </div>

      <button className="back-button" onClick={goBack}>
        <FontAwesomeIcon icon={faArrowLeft} /> Back
      </button>

      <h2 className="Mp">Products for Manufacturer</h2>

      <div className="search-bar-container">
        <FontAwesomeIcon icon={faSearch} className="search-icon" />
        <input
          className="search-bar"
          type="text"
          placeholder="Search Products by ID or Name..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <FontAwesomeIcon
            icon={faTimes}
            className="clear-icon"
            onClick={() => setSearchTerm('')}
          />
        )}
      </div>

      {products.length === 0 ? (
        <p>No products available at the moment.</p>
      ) : (
        <div className="products-container">
          {products.map((product, index) => (
            <div key={index} className="product-card">
              <h3>{product.name}</h3>
              <p><strong>ID:</strong> {product.productId}</p>
              <p><strong>Description:</strong> {product.description}</p>
              <p><strong>Weight:</strong> {product.weight} grams</p>
              <p><strong>Items per Pack:</strong> {product.itemsPerPack}</p>
              <p><strong>Price:</strong> {product.price} SAR</p>
              <p><strong>Temperature Range:</strong> {product.minTemp}°C to {product.maxTemp}°C</p>
              <p><strong>Transport Mode:</strong> {transportModes[product.transportMode]}</p>
              <button onClick={() => onPlaceOrder(product.productId)} className="order-button">
                Order
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManufacturerProducts;

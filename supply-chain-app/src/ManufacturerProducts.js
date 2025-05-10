import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import ProductContract from './contracts/ProductContract.json';
import './ManufacturerProduct.css'; // Import the CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSearch} from '@fortawesome/free-solid-svg-icons';

const ManufacturerProducts = ({ manufacturerAddress, onPlaceOrder, goBack }) => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [page, setPage] = useState(1);
const ITEMS_PER_PAGE = 6;

  

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
    
        const formattedProducts = manufacturerProducts.map((product) => ({
          productId: product.productId?.toString() || '',
          name: product.name || '',
          description: product.description || '',
          status: product.status || '',
          manufacturer: product.manufacturer || '',
          minTemp: product.minTemp !== undefined ? parseInt(product.minTemp, 10) : '',
          maxTemp: product.maxTemp !== undefined ? parseInt(product.maxTemp, 10) : '',
          productImageURL: product.productImageURL || '',
          weight: product.details?.weight?.toString() || '',
          price: product.details?.price?.toString() || '',
          itemsPerPack: product.details?.itemsPerPack?.toString() || '',
          transportMode: product.details?.transportMode?.toString() || '',
          minOrderQuantity: product.details?.minOrderQuantity?.toString() || '',
          maxOrderQuantity: product.details?.maxOrderQuantity?.toString() || '',
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

  // Filter products by status and search term
  const filteredProducts = products
    .filter(product => product.status === "In Stock") // Only include products that are "In Stock"
    .filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      product.productId.toString().includes(searchTerm)
    );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return <div>Error: {errorMessage}</div>;
  }

  return (
<div className={`manufacturer-dashboard manufacturer-products ${isLoaded ? "loaded" : ""}`}>
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

      <h2 className="page-title">Manufacturer Products</h2>

      <div className="new-search-bar">
  <FontAwesomeIcon icon={faSearch} className="new-search-icon" />
  <input
    className="new-search-input"
    type="text"
    placeholder="Search products..."
    value={searchTerm}
    onChange={handleSearchChange}
  />
</div>


      {filteredProducts.length === 0 ? (
        <p>No products available at the moment.</p>
      ) : (
        <div className="products-container">
          {filteredProducts
  .slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  .map((product, index) => (

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
          {Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) > 1 && (
  <div className="pagination">
    <button
      className="pagination-button"
      disabled={page === 1}
      onClick={() => setPage(page - 1)}
    >
      Previous
    </button>
    <span>Page {page}</span>
    <button
      className="pagination-button"
      disabled={page === Math.ceil(filteredProducts.length / ITEMS_PER_PAGE)}
      onClick={() => setPage(page + 1)}
    >
      Next
    </button>
  </div>
)}

        </div>
      )}
    </div>
    
  );
};

export default ManufacturerProducts;

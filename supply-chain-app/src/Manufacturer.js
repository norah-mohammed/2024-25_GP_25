
import React, { useState, useEffect } from "react";
import getWeb3 from './web3';
import ProductContract from './contracts/ProductContract.json';
import RoleContract from './contracts/RoleContract.json';
import AddProduct from './AddProduct';
import './Manufacturer.css';
import './HeaderFooter.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus } from '@fortawesome/free-solid-svg-icons';
import './ordersPage.css';


const ITEMS_PER_PAGE = 5;

const Manufacturer = () => {
  const [accounts, setAccounts] = useState([]);
  const [isManufacturer, setIsManufacturer] = useState(false);
  const [productContract, setProductContract] = useState(null);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [notification, setNotification] = useState('');


  useEffect(() => {
    const initWeb3 = async () => {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      try {
        const web3Instance = await getWeb3();
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

  const loadProducts = async (contract, account) => {
    try {
      setLoading(true);
      const productsByManufacturer = await contract.methods.getProductsByManufacturer(account).call();
      const formattedProducts = productsByManufacturer.map((product) => {
        if (!product) return {};
      
      
        return {
          productId: product.productId?.toString() || '',
          name: product.name || '',
          description: product.description || '',
          status: product.status || '',
          manufacturer: product.manufacturer || '',
          minTemp: product.minTemp !== undefined ? parseInt(product.minTemp, 10) : '',
          maxTemp: product.maxTemp !== undefined ? parseInt(product.maxTemp, 10) : '',
          weight: product.details?.weight?.toString() || '',
          price: product.details?.price?.toString() || '',
          itemsPerPack: product.details?.itemsPerPack?.toString() || '',
          transportMode: product.details?.transportMode?.toString() || '',
          minOrderQuantity: product.details?.minOrderQuantity?.toString() || '',
          maxOrderQuantity: product.details?.maxOrderQuantity?.toString() || '',
        };
      });
      
  
      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };
  

const updateProductStatus = async (productId, newStatus) => {
  try {
    setLoading(true);
    await productContract.methods.updateProductStatus(productId, newStatus).send({ from: accounts[0] });
    await loadProducts(productContract, accounts[0]);

    setNotification(`Product ${productId} marked as ${newStatus}.`);
    setTimeout(() => setNotification(''), 5000); // Hide after 5 seconds
  } catch (error) {
    console.error("Error updating product status:", error);
    setNotification('Failed to update product status.');
    setTimeout(() => setNotification(''), 5000);
  } finally {
    setLoading(false);
  }
};

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleProductAdded = async () => {
    if (productContract && accounts.length > 0) {
      await loadProducts(productContract, accounts[0]);
    }
    setCurrentPage('home');
  };

  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productId.includes(searchTerm)
    );
    setFilteredProducts(filtered);
    setPage(1);
  }, [searchTerm, products]);

  const renderPage = () => {
    switch (currentPage) {
      case "AddProduct":
        return (
          <AddProduct
            productContract={productContract}
            accounts={accounts}
            loadProducts={loadProducts}
            onBack={handleProductAdded}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
          />
        );
      case "home":
      default:
        return (
          <div className="manufacturer-dashboard">
            <div className="breadcrumb">
              <a href="#Dashboard" onClick={() => setCurrentPage('home')} className={`breadcrumb-link ${currentPage === 'home' ? 'active' : ''}`}>Home</a>
              &gt;
              <a href="#products" onClick={() => setCurrentPage('home')} className={`breadcrumb-link ${currentPage === 'products' ? 'active' : ''}`}>Products</a>
            </div>

            <h2>Products</h2><div className="new-search-filter-wrapper">
  <div className="new-search-filter-top">
    <button className="action-button assign-button" onClick={() => setCurrentPage('AddProduct')}>
      <FontAwesomeIcon icon={faPlus} style={{ marginRight: "8px" }} /> Add Product
    </button>

    <div className="new-search-bar">
      <FontAwesomeIcon icon={faSearch} className="new-search-icon" />
      <input
        type="text"
        className="new-search-input"
        placeholder="Search Products by ID or Name..."
        value={searchTerm}
        onChange={handleSearchChange}
      />
    </div>
  </div>
</div>


            {filteredProducts.length > 0 ? (
              
              <>
            {notification && (
  <div className="notification" style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#e0f7fa', color: '#006064', borderRadius: '5px' }}>
    {notification}
  </div>
)}

                <table border="1">
                  <thead>
                    <tr>
                      <th>Product ID</th>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Price</th>
                      <th>Weight</th>
                      <th>Items/Pack</th>
                      <th>Transport</th>
                      <th>Min-Max Order</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE).map((product, index) => (
                      <tr key={index}>
                        <td>{product.productId}</td>
                        <td>{product.name}</td>
                        <td>{product.description}</td>
                        <td>{product.price}</td>
                        <td>{product.weight}</td>
                        <td>{product.itemsPerPack}</td>
                        <td>{['Refrigerated', 'Frozen', 'Ambient'][parseInt(product.transportMode)]}</td>
                        <td>{product.minOrderQuantity} - {product.maxOrderQuantity}</td>
                        <td>{product.status}</td>
                        <td>
                        <button
  className={`action-button assign-button ${product.status === "In Stock" ? "outlined-green" : ""}`}
  onClick={() => updateProductStatus(product.productId, product.status === "In Stock" ? "Out of Stock" : "In Stock")}
>
  {product.status === "In Stock" ? "Mark Out Of Stock" : "Mark In Stock"}
</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

              </>
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
      {loading && <p>Loading...</p>}
      {renderPage()}
    </div>
  );
};

export default Manufacturer;
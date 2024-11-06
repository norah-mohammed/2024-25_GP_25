import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import ProductContract from './contracts/ProductContract.json';
import RoleContract from './contracts/RoleContract.json';
import AddProduct from './AddProduct';

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
  }, []);

  const loadProducts = async (contract, account) => {
    try {
      const productsByManufacturer = await contract.methods.getProductsByManufacturer(account).call();
      const formattedProducts = productsByManufacturer.map(product => ({
        ...product,
        productId: product.productId.toString(),
        price: product.price.toString(),
        weight: product.weight.toString(),
        itemsPerPack: product.itemsPerPack.toString(),
        minTemp: product.minTemp.toString(),
        maxTemp: product.maxTemp.toString(),
        transportMode: product.transportMode.toString(),
      }));
      setProducts(formattedProducts);
      setFilteredProducts(formattedProducts); // Initialize filtered products as well
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'addProduct':
        return <AddProduct productContract={productContract} accounts={accounts} loadProducts={() => loadProducts(productContract, accounts[0])} onBack={() => setCurrentPage('home')} />;
      case 'home':
      default:
        return (
          <div>
            <h2>Manufacturer Dashboard</h2>
            <button onClick={() => setCurrentPage('addProduct')}>Add Product</button>
            {
  filteredProducts.length > 0 ? (
    <table border={1}>
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
            <td>{product.status}</td>
            <td>{product.price}</td>
            <td>{product.weight}</td>
            <td>{product.itemsPerPack}</td>
            <td>{`${product.minTemp} to ${product.maxTemp}`}</td>
            <td>{['Refrigerated', 'Frozen', 'Ambient'][parseInt(product.transportMode)]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <p>No products found.</p>
  )
}

          </div>
        );
    }
  };

  if (!isManufacturer) {
    return <div><h2>You are not registered as a manufacturer</h2></div>;
  }

  return renderPage();
};

export default Manufacturer;


import React, { useState, useEffect } from 'react';
import getWeb3 from './web3';
import ProductContract from './contracts/ProductContract.json';

const ManufacturerProducts = ({ manufacturerAddress, onPlaceOrder, goBack }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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

        console.log(`Fetching products for manufacturer: ${manufacturerAddress}`);
        const manufacturerProducts = await productInstance.methods.getProductsByManufacturer(manufacturerAddress).call();
        if (manufacturerProducts.length === 0) {
          console.log('No products found for this manufacturer.');
        } else {
          console.log(`${manufacturerProducts.length} products found.`);
        }

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
        setFilteredProducts(formattedProducts); // Initially, all products are shown
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

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = products.filter(product =>
      product.productId.toString().includes(lowercasedFilter) ||
      product.name.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredProducts(filteredData);
  }, [searchTerm, products]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (errorMessage) {
    return <div>Error: {errorMessage}</div>;
  }

  return (
    <div>
      <button onClick={goBack}>Back to Manufacturers</button>
      <h2>Products for Manufacturer</h2>
      {
  filteredProducts.length === 0 ? (
    <p>No products available at the moment.</p>
  ) : (
    <table border={1}>
      <thead>
        <tr>
          <th>Product ID</th>
          <th>Name</th>
          <th>Description</th>
          <th>Weight (grams)</th>
          <th>Items per Pack</th>
          <th>Price (SAR)</th>
          <th>Max Temperature (°C)</th>
          <th>Min Temperature (°C)</th>
          <th>Transport Mode</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        {filteredProducts.map((product, index) => (
          <tr key={index}>
            <td>{product.productId}</td>
            <td>{product.name}</td>
            <td>{product.description}</td>
            <td>{product.weight}</td>
            <td>{product.itemsPerPack}</td>
            <td>{product.price}</td>
            <td>{product.maxTemp}</td>
            <td>{product.minTemp}</td>
            <td>{transportModes[product.transportMode]}</td>
            <td>
              <button onClick={() => onPlaceOrder(product.productId)}>
                Order
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

    </div>
  );
};

export default ManufacturerProducts;


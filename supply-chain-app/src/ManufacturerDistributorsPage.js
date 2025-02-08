<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import './ManufacturerDistributorsPage.css'; // Import the styles

const ManufacturerDistributorsPage = () => {
  const [web3, setWeb3] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();
        const accounts = await web3Instance.eth.getAccounts();
        const networkId = await web3Instance.eth.net.getId();

        const deployedNetwork = RoleContract.networks[networkId];
        const roleInstance = new web3Instance.eth.Contract(
          RoleContract.abi,
          deployedNetwork && deployedNetwork.address
        );

        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setRoleContract(roleInstance);

        fetchDistributors(roleInstance);
      } catch (error) {
        console.error('Error initializing Web3 or contracts:', error);
        setErrorMessage('Failed to load web3, accounts, or contract. Check console for details.');
      }
    };

    initWeb3();
  }, []);

  const fetchDistributors = async (contract) => {
    try {
      setLoading(true);
      const distributorAddresses = await contract.methods.getAllDistributorAddresses().call();
      const distributorDetails = await Promise.all(
        distributorAddresses.map(async (address) => {
          const distributor = await contract.methods.getDistributor(address).call();
          return {
            ...distributor,
            ethAddress: address,
            workingTime: `${distributor.isAM ? 'AM ' : ''}${distributor.isPM ? 'PM' : ''}`.trim(),
            workingDays: distributor.workingDays
              .map((day, index) => (day ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index] : null))
              .filter(Boolean)
              .join(', '),
            transportMode: [
              distributor.isRefrigerated ? 'Refrigerated' : null,
              distributor.isFrozen ? 'Frozen' : null,
              distributor.isAmbient ? 'Ambient' : null,
            ]
              .filter(Boolean)
              .join(', '),
          };
        })
      );
      setDistributors(distributorDetails);
    } catch (error) {
      console.error('Error fetching distributors:', error);
      setErrorMessage('Failed to fetch distributors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading distributors...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;

  return (
    <div className="distributors-container">
      <h2>Distributors</h2>
      {distributors.length > 0 ? (
        <table className="distributors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Working Time</th>
              <th>Working Days</th>
              <th>Transport Mode</th>
            </tr>
          </thead>
          <tbody>
            {distributors.map((distributor, index) => (
              <tr key={index}>
                <td>{distributor.name}</td>
                <td>{distributor.physicalAddress}</td>
                <td>{distributor.phoneNumber}</td>
                <td>{distributor.email}</td>
                <td>{distributor.workingTime}</td>
                <td>{distributor.workingDays}</td>
                <td>{distributor.transportMode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No distributors found in the system.</p>
      )}
    </div>
  );
};

export default ManufacturerDistributorsPage;
=======
import React, { useEffect, useState } from 'react';
import getWeb3 from './web3';
import RoleContract from './contracts/RoleContract.json';
import './ManufacturerDistributorsPage.css'; // Import the styles

const ManufacturerDistributorsPage = () => {
  const [web3, setWeb3] = useState(null);
  const [roleContract, setRoleContract] = useState(null);
  const [account, setAccount] = useState('');
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        const web3Instance = await getWeb3();
        const accounts = await web3Instance.eth.getAccounts();
        const networkId = await web3Instance.eth.net.getId();

        const deployedNetwork = RoleContract.networks[networkId];
        const roleInstance = new web3Instance.eth.Contract(
          RoleContract.abi,
          deployedNetwork && deployedNetwork.address
        );

        setWeb3(web3Instance);
        setAccount(accounts[0]);
        setRoleContract(roleInstance);

        fetchDistributors(roleInstance);
      } catch (error) {
        console.error('Error initializing Web3 or contracts:', error);
        setErrorMessage('Failed to load web3, accounts, or contract. Check console for details.');
      }
    };

    initWeb3();
  }, []);

  const fetchDistributors = async (contract) => {
    try {
      setLoading(true);
      const distributorAddresses = await contract.methods.getAllDistributorAddresses().call();
      const distributorDetails = await Promise.all(
        distributorAddresses.map(async (address) => {
          const distributor = await contract.methods.getDistributor(address).call();
          return {
            ...distributor,
            ethAddress: address,
            workingTime: `${distributor.isAM ? 'AM ' : ''}${distributor.isPM ? 'PM' : ''}`.trim(),
            workingDays: distributor.workingDays
              .map((day, index) => (day ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index] : null))
              .filter(Boolean)
              .join(', '),
            transportMode: [
              distributor.isRefrigerated ? 'Refrigerated' : null,
              distributor.isFrozen ? 'Frozen' : null,
              distributor.isAmbient ? 'Ambient' : null,
            ]
              .filter(Boolean)
              .join(', '),
          };
        })
      );
      setDistributors(distributorDetails);
    } catch (error) {
      console.error('Error fetching distributors:', error);
      setErrorMessage('Failed to fetch distributors. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading distributors...</p>;
  if (errorMessage) return <p>{errorMessage}</p>;

  return (
    <div className="distributors-container">
      <h2>Distributors</h2>
      {distributors.length > 0 ? (
        <table className="distributors-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Working Time</th>
              <th>Working Days</th>
              <th>Transport Mode</th>
            </tr>
          </thead>
          <tbody>
            {distributors.map((distributor, index) => (
              <tr key={index}>
                <td>{distributor.name}</td>
                <td>{distributor.physicalAddress}</td>
                <td>{distributor.phoneNumber}</td>
                <td>{distributor.email}</td>
                <td>{distributor.workingTime}</td>
                <td>{distributor.workingDays}</td>
                <td>{distributor.transportMode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No distributors found in the system.</p>
      )}
    </div>
  );
};

export default ManufacturerDistributorsPage;
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240

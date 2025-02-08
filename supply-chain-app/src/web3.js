<<<<<<< HEAD
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

const getWeb3 = () =>
  new Promise(async (resolve, reject) => {
    const provider = await detectEthereumProvider();
    if (provider) {
      const web3 = new Web3(provider);
      try {
        // Request account access if needed
        await provider.request({ method: 'eth_requestAccounts' });
        resolve(web3);
      } catch (error) {
        reject(error);
      }
    } else {
      reject('Please install MetaMask to use this DApp!');
    }
  });

export default getWeb3;
=======
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';

const getWeb3 = () =>
  new Promise(async (resolve, reject) => {
    try {
      const provider = await detectEthereumProvider();

      if (provider) {
        const web3 = new Web3(provider);

        // Request account access
        await provider.request({ method: 'eth_requestAccounts' });

        // Handle network change
        provider.on('chainChanged', (chainId) => {
          window.location.reload();
        });

        // Handle account change
        provider.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            console.log("Account changed:", accounts[0]);
          } else {
            console.warn("Please connect to MetaMask.");
          }
          window.location.reload();
        });

        resolve(web3);
      } else {
        reject('MetaMask is not installed. Please install it to use this DApp.');
      }
    } catch (error) {
      reject(`Error initializing Web3: ${error.message}`);
    }
    
  });

export default getWeb3;
>>>>>>> a3f765335766a01627d14b387ebc3eff98292240

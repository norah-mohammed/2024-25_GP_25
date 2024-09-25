## 2024-25_GP_25: Farm To Fork
### Blockchain-Based Supply Chain System 

Farm to Fork platform is a blockchain-based food supply chain management system designed to enhance transparency, traceability, and quality assurance in the food supply chain. It facilitates seamless interactions between manufacturers, distributors, and retailers, ensuring that food products are handled and transported under optimal conditions. The system focuses on providing comprehensive information about products, managing order processes, and monitoring the quality of products through temperature tracking. Each step of the supply chain is documented and accessible, ensuring food safety, reducing wastage, and offering a secure and efficient solution for stakeholders.

### Setting up Local Development

#### Step 1: Installation and Setup

1. **VSCode**: Download from [VSCode website](https://code.visualstudio.com/).

2. **Node.js**: Download the latest version from [Node.js website](https://nodejs.org/). After installation, verify the version by running the following command in the terminal:
    ```bash
    node -v
    ```

3. **Git**: Download from [Git website](https://git-scm.com/downloads). Verify the version by running the following command:
    ```bash
    git --version
    ```

4. **Ganache**: Download from [Ganache official website](https://www.trufflesuite.com/ganache).

5. **MetaMask**: Install MetaMask as a browser extension from the [Chrome Web Store](https://chrome.google.com/webstore/category/extensions) or [Firefox Add-ons store](https://addons.mozilla.org/).

---

#### Step 2: Create, Compile & Deploy Smart Contract

1. **Open VSCode**: Launch VSCode and open the terminal using `Ctrl + '`.

2. **Clone the Project**:
    ```bash
    git clone https://github.com/faizack619/Supply-Chain-Blockchain.git
    ```

3. **Install Truffle**:
    ```bash
    npm install -g truffle
    ```

4. **Install Project Dependencies**:
    ```bash
    npm i
    ```

##### Project Structure Overview:

- **contracts**: Contains Solidity smart contracts. The `Migrations.sol` contract is used for managing migrations.
- **migrations**: JavaScript files to deploy the smart contracts to the blockchain.
- **test**: JavaScript test files for smart contract testing.
- **truffle-config.js**: Configuration file for the Truffle project, including blockchain network settings.
- **package.json**: Contains project dependencies and scripts.
- **package-lock.json**: Automatically generated file listing exact dependency versions.
- **client**: Contains client-side code (HTML, CSS, JavaScript).

5. **Compile the Smart Contract**:
    ```bash
    truffle compile
    ```

6. **Deploy the Smart Contract**:

   - Open Ganache and create a new workspace.
   - Copy the RPC server address.
   - Update the `truffle-config.js` file with the Ganache RPC address.
   - Run the following command in the terminal to deploy the contract:
     ```bash
     truffle migrate
     ```

---

#### Step 3: Run DApp

1. **Navigate to the Client Folder**:
    ```bash
    cd client
    ```

2. **Install All Dependencies**:
    ```bash
    npm i
    ```

3. **Install Web3**:
    ```bash
    npm install --save web3
    ```

4. **Run the DApp**:
    ```bash
    npm start
    ```
    The DApp will be hosted at `http://localhost:3000`.

---

#### Step 4: Connect MetaMask with Ganache

1. **Start Ganache**: Open the Ganache application and note the RPC server URL and port number.

2. **Connect MetaMask**:
   - Open MetaMask in your browser and click on the network dropdown in the top-right corner.
   - Select "Custom RPC" and enter the Ganache RPC URL and port number.
   - Click "Save".

3. **Import Account**:
   - In Ganache, go to the "Accounts" tab, copy the private key of the first account.
   - In MetaMask, click on the three dots in the top-right corner, select "Import Account," and paste the private key.

---



---

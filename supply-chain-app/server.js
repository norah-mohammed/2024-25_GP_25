const { Web3 } = require('web3');
const bodyParser = require('body-parser');
const { SerialPort } = require('serialport');  // Correct import for SerialPort
const app = require('express')();
const port = 3001;
const cors = require('cors');
app.use(cors());


// Middleware to parse JSON data
app.use(bodyParser.json());

// Connect to Ganache (Local Blockchain)
const web3 = new Web3('http://localhost:7545');
// Smart Contract ABI and Address (Replace with your deployed contract details)
const contractABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_roleContractAddress",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "distributor",
        "type": "address"
      }
    ],
    "name": "DistributorAssigned",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "newStatus",
        "type": "string"
      }
    ],
    "name": "OrderStatusUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "orderCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "orders",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "retailer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "productId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "string",
            "name": "deliveryDate",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "deliveryTime",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "shippingAddress",
            "type": "string"
          }
        ],
        "internalType": "struct OrderContract.DeliveryInfo",
        "name": "deliveryInfo",
        "type": "tuple"
      },
      {
        "internalType": "string",
        "name": "status",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "distributor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "temperature",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "orderHistory",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "rejectionReason",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [],
    "name": "roleContract",
    "outputs": [
      {
        "internalType": "contract IRoleContract",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_productId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_quantity",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_manufacturer",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "_deliveryDate",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_deliveryTime",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_shippingAddress",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_productPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_temperature",
        "type": "uint256"
      }
    ],
    "name": "createOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_orderId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_newStatus",
        "type": "string"
      }
    ],
    "name": "updateOrderStatus",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_orderId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_reason",
        "type": "string"
      }
    ],
    "name": "rejectOrderWithReason",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_orderId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_distributor",
        "type": "address"
      }
    ],
    "name": "assignDistributor",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_orderId",
        "type": "uint256"
      }
    ],
    "name": "cancelOrder",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllOrders",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "retailer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "manufacturer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "productId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quantity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "deliveryDate",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "deliveryTime",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "shippingAddress",
                "type": "string"
              }
            ],
            "internalType": "struct OrderContract.DeliveryInfo",
            "name": "deliveryInfo",
            "type": "tuple"
          },
          {
            "internalType": "string",
            "name": "status",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "distributor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "temperature",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "orderHistory",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "rejectionReason",
            "type": "string"
          }
        ],
        "internalType": "struct OrderContract.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_manufacturer",
        "type": "address"
      }
    ],
    "name": "getOrdersByManufacturer",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "retailer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "manufacturer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "productId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quantity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "deliveryDate",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "deliveryTime",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "shippingAddress",
                "type": "string"
              }
            ],
            "internalType": "struct OrderContract.DeliveryInfo",
            "name": "deliveryInfo",
            "type": "tuple"
          },
          {
            "internalType": "string",
            "name": "status",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "distributor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "temperature",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "orderHistory",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "rejectionReason",
            "type": "string"
          }
        ],
        "internalType": "struct OrderContract.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_distributor",
        "type": "address"
      }
    ],
    "name": "getOrdersByDistributor",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "orderId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "retailer",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "manufacturer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "productId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "quantity",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "components": [
              {
                "internalType": "string",
                "name": "deliveryDate",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "deliveryTime",
                "type": "string"
              },
              {
                "internalType": "string",
                "name": "shippingAddress",
                "type": "string"
              }
            ],
            "internalType": "struct OrderContract.DeliveryInfo",
            "name": "deliveryInfo",
            "type": "tuple"
          },
          {
            "internalType": "string",
            "name": "status",
            "type": "string"
          },
          {
            "internalType": "address",
            "name": "distributor",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "temperature",
            "type": "uint256"
          },
          {
            "internalType": "string",
            "name": "orderHistory",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "rejectionReason",
            "type": "string"
          }
        ],
        "internalType": "struct OrderContract.Order[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_orderId",
        "type": "uint256"
      }
    ],
    "name": "getOrderById",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "orderId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "retailer",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "manufacturer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "productId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "quantity",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "string",
            "name": "deliveryDate",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "deliveryTime",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "shippingAddress",
            "type": "string"
          }
        ],
        "internalType": "struct OrderContract.DeliveryInfo",
        "name": "deliveryInfo",
        "type": "tuple"
      },
      {
        "internalType": "string",
        "name": "status",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "distributor",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "temperature",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "orderHistory",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "rejectionReason",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function",
    "constant": true
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_orderId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "_temperature",
        "type": "uint256"
      }
    ],
    "name": "updateOrderTemperature",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
const contractAddress = '0xc698Aaf3437919690Db697717E180611f445190e'; 
const orderContract = new web3.eth.Contract(contractABI, contractAddress);

const portName = 'COM3';  
const serialPort = new SerialPort({ path: portName, baudRate: 115200 });
let serialBuffer = ''; // Buffer to store incoming data

serialPort.on('data', async (data) => {
  serialBuffer += data.toString(); // Accumulate incoming data

  if (serialBuffer.includes('°C')) { // Check for a full temperature reading
    let temperatureStr = serialBuffer.match(/-?\d+(\.\d+)?/g); // Extract temperature number

    if (temperatureStr && temperatureStr.length > 0) {
      let temperature = parseFloat(temperatureStr[0]);

      console.log(`Raw Data: ${serialBuffer.trim()}`);
      console.log(`Cleaned Temperature: ${temperature}`);

      if (!isNaN(temperature)) {
        try {
          const accounts = await web3.eth.getAccounts();
          const sender = accounts[0]; // Use the first Ganache account

          const orders = await orderContract.methods.getAllOrders().call();

          if (orders.length === 0) {
            console.log("No orders found in the smart contract.");
          }

          for (const order of orders) {
            console.log(`Updating Order ID: ${order.orderId} with temperature: ${Math.floor(temperature)}°C`);
            
            // Send blockchain transaction and wait for response
            const tx = await orderContract.methods
              .updateOrderTemperature(order.orderId, Math.floor(temperature)) // Ensure temperature is an integer
              .send({ from: sender, gas: 3000000 });

            console.log(` Order ID ${order.orderId} updated successfully.`);
            console.log(`🔗 Transaction Hash: ${tx.transactionHash}`);
          }

          console.log(' All orders updated with temperature.');
        } catch (error) {
          console.error(' Error updating temperature for orders:', error.message || error);
        }
      } else {
        console.log('Invalid temperature data received.');
      }
    }

    // Clear buffer after processing
    serialBuffer = '';
  }
});
const privateKey = '062b39589cc05c6f3bea33b6d87c3710d99f28c9ac2e213d96c647b5d7a7c3cd'; // your Ganache account private key (without "0x")

app.post('/update-order-status', async (req, res) => {
  const { orderId } = req.body;

  try {
    const account = web3.eth.accounts.privateKeyToAccount('0x' + privateKey);
    const sender = account.address;

    // NEW: Fetch gas price manually
    const gasPrice = await web3.eth.getGasPrice();

    const tx = {
      from: sender,
      to: contractAddress,
      gas: 3000000,
      gasPrice: gasPrice,  
      data: orderContract.methods.updateOrderStatus(orderId, "Rejected due to Unsafe Temperature").encodeABI(),
    };

    const signedTx = await web3.eth.accounts.signTransaction(tx, '0x' + privateKey);
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);

    console.log(`Order ${orderId} status updated on blockchain.`);
    res.status(200).json({ message: 'Order status updated successfully.' });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status.', error });
  }
});


app.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}`);
});

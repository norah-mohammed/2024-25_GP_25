const Web3 = require("web3").default; // Ensure `.default` is added
const web3 = new Web3("http://127.0.0.1:7545");

web3.eth.getAccounts()
  .then(accounts => console.log("Accounts:", accounts))
  .catch(error => console.error("Error:", error));

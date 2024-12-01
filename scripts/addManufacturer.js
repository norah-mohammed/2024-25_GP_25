const RoleContract = artifacts.require("RoleContract");

module.exports = async function (callback) {
  try {
    // Get the deployed contract instance
    const roleContract = await RoleContract.deployed();

    // Get accounts from your local environment (e.g., Ganache)
    const accounts = await web3.eth.getAccounts();

    // The Ethereum address of the new manufacturer
    const manufacturerAddress = "0x44ac54E6B0d3C82CDBB55FB034D47DB05dF9Cc1d";  // New Manufacturer Ethereum address

    // New manufacturer details for Nadec
    const name = "Nadec";
    const physicalAddress = "123 Dairy Road, Riyadh, Saudi Arabia";
    const phoneNumber = "+966-11-555-6789";
    const email = "info@nadec.com";

    // Send the transaction to add a manufacturer, using an account from Ganache
    const result = await roleContract.addManufacturer(
      manufacturerAddress,
      name,
      physicalAddress,
      phoneNumber,
      email,
      { from: accounts[0] }  // Use the first account from Ganache or MetaMask
    );

    console.log("Manufacturer added successfully:", result);
    callback();  // End the script
  } catch (error) {
    console.error("Error adding manufacturer:", error);
    callback(error);
  }
};

const RoleContract = artifacts.require("RoleContract");

module.exports = async function (callback) {
  try {
    // Get the deployed contract instance
    const roleContract = await RoleContract.deployed();

    // Get accounts from your local environment (e.g., Ganache)
    const accounts = await web3.eth.getAccounts();

    // Distributor Ethereum address
    const distributorAddress = "0xa8224Bf4010Fb0eA7DB1e259DC75c070510dcEc1";

    // Distributor details
    const name = "DHL Logistics";
    const physicalAddress = "Abubaker Razi Street, Sulaimaniyah District, Riyadh, Saudi Arabia";
    const phoneNumber = "+966 11 4621919";
    const email = "logistics@dhl.com";
    const isRefrigerated = true; // Supports refrigerated shipments
    const isFrozen = true; // Supports frozen shipments
    const isAmbient = true; // Supports ambient temperature shipments
    const isPM = true; // Available for evening deliveries
    const isAM = true; // Available for morning deliveries
    const workingDays = [true, true, true, true, true, true, false]; // sunday to friday, not saturday

    // Send the transaction to add a distributor, using an account from Ganache
    const result = await roleContract.addDistributor(
      distributorAddress,
      name,
      physicalAddress,
      phoneNumber,
      email,
      isRefrigerated,
      isFrozen,
      isAmbient,
      isPM,
      isAM,
      workingDays,
      { from: accounts[0] } // Use the first account from Ganache or MetaMask
    );

    console.log("Distributor added successfully:", result);
    callback(); // End the script
  } catch (error) {
    console.error("Error adding distributor:", error);
    callback(error);
  }
};
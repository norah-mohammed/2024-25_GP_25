const RoleContract = artifacts.require("RoleContract");

module.exports = async function (callback) {
  try {
    // Get the deployed contract instance
    const roleContract = await RoleContract.deployed();

    // Get accounts from your local environment (e.g., Ganache)
    const accounts = await web3.eth.getAccounts();

    // Distributor Ethereum address to be updated
    const distributorAddress = "0x5841278Ca9641dc81451036958133D84e8476281";

    // Updated details for FreshLink Logistics
    const updatedName = "FreshLink Logistics"; // Keep the same name
    const updatedPhysicalAddress = "Riyadh, Saudi Arabia"; // Keep the same address
    const updatedPhoneNumber = "+966-555-123456"; // Keep the same phone number
    const updatedEmail = "contact@freshlink.com"; // Keep the same email
    const updatedIsRefrigerated = true; // Still supports refrigerated shipments
    const updatedIsFrozen = true; // Still supports frozen shipments
    const updatedIsAmbient = true; // Still supports ambient temperature shipments
    const updatedIsPM = true; // Enable evening deliveries
    const updatedIsAM = false; // Disable morning deliveries
    const updatedWorkingDays = [true, true, true, true, true, false, false]; // Sunday to Thursday, unchanged

    // Send the transaction to update FreshLink Logistics' info
    const result = await roleContract.updateDistributor(
      distributorAddress,
      updatedName,
      updatedPhysicalAddress,
      updatedPhoneNumber,
      updatedEmail,
      updatedIsRefrigerated,
      updatedIsFrozen,
      updatedIsAmbient,
      updatedIsPM,
      updatedIsAM,
      updatedWorkingDays,
      { from: accounts[0] } // Use the first account from Ganache or MetaMask
    );

    console.log("FreshLink Logistics info updated successfully:", result);
    callback(); // End the script
  } catch (error) {
    console.error("Error updating FreshLink Logistics info:", error);
    callback(error);
  }
};

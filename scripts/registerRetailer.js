const RoleContract = artifacts.require("RoleContract");

module.exports = async function (callback) {
  try {
    const roleContract = await RoleContract.deployed();
    const accounts = await web3.eth.getAccounts();

    // Specific details for Carrefour KSA
    const retailerAddress = "0xA432f3769529fBeC4b5Ee1941a6fd0AF5d30247F"; // Ethereum address of the retailer

    // Add Carrefour KSA as a retailer
    await roleContract.addRetailer(
      retailerAddress,                          // Ethereum address of the retailer
      "Carrefour KSA",                          // Retailer name as Carrefour KSA
      "King Fahd Road, Riyadh",                 // Specific physical address in Riyadh, Saudi Arabia
      "0112345678",                             // Local phone number format
      "info@carrefourksa.com",                  // Localized email address for Carrefour KSA
      { from: accounts[0] }                     // Transaction sent from the first account (admin/owner)
    );

    console.log("Carrefour KSA registered successfully!");

    // Retrieve retailer info from the contract (assuming a function like getRetailer exists)
    const retailerInfo = await roleContract.getRetailer(retailerAddress);

    // Print out Carrefour KSA's information
    console.log("Retailer Information:");
    console.log("Ethereum Address:", retailerInfo[0]);
    console.log("Name:", retailerInfo[1]);
    console.log("Physical Address:", retailerInfo[2]);
    console.log("Phone Number:", retailerInfo[3]);
    console.log("Email:", retailerInfo[4]);

    callback();  // End the script
  } catch (error) {
    console.error("Error registering Carrefour KSA:", error);
    callback(error);
  }
};

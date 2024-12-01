const RoleContract = artifacts.require("RoleContract");

module.exports = async function (callback) {
  try {
    const roleContract = await RoleContract.deployed();
    const accounts = await web3.eth.getAccounts();

    // Specific details for Danube
    const retailerAddress = "0xcE1072a87a0edAF7508CfeC4d31594E7c20b75F5"; // Ethereum address of the retailer

    // Add Danube as a retailer
    await roleContract.addRetailer(
      retailerAddress,                          // Ethereum address of the retailer
      "Danube",                                 // Retailer name as Danube
      "King Fahd Road, Riyadh",                 // Physical address in Riyadh, Saudi Arabia
      "0112345678",                             // Local phone number format
      "info@danube.com",                        // Email address for Danube
      { from: accounts[0] }                     // Transaction sent from the first account (admin/owner)
    );

    console.log("Danube registered successfully!");

    // Retrieve retailer info from the contract (assuming a function like getRetailer exists)
    const retailerInfo = await roleContract.getRetailer(retailerAddress);

    // Print out Danube's information
    console.log("Retailer Information:");
    console.log("Ethereum Address:", retailerInfo[0]);
    console.log("Name:", retailerInfo[1]);
    console.log("Physical Address:", retailerInfo[2]);
    console.log("Phone Number:", retailerInfo[3]);
    console.log("Email:", retailerInfo[4]);

    callback();  // End the script
  } catch (error) {
    console.error("Error registering Danube:", error);
    callback(error);
  }
};

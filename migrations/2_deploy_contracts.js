const ProductContract = artifacts.require("ProductContract");
const RoleContract = artifacts.require("RoleContract");
const OrderContract = artifacts.require("OrderContract");

module.exports = async function (deployer) {
  // Step 1: Deploy RoleContract first (needed by both Product and Order contracts)
  await deployer.deploy(RoleContract);
  const roleContractInstance = await RoleContract.deployed();

  // Step 2: Deploy ProductContract with the RoleContract's address
  await deployer.deploy(ProductContract, roleContractInstance.address);

  // Step 3: Deploy OrderContract with the RoleContract's address
  await deployer.deploy(OrderContract, roleContractInstance.address);
};



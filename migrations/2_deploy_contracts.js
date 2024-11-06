const ProductContract = artifacts.require("ProductContract");
const RoleContract = artifacts.require("RoleContract");
const OrderContract = artifacts.require("OrderContract");

module.exports = async function (deployer) {
  // Step 1: Deploy RoleContract first
  await deployer.deploy(RoleContract);

  // Get the deployed RoleContract's address
  const roleContractAddress = RoleContract.address;

  // Step 2: Deploy ProductContract with the RoleContract's address
  await deployer.deploy(ProductContract, roleContractAddress);

  // Step 3: Deploy OrderContract (no arguments needed for now)
  await deployer.deploy(OrderContract);
};

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployGameAccessControl: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy, get } = hre.deployments;

  // Get the deployed GameOwnership contract
  const gameOwnership = await get("GameOwnership");

  await deploy("GameAccessControl", {
    from: deployer,
    args: [gameOwnership.address],
    log: true,
    autoMine: true,
  });
};

export default deployGameAccessControl;
deployGameAccessControl.tags = ["GameAccessControl"];
deployGameAccessControl.dependencies = ["GameOwnership"]; // Ensure GameOwnership is deployed first

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployGameOwnership: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("GameOwnership", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployGameOwnership;
deployGameOwnership.tags = ["GameOwnership"];

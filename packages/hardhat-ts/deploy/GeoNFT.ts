import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const geoNFTDeployFunc: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  await deploy("GeoNFT", {
    from: deployer,
    // gas: 4000000,
    args: [],
  });

  console.log("deployed GeoNFT");
};
export default geoNFTDeployFunc;

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  // the following will only deploy "GenericMetaTxProcessor" if the contract was never deployed or if the code changed since last deployment
  await deploy("GEONFT", {
    from: deployer,
    // gas: 4000000,
    args: [],
  });

  console.log("deployed GEONFT");
};
export default func;

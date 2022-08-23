import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const sdRegistryDeployFunc: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, get } = deployments;

  const { deployer } = await getNamedAccounts();

  const geoNFTDeployment = await get("GeoNFT");

  // deploy Trigonometry Library
  const TrigonometryLibrary = await deploy("Trigonometry", {
    from: deployer,
  });

  // deploy AreaCalculation Library
  const areaCalculationLibrary = await deploy("AreaCalculation", {
    from: deployer,
    libraries: {
      Trigonometry: TrigonometryLibrary.address,
    },
  });

  // deploy GeohashUtils Library
  const GeohashUtilsLibrary = await deploy("GeohashUtils", {
    from: deployer,
  });

  const deployResult = await deploy("SDRegistry", {
    from: deployer,
    // gas: 4000000,
    args: [geoNFTDeployment.address],
    libraries: {
      AreaCalculation: areaCalculationLibrary.address,
      GeohashUtils: GeohashUtilsLibrary.address,
      Trigonometry: TrigonometryLibrary.address,
    },
  });

  // get address from the deployed SD Registry contract
  console.log(`SD Registry contract address: ${deployResult.address}`);
  console.log(`GeoNFT contract address: ${geoNFTDeployment.address}`);
};
export default sdRegistryDeployFunc;
sdRegistryDeployFunc.runAtTheEnd = true;

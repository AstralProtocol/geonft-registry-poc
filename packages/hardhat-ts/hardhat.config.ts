import { config as dotEnvConfig } from "dotenv";

import { HardhatUserConfig, HttpNetworkHDAccountsConfig } from "hardhat/types";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-solhint";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "hardhat-deploy";
import "hardhat-deploy-ethers";

import "./tasks/operations/accounts";
dotEnvConfig();

const CELO_MNEMONIC = process.env.MNEMONIC;
const CELO_DERIVATION_PATH = "m/44'/52752'/0'/0/";

const accounts: HttpNetworkHDAccountsConfig = {
  mnemonic:
    CELO_MNEMONIC ||
    "test test test test test test test test test test test junk",
  path: CELO_DERIVATION_PATH,
  initialIndex: 0,
  count: 10,
  passphrase: "",
};

const config: HardhatUserConfig = {
  solidity: {
    compilers: [{ version: "0.8.13", settings: {} }],
  },
  paths: {
    sources: "contracts",
  },
  namedAccounts: {
    deployer: 0,
    tokenOwner: 1,
  },
  networks: {
    hardhat: {
      initialBaseFeePerGas: 0, // to fix : https://github.com/sc-forks/solidity-coverage/issues/652, see https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136
    },
    localhost: {
      url: "http://localhost:8545",
      accounts,
    },
    alfajores: {
      url: "https://alfajores-forno.celo-testnet.org",
      accounts,
      chainId: 44787,
    },
    celo: {
      url: "https://forno.celo.org",
      accounts,
      chainId: 42220,
    },
  },
  gasReporter: {
    enabled: !!process.env.REPORT_GAS,
    currency: "USD",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};

export default config;

# Kolektivo Curaçao GeoNFT Proof-of-Concept

Monorepo with two packages:

- hardhat-ts: a hardhat typescript project
  - runs and deploys the NFT contract to a local node
  - deploys contract to Alfajores testnet
  - deploys contract to Celo mainnet
- dapp: a React, Redux web application
  - allows anyone to mint a GeoNFT
  - IPFS for metadata
  - adds a Ceramic document

## TODO

- hardhat-ts
  - add Verifiable Spatial Data Registry mock

- dapp
  - Add wallet mock to expand testing in Jest
  - update decentralized data storage methods

## Requirements

Yarn

### Setup .env file for dapp

Create an Infura Account and an Infura project with IPFS Service, copy `.env.sample` to `.env` and fill in the following fields:

PROJECT_ID=

PROJECT_SECRET=

### Setup Metamask

To run locally, create a new profile in Chrome and open the Metamask plugin.

Import the test seed phrase: `test test test test test test test test test test test junk`

Under `Networks` click `Add Network` with the following values:

- Network Name: localhost:8545
- RPC URL: <http://localhost:8545>
- Chain ID: 31337
- Currency Symbol: ETH

## Install

```bash
git clone https://github.com/AstralProtocol/kolektivo-curacao-geonft-poc.git
cd 
yarn install
```

## Run

Open a terminal and run `yarn hardhat:localnode`

Open packages/dapp/webpack.config.js and update devServer...host with your IP Address.

Open a second terminal and run `yarn dapp:start`

Open your Chrome profile with test Metamask instance and go to <https://YOURIPADDRESS:8080/>

Connect either with your Metamask wallet or Alfajores wallet.

## Available Scripts

In the project directory, you can run:

### dapp

#### `yarn dapp:start`

Runs the app in development mode on <https://YOURIPADDRESS:8080/>

#### `yarn dapp:test`

Runs the React test watcher in an interactive mode.
By default, runs tests related to files changed since the last commit.

[Read more about testing React.](https://facebook.github.io/create-react-app/docs/running-tests)

#### `yarn dapp:webpack`

Builds the dapp for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

### hardhat-ts

#### `yarn hardhat:test`

Run the tests in the test directory

#### `yarn hardhat:watch`

Starts a local node, deploys contracts, updates the deployments/localhost folder with contract address and abi.

On contract update, will redeploy contract and update deployments folder.

#### `yarn hardhat:deployalfa`

Deploys the contract to Alfajores and records the address in the deployments/alfajores directory

#### `yarn hardhat:deploycelo`

Deploys the contract to Celo and records the address in the deployments/celo directory

require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const PRIVATE_KEY = process.env.HEDERA_PRIVATE_KEY || "";

module.exports = {
  solidity: "0.8.20",
  networks: {
    hederaTestnet: {
      url: "https://testnet.hashio.io/api",
      accounts: [PRIVATE_KEY],
      chainId: 296,
    },
  },
};
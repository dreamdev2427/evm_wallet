import { phoenixSwapOnAvalancheAbi } from "./abis/phoenixSwapOnAvalancheAbi";
import { phoenixSwapOnBinanceAbi } from "./abis/phoenixSwapOnBinance";
import { phoenixSwapOnPolygonAbi } from "./abis/phoenixSwapOnPolygon";

export const MAINNET_NETWORK_ID = '1';
export const BSC_NETWORK_ID = '56';
export const POLYGON_NETWORK_ID = '137';
export const AVALANCHE_NETWORK_ID = '43114';
export const FANTOM_NETWORK_ID = '250';
export const ROPSTEN_NETWORK_ID = '3';
export const RINKEBY_NETWORK_ID = '4';
export const GOERLI_NETWORK_ID = '5';
export const KOVAN_NETWORK_ID = '42';
export const LOCALHOST_NETWORK_ID = '1337';

export const MAINNET_CHAIN_ID = '0x1';
export const ROPSTEN_CHAIN_ID = '0x3';
export const RINKEBY_CHAIN_ID = '0x4';
export const GOERLI_CHAIN_ID = '0x5';
export const KOVAN_CHAIN_ID = '0x2a';
export const LOCALHOST_CHAIN_ID = '0x539';
export const BSC_CHAIN_ID = '0x38';
export const OPTIMISM_CHAIN_ID = '0xa';
export const OPTIMISM_TESTNET_CHAIN_ID = '0x45';
export const POLYGON_CHAIN_ID = '0x89';
export const AVALANCHE_CHAIN_ID = '0xa86a';
export const FANTOM_CHAIN_ID = '0xfa';
export const CELO_CHAIN_ID = '0xa4ec';

export const AVALANCHE_FUJI_CHAIN_ID = '0xa869';

export const SWAP_CONTRACT_SWAP_METHOD_IDS = {
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: "0xfe029156",
    [AVALANCHE_CHAIN_ID]: "0xfe029156",
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: "0xfe029156",

    [MAINNET_NETWORK_ID]: "",
    [BSC_NETWORK_ID]: "0xfe029156",
    [AVALANCHE_NETWORK_ID]: "0xfe029156",
    [RINKEBY_NETWORK_ID]: "",
    [POLYGON_NETWORK_ID]: "0xfe029156",
}

export const DEPOSITE_METHOD_ID_OF_WRAPPED_CURRENCY = "0xd0e30db0";
export const WITHDRAW_METHOD_ID_OF_WRAPPED_CURRENCY = "0x2e1a7d4d";

export const SWAP_CONTRACT_SWAP_AVAX_FOR_TOKENS_METHOD_IDS = {    
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: "0x3a1c339f",
    [AVALANCHE_CHAIN_ID]: "0x378a4d29",
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: "0xb79c48e5",

    [MAINNET_NETWORK_ID]: "",
    [BSC_NETWORK_ID]: "0x3a1c339f",
    [AVALANCHE_NETWORK_ID]: "0x378a4d29",
    [RINKEBY_NETWORK_ID]: "",
    [POLYGON_NETWORK_ID]: "0xb79c48e5",
}

export const SWAP_CONTRACT_SWAP_TOKENS_FOR_AVAX_METHOD_IDS = {    
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: "0x5e72a62b",
    [AVALANCHE_CHAIN_ID]: "0x6f2917eb",
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: "0xb0413694",  

    [MAINNET_NETWORK_ID]: "",
    [BSC_NETWORK_ID]: "0x5e72a62b",
    [AVALANCHE_NETWORK_ID]: "0x6f2917eb",
    [RINKEBY_NETWORK_ID]: "",
    [POLYGON_NETWORK_ID]: "0xb0413694",
}

export const SWAP_CONTRACT_ADDRESSES = {
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: "0x8D2499cA00e1e67a788452b5CB06DcB7f430AeA9",
    [AVALANCHE_CHAIN_ID]: "0x4812764e54363381A23d1609D509B92c1093f462",
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: "0xB524A30aB68D7DcF431963e1a527c894Fc4D23d4",
    
    [MAINNET_NETWORK_ID]: "",
    [BSC_NETWORK_ID]: "0x8D2499cA00e1e67a788452b5CB06DcB7f430AeA9",
    [AVALANCHE_NETWORK_ID]: "0x664d87c3CE571Ae0bc63377c6A0254d64B30f1F1",
    [RINKEBY_NETWORK_ID]: "",
    [POLYGON_NETWORK_ID]: "0xB524A30aB68D7DcF431963e1a527c894Fc4D23d4",
}

export const SWAP_CONTRACT_ABIS = {
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: phoenixSwapOnBinanceAbi,
    [AVALANCHE_CHAIN_ID]: phoenixSwapOnAvalancheAbi,
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: phoenixSwapOnPolygonAbi,
    [FANTOM_CHAIN_ID]: "",
    
    [MAINNET_NETWORK_ID]: "",
    [BSC_NETWORK_ID]: phoenixSwapOnBinanceAbi,
    [AVALANCHE_NETWORK_ID]: phoenixSwapOnAvalancheAbi,
    [RINKEBY_NETWORK_ID]: "",
    [POLYGON_NETWORK_ID]: phoenixSwapOnPolygonAbi,
    [FANTOM_NETWORK_ID]: "",
}

export const HTTP_PROVIDERS = {
    [AVALANCHE_CHAIN_ID]: "https://api.avax.network/ext/bc/C/rpc",
    [AVALANCHE_FUJI_CHAIN_ID]: "https://speedy-nodes-nyc.moralis.io/e463de41b2b5a141ba47e9dd/avalanche/testnet",//"https://api.avax-test.network/ext/bc/C/rpc",
    [RINKEBY_CHAIN_ID]: "https://speedy-nodes-nyc.moralis.io/e463de41b2b5a141ba47e9dd/eth/rinkeby", //RINKEBY_RPC_URL,
    [MAINNET_CHAIN_ID]: "https://speedy-nodes-nyc.moralis.io/e463de41b2b5a141ba47e9dd/eth/mainnet",//MAINNET_RPC_URL,
    [BSC_CHAIN_ID]: "https://bsc-dataseed1.binance.org/",
    [POLYGON_CHAIN_ID]: "https://polygon-rpc.com/",
    [FANTOM_CHAIN_ID]: "https://speedy-nodes-nyc.moralis.io/e463de41b2b5a141ba47e9dd/fantom/mainnet",
    
    [AVALANCHE_NETWORK_ID]: "https://api.avax.network/ext/bc/C/rpc",    
    [RINKEBY_NETWORK_ID]: "https://speedy-nodes-nyc.moralis.io/e463de41b2b5a141ba47e9dd/eth/rinkeby", //RINKEBY_RPC_URL,
    [MAINNET_NETWORK_ID]: "https://speedy-nodes-nyc.moralis.io/e463de41b2b5a141ba47e9dd/eth/mainnet",//MAINNET_RPC_URL,
    [BSC_NETWORK_ID]: "https://bsc-dataseed1.binance.org/",
    [POLYGON_NETWORK_ID]: "https://polygon-rpc.com/",
    [FANTOM_NETWORK_ID]: "https://speedy-nodes-nyc.moralis.io/e463de41b2b5a141ba47e9dd/fantom/mainnet",
}

export const WRAPPED_CURRENCY_ADDRESSES = {
    [AVALANCHE_CHAIN_ID]: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    [MAINNET_CHAIN_ID]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    [BSC_CHAIN_ID]: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    [POLYGON_CHAIN_ID]: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    [FANTOM_CHAIN_ID]: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83",

    [AVALANCHE_NETWORK_ID]: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    [MAINNET_NETWORK_ID]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    [BSC_NETWORK_ID]: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    [POLYGON_NETWORK_ID]: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    [FANTOM_NETWORK_ID]: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83"
}

export const URLS_FOR_FETCHING_GAS_OF_NETWORK = {
    [AVALANCHE_CHAIN_ID]: 'https://api.debank.com/chain/gas_price_dict_v2?chain=avax',
    [MAINNET_CHAIN_ID]: `https://gas-api.metaswap.codefi.network/networks/${MAINNET_NETWORK_ID}/gasPrices`,
    [BSC_CHAIN_ID]: `https://gas-api.metaswap.codefi.network/networks/${BSC_NETWORK_ID}/gasPrices`,
    [POLYGON_CHAIN_ID]: `https://gas-api.metaswap.codefi.network/networks/${POLYGON_NETWORK_ID}/gasPrices`,
    [FANTOM_CHAIN_ID]: 'https://api.debank.com/chain/gas_price_dict_v2?chain=ftm',
    
    [AVALANCHE_NETWORK_ID]: 'https://api.debank.com/chain/gas_price_dict_v2?chain=avax',
    [MAINNET_NETWORK_ID]: `https://gas-api.metaswap.codefi.network/networks/${MAINNET_NETWORK_ID}/gasPrices`,
    [BSC_NETWORK_ID]: `https://gas-api.metaswap.codefi.network/networks/${BSC_NETWORK_ID}/gasPrices`,
    [POLYGON_NETWORK_ID]: `https://gas-api.metaswap.codefi.network/networks/${POLYGON_NETWORK_ID}/gasPrices`,
    [FANTOM_NETWORK_ID]: 'https://api.debank.com/chain/gas_price_dict_v2?chain=ftm'
}

export const supported4Networks = {
    [BSC_CHAIN_ID]:{
      rpcUrl: "https://bsc-dataseed1.binance.org/",
      prefixedChainId: BSC_CHAIN_ID,
      ticker: "BNB",
      networkName: "BNB Smart Chain Mainnet",
      blockExplorerUrl: "https://bscscan.com/"
    },
    [BSC_NETWORK_ID]:{
        rpcUrl: "https://bsc-dataseed1.binance.org/",
        prefixedChainId: BSC_CHAIN_ID,
        ticker: "BNB",
        networkName: "BNB Smart Chain Mainnet",
        blockExplorerUrl: "https://bscscan.com/"
    },
    [POLYGON_CHAIN_ID]:{
      rpcUrl: "https://polygon-rpc.com/",
      prefixedChainId: POLYGON_CHAIN_ID,
      ticker: "MATIC",
      networkName: "Matic Mainnet",
      blockExplorerUrl: "https://polygonscan.com/"
    },
    [POLYGON_NETWORK_ID]:{
      rpcUrl: "https://polygon-rpc.com/",
      prefixedChainId: POLYGON_CHAIN_ID,
      ticker: "MATIC",
      networkName: "Matic Mainnet",
      blockExplorerUrl: "https://polygonscan.com/"
    },
    [AVALANCHE_CHAIN_ID]:{
      rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
      prefixedChainId: AVALANCHE_CHAIN_ID,
      ticker: "AVAX",
      networkName: "Avalanche Mainnet",
      blockExplorerUrl: "https://snowtrace.io/"
    },
    [AVALANCHE_NETWORK_ID]:{
      rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
      prefixedChainId: AVALANCHE_CHAIN_ID,
      ticker: "AVAX",
      networkName: "Avalanche Mainnet",
      blockExplorerUrl: "https://snowtrace.io/"
    }
}


export const COINGEKCO_NETWORK_ID = {
  [AVALANCHE_CHAIN_ID]: "avalanche",
  [MAINNET_CHAIN_ID]: "ethereum",
  [BSC_CHAIN_ID]: "binance-smart-chain",
  [POLYGON_CHAIN_ID]: "polygon-pos",
  [FANTOM_CHAIN_ID]: "fantom"
}


export const ETH_TOKEN_IMAGE_URL = './images/eth-logo.png';
export const TEST_ETH_TOKEN_IMAGE_URL = './images/black-eth-logo.svg';
export const BNB_TOKEN_IMAGE_URL = './images/bnb-logo.png';
export const MATIC_TOKEN_IMAGE_URL = './images/polygon-matic-logo.svg';
export const AVAX_TOKEN_IMAGE_URL = './images/avax-logo.png';
export const FANTOM_TOKEN_IMAGE_URL = './images/fantom-ftm-logo.png';
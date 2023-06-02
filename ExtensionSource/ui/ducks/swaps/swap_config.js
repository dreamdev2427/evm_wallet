import {
    MAINNET_CHAIN_ID,
    BSC_CHAIN_ID,
    POLYGON_CHAIN_ID,
    RINKEBY_CHAIN_ID,
    AVALANCHE_CHAIN_ID,
    ROPSTEN_RPC_URL,
    RINKEBY_RPC_URL,
    MAINNET_RPC_URL,
    KOVAN_CHAIN_ID,
    FANTOM_CHAIN_ID,
    AVALANCHE_NETWORK_ID,
    MAINNET_NETWORK_ID,
    BSC_NETWORK_ID,
    POLYGON_NETWORK_ID,    
} from "../../../shared/constants/network";

import { phoenixSwapOnAvalancheAbi } from "./abis/phoenixSwapOnAvalancheAbi";
import { phoenixSwapOnBinanceAbi } from "./abis/phoenixSwapOnBinance";
import { phoenixSwapOnFantomAbi } from "./abis/phoenixSwapOnFantomAbi";
import { phoenixSwapOnPolygonAbi } from "./abis/phoenixSwapOnPolygon";

export const AVALANCHE_FUJI_CHAIN_ID = '0xa869';

export const SWAP_CONTRACT_SWAP_METHOD_IDS = {
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: "0xfe029156",
    [AVALANCHE_CHAIN_ID]: "0xfe029156",
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: "0xfe029156",
    [FANTOM_CHAIN_ID]: "0xfe029156"
}

export const DEPOSITE_METHOD_ID_OF_WRAPPED_CURRENCY = "0xd0e30db0";
export const WITHDRAW_METHOD_ID_OF_WRAPPED_CURRENCY = "0x2e1a7d4d";

export const SWAP_CONTRACT_SWAP_AVAX_FOR_TOKENS_METHOD_IDS = {    
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: "0x3a1c339f",
    [AVALANCHE_CHAIN_ID]: "0x378a4d29",
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: "0xb79c48e5",
    [FANTOM_CHAIN_ID]: "0xb79c48e5"
}

export const SWAP_CONTRACT_SWAP_TOKENS_FOR_AVAX_METHOD_IDS = {    
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: "0x5e72a62b",
    [AVALANCHE_CHAIN_ID]: "0x6f2917eb",
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: "0xb0413694",
    [FANTOM_CHAIN_ID]: "0xb0413694"
}

export const SWAP_CONTRACT_ADDRESSES = {
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: "0xB6598ff5BF9D420CCeC4304B30a71623069b54B4",
    [AVALANCHE_CHAIN_ID]: "0x4812764e54363381A23d1609D509B92c1093f462",
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: "0xe3C69B1C797C01B7C0AA98cf2B9f7fa0b32CB303",
    [FANTOM_CHAIN_ID]: "0xDb03711cC23c3E7C597835d469B0084b0254d2F9"
}

export const SWAP_CONTRACT_ABIS = {
    [MAINNET_CHAIN_ID]: "",
    [BSC_CHAIN_ID]: phoenixSwapOnBinanceAbi,
    [AVALANCHE_CHAIN_ID]: phoenixSwapOnAvalancheAbi,
    [RINKEBY_CHAIN_ID]: "",
    [POLYGON_CHAIN_ID]: phoenixSwapOnPolygonAbi,
    [FANTOM_CHAIN_ID]: phoenixSwapOnFantomAbi,
}

export const HTTP_PROVIDERS = {
    [AVALANCHE_CHAIN_ID]: "https://api.avax.network/ext/bc/C/rpc",
    [AVALANCHE_FUJI_CHAIN_ID]:"https://api.avax-test.network/ext/bc/C/rpc",
    [RINKEBY_CHAIN_ID]: RINKEBY_RPC_URL,
    [MAINNET_CHAIN_ID]: MAINNET_RPC_URL,
    [BSC_CHAIN_ID]: "https://bsc-dataseed1.binance.org/",
    [POLYGON_CHAIN_ID]: "https://polygon-rpc.com/",
    [FANTOM_CHAIN_ID]: "https://rpcapi.fantom.network/",
}

export const WRAPPED_CURRENCY_ADDRESSES = {
    [AVALANCHE_CHAIN_ID]: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
    [MAINNET_CHAIN_ID]: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    [BSC_CHAIN_ID]: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
    [POLYGON_CHAIN_ID]: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
    [FANTOM_CHAIN_ID]: "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83"
}

export const URLS_FOR_FETCHING_GAS_OF_NETWORK = {
    [AVALANCHE_CHAIN_ID]: 'https://api.debank.com/chain/gas_price_dict_v2?chain=avax',
    [MAINNET_CHAIN_ID]: `https://gas-api.metaswap.codefi.network/networks/${MAINNET_NETWORK_ID}/gasPrices`,
    [BSC_CHAIN_ID]: `https://gas-api.metaswap.codefi.network/networks/${BSC_NETWORK_ID}/gasPrices`,
    [POLYGON_CHAIN_ID]: `https://gas-api.metaswap.codefi.network/networks/${POLYGON_NETWORK_ID}/gasPrices`,
    [FANTOM_CHAIN_ID]: 'https://api.debank.com/chain/gas_price_dict_v2?chain=ftm'
}

export const COINGEKCO_NETWORK_ID = {
    [AVALANCHE_CHAIN_ID]: "avalanche",
    [MAINNET_CHAIN_ID]: "ethereum",
    [BSC_CHAIN_ID]: "binance-smart-chain",
    [POLYGON_CHAIN_ID]: "polygon-pos",
    [FANTOM_CHAIN_ID]: "fantom"
}

export const backendForMoralisURL = "http://89.163.242.42:2083";

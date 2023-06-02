import { createSlice } from '@reduxjs/toolkit';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import log from 'loglevel';
import Web3 from "web3";
import erc20abi from 'human-standard-token-abi';
import  {
  
  SWAP_CONTRACT_ADDRESSES,
  SWAP_CONTRACT_ABIS,
  HTTP_PROVIDERS,
  SWAP_CONTRACT_SWAP_METHOD_IDS,
  SWAP_CONTRACT_SWAP_AVAX_FOR_TOKENS_METHOD_IDS,
  SWAP_CONTRACT_SWAP_TOKENS_FOR_AVAX_METHOD_IDS,
  WRAPPED_CURRENCY_ADDRESSES,
  DEPOSITE_METHOD_ID_OF_WRAPPED_CURRENCY,
  WITHDRAW_METHOD_ID_OF_WRAPPED_CURRENCY
 } from "./swap_config.js";

import { captureMessage } from '@sentry/browser';

import {
  addToken,
  addUnapprovedTransaction,
  fetchAndSetQuotes,
  forceUpdateMetamaskState,
  resetSwapsPostFetchState,
  setBackgroundSwapRouteState,
  setInitialGasEstimate,
  setSwapsErrorKey,
  setSwapsTxGasPrice,
  setApproveTxId,
  setTradeTxId,
  stopPollingForQuotes,
  updateAndApproveTx,
  updateTransaction,
  resetBackgroundSwapsState,
  setSwapsLiveness,
  setSwapsFeatureFlags,
  setSelectedQuoteAggId,
  setSwapsTxGasLimit,
  cancelTx,
  fetchSmartTransactionsLiveness,
  signAndSendSmartTransaction,
  updateSmartTransaction,
  setSmartTransactionsRefreshInterval,
  fetchSmartTransactionFees,
  estimateSmartTransactionsGas,
  cancelSmartTransaction,
} from '../../store/actions';
import {
  AWAITING_SIGNATURES_ROUTE,
  AWAITING_SWAP_ROUTE,
  BUILD_QUOTE_ROUTE,
  LOADING_QUOTES_ROUTE,
  SWAPS_ERROR_ROUTE,
  SWAPS_MAINTENANCE_ROUTE,
  SMART_TRANSACTION_STATUS_ROUTE,
} from '../../helpers/constants/routes';
import {
  fetchSwapsFeatureFlags,
  fetchSwapsGasPrices,
  isContractAddressValid,
  getSwapsLivenessForNetwork,
  parseSmartTransactionsError,
  stxErrorTypes,
} from '../../pages/swaps/swaps.util';
import { calcGasTotal } from '../../pages/send/send.utils';
import {
  decimalToHex,
  getValueFromWeiHex,
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
  addHexes,
} from '../../helpers/utils/conversions.util';
import { conversionLessThan } from '../../../shared/modules/conversion.utils';
import { calcTokenAmount, calcTokenValue } from '../../helpers/utils/token-util';
import {
  getSelectedAccount,
  getTokenExchangeRates,
  getUSDConversionRate,
  getSwapsDefaultToken,
  getCurrentChainId,
  isHardwareWallet,
  getHardwareWalletType,
  checkNetworkAndAccountSupports1559,
  getSelectedAddress,
  getSwapToTokenValue,
  getSwapEstimatedFee,
  getNativeBalance,
} from '../../selectors';
import {
  ERROR_FETCHING_QUOTES,
  QUOTES_NOT_AVAILABLE_ERROR,
  CONTRACT_DATA_DISABLED_ERROR,
  SWAP_FAILED_ERROR,
  SWAPS_FETCH_ORDER_CONFLICT,
  ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS,
  DEFAULT_ERC20_APPROVE_GAS,
} from '../../../shared/constants/swaps';
import {
  TRANSACTION_TYPES,
  SMART_TRANSACTION_STATUSES,
} from '../../../shared/constants/transaction';
import { getGasFeeEstimates, getBlockGasLimit } from '../metamask/metamask';
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, POLYGON_CHAIN_ID } from '../../../shared/constants/network.js';
import { left } from '@popperjs/core';
import { calculateSizingOptions } from '@metamask/logo/util';

const GAS_PRICES_LOADING_STATES = {
  INITIAL: 'INITIAL',
  LOADING: 'LOADING',
  FAILED: 'FAILED',
  COMPLETED: 'COMPLETED',
};

export const FALLBACK_GAS_MULTIPLIER = 1.5;

const initialState = {
  aggregatorMetadata: null,
  approveTxId: null,
  tradeTxId: null,
  balanceError: false,
  fetchingQuotes: false,
  fromToken: null,
  fromTokenInputValue: '',
  fromTokenError: null,
  isFeatureFlagLoaded: false,
  maxSlippage: 3,
  quotesFetchStartTime: null,
  reviewSwapClickedTimestamp: null,
  topAssets: {},
  toToken: null,
  customGas: {
    price: null,
    limit: null,
    loading: GAS_PRICES_LOADING_STATES.INITIAL,
    priceEstimates: {},
    fallBackPrice: null,
  },
  currentSmartTransactionsError: '',
  currentSmartTransactionsErrorMessageDismissed: false,
  swapsSTXLoading: false,
};

const slice = createSlice({
  name: 'swaps',
  initialState,
  reducers: {
    clearSwapsState: () => initialState,
    navigatedBackToBuildQuote: (state) => {
      state.approveTxId = null;
      state.tradeTxId = null;
      state.balanceError = false;
      state.fetchingQuotes = false;
      state.customGas.limit = null;
      state.customGas.price = null;
    },
    retriedGetQuotes: (state) => {
      state.approveTxId = null;
      state.balanceError = false;
      state.fetchingQuotes = false;
    },
    setAggregatorMetadata: (state, action) => {
      state.aggregatorMetadata = action.payload;
    },
    setBalanceError: (state, action) => {
      state.balanceError = action.payload;
    },
    setFetchingQuotes: (state, action) => {
      state.fetchingQuotes = action.payload;
    },
    setFromToken: (state, action) => {
      state.fromToken = action.payload;
    },
    setFromTokenInputValue: (state, action) => {
      state.fromTokenInputValue = action.payload;
    },
    setFromTokenError: (state, action) => {
      state.fromTokenError = action.payload;
    },
    setIsFeatureFlagLoaded: (state, action) => {
      state.isFeatureFlagLoaded = action.payload;
    },
    setMaxSlippage: (state, action) => {
      state.maxSlippage = action.payload;
    },
    setQuotesFetchStartTime: (state, action) => {
      state.quotesFetchStartTime = action.payload;
    },
    setReviewSwapClickedTimestamp: (state, action) => {
      state.reviewSwapClickedTimestamp = action.payload;
    },
    setTopAssets: (state, action) => {
      state.topAssets = action.payload;
    },
    setToToken: (state, action) => {
      state.toToken = action.payload;
    },
    swapCustomGasModalClosed: (state) => {
      state.customGas.price = null;
      state.customGas.limit = null;
    },
    swapCustomGasModalPriceEdited: (state, action) => {
      state.customGas.price = action.payload;
    },
    swapCustomGasModalLimitEdited: (state, action) => {
      state.customGas.limit = action.payload;
    },
    swapGasPriceEstimatesFetchStarted: (state) => {
      state.customGas.loading = GAS_PRICES_LOADING_STATES.LOADING;
    },
    swapGasPriceEstimatesFetchFailed: (state) => {
      state.customGas.loading = GAS_PRICES_LOADING_STATES.FAILED;
    },
    swapGasPriceEstimatesFetchCompleted: (state, action) => {
      state.customGas.priceEstimates = action.payload.priceEstimates;
      state.customGas.loading = GAS_PRICES_LOADING_STATES.COMPLETED;
    },
    retrievedFallbackSwapsGasPrice: (state, action) => {
      state.customGas.fallBackPrice = action.payload;
    },
    setCurrentSmartTransactionsError: (state, action) => {
      const errorType = stxErrorTypes.includes(action.payload)
        ? action.payload
        : stxErrorTypes[0];
      state.currentSmartTransactionsError = errorType;
    },
    dismissCurrentSmartTransactionsErrorMessage: (state) => {
      state.currentSmartTransactionsErrorMessageDismissed = true;
    },
    setSwapsSTXSubmitLoading: (state, action) => {
      state.swapsSTXLoading = action.payload || false;
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

// Selectors

export const getAggregatorMetadata = (state) => state.swaps.aggregatorMetadata;

export const getBalanceError = (state) => state.swaps.balanceError;

export const getFromToken = (state) => state.swaps.fromToken;

export const getFromTokenError = (state) => state.swaps.fromTokenError;

export const getFromTokenInputValue = (state) =>
  state.swaps.fromTokenInputValue;

export const getIsFeatureFlagLoaded = (state) =>
  state.swaps.isFeatureFlagLoaded;

export const getSwapsSTXLoading = (state) => state.swaps.swapsSTXLoading;

export const getMaxSlippage = (state) => state.swaps.maxSlippage;

export const getTopAssets = (state) => state.swaps.topAssets;

export const getToToken = (state) => state.swaps.toToken;

export const getFetchingQuotes = (state) => state.swaps.fetchingQuotes;

export const getQuotesFetchStartTime = (state) =>
  state.swaps.quotesFetchStartTime;

export const getReviewSwapClickedTimestamp = (state) =>
  state.swaps.reviewSwapClickedTimestamp;

export const getSwapsCustomizationModalPrice = (state) =>
  state.swaps.customGas.price;

export const getSwapsCustomizationModalLimit = (state) =>
  state.swaps.customGas.limit;

export const swapGasPriceEstimateIsLoading = (state) =>
  state.swaps.customGas.loading === GAS_PRICES_LOADING_STATES.LOADING;

export const swapGasEstimateLoadingHasFailed = (state) =>
  state.swaps.customGas.loading === GAS_PRICES_LOADING_STATES.INITIAL;

export const getSwapGasPriceEstimateData = (state) =>
  state.swaps.customGas.priceEstimates;

export const getSwapsFallbackGasPrice = (state) =>
  state.swaps.customGas.fallBackPrice;

export const getCurrentSmartTransactionsError = (state) =>
  state.swaps.currentSmartTransactionsError;

export const getCurrentSmartTransactionsErrorMessageDismissed = (state) =>
  state.swaps.currentSmartTransactionsErrorMessageDismissed;

export function shouldShowCustomPriceTooLowWarning(state) {
  const { average } = getSwapGasPriceEstimateData(state);

  const customGasPrice = getSwapsCustomizationModalPrice(state);

  if (!customGasPrice || average === undefined) {
    return false;
  }

  const customPriceRisksSwapFailure = conversionLessThan(
    {
      value: customGasPrice,
      fromNumericBase: 'hex',
      fromDenomination: 'WEI',
      toDenomination: 'GWEI',
    },
    { value: average, fromNumericBase: 'dec' },
  );

  return customPriceRisksSwapFailure;
}

// Background selectors

const getSwapsState = (state) => state.metamask.swapsState;

export const getSwapsFeatureIsLive = (state) =>
  state.metamask.swapsState.swapsFeatureIsLive;

export const getSmartTransactionsError = (state) =>
  state.appState.smartTransactionsError;

export const getSmartTransactionsErrorMessageDismissed = (state) =>
  state.appState.smartTransactionsErrorMessageDismissed;

export const getSmartTransactionsEnabled = (state) => {
  const hardwareWalletUsed = isHardwareWallet(state);
  const chainId = getCurrentChainId(state);
  const isAllowedNetwork = ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS.includes(
    chainId,
  );
  const smartTransactionsFeatureFlagEnabled =
    state.metamask.swapsState?.swapsFeatureFlags?.smartTransactions
      ?.extensionActive;
  const smartTransactionsLiveness =
    state.metamask.smartTransactionsState?.liveness;
  return Boolean(
    isAllowedNetwork &&
      !hardwareWalletUsed &&
      smartTransactionsFeatureFlagEnabled &&
      smartTransactionsLiveness,
  );
};

export const getCurrentSmartTransactionsEnabled = (state) => {
  const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
  const currentSmartTransactionsError = getCurrentSmartTransactionsError(state);
  return smartTransactionsEnabled && !currentSmartTransactionsError;
};

export const getSwapsQuoteRefreshTime = (state) =>
  state.metamask.swapsState.swapsQuoteRefreshTime;

export const getSwapsQuotePrefetchingRefreshTime = (state) =>
  state.metamask.swapsState.swapsQuotePrefetchingRefreshTime;

export const getBackgroundSwapRouteState = (state) =>
  state.metamask.swapsState.routeState;

export const getCustomSwapsGas = (state) =>
  state.metamask.swapsState.customMaxGas;

export const getCustomSwapsGasPrice = (state) =>
  state.metamask.swapsState.customGasPrice;

export const getCustomMaxFeePerGas = (state) =>
  state.metamask.swapsState.customMaxFeePerGas;

export const getCustomMaxPriorityFeePerGas = (state) =>
  state.metamask.swapsState.customMaxPriorityFeePerGas;

export const getSwapsUserFeeLevel = (state) =>
  state.metamask.swapsState.swapsUserFeeLevel;

export const getFetchParams = (state) => state.metamask.swapsState.fetchParams;

export const getQuotes = (state) => 
{  
  return state.metamask.swapsState.quotes;
}

export const getQuotesLastFetched = (state) =>
  state.metamask.swapsState.quotesLastFetched;

export const getSelectedQuote = (state) => {
  const { selectedAggId, quotes } = getSwapsState(state);

  return quotes[selectedAggId];
};

export const getSwapsErrorKey = (state) => getSwapsState(state)?.errorKey;

export const getShowQuoteLoadingScreen = (state) =>
  state.swaps.showQuoteLoadingScreen;

export const getSwapsTokens = (state) => state.metamask.swapsState.tokens;

export const getSwapsWelcomeMessageSeenStatus = (state) =>
  state.metamask.swapsWelcomeMessageHasBeenShown;

export const getTopQuote = (state) => {
  const { topAggId, quotes } = getSwapsState(state);

  return quotes[topAggId];
};

export const getApproveTxId = (state) => state.metamask.swapsState.approveTxId;

export const getTradeTxId = (state) => state.metamask.swapsState.tradeTxId;

export const getUsedQuote = (state) =>
  getSelectedQuote(state) || getTopQuote(state);

// Compound selectors

export const getDestinationTokenInfo = (state) =>
  getFetchParams(state)?.metaData?.destinationTokenInfo;

export const getUsedSwapsGasPrice = (state) =>
  getCustomSwapsGasPrice(state) || getSwapsFallbackGasPrice(state);

export const getApproveTxParams = (state) => {
  const { approvalNeeded } =
    getSelectedQuote(state) || getTopQuote(state) || {};

  if (!approvalNeeded) {
    return null;
  }
  const data = getSwapsState(state)?.customApproveTxData || approvalNeeded.data;

  const gasPrice = getUsedSwapsGasPrice(state);
  return { ...approvalNeeded, gasPrice, data };
};

export const getSmartTransactionsOptInStatus = (state) => {
  return state.metamask.smartTransactionsState?.userOptIn;
};

export const getCurrentSmartTransactions = (state) => {
  return state.metamask.smartTransactionsState?.smartTransactions?.[
    getCurrentChainId(state)
  ];
};

export const getPendingSmartTransactions = (state) => {
  const currentSmartTransactions = getCurrentSmartTransactions(state);
  if (!currentSmartTransactions || currentSmartTransactions.length === 0) {
    return [];
  }
  return currentSmartTransactions.filter(
    (stx) => stx.status === SMART_TRANSACTION_STATUSES.PENDING,
  );
};

export const getSmartTransactionFees = (state) => {
  return state.metamask.smartTransactionsState?.fees;
};

export const getSmartTransactionEstimatedGas = (state) => {
  return state.metamask.smartTransactionsState?.estimatedGas;
};

export const getSwapsRefreshStates = (state) => {
  const {
    swapsQuoteRefreshTime,
    swapsQuotePrefetchingRefreshTime,
    swapsStxGetTransactionsRefreshTime,
    swapsStxBatchStatusRefreshTime,
    swapsStxStatusDeadline,
  } = state.metamask.swapsState;
  return {
    quoteRefreshTime: swapsQuoteRefreshTime,
    quotePrefetchingRefreshTime: swapsQuotePrefetchingRefreshTime,
    stxGetTransactionsRefreshTime: swapsStxGetTransactionsRefreshTime,
    stxBatchStatusRefreshTime: swapsStxBatchStatusRefreshTime,
    stxStatusDeadline: swapsStxStatusDeadline,
  };
};

// Actions / action-creators

const {
  clearSwapsState,
  navigatedBackToBuildQuote,
  retriedGetQuotes,
  swapGasPriceEstimatesFetchCompleted,
  swapGasPriceEstimatesFetchStarted,
  swapGasPriceEstimatesFetchFailed,
  setAggregatorMetadata,
  setBalanceError,
  setFetchingQuotes,
  setFromToken,
  setFromTokenError,
  setFromTokenInputValue,
  setIsFeatureFlagLoaded,
  setMaxSlippage,
  setQuotesFetchStartTime,
  setReviewSwapClickedTimestamp,
  setTopAssets,
  setToToken,
  swapCustomGasModalPriceEdited,
  swapCustomGasModalLimitEdited,
  retrievedFallbackSwapsGasPrice,
  swapCustomGasModalClosed,
  setCurrentSmartTransactionsError,
  dismissCurrentSmartTransactionsErrorMessage,
  setSwapsSTXSubmitLoading,
} = actions;

export {
  clearSwapsState,
  dismissCurrentSmartTransactionsErrorMessage,
  setAggregatorMetadata,
  setBalanceError,
  setFetchingQuotes,
  setFromToken as setSwapsFromToken,
  setFromTokenError,
  setFromTokenInputValue,
  setIsFeatureFlagLoaded,
  setMaxSlippage,
  setQuotesFetchStartTime as setSwapQuotesFetchStartTime,
  setReviewSwapClickedTimestamp,
  setTopAssets,
  setToToken as setSwapToToken,
  swapCustomGasModalPriceEdited,
  swapCustomGasModalLimitEdited,
  swapCustomGasModalClosed,
};

export const navigateBackToBuildQuote = (history) => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(setBackgroundSwapRouteState(''));
    dispatch(navigatedBackToBuildQuote());
    history.push(BUILD_QUOTE_ROUTE);
  };
};

export const prepareForRetryGetQuotes = () => {
  return async (dispatch) => {
    // TODO: Ensure any fetch in progress is cancelled
    await dispatch(resetSwapsPostFetchState());
    dispatch(retriedGetQuotes());
  };
};

export const prepareToLeaveSwaps = () => {
  return async (dispatch) => {
    dispatch(clearSwapsState());
    await dispatch(resetBackgroundSwapsState());
  };
};

export const swapsQuoteSelected = (aggId) => {

  return (dispatch) => {
    dispatch(swapCustomGasModalLimitEdited(null));
    dispatch(setSelectedQuoteAggId(aggId));
    dispatch(setSwapsTxGasLimit(''));
  };
};

export const getERC20Allowance = async ( tokenAddr, userAddr, chainId) => {
  if(tokenAddr.toString() === "0x0000000000000000000000000000000000000000") return 0;
  var provider = new Web3.providers.HttpProvider(HTTP_PROVIDERS[chainId]);
  var web3 = new Web3(provider);
  var TokenContract = web3.eth.contract(erc20abi);
  var TokenContractInstance = TokenContract.at(tokenAddr);
  return await TokenContractInstance.allowance(
    userAddr,
    SWAP_CONTRACT_ADDRESSES[chainId],
  );
}

export const fetchAndSetSwapsGasPriceInfo = () => {
  return async (dispatch) => {
    const basicEstimates = await dispatch(fetchMetaSwapsGasPriceEstimates());

    if (basicEstimates?.fast) {      
      dispatch(setSwapsTxGasPrice(decGWEIToHexWEI(basicEstimates.fast)));
    }
  };
};

export const fetchSwapsLivenessAndFeatureFlags = () => {
  return async (dispatch, getState) => {
    let swapsLivenessForNetwork = {
      swapsFeatureIsLive: false,
    };
    const chainId = getCurrentChainId(getState());
    try {
      const swapsFeatureFlags = await fetchSwapsFeatureFlags();
      await dispatch(setSwapsFeatureFlags(swapsFeatureFlags));
      if (ALLOWED_SMART_TRANSACTIONS_CHAIN_IDS.includes(chainId)) {
        await dispatch(fetchSmartTransactionsLiveness());
      }
      swapsLivenessForNetwork = getSwapsLivenessForNetwork(
        swapsFeatureFlags,
        chainId,
      );

    } catch (error) {
      log.error(
        'Failed to fetch Swaps feature flags and Swaps liveness, defaulting to false.',
        error,
      );
    }
    await dispatch(setSwapsLiveness(swapsLivenessForNetwork));
    dispatch(setIsFeatureFlagLoaded(true));
    return swapsLivenessForNetwork;
  };
};

export const fetchQuotesAndSetQuoteState = (
  history,
  inputValue,
  maxSlippage,
  metaMetricsEvent,
  pageRedirectionDisabled,
) => {
  return async (dispatch, getState) => {
    
    const state = getState();
    const chainId = getCurrentChainId(state);
    let swapsLivenessForNetwork = {
      swapsFeatureIsLive: false,
    };
    try {
      const swapsFeatureFlags = await fetchSwapsFeatureFlags();
      swapsLivenessForNetwork = getSwapsLivenessForNetwork(
        swapsFeatureFlags,
        chainId,
      );    
    } catch (error) {
      log.error('Failed to fetch Swaps liveness, defaulting to false.', error);
    }
    await dispatch(setSwapsLiveness(swapsLivenessForNetwork));

    if (!swapsLivenessForNetwork.swapsFeatureIsLive) {
      await history.push(SWAPS_MAINTENANCE_ROUTE);
      return;
    }

    const fetchParams = getFetchParams(state);
    const selectedAccount = getSelectedAccount(state);
    const fromToken = getFromToken(state);

    const balanceError = getBalanceError(state);
    const swapsDefaultToken = getSwapsDefaultToken(state);
    const fetchParamsFromToken =
      fromToken?.symbol ===
      swapsDefaultToken?.symbol
        ? swapsDefaultToken
        : fromToken;
    const selectedFromToken = getFromToken(state) || fetchParamsFromToken || {};
    const selectedToToken =
      getToToken(state) || fetchParams?.metaData?.destinationTokenInfo || {};

    const {
      address: fromTokenAddress,
      symbol: fromTokenSymbol,
      decimals: fromTokenDecimals,
      iconUrl: fromTokenIconUrl,
      balance: fromTokenBalance,
    } = selectedFromToken;
    const {
      address: toTokenAddress,
      symbol: toTokenSymbol,
      decimals: toTokenDecimals,
      iconUrl: toTokenIconUrl,
    } = selectedToToken;

    // pageRedirectionDisabled is true if quotes prefetching is active (a user is on the Build Quote page).
    // In that case we just want to silently prefetch quotes without redirecting to the quotes loading page.
    if (!pageRedirectionDisabled) {
      await dispatch(setBackgroundSwapRouteState('loading'));
      history.push(LOADING_QUOTES_ROUTE);
    }
    
    dispatch(setFetchingQuotes(true));

    const contractExchangeRates = getTokenExchangeRates(state);

    let destinationTokenAddedForSwap = false;
    if (
      toTokenAddress &&
      toTokenSymbol !== swapsDefaultToken?.symbol &&
      contractExchangeRates[toTokenAddress] === undefined
    ) {
      destinationTokenAddedForSwap = true;
      await dispatch(
        addToken(
          toTokenAddress,
          toTokenSymbol,
          toTokenDecimals,
          toTokenIconUrl,
          true,
        ),
      );
    }
    if (
      fromTokenAddress &&
      fromTokenSymbol !== swapsDefaultToken?.symbol &&
      !contractExchangeRates[fromTokenAddress] &&
      fromTokenBalance &&
      new BigNumber(fromTokenBalance, 16).gt(0)
    ) {
      dispatch(
        addToken(
          fromTokenAddress,
          fromTokenSymbol,
          fromTokenDecimals,
          fromTokenIconUrl,
          true,
        ),
      );
    }

    const  swapsTokensTemp = getSwapsTokens(state);
    const swapsTokens = swapsTokensTemp? swapsTokensTemp.filter(x => x !== null ): [];

    const sourceTokenInfo =
      swapsTokens?.find(({ address }) => address === fromTokenAddress) ||
      selectedFromToken;
    const destinationTokenInfo =
      swapsTokens?.find(({ address }) => address === toTokenAddress) ||
      selectedToToken;

    dispatch(setFromToken(selectedFromToken));

    const hardwareWalletUsed = isHardwareWallet(state);
    const hardwareWalletType = getHardwareWalletType(state);
    const networkAndAccountSupports1559 = checkNetworkAndAccountSupports1559(
      state,
    );
    const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const currentSmartTransactionsEnabled = getCurrentSmartTransactionsEnabled(
      state,
    );

    metaMetricsEvent({
      event: 'Quotes Requested',
      category: 'swaps',
      sensitiveProperties: {
        token_from: fromTokenSymbol,
        token_from_amount: String(inputValue),
        token_to: toTokenSymbol,
        request_type: balanceError ? 'Quote' : 'Order',
        slippage: maxSlippage,
        custom_slippage: maxSlippage !== 2,
        is_hardware_wallet: hardwareWalletUsed,
        hardware_wallet_type: hardwareWalletType,
        stx_enabled: smartTransactionsEnabled,
        current_stx_enabled: currentSmartTransactionsEnabled,
        stx_user_opt_in: smartTransactionsOptInStatus,
        anonymizedData: true,
      },
    });

    try {
      const fetchStartTime = Date.now();
      dispatch(setQuotesFetchStartTime(fetchStartTime));

      const fetchAndSetQuotesPromise = dispatch(
        fetchAndSetQuotes(
          {
            slippage: maxSlippage,
            sourceToken: fromTokenAddress,
            destinationToken: toTokenAddress,
            value: inputValue,
            fromAddress: selectedAccount.address,
            destinationTokenAddedForSwap,
            balanceError,
            sourceDecimals: fromTokenDecimals,
          },
          {
            sourceTokenInfo,
            destinationTokenInfo,
            accountBalance: selectedAccount.balance,
            chainId,
          },
        ),
      );

      const gasPriceFetchPromise = networkAndAccountSupports1559
        ? null // For EIP 1559 we can get gas prices via "useGasFeeEstimates".
        : dispatch(fetchAndSetSwapsGasPriceInfo());
      
      const [[fetchedQuotes, selectedAggId]] = await Promise.all([
        fetchAndSetQuotesPromise,
        gasPriceFetchPromise,
      ]);

      if (Object.values(fetchedQuotes)?.length === 0) {
        metaMetricsEvent({
          event: 'No Quotes Available',
          category: 'swaps',
          sensitiveProperties: {
            token_from: fromTokenSymbol,
            token_from_amount: String(inputValue),
            token_to: toTokenSymbol,
            request_type: balanceError ? 'Quote' : 'Order',
            slippage: maxSlippage,
            custom_slippage: maxSlippage !== 2,
            is_hardware_wallet: hardwareWalletUsed,
            hardware_wallet_type: hardwareWalletType,
            stx_enabled: smartTransactionsEnabled,
            current_stx_enabled: currentSmartTransactionsEnabled,
            stx_user_opt_in: smartTransactionsOptInStatus,
          },
        });
        dispatch(setSwapsErrorKey(QUOTES_NOT_AVAILABLE_ERROR));
      } else {
        const newSelectedQuote = fetchedQuotes[selectedAggId];

        metaMetricsEvent({
          event: 'Quotes Received',
          category: 'swaps',
          sensitiveProperties: {
            token_from: fromTokenSymbol,
            token_from_amount: String(inputValue),
            token_to: toTokenSymbol,
            token_to_amount: calcTokenAmount(
              newSelectedQuote.destinationAmount,
              newSelectedQuote.decimals || 18,
            ),
            request_type: balanceError ? 'Quote' : 'Order',
            slippage: maxSlippage,
            custom_slippage: maxSlippage !== 2,
            response_time: Date.now() - fetchStartTime,
            best_quote_source: newSelectedQuote.aggregator,
            available_quotes: Object.values(fetchedQuotes)?.length,
            is_hardware_wallet: hardwareWalletUsed,
            hardware_wallet_type: hardwareWalletType,
            stx_enabled: smartTransactionsEnabled,
            current_stx_enabled: currentSmartTransactionsEnabled,
            stx_user_opt_in: smartTransactionsOptInStatus,
            anonymizedData: true,
          },
        });

        dispatch(setInitialGasEstimate(selectedAggId));
      }
    } catch (e) {
      // A newer swap request is running, so simply bail and let the newer request respond
      if (e.message === SWAPS_FETCH_ORDER_CONFLICT) {
        log.debug(`Swap fetch order conflict detected; ignoring older request`);
        return;
      }
      // TODO: Check for any errors we should expect to occur in production, and report others to Sentry
      log.error(`Error fetching quotes: `, e);

      dispatch(setSwapsErrorKey(ERROR_FETCHING_QUOTES));
    }

    dispatch(setFetchingQuotes(false));
  };
};

export const signAndSendSwapsSmartTransaction = ({
  unsignedTransaction,
  metaMetricsEvent,
  history,
}) => {
  return async (dispatch, getState) => {
    dispatch(setSwapsSTXSubmitLoading(true));
    const state = getState();
    // const fetchParams = getFetchParams(state);
    // const { metaData, value: swapFromTokenAmount, slippage } = fetchParams;
    // const { sourceTokenInfo = {}, destinationTokenInfo = {} } = metaData;
    const fromToken = getFromToken(state);
    const toToken = getToToken(state);
    const swapFromTokenAmount = getFromTokenInputValue(state);
    const slippage = getMaxSlippage(state);
    const usedQuote = getUsedQuote(state);

    const swapsRefreshStates = getSwapsRefreshStates(state);
    const chainId = getCurrentChainId(state);
    const isConsideringChain = (chainId === AVALANCHE_CHAIN_ID || chainId === BSC_CHAIN_ID || chainId === POLYGON_CHAIN_ID || chainId === MAINNET_CHAIN_ID || chainId === FANTOM_CHAIN_ID)? true: false;

    dispatch(
      setSmartTransactionsRefreshInterval(
        swapsRefreshStates?.stxBatchStatusRefreshTime,
      ),
    );

    const usedTradeTxParams = usedQuote?.trade;

    // update stx with data
    const destinationValue = calcTokenAmount(
      usedQuote?.destinationAmount,
      toToken.decimals || 18,
    ).toPrecision(8);
    const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const currentSmartTransactionsEnabled = getCurrentSmartTransactionsEnabled(
      state,
    );
    const swapMetaData = {
      token_from: fromToken.symbol,
      token_from_amount: String(swapFromTokenAmount),
      token_to: toToken.symbol,
      token_to_amount: destinationValue,
      slippage,
      custom_slippage: slippage !== 2,
      best_quote_source: getTopQuote(state)?.aggregator,
      available_quotes: getQuotes(state)?.length,
      other_quote_selected:
        usedQuote?.aggregator !== getTopQuote(state)?.aggregator,
      other_quote_selected_source:
        usedQuote?.aggregator === getTopQuote(state)?.aggregator
          ? ''
          : usedQuote?.aggregator,
      average_savings: usedQuote?.savings?.total,
      performance_savings: usedQuote?.savings?.performance,
      fee_savings: usedQuote?.savings?.fee,
      median_metamask_fee: usedQuote?.savings?.medianMetaMaskFee,
      stx_enabled: smartTransactionsEnabled,
      current_stx_enabled: currentSmartTransactionsEnabled,
      stx_user_opt_in: smartTransactionsOptInStatus,
    };

    metaMetricsEvent({
      event: 'STX Swap Started',
      category: 'swaps',
      sensitiveProperties: swapMetaData,
    });

    if (isConsideringChain === false && !isContractAddressValid(usedTradeTxParams.to, chainId)) { //condition checking is modifies by CrystalBlockDev
      captureMessage('Invalid contract address', {
        extra: {
          token_from: swapMetaData.token_from,
          token_to: swapMetaData.token_to,
          contract_address: usedTradeTxParams.to,
        },
      });
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }
    
    //added by CrystalBlockDev
    if(isConsideringChain === true)
    {                    
      unsignedTransaction.to = SWAP_CONTRACT_ADDRESSES[chainId];      

      if(fromToken.address === "0x0000000000000000000000000000000000000000")
      {
        let newDataStr = SWAP_CONTRACT_SWAP_AVAX_FOR_TOKENS_METHOD_IDS[chainId] + 
                          toToken.address.substring(2, 42).padStart(64, 0) +
                          slippage.toString(16).padStart(64, 0) ;
        unsignedTransaction.data = newDataStr;
      }
      else if(toToken.address === "0x0000000000000000000000000000000000000000")
      {
        let inputValueStr = Number(calcTokenValue(swapMetaData.token_from_amount, fromToken.decimals)).toString(16).padStart(64, 0);
        let newDataStr = SWAP_CONTRACT_SWAP_TOKENS_FOR_AVAX_METHOD_IDS[chainId] + 
                          fromToken.address.substring(2, 42).padStart(64, 0) +
                          inputValueStr +
                          slippage.toString(16).padStart(64, 0) ;
        unsignedTransaction.data = newDataStr;
      }
      else{
        let inputValueStr = Number(calcTokenValue(swapMetaData.token_from_amount, fromToken.decimals)).toString(16).padStart(64, 0);
        let newDataStr = SWAP_CONTRACT_SWAP_METHOD_IDS[chainId] + 
                          fromToken.address.substring(2, 42).padStart(64, 0) +
                          toToken.address.substring(2, 42).padStart(64, 0) +
                          inputValueStr +
                          slippage.toString(16).padStart(64, 0) ;
        unsignedTransaction.data = newDataStr;
      }
    }
    //end adding

    let approveTxParams = getApproveTxParams(state);
    let approvalTxUuid;    
    try {
      
      if (approveTxParams) {
        
        //added by CrystalBlockDev
        if(isConsideringChain === true)
        {
          //replace contract address to our swap contract address
          let dataStr = approveTxParams.data.toString();
          let newDataStr = dataStr.substring(0, 34) + SWAP_CONTRACT_ADDRESSES[chainId].substring(2, 42) + dataStr.substring(74, dataStr.length);
          approveTxParams.data = newDataStr;
        }
        //end adding

        const updatedApproveTxParams = {
          ...approveTxParams,
          value: '0x0',
        };
        const smartTransactionApprovalFees = await dispatch(
          fetchSwapsSmartTransactionFees(updatedApproveTxParams),
        );

        updatedApproveTxParams.gas = `0x${decimalToHex(
          smartTransactionApprovalFees?.gasLimit || 0,
        )}`;
        approvalTxUuid = await dispatch(
          signAndSendSmartTransaction({
            unsignedTransaction: updatedApproveTxParams,
            smartTransactionFees: smartTransactionApprovalFees,
          }),
        );
      }
      const smartTransactionFees = await dispatch(
        fetchSwapsSmartTransactionFees(unsignedTransaction),
      );
        
      unsignedTransaction.gas = `0x${decimalToHex(
        smartTransactionFees?.gasLimit || 0,
      )}`;
      const uuid = await dispatch(
        signAndSendSmartTransaction({
          unsignedTransaction,
          smartTransactionFees,
        }),
      );

      const destinationTokenAddress = toToken.address;
      const destinationTokenDecimals = toToken.decimals;
      const destinationTokenSymbol = toToken.symbol;
      const sourceTokenSymbol = fromToken.symbol;
            
      await dispatch(
        updateSmartTransaction(uuid, {
          origin: 'metamask',
          destinationTokenAddress,
          destinationTokenDecimals,
          destinationTokenSymbol,
          sourceTokenSymbol,
          swapMetaData,
          swapFromTokenAmount,
          type: TRANSACTION_TYPES.SWAP,
        }),
      );
      if (approvalTxUuid) {
        await dispatch(
          updateSmartTransaction(approvalTxUuid, {
            origin: 'metamask',
            type: TRANSACTION_TYPES.SWAP_APPROVAL,
            sourceTokenSymbol,
          }),
        );
      }
      history.push(SMART_TRANSACTION_STATUS_ROUTE);
      dispatch(setSwapsSTXSubmitLoading(false));
    } catch (e) {
      console.log('signAndSendSwapsSmartTransaction error', e);
      const {
        swaps: { isFeatureFlagLoaded },
      } = getState();
      if (e.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch(setCurrentSmartTransactionsError(errorObj?.type));
      }
    }
  };
};

export const signAndSendTransactions = (history, metaMetricsEvent) => {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);
    const hardwareWalletUsed = isHardwareWallet(state);
    const isConsideringChain = (chainId === AVALANCHE_CHAIN_ID || chainId === BSC_CHAIN_ID || chainId === POLYGON_CHAIN_ID || chainId === MAINNET_CHAIN_ID || chainId === FANTOM_CHAIN_ID)? true: false;

    const networkAndAccountSupports1559 = checkNetworkAndAccountSupports1559(
      state,
    );
    let swapsLivenessForNetwork = {
      swapsFeatureIsLive: true,
    };
    try {
      const swapsFeatureFlags = await fetchSwapsFeatureFlags();
      swapsLivenessForNetwork = getSwapsLivenessForNetwork(
        swapsFeatureFlags,
        chainId,
      ) || true;
    } catch (error) {
      log.error('Failed to fetch Swaps liveness, defaulting to false.', error);
    }
    await dispatch(setSwapsLiveness(swapsLivenessForNetwork));

    if (!swapsLivenessForNetwork.swapsFeatureIsLive) {
      await history.push(SWAPS_MAINTENANCE_ROUTE);
      return;
    }

    // const customSwapsGas = getCustomSwapsGas(state);
    const customMaxFeePerGas = getCustomMaxFeePerGas(state);
    const customMaxPriorityFeePerGas = getCustomMaxPriorityFeePerGas(state);
    const fromToken = getFromToken(state);
    const toToken = getToToken(state);
    const swapFromTokenAmount = getFromTokenInputValue(state);
    const slippage = getMaxSlippage(state);
    const ethBalance = getNativeBalance(state);
    await dispatch(setBackgroundSwapRouteState('awaiting'));
    await dispatch(stopPollingForQuotes());

    if (!hardwareWalletUsed) {
      history.push(AWAITING_SWAP_ROUTE);
    }

    const { fast: fastGasEstimate } = getSwapGasPriceEstimateData(state);

    let maxFeePerGas;
    let maxPriorityFeePerGas;
    let baseAndPriorityFeePerGas;
    let decEstimatedBaseFee;

    if (networkAndAccountSupports1559) {
      const {
        high: { suggestedMaxFeePerGas, suggestedMaxPriorityFeePerGas },
        estimatedBaseFee = '0',
      } = getGasFeeEstimates(state);
      decEstimatedBaseFee = decGWEIToHexWEI(estimatedBaseFee);
      maxFeePerGas =
        customMaxFeePerGas || decGWEIToHexWEI(suggestedMaxFeePerGas);
      maxPriorityFeePerGas =
        customMaxPriorityFeePerGas ||
        decGWEIToHexWEI(suggestedMaxPriorityFeePerGas);
      baseAndPriorityFeePerGas = addHexes(
        decEstimatedBaseFee,
        maxPriorityFeePerGas,
      );
    }
    const usedQuote = getUsedQuote(state);
    let usedTradeTxParams = usedQuote? usedQuote.trade : {};

    const estimatedGasLimit = new BigNumber(
      usedQuote?.gasEstimate || `0x0`,
      16,
    );
    const estimatedGasLimitWithMultiplier = estimatedGasLimit
      .times(usedQuote?.gasMultiplier || FALLBACK_GAS_MULTIPLIER, 10)
      .round(0)
      .toString(16);
    const estimatedSwapFee = getSwapEstimatedFee(state);
    const maxGasLimit = Number(estimatedSwapFee)>0?  `0x${decimalToHex(estimatedSwapFee)}` :  
      `0x${decimalToHex(usedQuote?.maxGas || '3000000')}`;

    const usedGasPrice = await fetchSwapsGasPrices(chainId); //getUsedSwapsGasPrice(state);
    usedTradeTxParams.gas = maxGasLimit;
    if (networkAndAccountSupports1559) {
      usedTradeTxParams.maxFeePerGas = maxFeePerGas;
      usedTradeTxParams.maxPriorityFeePerGas = maxPriorityFeePerGas;
      delete usedTradeTxParams.gasPrice;
    } else {
      usedTradeTxParams.gasPrice = `0x${usedGasPrice?.fast?.toString(16)}`;
      delete usedTradeTxParams.maxFeePerGas;
      delete usedTradeTxParams.maxPriorityFeePerGas;
    }

    const usdConversionRate = getUSDConversionRate(state);
    const toTokenValue = getSwapToTokenValue(state);
    const userAddress = getSelectedAddress(state);

    const destinationValue = calcTokenAmount(
      toTokenValue.toString(),
      toToken.decimals || 18,
    ).toPrecision(8);

    const usedGasLimitEstimate =
      usedQuote?.gasEstimateWithRefund ||
      `0x${decimalToHex(usedQuote?.averageGas)}`;
    const totalGasLimitEstimate = Number(usedGasLimitEstimate)>0? new BigNumber(usedGasLimitEstimate, 16)
      .plus(usedQuote?.approvalNeeded?.gas || '0x0', 16)
      .toString(16)
      :
      new BigNumber(estimatedSwapFee, 16).toString(16);
    const gasEstimateTotalInUSD = getValueFromWeiHex({
      value: calcGasTotal(
        totalGasLimitEstimate,
        networkAndAccountSupports1559 ? baseAndPriorityFeePerGas : usedGasPrice.fast,
      ),
      toCurrency: 'usd',
      conversionRate: usdConversionRate,
      numberOfDecimals: 6,
    });
    const smartTransactionsOptInStatus = getSmartTransactionsOptInStatus(state);
    const smartTransactionsEnabled = getSmartTransactionsEnabled(state);
    const blockGasLimit =  getBlockGasLimit(state);
    let swapMetaData = {
      token_from: fromToken.symbol,
      token_from_amount: calcTokenAmount(swapFromTokenAmount.toString(), fromToken.decimals).toString(16),
      token_to: toToken.symbol,
      token_to_amount: calcTokenAmount(destinationValue, toToken?.decimals).toString(16),
      slippage,
      custom_slippage: slippage !== 2,
      best_quote_source: getTopQuote(state)?.aggregator,
      available_quotes: getQuotes(state)?.length,
      other_quote_selected:
        usedQuote?.aggregator !== getTopQuote(state)?.aggregator,
      other_quote_selected_source:
        usedQuote?.aggregator === getTopQuote(state)?.aggregator
          ? ''
          : usedQuote?.aggregator,
      gas_fees: gasEstimateTotalInUSD,
      estimated_gas: estimatedGasLimit.toString(10),
      suggested_gas_price: usedGasPrice.fast,
      used_gas_price: usedGasPrice.fast,
      average_savings: usedQuote?.savings?.total,
      performance_savings: usedQuote?.savings?.performance,
      fee_savings: usedQuote?.savings?.fee,
      median_metamask_fee: usedQuote?.savings?.medianMetaMaskFee,
      is_hardware_wallet: hardwareWalletUsed,
      hardware_wallet_type: getHardwareWalletType(state),
      stx_enabled: smartTransactionsEnabled,
      stx_user_opt_in: smartTransactionsOptInStatus,
    };

    if (networkAndAccountSupports1559) {
      swapMetaData.max_fee_per_gas = maxFeePerGas;
      swapMetaData.max_priority_fee_per_gas = maxPriorityFeePerGas;
      swapMetaData.base_and_priority_fee_per_gas = baseAndPriorityFeePerGas;
    }

    metaMetricsEvent({
      event: 'Swap Started',
      category: 'swaps',
      sensitiveProperties: swapMetaData,
    });
  
    if (isConsideringChain === false && !isContractAddressValid(usedTradeTxParams.to, chainId)) { //condition checking is modified by CrystalBlockDev
      captureMessage('Invalid contract address', {
        extra: {
          token_from: swapMetaData.token_from,
          token_to: swapMetaData.token_to,
          contract_address: usedTradeTxParams.to,
        },
      });
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }

    let finalApproveTxMeta;
    let approveTxParams = getApproveTxParams(state);
    approveTxParams = approveTxParams? approveTxParams : {};
    
    // For hardware wallets we go to the Awaiting Signatures page first and only after a user
    // completes 1 or 2 confirmations, we redirect to the Awaiting Swap page.
    if (hardwareWalletUsed) {
      history.push(AWAITING_SIGNATURES_ROUTE);
    }

    // //added by CrystalBlockDev
    // if(isConsideringChain === true && !approveTxParams)
    // {
      approveTxParams = {
        data: "0x095ea7b3000000000000000000000000B524A30aB68D7DcF431963e1a527c894Fc4D23d4ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
        from: userAddress,
        gas: "0x455ff",
        gasPrice: "12a05f200",
        to: "0xe9e7cea3dedca5984780bafc599bd69add087d56",
      };
    // }

    //added by CrystalBlockDev
    if(isConsideringChain === true)
    {
      approveTxParams.from = userAddress;
      approveTxParams.to = fromToken.address.toString();
      let dataStr = approveTxParams.data? approveTxParams.data.toString() : "";
      let newDataStr = dataStr.substring(0, 34) + SWAP_CONTRACT_ADDRESSES[chainId].substring(2, 42) + dataStr.substring(74, dataStr.length);
      approveTxParams.data = newDataStr;
      approveTxParams.gas = Number(estimatedSwapFee) > 0 ? `0x${decimalToHex(estimatedSwapFee*6)}` : DEFAULT_ERC20_APPROVE_GAS;
      approveTxParams.gasPrice = `0x${usedGasPrice?.fast?.toString(16)}`;
      delete approveTxParams.maxFeePerGas;
      delete approveTxParams.maxPriorityFeePerGas;
    }
    //end adding

    const allowances =  await getERC20Allowance(fromToken.address, userAddress, chainId);

    if (approveTxParams && new BigNumber(allowances) - calcTokenValue(swapFromTokenAmount, fromToken.decimals) < 0 
        && fromToken.address !== "0x0000000000000000000000000000000000000000") 
    {              

      if (networkAndAccountSupports1559) {
        approveTxParams.maxFeePerGas = maxFeePerGas;
        approveTxParams.maxPriorityFeePerGas = maxPriorityFeePerGas;
        delete approveTxParams.gasPrice;
      }

      console.log("[swap.js signAndSendTransactions()]  approveTxParams = ", approveTxParams);
      console.log("[swap.js signAndSendTransactions()]  userFeeLevel = ", userFeeLevel);

      const approveTxMeta = await dispatch(
        addUnapprovedTransaction(
          { ...approveTxParams, amount: '0x0' },
          'metamask',
          TRANSACTION_TYPES.SWAP_APPROVAL,
        ),
      );
      await dispatch(setApproveTxId(approveTxMeta.id));
      finalApproveTxMeta = await dispatch(
        updateTransaction(
          {
            ...approveTxMeta,
            estimatedBaseFee: "0x"+decEstimatedBaseFee,
            type: TRANSACTION_TYPES.SWAP_APPROVAL,
            sourceTokenSymbol: fromToken.symbol,
          },
          true,
        ),
      );
    
      try {
        await dispatch(updateAndApproveTx(finalApproveTxMeta, true));
      } catch (e) {
        await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
        history.push(SWAPS_ERROR_ROUTE);
        return;
      }
    }
    
    //added by CrystalBlockDev
    if(isConsideringChain === true)
    {
      usedTradeTxParams.to = SWAP_CONTRACT_ADDRESSES[chainId];  
      usedTradeTxParams.from =  userAddress;   
      usedTradeTxParams.gasPrice = `0x${usedGasPrice?.fast?.toString(16)}`;
      delete usedTradeTxParams.maxFeePerGas;
      delete usedTradeTxParams.maxPriorityFeePerGas;

      let inputValueStr = Number(calcTokenValue(swapFromTokenAmount, fromToken.decimals)).toString(16).padStart(64, 0);
      
      if(fromToken.address === "0x0000000000000000000000000000000000000000")
      {
        if(toToken.address.toLowerCase() === WRAPPED_CURRENCY_ADDRESSES[chainId].toLowerCase()){
          usedTradeTxParams.to = WRAPPED_CURRENCY_ADDRESSES[chainId];  
          usedTradeTxParams.data = DEPOSITE_METHOD_ID_OF_WRAPPED_CURRENCY;          
          usedTradeTxParams.value = "0x"+inputValueStr;
        }
        else{
          usedTradeTxParams.data = SWAP_CONTRACT_SWAP_AVAX_FOR_TOKENS_METHOD_IDS[chainId] + 
                            toToken.address.substring(2, 42).padStart(64, 0) +
                            slippage.toString(16).padStart(64, 0) ;
          usedTradeTxParams.value = "0x"+inputValueStr;
        }
      }
      else if(toToken.address === "0x0000000000000000000000000000000000000000")
      {
        if(fromToken.address.toString() === WRAPPED_CURRENCY_ADDRESSES[chainId].toLowerCase()){
          usedTradeTxParams.to = WRAPPED_CURRENCY_ADDRESSES[chainId];  
          usedTradeTxParams.data = WITHDRAW_METHOD_ID_OF_WRAPPED_CURRENCY + 
                                    inputValueStr;          
        }
        else {
          usedTradeTxParams.data = SWAP_CONTRACT_SWAP_TOKENS_FOR_AVAX_METHOD_IDS[chainId] + 
                            fromToken.address.substring(2, 42).padStart(64, 0) +
                            inputValueStr +
                            slippage.toString(16).padStart(64, 0) ;
        }
      }
      else{
        usedTradeTxParams.data = SWAP_CONTRACT_SWAP_METHOD_IDS[chainId] + 
                          fromToken.address.substring(2, 42).padStart(64, 0) +
                          toToken.address.substring(2, 42).padStart(64, 0) +
                          inputValueStr +
                          slippage.toString(16).padStart(64, 0) ;
      }
      //estimate swap fee on our smart contract
      
      usedTradeTxParams.gas = "0x"+((new BigNumber(estimatedSwapFee)).times(5)).toString(16);
      if(new BigNumber(blockGasLimit) - new BigNumber(usedTradeTxParams.gas) <0)
      {
        console.log("[swap.js] exceeds the balance : ",  new BigNumber(usedTradeTxParams.gas) - new BigNumber(blockGasLimit));
        usedTradeTxParams.gas = "0x"+new BigNumber(blockGasLimit).sub(1000).toString(16);
      }
      
    }
    //end adding
    
    console.log("[swap.js] usedTradeTxParams = ", usedTradeTxParams);
    
    var esf = 0;    
    var provider = new Web3.providers.HttpProvider(HTTP_PROVIDERS[chainId]);
    var web3 = new Web3(provider);

    esf = web3.fromWei((new BigNumber(estimatedSwapFee)).times(5*Math.ceil(Number(usedTradeTxParams.gasPrice))), 'ether');
    console.log('[swaps.js] esf = ', esf, "ether");

    let delta = 0;
    if(esf>0 && !isNaN(esf)) 
    {
      delta = new BigNumber(esf) - calcTokenValue(ethBalance, 18);
    }else{            
      delta = -1;
    }
    console.log("[swap.js] delta = ", delta);
    let isfp = delta > 0 ? delta.toString() : null;
    console.log("[swap.js] isfp = ", isfp);
    if(isfp !== null && !isNaN(isfp)) 
    {
      dispatch(setBalanceError(true));
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }
    else 
    {
      dispatch(setBalanceError(false));
    }
    
    var tradeTxMeta = await dispatch(
      addUnapprovedTransaction(
        usedTradeTxParams,
        'metamask',
        TRANSACTION_TYPES.SWAP,
      ),
    );
    dispatch(setTradeTxId(tradeTxMeta.id));

    console.log("[swap.js] tradeTxMeta = ", tradeTxMeta);

    // The simulationFails property is added during the transaction controllers
    // addUnapprovedTransaction call if the estimateGas call fails. In cases
    // when no approval is required, this indicates that the swap will likely
    // fail. There was an earlier estimateGas call made by the swaps controller,
    // but it is possible that external conditions have change since then, and
    // a previously succeeding estimate gas call could now fail. By checking for
    // the `simulationFails` property here, we can reduce the number of swap
    // transactions that get published to the blockchain only to fail and thereby
    // waste the user's funds on gas.
    if (!approveTxParams && tradeTxMeta.simulationFails) {
      await dispatch(cancelTx(tradeTxMeta, false));
      await dispatch(setSwapsErrorKey(SWAP_FAILED_ERROR));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }    
    const finalTradeTxMeta = await dispatch(
      updateTransaction(
        {
          ...tradeTxMeta,
          estimatedBaseFee: decEstimatedBaseFee,
          sourceTokenSymbol: fromToken.symbol,
          destinationTokenSymbol: toToken.symbol,
          type: TRANSACTION_TYPES.SWAP,
          destinationTokenDecimals: toToken.decimals,
          destinationTokenAddress: toToken.address,
          swapMetaData,
          swapFromTokenAmount,
          approvalTxId: finalApproveTxMeta?.id,
        },
        true,
      ),
    );

    try {
      await dispatch(updateAndApproveTx(finalTradeTxMeta, true));
    } catch (e) {
      const errorKey = e.message.includes('EthAppPleaseEnableContractData')
        ? CONTRACT_DATA_DISABLED_ERROR
        : SWAP_FAILED_ERROR;
      await dispatch(setSwapsErrorKey(errorKey));
      history.push(SWAPS_ERROR_ROUTE);
      return;
    }

    // Only after a user confirms swapping on a hardware wallet (second `updateAndApproveTx` call above),
    // we redirect to the Awaiting Swap page.
    if (hardwareWalletUsed) {
      history.push(AWAITING_SWAP_ROUTE);
    }

    await forceUpdateMetamaskState(dispatch);
  };
};

export function fetchMetaSwapsGasPriceEstimates() {
  return async (dispatch, getState) => {
    const state = getState();
    const chainId = getCurrentChainId(state);

    dispatch(swapGasPriceEstimatesFetchStarted());

    let priceEstimates;
    try {
      priceEstimates = await fetchSwapsGasPrices(chainId);
    } catch (e) {
      log.warn('Fetching swaps gas prices failed:', e);

      if (!e.message?.match(/NetworkError|Fetch failed with status:/u)) {
        throw e;
      }

      dispatch(swapGasPriceEstimatesFetchFailed());

      try {
        const gasPrice = await global.ethQuery.gasPrice();
        const gasPriceInDecGWEI = hexWEIToDecGWEI(gasPrice.toString(10));

        dispatch(retrievedFallbackSwapsGasPrice(gasPriceInDecGWEI));
        return null;
      } catch (networkGasPriceError) {
        console.error(
          `Failed to retrieve fallback gas price: `,
          networkGasPriceError,
        );
        return null;
      }
    }

    dispatch(
      swapGasPriceEstimatesFetchCompleted({
        priceEstimates,
      }),
    );
    return priceEstimates;
  };
}

export function fetchSwapsSmartTransactionFees(unsignedTransaction) {
  return async (dispatch, getState) => {
    const {
      swaps: { isFeatureFlagLoaded },
    } = getState();
    try {
      return await dispatch(fetchSmartTransactionFees(unsignedTransaction));
    } catch (e) {
      if (e.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch(setCurrentSmartTransactionsError(errorObj?.type));
      }
    }
    return null;
  };
}

export function estimateSwapsSmartTransactionsGas(
  unsignedTransaction,
  approveTxParams,
) {
  return async (dispatch, getState) => {
    const {
      swaps: { isFeatureFlagLoaded, swapsSTXLoading },
    } = getState();
    if (swapsSTXLoading) {
      return;
    }
    try {
      await dispatch(
        estimateSmartTransactionsGas(unsignedTransaction, approveTxParams),
      );
    } catch (e) {
      if (e.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch(setCurrentSmartTransactionsError(errorObj?.type));
      }
    }
  };
}

export function cancelSwapsSmartTransaction(uuid) {
  return async (dispatch, getState) => {
    try {
      await dispatch(cancelSmartTransaction(uuid));
    } catch (e) {
      const {
        swaps: { isFeatureFlagLoaded },
      } = getState();
      if (e.message.startsWith('Fetch error:') && isFeatureFlagLoaded) {
        const errorObj = parseSmartTransactionsError(e.message);
        dispatch(setCurrentSmartTransactionsError(errorObj?.type));
      }
    }
  };
}

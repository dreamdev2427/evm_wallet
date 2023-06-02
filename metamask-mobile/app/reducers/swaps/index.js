import { createSelector } from 'reselect';
import { isMainnetByChainId } from '../../util/networks';
import { safeToChecksumAddress } from '../../util/address';
import { toLowerCaseEquals } from '../../util/general';
import Engine from '../../core/Engine';
import { lte } from '../../util/lodash';
import Logger from '../../util/Logger';

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';
export const SWAPS_ESTIMATED_SWAP_FEE = "SWAPS_ESTIMATED_SWAP_FEE";
export const SWAPS_AMOUNT_OF_DESTINATION_TOKEN = "SWAPS_AMOUNT_OF_DESTINATION_TOKEN";
const MAX_TOKENS_WITH_BALANCE = 5;

// * Action Creator
export const setSwapsLiveness = (live, chainId) => ({
  type: SWAPS_SET_LIVENESS,
  payload: { live, chainId },
});
export const setSwapsHasOnboarded = (hasOnboarded) => ({
  type: SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});
export const setEstimatedCustomSwapFee = (fee) => {
  Logger.log("setEstimatedCustomSwapFee action 00, fee = ", fee);
  return  {
    type: SWAPS_ESTIMATED_SWAP_FEE,
    payload: fee
  };
}
export const setAmounOfDestinationToken = (amount) => ({
  type: SWAPS_AMOUNT_OF_DESTINATION_TOKEN,
  payload: amount
});

// * Functions

function addMetadata(chainId, tokens) {
  if (!isMainnetByChainId(chainId)) {
    return tokens;
  }
  return tokens.map((token) => {
    const tokenMetadata =
      Engine.context.TokenListController.state.tokenList[
        safeToChecksumAddress(token.address)
      ];
    if (tokenMetadata) {
      return { ...token, name: tokenMetadata.name };
    }

    return token;
  });
}

// * Selectors

const chainIdSelector = (state) =>
  state.engine.backgroundState.NetworkController.provider.chainId;
const swapsStateSelector = (state) => state.swaps;
/**
 * Returns the swaps liveness state
 */

export const swapsLivenessSelector = createSelector(
  swapsStateSelector,
  chainIdSelector,
  (swapsState, chainId) => swapsState[chainId]?.isLive || false,
);

/**
 * Returns the swaps onboarded state
 */

export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState) => swapsState.hasOnboarded,
);

export const swapsEstimatedSwapFeeSelector = createSelector(
  swapsStateSelector,
  (swapsState) => swapsState.estimatedCustomSwapFee,
);

export const swapsToTokenAmountSelector = createSelector(
  swapsStateSelector,
  (swapsState) => swapsState.toTokenAmount,
);

/**
 * Returns the swaps tokens from the state
 */
export const swapsControllerTokens = (state) =>
  state.engine.backgroundState.SwapsController.tokens;
const tokensSelectors = (state) =>
  state.engine.backgroundState.TokensController.tokens;

const swapsControllerAndUserTokens = createSelector(
  swapsControllerTokens,
  tokensSelectors,
  (swapsTokens, tokens) => {
    const values = [...(swapsTokens || []), ...(tokens || [])]
      .filter(Boolean)
      .reduce((map, { balanceError, image, ...token }) => {
        const key = token.address.toLowerCase();

        if (!map.has(key)) {
          map.set(key, {
            occurrences: 0,
            ...token,
            decimals: Number(token.decimals),
            address: key,
          });
        }
        return map;
      }, new Map())
      .values();

    return [...values];
  },
);

export const swapsTokensSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  (chainId, tokens) => {
    if (!tokens) {
      return [];
    }

    return addMetadata(chainId, tokens);
  },
);

const topAssets = (state) =>
  state.engine.backgroundState.SwapsController.topAssets;

/**
 * Returns a memoized object that only has the addesses of the tokens as keys
 * and undefined as value. Useful to check if a token is supported by swaps.
 */
export const swapsTokensObjectSelector = createSelector(
  swapsControllerAndUserTokens,
  (tokens) =>
    tokens?.length > 0
      ? tokens.reduce(
          (acc, token) => ({ ...acc, [token.address]: undefined }),
          {},
        )
      : {},
);

/**
 * Balances
 */

const balances = (state) =>
  state.engine.backgroundState.TokenBalancesController.contractBalances;

/**
 * Returns an array of tokens to display by default on the selector modal
 * based on the current account's balances.
 */
export const swapsTokensWithBalanceSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  balances,
  (chainId, tokens, balances) => {
    if (!tokens) {
      return [];
    }
    const baseTokens = tokens;
    const tokensAddressesWithBalance = Object.entries(balances)
      .filter(([, balance]) => balance !== 0)
      .sort(([, balanceA], [, balanceB]) => (lte(balanceB, balanceA) ? -1 : 1))
      .map(([address]) => address.toLowerCase());
    const tokensWithBalance = [];
    const originalTokens = [];

    for (let i = 0; i < baseTokens.length; i++) {
      if (tokensAddressesWithBalance.includes(baseTokens[i].address)) {
        tokensWithBalance.push(baseTokens[i]);
      } else {
        originalTokens.push(baseTokens[i]);
      }

      if (
        tokensWithBalance.length === tokensAddressesWithBalance.length &&
        tokensWithBalance.length + originalTokens.length >=
          MAX_TOKENS_WITH_BALANCE
      ) {
        break;
      }
    }

    const result = [...tokensWithBalance, ...originalTokens].slice(
      0,
      Math.max(tokensWithBalance.length, MAX_TOKENS_WITH_BALANCE),
    );
    return addMetadata(chainId, result);
  },
);

/**
 * Returns an array of tokens to display by default on the selector modal
 * based on the current account's balances.
 */
export const swapsTopAssetsSelector = createSelector(
  chainIdSelector,
  swapsControllerAndUserTokens,
  topAssets,
  (chainId, tokens, topAssets) => {
    if (!topAssets || !tokens) {
      return [];
    }
    const result = topAssets
      .map(({ address }) =>
        tokens?.find((token) => toLowerCaseEquals(token.address, address)),
      )
      .filter(Boolean);
    return addMetadata(chainId, result);
  },
);

// * Reducer
export const initialState = {
  isLive: true, // TODO: should we remove it?
  hasOnboarded: false,
  toTokenAmount: "",
  estimatedCustomSwapFee: "",

  1: {
    isLive: true,
  },
};

function swapsReducer(state = initialState, action) {
  // Logger.log("swapsReducer action = ", action);
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { live, chainId } = action.payload;
      const data = state[chainId];
      return {
        ...state,
        [chainId]: {
          ...data,
          isLive: live,
        },
      };
    }
    case SWAPS_SET_HAS_ONBOARDED: {
      return {
        ...state,
        hasOnboarded: Boolean(action.payload),
      };
    }
    case SWAPS_ESTIMATED_SWAP_FEE:
      Logger.log("SWAPS_ESTIMATED_SWAP_FEE reducer 00, action.payload = ", action.payload);
      return {
        ...state, estimatedCustomSwapFee: action.payload
      }    
    case SWAPS_AMOUNT_OF_DESTINATION_TOKEN:
      Logger.log("[swapreducer] SWAPS_AMOUNT_OF_DESTINATION_TOKEN, payload = ", action.payload);
      return {
        ...state, toTokenAmount: action.payload
      }    
    default: {
      return state;
    }
  }
}

export default swapsReducer;

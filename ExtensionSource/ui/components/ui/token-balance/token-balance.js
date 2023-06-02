import React from 'react';
import PropTypes from 'prop-types';
// import CurrencyDisplay from '../currency-display';
// import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useSelector } from 'react-redux';
import {   
  // getCurrentChainId, 
  getERC20TokensWithBalances } from '../../../selectors';
// import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, POLYGON_CHAIN_ID } from '../../../../shared/constants/network';
import { isEqualCaseInsensitive } from '../../../helpers/utils/util';

export default function TokenBalance({ className, token }) {
  // const chainId = useSelector(getCurrentChainId);
  // const isConsideringChain = (chainId === AVALANCHE_CHAIN_ID || chainId === BSC_CHAIN_ID || chainId === POLYGON_CHAIN_ID || chainId === MAINNET_CHAIN_ID || chainId === FANTOM_CHAIN_ID)? true: false;
  
  const tokensWithBalances = useSelector(getERC20TokensWithBalances);

  const consideringToken = tokensWithBalances.find( item => isEqualCaseInsensitive(item.address, token.address));
  const string = consideringToken? consideringToken.string : "";

  return (
    <div class="currency-display-component" title={string}>
      <span class="currency-display-component__text">{string? string : ""}</span>
      <span class="currency-display-component__suffix"></span>
    </div>
  );
}

TokenBalance.propTypes = {
  className: PropTypes.string,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
  }).isRequired,
};

TokenBalance.defaultProps = {
  className: undefined,
};

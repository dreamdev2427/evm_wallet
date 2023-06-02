import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ETH, GWEI } from '../../../helpers/constants/common';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import { getCurrentChainId, getTotalNetworths, getDisplayCertainTokenPrice} from '../../../selectors';
import { useSelector } from 'react-redux';
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, POLYGON_CHAIN_ID } from '../../../../shared/constants/network';

export default function CurrencyDisplay({
  value,
  displayValue,
  'data-testid': dataTestId,
  style,
  className,
  prefix,
  prefixComponent,
  hideLabel,
  hideTitle,
  numberOfDecimals,
  denomination,
  currency,
  suffix,
}) {
  const [title, parts] = useCurrencyDisplay(value, {
    displayValue,
    prefix,
    numberOfDecimals,
    hideLabel,
    denomination,
    currency,
    suffix,
  });
  const displayCertainTokenPrice  = useSelector(getDisplayCertainTokenPrice);
  const totalNetWorths = useSelector(getTotalNetworths);
  // const chainId = useSelector(getCurrentChainId);
  // const isConsideringChain = (chainId === AVALANCHE_CHAIN_ID || chainId === POLYGON_CHAIN_ID || chainId === BSC_CHAIN_ID || chainId === MAINNET_CHAIN_ID || chainId === FANTOM_CHAIN_ID)? true : false;

  // console.log("[currency-display-component.js] title = ", title, " parts = ", parts);

  const prefixStr = "";
    // isConsideringChain === true? 
    //   displayCertainTokenPrice === true? 
    //     "" 
    //     : 
    //     totalNetWorths>0? 
    //       "" 
    //       : 
    //       parts.prefix 
    //   : 
    //   parts.prefix;
  const valueStr =  
      displayCertainTokenPrice === true || className?.includes("transaction-detail-item")? 
      title.toString()
        : 
        className !== undefined && className?.includes("eth-overview__secondary-balance") === true? 
          "NET WORTH" 
          :totalNetWorths>=0 && className?.includes("transaction-breakdown__value") !== true? 
            "$" + (isNaN(totalNetWorths)===false? Number(totalNetWorths).toFixed(2) : "0.00")
            : 
            parts.value; 
  const suffixStr = ""; //isConsideringChain === true? "" : parts.suffix;
  
  return (
      <div
        className={classnames('currency-display-component', className)}
        data-testid={dataTestId}
        style={style}
        title={(!hideTitle && title) || null}
      >
        {prefixComponent}
        <span className="currency-display-component__text">
          {
            prefixStr
          }
          {
            (valueStr === null || valueStr === undefined || valueStr === "null" || valueStr === "undefined") ? "" : valueStr
          }
        </span>
        {parts.suffix && (
          <span className="currency-display-component__suffix">
            {
              suffixStr
            }
          </span>
        )}
      </div>
  );
}

CurrencyDisplay.propTypes = {
  className: PropTypes.string,
  currency: PropTypes.string,
  'data-testid': PropTypes.string,
  denomination: PropTypes.oneOf([GWEI, ETH]),
  displayValue: PropTypes.string,
  hideLabel: PropTypes.bool,
  hideTitle: PropTypes.bool,
  numberOfDecimals: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  prefix: PropTypes.string,
  prefixComponent: PropTypes.node,
  style: PropTypes.object,
  suffix: PropTypes.string,
  value: PropTypes.string,
};

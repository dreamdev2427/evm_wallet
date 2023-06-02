import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import { useHistory } from 'react-router-dom';

import Identicon from '../../ui/identicon';
import { I18nContext } from '../../../contexts/i18n';
import {
  SEND_ROUTE,
  BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import {
  useMetricEvent,
  useNewMetricEvent,
} from '../../../hooks/useMetricEvent';
import Tooltip from '../../ui/tooltip';
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display';
import CurrencyDisplay from '../../ui/currency-display';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { showModal } from '../../../store/actions';
import {
  getCurrentKeyring,
  getSwapsDefaultToken,
  getIsSwapsChain,
  getIsBuyableChain,
  getNativeCurrencyImage,
  getNativeBalance,
  getDisplayCertainTokenPrice,
  getNativeCurrencyUSDRate
} from '../../../selectors/selectors';
import SwapIcon from '../../ui/icon/swap-icon.component';
import BuyIcon from '../../ui/icon/overview-buy-icon.component';
import SendIcon from '../../ui/icon/overview-send-icon.component';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import IconButton from '../../ui/icon-button';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import WalletOverview from './wallet-overview';

const EthOverview = ({ className, nativeCurrency }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const sendEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Send: Eth',
    },
  });
  // const depositEvent = useMetricEvent({
  //   eventOpts: {
  //     category: 'Navigation',
  //     action: 'Home',
  //     name: 'Clicked Deposit',
  //   },
  // });
  const viewAccountDetailsEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Account Options',
      name: 'Viewed Account Details',
    },
  });
  const history = useHistory();
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring.type);
  const balanceIsCached = false; //useSelector(isBalanceCached);
  // const showFiat = useSelector(getShouldShowFiat);
  // const selectedAccount = useSelector(getSelectedAccount);
  const  nativebalance  = useSelector(getNativeBalance);
  
  const cutUnderpointNumber = (valueStr, underpointDigit) => 
  {
    let strValue = valueStr;
    let pointIndex = strValue.indexOf(".");
    if(pointIndex === -1) return valueStr;
    else{
      let len = strValue.length;
      let m = len - pointIndex - 1;
      let upper = strValue.substring(0, pointIndex);
      let lower = strValue.substring(pointIndex+1, len);
      return upper+"."+lower.substring(0, underpointDigit);
    }      
  }

  const balance = nativebalance? cutUnderpointNumber(nativebalance.toString(), 2) : 0;
  const usdRate = useSelector(getNativeCurrencyUSDRate);
  const balanceWithFiat = "$"+Number(usdRate * balance).toFixed(2);
  const displayValue = balance;
  const isSwapsChain = useSelector(getIsSwapsChain);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const primaryTokenImage = useSelector(getNativeCurrencyImage);

  const enteredSwapsEvent = useNewMetricEvent({
    event: 'Swaps Opened',
    properties: { source: 'Main View', active_currency: 'ETH' },
    category: 'swaps',
  });
  const defaultSwapsToken = useSelector(getSwapsDefaultToken);
  const showCertainToken = useSelector(getDisplayCertainTokenPrice);

  // console.log("[eth-overview.js] defaultSwapsToken=", defaultSwapsToken);

  return (
    <WalletOverview
      balance={
        <Tooltip
          position="top"
          title={t('balanceOutdated')}
          disabled={!balanceIsCached}
        >
          <div className="eth-overview__balance">
            <div className="eth-overview__primary-container">
              <UserPreferencedCurrencyDisplay
                className={classnames('eth-overview__primary-balance', {
                  'eth-overview__cached-balance': balanceIsCached,
                })}
                data-testid="eth-overview__primary-currency"
                value={balance}
                displayValue={displayValue}
                type={PRIMARY}
                ethNumberOfDecimals={4}
                hideTitle
              />
              {/* {balanceIsCached ? (
                <span className="eth-overview__cached-star">*</span>
              ) : null} */}
            </div>
            <div className="eth-overview__secondary-container">              
              <CurrencyDisplay
                className="eth-overview__secondary-balance"
                displayValue={balanceWithFiat}            
              />          
            </div>
          </div>
        </Tooltip>
      }
      buttons={
        <>
        <IconButton
          className="eth-overview__button"
          disabled={!isSwapsChain || !showCertainToken}
          Icon={SwapIcon}
          onClick={() => {
            if (isSwapsChain) {
              enteredSwapsEvent();
              dispatch(setSwapsFromToken(defaultSwapsToken));
              if (usingHardwareWallet) {
                global.platform.openExtensionInBrowser(BUILD_QUOTE_ROUTE);
              } else {
                history.push(BUILD_QUOTE_ROUTE);
              }
            }
          }}
          label={t('swap')}
          tooltipRender={(contents) => (
            <Tooltip
              title={t('currentlyUnavailable')}
              position="bottom"
              disabled={isSwapsChain}
            >
              {contents}
            </Tooltip>
          )}
        />
          <IconButton
            className="eth-overview__button"
            data-testid="eth-overview-send"
            Icon={SendIcon}
            disabled={!showCertainToken}
            label={t('send')}
            onClick={() => {
              sendEvent();
              history.push(SEND_ROUTE);
            }}
          />
          <IconButton
            className="eth-overview__button"
            Icon={BuyIcon}
            disabled={!isBuyableChain}
            label={t('receive')}
            onClick={() => {
              dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
              viewAccountDetailsEvent();
            }}
          />
        </>
      }
      className={className}
      icon={<Identicon diameter={32} image={primaryTokenImage} imageBorder />}
    />
  );
};

EthOverview.propTypes = {
  className: PropTypes.string,
};

EthOverview.defaultProps = {
  className: undefined,
};

export default EthOverview;

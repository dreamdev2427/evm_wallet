import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';

import Identicon from '../../ui/identicon';
import Tooltip from '../../ui/tooltip';
import CurrencyDisplay from '../../ui/currency-display';
import { I18nContext } from '../../../contexts/i18n';
import { isHardwareKeyring } from '../../../helpers/utils/hardware';
import {
  SEND_ROUTE,
  BUILD_QUOTE_ROUTE,
} from '../../../helpers/constants/routes';
import {
  useMetricEvent,
  useNewMetricEvent,
} from '../../../hooks/useMetricEvent';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../../hooks/useTokenFiatAmount';
import { ASSET_TYPES, updateSendAsset } from '../../../ducks/send';
import { setSwapsFromToken } from '../../../ducks/swaps/swaps';
import {
  getCurrentKeyring,
  getIsSwapsChain,
} from '../../../selectors/selectors';

import SwapIcon from '../../ui/icon/swap-icon.component';
import BuyIcon from '../../ui/icon/overview-buy-icon.component';
import SendIcon from '../../ui/icon/overview-send-icon.component';

import IconButton from '../../ui/icon-button';
import { INVALID_ASSET_TYPE } from '../../../helpers/constants/error-keys';
import { showModal, setDisplayCertainTokenPrice  } from '../../../store/actions';
import WalletOverview from './wallet-overview';
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, POLYGON_CHAIN_ID } from '../../../../shared/constants/network';
import { getCurrentChainId, getIsBuyableChain } from '../../../selectors';
import { getERC20TokensWithBalances } from '../../../selectors';
import { isEqualCaseInsensitive } from '../../../helpers/utils/util';

const TokenOverview = ({ className, token }) => {
  const dispatch = useDispatch();
  const t = useContext(I18nContext);
  const sendTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Send: Token',
    },
  });
  const depositEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Home',
      name: 'Clicked Deposit',
    },
  });
  const history = useHistory();
  const keyring = useSelector(getCurrentKeyring);
  const usingHardwareWallet = isHardwareKeyring(keyring.type);  
  const chainId = useSelector(getCurrentChainId);
  const isBuyableChain = useSelector(getIsBuyableChain);
  const isConsideringChain = (chainId === AVALANCHE_CHAIN_ID || chainId === BSC_CHAIN_ID || chainId === POLYGON_CHAIN_ID || chainId === MAINNET_CHAIN_ID || chainId === FANTOM_CHAIN_ID)? true : false;
  const tokensWithBalances = isConsideringChain === true? 
    useSelector(getERC20TokensWithBalances)
    :
    useTokenTracker([token]).tokensWithBalances;
  const balanceToRender = isConsideringChain === true? 
    tokensWithBalances.find(item => isEqualCaseInsensitive(item.address, token.address)).string
    :
    tokensWithBalances[0]?.string;
  const balance = isConsideringChain === true? 
    tokensWithBalances.find(item => isEqualCaseInsensitive(item.address, token.address)).balance
    :
    tokensWithBalances[0]?.balance;
  const formattedFiatBalance = isConsideringChain === true? 
    Number(tokensWithBalances) >0? "$"+tokensWithBalances.find(item => isEqualCaseInsensitive(item.address, token.address)).usdPrice : "" 
    :
    useTokenFiatAmount(
      token.address,
      balanceToRender,
      token.symbol,
    );
  const isSwapsChain = useSelector(getIsSwapsChain);
  const enteredSwapsEvent = useNewMetricEvent({
    event: 'Swaps Opened',
    properties: { source: 'Token View', active_currency: token.symbol },
    category: 'swaps',
  });

  useEffect(() => {
    // if (token.isERC721 && process.env.COLLECTIBLES_V1) {
    if (token.isERC721 ) {
      dispatch(
        showModal({
          name: 'CONVERT_TOKEN_TO_NFT',
          tokenAddress: token.address,
        }),
      );
    }
  }, [token.isERC721, token.address, dispatch]);
  
  return (
    <WalletOverview
      balance={
        <div className="token-overview__balance">
          <CurrencyDisplay
            className="token-overview__primary-balance"
            displayValue={balanceToRender}
            suffix={token.symbol}
          />          
          <CurrencyDisplay
            className="token-overview__secondary-balance"
            displayValue={formattedFiatBalance}            
          />          
        </div>
      }
      buttons={
        <>
        <IconButton
          className="token-overview__button"
          disabled={!isSwapsChain}
          Icon={SwapIcon}
          onClick={() => {
            dispatch(setDisplayCertainTokenPrice(false));
            if (isSwapsChain) {
              enteredSwapsEvent();
              dispatch(
                setSwapsFromToken({
                  ...token,
                  iconUrl: token.image,
                  balance,
                  string: balanceToRender,
                }),
              );
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
            className="token-overview__button"
            onClick={async () => {
              dispatch(setDisplayCertainTokenPrice(false));
              sendTokenEvent();
              try {
                await dispatch(
                  updateSendAsset({
                    type: ASSET_TYPES.TOKEN,
                    details: token,
                  }),
                );
                history.push(SEND_ROUTE);
              } catch (err) {
                if (!err.message.includes(INVALID_ASSET_TYPE)) {
                  throw err;
                }
              }
            }}
            Icon={SendIcon}
            label={t('send')}
            disabled={token.isERC721}
          />
          <IconButton
            className="token-overview__button"
            Icon={BuyIcon}
            disabled={!isBuyableChain}
            label={t('receive')}
            onClick={() => {
              dispatch(setDisplayCertainTokenPrice(false));
              dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
              viewAccountDetailsEvent();
            }}
          />
        </>
      }
      className={className}
      icon={
        <Identicon diameter={32} address={token.address} image={token.image} />
      }
    />
  );
};

TokenOverview.propTypes = {
  className: PropTypes.string,
  token: PropTypes.shape({
    address: PropTypes.string.isRequired,
    decimals: PropTypes.number,
    symbol: PropTypes.string,
    image: PropTypes.string,
    isERC721: PropTypes.bool,
  }).isRequired,
};

TokenOverview.defaultProps = {
  className: undefined,
};

export default TokenOverview;

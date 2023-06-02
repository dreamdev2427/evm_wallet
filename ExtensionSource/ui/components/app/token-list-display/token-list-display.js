import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';

import { getShouldHideZeroBalanceTokens , getERC20TokensWithBalances} from '../../../selectors';
import { useTokenTracker } from '../../../hooks/useTokenTracker';
import Identicon from '../../ui/identicon';
import TokenBalance from '../../ui/token-balance';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function TokenListDisplay({ clickHandler }) {
  const t = useI18nContext();
  const shouldHideZeroBalanceTokens = useSelector(
    getShouldHideZeroBalanceTokens,
  );

  const tokens = useSelector(getERC20TokensWithBalances);
  // const { loading, tokensWithBalances } = useTokenTracker(
  //   tokens,
  //   true,
  //   shouldHideZeroBalanceTokens,
  // );
  // if (loading) {
  //   return <div className="loading-span">{t('loadingTokens')}</div>;
  // }

  const sendableTokens = tokens.filter((token) => !token.isERC721);

  return (
    <>
      {sendableTokens.map((tokenData) => {
        const { address, symbol, image, string } = tokenData;

        return (
          <div
            key={address}
            className="token-list-item"
            onClick={() => clickHandler(tokenData)}
          >
            <Identicon address={address} diameter={36} image={image} />
            <div className="token-list-item__data">
              <div className="token-list-item__symbol">{symbol}</div>
              <div className="token-list-item__balance">
                <span className="token-list-item__balance__label">
                  {`${t('balance')}:`}
                </span>
                <div class="currency-display-component" title={string}>
                  <span class="currency-display-component__text">{string? string : ""}</span>
                  <span class="currency-display-component__suffix"></span>
                </div>
                {/* <TokenBalance token={tokenData} /> */}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}

TokenListDisplay.propTypes = {
  clickHandler: PropTypes.func,
};

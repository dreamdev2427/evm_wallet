import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import ImportTokenLink from '../import-token-link';
import TokenList from '../token-list';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import AssetListItem from '../asset-list-item';
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common';
import { useMetricEvent } from '../../../hooks/useMetricEvent';
import { useUserPreferencedCurrency } from '../../../hooks/useUserPreferencedCurrency';
import {
  getCurrentAccountWithSendEtherInfo,
  getShouldShowFiat,
  // getNativeCurrencyImage,
  getIsMainnet,
  // getNativeCurrencyUSDRate,
  // getNativeBalance,
} from '../../../selectors';
// import { getNativeCurrency } from '../../../ducks/metamask/metamask';
import { useCurrencyDisplay } from '../../../hooks/useCurrencyDisplay';
import Typography from '../../ui/typography/typography';
import Box from '../../ui/box/box';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, NATIVE_CURRENCY_TOKEN_IMAGE_MAP, POLYGON_CHAIN_ID } from '../../../../shared/constants/network';

const AssetList = ({ onClickAsset }) => {
  const t = useI18nContext();
  const history = useHistory();
  const selectedAccountBalance = useSelector(
    (state) => getCurrentAccountWithSendEtherInfo(state).balance,
  );
  // const nativeCurrency = useSelector(getNativeCurrency);
  const showFiat = useSelector(getShouldShowFiat);
  // const usdRate = useSelector(getNativeCurrencyUSDRate);
  const selectTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Token Menu',
      name: 'Clicked Token',
    },
  });
  const addTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Token Menu',
      name: 'Clicked "Add Token"',
    },
  });

  const {
    currency: primaryCurrency,
    numberOfDecimals: primaryNumberOfDecimals,
  } = useUserPreferencedCurrency(PRIMARY, { ethNumberOfDecimals: 2 });
  const {
    currency: secondaryCurrency,
    numberOfDecimals: secondaryNumberOfDecimals,
  } = useUserPreferencedCurrency(SECONDARY, { ethNumberOfDecimals: 2 });

  const [, primaryCurrencyProperties] = useCurrencyDisplay(
    selectedAccountBalance,
    {
      numberOfDecimals: primaryNumberOfDecimals,
      currency: primaryCurrency,
    },
  );

  const [
    secondaryCurrencyDisplay,
    secondaryCurrencyProperties,
  ] = useCurrencyDisplay(selectedAccountBalance, {
    numberOfDecimals: secondaryNumberOfDecimals,
    currency: secondaryCurrency,
  });

  const isMainnet = useSelector(getIsMainnet) || process.env.IN_TEST;

  const ethBalance = useSelector( state => state.metamask.nativeBalance[MAINNET_CHAIN_ID]? state.metamask.nativeBalance[MAINNET_CHAIN_ID] : 0 );
  const ethUsdRate = useSelector( state => state.metamask.nativeCurrencyUSDRate[MAINNET_CHAIN_ID]? state.metamask.nativeCurrencyUSDRate[MAINNET_CHAIN_ID] : 0 );

  const avaxBalance = useSelector( state => state.metamask.nativeBalance[AVALANCHE_CHAIN_ID]? state.metamask.nativeBalance[AVALANCHE_CHAIN_ID] : 0 );
  const avaxUsdRate = useSelector( state => state.metamask.nativeCurrencyUSDRate[AVALANCHE_CHAIN_ID]? state.metamask.nativeCurrencyUSDRate[AVALANCHE_CHAIN_ID] : 0 );

  const bnbBalance = useSelector( state => state.metamask.nativeBalance[BSC_CHAIN_ID]? state.metamask.nativeBalance[BSC_CHAIN_ID] : 0 );
  const bnbUsdRate = useSelector( state => state.metamask.nativeCurrencyUSDRate[BSC_CHAIN_ID]? state.metamask.nativeCurrencyUSDRate[BSC_CHAIN_ID] : 0 );

  const maticBalance = useSelector( state => state.metamask.nativeBalance[POLYGON_CHAIN_ID]? state.metamask.nativeBalance[POLYGON_CHAIN_ID] : 0 );
  const maticUsdRate = useSelector( state => state.metamask.nativeCurrencyUSDRate[POLYGON_CHAIN_ID]? state.metamask.nativeCurrencyUSDRate[POLYGON_CHAIN_ID] : 0 );

  const ftmBalance = useSelector( state => state.metamask.nativeBalance[FANTOM_CHAIN_ID]? state.metamask.nativeBalance[FANTOM_CHAIN_ID] : 0 );
  const ftmUsdRate = useSelector( state => state.metamask.nativeCurrencyUSDRate[FANTOM_CHAIN_ID]? state.metamask.nativeCurrencyUSDRate[FANTOM_CHAIN_ID] : 0);

  return (
    <>     
      {/* <AssetListItem
        onClick={() => onClickAsset("ETH", MAINNET_CHAIN_ID)}
        data-testid="wallet-balance"
        primary={
          Number(ethBalance).toFixed(2)
        }
        tokenSymbol="ETH"
        secondary={showFiat ? "ETH" : undefined}
        tokenImage={NATIVE_CURRENCY_TOKEN_IMAGE_MAP["ETH"]}
        usdPrice={ethUsdRate>0? Number(ethUsdRate*Number(ethBalance)).toFixed(2) : 0 }
        tokenName="ETH"
        chainId={MAINNET_CHAIN_ID}
        identiconBorder
      />      */}
      <AssetListItem
        onClick={() => onClickAsset("AVAX", AVALANCHE_CHAIN_ID)}
        data-testid="wallet-balance"
        primary={
          Number(avaxBalance).toFixed(2)
        }
        tokenSymbol="AVAX"
        secondary={showFiat ? "AVAX" : undefined}
        tokenImage={NATIVE_CURRENCY_TOKEN_IMAGE_MAP["AVAX"]}
        usdPrice={avaxUsdRate>0? Number(avaxUsdRate*Number(avaxBalance)).toFixed(2) : 0 }
        tokenName="AVAX"
        chainId={AVALANCHE_CHAIN_ID}
        identiconBorder
      />     
      <AssetListItem
        onClick={() => onClickAsset("BNB", BSC_CHAIN_ID)}
        data-testid="wallet-balance"
        primary={
          Number(bnbBalance).toFixed(2)
        }
        tokenSymbol="BNB"
        secondary={showFiat ? "BNB" : undefined}
        tokenImage={NATIVE_CURRENCY_TOKEN_IMAGE_MAP["BNB"]}
        usdPrice={bnbUsdRate>0? Number(bnbUsdRate*Number(bnbBalance)).toFixed(2) : 0 }
        tokenName="BNB"
        chainId={BSC_CHAIN_ID}
        identiconBorder
      />     
      <AssetListItem
        onClick={() => onClickAsset("MATIC", POLYGON_CHAIN_ID)}
        data-testid="wallet-balance"
        primary={
          Number(maticBalance).toFixed(2)
        }
        tokenSymbol="MATIC"
        secondary={showFiat ? "MATIC" : undefined}
        tokenImage={NATIVE_CURRENCY_TOKEN_IMAGE_MAP["MATIC"]}
        usdPrice={maticUsdRate>0? Number(maticUsdRate*Number(maticBalance)).toFixed(2) : 0 }
        tokenName="MATIC"
        chainId={POLYGON_CHAIN_ID}
        identiconBorder
      />     
      <AssetListItem
        onClick={() => onClickAsset("FTM", FANTOM_CHAIN_ID)}
        data-testid="wallet-balance"
        primary={
          Number(ftmBalance).toFixed(2)
        }
        tokenSymbol="FTM"
        secondary={showFiat ? "FTM" : undefined}
        tokenImage={NATIVE_CURRENCY_TOKEN_IMAGE_MAP["FTM"]}
        usdPrice={ftmUsdRate>0? Number(ftmUsdRate*Number(ftmBalance)).toFixed(2) : 0 }
        tokenName="FTM"
        chainId={FANTOM_CHAIN_ID}
        identiconBorder
      />     
      <TokenList
        onTokenClick={(tokenAddress, chainId) => {
          onClickAsset(tokenAddress, chainId);
          selectTokenEvent();
        }}
      />
      <Box marginTop={4}>
        <Box justifyContent={JUSTIFY_CONTENT.CENTER}>
          <Typography
            color={COLORS.UI4}
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.NORMAL}
          >
            {t('missingToken')}
          </Typography>
        </Box>
        <ImportTokenLink
          isMainnet={isMainnet}
          onClick={() => {
            history.push(IMPORT_TOKEN_ROUTE);
            addTokenEvent();
          }}
        />
      </Box>
    </>
  );
};

AssetList.propTypes = {
  onClickAsset: PropTypes.func.isRequired,
};

export default AssetList;

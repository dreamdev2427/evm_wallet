import React, { PureComponent , useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  InteractionManager,
} from 'react-native';
import TokenImage from '../TokenImage';
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import ActionSheet from 'react-native-actionsheet';
import axios from "axios";
import {
  renderFromTokenMinimalUnit,
  balanceToFiat,
} from '../../../util/number';
import Engine from '../../../core/Engine';
import Logger from '../../../util/Logger';
import AssetElement from '../AssetElement';
import { connect } from 'react-redux';
import { safeToChecksumAddress } from '../../../util/address';
import Analytics from '../../../core/Analytics/Analytics';
import AnalyticsV2 from '../../../util/analyticsV2';
import { ANALYTICS_EVENT_OPTS } from '../../../util/analytics';
import NetworkMainAssetLogo from '../NetworkMainAssetLogo';
import { getTokenList } from '../../../reducers/tokens';
import { isZero } from '../../../util/lodash';
import { ThemeContext, useAppThemeFromContext, mockTheme } from '../../../util/theme';
import Text from '../../Base/Text';
import { AVALANCHE_CHAIN_ID, AVAX_TOKEN_IMAGE_URL, BNB_TOKEN_IMAGE_URL, BSC_CHAIN_ID, COINGEKCO_NETWORK_ID, MATIC_TOKEN_IMAGE_URL, POLYGON_CHAIN_ID, supported4Networks, WRAPPED_CURRENCY_ADDRESSES } from '../../../util/swap_config';
import { decimalToHex } from '../../../util/conversions';
import { calcTokenAmount } from '../../../util/transactions';
import { setAccountFiatBalance } from '../../../actions/transaction';

const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      minHeight: 500,
    },
    emptyView: {
      backgroundColor: colors.background.default,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
    },
    text: {
      fontSize: 20,
      color: colors.text.default,
      ...fontStyles.normal,
    },
    add: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addText: {
      fontSize: 14,
      color: colors.primary.default,
      ...fontStyles.normal,
    },
    tokensDetectedButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },
    tokensDetectedText: {
      fontSize: 14,
      color: colors.primary.default,
      ...fontStyles.normal,
    },
    footer: {
      flex: 1,
      paddingBottom: 30,
      alignItems: 'center',
      marginTop: 24,
    },
    balances: {
      flex: 1,
      justifyContent: 'center',
    },
    balance: {
      fontSize: 16,
      color: colors.text.default,
      ...fontStyles.normal,
      textTransform: 'uppercase',
    },
    balanceFiat: {
      fontSize: 12,
      color: colors.text.alternative,
      ...fontStyles.normal,
      textTransform: 'uppercase',
    },
    balanceFiatTokenError: {
      textTransform: 'capitalize',
    },
    ethLogo: {
      width: 50,
      height: 50,
      borderRadius: 25,
      overflow: 'hidden',
      marginRight: 20,
    },
    emptyText: {
      color: colors.text.alternative,
      marginBottom: 8,
      fontSize: 14,
    },
  });

/**
 * View that renders a list of ERC-20 Tokens
 */
const Tokens = ({
  navigation,
  tokens,
  conversionRate,
  currentCurrency,
  tokenBalances,
  tokenExchangeRates,
  transactions,
  primaryCurrency,
  hideZeroBalanceTokens,
  tokenList,
  selectedAddress,
  chainId,
  updateAccountFiatBalance
}) => {  

  const [actionSheet, setActionSheet] = useState(null);
  const [tokenToRemove, setTokenToRemove] = useState(null);  
  const [isAddTokenEnabled, setIsAddTokenEnabled] = useState(true);  
  const [tokensWithBalances, setTokensWithBalances] = useState([]);

  const renderEmpty = () => {
    const { colors } = useAppThemeFromContext() || mockTheme;
    const styles = createStyles(colors);

    return (
      <View style={styles.emptyView}>
        <Text style={styles.text}>{strings('wallet.no_tokens')}</Text>
      </View>
    );
  };

  const getDecimalChainId = (chainId) =>
  {
    if (!chainId || typeof chainId !== 'string' || !chainId.startsWith('0x')) {
      return chainId;
    }
    return parseInt(chainId, 16).toString(10);
  }

  const onSetRpcTarget = async (chainId) => {
    const { NetworkController, CurrencyRateController } = Engine.context;
    
      let rpcUrl = supported4Networks[chainId.toString()].rpcUrl;
      let decimalChainId = getDecimalChainId(chainId);
      let ticker =supported4Networks[chainId.toString()].ticker;
      let nickname = supported4Networks[chainId.toString()].networkName;
      let blockExplorerUrl = supported4Networks[chainId.toString()].blockExplorerUrl;

      CurrencyRateController.setNativeCurrency(ticker);
      NetworkController.setRpcTarget(rpcUrl, decimalChainId, ticker, nickname);

      AnalyticsV2.trackEvent(AnalyticsV2.ANALYTICS_EVENTS.NETWORK_SWITCHED, {
        rpc_url: rpcUrl,
        chain_id: decimalChainId,
        source: 'Settings',
        symbol: ticker,
        block_explorer_url: blockExplorerUrl,
        network_name: 'rpc',
      });
  };

  const onItemPress = async (token) => {
    const { TokensController } = Engine.context;
    try {
      await onSetRpcTarget(token.chainId);
      if(token.address === "0x0000000000000000000000000000000000000000") {}
      else await TokensController.addToken(token.address, token.symbol, token.decimals);
      navigation.navigate('Asset', {
      ...token,
        transactions: transactions,
    });
    }catch(e)
    {}
  };

  const getAllTokens = async () => 
  {        
    let totalNetworth = 0;
    let allTokens = [];
    
    setTokensWithBalances([]);
    try {
      let chainId = BSC_CHAIN_ID;
      let netWorth = 0;
      let usdRate = 0;    
      let wAddr = WRAPPED_CURRENCY_ADDRESSES[chainId.toString()];

      let tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${wAddr}&vs_currencies=usd`, {});              
      
      if(tokenPriceData.data && tokenPriceData.data[wAddr.toLowerCase()])
      {
        usdRate = tokenPriceData.data[wAddr.toLowerCase()].usd;
      }

      var { data } = await axios.get(`https://deep-index.moralis.io/api/v2/${selectedAddress}/balance?chain=${chainId}`, {
        headers: {
          'X-API-Key': 'E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3'
        }
      });
      if (data && data.balance) {
        netWorth = Number(usdRate) * Number(calcTokenAmount(Number(data.balance), 18).toString()); 
        let newToken = {
          address: "0x0000000000000000000000000000000000000000",
          balance: Number(calcTokenAmount(Number(data.balance), 18).toString()).toFixed(2), 
          balanceError: null,
          decimals: 18,
          image: BNB_TOKEN_IMAGE_URL,
          isETH: true,
          symbol: "BNB",
          balanceFiat: "$"+Number(netWorth).toFixed(2),
          name: "BNB",
          chainId,
          key: allTokens.length + 1
        };                 
        totalNetworth += netWorth;
        allTokens = allTokens.concat(newToken); 
        setTokensWithBalances(allTokens);
        updateAccountFiatBalance(selectedAddress, totalNetworth);
      }

      let requestURL1 = `https://deep-index.moralis.io/api/v2/${selectedAddress}/erc20/?chain=${chainId}`;

      let response1 = await axios.get(requestURL1, 
      {
        headers: { "X-API-Key": "E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3" },
      });

      let fetchedTokens = response1.data;
      if(fetchedTokens && fetchedTokens.length>0)
      {
        let idx = 0;
        for(idx=0; idx<fetchedTokens.length; idx++)
        {                      
          let tokenItem = fetchedTokens[idx];    
          let tokenAmount = Number(calcTokenAmount(tokenItem.balance, tokenItem.decimals).toString()).toFixed(2);
          let newToken = {
            address: tokenItem.token_address,
            balance: tokenAmount, //tokenItem.balance,
            balanceError: null,
            decimals: tokenItem.decimals,
            image: tokenItem.logo || tokenItem.thumbnail,
            isETH: false,
            symbol: tokenItem.symbol,
            balanceFiat: 0,
            name: tokenItem.name,
            chainId,
            key: allTokens.length + 1
          };              
          try{
            let tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${newToken.address}&vs_currencies=usd`, {});              
           
            if(tokenPriceData.data && tokenPriceData.data[newToken.address])
            { 
              newToken.balanceFiat = "$"+(Number(tokenPriceData.data[newToken.address].usd) * tokenAmount).toFixed(2);
              netWorth += Number(tokenPriceData.data[newToken.address].usd) * tokenAmount;       
              totalNetworth += Number(tokenPriceData.data[newToken.address].usd) * tokenAmount;
              updateAccountFiatBalance(selectedAddress, totalNetworth);
            }else{
              newToken.balanceFiat = 0;
            }
            allTokens = allTokens.concat(newToken); 
            setTokensWithBalances(allTokens);
          }catch(error) {
            newToken.balanceFiat = 0;   
            allTokens = allTokens.concat(newToken); 
            setTokensWithBalances(allTokens);
            Logger.log("[tokens/index.js] catching token price error: ", error);
          }
        }
      }
    }catch(e)
    {
      Logger.error("[tokens/index.js] Fetching tokens error : ", e);
    }        
    try {
      let chainId = AVALANCHE_CHAIN_ID;
      let netWorth = 0;
      let usdRate = 0;    
      let wAddr = WRAPPED_CURRENCY_ADDRESSES[chainId.toString()];

      let tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${wAddr}&vs_currencies=usd`, {});              
      
      if(tokenPriceData.data && tokenPriceData.data[wAddr.toLowerCase()])
      {
        usdRate = tokenPriceData.data[wAddr.toLowerCase()].usd;
      }

      var { data } = await axios.get(`https://deep-index.moralis.io/api/v2/${selectedAddress}/balance?chain=${chainId}`, {
        headers: {
          'X-API-Key': 'E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3'
        }
      });
      if (data && data.balance) {
        netWorth = Number(usdRate) * Number(calcTokenAmount(Number(data.balance), 18).toString()); 
        let newToken = {
          address: "0x0000000000000000000000000000000000000000",
          balance: Number(calcTokenAmount(Number(data.balance), 18).toString()).toFixed(2), 
          balanceError: null,
          decimals: 18,
          image: AVAX_TOKEN_IMAGE_URL,
          isETH: true,
          symbol: "AVAX",
          balanceFiat: "$"+Number(netWorth).toFixed(2),
          name: "AVAX",
          chainId,
          key: allTokens.length + 1
        };                 
        totalNetworth += netWorth;
        allTokens = allTokens.concat(newToken); 
        setTokensWithBalances(allTokens);
        updateAccountFiatBalance(selectedAddress, totalNetworth);
      }

      let requestURL1 = `https://deep-index.moralis.io/api/v2/${selectedAddress}/erc20/?chain=${chainId}`;

      let response1 = await axios.get(requestURL1, 
      {
        headers: { "X-API-Key": "E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3" },
      });

      let fetchedTokens = response1.data;
      if(fetchedTokens && fetchedTokens.length>0)
      {
        let idx = 0;
        for(idx=0; idx<fetchedTokens.length; idx++)
        {                      
          let tokenItem = fetchedTokens[idx];    
          let tokenAmount = Number(calcTokenAmount(tokenItem.balance, tokenItem.decimals).toString()).toFixed(2);
          let newToken = {
            address: tokenItem.token_address,
            balance: tokenAmount, //tokenItem.balance,
            balanceError: null,
            decimals: tokenItem.decimals,
            image: tokenItem.logo || tokenItem.thumbnail,
            isETH: false,
            symbol: tokenItem.symbol,
            balanceFiat: 0,
            name: tokenItem.name,
            chainId,
            key: allTokens.length + 1
          };              
          try{
            let tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${newToken.address}&vs_currencies=usd`, {});              
           
            if(tokenPriceData.data && tokenPriceData.data[newToken.address])
            { 
              newToken.balanceFiat = "$"+(Number(tokenPriceData.data[newToken.address].usd) * tokenAmount).toFixed(2);
              netWorth += Number(tokenPriceData.data[newToken.address].usd) * tokenAmount;       
              totalNetworth += Number(tokenPriceData.data[newToken.address].usd) * tokenAmount;
              updateAccountFiatBalance(selectedAddress, totalNetworth);
            }else{
              newToken.balanceFiat = 0;
            }
            allTokens = allTokens.concat(newToken); 
            setTokensWithBalances(allTokens);
          }catch(error) {
            newToken.balanceFiat = 0;   
            allTokens = allTokens.concat(newToken); 
            setTokensWithBalances(allTokens);
            Logger.log("[tokens/index.js] catching token price error: ", error);
          }
        }
      }
    }catch(e)
    {
      Logger.error("[tokens/index.js] Fetching tokens error : ", e);
    }        
    try {
      let chainId = POLYGON_CHAIN_ID;
      let netWorth = 0;
      let usdRate = 0;    
      let wAddr = WRAPPED_CURRENCY_ADDRESSES[chainId.toString()];

      let tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${wAddr}&vs_currencies=usd`, {});              
      
      if(tokenPriceData.data && tokenPriceData.data[wAddr.toLowerCase()])
      {
        usdRate = tokenPriceData.data[wAddr.toLowerCase()].usd;
      }

      var { data } = await axios.get(`https://deep-index.moralis.io/api/v2/${selectedAddress}/balance?chain=${chainId}`, {
        headers: {
          'X-API-Key': 'E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3'
        }
      });
      if (data && data.balance) {
        netWorth = Number(usdRate) * Number(calcTokenAmount(Number(data.balance), 18).toString()); 
        let newToken = {
          address: "0x0000000000000000000000000000000000000000",
          balance: Number(calcTokenAmount(Number(data.balance), 18).toString()).toFixed(2), 
          balanceError: null,
          decimals: 18,
          image: MATIC_TOKEN_IMAGE_URL,
          isETH: true,
          symbol: "MATIC",
          balanceFiat: "$"+Number(netWorth).toFixed(2),
          name: "MATIC",
          chainId,
          key: allTokens.length + 1
        };                 
        totalNetworth += netWorth;
        allTokens = allTokens.concat(newToken); 
        setTokensWithBalances(allTokens);
        updateAccountFiatBalance(selectedAddress, totalNetworth);
      }

      let requestURL1 = `https://deep-index.moralis.io/api/v2/${selectedAddress}/erc20/?chain=${chainId}`;

      let response1 = await axios.get(requestURL1, 
      {
        headers: { "X-API-Key": "E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3" },
      });

      let fetchedTokens = response1.data;
      if(fetchedTokens && fetchedTokens.length>0)
      {
        let idx = 0;
        for(idx=0; idx<fetchedTokens.length; idx++)
        {                      
          let tokenItem = fetchedTokens[idx];    
          let tokenAmount = Number(calcTokenAmount(tokenItem.balance, tokenItem.decimals).toString()).toFixed(2);
          let newToken = {
            address: tokenItem.token_address,
            balance: tokenAmount, //tokenItem.balance,
            balanceError: null,
            decimals: tokenItem.decimals,
            image: tokenItem.logo || tokenItem.thumbnail,
            isETH: false,
            symbol: tokenItem.symbol,
            balanceFiat: 0,
            name: tokenItem.name,
            chainId,
            key: allTokens.length + 1
          };              
          try{
            let tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${newToken.address}&vs_currencies=usd`, {});              
           
            if(tokenPriceData.data && tokenPriceData.data[newToken.address])
            { 
              newToken.balanceFiat = "$"+(Number(tokenPriceData.data[newToken.address].usd) * tokenAmount).toFixed(2);
              netWorth += Number(tokenPriceData.data[newToken.address].usd) * tokenAmount;       
              totalNetworth += Number(tokenPriceData.data[newToken.address].usd) * tokenAmount;
              updateAccountFiatBalance(selectedAddress, totalNetworth);
            }else{
              newToken.balanceFiat = 0;
            }
            allTokens = allTokens.concat(newToken); 
            setTokensWithBalances(allTokens);
          }catch(error) {
            newToken.balanceFiat = 0;   
            allTokens = allTokens.concat(newToken); 
            setTokensWithBalances(allTokens);
            Logger.log("[tokens/index.js] catching token price error: ", error);
          }
        }
      }
    }catch(e)
    {
      Logger.error("[tokens/index.js] Fetching tokens error : ", e);
    }
  }
  
  useEffect(() => 
  {      
      setTimeout(() => {        
        getAllTokens();        
      }, 500);
    }, [selectedAddress]
  );

  const renderFooter = () => {
    const { colors } = useAppThemeFromContext() || mockTheme;
    const styles = createStyles(colors);

    return (
      <View style={styles.footer} key={'tokens-footer'}>
        <Text style={styles.emptyText}>
          {strings('wallet.no_available_tokens')}
        </Text>
        <TouchableOpacity
          style={styles.add}
          onPress={goToAddToken}
          disabled={!isAddTokenEnabled}
          testID={'add-token-button'}
        >
          <Text style={styles.addText}>{strings('wallet.add_tokens')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = (asset, index) => 
  {
      const { colors } = useAppThemeFromContext() || mockTheme;
      const styles = createStyles(colors);

    const itemAddress = safeToChecksumAddress(asset.address);
      const logo = asset.logo || tokenList?.[itemAddress?.toLowerCase?.()]?.iconUrl;
    const exchangeRate =
      itemAddress in tokenExchangeRates
        ? tokenExchangeRates[itemAddress]
        : undefined;
    const balance =
      asset.balance ||
      (itemAddress in tokenBalances
        ? renderFromTokenMinimalUnit(tokenBalances[itemAddress], asset.decimals)
        : 0);
    const balanceFiat =
      asset.balanceFiat ||
      balanceToFiat(balance, conversionRate, exchangeRate, currentCurrency);
    const balanceValue = `${balance} ${asset.symbol}`;

    // render balances according to primary currency
    let mainBalance, secondaryBalance;
    if (primaryCurrency === 'ETH') {
      mainBalance = balanceValue;
      secondaryBalance = balanceFiat;
    } else {
      mainBalance = !balanceFiat ? balanceValue : balanceFiat;
      secondaryBalance = !balanceFiat ? balanceFiat : balanceValue;
    }

    if (asset?.balanceError) {
      mainBalance = asset.symbol;
      secondaryBalance = strings('wallet.unable_to_load');
    }

    asset = { logo, ...asset, balance, balanceFiat };
    return (
      <AssetElement
          key={itemAddress+""+index || '0x'}
        testID={'asset'}
          onPress={onItemPress}
          onLongPress={asset.isETH ? null : showRemoveMenu}
        asset={asset}
      >
          {/* {asset.isETH ? (
          <NetworkMainAssetLogo
            big
            style={styles.ethLogo}
            testID={'eth-logo'}
          />
          ) : ( */}
          <TokenImage asset={asset} containerStyle={styles.ethLogo} />
          {/* )} */}

        <View style={styles.balances} testID={'balance'}>
          <Text style={styles.balance}>{mainBalance}</Text>
          {secondaryBalance ? (
            <Text
              style={[
                styles.balanceFiat,
                asset?.balanceError && styles.balanceFiatTokenError,
              ]}
            >
              {secondaryBalance}
            </Text>
          ) : null}
        </View>
      </AssetElement>
    );
  }

  const goToBuy = () => {
    navigation.navigate('FiatOnRampAggregator');
    InteractionManager.runAfterInteractions(() => {
      Analytics.trackEventWithParameters(
        AnalyticsV2.ANALYTICS_EVENTS.BUY_BUTTON_CLICKED,
        {
          text: 'Buy Native Token',
          location: 'Home Screen',
          chain_id_destination: this.props.chainId,
        },
      );
    });
  };

  const renderList = 
    () => {
    return (
      <View>
          {
            tokensWithBalances && tokensWithBalances.length>0? 
            tokensWithBalances.map((item, index) => renderItem(item, index)) 
            : 
            <div></div>}
          {renderFooter()}
      </View>
    );
  }

  const goToAddToken = () => {
    setIsAddTokenEnabled(false);
    navigation.push('AddAsset', { assetType: 'token' });
    InteractionManager.runAfterInteractions(() => {
      AnalyticsV2.trackEvent(
        AnalyticsV2.ANALYTICS_EVENTS.TOKEN_IMPORT_CLICKED,
        {
          source: 'manual',
          chain_id: getDecimalChainId(
            NetworkController?.state?.provider?.chainId,
          ),
        },
      );
      this.setState({ isAddTokenEnabled: true });
    });
  };

  const showRemoveMenu = (token) => {
    setTokenToRemove(token);
    actionSheet.show();
  };

  const removeToken = () => {
    const { TokensController } = Engine.context;
    const tokenAddress = tokenToRemove?.address;
    try {
      TokensController.removeAndIgnoreToken(tokenAddress);
      Alert.alert(
        strings('wallet.token_removed_title'),
        strings('wallet.token_removed_desc'),
      );
    } catch (error) {
      Logger.log('Error while trying to remove token', error, tokenAddress);
      Alert.alert(
        strings('wallet.token_removal_issue_title'),
        strings('wallet.token_removal_issue_desc'),
      );
    }
  };

  const createActionSheetRef = (ref) => {
    setActionSheet(ref);
  };

  const onActionSheetPress = (index) => (index === 0 ? removeToken() : null);

  const { colors, themeAppearance } = useAppThemeFromContext() || mockTheme;
  const styles = createStyles(colors);

    return (
      <View style={styles.wrapper} testID={'tokens'}>
      {tokensWithBalances && tokensWithBalances.length ? renderList() : renderEmpty()}
        <ActionSheet
        ref={createActionSheetRef}
          title={strings('wallet.remove_token_title')}
          options={[strings('wallet.remove'), strings('wallet.cancel')]}
          cancelButtonIndex={1}
          destructiveButtonIndex={0}
        onPress={onActionSheetPress}
          theme={themeAppearance}
        />
      </View>
    );
}

Tokens.propTypes = {
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation: PropTypes.object,
  /**
   * Array of assets (in this case ERC20 tokens)
   */
  tokens: PropTypes.array,
  /**
   * ETH to current currency conversion rate
   */
  conversionRate: PropTypes.number,
  /**
   * Currency code of the currently-active currency
   */
  currentCurrency: PropTypes.string,
  /**
   * Object containing token balances in the format address => balance
   */
  tokenBalances: PropTypes.object,
  /**
   * Object containing token exchange rates in the format address => exchangeRate
   */
  tokenExchangeRates: PropTypes.object,
  /**
   * Array of transactions
   */
  transactions: PropTypes.array,
  /**
   * Primary currency, either ETH or Fiat
   */
  primaryCurrency: PropTypes.string,
  /**
   * A bool that represents if the user wants to hide zero balance token
   */
  hideZeroBalanceTokens: PropTypes.bool,
  /**
   * List of tokens from TokenListController
   */
  tokenList: PropTypes.object,
  selectedAddress: PropTypes.string,
  chainId: PropTypes.string,
  toggleAccountsModal: PropTypes.func,
};

const mapStateToProps = (state) => ({
  chainId: state.engine.backgroundState.NetworkController.provider.chainId,
  selectedAddress:
    state.engine.backgroundState.PreferencesController.selectedAddress,
  currentCurrency:
    state.engine.backgroundState.CurrencyRateController.currentCurrency,
  conversionRate:
    state.engine.backgroundState.CurrencyRateController.conversionRate,
  primaryCurrency: state.settings.primaryCurrency,
  tokenBalances:
    state.engine.backgroundState.TokenBalancesController.contractBalances,
  tokenExchangeRates:
    state.engine.backgroundState.TokenRatesController.contractExchangeRates,
  hideZeroBalanceTokens: state.settings.hideZeroBalanceTokens,
  tokenList: getTokenList(state),
  detectedTokens: state.engine.backgroundState.TokensController.detectedTokens,
  isTokenDetectionEnabled:
    state.engine.backgroundState.PreferencesController.useTokenDetection,
});

const mapDispatchToProps = (dispatch) => ({
  updateAccountFiatBalance: (account, fiatBalance) => dispatch(setAccountFiatBalance(account, fiatBalance))
});

export default connect(mapStateToProps, mapDispatchToProps)(Tokens);

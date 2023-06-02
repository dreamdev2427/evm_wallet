import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TouchableOpacity,
  StyleSheet,
  View,
  InteractionManager,
  Image,
} from 'react-native';
import { connect } from 'react-redux';
import axios from 'axios';
import AnalyticsV2 from '../../../util/analyticsV2';
import Web3 from "web3";
import { fontStyles } from '../../../styles/common';
import { strings } from '../../../../locales/i18n';
import Engine from '../../../core/Engine';
import CollectibleContractElement from '../CollectibleContractElement';
import Analytics from '../../../core/Analytics/Analytics';
import { ANALYTICS_EVENT_OPTS } from '../../../util/analytics';
import {
  collectibleContractsSelector,
  collectiblesSelector,
  favoritesCollectiblesSelector,
} from '../../../reducers/collectibles';
import { removeFavoriteCollectible } from '../../../actions/collectibles';
import { setNftDetectionDismissed } from '../../../actions/user';
import Text from '../../Base/Text';
import AppConstants from '../../../core/AppConstants';
import { toLowerCaseEquals } from '../../../util/general';
import { compareTokenIds } from '../../../util/tokens';
import CollectibleDetectionModal from '../CollectibleDetectionModal';
import { isMainNet } from '../../../util/networks';
import { useAppThemeFromContext, mockTheme } from '../../../util/theme';
import Logger from "../../../util/Logger";
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, BSC_NETWORK_ID, HTTP_PROVIDERS, POLYGON_CHAIN_ID, supported4Networks } from '../../../util/swap_config';
import { erc721Abi } from '../../../util/abis/erc721Abi';


const createStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      backgroundColor: colors.background.default,
      flex: 1,
      minHeight: 500,
      marginTop: 16,
    },
    emptyView: {
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10,
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
    footer: {
      flex: 1,
      paddingBottom: 30,
      alignItems: 'center',
      marginTop: 24,
    },
    emptyContainer: {
      flex: 1,
      marginBottom: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyImageContainer: {
      width: 76,
      height: 76,
      marginTop: 30,
      marginBottom: 12,
      tintColor: colors.icon.muted,
    },
    emptyTitleText: {
      fontSize: 24,
      color: colors.text.alternative,
    },
    emptyText: {
      color: colors.text.alternative,
      marginBottom: 8,
      fontSize: 14,
    },
  });

/**
 * View that renders a list of CollectibleContract
 * ERC-721 and ERC-1155
 */
const CollectibleContracts = ({
  selectedAddress,
  chainId,
  navigation,
  collectibleContracts,
  collectibles,
  favoriteCollectibles,
  removeFavoriteCollectible,
  useCollectibleDetection,
  setNftDetectionDismissed,
  nftDetectionDismissed,
  frequentRpcList
}) => {
  const { colors } = useAppThemeFromContext() || mockTheme;
  const styles = createStyles(colors);
  const [isAddNFTEnabled, setIsAddNFTEnabled] = useState(true);
  const [allCollectibles, setAllColltibles] = useState([]);
  const [allCollectibleContracts, setAllCollectibleContracts] = useState([]);

  const getDecimalChainId = (chainId) =>
  {
    if (!chainId || typeof chainId !== 'string' || !chainId.startsWith('0x')) {
      return chainId;
    }
    return parseInt(chainId, 16).toString(10);
  }

  const onSetRpcTarget = async (chainId) => {
    if(supported4Networks[chainId.toString()])
    {
      const { NetworkController, CurrencyRateController } = Engine.context;
      let rpcUrl = supported4Networks[chainId.toString()].rpcUrl;
      let decimalChainId = getDecimalChainId(chainId);
      let ticker =supported4Networks[chainId.toString()].ticker;
      let nickname = supported4Networks[chainId.toString()].networkName;
      let blockExplorerUrl = supported4Networks[chainId.toString()].blockExplorerUrl;

      CurrencyRateController.setNativeCurrency(ticker);
      await NetworkController.setRpcTarget(rpcUrl, decimalChainId, ticker, nickname);

      AnalyticsV2.trackEvent(AnalyticsV2.ANALYTICS_EVENTS.NETWORK_SWITCHED, {
        rpc_url: rpcUrl,
        chain_id: decimalChainId,
        source: 'Settings',
        symbol: ticker,
        block_explorer_url: blockExplorerUrl,
        network_name: 'rpc',
      });
    }
  };

  const onItemPress = useCallback(
    (collectible, contractName) => {
      onSetRpcTarget(collectible.chainId);
      const { CollectiblesController } = Engine.context;
      const { address, tokenId } = collectible;
      CollectiblesController.addCollectible(address, String(tokenId));
      navigation.navigate('CollectiblesDetails', { collectible, contractName });
    },
    [navigation],
  );

  /**
   *  Method to check the token id data type of the current collectibles.
   *
   * @param collectible - Collectible object.
   * @returns Boolean indicating if the collectible should be updated.
   */
  const shouldUpdateCollectibleMetadata = (collectible) =>
    typeof collectible.tokenId === 'number';

  /**
   * Method to updated collectible and avoid backwards compatibility issues.
   * @param address - Collectible address.
   * @param tokenId - Collectible token ID.
   */
  const updateCollectibleMetadata = (collectible) => {
    const { CollectiblesController } = Engine.context;
    const { address, tokenId } = collectible;
    CollectiblesController.removeCollectible(address, tokenId);
    if (String(tokenId).includes('e+')) {
      removeFavoriteCollectible(selectedAddress, chainId, collectible);
    } else {
      CollectiblesController.addCollectible(address, String(tokenId));
    }
  };


  useEffect(() => {

    const fetchNFTs = async (currentChainId) => {

      setAllColltibles([]);
      setAllCollectibleContracts([]);
      let temp = [], temp1 = [];
      let chainId = BSC_CHAIN_ID;
      try {
        let requestURL = `https://deep-index.moralis.io/api/v2/${selectedAddress}/nft/?chain=${chainId}`;

        let response = await axios.get(requestURL, {
          headers: { "X-API-Key": "E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3" },
        });

        let fetchedTokens = response.data.result;
        if (fetchedTokens.length > 0) {
          let tempERC721Tokens = [];
          fetchedTokens.map((item) => {
            if (item.contract_type === "ERC721") {
              tempERC721Tokens.push(item);
            }
          });

          let provider = new Web3.providers.HttpProvider(HTTP_PROVIDERS[chainId.toString()]);
          let web3 = new Web3(provider);

          for (let idx = 0; idx < tempERC721Tokens.length; idx++) {
            let tokenId = tempERC721Tokens[idx].token_id;
            let tokenAddress = tempERC721Tokens[idx].token_address;
            let tokenName = tempERC721Tokens[idx].name;
            let tokenSymbol = tempERC721Tokens[idx].symbol;

            let tokenContractInstance = new web3.eth.Contract(erc721Abi, tokenAddress);
            try {
              let tokenURI = await tokenContractInstance.methods.tokenURI(tokenId).call();

              let tokenMetadata = await axios.get(tokenURI);
              if (tokenMetadata.data) {
                var newObj = {
                  address: tokenAddress,
                  description: tokenMetadata.data.description || null,
                  favorite: false,
                  image: tokenMetadata.data.image || null,
                  isCurrentlyOwned: true,
                  name: tokenName || "",
                  standard: "ERC721",
                  tokenId: tokenId.toString(),
                  chainId
                };
                temp1.push(newObj);
                temp.push({
                  address: tokenAddress,
                  name: tokenName || "",
                  symbol: tokenSymbol || "",
                  tokenId: tokenId.toString()
                });
              }
            } catch (e) {
              Logger.log("[CollectibleContracts.js] fetch metadata error: ", e);
            }
      }
          setAllColltibles(temp1);
          setAllCollectibleContracts(temp);
        }
      } catch (error) {
        Logger.log("[CollectibleContracts.js] fetching NFTs error: ", error);
      }
      chainId = AVALANCHE_CHAIN_ID;
      try {
        let requestURL = `https://deep-index.moralis.io/api/v2/${selectedAddress}/nft/?chain=${chainId}`;

        let response = await axios.get(requestURL, {
          headers: { "X-API-Key": "E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3" },
        });

        let fetchedTokens = response.data.result;
        if (fetchedTokens.length > 0) {
          let tempERC721Tokens = [];
          fetchedTokens.map((item) => {
            if (item.contract_type === "ERC721") {
              tempERC721Tokens.push(item);
            }
          });

          let provider = new Web3.providers.HttpProvider(HTTP_PROVIDERS[chainId.toString()]);
          let web3 = new Web3(provider);

          for (let idx = 0; idx < tempERC721Tokens.length; idx++) {
            let tokenId = tempERC721Tokens[idx].token_id;
            let tokenAddress = tempERC721Tokens[idx].token_address;
            let tokenName = tempERC721Tokens[idx].name;
            let tokenSymbol = tempERC721Tokens[idx].symbol;

            let tokenContractInstance = new web3.eth.Contract(erc721Abi, tokenAddress);
            try {
              let tokenURI = await tokenContractInstance.methods.tokenURI(tokenId).call();

              let tokenMetadata = await axios.get(tokenURI);
              if (tokenMetadata.data) {

                var newObj = {
                  address: tokenAddress,
                  description: tokenMetadata.data.description || null,
                  favorite: false,
                  image: tokenMetadata.data.image || null,
                  isCurrentlyOwned: true,
                  name: tokenName || "",
                  standard: "ERC721",
                  tokenId: tokenId.toString(),
                  chainId
                };
                temp1.push(newObj);
                temp.push({
                  address: tokenAddress,
                  name: tokenName || "",
                  symbol: tokenSymbol || "",
                  tokenId: tokenId.toString()
                });
              }
            } catch (e) {
              Logger.log("[CollectibleContracts.js] fetch metadata error: ", e);
            }
          }
          setAllColltibles(temp1);
          setAllCollectibleContracts(temp);
        }
      } catch (error) {
        Logger.log("[CollectibleContracts.js] fetching NFTs error: ", error);
      }
      chainId = POLYGON_CHAIN_ID;
      try {
        let requestURL = `https://deep-index.moralis.io/api/v2/${selectedAddress}/nft/?chain=${chainId}`;

        let response = await axios.get(requestURL, {
          headers: { "X-API-Key": "E6R13cn5GmpRzCNwefYdeHPAbZlV69kIk9vp0rfhhajligQES1WwpWAKxqr7X2J3" },
        });

        let fetchedTokens = response.data.result;
        if (fetchedTokens.length > 0) {
          let tempERC721Tokens = [];
          fetchedTokens.map((item) => {
            if (item.contract_type === "ERC721") {
              tempERC721Tokens.push(item);
            }
    });

          let provider = new Web3.providers.HttpProvider(HTTP_PROVIDERS[chainId.toString()]);
          let web3 = new Web3(provider);

          for (let idx = 0; idx < tempERC721Tokens.length; idx++) {
            let tokenId = tempERC721Tokens[idx].token_id;
            let tokenAddress = tempERC721Tokens[idx].token_address;
            let tokenName = tempERC721Tokens[idx].name;
            let tokenSymbol = tempERC721Tokens[idx].symbol;

            let tokenContractInstance = new web3.eth.Contract(erc721Abi, tokenAddress);
            try {
              let tokenURI = await tokenContractInstance.methods.tokenURI(tokenId).call();

              let tokenMetadata = await axios.get(tokenURI);
              if (tokenMetadata.data) {

                var newObj = {
                  address: tokenAddress,
                  description: tokenMetadata.data.description || null,
                  favorite: false,
                  image: tokenMetadata.data.image || null,
                  isCurrentlyOwned: true,
                  name: tokenName || "",
                  standard: "ERC721",
                  tokenId: tokenId.toString(),
                  chainId
                };
                temp1.push(newObj);
                temp.push({
                  address: tokenAddress,
                  name: tokenName || "",
                  symbol: tokenSymbol || "",
                  tokenId: tokenId.toString()
  });
              }
            } catch (e) {
              Logger.log("[CollectibleContracts.js] fetch metadata error: ", e);
            }
          }
          setAllColltibles(temp1);
          setAllCollectibleContracts(temp);
        }
        await onSetRpcTarget(currentChainId);
      } catch (error) {
        Logger.log("[CollectibleContracts.js] fetching NFTs error: ", error);
      }
    }
    fetchNFTs(chainId);

  }, [selectedAddress]);

  const goToAddCollectible = () => {
    setIsAddNFTEnabled(false);
    navigation.push('AddAsset', { assetType: 'collectible' });
    InteractionManager.runAfterInteractions(() => {
      Analytics.trackEvent(ANALYTICS_EVENT_OPTS.WALLET_ADD_COLLECTIBLES);
      setIsAddNFTEnabled(true);
    });
  };

  const renderFooter = () => (
    <View style={styles.footer} key={'collectible-contracts-footer'}>
      <Text style={styles.emptyText}>{strings('wallet.no_collectibles')}</Text>
      <TouchableOpacity
        style={styles.add}
        onPress={goToAddCollectible}
        disabled={!isAddNFTEnabled}
        testID={'add-collectible-button'}
      >
        <Text style={styles.addText}>{strings('wallet.add_collectibles')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderCollectibleContract = useCallback(
    (item, index) => {
      const contractCollectibles = allCollectibles?.filter((collectible) =>
        toLowerCaseEquals(collectible.address, item.address) && (collectible.tokenId === item.tokenId)
      );

      return (
        <CollectibleContractElement
          onPress={onItemPress}
          asset={item}
          key={item.address + item.tokenId}
          contractCollectibles={contractCollectibles}
          collectiblesVisible={index === 0}
        />
      );
    },
    [allCollectibles, onItemPress],
  );

  const renderFavoriteCollectibles = useCallback(() => {
    const filteredCollectibles = favoriteCollectibles.map((collectible) =>
      allCollectibles.find(
        ({ tokenId, address }) =>
          compareTokenIds(collectible.tokenId, tokenId) &&
          collectible.address === address,
      ),
    );


    return (
      Boolean(filteredCollectibles.length) && (
        <CollectibleContractElement
          onPress={onItemPress}
          asset={{ name: 'Favorites', favorites: true }}
          key={'Favorites'}
          contractCollectibles={filteredCollectibles}
          collectiblesVisible
        />
      )
    );
  }, [favoriteCollectibles, allCollectibles, onItemPress]);

  const renderList = useCallback(
    () => (
      <View>
        {renderFavoriteCollectibles()}
        <View>
          {
            allCollectibleContracts?.map((item, index) =>
              renderCollectibleContract(item, index)
            )
          }
        </View>
      </View>
    ),
    [
      allCollectibleContracts,
      renderFavoriteCollectibles,
      renderCollectibleContract,
    ],
  );

  const goToLearnMore = () =>
    navigation.navigate('Webview', {
      screen: 'SimpleWebview',
      params: { url: AppConstants.URLS.NFT },
    });

  const dismissNftInfo = async () => {
    setNftDetectionDismissed(true);
  };

  const renderEmpty = () => (
    <View style={styles.emptyView}>
      <View style={styles.emptyContainer}>
        <Image
          style={styles.emptyImageContainer}
          source={require('../../../images/no-nfts-placeholder.png')}
          resizeMode={'contain'}
        />
        <Text center style={styles.emptyTitleText} bold>
          {strings('wallet.no_nfts_yet')}
        </Text>
        <Text center big link onPress={goToLearnMore}>
          {strings('wallet.learn_more')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.wrapper} testID={'collectible-contracts'}>
      {isMainNet(chainId) &&
        !nftDetectionDismissed &&
        !useCollectibleDetection && (
          <View style={styles.emptyView}>
            <CollectibleDetectionModal
              onDismiss={dismissNftInfo}
              navigation={navigation}
            />
          </View>
        )}
      {allCollectibleContracts.length > 0 ? renderList() : renderEmpty()}
      {renderFooter()}
    </View>
  );
};

CollectibleContracts.propTypes = {
  /**
   * Chain id
   */
  chainId: PropTypes.string,
  /**
   * Selected address
   */
  selectedAddress: PropTypes.string,
  /**
   * Array of collectibleContract objects
   */
  collectibleContracts: PropTypes.array,
  /**
   * Array of collectibles objects
   */
  collectibles: PropTypes.array,
  /**
   * Navigation object required to push
   * the Asset detail view
   */
  navigation: PropTypes.object,
  /**
   * A list of custom RPCs to provide the user
   */
  frequentRpcList: PropTypes.array,
  /**
   * NetworkController povider object
   */
  provider: PropTypes.object,
  /**
   * Object of collectibles
   */
  favoriteCollectibles: PropTypes.array,
  /**
   * Dispatch remove collectible from favorites action
   */
  removeFavoriteCollectible: PropTypes.func,
  /**
   * Boolean to show if NFT detection is enabled
   */
  useCollectibleDetection: PropTypes.bool,
  /**
   * Setter for NFT detection state
   */
  setNftDetectionDismissed: PropTypes.func,
  /**
   * State to manage display of modal
   */
  nftDetectionDismissed: PropTypes.bool,
};

const mapStateToProps = (state) => ({
  chainId: state.engine.backgroundState.NetworkController.provider.chainId,
  selectedAddress:
    state.engine.backgroundState.PreferencesController.selectedAddress,
  useCollectibleDetection:
    state.engine.backgroundState.PreferencesController.useCollectibleDetection,
  nftDetectionDismissed: state.user.nftDetectionDismissed,
  collectibleContracts: collectibleContractsSelector(state),
  collectibles: collectiblesSelector(state),
  favoriteCollectibles: favoritesCollectiblesSelector(state),
  provider: state.engine.backgroundState.NetworkController.provider,
  frequentRpcList:
    state.engine.backgroundState.PreferencesController.frequentRpcList,
});

const mapDispatchToProps = (dispatch) => ({
  removeFavoriteCollectible: (selectedAddress, chainId, collectible) =>
    dispatch(removeFavoriteCollectible(selectedAddress, chainId, collectible)),
  setNftDetectionDismissed: () => dispatch(setNftDetectionDismissed()),
});

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(CollectibleContracts);

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useParams } from 'react-router-dom';
import { useTokenTracker } from '../../hooks/useTokenTracker';
import CollectibleDetails from '../../components/app/collectible-details/collectible-details';
import { getTokens } from '../../ducks/metamask/metamask';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { isEqualCaseInsensitive } from '../../helpers/utils/util';
import { getCurrentChainId, getERC20TokensWithBalances, getERC721Collections, getTotalERC721TokenList } from '../../selectors';

import NativeAsset from './components/native-asset';
import TokenAsset from './components/token-asset';
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, POLYGON_CHAIN_ID } from '../../../shared/constants/network';
import { setDisplayCertainTokenPrice } from '../../store/actions';

const Asset = () => {
  const nativeCurrency = useSelector((state) => state.metamask.nativeCurrency);
  const chainId = useSelector(getCurrentChainId);
  const tokens = useSelector(getTokens);
  const dispatch = useDispatch();
  const isConsideringChain = (chainId === AVALANCHE_CHAIN_ID || chainId === BSC_CHAIN_ID || chainId === POLYGON_CHAIN_ID || chainId === MAINNET_CHAIN_ID || chainId === FANTOM_CHAIN_ID)? true : false;
  const tokensWithBalances = isConsideringChain === true? 
    useSelector(getERC20TokensWithBalances)
    :
    useTokenTracker(tokens);
    
  const collectibles = useSelector(getTotalERC721TokenList);

  const { asset, id } = useParams();

  const token = isConsideringChain === true? 
    tokensWithBalances.find(item => isEqualCaseInsensitive(item.address, asset))
    :
    tokens.find(({ address }) =>
      isEqualCaseInsensitive(address, asset),
    );

  const collectible = collectibles[asset] && collectibles[asset].collectibles? collectibles[asset].collectibles.find(item => id === item.tokenId) : null;
   
  useEffect(() => {
    const el = document.querySelector('.app');
    el.scroll(0, 0);
    dispatch(setDisplayCertainTokenPrice(false));
  }, []);

  useEffect(() => 
  {
    if(token || asset === nativeCurrency)
    {      
      dispatch(setDisplayCertainTokenPrice(true));
    }
  }, [token])

  let content;
  if (collectible) { 
    content = <CollectibleDetails collectible={collectible} />;
  } else if (token) {
    content = <TokenAsset token={token} />;
  } else if (asset === nativeCurrency) { 
    content = <NativeAsset nativeCurrency={nativeCurrency} />;
  } else { 
    content = <Redirect to={{ pathname: DEFAULT_ROUTE }} />;   
  }
  
  return <div className="main-container asset__container">{content}</div>;
};

export default Asset;

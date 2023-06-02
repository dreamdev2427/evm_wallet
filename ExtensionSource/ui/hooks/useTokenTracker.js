import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Web3 from "web3";
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { getSelectedAddress, getTotalNetworths, getERC20TokensWithBalances } from '../selectors';
// import { SECOND } from '../../shared/constants/time';
// import { isEqualCaseInsensitive } from '../helpers/utils/util';
// import { useEqualityCheck } from './useEqualityCheck';
import { calcTokenAmount } from '../helpers/utils/token-util';
import { updateERC20TokenLists, updateNativeBalance, updateNativeCurrencyUSDRate, updateNetWorthOnUSD, updateTotalNetWorths } from '../store/actions';
import { usePrevious } from './usePrevious';
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, POLYGON_CHAIN_ID,  } from '../../shared/constants/network';
import { COINGEKCO_NETWORK_ID, HTTP_PROVIDERS, WRAPPED_CURRENCY_ADDRESSES, backendForMoralisURL } from '../ducks/swaps/swap_config';

export function useTokenTracker(
  tokens,
  includeFailedTokens = false,
  hideZeroBalanceTokens = true,
) {
  const userAddress = useSelector(getSelectedAddress, shallowEqual);
  const previousUserAddress = usePrevious(userAddress);
  const [loading, setLoading] = useState(() => tokens?.length >= 0);
  const [tokensWithBalances, setTokensWithBalances] = useState([]);
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const dispatch = useDispatch();    
  
  const avaxBalance = useSelector(state => state.metamask.nativeBalance[AVALANCHE_CHAIN_ID]);
  const previousAvaxBalance = usePrevious(avaxBalance);
  
  const bnbBalance = useSelector(state => state.metamask.nativeBalance[BSC_CHAIN_ID]);
  const previousBnbBalance = usePrevious(bnbBalance);
  
  const maticBalance = useSelector(state => state.metamask.nativeBalance[POLYGON_CHAIN_ID]);
  const previousMaticBalance = usePrevious(maticBalance);
  
  const ftmBalance = useSelector(state => state.metamask.nativeBalance[FANTOM_CHAIN_ID]);
  const previousFtmBalance = usePrevious(ftmBalance);

  const totalNetworth = useSelector(getTotalNetworths, shallowEqual);
  const previousTotalNetworth = usePrevious(totalNetworth);

  const avalancheTokenList = useSelector(state => getERC20TokensWithBalances(state, AVALANCHE_CHAIN_ID), shallowEqual);
  const prevAvalancheTokenList = usePrevious(avalancheTokenList);

  const binanceTokenList = useSelector(state => getERC20TokensWithBalances(state, BSC_CHAIN_ID), shallowEqual);
  const prevBinanceTokenList = usePrevious(binanceTokenList);
  
  const polygonTokenList = useSelector(state => getERC20TokensWithBalances(state, POLYGON_CHAIN_ID), shallowEqual);
  const prevPolygonTokenList = usePrevious(polygonTokenList);

  const famtomTokenList = useSelector(state => getERC20TokensWithBalances(state, FANTOM_CHAIN_ID), shallowEqual);
  const prevFantomTokenList = usePrevious(famtomTokenList);

  const useInterval = (callback, delay) => {
    const savedCallback = useRef();
  
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    useEffect(() => {
      const tick = () => {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  };
  
  const fetchOneNativeBalance = async (chainId) => {
    let consideringPreviousBalance = 0;
    switch(chainId)
    {
      default: consideringPreviousBalance = 0; break;
      case AVALANCHE_CHAIN_ID: consideringPreviousBalance = previousAvaxBalance; break;
      case BSC_CHAIN_ID: consideringPreviousBalance = previousBnbBalance; break;
      case POLYGON_CHAIN_ID: consideringPreviousBalance = previousMaticBalance; break;
      case FANTOM_CHAIN_ID: consideringPreviousBalance = previousFtmBalance; break;
    }
    try{          
      let provider = new Web3.providers.HttpProvider(HTTP_PROVIDERS[chainId]);
      let web3 = new Web3(provider);
      let data = await web3.eth.getBalance(userAddress);
      let amount = Number(calcTokenAmount(Number(data), 18));

      if (amount !== consideringPreviousBalance) 
      {     
        let usdRate = 0;    
        let wAddr = WRAPPED_CURRENCY_ADDRESSES[chainId];

        var tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${wAddr}&vs_currencies=usd`, {});
        
        if(tokenPriceData.data[wAddr.toString().toLowerCase()].usd)
        {             
          usdRate = tokenPriceData.data[wAddr.toString().toLowerCase()].usd;
          dispatch(updateNativeCurrencyUSDRate(chainId, tokenPriceData.data[wAddr.toString().toLowerCase()].usd));
        }

        let previousNetworth = Number(usdRate) * consideringPreviousBalance;
        let netWorth = Number(usdRate) * amount;    
        dispatch(updateTotalNetWorths(Number(totalNetworth) + Number(netWorth) - Number(previousNetworth)));
        dispatch(updateNativeBalance(chainId, amount));
      }
    }catch(e)
    {  
    }
  }

  const fetchOneNetworkTokens = async (chainId) => {
    let tempConsideringTokenList = [];
    switch(chainId)
    {
      default: return;
      case AVALANCHE_CHAIN_ID: tempConsideringTokenList = prevAvalancheTokenList; break;
      case BSC_CHAIN_ID: tempConsideringTokenList = prevBinanceTokenList; break;
      case POLYGON_CHAIN_ID: tempConsideringTokenList = prevPolygonTokenList; break;
      case FANTOM_CHAIN_ID: tempConsideringTokenList = prevFantomTokenList; break;
    }    
    try{
      let tokensForUpdate = [];  
      let totalNetworth = previousTotalNetworth;
      let tempTokensWithBalances = tokensWithBalances;
      const responseFromMoralis =  await axios({
          method: "post",
          url: `${backendForMoralisURL}/api/handover/erc20`,
          data: {
            userAddress: userAddress,
            chainId: chainId
          }
      });

      if (responseFromMoralis.data && responseFromMoralis.data.length>0 && tempConsideringTokenList.length>0) 
      {
        let catchedList = responseFromMoralis.data || [];        

        catchedList.map((token) => {
          const found = tempConsideringTokenList.find(el => el.address.toString().toLowerCase() === token.token_address.toString().toLowerCase());
          if (!found)
          { 
            tokensForUpdate.push({ 
              address: token.token_address,
              balance: token.balance,
              prevBalance: 0, 
              balanceError: null,
              decimals: token.decimals,
              image: token.logo || token.thumbnail,
              isERC721: false,
              string: cutUnderpointNumber(calcTokenAmount(token.balance, token.decimals).toString(), 2),
              symbol: token.symbol,
              usdPrice: 0,
              name: token.name,
              chainId: chainId
            });
          }
          else{
            if(found.balance !== token.balance)
            {              
              tokensForUpdate.push({ 
                address: token.token_address,
                balance: token.balance,
                prevBalance: found.balance,
                balanceError: null,
                decimals: token.decimals,
                image: token.logo || token.thumbnail,
                isERC721: false,
                string: cutUnderpointNumber(calcTokenAmount(token.balance, token.decimals).toString(), 2),
                symbol: token.symbol,
                usdPrice: 0,
                name: token.name,
                chainId: chainId
              });
            }
          }
        });
        
        for(let idx = 0; idx<tokensForUpdate.length; idx++)
        {
          let tokenAmount = Number(calcTokenAmount(tokensForUpdate[idx].balance, tokensForUpdate[idx].decimals).toString());
          let tokenPrevAmount = Number(calcTokenAmount(tokensForUpdate[idx].prevBalance, tokensForUpdate[idx].decimals).toString());
          
          let indxInToalList = tempTokensWithBalances.findIndex(v => v.address === tokensForUpdate[idx].address);

          let indx = tempConsideringTokenList.findIndex(v => v.address === tokensForUpdate[idx].address);
          tempConsideringTokenList.splice(indx, indx >= 0 ? 1 : 0);

          try{
            const tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${tokensForUpdate[idx].address}&vs_currencies=usd`, {});              
            
            if(tokenPriceData.data[tokensForUpdate[idx].address].usd)
            { 
              tokensForUpdate[idx].usdPrice = (Number(tokenPriceData.data[tokensForUpdate[idx].address].usd) * tokenAmount).toFixed(2);
              totalNetworth += ( Number(tokenPriceData.data[tokensForUpdate[idx].address].usd) * tokenAmount - 
                Number(tokenPriceData.data[tokensForUpdate[idx].address].usd) * tokenPrevAmount );

              dispatch(updateTotalNetWorths(totalNetworth));
            }else{
              tokensForUpdate[idx].usdPrice = 0;
            }
            delete tokensForUpdate[idx].prevBalance;
            if(indxInToalList >= 0) {
              tempTokensWithBalances[indxInToalList] = tokensForUpdate[idx];
              setTokensWithBalances(tempTokensWithBalances);
            }
            else setTokensWithBalances([...tempTokensWithBalances, tokensForUpdate[idx] ]);            
            dispatch(updateERC20TokenLists(chainId, [...tempConsideringTokenList, tokensForUpdate[idx] ] ));
          }catch(error) {

            tokensForUpdate[idx].usdPrice = 0;   

            delete tokensForUpdate[idx].prevBalance;
            if(indxInToalList >= 0) {
              tempTokensWithBalances[indxInToalList] = tokensForUpdate[idx];
              setTokensWithBalances(tempTokensWithBalances);
            }
            else setTokensWithBalances([...tempTokensWithBalances, tokensForUpdate[idx] ]);
            dispatch(updateERC20TokenLists(chainId, [...tempConsideringTokenList, tokensForUpdate[idx] ]));
          }
        }        
      }
    }catch(e)
    {      
    }
  }

  const fetchNativeBalances  = async () => {

    await fetchOneNativeBalance(AVALANCHE_CHAIN_ID);
    await fetchOneNativeBalance(BSC_CHAIN_ID);
    await fetchOneNativeBalance(POLYGON_CHAIN_ID);
    await fetchOneNativeBalance(FANTOM_CHAIN_ID);

    await fetchOneNetworkTokens(AVALANCHE_CHAIN_ID);
    await fetchOneNetworkTokens(BSC_CHAIN_ID);
    await fetchOneNetworkTokens(POLYGON_CHAIN_ID);
    await fetchOneNetworkTokens(FANTOM_CHAIN_ID);
  }

  useInterval(() => {
    setSeconds(seconds + 1);
        
    fetchNativeBalances();
  }, 10000);

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

  // Effect to set loading state and initialize tracker when values change
  useEffect(() => {
    // This effect will only run initially and when:
    // 1. chainId is updated,
    // 2. userAddress is changed,
    // 3. token list is updated and not equal to previous list
    // in any of these scenarios, we should indicate to the user that their token
    // values are in the process of updating by setting loading state.

    let totalNetworth = 0;
    let allTokens = [];

    if(previousUserAddress !== userAddress)
    {
      allTokens = [];
      totalNetworth = 0; 
      setTokensWithBalances([]);
    }

    setLoading(true);

    const fetchNativeCurrenciesAndTokens = async (chainId) => {      
      try {
        let netWorth = 0;
        let usdRate = 0;    
        let wAddr = WRAPPED_CURRENCY_ADDRESSES[chainId];        

        try{          
          let provider = new Web3.providers.HttpProvider(HTTP_PROVIDERS[chainId]);
          let web3 = new Web3(provider);
          let data = await web3.eth.getBalance(userAddress);
          
          if (data) {
            
            var tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${wAddr}&vs_currencies=usd`, {});
            
            if(tokenPriceData.data[wAddr.toString().toLowerCase()].usd)
            {             
              usdRate = tokenPriceData.data[wAddr.toString().toLowerCase()].usd;
              dispatch(updateNativeCurrencyUSDRate(chainId, tokenPriceData.data[wAddr.toString().toLowerCase()].usd));
            }

            netWorth = Number(usdRate) * Number(calcTokenAmount(Number(data), 18).toString());    
            totalNetworth += netWorth;
            dispatch(updateNativeBalance(chainId, Number(calcTokenAmount(Number(data), 18))));
          }
        }catch(e)
        {
        }

        let tokens = [];  
        const responseFromMoralis =  await axios({
          method: "post",
          url: `${backendForMoralisURL}/api/handover/erc20`,
          data: {
            userAddress: userAddress,
            chainId: chainId
          }
      });

        if (responseFromMoralis.data && responseFromMoralis.data.length>0) 
        {
          responseFromMoralis.data.forEach((token) => {
            tokens.push({
              address: token.token_address,
              balance: token.balance,
              balanceError: null,
              decimals: token.decimals,
              image: token.logo || token.thumbnail,
              isERC721: false,
              string: cutUnderpointNumber(calcTokenAmount(token.balance, token.decimals).toString(), 2),
              symbol: token.symbol,
              usdPrice: 0,
              name: token.name,
              chainId: chainId
            });
          });

          dispatch(updateERC20TokenLists(chainId, tokens));
          
          for(let idx = 0; idx<tokens.length; idx++)
          {
            let tokenAmount = Number(calcTokenAmount(tokens[idx].balance, tokens[idx].decimals).toString());
            try{
              const tokenPriceData = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/${COINGEKCO_NETWORK_ID[chainId]}?contract_addresses=${tokens[idx].address}&vs_currencies=usd`, {});              
             
              if(tokenPriceData.data[tokens[idx].address].usd)
              { 
                tokens[idx].usdPrice = (Number(tokenPriceData.data[tokens[idx].address].usd) * tokenAmount).toFixed(2);
                netWorth += Number(tokenPriceData.data[tokens[idx].address].usd) * tokenAmount;       
                totalNetworth += Number(tokenPriceData.data[tokens[idx].address].usd) * tokenAmount;
                dispatch(updateTotalNetWorths(totalNetworth));
                dispatch(updateNetWorthOnUSD(chainId, netWorth));
              }else{
                tokens[idx].usdPrice = 0;
              }
              allTokens = allTokens.concat(tokens[idx]); 
              dispatch(updateERC20TokenLists(chainId, tokens));
              setTokensWithBalances(allTokens);
            }catch(error) {
              tokens[idx].usdPrice = 0;   
              allTokens = allTokens.concat(tokens[idx]); 
              dispatch(updateERC20TokenLists(chainId, tokens));
              setTokensWithBalances(allTokens);
            }
          }
          
          setError(null);
          setLoading(false);

        }
      } catch (error) {
      }
    }

    const fetchTokens = async () => {
      await fetchNativeCurrenciesAndTokens(AVALANCHE_CHAIN_ID);
      await fetchNativeCurrenciesAndTokens(BSC_CHAIN_ID);
      await fetchNativeCurrenciesAndTokens(POLYGON_CHAIN_ID);
      await fetchNativeCurrenciesAndTokens(FANTOM_CHAIN_ID);
    }

    fetchTokens();

  }, [
    userAddress,
  ]);

  return { loading, tokensWithBalances, error };
}

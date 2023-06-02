import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import Web3 from 'web3';
import { isEqual } from 'lodash';
import {
  getCollectibles,
  getCollectibleContracts,
} from '../ducks/metamask/metamask';
import { getCurrentChainId, getSelectedAddress } from '../selectors';
import { usePrevious } from './usePrevious';
import { erc721Abi } from "./erc721Abi";
import { backendForMoralisURL, HTTP_PROVIDERS } from '../ducks/swaps/swap_config';
import { updateERC721TokenLists, updateTotalERC721TokenLists } from '../store/actions';
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, POLYGON_CHAIN_ID } from '../../shared/constants/network';

export function useCollectiblesCollections() {
  const [collections, setCollections] = useState({});
  const [previouslyOwnedCollection, setPreviouslyOwnedCollection] = useState({
    collectionName: 'Previously Owned',
    collectibles: [],
  });
  const collectibles = useSelector(getCollectibles);
  const [collectiblesLoading, setCollectiblesLoading] = useState(
    () => collectibles?.length >= 0,
  );
  const selectedAddress = useSelector(getSelectedAddress);
  const chainId = useSelector(getCurrentChainId);
  const collectibleContracts = useSelector(getCollectibleContracts);
  const prevCollectibles = usePrevious(collectibles);
  const prevChainId = usePrevious(chainId);
  const prevSelectedAddress = usePrevious(selectedAddress);
  const dispatch = useDispatch();

  useEffect(() => {

    var allNFTTokens = {};

    const fetchNFTs = async (chainId) => {
      try {
        const responseFromMoralis =  await axios({
            method: "post",
            url: `${backendForMoralisURL}/api/handover/nft`,
            data: {
              userAddress: selectedAddress,
              chainId: chainId
            }
        });

        var fetchedTokens = responseFromMoralis.data.result;
        if (fetchedTokens?.length > 0) {
          var tempERC721Tokens = [];
          fetchedTokens.map((item) => {
            if (item.contract_type === "ERC721") {
              tempERC721Tokens.push(item);
            }
          });

          var provider = new Web3.providers.HttpProvider(HTTP_PROVIDERS[chainId]);
          var web3 = new Web3(provider);
          var MyContract = web3.eth.contract(erc721Abi);

          let tempNewCollections = {};

          for (let idx = 0; idx < tempERC721Tokens.length; idx++) 
          {
            let tokenId = tempERC721Tokens[idx].token_id;
            let tokenAddress = tempERC721Tokens[idx].token_address;
            let tokenContractInstance = MyContract.at(tokenAddress);
            let tokenURI = await tokenContractInstance.tokenURI(tokenId);
            
            axios.get(tokenURI).then(async (tokenMetadata) => 
            {
              if (!tempNewCollections[tokenAddress]) 
              {
                const name = await tokenContractInstance.name();

                  tempNewCollections = {
                    ...tempNewCollections,
                    [tokenAddress]: {
                      collectionName: name,
                      collectionImage: null,
                      collectionChainId: chainId,
                      collectibles: []
                    }
                  }
              }
              tempNewCollections[tokenAddress].collectibles.push({
                address: tokenAddress,
                description: tokenMetadata.data.description || null,
                favorite: false,
                image: tokenMetadata.data.image || null,
                isCurrentlyOwned: true,
                name: "#" + tokenId,
                standard: "ERC721",
                tokenId: tokenId.toString(),
                chainId
              });
              setCollections(tempNewCollections);
              dispatch(updateERC721TokenLists(chainId, tempNewCollections));
              allNFTTokens = {
                ...allNFTTokens,
                ...tempNewCollections
              }
              dispatch(updateTotalERC721TokenLists(allNFTTokens));
            }).catch(error => {
              console.log("[useCollectiblesCollectibles.js] fetch metadata error: ", error);
            })
          }

        }
      } catch (error) {
        console.log("[useCollectiblesCollectibles.js] fetchNFTs error: ", error);
      }
    }

    function timer(time, chainId) { 
      return new Promise((resolve, reject) => setTimeout(() => resolve(fetchNFTs(chainId)), time), null);
    }

    const getCollections = () => {

      setCollectiblesLoading(true);
      if (selectedAddress === undefined || chainId === undefined) {
        return;
      }
      // const newCollections = {};
      const newPreviouslyOwnedCollections = {
        collectionName: 'Previously Owned',
        collectibles: [],
      };

      timer(100, AVALANCHE_CHAIN_ID);  //added by CrystalBlockDev
      timer(200, POLYGON_CHAIN_ID);  //added by CrystalBlockDev
      timer(300, BSC_CHAIN_ID);  //added by CrystalBlockDev
      timer(400, FANTOM_CHAIN_ID);  //added by CrystalBlockDev

      setPreviouslyOwnedCollection(newPreviouslyOwnedCollections);
      setCollectiblesLoading(false);
    };

    if (
      !isEqual(prevCollectibles, collectibles) ||
      !isEqual(prevSelectedAddress, selectedAddress) ||
      !isEqual(prevChainId, chainId)
    ) {
      getCollections();
    }
  }, [
    collectibles,
    prevCollectibles,
    collectibleContracts,
    setCollectiblesLoading,
    chainId,
    prevChainId,
    selectedAddress,
    prevSelectedAddress,
  ]);

  return { collectiblesLoading, collections, previouslyOwnedCollection };
}

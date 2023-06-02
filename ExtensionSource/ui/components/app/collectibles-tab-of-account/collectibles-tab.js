import React, {useEffect} from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
// import axios from 'axios';
import Box from '../../ui/box';
import Button from '../../ui/button';
import Typography from '../../ui/typography/typography';
import CollectiblesDetectionNotice from '../collectibles-detection-notice';
import CollectiblesItems from '../collectibles-items-of-account';
import {
  COLORS,
  TYPOGRAPHY,
  TEXT_ALIGN,
  JUSTIFY_CONTENT,
  FLEX_DIRECTION,
  FONT_WEIGHT,
  ALIGN_ITEMS,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCollectiblesDetectionNoticeDismissed } from '../../../ducks/metamask/metamask';
import { getIsMainnet, getUseCollectibleDetection, getSelectedAddress, getCurrentChainId } from '../../../selectors';
import { EXPERIMENTAL_ROUTE } from '../../../helpers/constants/routes';
import {
  checkAndUpdateAllCollectiblesOwnershipStatus,
  detectCollectibles,
} from '../../../store/actions';
import { useCollectiblesCollections } from '../../../hooks/useCollectiblesCollections-of-account';
import { detectNewTokens } from '../../../store/actions';

export default function CollectiblesTab({ onAddNFT }) {
  const useCollectibleDetection = useSelector(getUseCollectibleDetection);
  const selectedAddress = useSelector(getSelectedAddress);
  const chainId = useSelector(getCurrentChainId);
  const isMainnet = useSelector(getIsMainnet);
  const collectibleDetectionNoticeDismissed = useSelector(
    getCollectiblesDetectionNoticeDismissed,
  );
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const {
    collectiblesLoading,
    collections,
    previouslyOwnedCollection,
  } = useCollectiblesCollections();

  const onEnableAutoDetect = () => {
    history.push(EXPERIMENTAL_ROUTE);
  };

  const onRefresh = () => {
    if (isMainnet) {
      dispatch(detectCollectibles());
    }
    checkAndUpdateAllCollectiblesOwnershipStatus();
    console.log("[collectibles-tab.js] onRefresh()");
  };

  if (collectiblesLoading) {
    return <div className="collectibles-tab__loading">{t('loadingNFTs')}</div>;
  }

  return (
    <div className="collectibles-tab">
      {Object.keys(collections).length > 0 ||
        previouslyOwnedCollection.collectibles.length > 0 ? (
        <CollectiblesItems
          collections={collections}
          previouslyOwnedCollection={previouslyOwnedCollection}
        />
      ) : (
        <Box padding={[6, 12, 6, 12]}>
          {isMainnet &&
            !useCollectibleDetection &&
            !collectibleDetectionNoticeDismissed ? (
            <CollectiblesDetectionNotice />
          ) : null}
          {/* <Box justifyContent={JUSTIFY_CONTENT.CENTER}>
            <img src="./images/no-nfts.svg" />
          </Box> */}
          <Box
            marginTop={4}
            marginBottom={12}
            justifyContent={JUSTIFY_CONTENT.CENTER}
            flexDirection={FLEX_DIRECTION.COLUMN}
            className="collectibles-tab__link"
          >
            <Typography
              color={COLORS.UI3}
              variant={TYPOGRAPHY.H4}
              align={TEXT_ALIGN.CENTER}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('noNFTs')}
            </Typography>
            {/* <Button
              type="link"
              target="_blank"
              rel="noopener noreferrer"
              href="https://metamask.zendesk.com/hc/en-us/articles/360058238591-NFT-tokens-in-MetaMask-wallet"
            >
              {t('learnMoreUpperCase')}
            </Button> */}
          </Box>
        </Box>
      )}
      <Box
        marginBottom={4}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        flexDirection={FLEX_DIRECTION.COLUMN}
      >
        <Typography
          color={COLORS.UI3}
          variant={TYPOGRAPHY.H5}
          align={TEXT_ALIGN.CENTER}
        >
          {t('missingNFT')}
        </Typography>        
      </Box>
      
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        className="collectibles-tab__link"
      >
        <Button
          className="collectibles-tab-link__link"
          type="link"
          onClick={() => detectNewTokens()}
        >
          <img
            src="./images/search.svg"
            width="28"
            height="28"
            alt=""
          />
          {t('refreshList')}
        </Button>
        <div style={{ width: "5%" }}></div>
        <Button
          className="collectibles-tab-link__link"
          type="link"
          onClick={onAddNFT}
        >
          <img
            src="./images/import.svg"
            width="28"
            height="28"
            alt=""
          />
          {t('importNFTs')}
        </Button>
      </Box>
    </div>
  );
}

CollectiblesTab.propTypes = {
  onAddNFT: PropTypes.func.isRequired,
};

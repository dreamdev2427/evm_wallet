import React, { useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import { getTokens } from '../../ducks/metamask/metamask';
import { getUseTokenDetection, getTokenList, getCurrentChainId, getERC20TokensWithBalances } from '../../selectors';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';
import { isEqualCaseInsensitive } from '../../helpers/utils/util';
import Identicon from '../../components/ui/identicon';
import { I18nContext } from '../../contexts/i18n';
import { useTokenTracker } from '../../hooks/useTokenTracker';
import { useTokenFiatAmount } from '../../hooks/useTokenFiatAmount';
import { AVALANCHE_CHAIN_ID, BSC_CHAIN_ID, FANTOM_CHAIN_ID, MAINNET_CHAIN_ID, NETWORK_TYPE_RPC, POLYGON_CHAIN_ID } from '../../../shared/constants/network';
import { ASSET_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';
import Tooltip from '../../components/ui/tooltip';
import Button from '../../components/ui/button';
import CopyIcon from '../../components/ui/icon/copy-icon.component';
import Box from '../../components/ui/box';
import Typography from '../../components/ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  DISPLAY,
  TEXT_ALIGN,
  OVERFLOW_WRAP,
} from '../../helpers/constants/design-system';
import { setDisplayCertainTokenPrice } from '../../store/actions';

export default function TokenDetailsPage() {
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useContext(I18nContext);
  const tokens = useSelector(getTokens);
  const tokenList = useSelector(getTokenList);
  const useTokenDetection = useSelector(getUseTokenDetection);
  const chainId = useSelector(getCurrentChainId);

  const { address: tokenAddress } = useParams();
  const isConsideringChain = (chainId === AVALANCHE_CHAIN_ID || chainId === BSC_CHAIN_ID || chainId === POLYGON_CHAIN_ID || chainId === MAINNET_CHAIN_ID || chainId === FANTOM_CHAIN_ID)? true : false;
  
  const tokensWithBalances = isConsideringChain === true?
    useSelector(getERC20TokensWithBalances)
    :
    useTokenTracker([token]).tokensWithBalances;

  const tokenMetadata = isConsideringChain === true?
    tokensWithBalances.find( item => isEqualCaseInsensitive(item.address, tokenAddress))
    :
    Object.values(tokenList).find((token) =>
      isEqualCaseInsensitive(token.address, tokenAddress),
    );

  const fileName = isConsideringChain === true? tokenMetadata?.image : tokenMetadata?.iconUrl;
  const imagePath = useTokenDetection
    ? fileName
    : `images/contract/${fileName}`;

  const token = isConsideringChain === true?
  tokensWithBalances.find( item => isEqualCaseInsensitive(item.address, tokenAddress))
  :
  tokens.find(({ address }) =>
    isEqualCaseInsensitive(address, tokenAddress),
  );

  const tokenBalance = isConsideringChain === true?
    token?.string
    :
    tokensWithBalances[0]?.string;

  const tokenCurrencyBalance = isConsideringChain === true?
    "$"+token.usdPrice.toString()
    :
    useTokenFiatAmount(
      token?.address,
      tokenBalance,
      token?.symbol,
    );

  const tokenDecimals = token.decimals;

  const currentNetwork = useSelector((state) => ({
    nickname: state.metamask.provider.nickname,
    type: state.metamask.provider.type,
  }));

  const { nickname: networkNickname, type: networkType } = currentNetwork;

  const [copied, handleCopy] = useCopyToClipboard();
  
  if (!token && isConsideringChain === false) {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }
  return (
    <Box className="page-container token-details">
      <Box marginLeft={5} marginRight={6}>
        <Typography
          fontWeight={FONT_WEIGHT.BOLD}
          margin={[4, 0, 0, 0]}
          variant={TYPOGRAPHY.H6}
          color={COLORS.SECONDARY2}
          className="token-details__title"
        >
          {t('tokenDetails')}
          <Button
            type="link"
            onClick={() => {dispatch(setDisplayCertainTokenPrice(true));  history.push(`${ASSET_ROUTE}/${tokenAddress}`); }}
            className="token-details__closeButton"
          />
        </Typography>
        <Box display={DISPLAY.FLEX} marginTop={4}>
          <Typography
            align={TEXT_ALIGN.CENTER}
            fontWeight={FONT_WEIGHT.BOLD}
            margin={[0, 5, 0, 0]}
            variant={TYPOGRAPHY.H4}
            color={COLORS.SECONDARY2}
            className="token-details__token-value"
          >
            {tokenBalance}
          </Typography>
          <Box marginTop={1}>
            <Identicon
              diameter={32}
              address={token.address}
              image={(tokenMetadata && imagePath !== undefined && !imagePath.includes("undefined") && !imagePath.includes("null")) ?  imagePath : token.image}
            />
          </Box>
        </Box>
        <Typography
          margin={[4, 0, 0, 0]}
          variant={TYPOGRAPHY.H7}
          color={COLORS.UI4}
        >
          {tokenCurrencyBalance || ''}
        </Typography>
        <Typography
          margin={[6, 0, 0, 0]}
          variant={TYPOGRAPHY.H9}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('tokenContractAddress')}
        </Typography>
        <Box display={DISPLAY.FLEX}>
          <Typography
            variant={TYPOGRAPHY.H7}
            margin={[2, 0, 0, 0]}
            color={COLORS.SECONDARY2}
            overflowWrap={OVERFLOW_WRAP.BREAK_WORD}
            className="token-details__token-address"
          >
            {tokenAddress}
          </Typography>
          <Tooltip
            position="bottom"
            title={copied ? t('copiedExclamation') : t('copyToClipboard')}
            containerClassName="token-details__copy-icon"
          >
            <Button
              type="link"
              className="token-details__copyIcon"
              onClick={() => {
                handleCopy(tokenAddress);
              }}
            >
              <CopyIcon size={11} color="#037DD6" />
            </Button>
          </Tooltip>
        </Box>
        <Typography
          variant={TYPOGRAPHY.H9}
          margin={[4, 0, 0, 0]}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('tokenDecimalTitle')}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H7}
          margin={[1, 0, 0, 0]}
          color={COLORS.SECONDARY2}
        >
          {tokenDecimals}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H9}
          margin={[4, 0, 0, 0]}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
        >
          {t('network')}
        </Typography>
        <Typography
          variant={TYPOGRAPHY.H7}
          margin={[1, 0, 0, 0]}
          color={COLORS.SECONDARY2}
        >
          {networkType === NETWORK_TYPE_RPC
            ? networkNickname ?? t('privateNetwork')
            : t(networkType)}
        </Typography>
        {/* <Button
          type="primary"
          className="token-details__hide-token-button"
          onClick={() => {
            dispatch(
              showModal({ name: 'HIDE_TOKEN_CONFIRMATION', token, history }),
            );
          }}
        >
          <Typography variant={TYPOGRAPHY.H6} color={COLORS.PRIMARY1}>
            {t('hideToken')}
          </Typography>
        </Button> */}
      </Box>
    </Box>
  );
}

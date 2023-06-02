import { connect } from 'react-redux';
import {
  getCollectibles,
  getNativeCurrency,
} from '../../../../ducks/metamask/metamask';
import {
  getMetaMaskAccounts,
  getNativeCurrencyImage,
  getCurrentChainId,
  getERC20TokensWithBalances,
  getNativeBalance,
  getTotalERC721TokenList
} from '../../../../selectors';
import { updateSendAsset, getSendAsset } from '../../../../ducks/send';
import SendAssetRow from './send-asset-row.component';

function mapStateToProps(state) {
  return {
    chainId: getCurrentChainId(state),
    tokens: getERC20TokensWithBalances(state),
    selectedAddress: state.metamask.selectedAddress,
    collectibles: getTotalERC721TokenList(state),
    sendAsset: getSendAsset(state),
    accounts: getMetaMaskAccounts(state),
    nativeCurrency: getNativeCurrency(state),
    nativeCurrencyImage: getNativeCurrencyImage(state),
    nativeBalance: getNativeBalance(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    updateSendAsset: ({ type, details }) =>
      dispatch(updateSendAsset({ type, details })),
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(SendAssetRow);

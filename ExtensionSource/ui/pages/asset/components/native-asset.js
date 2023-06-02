import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { getAccountLink } from '@metamask/etherscan-link';
import TransactionList from '../../../components/app/transaction-list';
import { EthOverview } from '../../../components/app/wallet-overview';
import {
  getSelectedIdentity,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSelectedAddress,
} from '../../../selectors/selectors';
import { setDisplayCertainTokenPrice, showModal } from '../../../store/actions';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { getURLHostName } from '../../../helpers/utils/util';
import { useNewMetricEvent } from '../../../hooks/useMetricEvent';
import AssetNavigation from './asset-navigation';
import AssetOptions from './asset-options';

export default function NativeAsset({ nativeCurrency }) {
  const selectedAccountName = useSelector(
    (state) => getSelectedIdentity(state).name,
  );
  const dispatch = useDispatch();

  const chainId = useSelector(getCurrentChainId);
  const rpcPrefs = useSelector(getRpcPrefsForCurrentProvider);
  const address = useSelector(getSelectedAddress);
  const history = useHistory();
  const accountLink = getAccountLink(address, chainId, rpcPrefs);

  const blockExplorerLinkClickedEvent = useNewMetricEvent({
    category: 'Navigation',
    event: 'Clicked Block Explorer Link',
    properties: {
      link_type: 'Account Tracker',
      action: 'Asset Options',
      block_explorer_domain: getURLHostName(accountLink),
    },
  });

  return (
    <>
      <AssetNavigation
        accountName={selectedAccountName}
        assetName={nativeCurrency}
        onBack={() => {
          dispatch(setDisplayCertainTokenPrice(false));
          history.push(DEFAULT_ROUTE);
        }
        }
        isEthNetwork={!rpcPrefs.blockExplorerUrl}
        optionsButton={
          <AssetOptions
            isNativeAsset
            onClickBlockExplorer={() => {
              dispatch(setDisplayCertainTokenPrice(false));
              blockExplorerLinkClickedEvent();
              global.platform.openTab({
                url: accountLink,
              });
            }}
            onViewAccountDetails={() => {
              dispatch(setDisplayCertainTokenPrice(false));
              dispatch(showModal({ name: 'ACCOUNT_DETAILS' }));
            }}
          />
        }
      />
      <EthOverview className="asset__overview" nativeCurrency={nativeCurrency}/>
      <TransactionList hideTokenTransactions />
    </>
  );
}

NativeAsset.propTypes = {
  nativeCurrency: PropTypes.string.isRequired,
};

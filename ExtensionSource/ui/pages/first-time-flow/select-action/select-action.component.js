import React, { PureComponent } from 'react';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { connect } from "react-redux";
import * as actions from '../../../store/actions';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/button';
import MetaFoxLogo from '../../../components/ui/metafox-logo';
import { INITIALIZE_METAMETRICS_OPT_IN_ROUTE } from '../../../helpers/constants/routes';
import { BSC_CHAIN_ID, AVALANCHE_CHAIN_ID, POLYGON_CHAIN_ID, FANTOM_CHAIN_ID } from '../../../../shared/constants/network';

class SelectAction extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    isInitialized: PropTypes.bool,
    setFirstTimeFlowType: PropTypes.func,
    updateAndSetCustomRpc: PropTypes.func,
    nextRoute: PropTypes.string,
  };

  static contextTypes = {
    t: PropTypes.func,
  };

  componentDidMount() {
    const { history, isInitialized, nextRoute } = this.props;

    if (isInitialized) {
      history.push(nextRoute);
    }
  }

  supported4Networks = [
    {
      rpcUrl: "https://bsc-dataseed1.binance.org/",
      prefixedChainId: BSC_CHAIN_ID,
      ticker: "BNB",
      networkName: "BNB Smart Chain Mainnet",
      blockExplorerUrl: "https://bscscan.com/"
    },
    {
      rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
      prefixedChainId: AVALANCHE_CHAIN_ID,
      ticker: "AVAX",
      networkName: "Avalanche Mainnet",
      blockExplorerUrl: "https://snowtrace.io/"
    },
    {
      rpcUrl: "https://polygon-rpc.com/",
      prefixedChainId: POLYGON_CHAIN_ID,
      ticker: "MATIC",
      networkName: "Matic Mainnet",
      blockExplorerUrl: "https://polygonscan.com/"
    },
    {
      rpcUrl: "https://rpcapi.fantom.network/",
      prefixedChainId: FANTOM_CHAIN_ID,
      ticker: "FTM",
      networkName: "Fantom Opera",
      blockExplorerUrl: "https://ftmscan.com"
    }
  ];

  handleCreate = () => {
    console.log("[welcome.js] create ");
    this.supported4Networks.map( (net, index) => {
        console.log("[welcome.js]", net.rpcUrl, net.prefixedChainId, net.ticker, net.networkName);
        this.props.updateAndSetCustomRpc(net.rpcUrl, net.prefixedChainId, net.ticker, net.networkName, {
          blockExplorerUrl: net.blockExplorerUrl
        });
    });
    this.props.setFirstTimeFlowType('create');
    this.props.history.push(INITIALIZE_METAMETRICS_OPT_IN_ROUTE);
  };

  handleImport = () => {
    console.log("[welcome.js] import ");
    this.supported4Networks.map( (net, index) => {
        console.log("[welcome.js]", net.rpcUrl, net.prefixedChainId, net.ticker, net.networkName);
        this.props.updateAndSetCustomRpc(net.rpcUrl, net.prefixedChainId, net.ticker, net.networkName, {
          blockExplorerUrl: net.blockExplorerUrl
        });
    });
    this.props.setFirstTimeFlowType('import');
    this.props.history.push(INITIALIZE_METAMETRICS_OPT_IN_ROUTE);
  };

  render() {
    const { t } = this.context;

    return (
      <div className="select-action">
        <MetaFoxLogo />

        <div className="select-action__wrapper">
          <div className="select-action__body">
            <div className="select-action__body-header">
              {t('newToMetaMask')}
            </div>
            <div className="select-action__select-buttons">
              <div className="select-action__select-button">
                <div className="select-action__button-content">
                  <div className="select-action__button-symbol">
                    <img src="./images/download-alt.svg" alt="" />
                  </div>
                  <div className="select-action__button-text-big">
                    {t('noAlreadyHaveSeed')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('importYourExisting')}
                  </div>
                </div>
                <Button
                  type="primary"
                  className="first-time-flow__button"
                  onClick={this.handleImport}
                >
                  {t('importWallet')}
                </Button>
              </div>
              <div className="select-action__select-button">
                <div className="select-action__button-content">
                  <div className="select-action__button-symbol">
                    <img src="./images/thin-plus.svg" alt="" />
                  </div>
                  <div className="select-action__button-text-big">
                    {t('letsGoSetUp')}
                  </div>
                  <div className="select-action__button-text-small">
                    {t('thisWillCreate')}
                  </div>
                </div>
                <Button
                  type="primary"
                  className="first-time-flow__button"
                  onClick={this.handleCreate}
                >
                  {t('createAWallet')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

function mapDispatchToProps(dispatch) {
  return {
    updateAndSetCustomRpc: (target, chainId, ticker, nickname, rpcProps) => {
      dispatch(actions.updateAndSetCustomRpc(target, chainId, ticker, nickname, rpcProps));
    },
  };
}

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
)(SelectAction);

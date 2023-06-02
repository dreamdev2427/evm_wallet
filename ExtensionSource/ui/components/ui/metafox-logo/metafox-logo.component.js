import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export default class MetaFoxLogo extends PureComponent {
  static propTypes = {
    onClick: PropTypes.func,
    unsetIconHeight: PropTypes.bool,
    isOnboarding: PropTypes.bool,
    isCreatingAccount: PropTypes.bool
  };

  static defaultProps = {
    onClick: undefined,
  };

  render() {
    const { onClick, unsetIconHeight, isOnboarding, isCreatingAccount  } = this.props;
    const iconProps = unsetIconHeight ? {} : { height: 42, width: 42 };

    return (
      <div
        onClick={onClick}
        className={classnames({
          'app-header__logo-container': !isOnboarding,
          'onboarding-app-header__logo-container': isOnboarding,
          'app-header__logo-container--clickable': Boolean(onClick),
        })}
      >
        <img
          height="30"
          src="./images/logo/igloo-logo.svg"
          className={classnames({
            'app-header__metafox-logo--horizontal': !isOnboarding,
            'onboarding-app-header__metafox-logo--horizontal': isOnboarding,
          })}
          alt=""
        />
        <img
          {...iconProps}
          src="./images/logo/igloo-icon40.svg"
          className={classnames({
            'app-header__metafox-logo--icon': !isOnboarding,
            'onboarding-app-header__metafox-logo--icon': isOnboarding,
          })}
          alt=""
        />
        {
          isCreatingAccount === true && 
          <div className='create-account-label'>
            Create account
          </div>
        }
      </div>
    );
  }
}

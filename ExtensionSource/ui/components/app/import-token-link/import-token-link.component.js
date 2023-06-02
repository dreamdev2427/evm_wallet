import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useMetricEvent } from '../../../hooks/useMetricEvent';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { IMPORT_TOKEN_ROUTE } from '../../../helpers/constants/routes';
import Button from '../../ui/button';
import Box from '../../ui/box/box';
import { TEXT_ALIGN } from '../../../helpers/constants/design-system';
import { detectNewTokens } from '../../../store/actions';

export default function ImportTokenLink({ isMainnet }) {
  const addTokenEvent = useMetricEvent({
    eventOpts: {
      category: 'Navigation',
      action: 'Token Menu',
      name: 'Clicked "Add Token"',
    },
  });
  const t = useI18nContext();
  const history = useHistory();

  return (
    <Box className="import-token-link" textAlign={TEXT_ALIGN.CENTER}>
      
      <Button
        className="import-token-link__link"
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
        className="import-token-link__link"
        type="link"
        onClick={() => {
          history.push(IMPORT_TOKEN_ROUTE);
          addTokenEvent();
        }}
      >
        <img
          src="./images/import.svg"
          width="28"
          height="28"
          alt=""
        />
        {t('importTokens')}
      </Button>
    </Box>
  );
}

ImportTokenLink.propTypes = {
  isMainnet: PropTypes.bool,
};

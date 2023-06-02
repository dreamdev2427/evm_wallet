import PropTypes from 'prop-types';
import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePopper } from 'react-popper';
import classnames from 'classnames';

const Menu = ({
  anchorElement,
  children,
  className,
  onHide,
  popperOptions,
}) => {
  const [popperElement, setPopperElement] = useState(null);
  const popoverContainerElement = useRef(
    document.getElementById('popover-content'),
  );

  const { attributes, styles } = usePopper(
    anchorElement,
    popperElement,
    popperOptions,
  );

  const filteredChildren = children.filter( item => item && item.props && !item.props.iconClassName.includes("fa-trash"));

  return createPortal(
    <>
      <div className="menu__background" onClick={onHide} />
      <div
        className={classnames('menu__container', className)}
        ref={setPopperElement}
        style={styles.popper}
        {...attributes.popper}
      >
        {filteredChildren}
      </div>
    </>,
    popoverContainerElement.current,
  );
};

Menu.propTypes = {
  anchorElement: PropTypes.instanceOf(window.Element),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onHide: PropTypes.func.isRequired,
  popperOptions: PropTypes.object,
};

Menu.defaultProps = {
  anchorElement: undefined,
  className: undefined,
  popperOptions: undefined,
};

export default Menu;

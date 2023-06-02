import React from 'react';
import PropTypes from 'prop-types';

const Copy = ({ className, size, color }) => (
  <svg xmlns="http://www.w3.org/2000/svg"  width={size} height={size} viewBox="0 0 24 24">
  <defs>
    <clipPath id="clip-copy">
      <rect width="24" height="24" fill={color}/>
    </clipPath>
  </defs>
  <g id="copy" clip-path="url(#clip-copy)">
    <g id="Group_2807" data-name="Group 2807" transform="translate(2 2)">
      <g id="Group_2808" data-name="Group 2808">
        <path id="Path_1365" data-name="Path 1365" d="M14.75,0h-4A4.756,4.756,0,0,0,6,4.75V6H4.75A4.756,4.756,0,0,0,0,10.75v4A4.756,4.756,0,0,0,4.75,19.5h4a4.756,4.756,0,0,0,4.75-4.75V13.5h1.25A4.756,4.756,0,0,0,19.5,8.75v-4A4.756,4.756,0,0,0,14.75,0M12,14.75A3.254,3.254,0,0,1,8.75,18h-4A3.254,3.254,0,0,1,1.5,14.75v-4A3.254,3.254,0,0,1,4.75,7.5h4A3.254,3.254,0,0,1,12,10.75v4Zm6-6A3.254,3.254,0,0,1,14.75,12H13.5V10.75A4.756,4.756,0,0,0,8.75,6H7.5V4.75A3.254,3.254,0,0,1,10.75,1.5h4A3.254,3.254,0,0,1,18,4.75Z" fill="#fff"/>
      </g>
    </g>
  </g>
</svg>

);

Copy.defaultProps = {
  className: undefined,
};

Copy.propTypes = {
  /**
   * Additional className
   */
  className: PropTypes.string,
  /**
   * Size of the icon should adhere to 8px grid. e.g: 8, 16, 24, 32, 40
   */
  size: PropTypes.number.isRequired,
  /**
   * Color of the icon should be a valid design system color and is required
   */
  color: PropTypes.string.isRequired,
};

export default Copy;

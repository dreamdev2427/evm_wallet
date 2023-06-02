import React from 'react';
import PropTypes from 'prop-types';

export default function SwapIcon({
  width = '15',
  height = '15',
  fill = 'white',
}) {
  return (
    // <svg
    //   width={width}
    //   height={height}
    //   viewBox={`0 0 ${width} ${height}`}
    //   fill="none"
    //   xmlns="http://www.w3.org/2000/svg"
    // >
    //   <path
    //     d="M13.6827 0.889329C13.6458 0.890495 13.609 0.893722 13.5725 0.898996H7.76263C7.40564 0.893947 7.07358 1.08151 6.89361 1.38986C6.71364 1.69821 6.71364 2.07958 6.89361 2.38793C7.07358 2.69628 7.40564 2.88384 7.76263 2.87879H11.3124L1.12335 13.0678C0.864749 13.3161 0.760577 13.6848 0.851011 14.0315C0.941446 14.3786 1.21235 14.6495 1.55926 14.7399C1.90616 14.8303 2.27485 14.7262 2.52313 14.4676L12.7121 4.27857V7.82829C12.7071 8.18528 12.8946 8.51734 13.203 8.69731C13.5113 8.87728 13.8927 8.87728 14.2011 8.69731C14.5094 8.51734 14.697 8.18528 14.6919 7.82829V2.01457C14.7318 1.7261 14.6427 1.43469 14.4483 1.2179C14.2538 1.00111 13.9738 0.880924 13.6827 0.889329Z"
    //     fill={fill}
    //   />
    // </svg>

    <svg xmlns="http://www.w3.org/2000/svg"  width="40" height="40" viewBox="0 0 40 40">
  <defs>
    <clipPath id="clip-send">
      <rect width="40" height="40"/>
    </clipPath>
  </defs>
  <g id="send" clip-path="url(#clip-send)">
    <g id="Group_2702" data-name="Group 2702" transform="translate(-170 -270)">
      <circle id="Ellipse_245" data-name="Ellipse 245" cx="20" cy="20" r="20" transform="translate(170 270)" fill="#3d5dff"/>
      <g id="Group_2144" data-name="Group 2144" transform="translate(185 298) rotate(-90)">
        <g id="Group_2145" data-name="Group 2145" transform="translate(0)">
          <path id="Path_1182" data-name="Path 1182" d="M11.679.75l4.266,4.974L11.679,10.7" transform="translate(-0.945 -0.75)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
          <line id="Line_111" data-name="Line 111" x2="14.878" transform="translate(0 4.975)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>
        </g>
      </g>
    </g>
  </g>
</svg>

  );
}

SwapIcon.propTypes = {
  /**
   * Width of the icon
   */
  width: PropTypes.string,
  /**
   * Height of the icon
   */
  height: PropTypes.string,
  /**
   * Fill  of the icon should be a valid design system color
   */
  fill: PropTypes.string,
};

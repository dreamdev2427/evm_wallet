import React from 'react';
import PropTypes from 'prop-types';

export default function BuyIcon({
  width = '17',
  height = '21',
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
    //     d="M8.62829 14.3216C8.65369 14.2947 8.67756 14.2664 8.69978 14.2368L12.8311 10.1286C13.0886 9.87975 13.1913 9.51233 13.1 9.16703C13.0087 8.82174 12.7375 8.55207 12.3903 8.46129C12.0431 8.37051 11.6736 8.47268 11.4233 8.72869L8.89913 11.2387L8.89913 1.3293C8.90647 0.970874 8.71837 0.636511 8.40739 0.455161C8.0964 0.273811 7.71112 0.27381 7.40014 0.45516C7.08915 0.636511 6.90105 0.970873 6.90839 1.3293L6.90839 11.2387L4.38422 8.72869C4.13396 8.47268 3.76446 8.37051 3.41722 8.46129C3.06998 8.55207 2.79879 8.82174 2.7075 9.16703C2.61621 9.51233 2.71896 9.87975 2.97641 10.1286L7.11049 14.2395C7.28724 14.4717 7.55784 14.6148 7.85026 14.6306C8.14268 14.6464 8.42727 14.5333 8.62829 14.3216Z"
    //     fill={fill}
    //   />
    //   <rect
    //     x="0.260986"
    //     y="15.75"
    //     width="15.8387"
    //     height="2.25"
    //     rx="1"
    //     fill="white"
    //   />
    // </svg>
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <defs>
        <clipPath id="clip-receive">
          <rect width="40" height="40"/>
        </clipPath>
      </defs>
      <g id="receive" clip-path="url(#clip-receive)">
        <g id="Group_2702" data-name="Group 2702" transform="translate(210 310) rotate(180)">
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

BuyIcon.propTypes = {
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

import React from 'react';
import PropTypes from 'prop-types';

const CustomTick = ({
  x,
  y,
  payload,
  unitFormat,
  fill,
  fontSize,
  backgroundColor,
  vertical
}) => {
  const tickValue = payload?.value;
  const formattedTick =
    typeof tickValue === 'number' ? unitFormat?.(tickValue) ?? tickValue : '';

  return (
    <g transform={`translate(${x},${y})`}>
      <defs>
        <filter x="0" y="0" width="1" height="1" id="solid">
          <feFlood floodColor={backgroundColor || '#fff'} />
          <feComposite in="SourceGraphic" />
        </filter>
      </defs>
      <text
        filter="url(#solid)"
        x="0"
        y="3"
        textAnchor={vertical ? 'end' : 'start'}
        fontSize={fontSize || '12px'}
        fill={fill}
      >
        {formattedTick}
      </text>
    </g>
  );
};

CustomTick.propTypes = {
  x: PropTypes.number,
  y: PropTypes.number,
  payload: PropTypes.object,
  unitFormat: PropTypes.func,
  fill: PropTypes.string,
  fontSize: PropTypes.string,
  backgroundColor: PropTypes.string,
  vertical: PropTypes.bool
};

export default CustomTick;

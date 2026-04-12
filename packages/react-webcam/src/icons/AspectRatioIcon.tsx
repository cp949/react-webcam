import type React from "react";

/**
 * AspectRatio icon — matches Material Design AspectRatio icon path.
 */
export function AspectRatioIcon(props: {
  className?: string;
  style?: React.CSSProperties;
  size?: number | string;
}) {
  const { className, style, size = "1em" } = props;
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 24 24'
      width={size}
      height={size}
      fill='currentColor'
      className={className}
      style={style}
      aria-hidden='true'
      focusable='false'
    >
      <path d='M19 12h-2v3h-3v2h5v-5zM7 9h3V7H5v5h2V9zm14-6H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z' />
    </svg>
  );
}

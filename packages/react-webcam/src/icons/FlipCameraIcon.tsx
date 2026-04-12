import type React from "react";

/** Mirror icon for horizontal preview flip. */
export function FlipCameraIcon(props: {
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
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
      style={style}
      aria-hidden='true'
      focusable='false'
    >
      <rect x='4' y='5' width='16' height='14' rx='2.5' />
      <path d='M12 7.5v9' />
      <path d='M10 9 7.5 12 10 15' />
      <path d='M14 9 16.5 12 14 15' />
    </svg>
  );
}

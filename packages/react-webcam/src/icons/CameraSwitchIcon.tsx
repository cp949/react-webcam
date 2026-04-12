import type React from "react";

/** Camera direction icon for switching between front and rear cameras. */
export function CameraSwitchIcon(props: {
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
      <path d='M7.5 7H9l1.5-2h3L15 7h1.5c1.38 0 2.5 1.12 2.5 2.5v5c0 1.38-1.12 2.5-2.5 2.5h-9C6.12 17 5 15.88 5 14.5v-5C5 8.12 6.12 7 7.5 7Z' />
      <circle cx='12' cy='12' r='2.3' />
      <path d='M8.2 5.8A7.5 7.5 0 0 1 18 8.1' />
      <path d='m17.2 5.8 1 2.8-2.9.7' />
      <path d='M15.8 18.2A7.5 7.5 0 0 1 6 15.9' />
      <path d='m6.8 18.2-1-2.8 2.9-.7' />
    </svg>
  );
}

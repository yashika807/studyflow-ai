const paths = {
  home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />,
  library: (
    <>
      <path d="M5 4h4v16H5zM11 4h4v16h-4z" />
      <path d="m17 5.5 3.5 1-3.8 13.5-3.5-1z" />
    </>
  ),
  refresh: (
    <>
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </>
  ),
  settings: (
    <>
      <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <circle cx="15" cy="7" r="2" />
      <circle cx="9" cy="17" r="2" />
    </>
  ),
  upload: <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />,
  check: <path d="M5 13l4 4L19 7" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  sparkle: <path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />,
  trash: <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  file: (
    <>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  plus: <path d="M12 5v14M5 12h14" />,
  logo: <path d="M3 15c4 0 4-8 9-8s5 8 9 8" />,
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

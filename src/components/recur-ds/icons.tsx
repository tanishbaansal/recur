import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number; sw?: number };

function I({ size = 24, sw = 1.6, stroke = "currentColor", children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconCoin = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="5" />
    <path d="M12 7v10M9 9.5h6M9 14.5h6" />
  </I>
);
export const IconBolt = (p: IconProps) => (
  <I {...p}>
    <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8z" />
  </I>
);
export const IconPlay = (p: IconProps) => (
  <I {...p}>
    <path d="M8 5.5v13l11-6.5z" />
  </I>
);
export const IconHeart = (p: IconProps) => (
  <I {...p}>
    <path d="M3 11h3l2-4 3 8 3-5 2 3h5" />
  </I>
);
export const IconChain = (p: IconProps) => (
  <I {...p}>
    <path d="M10 14a4 4 0 0 1 0-5.7l2.1-2.1a4 4 0 1 1 5.7 5.7L16 13.7M14 10a4 4 0 0 1 0 5.7l-2.1 2.1a4 4 0 1 1-5.7-5.7L8 10.3" />
  </I>
);
export const IconArrow = (p: IconProps) => (
  <I {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </I>
);
export const IconChev = (p: IconProps) => (
  <I {...p}>
    <path d="M9 6l6 6-6 6" />
  </I>
);
export const IconCheck = (p: IconProps) => (
  <I {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </I>
);
export const IconPlus = (p: IconProps) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const IconClock = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </I>
);
export const IconDove = (p: IconProps) => (
  <I {...p}>
    <path d="M4 13c4 0 6-3 9-3s5 2 5 4-2 4-5 4c-2 0-4-1-5-3" />
    <path d="M14 8a2 2 0 1 1 4 0" />
  </I>
);
export const IconCmd = (p: IconProps) => (
  <I {...p}>
    <path d="M8 6a2 2 0 1 0-2 2h12a2 2 0 1 0-2-2v12a2 2 0 1 0 2-2H6a2 2 0 1 0 2 2z" />
  </I>
);
export const IconUser = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="9" r="3.5" />
    <path d="M5 19c1.5-3 4-4 7-4s5.5 1 7 4" />
  </I>
);
export const IconExt = (p: IconProps) => (
  <I {...p}>
    <path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </I>
);

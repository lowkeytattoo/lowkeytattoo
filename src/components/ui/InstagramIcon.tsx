import { useId } from "react";

export const InstagramIcon = ({ size = 16 }: { size?: number }) => {
  const uid = useId();
  const gid = `ig-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={gid} cx="30%" cy="107%" r="150%" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFDC80" />
          <stop offset="10%"  stopColor="#FCAF45" />
          <stop offset="25%"  stopColor="#F77737" />
          <stop offset="40%"  stopColor="#F56040" />
          <stop offset="52%"  stopColor="#FD1D1D" />
          <stop offset="64%"  stopColor="#E1306C" />
          <stop offset="76%"  stopColor="#C13584" />
          <stop offset="88%"  stopColor="#833AB4" />
          <stop offset="100%" stopColor="#405DE6" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"
        stroke={`url(#${gid})`} strokeWidth="2" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
        stroke={`url(#${gid})`} strokeWidth="2" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"
        stroke={`url(#${gid})`} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

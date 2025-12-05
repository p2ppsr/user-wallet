import React, { useId, useMemo } from 'react';

interface LogoProps {
  className?: string;
  rotate?: boolean;
  size?: string | number;
  color?: string;
}

const Logo: React.FC<LogoProps> = ({ className, rotate = false, size, color }) => {
  const primary = color || '#0E8A72';
  const accent = '#FF8A3D';
  const ink = '#0F1624';
  const glow = 'rgba(14, 138, 114, 0.45)';
  const shimmer = '#9CF0D9';

  const rawId = useId();
  const uniqueId = useMemo(() => rawId.replace(/[:]/g, ''), [rawId]);

  const fillGradientId = `${uniqueId}-fill`;
  const strokeGradientId = `${uniqueId}-stroke`;
  const haloGradientId = `${uniqueId}-halo`;

  const animations: string[] = [];
  if (rotate) {
    animations.push('uw-logo-float 6s ease-in-out infinite', 'uw-logo-shimmer 5.4s ease-in-out infinite');
  }

  const combinedClassName = className ? `uw-logo ${className}` : 'uw-logo';
  const inlineStyle: React.CSSProperties = {
    width: size || '100%',
    height: size || '100%',
    animation: animations.join(', '),
    transformOrigin: 'center',
    transformBox: 'fill-box',
    filter: 'drop-shadow(0 0 14px rgba(14,138,114,0.28))',
  };

  const cssVariables = inlineStyle as Record<string, string | number>;
  cssVariables['--uw-primary'] = primary;
  cssVariables['--uw-accent'] = accent;
  cssVariables['--uw-ink'] = ink;
  cssVariables['--uw-glow'] = glow;
  cssVariables['--uw-shimmer'] = shimmer;

  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={combinedClassName}
      style={inlineStyle}
    >
      <style>
        {`
          @keyframes uw-logo-float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }

          @keyframes uw-logo-shimmer {
            0%, 100% { filter: drop-shadow(0 0 10px var(--uw-glow)); }
            50% { filter: drop-shadow(0 0 20px var(--uw-glow)); }
          }

          @keyframes uw-logo-pulse {
            0% { stroke-dashoffset: 0; opacity: 0.22; }
            50% { stroke-dashoffset: -36; opacity: 0.4; }
            100% { stroke-dashoffset: -72; opacity: 0.26; }
          }
        `}
      </style>
      <defs>
        <linearGradient id={fillGradientId} x1="38" y1="42" x2="180" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primary} stopOpacity="0.95" />
          <stop offset="55%" stopColor={primary} stopOpacity="0.86" />
          <stop offset="100%" stopColor={ink} stopOpacity="0.88" />
        </linearGradient>

        <linearGradient id={strokeGradientId} x1="70" y1="60" x2="160" y2="170" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primary} />
          <stop offset="50%" stopColor={shimmer} />
          <stop offset="100%" stopColor={accent} />
        </linearGradient>

        <radialGradient id={haloGradientId} cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(110 110) scale(120)">
          <stop offset="0%" stopColor={shimmer} stopOpacity="0.5" />
          <stop offset="50%" stopColor={primary} stopOpacity="0.12" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="110" cy="110" r="104" fill={`url(#${haloGradientId})`} />

      <rect
        x="44"
        y="36"
        width="132"
        height="148"
        rx="32"
        fill={`url(#${fillGradientId})`}
        stroke={accent}
        strokeWidth="2.4"
        opacity="0.96"
      />

      <rect
        x="58"
        y="52"
        width="112"
        height="124"
        rx="26"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="2"
      />

      <path
        d="M76 104h68c7.2 0 13 5.8 13 13s-5.8 13-13 13H76"
        stroke={`url(#${strokeGradientId})`}
        strokeWidth="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.92"
      />

      <path
        d="M74 86c0-8.8 7.2-16 16-16h50c8.8 0 16 7.2 16 16v64c0 17.1-13.9 31-31 31h-20c-17.1 0-31-13.9-31-31V86Z"
        fill="rgba(0,0,0,0.18)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="3"
      />

      <path
        d="M84 90v50c0 12.7 10.3 23 23 23h6c12.7 0 23-10.3 23-23V90c0-6.6-5.4-12-12-12h-28c-6.6 0-12 5.4-12 12Z"
        fill="rgba(255,255,255,0.1)"
        stroke={`url(#${strokeGradientId})`}
        strokeWidth="6"
        strokeLinejoin="round"
      />

      <circle cx="142" cy="117" r="11" fill="rgba(255,255,255,0.14)" stroke={accent} strokeWidth="3" />
      <circle cx="142" cy="117" r="4" fill={accent} />

      <path
        d="M88 68c6.5-6.5 15.2-10.2 24.3-10.2h32.4c6.8 0 12.3 5.5 12.3 12.3V78"
        stroke={shimmer}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="10 10"
        opacity="0.8"
      />

      <path
        d="M166 154c0 10.6-3.9 20.7-11.1 28.5l-0.1 0.1c-9 9.8-21.8 15.4-35.2 15.4h-8.6c-11.5 0-22.5-4.6-30.6-12.7"
        stroke={`url(#${strokeGradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="16 14"
        style={{ animation: 'uw-logo-pulse 7s ease-in-out infinite' }}
      />

      <circle cx="166" cy="76" r="10" fill={accent} opacity="0.92" />
      <circle cx="166" cy="76" r="5" fill="white" opacity="0.85" />

      <circle cx="60" cy="152" r="7" fill={primary} opacity="0.7" />
      <circle cx="70" cy="60" r="5" fill={shimmer} opacity="0.9" />
    </svg>
  );
};

export default Logo;

import React, { useId } from 'react';

interface RadarFolderIconProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const RadarFolderIcon: React.FC<RadarFolderIconProps> = ({
  className = 'w-9 h-9',
  size,
  animated = false
}) => {
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, '_');
  
  const folderBackGradId = `folderBackGrad_${uid}`;
  const folderFrontGradId = `folderFrontGrad_${uid}`;
  const folderHighlightId = `folderFlapHighlight_${uid}`;
  const sheetGradId = `sheetGrad_${uid}`;
  const sheetBackGradId = `sheetBackGrad_${uid}`;
  const radarBgId = `radarBg_${uid}`;
  const bezelGradId = `bezelGrad_${uid}`;
  const bezelAccentId = `bezelAccent_${uid}`;
  const sweepGradId = `sweepGrad_${uid}`;
  const glareGradId = `glareGrad_${uid}`;

  const styleProps = size ? { width: size, height: size } : {};

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={styleProps}
    >
      <svg
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        className="overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Windows 11 Fluent Folder Gradients */}
          <linearGradient id={folderBackGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFB300" />
            <stop offset="60%" stopColor="#F57C00" />
            <stop offset="100%" stopColor="#E65100" />
          </linearGradient>

          <linearGradient id={folderFrontGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="25%" stopColor="#FFCA28" />
            <stop offset="65%" stopColor="#FFA000" />
            <stop offset="100%" stopColor="#F57C00" />
          </linearGradient>

          <linearGradient id={folderHighlightId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFF9C4" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#FFE082" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFB300" stopOpacity="0.2" />
          </linearGradient>

          <linearGradient id={sheetGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F1F5F9" />
          </linearGradient>

          <linearGradient id={sheetBackGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Radar Screen Gradients */}
          <radialGradient id={radarBgId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#043919" />
            <stop offset="65%" stopColor="#022410" />
            <stop offset="95%" stopColor="#011409" />
            <stop offset="100%" stopColor="#000d05" />
          </radialGradient>

          <linearGradient id={bezelGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="30%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id={bezelAccentId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#15803d" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id={sweepGradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86efac" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#4ade80" stopOpacity="0.55" />
            <stop offset="70%" stopColor="#22c55e" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
          </linearGradient>

          <linearGradient id={glareGradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Soft ground shadow beneath folder */}
        <ellipse cx="256" cy="438" rx="205" ry="24" fill="#000000" opacity="0.32" />
        <ellipse cx="256" cy="434" rx="190" ry="16" fill="#000000" opacity="0.25" />

        {/* Back folder body and tab */}
        <path
          d="M 52 136 C 52 118, 66 104, 84 104 L 188 104 C 204 104, 216 112, 224 124 L 246 152 L 428 152 C 446 152, 460 166, 460 184 L 460 396 C 460 414, 446 428, 428 428 L 84 428 C 66 428, 52 414, 52 396 Z"
          fill={`url(#${folderBackGradId})`}
        />

        {/* Interior sheet peeking out */}
        <rect x="96" y="118" width="320" height="150" rx="10" fill={`url(#${sheetBackGradId})`} opacity="0.6" />
        <rect x="80" y="128" width="352" height="180" rx="12" fill={`url(#${sheetGradId})`} />
        
        {/* Media preview glyphs on interior sheet */}
        <rect x="108" y="148" width="110" height="9" rx="4.5" fill="#94A3B8" opacity="0.75" />
        <rect x="108" y="165" width="75" height="7" rx="3.5" fill="#CBD5E1" opacity="0.8" />
        <circle cx="394" cy="158" r="14" fill="#3B82F6" opacity="0.8" />
        <polygon points="391,152 400,158 391,164" fill="#FFFFFF" />

        {/* Drop shadow under top flap */}
        <path d="M 44 200 L 468 200 L 468 214 L 44 214 Z" fill="#000000" opacity="0.18" />

        {/* Front Flap of Windows Folder */}
        <path
          d="M 44 200 C 44 182, 58 168, 76 168 L 436 168 C 454 168, 468 182, 468 200 L 468 400 C 468 418, 454 432, 436 432 L 76 432 C 58 432, 44 418, 44 400 Z"
          fill={`url(#${folderFrontGradId})`}
        />

        {/* Top Rim Highlight on Front Flap */}
        <path
          d="M 46 198 C 46 183, 58 170, 76 170 L 436 170 C 454 170, 466 183, 466 198 L 466 202 C 466 187, 454 174, 436 174 L 76 174 C 58 174, 46 187, 46 202 Z"
          fill={`url(#${folderHighlightId})`}
        />

        {/* Bottom edge bevel */}
        <path
          d="M 76 431 L 436 431 C 452 431, 465 420, 467 406 C 466 418, 454 432, 436 432 L 76 432 C 58 432, 46 418, 45 406 C 47 420, 60 431, 76 431 Z"
          fill="#C2410C"
          opacity="0.4"
        />

        {/* ================= GREEN RADAR SCREEN ON FRONT FLAP ================= */}
        <g transform="translate(256, 308)">
          {/* Radar Bezel Shadows */}
          <circle cx="0" cy="8" r="95" fill="#000000" opacity="0.45" />
          <circle cx="0" cy="5" r="93" fill="#000000" opacity="0.3" />

          {/* Metallic Gunmetal Bezel Ring */}
          <circle cx="0" cy="0" r="92" fill={`url(#${bezelGradId})`} stroke="#64748b" strokeWidth="2" />
          
          {/* Glowing Emerald Inner Accent */}
          <circle cx="0" cy="0" r="85" fill="#0f172a" stroke={`url(#${bezelAccentId})`} strokeWidth="2.2" />

          {/* Deep Dark Green Radar Scope */}
          <circle cx="0" cy="0" r="82" fill={`url(#${radarBgId})`} />

          {/* Range rings */}
          <circle cx="0" cy="0" r="22" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeOpacity="0.35" />
          <circle cx="0" cy="0" r="44" fill="none" stroke="#22c55e" strokeWidth="1.3" strokeOpacity="0.45" />
          <circle cx="0" cy="0" r="66" fill="none" stroke="#22c55e" strokeWidth="1.4" strokeOpacity="0.6" />

          {/* Crosshairs */}
          <line x1="-80" y1="0" x2="80" y2="0" stroke="#22c55e" strokeWidth="1.2" strokeOpacity="0.45" strokeDasharray="4 3" />
          <line x1="0" y1="-80" x2="0" y2="80" stroke="#22c55e" strokeWidth="1.2" strokeOpacity="0.45" strokeDasharray="4 3" />

          {/* Azimuth diagonal marks */}
          <line x1="-58" y1="-58" x2="58" y2="58" stroke="#16a34a" strokeWidth="0.9" strokeOpacity="0.3" strokeDasharray="2 4" />
          <line x1="-58" y1="58" x2="58" y2="-58" stroke="#16a34a" strokeWidth="0.9" strokeOpacity="0.3" strokeDasharray="2 4" />

          {/* Detected Target Blips */}
          {/* Target 1 */}
          <circle cx="42" cy="-36" r="6" fill="#86efac" opacity="0.3" />
          <circle cx="42" cy="-36" r="3.8" fill="#bbf7d0" />
          <circle cx="42" cy="-36" r="8" fill="none" stroke="#4ade80" strokeWidth="1.2" opacity="0.75" />

          {/* Target 2 */}
          <circle cx="-34" cy="-44" r="5" fill="#4ade80" opacity="0.25" />
          <circle cx="-34" cy="-44" r="3" fill="#4ade80" />
          <circle cx="-34" cy="-44" r="6" fill="none" stroke="#22c55e" strokeWidth="0.9" opacity="0.5" />

          {/* Target 3 */}
          <circle cx="50" cy="30" r="5" fill="#86efac" opacity="0.25" />
          <circle cx="50" cy="30" r="3.2" fill="#86efac" />

          {/* Target 4 */}
          <circle cx="-18" cy="20" r="2.4" fill="#22c55e" opacity="0.85" />

          {/* Center Hub */}
          <circle cx="0" cy="0" r="7" fill="#86efac" opacity="0.3" />
          <circle cx="0" cy="0" r="4.5" fill="#86efac" />
          <circle cx="0" cy="0" r="1.8" fill="#FFFFFF" />

          {/* Glass Lens Reflection */}
          <path d="M -62 -52 A 80 80 0 0 1 62 -52 A 76 56 0 0 0 -62 -52 Z" fill={`url(#${glareGradId})`} />
        </g>
      </svg>
    </div>
  );
};

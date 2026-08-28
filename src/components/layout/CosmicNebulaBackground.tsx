import React from 'react';

/**
 * CosmicNebulaBackground:
 * Fixed, full-viewport edge-to-edge multi-layer cosmic purple nebula background.
 * Uses pointer-events-none and sits fixed at inset-0 behind all page content.
 */
export const CosmicNebulaBackground: React.FC = React.memo(() => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* Layer 1: Deep Space Cosmic Canvas Base */}
      <div
        className="absolute inset-0 bg-[#030206]"
        style={{
          backgroundImage: `
            radial-gradient(130% 90% at 85% 15%, rgba(109, 40, 217, 0.45) 0%, rgba(59, 19, 128, 0.3) 35%, rgba(18, 8, 40, 0.15) 60%, transparent 80%),
            radial-gradient(110% 80% at 10% 35%, rgba(126, 34, 206, 0.4) 0%, rgba(68, 16, 122, 0.25) 40%, transparent 75%),
            radial-gradient(120% 90% at 75% 80%, rgba(88, 28, 135, 0.38) 0%, rgba(38, 12, 68, 0.2) 50%, transparent 80%),
            radial-gradient(90% 70% at 30% 75%, rgba(59, 19, 128, 0.25) 0%, transparent 65%),
            linear-gradient(180deg, rgba(8, 5, 16, 0.7) 0%, rgba(3, 2, 6, 0.3) 40%, rgba(3, 2, 6, 0.85) 100%)
          `,
        }}
      />

      {/* Layer 2: Organic Flowing Cosmic Nebula Clouds (SVG Vector Formations) */}
      <svg
        className="absolute inset-0 w-full h-full object-cover opacity-90"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Soft Volumetric Gaussian Blurs */}
          <filter id="nebula-deep-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="55" />
          </filter>
          <filter id="nebula-medium-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="35" />
          </filter>
          <filter id="nebula-filament-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
          </filter>
          <filter id="star-halo" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" />
          </filter>

          {/* Reference Image Purple & Violet Gradient Stops */}
          <linearGradient id="cosmic-purple-deep" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E0B38" stopOpacity="0" />
            <stop offset="25%" stopColor="#4C1D95" stopOpacity="0.7" />
            <stop offset="55%" stopColor="#7C3AED" stopOpacity="0.85" />
            <stop offset="75%" stopColor="#A855F7" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#2E1065" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="cosmic-violet-bright" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#150826" stopOpacity="0" />
            <stop offset="30%" stopColor="#6D28D9" stopOpacity="0.8" />
            <stop offset="55%" stopColor="#C084FC" stopOpacity="0.9" />
            <stop offset="75%" stopColor="#9333EA" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#2A0B4E" stopOpacity="0" />
          </linearGradient>

          <linearGradient id="cosmic-indigo-aura" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0B0E24" stopOpacity="0" />
            <stop offset="35%" stopColor="#1E1B4B" stopOpacity="0.6" />
            <stop offset="65%" stopColor="#4338CA" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#100F29" stopOpacity="0" />
          </linearGradient>

          <radialGradient id="nebula-soft-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#9333EA" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#6B21A8" stopOpacity="0.3" />
            <stop offset="75%" stopColor="#3B0764" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#030206" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Indigo Under-Glow (Depth) */}
        <path
          d="M850,-100 C1100,50 1400,100 1550,380 C1420,620 1150,560 920,410 C780,310 650,220 720,50 Z"
          fill="url(#cosmic-indigo-aura)"
          filter="url(#nebula-deep-blur)"
        />
        <path
          d="M-120,100 C180,160 320,320 260,590 C140,710 -40,690 -140,510 Z"
          fill="url(#cosmic-indigo-aura)"
          filter="url(#nebula-deep-blur)"
        />

        {/* Left Flowing Nebula Cloud Pillar (Rising billow matching reference) */}
        <path
          d="M-90,20 Q180,160 150,380 T-70,740 Q-180,560 -130,240 Z"
          fill="url(#cosmic-purple-deep)"
          filter="url(#nebula-deep-blur)"
        />
        <path
          d="M-30,100 C150,210 230,330 190,470 C130,620 -50,670 -110,530 C-90,370 30,270 -30,100 Z"
          fill="url(#cosmic-violet-bright)"
          filter="url(#nebula-medium-blur)"
          opacity="0.9"
        />
        {/* Wispy filament crest along left cloud */}
        <path
          d="M20,140 Q170,270 110,430 Q70,510 -50,570"
          stroke="url(#cosmic-violet-bright)"
          strokeWidth="44"
          fill="none"
          strokeLinecap="round"
          filter="url(#nebula-filament-blur)"
          opacity="0.8"
        />

        {/* Right Sweeping Cosmic Nebula Curtain (Curving from top-right to mid-right) */}
        <path
          d="M1020,-120 Q1260,130 1330,410 T1160,830 Q960,710 1000,440 T1100,70 Z"
          fill="url(#cosmic-purple-deep)"
          filter="url(#nebula-deep-blur)"
        />
        <path
          d="M1100,10 C1270,170 1370,350 1250,550 C1140,710 1000,670 960,510 C930,370 1020,210 1100,10 Z"
          fill="url(#cosmic-violet-bright)"
          filter="url(#nebula-medium-blur)"
          opacity="0.95"
        />
        {/* Wispy filament crest along right cloud */}
        <path
          d="M1180,50 Q1310,250 1200,450 Q1120,570 970,650"
          stroke="url(#cosmic-violet-bright)"
          strokeWidth="48"
          fill="none"
          strokeLinecap="round"
          filter="url(#nebula-filament-blur)"
          opacity="0.85"
        />

        {/* Bottom-Right Atmospheric Cloud Swell */}
        <path
          d="M500,670 C730,560 1070,600 1310,730 C1390,870 1160,990 820,950 C600,920 420,830 500,670 Z"
          fill="url(#cosmic-purple-deep)"
          filter="url(#nebula-deep-blur)"
          opacity="0.7"
        />
        <path
          d="M660,710 Q910,620 1170,750 Q940,850 720,830 Z"
          fill="url(#cosmic-violet-bright)"
          filter="url(#nebula-medium-blur)"
          opacity="0.75"
        />

        {/* Luminous Core Glows */}
        <circle cx="100" cy="270" r="300" fill="url(#nebula-soft-core)" filter="url(#nebula-deep-blur)" />
        <circle cx="1290" cy="230" r="340" fill="url(#nebula-soft-core)" filter="url(#nebula-deep-blur)" />
        <circle cx="1070" cy="730" r="280" fill="url(#nebula-soft-core)" filter="url(#nebula-deep-blur)" />
      </svg>

      {/* Layer 3: Faint Cosmic Dust & Static Pinpoint Star Field */}
      <svg
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top & Left Quadrant Stars */}
        <circle cx="75" cy="85" r="1.3" fill="#E9D5FF" opacity="0.8" />
        <circle cx="130" cy="170" r="1.0" fill="#FFFFFF" opacity="0.7" />
        <circle cx="205" cy="110" r="1.8" fill="#D8B4FE" opacity="0.85" filter="url(#star-halo)" />
        <circle cx="280" cy="75" r="0.8" fill="#FFFFFF" opacity="0.55" />
        <circle cx="85" cy="300" r="1.5" fill="#E9D5FF" opacity="0.75" />
        <circle cx="165" cy="250" r="0.9" fill="#FFFFFF" opacity="0.6" />
        <circle cx="225" cy="370" r="1.4" fill="#C084FC" opacity="0.7" filter="url(#star-halo)" />
        <circle cx="55" cy="470" r="1.0" fill="#FFFFFF" opacity="0.5" />
        <circle cx="120" cy="550" r="1.7" fill="#E9D5FF" opacity="0.75" filter="url(#star-halo)" />
        <circle cx="260" cy="510" r="0.9" fill="#FFFFFF" opacity="0.55" />
        <circle cx="170" cy="660" r="1.2" fill="#D8B4FE" opacity="0.65" />
        <circle cx="80" cy="770" r="0.9" fill="#FFFFFF" opacity="0.45" />

        {/* Central Stars (Subtle) */}
        <circle cx="470" cy="130" r="0.8" fill="#FFFFFF" opacity="0.4" />
        <circle cx="610" cy="85" r="1.0" fill="#E9D5FF" opacity="0.45" />
        <circle cx="740" cy="170" r="0.7" fill="#FFFFFF" opacity="0.35" />
        <circle cx="420" cy="330" r="0.8" fill="#FFFFFF" opacity="0.35" />
        <circle cx="570" cy="450" r="0.9" fill="#D8B4FE" opacity="0.4" />
        <circle cx="700" cy="380" r="0.8" fill="#FFFFFF" opacity="0.35" />
        <circle cx="810" cy="280" r="0.9" fill="#E9D5FF" opacity="0.4" />
        <circle cx="520" cy="670" r="1.0" fill="#FFFFFF" opacity="0.45" />
        <circle cx="660" cy="730" r="1.2" fill="#C084FC" opacity="0.5" filter="url(#star-halo)" />

        {/* Right & Lower Quadrant Stars */}
        <circle cx="1010" cy="70" r="1.7" fill="#E9D5FF" opacity="0.85" filter="url(#star-halo)" />
        <circle cx="1130" cy="120" r="0.9" fill="#FFFFFF" opacity="0.6" />
        <circle cx="1250" cy="80" r="1.4" fill="#D8B4FE" opacity="0.75" />
        <circle cx="1360" cy="150" r="1.1" fill="#FFFFFF" opacity="0.65" />
        <circle cx="1070" cy="210" r="1.0" fill="#E9D5FF" opacity="0.55" />
        <circle cx="1180" cy="280" r="1.9" fill="#C084FC" opacity="0.9" filter="url(#star-halo)" />
        <circle cx="1300" cy="240" r="0.9" fill="#FFFFFF" opacity="0.55" />
        <circle cx="1370" cy="350" r="1.3" fill="#E9D5FF" opacity="0.7" />
        <circle cx="1030" cy="410" r="0.8" fill="#FFFFFF" opacity="0.5" />
        <circle cx="1150" cy="480" r="1.4" fill="#D8B4FE" opacity="0.75" />
        <circle cx="1270" cy="430" r="1.0" fill="#FFFFFF" opacity="0.6" />
        <circle cx="1340" cy="530" r="1.5" fill="#C084FC" opacity="0.8" filter="url(#star-halo)" />
        <circle cx="970" cy="610" r="0.9" fill="#FFFFFF" opacity="0.5" />
        <circle cx="1080" cy="680" r="1.8" fill="#E9D5FF" opacity="0.85" filter="url(#star-halo)" />
        <circle cx="1210" cy="650" r="1.1" fill="#D8B4FE" opacity="0.65" />
        <circle cx="1330" cy="720" r="0.9" fill="#FFFFFF" opacity="0.55" />
        <circle cx="1230" cy="800" r="1.3" fill="#E9D5FF" opacity="0.65" />
        <circle cx="880" cy="810" r="0.9" fill="#FFFFFF" opacity="0.5" />
        <circle cx="1000" cy="850" r="1.2" fill="#C084FC" opacity="0.6" />
      </svg>

      {/* Layer 4: Soft Space Vignette (Preserves card contrast in central area) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 95% 85% at 50% 35%, transparent 35%, rgba(3, 2, 6, 0.4) 70%, rgba(2, 1, 5, 0.78) 100%)',
        }}
      />
    </div>
  );
});

CosmicNebulaBackground.displayName = 'CosmicNebulaBackground';
export default CosmicNebulaBackground;

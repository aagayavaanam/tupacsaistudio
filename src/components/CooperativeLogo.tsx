import React from 'react';

interface CooperativeLogoProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const CooperativeLogo: React.FC<CooperativeLogoProps> = ({
  className = "w-20 h-14",
  width,
  height
}) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 160 115" 
      className={className}
      width={width}
      height={height}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        {/* Oval Clip to bound the background within the ellipse */}
        <clipPath id="coopEmblemClip">
          <ellipse cx="80" cy="57.5" rx="77" ry="53"/>
        </clipPath>
        
        {/* Warm Sunrise Gradient: Golden yellow to amber orange */}
        <linearGradient id="coopSunGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFDE00"/>
          <stop offset="35%" stopColor="#FF9E00"/>
          <stop offset="85%" stopColor="#E85D04"/>
          <stop offset="100%" stopColor="#DC2626"/>
        </linearGradient>
        
        {/* Field Landscape Gradient: Lush green to sky blue */}
        <linearGradient id="coopGroundGrad" x1="0%" y1="30%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#16A34A"/>
          <stop offset="30%" stopColor="#22C55E"/>
          <stop offset="60%" stopColor="#06B6D4"/>
          <stop offset="100%" stopColor="#0284C7"/>
        </linearGradient>
      </defs>

      {/* Background within clipped oval */}
      <g clipPath="url(#coopEmblemClip)">
        {/* Top Sunrise Sky */}
        <rect x="0" y="0" width="160" height="58" fill="url(#coopSunGrad)"/>
        {/* Bottom Green-Blue Landscape */}
        <rect x="0" y="54" width="160" height="61" fill="url(#coopGroundGrad)"/>
        {/* Soft horizon curve */}
        <path d="M 0 55 Q 80 48 160 55 L 160 115 L 0 115 Z" fill="url(#coopGroundGrad)"/>
      </g>

      {/* Handshake Illustration with bold black outline and white fill */}
      <g stroke="#000000" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="#FFFFFF">
        {/* Left Arm & Thumb Base */}
        <path d="M 3 37 C 18 36 28 37 42 41 C 45 35 48 29 55 24 C 63 19 75 20 86 26 C 92 30 94 36 90 40 C 85 43 76 39 68 36 C 61 34 54 38 49 44 C 44 50 42 56 43 64 C 43 71 47 77 53 79 C 45 81 37 80 30 75 C 23 69 16 62 3 60 Z" />

        {/* Left Thumb contour and knuckle details */}
        <path d="M 50 43 C 54 33 62 24 74 24 C 82 24 90 28 88 36 C 86 41 78 41 71 37 C 65 34 58 37 53 43" fill="#FFFFFF" strokeWidth="2.5"/>
        <path d="M 69 31 C 73 28 78 28 81 31" fill="none" strokeWidth="1.8"/>
        <path d="M 58 36 C 61 41 65 44 71 43" fill="none" strokeWidth="1.8"/>

        {/* Right Hand Overlay (Back of Hand, Forearm & Grip) */}
        <path d="M 157 24 C 138 23 128 25 116 31 C 103 38 88 41 76 41 C 82 43 89 47 96 52 C 103 58 114 65 125 61 C 136 56 146 55 157 57" fill="#FFFFFF" strokeWidth="2.6"/>

        {/* Gripping Fingers of Right Hand curling around Left Hand */}
        {/* Finger 1 (Index Finger) */}
        <path d="M 96 52 C 99 56 102 63 98 67 C 94 71 88 70 84 66 C 79 61 78 54 77 48" fill="#FFFFFF" strokeWidth="2.4"/>
        <path d="M 89 63 C 92 66 95 65 96 62" fill="none" strokeWidth="1.6"/>

        {/* Finger 2 (Middle Finger) */}
        <path d="M 88 66 C 89 71 86 76 81 78 C 76 79 71 77 68 72 C 65 67 65 61 66 56" fill="#FFFFFF" strokeWidth="2.4"/>
        <path d="M 78 71 C 81 74 84 73 85 70" fill="none" strokeWidth="1.6"/>

        {/* Finger 3 (Ring Finger) */}
        <path d="M 75 75 C 76 80 72 84 67 85 C 62 86 57 83 55 78 C 53 73 54 67 56 63" fill="#FFFFFF" strokeWidth="2.4"/>
        <path d="M 66 78 C 69 81 72 80 73 77" fill="none" strokeWidth="1.6"/>

        {/* Finger 4 (Little / Pinky Finger) */}
        <path d="M 62 81 C 62 86 57 89 52 89 C 47 89 43 85 42 80 C 41 75 43 70 47 67" fill="#FFFFFF" strokeWidth="2.4"/>
        <path d="M 54 83 C 56 86 59 85 60 82" fill="none" strokeWidth="1.6"/>

        {/* Left hand fingers / lower grip visible underneath */}
        <path d="M 44 48 C 38 52 35 59 36 67 C 37 74 42 79 49 81" fill="none" strokeWidth="2.2"/>
        <path d="M 33 55 C 29 60 28 66 31 71 C 33 75 37 78 42 79" fill="none" strokeWidth="2.2"/>

        {/* Forearm wrist cuffs */}
        <path d="M 10 38 L 10 59" fill="none" strokeWidth="2.2"/>
        <path d="M 150 25 L 150 56" fill="none" strokeWidth="2.2"/>
      </g>

      {/* Outer Bold Oval Border */}
      <ellipse cx="80" cy="57.5" rx="77" ry="53" fill="none" stroke="#000000" strokeWidth="3"/>
    </svg>
  );
};

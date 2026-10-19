export default function CandidateFrame({ className = '' }) {
  const corners = ['tl', 'tr', 'bl', 'br']

  return (
    <div className={`candidate-frame ${className}`} aria-hidden="true">
      {corners.map((corner) => (
        <svg
          key={corner}
          className={`candidate-frame__corner candidate-frame__corner--${corner}`}
          viewBox="0 0 120 120"
          fill="none"
        >
          <defs>
            <linearGradient id={`cornerGrad_${corner}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fff7e2" />
              <stop offset="30%" stopColor="#fde047" />
              <stop offset="65%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id={`goldHi_${corner}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <linearGradient id={`goldSh_${corner}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#451a03" />
            </linearGradient>
          </defs>

          {/* 1. Outer Dual Architectural Framing Lines */}
          <path d="M 3 116 L 3 34 C 3 17 17 3 34 3 L 116 3" stroke={`url(#cornerGrad_${corner})`} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 10 108 L 10 38 C 10 23 23 10 38 10 L 108 10" stroke={`url(#cornerGrad_${corner})`} strokeWidth="1" strokeOpacity="0.75" strokeLinecap="round" />
          <path d="M 16 96 L 16 42 C 16 28 28 16 42 16 L 96 16" stroke={`url(#cornerGrad_${corner})`} strokeWidth="0.6" strokeDasharray="3 3" strokeOpacity="0.55" />

          {/* 2. Symmetrical Stepped Chevrons */}
          <path d="M 5 48 L 18 35 L 35 18 L 48 5" stroke={`url(#cornerGrad_${corner})`} strokeWidth="0.9" strokeOpacity="0.65" />
          <path d="M 8 56 L 24 40 L 40 24 L 56 8" stroke={`url(#cornerGrad_${corner})`} strokeWidth="0.8" strokeOpacity="0.45" />

          {/* 3. Elegant Classical S-Scrolls */}
          <path d="M 26 26 C 36 19 54 16 74 15 C 88 14 98 10 104 3 C 98 9 86 16 72 17 C 54 18 40 22 30 30" fill={`url(#cornerGrad_${corner})`} fillOpacity="0.75" />
          <path d="M 26 26 C 19 36 16 54 15 74 C 14 88 10 98 3 104 C 9 98 16 86 17 72 C 18 54 22 40 30 30" fill={`url(#cornerGrad_${corner})`} fillOpacity="0.75" />

          {/* 4. Inward Diagonal Royal Spearhead */}
          <path d="M 26 26 L 50 50 M 44 44 L 54 54" stroke={`url(#cornerGrad_${corner})`} strokeWidth="1.2" strokeLinecap="round" />
          <polygon points="54,54 62,49 67,67 49,62" fill={`url(#goldHi_${corner})`} stroke={`url(#goldSh_${corner})`} strokeWidth="0.5" />

          {/* 5. Central Faceted 8-Point Royal Gold Star (Center at 26, 26) */}
          <polygon points="26,6 29,22 26,26" fill={`url(#goldHi_${corner})`} />
          <polygon points="26,6 23,22 26,26" fill={`url(#goldSh_${corner})`} />
          <polygon points="46,26 30,23 26,26" fill={`url(#goldHi_${corner})`} />
          <polygon points="46,26 30,29 26,26" fill={`url(#goldSh_${corner})`} />
          <polygon points="26,46 29,30 26,26" fill={`url(#goldHi_${corner})`} />
          <polygon points="26,46 23,30 26,26" fill={`url(#goldSh_${corner})`} />
          <polygon points="6,26 22,23 26,26" fill={`url(#goldHi_${corner})`} />
          <polygon points="6,26 22,29 26,26" fill={`url(#goldSh_${corner})`} />

          <polygon points="12,12 22,23 26,26" fill={`url(#goldHi_${corner})`} />
          <polygon points="12,12 23,22 26,26" fill={`url(#goldSh_${corner})`} />
          <polygon points="40,12 29,22 26,26" fill={`url(#goldHi_${corner})`} />
          <polygon points="40,12 30,23 26,26" fill={`url(#goldSh_${corner})`} />
          <polygon points="40,40 30,29 26,26" fill={`url(#goldHi_${corner})`} />
          <polygon points="40,40 29,30 26,26" fill={`url(#goldSh_${corner})`} />
          <polygon points="12,40 22,30 26,26" fill={`url(#goldHi_${corner})`} />
          <polygon points="12,40 23,29 26,26" fill={`url(#goldSh_${corner})`} />

          <polygon points="26,21 31,26 26,31 21,26" fill="#ffffff" stroke="#fbbf24" strokeWidth="0.8" />
          <circle cx="26" cy="26" r="2" fill="#fef08a" />

          {/* 6. Faceted Diamond Studs on Border Rails */}
          <polygon points="64,1 67,4 64,7 61,4" fill={`url(#goldHi_${corner})`} stroke="#92400e" strokeWidth="0.5" />
          <polygon points="1,64 4,67 7,64 4,61" fill={`url(#goldHi_${corner})`} stroke="#92400e" strokeWidth="0.5" />
          <polygon points="92,1 95,4 92,7 89,4" fill={`url(#goldHi_${corner})`} stroke="#92400e" strokeWidth="0.5" />
          <polygon points="1,92 4,95 7,92 4,89" fill={`url(#goldHi_${corner})`} stroke="#92400e" strokeWidth="0.5" />

          {/* Terminal Rail Finials */}
          <circle cx="116" cy="3" r="2" fill={`url(#goldHi_${corner})`} stroke="#92400e" strokeWidth="0.5" />
          <circle cx="3" cy="116" r="2" fill={`url(#goldHi_${corner})`} stroke="#92400e" strokeWidth="0.5" />
        </svg>
      ))}

      {/* Top Center Royal Crest */}
      <div className="candidate-frame__crest">
        <svg viewBox="0 0 60 20" className="w-[60px] h-[20px] select-none pointer-events-none" fill="none">
          <defs>
            <linearGradient id="crestGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#b45309" />
              <stop offset="50%" stopColor="#fde047" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <line x1="2" y1="10" x2="22" y2="10" stroke="url(#crestGold)" strokeWidth="1" strokeDasharray="3 2" />
          <line x1="38" y1="10" x2="58" y2="10" stroke="url(#crestGold)" strokeWidth="1" strokeDasharray="3 2" />
          <polygon points="30,2 38,10 30,18 22,10" fill="#fde047" stroke="#b45309" strokeWidth="0.8" />
          <polygon points="30,2 30,18 22,10" fill="#d97706" />
          <circle cx="30" cy="10" r="1.6" fill="#ffffff" />
          <circle cx="14" cy="10" r="1.4" fill="#fde047" />
          <circle cx="46" cy="10" r="1.4" fill="#fde047" />
        </svg>
      </div>
    </div>
  )
}

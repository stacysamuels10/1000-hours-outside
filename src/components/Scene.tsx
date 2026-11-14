/** Original header illustration: sky, sun, clouds, rolling hills, trees. */
export default function Scene() {
  return (
    <svg className="scene" viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8fd0f0" />
          <stop offset="1" stopColor="#d9f1f7" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#ffe36e" stopOpacity=".9" />
          <stop offset="1" stopColor="#ffe36e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="190" fill="url(#sky)" />
      <circle cx="318" cy="54" r="52" fill="url(#sunGlow)" />
      <circle cx="318" cy="54" r="24" fill="#ffd93d" />
      <g className="cloud cloud-a" fill="#fff">
        <ellipse cx="70" cy="46" rx="28" ry="11" /><ellipse cx="90" cy="38" rx="18" ry="12" /><ellipse cx="52" cy="40" rx="14" ry="9" />
      </g>
      <g className="cloud cloud-b" fill="#fff" opacity=".9">
        <ellipse cx="200" cy="72" rx="22" ry="8" /><ellipse cx="214" cy="65" rx="13" ry="9" />
      </g>
      <path d="M0 128 C60 92 120 96 180 118 C240 138 300 90 400 112 V190 H0Z" fill="#a8d38a" />
      <path d="M0 150 C70 118 150 132 220 146 C290 160 340 128 400 140 V190 H0Z" fill="#7fbf6a" />
      <path d="M0 172 C90 156 170 170 250 168 C320 166 360 158 400 164 V190 H0Z" fill="#3f7d4e" />
      {/* trees */}
      <g>
        <rect x="46" y="116" width="6" height="22" rx="2" fill="#7a5a3a" />
        <circle cx="49" cy="108" r="17" fill="#4f9a5c" /><circle cx="40" cy="116" r="10" fill="#5fae6a" />
        <rect x="120" y="132" width="5" height="16" rx="2" fill="#7a5a3a" />
        <path d="M122.500 106 L136 136 H109Z" fill="#3f7d4e" /><path d="M122.500 116 L139 144 H106Z" fill="#4f9a5c" />
        <rect x="290" y="128" width="6" height="22" rx="2" fill="#7a5a3a" />
        <circle cx="293" cy="120" r="16" fill="#5fae6a" /><circle cx="302" cy="127" r="9" fill="#4f9a5c" />
        <rect x="352" y="140" width="5" height="16" rx="2" fill="#7a5a3a" />
        <path d="M354.500 116 L368 144 H341Z" fill="#4f9a5c" />
      </g>
      <g fill="#ffd93d"><circle cx="180" cy="176" r="2.500" /><circle cx="210" cy="180" r="2.500" /><circle cx="90" cy="178" r="2.500" /></g>
      <g fill="#fff"><circle cx="196" cy="178" r="2" /><circle cx="70" cy="180" r="2" /></g>
    </svg>
  )
}

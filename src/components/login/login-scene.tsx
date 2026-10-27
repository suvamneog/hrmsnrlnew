export function LoginScene() {
  return (
    <svg viewBox="0 0 1000 680" preserveAspectRatio="xMidYMax meet" className="absolute inset-0 h-full w-full" aria-hidden>
      <rect width="1000" height="680" fill="#f5f7fb" />

      <g fill="#e4e9f0">
        <ellipse cx="110" cy="78" rx="54" ry="18" />
        <ellipse cx="158" cy="70" rx="40" ry="14" />
        <ellipse cx="280" cy="52" rx="36" ry="12" />
        <ellipse cx="580" cy="64" rx="70" ry="20" />
        <ellipse cx="640" cy="56" rx="42" ry="14" />
      </g>

      <g fill="#d5dce6" transform="translate(52 142)">
        <path d="M36 0l8 44H28z" />
        <rect x="30" y="42" width="12" height="28" />
        <path d="M2 84h68l-8-16H10z" />
        <rect x="8" y="84" width="56" height="88" />
        <rect x="28" y="104" width="16" height="28" fill="#c8d0dc" />
      </g>

      <g fill="#d8dee8">
        <rect x="140" y="216" width="44" height="94" />
        <rect x="190" y="186" width="36" height="124" />
        <rect x="232" y="228" width="28" height="82" />
        <rect x="560" y="196" width="50" height="114" />
        <rect x="616" y="164" width="40" height="146" />
        <rect x="662" y="210" width="32" height="100" />
        <rect x="700" y="180" width="48" height="130" />
      </g>

      <g stroke="#cfd6e2" fill="none">
        <circle cx="400" cy="186" r="118" strokeWidth="8" />
        <circle cx="400" cy="186" r="100" strokeWidth="2" />
        <circle cx="400" cy="186" r="16" strokeWidth="5" />
        <path
          strokeWidth="2.5"
          d="M400 68 L400 304
             M282 186 L518 186
             M316 104 L484 268
             M316 268 L484 104
             M351 76 L449 296
             M351 296 L449 76
             M298 138 L502 234
             M298 234 L502 138"
        />
      </g>
      <g fill="#c5cedb">
        <circle cx="400" cy="68" r="5.5" />
        <circle cx="459" cy="84" r="5.5" />
        <circle cx="502" cy="127" r="5.5" />
        <circle cx="518" cy="186" r="5.5" />
        <circle cx="502" cy="245" r="5.5" />
        <circle cx="459" cy="288" r="5.5" />
        <circle cx="400" cy="304" r="5.5" />
        <circle cx="341" cy="288" r="5.5" />
        <circle cx="298" cy="245" r="5.5" />
        <circle cx="282" cy="186" r="5.5" />
        <circle cx="298" cy="127" r="5.5" />
        <circle cx="341" cy="84" r="5.5" />
        <circle cx="400" cy="186" r="7" />
      </g>
      <path d="M400 202 L364 316 H436 Z" fill="#d8dee8" />
      <path d="M0 312 h1000" stroke="#e3e8ef" strokeWidth="8" />

      <g transform="translate(800 240)">
        <rect width="92" height="248" rx="3" fill="#e8ecf2" />
        <rect x="10" y="16" width="32" height="44" rx="2" fill="#c5cedb" />
        <rect x="48" y="16" width="34" height="44" rx="2" fill="#d0d6e0" />
        <rect x="10" y="70" width="34" height="44" rx="2" fill="#d0d6e0" />
        <rect x="50" y="70" width="32" height="44" rx="2" fill="#c5cedb" />
        <rect x="10" y="128" width="72" height="7" rx="1" fill="#c5cedb" />
        <rect x="10" y="148" width="72" height="7" rx="1" fill="#c5cedb" />
        <rect x="10" y="168" width="48" height="7" rx="1" fill="#c5cedb" />
        <rect x="10" y="196" width="72" height="22" rx="2" fill="#d0d6e0" />
        <rect x="10" y="228" width="36" height="10" rx="2" fill="#c5cedb" />
      </g>

      <g transform="translate(748 430)">
        <ellipse cx="34" cy="78" rx="28" ry="8" fill="#d8dee8" />
        <rect x="20" y="48" width="28" height="30" rx="5" fill="#b7c2d2" />
        <path d="M34 4c22 12 28 30 12 50-18 2-30-16-28-32 12-10 16-12 16-18z" fill="#7d9a7f" />
        <path d="M14 28c16 6 24 20 10 32-14-2-20-18-10-32z" fill="#8fad90" />
        <path d="M48 22c14 10 10 26-2 32-4-12-2-26 2-32z" fill="#6f9178" />
      </g>

      <PhoneWoman />
      <LaptopMan />
      <CupWoman />
      <TalkingMan />
      <StandingWoman />
      <rect x="28" y="478" width="760" height="34" rx="3" fill="#fff" />
      <rect x="52" y="512" width="16" height="90" fill="#eef1f6" />
      <rect x="748" y="512" width="16" height="90" fill="#eef1f6" />
      <path d="M228 478h52l7 11H223z" fill="#eef1f6" />
      <path d="M236 478l9-26h32l9 26" fill="#d8dee8" />

      <ShelfWoman />
    </svg>
  );
}

const skin = "#f6c7a6";
const hair = "#1b1f33";
const shirt = "#3d5afe";
const shade = "#2f49d8";
const ink = "#14182a";

/* Woman with a bob, side-on facing right, reading her phone. */
function PhoneWoman() {
  return (
    <g transform="translate(64 296)">
      <rect x="30" y="150" width="15" height="66" rx="6" fill={ink} />
      <rect x="48" y="150" width="15" height="66" rx="6" fill={ink} />
      <path d="M26 82c4-14 38-16 46 0l6 76H22z" fill={shirt} />
      <rect x="40" y="62" width="12" height="16" rx="5" fill={skin} />
      <ellipse cx="50" cy="44" rx="17" ry="20" fill={skin} />
      <path d="M66 44l6 6-6 3z" fill={skin} />
      <path d="M30 50c-4-26 10-36 24-36 12 0 20 8 20 18-10-2-18-6-22-12-2 10-8 16-10 30 0 8-2 14-6 16-6-2-6-10-6-16z" fill={hair} />
      <path d="M44 92c-2 26 10 40 30 34" stroke={shade} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M58 92c4 18 14 28 22 30" stroke={shirt} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="80" cy="122" r="6" fill={skin} />
      <rect x="76" y="104" width="9" height="17" rx="2" fill={ink} transform="rotate(18 80 112)" />
    </g>
  );
}

/* Bearded man seated side-on, hunched over a laptop. */
function LaptopMan() {
  return (
    <g transform="translate(206 330)">
      <path d="M22 150c-6-40 6-70 30-82 22-8 44 6 50 30l6 52z" fill={shirt} />
      <ellipse cx="78" cy="48" rx="17" ry="20" fill={skin} />
      <path d="M93 46l7 7-7 3z" fill={skin} />
      <path d="M60 46c-2-22 12-30 26-28 10 2 14 8 14 14-10-4-20-2-24 6-2 6-6 10-10 12z" fill={hair} />
      <path d="M66 58c4 14 14 20 26 16-2 6-10 12-18 10-8-2-12-12-8-26z" fill={hair} />
      <path d="M52 92c10 22 30 34 54 36" stroke={shade} strokeWidth="14" strokeLinecap="round" fill="none" />
      <circle cx="110" cy="128" r="7" fill={skin} />
      <path d="M118 148l14-40h56l-14 40z" fill="#ffffff" stroke="#dfe4ec" strokeWidth="2" />
      <rect x="108" y="146" width="80" height="4" rx="2" fill="#dfe4ec" />
    </g>
  );
}

/* Woman with long hair facing out, drinking from a cup, in a dark chair. */
function CupWoman() {
  return (
    <g transform="translate(372 318)">
      <path d="M8 160V96c0-14 10-22 22-22h52c12 0 22 8 22 22v64z" fill={ink} />
      <path d="M26 64c-6-36 10-52 30-52s36 16 30 52l2 40H24z" fill={hair} />
      <path d="M22 160c0-48 8-68 34-70 26 2 34 22 34 70z" fill={shirt} />
      <rect x="49" y="66" width="14" height="16" rx="5" fill={skin} />
      <ellipse cx="56" cy="48" rx="17" ry="20" fill={skin} />
      <path d="M38 40c4-18 34-20 38 0-8-8-28-8-38 0z" fill={hair} />
      <path d="M30 104c-4 22 10 30 26 22" stroke={shade} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M84 104c4 22-10 30-24 22" stroke={shade} strokeWidth="13" strokeLinecap="round" fill="none" />
      <circle cx="58" cy="122" r="7" fill={skin} />
      <rect x="50" y="56" width="16" height="22" rx="3" fill="#ffffff" />
      <path d="M66 62h4c4 0 4 9 0 10h-4" fill="none" stroke="#ffffff" strokeWidth="3" />
    </g>
  );
}

/* Man seated side-on facing left, holding a cup and talking. */
function TalkingMan() {
  return (
    <g transform="translate(520 322)">
      <path d="M88 160V92c0-12 8-20 18-20h10v88z" fill={ink} />
      <path d="M30 156c-4-44 8-76 34-84 22-4 38 12 40 40l2 44z" fill={shirt} />
      <ellipse cx="52" cy="48" rx="17" ry="20" fill={skin} />
      <path d="M36 46l-7 7 7 3z" fill={skin} />
      <path d="M44 28c10-14 34-12 38 6 2 10-2 18-8 24-2-10-6-16-12-18-6 4-14 2-18-12z" fill={hair} />
      <path d="M62 96c-14 20-26 28-36 30" stroke={shade} strokeWidth="13" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="126" r="7" fill={skin} />
      <rect x="16" y="104" width="16" height="18" rx="3" fill="#ffffff" />
      <path d="M16 110h-4c-4 0-4 8 0 9h4" fill="none" stroke="#ffffff" strokeWidth="3" />
    </g>
  );
}

/* Woman with long hair standing, looking down at her phone. */
function StandingWoman() {
  return (
    <g transform="translate(668 286)">
      <rect x="32" y="160" width="15" height="66" rx="6" fill={ink} />
      <rect x="50" y="160" width="15" height="66" rx="6" fill={ink} />
      <path d="M28 66c-6-34 8-52 22-52s30 16 24 52l4 62H24z" fill={hair} />
      <path d="M22 168c-2-52 6-78 28-82 22 4 30 30 28 82z" fill={shirt} />
      <rect x="42" y="64" width="14" height="18" rx="5" fill={skin} />
      <ellipse cx="50" cy="46" rx="17" ry="20" fill={skin} />
      <path d="M32 40c4-18 34-20 38 0-8-8-28-8-38 0z" fill={hair} />
      <path d="M28 102c-6 26 6 38 22 34" stroke={shade} strokeWidth="13" strokeLinecap="round" fill="none" />
      <path d="M72 102c6 26-6 38-20 34" stroke={shade} strokeWidth="13" strokeLinecap="round" fill="none" />
      <circle cx="52" cy="134" r="7" fill={skin} />
      <rect x="45" y="118" width="12" height="18" rx="2" fill={ink} />
    </g>
  );
}

/* Woman in a skirt by the shelf, turned left, holding a mug. */
function ShelfWoman() {
  return (
    <g transform="translate(880 262)">
      <rect x="26" y="178" width="10" height="70" rx="4" fill={skin} />
      <rect x="46" y="178" width="10" height="70" rx="4" fill={skin} />
      <path d="M18 250h20l-2 8H10z" fill={ink} />
      <path d="M44 250h20l-2 8H36z" fill={ink} />
      <path d="M18 138h46l10 46H8z" fill={ink} />
      <path d="M16 84c6-16 46-18 54 0l-4 60H20z" fill={shirt} />
      <rect x="36" y="62" width="13" height="16" rx="5" fill={skin} />
      <ellipse cx="42" cy="44" rx="17" ry="20" fill={skin} />
      <path d="M26 44l-7 6 7 3z" fill={skin} />
      <circle cx="54" cy="20" r="10" fill={hair} />
      <path d="M30 34c6-18 34-18 40 2 2 12-2 22-8 26 0-12-4-18-10-20-8 0-16-2-22-8z" fill={hair} />
      <path d="M30 94c-6 16-4 24 2 30" stroke={shade} strokeWidth="12" strokeLinecap="round" fill="none" />
      <circle cx="30" cy="124" r="6" fill={skin} />
      <rect x="16" y="104" width="14" height="16" rx="3" fill="#ffffff" />
      <path d="M16 109h-3c-4 0-4 7 0 8h3" fill="none" stroke="#ffffff" strokeWidth="2.5" />
    </g>
  );
}

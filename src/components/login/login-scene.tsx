import type { ReactNode } from "react";

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

      <Person
        x={48}
        y={300}
        hair="bob"
        item={<rect x="42" y="118" width="14" height="24" rx="3" fill={hair} />}
      />
      <Person x={208} y={310} hair="short" />
      <Person
        x={368}
        y={296}
        hair="long"
        item={
          <g>
            <rect x="64" y="84" width="15" height="18" rx="4" fill="#fff" />
            <path d="M79 90h5c4 0 4 6 0 8h-4" fill="none" stroke="#fff" strokeWidth="2.5" />
          </g>
        }
      />
      <Person
        x={528}
        y={308}
        hair="short"
        item={
          <g>
            <rect x="42" y="104" width="16" height="16" rx="4" fill="#fff" />
            <path d="M58 109h4c3 0 4 5 0 7h-4" fill="none" stroke="#fff" strokeWidth="2.5" />
          </g>
        }
      />
      <Person
        x={668}
        y={294}
        hair="long"
        item={<rect x="42" y="118" width="14" height="24" rx="3" fill={hair} />}
      />

      <rect x="28" y="478" width="760" height="34" rx="3" fill="#fff" />
      <rect x="52" y="512" width="16" height="90" fill="#eef1f6" />
      <rect x="748" y="512" width="16" height="90" fill="#eef1f6" />
      <path d="M228 478h52l7 11H223z" fill="#eef1f6" />
      <path d="M236 478l9-26h32l9 26" fill="#d8dee8" />

      <Standing />
    </svg>
  );
}

const skin = "#f1c4a4";
const hair = "#1b2136";
const shirt = "#3d5afe";

function Hairdo({ kind, cx, cy }: { kind: "bob" | "short" | "long"; cx: number; cy: number }) {
  if (kind === "long") {
    return (
      <g>
        <path
          d={`M${cx - 20} ${cy + 6}c0-26 12-38 20-40 10 2 20 14 22 40v58c-2 8-10 10-15 4-4-22-5-34-7-42-2 8-3 22-7 42-6 6-14 4-15-4V${cy + 6}z`}
          fill={hair}
        />
        <ellipse cx={cx} cy={cy + 18} rx="6" ry="8" fill={skin} />
        <ellipse cx={cx} cy={cy + 4} rx="15" ry="17" fill={skin} />
        <path d={`M${cx - 14} ${cy - 8}c6-10 22-10 28 0-8-4-20-4-28 0z`} fill={hair} />
      </g>
    );
  }
  if (kind === "bob") {
    return (
      <g>
        <path
          d={`M${cx - 21} ${cy + 4}c0-24 14-36 21-38 9 2 21 14 21 38v16c0 10-8 16-14 16h-14c-8 0-14-6-14-16z`}
          fill={hair}
        />
        <ellipse cx={cx} cy={cy + 18} rx="6" ry="8" fill={skin} />
        <ellipse cx={cx} cy={cy + 4} rx="15" ry="17" fill={skin} />
        <path d={`M${cx - 14} ${cy - 8}c6-9 22-9 28 0-8-3-20-3-28 0z`} fill={hair} />
      </g>
    );
  }
  return (
    <g>
      <path d={`M${cx - 18} ${cy}c2-22 32-26 36 0 0 8-6 12-12 12h-12c-6 0-12-4-12-12z`} fill={hair} />
      <ellipse cx={cx} cy={cy + 18} rx="6" ry="8" fill={skin} />
      <ellipse cx={cx} cy={cy + 4} rx="15" ry="17" fill={skin} />
      <path d={`M${cx - 13} ${cy - 10}c5-7 22-7 28 0-8-3-20-3-28 0z`} fill={hair} />
    </g>
  );
}

function Person({
  x,
  y,
  hair: kind,
  item,
}: {
  x: number;
  y: number;
  hair: "bob" | "short" | "long";
  item?: ReactNode;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Hairdo kind={kind} cx={50} cy={36} />
      <path d="M12 86c8-16 68-16 76 4v78H12V86z" fill={shirt} />
      <ellipse cx="50" cy="80" rx="8" ry="7" fill={skin} />
      <path d="M18 96c-2 16 8 30 20 40" stroke={skin} strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M82 96c2 16-8 30-20 40" stroke={skin} strokeWidth="10" strokeLinecap="round" fill="none" />
      {item}
    </g>
  );
}

function Standing() {
  return (
    <g transform="translate(888 278)">
      <Hairdo kind="bob" cx={40} cy={36} />
      <path d="M10 80c8-18 52-18 58 4v62H10V80z" fill={shirt} />
      <ellipse cx="40" cy="76" rx="7" ry="6" fill={skin} />
      <path d="M16 142h48l8 38H8z" fill={hair} />
      <rect x="20" y="178" width="9" height="34" rx="4" fill={skin} />
      <rect x="49" y="178" width="9" height="34" rx="4" fill={skin} />
      <ellipse cx="24" cy="214" rx="11" ry="5" fill={hair} />
      <ellipse cx="54" cy="214" rx="11" ry="5" fill={hair} />
      <path d="M14 92c6 10 12 16 16 20" stroke={skin} strokeWidth="9" strokeLinecap="round" fill="none" />
      <path d="M66 92c-6 10-12 16-16 20" stroke={skin} strokeWidth="9" strokeLinecap="round" fill="none" />
      <rect x="32" y="78" width="14" height="22" rx="3" fill={hair} />
    </g>
  );
}

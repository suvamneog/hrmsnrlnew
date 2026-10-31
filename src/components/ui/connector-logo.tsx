import type { NrlInterfaceId } from "@/lib/types";

/* Brand marks for each connector, drawn as small SVG tiles like the PDF and XLS file badges. */
export function ConnectorLogo({ id, size = 44 }: { id: NrlInterfaceId; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-line"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 44 44" width={size} height={size}>
        {MARKS[id]}
      </svg>
    </span>
  );
}

const MARKS: Record<NrlInterfaceId, React.ReactNode> = {
  sap_hr: (
    <g>
      <defs>
        <linearGradient id="sap-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00AEEF" />
          <stop offset="1" stopColor="#0070C0" />
        </linearGradient>
      </defs>
      <path d="M5 13h34L25 31H5z" fill="url(#sap-g)" />
      <text x="15" y="25.5" textAnchor="middle" fontSize="9" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        SAP
      </text>
    </g>
  ),
  aarohan: (
    <g>
      <rect width="44" height="44" fill="#fff4ec" />
      <path d="M10 32 22 11l12 21h-6l-6-11-6 11z" fill="#e8642c" />
      <path d="M16 32h12" stroke="#e8642c" strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  eureka: (
    <g>
      <rect width="44" height="44" fill="#eefaf3" />
      <path d="M22 9a9 9 0 0 0-5 16.5V29h10v-3.5A9 9 0 0 0 22 9z" fill="#14a06a" />
      <rect x="18" y="31" width="8" height="3" rx="1.5" fill="#14a06a" />
      <path d="M22 14v6m-3-3h6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  saral: (
    <g>
      <rect width="44" height="44" fill="#eef1ff" />
      <rect x="9" y="12" width="18" height="22" rx="3" fill="#3d5afe" />
      <rect x="12" y="16" width="12" height="2.4" rx="1.2" fill="#fff" opacity=".9" />
      <circle cx="18" cy="26" r="4" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="M30 14c3 2 4.5 5 4.5 8s-1.5 6-4.5 8M28 18c1.6 1 2.4 2.5 2.4 4s-.8 3-2.4 4" stroke="#3d5afe" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  // Payroll bank is not published, so a plain bank mark rather than any bank's logo.
  sbi: (
    <g>
      <rect width="44" height="44" fill="#eef1ff" />
      <path d="M22 10 9 17h26z" fill="#3d5afe" />
      <path d="M12 19v10m6.7-10v10m6.6-10v10M32 19v10" stroke="#3d5afe" strokeWidth="2.6" strokeLinecap="round" />
      <rect x="9" y="31" width="26" height="3" rx="1" fill="#3d5afe" />
    </g>
  ),
  btp: (
    <g>
      <rect width="44" height="44" fill="#e6f4fd" />
      <path d="M5 13h34L25 31H5z" fill="#0070C0" />
      <text x="15" y="25.5" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        BTP
      </text>
    </g>
  ),
  portal: (
    <g>
      <rect width="44" height="44" fill="#fff4ec" />
      <circle cx="22" cy="17" r="6" fill="#e8642c" />
      <path d="M11 34c1.5-6 6-9 11-9s9.5 3 11 9z" fill="#e8642c" />
    </g>
  ),
  mbarta: (
    <g>
      <rect width="44" height="44" fill="#fff8e1" />
      <path d="M11 19h6l12-7v20l-12-7h-6z" fill="#e0a43d" />
      <path d="M17 25l2 8h4l-2-8" fill="#e0a43d" />
    </g>
  ),
  epfo: (
    <g>
      <rect width="44" height="44" fill="#123d7a" />
      <circle cx="22" cy="17" r="6" fill="none" stroke="#f5b400" strokeWidth="2" />
      <path d="M22 13v8m-3-4h6" stroke="#f5b400" strokeWidth="1.6" />
      <text x="22" y="34" textAnchor="middle" fontSize="8" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        EPFO
      </text>
    </g>
  ),
  traces: (
    <g>
      <rect width="44" height="44" fill="#fff7ea" />
      <path d="M22 8 33 13v8c0 7-5 12-11 15-6-3-11-8-11-15v-8z" fill="#d9822b" />
      <text x="22" y="26" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
        TDS
      </text>
    </g>
  ),
  ad: (
    <g>
      <rect x="10" y="10" width="11" height="11" fill="#f25022" />
      <rect x="23" y="10" width="11" height="11" fill="#7fba00" />
      <rect x="10" y="23" width="11" height="11" fill="#00a4ef" />
      <rect x="23" y="23" width="11" height="11" fill="#ffb900" />
    </g>
  ),
  smtp: (
    <g>
      <rect width="44" height="44" fill="#eaf4ff" />
      <rect x="9" y="13" width="26" height="18" rx="3" fill="#2f7ec8" />
      <path d="m10 15 12 9 12-9" stroke="#fff" strokeWidth="2" fill="none" strokeLinejoin="round" />
    </g>
  ),
  sms: (
    <g>
      <rect width="44" height="44" fill="#eefaf3" />
      <path d="M10 13h24a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H19l-6 5v-5h-3a3 3 0 0 1-3-3V16a3 3 0 0 1 3-3z" fill="#0f9f6e" />
      <circle cx="16" cy="21.5" r="1.8" fill="#fff" />
      <circle cx="22" cy="21.5" r="1.8" fill="#fff" />
      <circle cx="28" cy="21.5" r="1.8" fill="#fff" />
    </g>
  ),
};

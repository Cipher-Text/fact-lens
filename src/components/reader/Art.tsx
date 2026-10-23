import type { ReactNode } from "react";

import type { Art as ArtName } from "@/content/reader";

// Editorial illustrations drawn in SVG, so the mock stories have art instead of grey
// placeholders. Colors come from the --art-* variables in reader.css (light and dark).

type Props = {
  name: ArtName;
  /** Prefix for gradient ids, unique on the page. */
  uid: string;
  label?: string;
};

const W = 1600;
const H = 900;

function Frame({
  uid,
  label,
  children,
}: {
  uid: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className="rd-art"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="st-sky1" />
          <stop offset="1" className="st-sky2" />
        </linearGradient>
        <radialGradient id={`${uid}-glow`}>
          <stop offset="0" className="st-sun" />
          <stop offset="1" className="st-sun st-clear" />
        </radialGradient>
        <pattern
          id={`${uid}-dots`}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="20" cy="20" r="1.6" className="art-dot" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill={`url(#${uid}-sky)`} />
      {children}
    </svg>
  );
}

function Sun({
  uid,
  x,
  y,
  r,
}: {
  uid: string;
  x: number;
  y: number;
  r: number;
}) {
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={r * 2.4}
        fill={`url(#${uid}-glow)`}
        className="art-glow"
      />
      <circle cx={x} cy={y} r={r} className="art-sun" />
      <circle cx={x} cy={y} r={r * 1.45} className="art-ring" />
      <circle cx={x} cy={y} r={r * 1.95} className="art-ring art-ring--faint" />
    </g>
  );
}

/** A wave line across the frame, for the sea. */
function wave(y: number, amplitude: number, step = 100) {
  let d = `M0 ${y}`;
  for (let x = 0, i = 0; x < W; x += step, i++) {
    d += ` Q ${x + step / 2} ${y + (i % 2 ? amplitude : -amplitude)} ${x + step} ${y}`;
  }
  return d;
}

function River({ uid, label }: { uid: string; label?: string }) {
  const pins = [
    { x: 225, y: 592 },
    { x: 552, y: 646 },
    { x: 880, y: 640 },
    { x: 1300, y: 572 },
  ];
  return (
    <Frame uid={uid} label={label}>
      <rect width={W} height={H} fill={`url(#${uid}-dots)`} />
      <Sun uid={uid} x={1240} y={240} r={104} />
      <path
        d="M0 560 C 220 500, 420 520, 640 480 S 1060 430, 1300 470 S 1520 500, 1600 470 V 900 H 0 Z"
        className="art-hill"
      />
      <g fill="none" strokeLinecap="round">
        <path
          d="M-120 600 C 240 520, 560 720, 880 640 S 1400 540, 1720 640"
          className="art-w1"
          strokeWidth="130"
        />
        <path
          d="M-120 712 C 260 640, 600 830, 920 760 S 1420 660, 1720 770"
          className="art-w2"
          strokeWidth="104"
        />
        <path
          d="M-120 820 C 280 760, 640 920, 960 870 S 1440 780, 1720 890"
          className="art-w3"
          strokeWidth="96"
        />
        <path
          d="M-120 586 C 240 506, 560 706, 880 626 S 1400 526, 1720 626"
          className="art-flow"
          strokeWidth="3"
        />
        <path
          d="M-120 702 C 260 630, 600 820, 920 750 S 1420 650, 1720 760"
          className="art-flow art-flow--slow"
          strokeWidth="2.5"
        />
        <path
          d="M225 422 C 330 360, 450 420, 552 476 S 760 420, 880 470 S 1180 360, 1300 402"
          className="art-link"
          strokeWidth="3"
        />
      </g>
      {pins.map((pin, index) => (
        <g key={pin.x} className="art-pin">
          <line
            x1={pin.x}
            y1={pin.y - 64}
            x2={pin.x}
            y2={pin.y - 170}
            className="art-stem"
          />
          <circle
            cx={pin.x}
            cy={pin.y - 170}
            r="30"
            className="art-pulse"
            style={{ animationDelay: `${index * 0.6}s` }}
          />
          <circle cx={pin.x} cy={pin.y - 170} r="13" className="art-sun" />
          <circle cx={pin.x} cy={pin.y - 170} r="5" className="art-card" />
        </g>
      ))}
    </Frame>
  );
}

function Gauge({ uid, label }: { uid: string; label?: string }) {
  const bars = [60, 92, 76, 124, 150, 138, 196];
  return (
    <Frame uid={uid} label={label}>
      <rect width={W} height={H} fill={`url(#${uid}-dots)`} />
      <path
        d="M0 560 C 200 530, 420 600, 640 560 S 1080 520, 1300 560 S 1520 600, 1600 570 V 900 H 0 Z"
        className="art-w2"
      />
      <path
        d="M0 640 C 240 610, 460 680, 700 640 S 1140 600, 1600 650 V 900 H 0 Z"
        className="art-w1"
      />
      <path
        d={wave(600, 6, 80)}
        className="art-flow"
        fill="none"
        strokeWidth="3"
      />
      <rect
        x="640"
        y="120"
        width="90"
        height="700"
        rx="10"
        className="art-card"
      />
      {Array.from({ length: 23 }, (_, i) => (
        <line
          key={i}
          x1="640"
          x2={i % 5 === 0 ? 700 : 672}
          y1={150 + i * 30}
          y2={150 + i * 30}
          className="art-tick"
        />
      ))}
      <line x1="560" x2="920" y1="560" y2="560" className="art-level" />
      <rect
        x="760"
        y="538"
        width="120"
        height="44"
        rx="22"
        className="art-sun"
      />
      <line x1="685" y1="120" x2="685" y2="62" className="art-stem" />
      <circle cx="685" cy="50" r="12" className="art-sun" />
      <g fill="none" strokeLinecap="round" className="art-signal">
        <path d="M659 35 A 30 30 0 0 1 711 35" />
        <path d="M637 22 A 55 55 0 0 1 733 22" />
        <path d="M616 10 A 80 80 0 0 1 754 10" />
      </g>
      <path
        d="M770 40 C 880 10, 960 110, 1000 190"
        className="art-link"
        fill="none"
        strokeWidth="3"
      />
      <rect
        x="1000"
        y="170"
        width="420"
        height="290"
        rx="30"
        className="art-card"
      />
      <rect
        x="1040"
        y="204"
        width="150"
        height="16"
        rx="8"
        className="art-muted"
      />
      {bars.map((height, i) => (
        <rect
          key={i}
          x={1040 + i * 52}
          y={420 - height}
          width="32"
          height={height}
          rx="8"
          className={i === bars.length - 1 ? "art-sun" : "art-w2"}
        />
      ))}
    </Frame>
  );
}

const containerColors = ["art-sun", "art-w3", "art-sand", "art-w2", "art-card"];

function Crane({ x, ground }: { x: number; ground: number }) {
  return (
    <g className="art-crane" fill="none" strokeLinecap="square">
      <line x1={x} y1={ground} x2={x} y2={ground - 300} />
      <line x1={x + 120} y1={ground} x2={x + 120} y2={ground - 300} />
      <line x1={x - 10} y1={ground - 220} x2={x + 130} y2={ground - 220} />
      <line x1={x - 440} y1={ground - 300} x2={x + 200} y2={ground - 300} />
      <polyline
        points={`${x},${ground - 300} ${x + 70},${ground - 420} ${x + 140},${ground - 300}`}
      />
      <line
        x1={x + 70}
        y1={ground - 420}
        x2={x - 360}
        y2={ground - 304}
        className="art-crane--thin"
      />
      <line
        x1={x - 300}
        y1={ground - 300}
        x2={x - 300}
        y2={ground - 168}
        className="art-crane--thin"
      />
    </g>
  );
}

function Port({ uid, label }: { uid: string; label?: string }) {
  const rows = [
    { y: 556, count: 10 },
    { y: 512, count: 9 },
    { y: 468, count: 6 },
  ];
  return (
    <Frame uid={uid} label={label}>
      <Sun uid={uid} x={300} y={220} r={92} />
      <rect y="580" width={W} height={H - 580} className="art-w1" />
      {[640, 700, 760, 820].map((y, i) => (
        <path
          key={y}
          d={wave(y, 7 + i, 120)}
          className={i % 2 ? "art-flow art-flow--slow" : "art-flow"}
          fill="none"
          strokeWidth="2.5"
        />
      ))}
      <rect x="1250" y="560" width="400" height="340" className="art-quay" />
      <Crane x={1330} ground={560} />
      <rect x="988" y="270" width="64" height="44" className="art-sun" />
      <path
        d="M240 600 L 1200 600 L 1130 700 L 320 700 Z"
        className="art-ink"
      />
      <rect x="300" y="664" width="860" height="12" className="art-sun" />
      {rows.map((row) =>
        Array.from({ length: row.count }, (_, i) => (
          <rect
            key={`${row.y}-${i}`}
            x={350 + i * 64}
            y={row.y}
            width="60"
            height="40"
            className={containerColors[(i + row.y) % containerColors.length]}
          />
        )),
      )}
      <rect x="1030" y="420" width="96" height="180" className="art-card" />
      <rect x="1044" y="440" width="68" height="16" className="art-ink" />
      <rect x="1060" y="380" width="20" height="40" className="art-ink" />
    </Frame>
  );
}

function Balance({ uid, label }: { uid: string; label?: string }) {
  return (
    <Frame uid={uid} label={label}>
      <rect width={W} height={H} fill={`url(#${uid}-dots)`} />
      <circle cx="800" cy="440" r="330" className="art-disc" />
      <circle cx="800" cy="440" r="330" className="art-ring" />
      <ellipse
        cx="800"
        cy="440"
        rx="560"
        ry="170"
        className="art-orbit"
        transform="rotate(-12 800 440)"
      />
      <ellipse
        cx="800"
        cy="440"
        rx="680"
        ry="250"
        className="art-orbit art-orbit--slow"
        transform="rotate(9 800 440)"
      />
      <circle cx="270" cy="520" r="14" className="art-sun" />
      <circle cx="1330" cy="330" r="18" className="art-w3" />
      <circle cx="1420" cy="560" r="12" className="art-sand" />
      <circle cx="210" cy="300" r="10" className="art-w2" />
      <polygon points="800,452 728,640 872,640" className="art-ink" />
      <rect
        x="690"
        y="640"
        width="220"
        height="18"
        rx="9"
        className="art-ink"
      />
      <line x1="340" y1="472" x2="1260" y2="430" className="art-beam" />
      <circle cx="430" cy="410" r="52" className="art-w2" />
      <circle cx="560" cy="426" r="30" className="art-sun" />
      <circle cx="960" cy="416" r="22" className="art-w1" />
      <circle cx="1050" cy="394" r="40" className="art-sand" />
      <circle cx="1170" cy="383" r="45" className="art-w3" />
      <circle cx="800" cy="452" r="12" className="art-card" />
    </Frame>
  );
}

function Network({ uid, label }: { uid: string; label?: string }) {
  const road =
    "M260 300 C 380 340, 440 400, 520 420 S 800 520, 900 560 S 1180 600, 1290 610";
  const rail = "M260 300 C 420 250, 640 250, 760 300 S 1100 480, 1290 610";
  const river =
    "M380 640 C 500 680, 560 740, 640 712 S 840 630, 920 670 S 1150 720, 1290 610";
  const nodes = [
    { x: 260, y: 300, r: 20 },
    { x: 520, y: 420, r: 12 },
    { x: 760, y: 300, r: 12 },
    { x: 900, y: 560, r: 14 },
    { x: 380, y: 640, r: 12 },
    { x: 640, y: 712, r: 10 },
  ];
  return (
    <Frame uid={uid} label={label}>
      <rect width={W} height={H} fill={`url(#${uid}-dots)`} />
      <path
        d="M1600 340 C 1470 400, 1400 500, 1320 590 S 1190 790, 1110 900 H 1600 Z"
        className="art-w1"
      />
      <path
        d={wave(760, 6, 90)}
        className="art-flow"
        fill="none"
        strokeWidth="2"
        transform="translate(1100 0)"
      />
      <g fill="none" strokeLinecap="round">
        <path d={river} className="art-w3" strokeWidth="18" />
        <path d={river} className="art-flow" strokeWidth="3" />
        <path d={road} className="art-roadline" strokeWidth="10" />
        <path d={rail} className="art-rail" strokeWidth="6" />
        <path d={road} className="art-cargo" strokeWidth="4" />
      </g>
      {nodes.map((node) => (
        <g key={node.x}>
          <circle cx={node.x} cy={node.y} r={node.r + 8} className="art-card" />
          <circle cx={node.x} cy={node.y} r={node.r} className="art-ink" />
        </g>
      ))}
      <circle cx="1290" cy="610" r="44" className="art-pulse" />
      <circle cx="1290" cy="610" r="30" className="art-sun" />
      <circle cx="1290" cy="610" r="12" className="art-card" />
    </Frame>
  );
}

export function Art({ name, uid, label }: Props) {
  switch (name) {
    case "river":
      return <River uid={uid} label={label} />;
    case "gauge":
      return <Gauge uid={uid} label={label} />;
    case "port":
      return <Port uid={uid} label={label} />;
    case "balance":
      return <Balance uid={uid} label={label} />;
    case "network":
      return <Network uid={uid} label={label} />;
  }
}

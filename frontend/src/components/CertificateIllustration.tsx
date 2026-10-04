import { motion } from "framer-motion";

type Variant = "hero" | "problem" | "tamper" | "verifier";

const C = {
  ink: "#293940",
  yellow: "#F6C92E",
  yellowDark: "#C99F00",
  coral: "#E77B68",
  peach: "#F2A38E",
  paper: "#FEFEFE",
  soft: "#EEF0EF",
  line: "#D9DDDC",
  muted: "#AAB2B2",
};

function Head({ x, y, hair = "dark" }: { x: number; y: number; hair?: "dark" | "black" }) {
  return (
    <g>
      <circle cx={x} cy={y} r="22" fill={C.peach} stroke={C.ink} strokeWidth="4" />
      <path
        d={`M${x - 21} ${y - 4}c4-25 38-29 45-2-9-9-23-11-45 2Z`}
        fill={hair === "black" ? "#202B31" : C.ink}
      />
      <circle cx={x + 7} cy={y + 3} r="2.2" fill={C.ink} />
      <path d={`M${x + 10} ${y + 12}q-6 5-12 0`} fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Person({
  x,
  y,
  scale = 1,
  seated = false,
  skin = C.peach,
}: {
  x: number;
  y: number;
  scale?: number;
  seated?: boolean;
  skin?: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <circle cx="0" cy="0" r="25" fill={skin} stroke={C.ink} strokeWidth="4" />
      <path d="M-24-6c3-30 43-35 50-3-13-12-31-12-50 3Z" fill={C.ink} />
      <path d="M-45 116c5-62 24-82 45-82s40 20 45 82Z" fill={C.yellow} stroke={C.ink} strokeWidth="4" />
      <path d="M-28 59l28 27 28-27" fill="none" stroke={C.ink} strokeWidth="3" />
      <path d={seated ? "M-17 115v82M17 115l55 62" : "M-18 114l-7 105M18 114l10 105"} stroke={C.ink} strokeWidth="18" strokeLinecap="round" />
      <path d={seated ? "M-18 195h-29M71 177h30" : "M-12 219h-28M30 219h32"} stroke={C.ink} strokeWidth="12" strokeLinecap="round" />
    </g>
  );
}

function Window({ x, y, w, h, title = "CERTICHAIN" }: { x: number; y: number; w: number; h: number; title?: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="12" fill={C.paper} stroke={C.ink} strokeWidth="5" />
      <rect x={x} y={y} width={w} height="34" rx="12" fill={C.soft} />
      <circle cx={x + 17} cy={y + 17} r="5" fill={C.muted} />
      <circle cx={x + 35} cy={y + 17} r="5" fill={C.line} />
      <circle cx={x + 53} cy={y + 17} r="5" fill={C.yellow} />
      <text x={x + 72} y={y + 22} fontFamily="DM Sans, sans-serif" fontSize="11" fontWeight="800" fill={C.ink}>{title}</text>
    </g>
  );
}

function CertificateCard({ x, y, w = 190, h = 150, tampered = false }: { x: number; y: number; w?: number; h?: number; tampered?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="9" fill={C.paper} stroke={C.ink} strokeWidth="4" />
      <rect x={x + 15} y={y + 17} width={w - 30} height="10" rx="5" fill={C.ink} opacity=".82" />
      <rect x={x + 15} y={y + 39} width={w - 55} height="7" rx="3.5" fill={C.ink} opacity=".18" />
      <rect x={x + 15} y={y + 56} width={w - 80} height="7" rx="3.5" fill={C.ink} opacity=".14" />
      <rect x={x + 15} y={y + 86} width="74" height="8" rx="4" fill={tampered ? C.coral : C.yellow} />
      <rect x={x + 100} y={y + 86} width={w - 115} height="8" rx="4" fill={C.ink} opacity=".1" />
      <circle cx={x + w - 29} cy={y + 118} r="19" fill={tampered ? C.coral : C.yellow} stroke={C.ink} strokeWidth="3" />
      {tampered ? (
        <path d={`M${x + w - 37} ${y + 110}l16 16m0-16-16 16`} stroke={C.ink} strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d={`M${x + w - 39} ${y + 118}l7 7 13-16`} fill="none" stroke={C.ink} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </g>
  );
}

function FloatingIcon({ type, x, y }: { type: "pin" | "mail" | "globe" | "doc" | "chat"; x: number; y: number }) {
  if (type === "pin") return <g transform={`translate(${x} ${y})`}><path d="M0-24c-15 0-26 11-26 25 0 20 26 43 26 43S26 21 26 1C26-13 15-24 0-24Z" fill={C.yellow} stroke={C.ink} strokeWidth="4"/><circle cy="1" r="8" fill={C.paper}/></g>;
  if (type === "mail") return <g transform={`translate(${x} ${y})`}><rect x="-34" y="-24" width="68" height="48" rx="5" fill={C.paper} stroke={C.ink} strokeWidth="4"/><path d="m-31-19 31 25 31-25" fill="none" stroke={C.line} strokeWidth="4"/></g>;
  if (type === "globe") return <g transform={`translate(${x} ${y})`}><circle r="38" fill={C.soft} stroke={C.ink} strokeWidth="4"/><path d="M-38 0h76M0-38c20 18 20 58 0 76M0-38c-20 18-20 58 0 76" fill="none" stroke={C.ink} strokeWidth="4"/></g>;
  if (type === "chat") return <g transform={`translate(${x} ${y})`}><path d="M-35-28h70v48h-42l-18 15 5-15h-15Z" fill={C.yellow} stroke={C.ink} strokeWidth="4"/><circle cx="-12" cy="-4" r="4" fill={C.ink}/><circle cx="0" cy="-4" r="4" fill={C.ink}/><circle cx="12" cy="-4" r="4" fill={C.ink}/></g>;
  return <g transform={`translate(${x} ${y})`}><rect x="-28" y="-36" width="56" height="72" rx="6" fill={C.paper} stroke={C.ink} strokeWidth="4"/><path d="M-15-12h30M-15 2h22M-15 16h28" stroke={C.ink} strokeWidth="4" strokeLinecap="round" opacity=".25"/></g>;
}

function HeroScene() {
  return (
    <>
      <motion.g animate={{ y: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
        <rect x="105" y="330" width="490" height="32" rx="16" fill={C.ink} />
        <rect x="165" y="112" width="370" height="245" rx="18" fill={C.soft} stroke={C.ink} strokeWidth="6" />
        <rect x="183" y="130" width="334" height="195" rx="10" fill={C.paper} />
        <Window x={183} y={130} w={334} h={195} title="DIGITAL CREDENTIAL" />
        <rect x="215" y="185" width="128" height="12" rx="6" fill={C.ink} />
        <rect x="215" y="212" width="190" height="8" rx="4" fill={C.ink} opacity=".16" />
        <CertificateCard x={215} y={238} w={260} h={105} />
        <rect x="316" y="358" width="68" height="28" rx="12" fill={C.ink} />
        <path d="M265 386h170l28 25H237Z" fill={C.ink} />
      </motion.g>
      <Person x={116} y={245} scale={.72} />
      <path d="M145 255q55-28 91-8" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
      <circle cx="234" cy="246" r="8" fill={C.yellow} stroke={C.ink} strokeWidth="3" />
      <FloatingIcon type="mail" x={94} y={110} />
      <FloatingIcon type="pin" x={560} y={92} />
      <FloatingIcon type="doc" x={557} y={285} />
      <FloatingIcon type="chat" x={510} y={370} />
    </>
  );
}

function ProblemScene() {
  return (
    <>
      <FloatingIcon type="doc" x={88} y={104} />
      <FloatingIcon type="doc" x={548} y={95} />
      <Person x={310} y={172} scale={.78} />
      <CertificateCard x={84} y={245} w={190} h={145} />
      <CertificateCard x={347} y={245} w={190} h={145} tampered />
      <path d="M278 310h55" stroke={C.ink} strokeWidth="5" strokeDasharray="10 9" />
      <path d="M298 296l20 14-20 14" fill="none" stroke={C.yellowDark} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="223" y="405" width="174" height="30" rx="15" fill={C.ink} />
      <text x="310" y="425" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="12" fontWeight="800" fill={C.yellow}>COMPARE PROOF</text>
    </>
  );
}

function TamperScene() {
  return (
    <>
      <rect x="74" y="330" width="474" height="22" rx="11" fill={C.yellow} stroke={C.ink} strokeWidth="4" />
      <path d="M105 352v74M510 352v74" stroke={C.ink} strokeWidth="13" />
      <rect x="116" y="92" width="360" height="205" rx="15" fill={C.soft} stroke={C.ink} strokeWidth="5" />
      <rect x="136" y="112" width="320" height="165" rx="10" fill={C.paper} />
      <CertificateCard x={172} y={130} w={245} h={122} tampered />
      <Person x={122} y={206} scale={.65} seated />
      <path d="M155 262q75 26 125 5" fill="none" stroke={C.ink} strokeWidth="10" strokeLinecap="round" />
      <rect x="375" y="360" width="130" height="44" rx="22" fill={C.coral} stroke={C.ink} strokeWidth="4" />
      <text x="440" y="387" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="12" fontWeight="900" fill={C.ink}>TAMPER FOUND</text>
      <FloatingIcon type="chat" x={515} y={120} />
      <FloatingIcon type="doc" x={62} y={190} />
    </>
  );
}

function VerifierScene() {
  return (
    <>
      <FloatingIcon type="globe" x={500} y={100} />
      <FloatingIcon type="pin" x={92} y={120} />
      <rect x="180" y="90" width="260" height="300" rx="38" fill={C.ink} />
      <rect x="194" y="112" width="232" height="250" rx="28" fill={C.paper} />
      <rect x="264" y="100" width="90" height="9" rx="5" fill={C.soft} />
      <rect x="228" y="145" width="164" height="44" rx="22" fill={C.yellow} />
      <text x="310" y="173" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="14" fontWeight="900" fill={C.ink}>SCAN CERTIFICATE</text>
      <rect x="246" y="216" width="128" height="128" rx="8" fill={C.soft} stroke={C.ink} strokeWidth="4" />
      <path d="M264 235h34v12h-12v22h-22ZM356 235h-34v12h12v22h22ZM264 325h34v-12h-12v-22h-22ZM356 325h-34v-12h12v-22h22Z" fill={C.ink} />
      <rect x="295" y="266" width="30" height="30" fill={C.yellow} />
      <Person x={126} y={282} scale={.72} />
      <path d="M152 262q38-35 70-18" fill="none" stroke={C.ink} strokeWidth="5" strokeLinecap="round" />
      <rect x="415" y={300} width="120" height="52" rx="26" fill={C.yellow} stroke={C.ink} strokeWidth="4" />
      <text x="475" y="332" textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize="13" fontWeight="900" fill={C.ink}>VERIFIED</text>
    </>
  );
}

export function CertificateIllustration({ variant = "hero" }: { variant?: Variant }) {
  const scenes = {
    hero: HeroScene,
    problem: ProblemScene,
    tamper: TamperScene,
    verifier: VerifierScene,
  };
  const Scene = scenes[variant];

  return (
    <motion.svg
      viewBox="0 0 620 470"
      className="certificate-art"
      role="img"
      aria-label="CertiChain digital certificate illustration"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.75, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <ellipse cx="310" cy="435" rx="225" ry="18" fill={C.ink} opacity=".1" />
      <Scene />
      <motion.circle
        cx="578"
        cy="390"
        r="8"
        fill={C.yellow}
        stroke={C.ink}
        strokeWidth="3"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}

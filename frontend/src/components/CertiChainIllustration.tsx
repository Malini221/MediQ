import { motion } from "framer-motion";

export function CertificateIllustration({ variant="hero" }: { variant?: "hero"|"problem"|"tamper"|"verifier" }) {
  const bad = variant === "tamper" || variant === "problem";
  return (
    <motion.svg viewBox="0 0 620 470" className="certificate-art" role="img" aria-label="CertiChain certificate illustration"
      initial={{opacity:0,y:18}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{duration:.7}}>
      <ellipse cx="310" cy="430" rx="210" ry="16" fill="#293940" opacity=".1"/>
      <motion.g animate={{y:[0,-5,0]}} transition={{duration:5,repeat:Infinity}}>
        <rect x="150" y="110" width="320" height="230" rx="18" fill="#EEF0EF" stroke="#293940" strokeWidth="5"/>
        <rect x="168" y="128" width="284" height="194" rx="10" fill="#FEFEFE"/>
        <rect x="195" y="170" width="120" height="11" rx="5" fill="#293940"/>
        <rect x="195" y="198" width="190" height="8" rx="4" fill="#293940" opacity=".15"/>
        <rect x="195" y="225" width="220" height="58" rx="8" fill="#F6C92E" opacity=".9"/>
        <circle cx="405" cy="252" r="19" fill={bad ? "#E77B68" : "#F6C92E"} stroke="#293940" strokeWidth="3"/>
        {bad ? <path d="M396 243l18 18m0-18-18 18" stroke="#293940" strokeWidth="4"/> : <path d="M395 252l7 7 13-16" fill="none" stroke="#293940" strokeWidth="4"/>}
      </motion.g>
      <circle cx="105" cy="120" r="32" fill="#F6C92E" stroke="#293940" strokeWidth="4"/>
      <path d="M92 120h26M105 107v26" stroke="#293940" strokeWidth="4" strokeLinecap="round"/>
      <rect x="455" y="355" width="110" height="44" rx="22" fill={bad ? "#E77B68" : "#F6C92E"} stroke="#293940" strokeWidth="4"/>
      <text x="510" y="382" textAnchor="middle" fontFamily="DM Sans" fontSize="12" fontWeight="900" fill="#293940">{bad ? "CHECK PROOF" : "VERIFIED"}</text>
    </motion.svg>
  );
}

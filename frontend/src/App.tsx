import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowUpRight, Check, Download, Menu, QrCode, RotateCcw, Share2, ShieldCheck, X } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { CertificateIllustration } from "./components/CertificateIllustration";

const steps = [
  ["01", "ISSUE", "An institution creates a digital certificate with a unique identity."],
  ["02", "FINGERPRINT", "CertiChain generates a SHA-256 fingerprint for the certificate."],
  ["03", "ANCHOR", "The fingerprint is anchored so the original proof cannot be quietly changed."],
  ["04", "VERIFY", "Anyone can scan or enter the ID and get an instant integrity result."],
];

const footerModes = {
  issue: { label: "ISSUE", title: "CREATE PROOF.", text: "Institutions create certificates with a unique identity and cryptographic fingerprint.", action: "Open issuer flow" },
  verify: { label: "VERIFY", title: "CHECK WHAT'S REAL.", text: "Enter a certificate ID or scan a QR code to compare the document with its anchored proof.", action: "Start verification" },
  revoke: { label: "REVOKE", title: "STOP TRUST WHEN NEEDED.", text: "If a credential should no longer be accepted, its verification state can be marked revoked.", action: "View revocation" },
};

type VerificationState = "idle" | "scanning" | "checking" | "valid" | "tampered" | "revoked" | "invalid";

const demoCertificate = {
  id: "CC-2026-0842",
  student: "Arun Kumar",
  course: "B.E. Computer Science",
  grade: "A+",
  issuer: "ABC Institute of Technology",
  issued: "12 March 2026",
  hash: "8f7a2d91...c31e",
};

type IssuerStep = "dashboard" | "issue" | "ready";

const generatedCertificate = {
  id: "CC-2026-0917",
  student: "Arun Kumar",
  course: "B.E. Computer Science",
  grade: "A+",
  issuer: "ABC Institute of Technology",
  issued: "04 October 2026",
  hash: "9f83d4a1...71ab",
};

async function sha256Fingerprint(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function certificateFingerprint(certificate: {
  id: string;
  student: string;
  course: string;
  grade: string;
  issuer: string;
  issued: string;
}) {
  return sha256Fingerprint(JSON.stringify({
    id: certificate.id,
    student: certificate.student,
    course: certificate.course,
    grade: certificate.grade,
    issuer: certificate.issuer,
    issued: certificate.issued,
  }));
}

function verificationUrl(id: string) {
  return `${window.location.origin}/verify/${encodeURIComponent(id)}`;
}

function CertificateQR({ id, size = 92 }: { id: string; size?: number }) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    let active = true;
    QRCode.toDataURL(verificationUrl(id), { width: size, margin: 1 })
      .then((url) => { if (active) setSrc(url); })
      .catch(() => setSrc(""));
    return () => { active = false; };
  }, [id, size]);
  return src ? <img src={src} width={size} height={size} alt={`QR verification code for ${id}`} /> : <QrCode size={size} />;
}

function certificatePrintWindow(certificate: typeof generatedCertificate) {
  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) return false;
  win.document.write(`<!doctype html><html><head><title>${certificate.id} · CertiChain</title><style>
  *{box-sizing:border-box}body{margin:0;background:#f4f4f1;font-family:Arial,sans-serif;color:#161B1E;padding:40px}
  .sheet{max-width:780px;margin:auto;background:#fff;border:1px solid #dfe2df;padding:52px;text-align:center;box-shadow:12px 12px 0 #F6C92E}
  .top{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding-bottom:14px;font-size:12px;font-weight:800;letter-spacing:2px}
  .seal{width:64px;height:64px;border-radius:50%;background:#F6C92E;display:grid;place-items:center;margin:42px auto 20px;font-size:28px}
  h1{font-size:48px;margin:10px 0;letter-spacing:-2px}p{color:#68716f}.course{font-size:22px;font-weight:800;margin:12px 0 32px}
  .meta{display:flex;justify-content:center;gap:30px;flex-wrap:wrap;border-top:1px solid #ddd;padding-top:20px;font-size:11px}
  .hash{margin-top:35px;text-align:left;border-top:1px solid #ddd;padding-top:18px;font-size:11px}.hash code{display:block;margin-top:8px}
  @media print{body{padding:0;background:#fff}.sheet{box-shadow:none;border:0;max-width:none}}
  </style></head><body><div class="sheet"><div class="top"><span>CERTICHAIN</span><span>VERIFIED CREDENTIAL</span></div>
  <div class="seal">✓</div><div style="font-size:11px;letter-spacing:2px;color:#777">CERTIFICATE OF ACHIEVEMENT</div>
  <h1>${certificate.student}</h1><p>has successfully completed</p><div class="course">${certificate.course}</div>
  <div class="meta"><span>ISSUED BY <b>${certificate.issuer}</b></span><span>DATE <b>${certificate.issued}</b></span><span>ID <b>${certificate.id}</b></span><span>GRADE <b>${certificate.grade}</b></span></div>
  <div class="hash"><b>SHA-256 FINGERPRINT</b><code>${certificate.hash}</code></div></div><script>window.onload=()=>setTimeout(()=>window.print(),250)</script></body></html>`);
  win.document.close();
  return true;
}

async function shareCertificate(certificate: typeof generatedCertificate) {
  const url = verificationUrl(certificate.id);
  if (navigator.share) {
    await navigator.share({ title: "CertiChain certificate", text: `Verify ${certificate.id} on CertiChain`, url });
    return "shared";
  }
  await navigator.clipboard?.writeText(url);
  return "copied";
}

function saveIssuedCertificate(certificate: typeof generatedCertificate) {
  try {
    const raw = localStorage.getItem("certichain:certificates");
    const existing = raw ? JSON.parse(raw) : [];
    const next = Array.isArray(existing)
      ? [...existing.filter((item) => item?.id !== certificate.id), certificate]
      : [certificate];
    localStorage.setItem("certichain:certificates", JSON.stringify(next));
    localStorage.setItem("certichain:latest-certificate", JSON.stringify(certificate));
  } catch {}
}

function loadCertificate(id: string) {
  if (id === demoCertificate.id) return demoCertificate;
  try {
    const raw = localStorage.getItem("certichain:certificates");
    const certificates = raw ? JSON.parse(raw) : [];
    if (Array.isArray(certificates)) {
      const match = certificates.find((item) => item?.id === id);
      if (match) return match;
    }
    const latest = localStorage.getItem("certichain:latest-certificate");
    if (latest) {
      const parsed = JSON.parse(latest);
      if (parsed.id === id) return parsed;
    }
  } catch {}
  return null;
}

function persistRevocation(id: string, reason = "Certificate withdrawn by issuing institution.") {
  localStorage.setItem(`certichain:revoked:${id}`, JSON.stringify({
    revoked: true,
    reason,
    date: new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
  }));
}

function getRevocation(id: string) {
  try {
    const raw = localStorage.getItem(`certichain:revoked:${id}`);
    if (!raw) return null;
    if (raw === "1") return { revoked: true, reason: "Certificate withdrawn by issuing institution.", date: "04 October 2026" };
    const parsed = JSON.parse(raw);
    return parsed?.revoked ? parsed : null;
  } catch {
    return null;
  }
}

function isPersistedRevoked(id: string) {
  return Boolean(getRevocation(id));
}

function RevokeModal({ certificate, onClose, onRevoked }: { certificate: typeof generatedCertificate; onClose: ()=>void; onRevoked: (reason: string)=>void }) {
  const [reason, setReason] = useState("Certificate withdrawn by issuing institution.");
  return <motion.div className="revoke-backdrop" initial={{opacity:0}} animate={{opacity:1}}>
    <motion.div className="revoke-modal" initial={{opacity:0,y:18,scale:.98}} animate={{opacity:1,y:0,scale:1}}>
      <button className="modal-close" onClick={onClose}><X size={18}/></button>
      <span className="verify-card-label">CERTICHAIN / REVOCATION</span>
      <h2>STOP TRUST.</h2>
      <p>Revoking <b>{certificate.id}</b> keeps its proof record but marks the credential as no longer valid.</p>
      <label>Reason<select value={reason} onChange={e=>setReason(e.target.value)}><option>Certificate withdrawn by issuing institution.</option><option>Issued in error.</option><option>Credential replaced.</option><option>Administrative revocation.</option></select></label>
      <div className="revoke-modal-actions"><button onClick={onClose}>CANCEL</button><button className="danger" onClick={()=>onRevoked(reason)}>CONFIRM REVOCATION <X size={16}/></button></div>
    </motion.div>
  </motion.div>;
}

function IssuerPage({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<IssuerStep>("dashboard");
  const [student, setStudent] = useState("");
  const [email, setEmail] = useState("");
  const [course, setCourse] = useState("B.E. Computer Science");
  const [type, setType] = useState("Certificate of Achievement");
  const [grade, setGrade] = useState("A+");
  const [issued, setIssued] = useState("04 October 2026");
  const [created, setCreated] = useState(false);
  const [toast, setToast] = useState("");
  const [showRevoke, setShowRevoke] = useState(false);
  const [issuedCertificate, setIssuedCertificate] = useState(generatedCertificate);

  const issue = async () => {
    if (!student.trim()) return;
    const id = `CC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const fingerprint = await certificateFingerprint({ id, student, course, grade, issuer: "ABC Institute of Technology", issued });
    const certificate = { id, student, course, grade, issuer: "ABC Institute of Technology", issued, hash: fingerprint };
    setIssuedCertificate(certificate);
    saveIssuedCertificate(certificate);
    setStep("ready");
    setCreated(true);
  };

  return <main className="issuer-page">
    <nav className="nav issuer-nav">
      <button className="brand brand-button" onClick={onBack}><span className="brand-mark">C</span><span>CertiChain</span></button>
      <div className="issuer-nav-center"><span>ISSUER PORTAL</span><b>ABC Institute of Technology</b></div>
      <button className="issuer-back" onClick={onBack}>Public site <ArrowUpRight size={15}/></button>
    </nav>

    <section className="issuer-shell">
      <aside className="issuer-sidebar">
        <div className="issuer-profile"><div className="issuer-avatar">AI</div><div><b>ABC Institute</b><span>Issuer account</span></div></div>
        <button className={step==="dashboard"?"active":""} onClick={()=>setStep("dashboard")}><span>01</span> Dashboard</button>
        <button className={step==="issue"?"active":""} onClick={()=>setStep("issue")}><span>02</span> Issue certificate</button>
        <button className={step==="ready"?"active":""} onClick={()=>setStep("ready")} disabled={!created}><span>03</span> Latest certificate</button>
        <div className="issuer-sidebar-note"><ShieldCheck size={18}/><span>Every issued credential receives a unique ID and SHA-256 fingerprint.</span></div>
      </aside>

      <div className="issuer-content">
        {step==="dashboard" && <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <div className="issuer-heading"><div><p className="eyebrow"><span/> Institution workspace</p><h1>ISSUER<br/><em>DASHBOARD.</em></h1><p>Issue, track and manage trusted digital credentials from one place.</p></div><button className="issue-primary" onClick={()=>setStep("issue")}>+ ISSUE NEW CERTIFICATE <ArrowUpRight size={17}/></button></div>
          <div className="issuer-stats">
            {[["1,284","Total issued","↑ 12% this month"],["1,241","Active","96.6% of issued"],["43","Revoked","3.4% of issued"],["8,492","Verifications","↑ 18% this month"]].map(([v,l,s],i)=><motion.div key={l} initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} transition={{delay:i*.08}}><span>{l}</span><strong>{v}</strong><small>{s}</small></motion.div>)}
          </div>
          <div className="issuer-main-grid">
            <div className="issuer-panel"><div className="panel-title"><div><span>RECENT CERTIFICATES</span><h2>Latest issued</h2></div><button onClick={()=>setStep("issue")}>Issue new <ArrowUpRight size={15}/></button></div>
              <div className="certificate-list">
                {[["Arun Kumar","B.E. Computer Science","CC-2026-0842","A+","ACTIVE"],["Meera Priya","B.Sc. Information Technology","CC-2026-0839","A","ACTIVE"],["Rahul Dev","B.E. Cyber Security","CC-2026-0827","A+","ACTIVE"],["Nila Shree","BCA","CC-2026-0814","B+","REVOKED"]].map((x,i)=><div className="certificate-row" key={x[2]}><div className="row-index">0{i+1}</div><div className="row-person"><b>{x[0]}</b><span>{x[1]}</span></div><code>{x[2]}</code><strong>{x[3]}</strong><span className={x[4]==="ACTIVE"?"row-status active":"row-status revoked"}>{x[4]}</span><button onClick={()=>setStep("ready")}><ArrowUpRight size={16}/></button></div>)}
              </div>
            </div>
            <div className="issuer-panel issuer-side-panel"><div className="panel-title"><div><span>VERIFICATION ACTIVITY</span><h2>Today</h2></div></div><div className="activity-number">284</div><p>public verification checks</p><div className="activity-bars">{[42,68,53,84,61,76,92].map((h,i)=><span key={i} style={{height:`${h}%`}}/>)}</div><div className="activity-footer"><span>Blockchain matches</span><b>98.7%</b></div></div>
          </div>
        </motion.div>}

        {step==="issue" && <motion.div initial={{opacity:0,x:25}} animate={{opacity:1,x:0}}>
          <div className="issuer-heading compact"><div><p className="eyebrow"><span/> New credential</p><h1>ISSUE<br/><em>CERTIFICATE.</em></h1><p>Enter the achievement details. CertiChain will create the document, fingerprint it and prepare its verification proof.</p></div><button className="text-back" onClick={()=>setStep("dashboard")}>← Dashboard</button></div>
          <div className="issue-layout">
            <div className="issue-form issuer-panel">
              <div className="form-section-title"><span>01</span><div><b>RECIPIENT</b><small>Who is receiving this credential?</small></div></div>
              <label>Student name<input value={student} onChange={e=>setStudent(e.target.value)} placeholder="e.g. Arun Kumar"/></label>
              <label>Email address<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="student@example.com" type="email"/></label>
              <div className="form-section-title second"><span>02</span><div><b>CREDENTIAL</b><small>Define what the certificate proves.</small></div></div>
              <label>Certificate type<select value={type} onChange={e=>setType(e.target.value)}><option>Certificate of Achievement</option><option>Course Completion</option><option>Internship Certificate</option><option>Academic Excellence</option></select></label>
              <label>Course / program<input value={course} onChange={e=>setCourse(e.target.value)} /></label>
              <div className="form-two"><label>Grade<select value={grade} onChange={e=>setGrade(e.target.value)}><option>A+</option><option>A</option><option>B+</option><option>B</option></select></label><label>Issue date<input value={issued} onChange={e=>setIssued(e.target.value)} /></label></div>
              <button className="generate-button" onClick={issue} disabled={!student.trim()}>GENERATE CERTIFICATE <ArrowUpRight size={18}/></button>
            </div>
            <div className="issue-preview issuer-panel"><div className="panel-title"><div><span>LIVE PREVIEW</span><h2>Credential</h2></div><CertificateIllustration variant="hero"/></div><div className="preview-sheet"><span>CERTICHAIN</span><small>{type.toUpperCase()}</small><h3>{student || "Student Name"}</h3><p>has successfully completed</p><b>{course}</b><div className="preview-grade">{grade}</div><div><span>ISSUED BY</span> ABC INSTITUTE <span>ID</span> PENDING</div></div><div className="preview-note"><ShieldCheck size={17}/><span>Fingerprint and blockchain anchor are generated after you issue.</span></div></div>
          </div>
        </motion.div>}

        {step==="ready" && <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <div className="ready-banner"><div><p className="eyebrow"><span/> Issuance complete</p><h1>CERTIFICATE<br/><em>READY.</em></h1><p>Your credential has a unique identity, a SHA-256 fingerprint and a blockchain anchor.</p></div><div className="ready-check"><Check size={34}/><span>ANCHORED</span></div></div>
          <div className="ready-grid">
            <div className="issuer-panel generated-sheet"><div className="generated-top"><span>CERTICHAIN</span><span>VERIFIED CREDENTIAL</span></div><div className="generated-body"><div className="mini-seal"><Check size={24}/></div><small>{type.toUpperCase()}</small><h2>{issuedCertificate.student}</h2><p>has successfully completed</p><strong>{issuedCertificate.course}</strong><div className="generated-grade"><span>FINAL GRADE</span><b>{issuedCertificate.grade}</b></div><div className="generated-meta"><span>ISSUED BY <b>{issuedCertificate.issuer}</b></span><span>DATE <b>{issuedCertificate.issued}</b></span><span>ID <b>{issuedCertificate.id}</b></span></div></div><div className="generated-bottom"><div><span>SHA-256 FINGERPRINT</span><code>{issuedCertificate.hash}</code></div><CertificateQR id={issuedCertificate.id} size={62}/></div></div>
            <div className="ready-details"><div className="issuer-panel proof-status"><span>ISSUANCE PROOF</span><h2>Ready to trust.</h2>{[["CERTIFICATE ID", issuedCertificate.id],["SHA-256", issuedCertificate.hash],["BLOCKCHAIN","ANCHORED ✓"],["QR VERIFICATION","GENERATED ✓"]].map(x=><div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b></div>)}</div><div className="ready-actions"><button onClick={()=>{const ok=certificatePrintWindow(issuedCertificate); if(ok){setToast("Print dialog opened — choose Save as PDF."); setTimeout(()=>setToast(""),2600)}}}><Download size={16}/> DOWNLOAD / PDF</button>
              <button onClick={async()=>{try{const result=await shareCertificate(issuedCertificate);setToast(result==="shared"?"Share sheet opened.":"Verification link copied.");setTimeout(()=>setToast(""),2200)}catch{setToast("Sharing cancelled.");setTimeout(()=>setToast(""),1800)}}}><Share2 size={16}/> SHARE PROOF</button>
              <button className="dark" onClick={()=>{window.history.pushState({}, "", verificationUrl(issuedCertificate.id)); window.dispatchEvent(new PopStateEvent("popstate"))}}>VERIFY CERTIFICATE <ArrowUpRight size={16}/></button>
              <button onClick={()=>setShowRevoke(true)}><RotateCcw size={16}/> REVOKE CERTIFICATE</button>
              <button onClick={()=>setStep("dashboard")}>BACK TO DASHBOARD</button>
              {toast && <motion.div className="issuer-toast" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>{toast}</motion.div>}
              {showRevoke && <RevokeModal certificate={issuedCertificate} onClose={()=>setShowRevoke(false)} onRevoked={(reason)=>{persistRevocation(issuedCertificate.id, reason);setShowRevoke(false);setToast("Certificate revoked.");setTimeout(()=>setToast(""),2200)}}/>}</div></div></div>
        </motion.div>}
      </div>
    </section>
  </main>;
}

function VerifyPage({ onBack, initialCertificateId }: { onBack: () => void; initialCertificateId?: string }) {
  const [mode, setMode] = useState<"id" | "qr">("id");
  const [certificateId, setCertificateId] = useState(initialCertificateId || demoCertificate.id);
  const [status, setStatus] = useState<VerificationState>("idle");
  const [demoTampered, setDemoTampered] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [shared, setShared] = useState(false);
  const [currentFingerprint, setCurrentFingerprint] = useState("");
  const [record, setRecord = useState(() => loadCertificate(initialCertificateId || demoCertificate.id));
  const [revoked, setRevoked] = useState(() => isPersistedRevoked(initialCertificateId || demoCertificate.id));
  const revocation = record ? getRevocation(record.id) : null;

  const verify = () => {
    const found = loadCertificate(certificateId);
    setRecord(found);
    setCurrentFingerprint(found?.hash || "");
    setStatus("scanning");
    window.setTimeout(() => setStatus("checking"), 700);
    window.setTimeout(() => {
      if (!found) return setStatus("invalid");
      const isRevoked = isPersistedRevoked(found.id);
      setRevoked(isRevoked);
      setStatus(isRevoked ? "revoked" : demoTampered ? "tampered" : "valid");
    }, 1700);
  };

  const reset = () => {
    setStatus("idle");
    setDemoTampered(false);
    setCurrentFingerprint(record?.hash || demoCertificate.hash);
    setCertificateId(demoCertificate.id);
    setRecord(loadCertificate(demoCertificate.id));
  };

  const simulateTamper = async () => {
    setDemoTampered(true);
    const found = record || demoCertificate;
    const tamperedCertificate = { ...found, grade: found.grade === "A+" ? "A++" : `${found.grade}*` };
    const tamperedHash = found.id === demoCertificate.id
      ? "4b12a7c4...91aa"
      : await certificateFingerprint(tamperedCertificate);
    setCurrentFingerprint(tamperedHash);
    setStatus("checking");
    window.setTimeout(() => setStatus("tampered"), 900);
  };

  const simulateRevoke = () => {
    setDemoTampered(false);
    persistRevocation(demoCertificate.id, "Certificate withdrawn by issuing institution.");
    setRevoked(true);
    setStatus("checking");
    window.setTimeout(() => setStatus("revoked"), 900);
  };

  const busy = status === "scanning" || status === "checking";

  return (
    <main className="verify-page">
      <nav className="nav verify-nav">
        <button className="brand brand-button" onClick={onBack}><span className="brand-mark">C</span><span>CertiChain</span></button>
        <div className="verify-nav-right"><span>PUBLIC VERIFICATION</span><button onClick={onBack}>Back to home <ArrowUpRight size={15}/></button></div>
      </nav>

      <section className="verify-hero section-pad">
        <motion.div className="verify-intro" initial={{opacity:0,x:-30}} animate={{opacity:1,x:0}} transition={{duration:.65}}>
          <p className="eyebrow"><span/> Public verification</p>
          <h1>VERIFY<br/><em>WHAT’S REAL.</em></h1>
          <p>Enter a certificate ID or scan its QR code. We compare the document against its original cryptographic proof.</p>
          <div className="verify-proof-row">
            <span><ShieldCheck size={16}/> SHA-256 fingerprint</span>
            <span><ShieldCheck size={16}/> Blockchain anchored</span>
          </div>
        </motion.div>

        <motion.div className="verify-card-wrap" initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:.7,delay:.1}}>
          <div className="verify-card">
            <div className="verify-card-head"><div><span className="verify-card-label">CERTICHAIN / CHECK</span><h2>Certificate proof</h2></div><CertificateIllustration variant="verifier"/></div>
            <div className="verify-tabs">
              <button className={mode==="id"?"active":""} onClick={()=>{setMode("id");reset()}}>Certificate ID</button>
              <button className={mode==="qr"?"active":""} onClick={()=>{setMode("qr");reset()}}><QrCode size={16}/> Scan QR</button>
            </div>

            {mode === "id" ? (
              <div className="verify-input-area">
                <label>Certificate ID</label>
                <div className="verify-input">
                  <input value={certificateId} onChange={(e)=>setCertificateId(e.target.value.toUpperCase())} placeholder="CC-2026-0842" disabled={busy}/>
                  <span>●</span>
                </div>
                <p>Try the demo ID <button onClick={()=>setCertificateId(demoCertificate.id)}>{demoCertificate.id}</button></p>
                <button className="verify-main-button" onClick={verify} disabled={busy || !certificateId.trim()}>
                  {busy ? "VERIFYING..." : "VERIFY CERTIFICATE"} {!busy && <ArrowUpRight size={18}/>}
                </button>
              </div>
            ) : (
              <div className="qr-scanner">
                <div className={`qr-frame ${busy ? "active" : ""}`}>
                  <span className="corner tl"/><span className="corner tr"/><span className="corner bl"/><span className="corner br"/>
                  <QrCode size={90}/>
                  {busy && <motion.div className="scan-line" animate={{y:[-45,45,-45]}} transition={{duration:1.3,repeat:Infinity,ease:"easeInOut"}}/>}
                </div>
                <strong>{busy ? "Reading QR proof..." : "Align a certificate QR code"}</strong>
                <p>This demo scanner loads the sample certificate when you start verification.</p>
                <button className="verify-main-button" onClick={verify} disabled={busy}>{busy ? "SCANNING..." : "SCAN & VERIFY"} <QrCode size={17}/></button>
              </div>
            )}

            <AnimateVerifyStatus status={status} demoTampered={demoTampered} />
          </div>
        </motion.div>
      </section>

      {status === "invalid" && (
        <motion.section className="verification-result tampered-result" initial={{opacity:0,y:35}} animate={{opacity:1,y:0}}>
          <div className="result-topline"><span>00 / NOT FOUND</span><span className="status-pill bad"><X size={15}/> INVALID</span></div>
          <div className="result-grid"><div><div className="big-status"><span className="status-icon bad-icon"><X size={34}/></span><div><p>VERIFICATION FAILED</p><h2>CERTIFICATE<br/><em>NOT FOUND.</em></h2></div></div><p className="result-copy">No certificate with ID <b>{certificateId}</b> exists in the CertiChain verification record.</p></div><div className="tamper-visual"><CertificateIllustration variant="tamper"/></div></div>
          <div className="demo-controls"><span>CHECK ANOTHER</span><button onClick={reset}>VERIFY ANOTHER</button></div>
        </motion.section>
      )}

      {status === "valid" && (
        <motion.section className="verification-result valid-result" initial={{opacity:0,y:35}} animate={{opacity:1,y:0}}>
          <div className="result-topline"><span>01 / VERIFIED</span><span className="status-pill valid"><Check size={15}/> ACTIVE</span></div>
          <div className="result-grid">
            <div>
              <div className="big-status"><span className="status-icon"><Check size={34}/></span><div><p>VERIFICATION COMPLETE</p><h2>CERTIFICATE<br/><em>VERIFIED.</em></h2></div></div>
              <p className="result-copy">The submitted certificate matches the original cryptographic fingerprint anchored by the issuer.</p>
              <div className="result-actions"><button onClick={()=>setShowCertificate(true)}>VIEW CERTIFICATE <ArrowUpRight size={17}/></button><button onClick={async()=>{try{const result=await shareCertificate(record || demoCertificate);setShared(true);window.setTimeout(()=>setShared(false),1800)}catch{setShared(false)}}}><Share2 size={17}/> SHARE</button>{shared && <motion.span className="share-toast" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>LINK COPIED ✓</motion.span>}</div>
            </div>
            <CertificateProofCard certificate={record || demoCertificate} />
          </div>
          <div className="demo-controls"><span>DEMO CONTROLS</span><button onClick={simulateTamper}>SIMULATE TAMPERING <ArrowUpRight size={16}/></button><button onClick={simulateRevoke}>SIMULATE REVOCATION <ArrowUpRight size={16}/></button><button onClick={reset}>VERIFY ANOTHER</button></div>
        </motion.section>
      )}

      {showCertificate && <CertificatePreview certificate={record || demoCertificate} onClose={()=>setShowCertificate(false)} />}\n\n      {status === "tampered" && (
        <motion.section className="verification-result tampered-result" initial={{opacity:0,y:35}} animate={{opacity:1,y:0}}>
          <div className="result-topline"><span>02 / INTEGRITY FAILURE</span><span className="status-pill bad"><X size={15}/> MISMATCH</span></div>
          <div className="result-grid">
            <div>
              <div className="big-status"><span className="status-icon bad-icon"><X size={34}/></span><div><p>INTEGRITY CHECK FAILED</p><h2>TAMPER<br/><em>DETECTED.</em></h2></div></div>
              <p className="result-copy">The current document no longer matches the fingerprint originally anchored for this certificate.</p>
              <div className="hash-compare"><div><span>ORIGINAL FINGERPRINT</span><code>{(record || demoCertificate).hash}</code></div><div><span>CURRENT FINGERPRINT</span><code className="bad-code">{currentFingerprint}</code></div></div>
            </div>
            <div className="tamper-visual"><CertificateIllustration variant="tamper"/><div className="tamper-stamp"><X size={18}/> HASH MISMATCH</div></div>
          </div>
          <div className="demo-controls"><span>DEMO CONTROLS</span><button onClick={reset}>RESTORE ORIGINAL</button><button onClick={simulateRevoke}>SIMULATE REVOCATION <ArrowUpRight size={16}/></button></div>
        </motion.section>
      )}

      {status === "revoked" && (
        <motion.section className="verification-result revoked-result" initial={{opacity:0,y:35}} animate={{opacity:1,y:0}}>
          <div className="result-topline"><span>03 / STATUS CHANGE</span><span className="status-pill revoked"><X size={15}/> REVOKED</span></div>
          <div className="result-grid">
            <div>
              <div className="big-status"><span className="status-icon revoked-icon"><X size={34}/></span><div><p>PROOF MATCHED / STATUS FAILED</p><h2>CERTIFICATE<br/><em>REVOKED.</em></h2></div></div>
              <p className="result-copy">The certificate is authentic, but the issuing institution has withdrawn its validity.</p>
              <div className="revocation-box"><strong>Revoked on {revocation?.date || "04 October 2026"}</strong><span>Reason: {revocation?.reason || "Certificate withdrawn by issuing institution."}</span></div>
            </div>
            <CertificateProofCard certificate={record || demoCertificate} revoked/>
          </div>
          <div className="demo-controls"><span>DEMO CONTROLS</span><button onClick={reset}>VERIFY ANOTHER</button></div>
        </motion.section>
      )}

      <section className="verify-how section-pad">
        <div className="section-kicker">HOW THE CHECK WORKS / 02</div>
        <div className="verify-how-grid">
          {[
            ["01","READ","Certificate ID or QR identifies the credential."],
            ["02","FINGERPRINT","The current document is represented as a SHA-256 hash."],
            ["03","COMPARE","The fingerprint is compared with the anchored original."],
            ["04","RESULT","CertiChain returns valid, tampered or revoked."],
          ].map(([n,t,d],i)=><motion.article key={n} initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08}}><span>{n}</span><h3>{t}</h3><p>{d}</p></motion.article>)}
        </div>
      </section>

      <footer className="verify-footer"><button onClick={onBack}>← CERTICHAIN</button><span>VERIFY ONCE. TRUST INSTANTLY.</span><span>SHA-256 · BLOCKCHAIN · QR</span></footer>
    </main>
  );
}


function CertificatePreview({ onClose, certificate = demoCertificate }: { onClose: () => void; certificate?: typeof demoCertificate }) {
  return (
    <motion.div className="certificate-modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={onClose}>
      <motion.div className="certificate-modal" initial={{opacity:0,y:28,scale:.97}} animate={{opacity:1,y:0,scale:1}} transition={{duration:.35,ease:[.25,.1,.25,1]}} onClick={(e)=>e.stopPropagation()}>
        <div className="certificate-modal-top">
          <div><span>CERTICHAIN / VERIFIED DOCUMENT</span><h2>Certificate preview</h2></div>
          <button onClick={onClose} aria-label="Close certificate preview"><X size={20}/></button>
        </div>
        <div className="certificate-sheet">
          <div className="certificate-sheet-top"><span>CERTICHAIN</span><span>VERIFIED CREDENTIAL</span></div>
          <div className="certificate-sheet-body">
            <div className="certificate-seal"><Check size={30}/><span>VERIFIED</span></div>
            <p className="certificate-overline">CERTIFICATE OF ACHIEVEMENT</p>
            <h3>{certificate.student}</h3>
            <p>has successfully completed</p>
            <strong>{certificate.course}</strong>
            <div className="certificate-grade"><span>FINAL GRADE</span><b>{certificate.grade}</b></div>
            <div className="certificate-meta"><span>ISSUED BY <b>{certificate.issuer}</b></span><span>DATE <b>{certificate.issued}</b></span><span>ID <b>{certificate.id}</b></span></div>
          </div>
          <div className="certificate-sheet-bottom"><div className="certificate-hash"><span>SHA-256 FINGERPRINT</span><code>{certificate.hash}</code></div><div className="certificate-qr"><CertificateQR id={certificate.id} size={62}/><span>SCAN TO VERIFY</span></div></div>
        </div>
        <div className="certificate-modal-actions"><button onClick={()=>{setShared(true);window.setTimeout(()=>setShared(false),1800)}}>SHARE PROOF <ArrowUpRight size={17}/></button><button className="dark-modal-button" onClick={onClose}>CLOSE PREVIEW</button>{shared && <span className="share-toast modal-toast">LINK COPIED ✓</span>}</div>
      </motion.div>
    </motion.div>
  );
}

function AnimateVerifyStatus({status,demoTampered}:{status:VerificationState;demoTampered:boolean}) {
  if(status==="idle"||status==="valid"||status==="tampered"||status==="revoked") return null;
  const steps=status==="scanning"
    ? ["READING CERTIFICATE","IDENTIFYING CREDENTIAL","PREPARING PROOF"]
    : ["GENERATING SHA-256 FINGERPRINT","CHECKING ANCHORED PROOF","COMPARING INTEGRITY"];
  return <motion.div className="verify-progress" initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}}><div className="progress-orbit"><motion.span animate={{rotate:360}} transition={{duration:1.8,repeat:Infinity,ease:"linear"}}><ShieldCheck size={25}/></motion.span></div><div><p>{steps[0]}</p><motion.div className="progress-bar" animate={{scaleX:[.2,1,.35]}} transition={{duration:1.2,repeat:Infinity}}/><small>{demoTampered ? "Preparing integrity comparison..." : steps[1]}</small></div></motion.div>;
}

function CertificateProofCard({certificate,revoked=false}:{certificate:typeof demoCertificate;revoked?:boolean}) {
  return <div className="proof-card"><div className="proof-card-title"><span>CERTIFICATE RECORD</span><QrCode size={28}/></div><h3>{certificate.student}</h3><p>{certificate.course}</p><div className="proof-details"><div><span>GRADE</span><b>{certificate.grade}</b></div><div><span>ISSUER</span><b>{certificate.issuer}</b></div><div><span>ISSUED</span><b>{certificate.issued}</b></div><div><span>ID</span><b>{certificate.id}</b></div></div><div className="proof-checks"><span><Check size={14}/> FINGERPRINT MATCHED</span><span><Check size={14}/> BLOCKCHAIN VERIFIED</span><span className={revoked?"revoked-check":""}>{revoked?<X size={14}/>:<Check size={14}/>} {revoked?"STATUS REVOKED":"STATUS ACTIVE"}</span></div></div>;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const [tampered, setTampered] = useState(false);
  const [footerMode, setFooterMode] = useState<keyof typeof footerModes>("verify");
  const { scrollYProgress } = useScroll();

  if (route === "/verify" || route.startsWith("/verify/")) {
    const pathId = route.startsWith("/verify/") ? decodeURIComponent(route.slice("/verify/".length)) : "";
    const queryId = new URLSearchParams(window.location.search).get("certificate") || "";
    return <VerifyPage initialCertificateId={pathId || queryId || undefined} onBack={() => { window.history.pushState({}, "", "/"); setRoute("/"); }} />;
  }
  if (route === "/issuer") return <IssuerPage onBack={() => { window.history.pushState({}, "", "/"); setRoute("/"); }} />;
  const heroY = useTransform(scrollYProgress, [0, 0.18], [0, -80]);
  const footer = footerModes[footerMode];

  return (
    <main className="site-shell">
      <nav className="nav">
        <a href="#" className="brand"><span className="brand-mark">C</span><span>CertiChain</span></a>
        <div className={`nav-links ${menuOpen ? "open" : ""}`}>
          <a href="#how">How it works</a><a href="#tamper">Tamper check</a><a href="#for">Built for</a>
          <button className="nav-verify nav-route-button" onClick={() => { window.history.pushState({}, "", "/verify"); setRoute("/verify"); }}>Verify certificate <ArrowUpRight size={17}/></button>
        </div>
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">{menuOpen ? <X/> : <Menu/>}</button>
      </nav>

      <section className="hero section-pad">
        <motion.div className="hero-copy" style={{ y: heroY }}>
          <p className="eyebrow"><span/> Digital certificate verification</p>
          <h1>VERIFY<br/><em>WHAT’S REAL.</em></h1>
          <p className="hero-lede">Certificates should prove achievement — not create doubt. CertiChain makes authenticity visible in seconds.</p>
          <div className="hero-actions"><button className="button button-dark route-button" onClick={() => { window.history.pushState({}, "", "/verify"); setRoute("/verify"); }}>VERIFY CERTIFICATE <ArrowUpRight size={18}/></button><button className="button button-light route-button" onClick={() => { window.history.pushState({}, "", "/issuer"); setRoute("/issuer"); }}>ISSUE CERTIFICATE</button></div>
          <div className="hero-proof"><ShieldCheck size={19}/><span>Cryptographic fingerprint + blockchain anchor</span></div>
        </motion.div>
        <motion.div className="hero-art" initial={{opacity:0,scale:.94,y:20}} animate={{opacity:1,scale:1,y:0}} transition={{duration:.8,ease:"easeOut"}}><CertificateIllustration variant="hero"/></motion.div>
        <div className="hero-number">01 / 08</div>
      </section>

      <section className="yellow-band"><div className="marquee"><span>ISSUE</span><b>→</b><span>HASH</span><b>→</b><span>ANCHOR</span><b>→</b><span>VERIFY</span><b>→</b><span>TRUST</span></div></section>

      <section className="problem section-pad">
        <div className="section-kicker">THE PROBLEM / 02</div>
        <div className="split"><div><h2>A certificate can be copied.<br/><span>Its proof shouldn’t.</span></h2><p>PDFs can be edited. Screenshots can be reused. Manual checks slow down institutions and recruiters. CertiChain gives every certificate a verifiable digital fingerprint.</p></div><CertificateIllustration variant="problem"/></div>
      </section>

      <section className="dark-section section-pad" id="how">
        <div className="section-kicker light">THE FLOW / 03</div>
        <div className="dark-heading"><h2>FROM DOCUMENT<br/><span>TO TRUST.</span></h2><p>One clean lifecycle. No complicated verification journey.</p></div>
        <div className="step-grid">{steps.map(([n,title,text],i)=><motion.article className="step-card" key={n} initial={{opacity:0,y:28}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*.08}}><span>{n}</span><h3>{title}</h3><p>{text}</p></motion.article>)}</div>
      </section>

      <section className="tamper section-pad" id="tamper">
        <div className="section-kicker">THE WOW MOMENT / 04</div>
        <div className="tamper-head"><div><h2>CHANGE ONE<br/><span>DETAIL.</span></h2><p>Watch the fingerprint mismatch turn a trusted certificate into a detected alteration.</p></div><button className="toggle" onClick={()=>setTampered(!tampered)}>{tampered ? "Restore original" : "Modify certificate"} <ArrowUpRight size={17}/></button></div>
        <div className="tamper-demo">
          <div className="certificate-mini"><div className="mini-top"><span>CERTICHAIN</span><QrCode size={38}/></div><strong>Certificate of Achievement</strong><p>Student: <b>Arun Kumar</b></p><p>Program: <b>Computer Science</b></p><p>Grade: <b className={tampered?"changed":""}>{tampered?"A++":"A+"}</b></p><div className="mini-line"/><small>ID: CC-2026-0842</small></div>
          <div className="hash-panel"><div><span>ORIGINAL FINGERPRINT</span><code>8f7a...c31e</code></div><div><span>CURRENT FINGERPRINT</span><code className={tampered?"bad":""}>{tampered?"4b12...91aa":"8f7a...c31e"}</code></div><div className={`result ${tampered?"bad":"good"}`}>{tampered?<X size={21}/>:<Check size={21}/>}<div><b>{tampered?"TAMPER DETECTED":"CERTIFICATE VERIFIED"}</b><small>{tampered?"The current document no longer matches its anchored proof.":"Document matches the anchored fingerprint."}</small></div></div></div>
          <CertificateIllustration variant="tamper"/>
        </div>
      </section>

      <section className="audience section-pad" id="for">
        <div className="section-kicker">WHO IT SERVES / 05</div>
        <div className="audience-grid">
          <article><span>01</span><h3>Institutions</h3><p>Issue trusted certificates, keep a clean verification trail and revoke when necessary.</p><button className="inline-link route-button" onClick={() => { window.history.pushState({}, "", "/issuer"); setRoute("/issuer"); }}>Issuer portal <ArrowUpRight size={17}/></button></article>
          <article><span>02</span><h3>Students</h3><p>Carry one certificate proof that can be shared without asking someone to manually confirm it.</p><button className="inline-link route-button" onClick={() => { window.history.pushState({}, "", "/verify"); setRoute("/verify"); }}>My certificate <ArrowUpRight size={17}/></button></article>
          <article><span>03</span><h3>Verifiers</h3><p>Scan a QR or enter an ID and know whether the document is original, tampered or revoked.</p><button className="inline-link route-button" onClick={() => { window.history.pushState({}, "", "/verify"); setRoute("/verify"); }}>Verify now <ArrowUpRight size={17}/></button></article>
        </div>
      </section>

      <section className="cta section-pad" id="verify"><div className="cta-art"><CertificateIllustration variant="verifier"/></div><div><div className="section-kicker">FINAL CHECK / 06</div><h2>TRUST IT.<br/><span>OR DON’T.</span></h2><p>Enter a certificate ID or scan its QR code. CertiChain checks the document against its original cryptographic proof.</p><button className="button button-dark route-button" onClick={() => { window.history.pushState({}, "", "/verify"); setRoute("/verify"); }}>START VERIFICATION <ArrowUpRight size={18}/></button></div></section>

      <footer className="footer-cta section-pad" id="issue">
        <div className="footer-top"><span>CertiChain</span><span>Verify once. Trust instantly.</span></div>
        <div className="footer-interactive">
          <div className="footer-big">MAKE<br/><em>TRUST</em><br/>VERIFIABLE.</div>
          <div className="footer-panel">
            <div className="footer-tabs" role="tablist">
              {(Object.keys(footerModes) as Array<keyof typeof footerModes>).map((mode) => <button key={mode} className={footerMode===mode ? "active" : ""} onClick={()=>setFooterMode(mode)}>{footerModes[mode].label}</button>)}
            </div>
            <motion.div key={footerMode} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:.25}}>
              <p className="footer-panel-kicker">CERTICHAIN / {footer.label}</p>
              <h3>{footer.title}</h3><p>{footer.text}</p>
              <button className="footer-action route-button" onClick={() => { window.history.pushState({}, "", footerMode==="issue" ? "/issuer" : "/verify"); setRoute(footerMode==="issue" ? "/issuer" : "/verify"); }}>{footer.action} <ArrowUpRight size={17}/></button>
            </motion.div>
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 CertiChain</span><span>Issue · Verify · Revoke</span><span>Built for digital credentials</span></div>
      </footer>
    </main>
  );
}
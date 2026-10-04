import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import QRCode from "qrcode";

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

const certificates = new Map();

const canonicalHash = (certificate) => crypto
  .createHash("sha256")
  .update(JSON.stringify({
    id: certificate.id,
    student: certificate.student,
    course: certificate.course,
    grade: certificate.grade,
    issuer: certificate.issuer,
    issued: certificate.issued,
  }))
  .digest("hex");

const seed = {
  id: "CC-2026-0842",
  student: "Arun Kumar",
  course: "B.E. Computer Science",
  grade: "A+",
  issuer: "ABC Institute of Technology",
  issued: "12 March 2026",
  status: "ACTIVE",
  revokedAt: null,
  revocationReason: null,
  blockchainVerified: true,
};
seed.hash = canonicalHash(seed);
certificates.set(seed.id, seed);

function publicCertificate(certificate) {
  return { ...certificate };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "CertiChain API" });
});

app.get("/api/dashboard/stats", (_req, res) => {
  const values = [...certificates.values()];
  const revoked = values.filter((c) => c.status === "REVOKED").length;
  res.json({
    totalIssued: 1284 + values.length - 1,
    active: 1241 + values.length - 1 - revoked,
    revoked: 43 + revoked,
    verifications: 8492,
  });
});

app.get("/api/certificates", (_req, res) => {
  res.json([...certificates.values()].map(publicCertificate));
});

app.get("/api/certificates/:id", (req, res) => {
  const certificate = certificates.get(req.params.id);
  if (!certificate) return res.status(404).json({ error: "Certificate not found" });
  res.json(publicCertificate(certificate));
});

app.post("/api/certificates", (req, res) => {
  const { student, course, grade, issuer = "ABC Institute of Technology", issued, type = "Certificate of Achievement" } = req.body || {};
  if (!student || !course || !issued) {
    return res.status(400).json({ error: "student, course and issued are required" });
  }

  const id = `CC-${new Date().getFullYear()}-${String(8000 + certificates.size + 1).slice(-4)}`;
  const certificate = {
    id, student, course, grade: grade || "A+", issuer, issued, type,
    status: "ACTIVE", revokedAt: null, revocationReason: null, blockchainVerified: true,
  };
  certificate.hash = canonicalHash(certificate);
  certificates.set(id, certificate);

  res.status(201).json({
    certificate: publicCertificate(certificate),
    blockchain: { anchored: true, transaction: `demo-${crypto.randomBytes(8).toString("hex")}` },
  });
});

app.get("/api/verify/:id", (req, res) => {
  const certificate = certificates.get(req.params.id);
  if (!certificate) {
    return res.status(404).json({
      status: "NOT_FOUND",
      integrity: "UNKNOWN",
      blockchainVerified: false,
      message: "Certificate not found",
    });
  }

  const currentHash = canonicalHash(certificate);
  const integrity = currentHash === certificate.hash ? "ORIGINAL" : "TAMPERED";
  const status = certificate.status === "REVOKED" ? "REVOKED" : integrity === "TAMPERED" ? "TAMPERED" : "VALID";

  res.json({
    status,
    integrity,
    blockchainVerified: certificate.blockchainVerified,
    certificate: publicCertificate(certificate),
    originalHash: certificate.hash,
    currentHash,
  });
});

app.patch("/api/certificates/:id/revoke", (req, res) => {
  const certificate = certificates.get(req.params.id);
  if (!certificate) return res.status(404).json({ error: "Certificate not found" });

  certificate.status = "REVOKED";
  certificate.revokedAt = new Date().toISOString();
  certificate.revocationReason = req.body?.reason || "Certificate withdrawn by issuing institution.";

  res.json({ success: true, certificate: publicCertificate(certificate) });
});

app.get("/api/certificates/:id/qr", async (req, res) => {
  const certificate = certificates.get(req.params.id);
  if (!certificate) return res.status(404).json({ error: "Certificate not found" });

  const verificationUrl = `${req.protocol}://${req.get("host")}/verify/${certificate.id}`;
  const dataUrl = await QRCode.toDataURL(verificationUrl, { margin: 1, width: 260 });
  res.json({ certificateId: certificate.id, verificationUrl, dataUrl });
});

app.listen(PORT, () => {
  console.log(`CertiChain API running on http://localhost:${PORT}`);
});

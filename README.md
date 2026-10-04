# CertiChain

This repository has been repurposed from MediQ into **CertiChain — Verify once. Trust instantly.**

## Current flow
Issue → SHA-256 fingerprint → QR → Verify → VALID / TAMPERED / REVOKED

The active frontend is in `frontend/` and uses React, TypeScript, Vite, Framer Motion and Lucide React. The active demo API is `frontend/server/index.mjs`.

The old MediQ modules remain in the repository for now but are no longer the application entry point. They can be removed after the converted CertiChain build is verified.

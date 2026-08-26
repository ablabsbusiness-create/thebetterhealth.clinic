# DPDP Act 2023 + IT Act 2000 / SPDI Rules 2011 — what has to change

Assessed 2026-08-22 against the code in this repo and the live project.
**Not legal advice.** A lawyer should sign off the final wording and the
organisational items; this covers what is verifiable in the system.

Two things matter for scope:

- Health records are **sensitive personal data** under SPDI Rule 3, which raises
  the bar above ordinary personal data.
- This is a **paediatric** practice, so nearly every data principal is a child.
  DPDP §9 applies to almost the entire database, not an edge case.

---

## P0 — Security. Nothing else counts until these are done

DPDP §8(5) (reasonable security safeguards) · IT Act §43A · SPDI Rule 8

| # | Change | Where | Evidence today |
|---|---|---|---|
| 1 | Require authentication in Firestore + Storage rules | `firebase/firestore.rules`, `firebase/storage.rules` | `request.auth` appears **0 times**. Verified live: unauthenticated read of `clinics/kid/…` returns **HTTP 200**; a path outside `/clinics` correctly returns 403 |
| 2 | Per-user staff accounts (Firebase Auth) replacing the one shared clinic password | `emr/kid/lib/auth.js` | Single `CLINIC_ACCESS_PASSWORD`, 12h cookie. No attribution of who did what |
| 3 | Flip route protection from allowlist to denylist | `emr/kid/lib/auth.js` `PROTECTED_PATHS` | `/certificates`, `/parent-details`, `/pdf-viewer`, `/growth-chart-preview` are **not listed at all**, so they load without the clinic password. `/certificates` reads patient data and issues medical certificates |
| 4 | Authenticate or rate-limit patient creation | `/api/patients/create`, `/new-patient` | Both declared public — anyone can create patient records |
| 5 | Replace permanent public prescription links with short-lived signed URLs | `/rx?i=<id>`, Storage PDFs | `/rx` is public and Storage objects are world-readable; the download token in the URL never expires |
| 6 | Add an access/audit log — who read or changed which record, and when | new | No audit trail exists. Expected by SPDI Rule 8 and the EHR Standards 2016 |
| 7 | Enable Firebase App Check | Firebase console + `lib/firebase-init.js` | API key is hardcoded in the client bundle (unavoidable for web) and nothing binds it to your origins |
| 8 | Document encryption in transit/at rest | policy | Firebase provides both by default; it needs stating, not building |

---

## P1 — Notice and consent

DPDP §5 (notice), §6 (consent) · SPDI Rules 4, 5(1)

| # | Change | Where |
|---|---|---|
| 9 | Fix the `/tos` route — it 404s in production | routing / `vercel.json` |
| 10 | Show an itemised notice **at the point of collection**, not only a link | `intake.html`, `new-patient.html`, `portal.html` |
| 11 | Explicit unticked consent checkbox; record consent artifact (timestamp, policy version, purpose, phone/identity) | intake + portal |
| 12 | Withdrawal of consent, as easy as giving it (§6(4)–(6)) | portal |
| 13 | State purpose limitation — clinical care only, no secondary use | policy |

Today `portal.html:1018` says *"By continuing, you agree to our Terms of Use and
Privacy Policy"* — that is a click-through to a broken link, and no consent
record is stored anywhere.

---

## P2 — Children. Highest legal exposure here

DPDP §9

| # | Change |
|---|---|
| 14 | **Verifiable parental consent** before processing a child's data — establish that the person consenting is the parent/guardian, and record the relationship |
| 15 | Keep the ban on behavioural tracking and targeted advertising to children (§9(3)) |
| 16 | Use the DOB already captured to branch consent handling for under-18s |

The QR self-check-in (`/intake`) is the weak point: anyone can submit a child's
name, DOB, phone, email and blood group with nothing establishing who they are.

---

## P3 — Data principal rights

DPDP §11 (access), §12 (correction/erasure), §13 (grievance), §14 (nomination) ·
SPDI Rule 5(6), 5(9)

| # | Change |
|---|---|
| 17 | Machine-readable export of everything held about a patient |
| 18 | Correction request path, and an erasure path that actually deletes (`deleteDoc` currently exists only for prescription templates and certificates — never for patient data) |
| 19 | **Named grievance officer** with contact and response SLA, published |
| 20 | Nomination — allow a data principal to nominate someone to exercise rights |

---

## P4 — Retention and lifecycle

DPDP §8(7)

| # | Change |
|---|---|
| 21 | Define a retention period. Note the tension: NMC/MCI guidance is 3 years for medical records, but DPDP requires erasure once purpose is served — for minors this usually means retaining to majority + N years. Needs the lawyer's call |
| 22 | Implement scheduled erasure or anonymisation once the period lapses |
| 23 | State the period in the policy |

Nothing in the codebase deletes or ages out patient data today.

---

## P5 — Breach response

DPDP §8(6)

| # | Change |
|---|---|
| 24 | Documented process to notify the Data Protection Board **and** each affected data principal, with detection/alerting to make that possible |

---

## P6 — Processors and transfers

DPDP §8(2) (fiduciary remains liable for processors), §16 (cross-border)

| # | Change | Note |
|---|---|---|
| 25 | Data processing agreements with Google (Firebase), MSG91, Vercel | |
| 26 | Correct the processor list in the policy | It currently says **Firebase Phone Authentication**; the portal moved to **MSG91**. A notice naming the wrong processor is a defect in the notice itself |
| 27 | Treat WhatsApp prescription sharing as disclosure to a third party — disclose it and gate it on consent | `preview.html` WhatsApp button |
| 28 | Self-host or disclose CDN calls | `html2canvas`/`jsPDF` load from jsdelivr, exposing patient-device IPs to a third party |
| 29 | Confirm and document the Firebase region for data residency | §16 permits transfer except to restricted countries; EHR Standards 2016 prefer local storage |

---

## P7 — Documentation and organisation

| # | Change |
|---|---|
| 30 | Rewrite the policy to reference the DPDP Act and IT Act/SPDI Rules explicitly, and add grievance, breach, correction, retention, children and cross-border sections. It currently mentions **none** of these by name |
| 31 | Record of processing activities |
| 32 | Staff access policy and training; revoke access on exit |
| 33 | Assess whether §10 Significant Data Fiduciary duties are triggered (children's health data makes this plausible) — if so: DPO in India, DPIA, annual audit |

---

## What exists already and is fine

- `tos/index.html` is a real policy with sections on health records, children's
  information, retention, security and rights — it needs updating, not writing
  from scratch.
- No analytics is wired up. `measurementId` is present but `getAnalytics` is
  never called, so there is no behavioural tracking of children — which would
  breach §9(3).
- Portal access is OTP-verified, which is a sound basis for patient identity
  once the database rules stop being open to everyone.

---

## Suggested order

1. **P0 #1–#3 together.** Tightening the rules alone will break the app, because
   nothing currently authenticates; the staff accounts and route protection have
   to land in the same change.
2. **P1 #9** — a one-line routing fix, independently useful.
3. **P2** — the children's consent flow, the largest legal exposure.
4. Everything else in priority order.

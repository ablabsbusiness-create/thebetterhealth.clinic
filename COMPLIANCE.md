# DPDP Act 2023 + IT Act 2000 / SPDI Rules 2011 — what has to change

Assessed 2026-08-22 against the code in this repo and the live project.
**Not legal advice.** A lawyer should sign off the final wording and the
organisational items; this covers what is verifiable in the system.

Two things matter for scope:

- Health records are **sensitive personal data** under SPDI Rule 3, which raises
  the bar above ordinary personal data.
- This is a **paediatric** practice, so nearly every data principal is a child.
  DPDP §9 applies to almost the entire database, not an edge case.

**Deadline, confirmed 2026-08-27:** the DPDP Rules 2025 were notified
13 November 2025. Full substantive compliance — notice, consent, security
safeguards, breach reporting, data principal rights, retention limits, and
Significant Data Fiduciary duties if triggered — becomes enforceable
**13 May 2027**. This is no longer an open-ended "should get to this
eventually" list.

---

## P0 — Security. Nothing else counts until these are done

DPDP §8(5) (reasonable security safeguards) · IT Act §43A · SPDI Rule 8

| # | Change | Where | Evidence today |
|---|---|---|---|
| 1 | Require authentication in Firestore + Storage rules | `firebase/firestore.rules`, `firebase/storage.rules` | **Done for both clinics.** `clinics/kid` and `clinics/lungs` now both require `request.auth != null`. Closing this for lungs required more than a rules edit: lungs never signed in to Firebase Auth at all (only a session cookie), and `intake.html`/`portal.html` queried Firestore directly from the browser — both fixed (custom token minted in `api/lungs/auth/login.js`, `signInWithClinicToken` wired into `emr/lungs/password.html`/`lib/firebase-init.js`, and `intake.html`/`portal.html` moved to `api/lungs/intake/submit.js` and `api/lungs/portal/records.js` + `api/lungs/prescriptions/[id].js` on admin credentials). `portal.html`'s pre-OTP `findPatientsByPhone()` call — which let anyone probe whether a phone number was a lungs patient before verifying the code — was removed in the same pass; records are now only fetched after OTP verification, scoped to the session phone |
| 2 | Per-user staff accounts (Firebase Auth) replacing the one shared clinic password | `emr/kid/lib/auth.js` | Single `CLINIC_ACCESS_PASSWORD`, 12h cookie. No attribution of who did what. Per-user accounts remain deprioritized given current clinic scale (one doctor, one staff member) — see project notes. **Brute-force lockout added regardless**: `api/kid/auth/login.js` and `api/lungs/auth/login.js` now rate-limit login attempts per IP (5 attempts / 10 minutes, reusing `api/_lib/otp-rate-limit.js`), closing the "no lockout on the shared PIN" gap independent of the per-user-accounts decision |
| 3 | Flip route protection from allowlist to denylist | `emr/kid/lib/auth.js` `PROTECTED_PATHS` | `/certificates`, `/parent-details`, `/pdf-viewer`, `/growth-chart-preview` are **not listed at all**, so they load without the clinic password. `/certificates` reads patient data and issues medical certificates. **Same class of bug found and fixed in lungs**: root `middleware.js` (the file Vercel actually deploys — the per-app `emr/kid/middleware.js` / `emr/lungs/middleware.js` copies are dev-only) only listed a kid app entry; lungs had **no production route protection at all**. It now has a matching `APPS` entry, and `emr/lungs/lib/auth.js`'s own `PROTECTED_PATHS` gained `/edit-patient` and `/prescription-growth-chart-dashboard`, which were missing there too |
| 4 | Authenticate or rate-limit patient creation | `/api/patients/create`, `/new-patient` | Both declared public — anyone can create patient records |
| 5 | Replace permanent public prescription links with short-lived signed URLs | `/rx?i=<id>`, Storage PDFs | `/rx` is public and Storage objects are world-readable; the download token in the URL never expires. **`api/lungs/prescriptions/[id].js`** now exists, mirroring `api/kid/prescriptions/[id].js`, so lungs prescription links also resolve to short-lived signed URLs instead of a live client Storage read |
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

| # | Change | Status |
|---|---|---|
| 17 | Machine-readable export of everything held about a patient | **Done** — `api/kid/portal/export.js`, wired into the portal Settings tab |
| 18 | Correction request path, and an erasure path that actually deletes (`deleteDoc` currently exists only for prescription templates and certificates — never for patient data) | **Request path done** — `api/kid/portal/rights-request.js` logs correction/erasure requests to `clinics/kid/rightsRequests` for staff review. Not auto-deleting yet: an open retention floor (`RETENTION-DECISION.md`) means an erasure request could conflict with a still-live recordkeeping obligation, so a human reviews before anything is deleted |
| 19 | **Named grievance officer** with contact and response SLA, published | **Done** — Aaditya Bhatnagar / ablabs.business@gmail.com, `tos/index.html` §10, 30-day response SLA stated |
| 20 | Nomination — allow a data principal to nominate someone to exercise rights | Not started |

---

## P4 — Retention and lifecycle

DPDP §8(7)

| # | Change | Status |
|---|---|---|
| 21 | Define a retention period. Note the tension: NMC/MCI guidance is 3 years for medical records, but DPDP requires erasure once purpose is served — for minors this usually means retaining to majority + N years. Needs the lawyer's call | **Framed, not decided** — see `RETENTION-DECISION.md` for the options and tension laid out for a lawyer; this cannot be closed by code |
| 22 | Implement scheduled erasure or anonymisation once the period lapses | Blocked on #21 |
| 23 | State the period in the policy | Blocked on #21 — `tos/index.html` §7 currently references "the period required by applicable healthcare recordkeeping norms" as a placeholder pending that decision |

Nothing in the codebase deletes or ages out patient data today. The false
claim that rejected/unreviewed self-check-ins are **automatically** deleted
after 30 days has been corrected in `tos/index.html` §7 — no such job exists,
so the policy now says so plainly instead of asserting automation that isn't
built, and points parents to a manual deletion request in the meantime.

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
| 25 | Data processing agreements with Google (Firebase), MSG91, Vercel | **Action list drafted, not executed** — see `DATA-PROCESSING-AGREEMENTS.md`. Each requires a console click-through or a direct vendor request outside this repo, so it can't be marked done from code alone |
| 26 | Correct the processor list in the policy | Already correct — `tos/index.html` §3/§4 name **MSG91**, not Firebase Phone Auth; no stale reference found |
| 27 | Treat WhatsApp prescription sharing as disclosure to a third party — disclose it and gate it on consent | **Done** — `tos/index.html` §4 now lists WhatsApp/Meta as a recipient |
| 28 | Self-host or disclose CDN calls | **Disclosed** — `tos/index.html` §4 now names jsDelivr and what it can see. Self-hosting the libraries instead is still open, tracked separately from the disclosure |
| 29 | Confirm and document the Firebase region for data residency | Still open — needs checking in the Firebase console for the `clinci-dr-gunda` project and stating the result in the policy |

---

## P7 — Documentation and organisation

| # | Change | Status |
|---|---|---|
| 30 | Rewrite the policy to reference the DPDP Act and IT Act/SPDI Rules explicitly, and add grievance, breach, correction, retention, children and cross-border sections. It currently mentions **none** of these by name | Partially addressed via the retention/sharing edits above; a full named-statute rewrite of `tos/index.html` is still open |
| 31 | Record of processing activities | **Done** — `RECORD-OF-PROCESSING-ACTIVITIES.md` |
| 32 | Staff access policy and training; revoke access on exit | Not started |
| 33 | Assess whether §10 Significant Data Fiduciary duties are triggered (children's health data makes this plausible) — if so: DPO in India, DPIA, annual audit | **Done** — `SIGNIFICANT-DATA-FIDUCIARY-ASSESSMENT.md` concludes not applicable at current scale; revisit on the triggers listed there |

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

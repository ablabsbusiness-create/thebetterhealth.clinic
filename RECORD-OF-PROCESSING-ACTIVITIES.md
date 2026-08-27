# Record of processing activities (RoPA) — kid clinic

**Not legal advice.** DPDP Act 2023 does not name a RoPA as an explicit
statutory document the way GDPR Art. 30 does, but maintaining one is standard
practice for demonstrating the §8(5) "reasonable security safeguards" and
§10 Significant Data Fiduciary duties, and it is what a Data Protection Board
inquiry or a breach investigation would ask for first. Built from the actual
code paths in this repo as of 2026-08-27, scoped to the kid clinic (the more
built-out of the two).

| # | Activity | Data collected | Source file(s) | Purpose | Legal basis | Recipients | Retention |
|---|---|---|---|---|---|---|---|
| 1 | QR self check-in | Child name, parent name, gender, DOB, phone, email, blood group, guardian relationship, consent flag/timestamp/policy version | `api/kid/intake/submit.js` | Let a parent pre-register a child before a walk-in visit | Consent (checkbox required at submission) | Clinic staff (review queue) | Pending decision — see `RETENTION-DECISION.md`; rejected/unreviewed submissions currently retained indefinitely (ToS commits to future 30-day auto-deletion, not yet built) |
| 2 | Patient record creation | Same fields as #1, plus allocated `TBK####` patient ID | `api/kid/patients/create.js` | Create the authoritative clinical record once staff approve an intake or register a walk-in | Consent + healthcare provision | Clinic staff and doctors | Pending decision — see `RETENTION-DECISION.md` |
| 3 | Prescription / visit history | Prescription PDF, storage path, preview image, patient ID, visit date | `api/kid/prescriptions/[id].js`, Firebase Storage | Clinical record of each visit; lets a parent view/download past prescriptions | Healthcare provision | Clinic staff, patient's own parent/guardian via portal | Pending decision — see `RETENTION-DECISION.md` |
| 4 | Patient portal OTP verification | Phone number, MSG91 access token (not stored — verified then discarded), signed session cookie | `api/kid/otp/[action].js`, MSG91 | Verify the person requesting portal access is the phone number on file for a patient | Consent + legitimate interest (fraud/identity prevention) | MSG91 (SMS delivery only) | Session cookie: 30 days (`PATIENT_SESSION_TTL_SECONDS`); no OTP code is retained |
| 5 | Portal record access | Phone (from verified session), patient ID, history entries returned | `api/kid/portal/records.js` | Let a parent view their child's own visit history | Consent (implicit in requesting access) + healthcare provision | The requesting parent/guardian only (scoped to their registered phone) | N/A — read path, not a new store |
| 6 | Data export (self-service) | Same as #2 + #3, serialized to JSON | `api/kid/portal/export.js` | DPDP §11 right to access — a machine-readable copy of everything held | Consent / statutory right | The requesting parent/guardian only | N/A — generated on demand, not stored |
| 7 | Rights requests (correction/erasure) | Requester phone, patient ID, free-text request details, request type, status | `api/kid/portal/rights-request.js`, `clinics/kid/rightsRequests` | DPDP §12/§13 — logs a correction or erasure request for staff review | Statutory right | Clinic staff only | Until resolved + an audit period (not yet defined) |
| 8 | Clinic staff login | Shared clinic password (not itself patient data), session cookie, Firebase custom token | `api/kid/auth/login.js`, `emr/kid/lib/auth.js` | Authenticate staff/doctor access to the clinic app | Legitimate interest (system security) | None external | Session cookie: 12 hours |
| 9 | Cross-clinic phone existence check | Phone number only (no other fields) | `api/kid/otp/[action].js` (`user-exists`, `check`) | Let the shared MSG91 OTP widget determine whether to send an OTP, without exposing which specific record matched | Legitimate interest (abuse/rate-limit prevention) | MSG91 (as the caller of this endpoint) | Rate-limit counters only (10-minute rolling window), no phone-to-identity mapping stored beyond the patient record itself |
| 10 | WhatsApp prescription sharing | Prescription PDF/document, recipient's WhatsApp number (entered by staff or parent) | `preview.html` WhatsApp share button | Let a parent receive their prescription via WhatsApp on request | Consent (the parent/staff actively choosing to share) | WhatsApp/Meta | Not stored by this system beyond the source document; WhatsApp/Meta's own retention applies to the message itself |

## Processors (see `DATA-PROCESSING-AGREEMENTS.md` for DPA status)

- **Google Firebase / Google Cloud** — hosting, Firestore, Storage, Auth.
- **MSG91** — OTP SMS delivery.
- **Vercel** — website/API hosting.
- **jsDelivr (CDN)** — serves `html2canvas`/`jsPDF` libraries; sees requesting
  device IPs, no patient data.
- **WhatsApp (Meta)** — only when a prescription is actively shared via the
  WhatsApp button.

## Known gaps this record surfaces

- Rows #1–#3 have no defined retention period — blocked on
  `RETENTION-DECISION.md`.
- No access/audit log exists yet distinguishing which staff member read or
  changed a given record (`COMPLIANCE.md` item #6) — this RoPA describes what
  data moves, not who specifically touched it each time.
- This document covers the **kid** clinic only. The **lungs** clinic has a
  materially smaller feature set (no intake, no patient creation, no portal
  records API found in `api/lungs/`) and needs its own RoPA once those
  features exist or are confirmed absent.

## Maintenance

Update this table whenever a new endpoint reads or writes patient data, or an
existing one changes what fields it touches — it is only useful if it stays
current with the code.

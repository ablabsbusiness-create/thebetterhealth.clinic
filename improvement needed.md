# Improvement Needed — Feature Gaps vs Docon EMR

Compiled by logging into the live Docon EMR (docon.co.in/emr) and auditing this codebase (`emr/kid`) against it.

## Missing entirely

1. **Certificates** — Docon has a certificate library generatable per-patient: Fitness, Leave after illness, Leave during illness, Swimming, Fitness w/o Immunization, Fitness adult, Mother Leave, Discharge Summary, COVID Medical Certificate, plus a "Make your Own Form" custom builder. Nothing like this exists in `emr/kid` — no certificate generation of any kind.

2. **Billing / payments** — Docon tracks per-patient billing history (date, bill no., bill amount, amount paid, amount due) with an "Add Bill / Payment" action and a running "₹ Due" balance shown on the patient header. `emr/kid` has no billing, invoicing, or payment tracking at all.

3. **Attachments** — Docon lets you upload/store arbitrary images against a patient record (separate from lab reports). Not present in `emr/kid`.

4. **Investigation reports tab** — Docon has a dedicated "Reports" tab for uploading/viewing lab/investigation reports per patient. Not present in `emr/kid`.

5. **Video consultation / teleconsult** — Docon supports a "Video Call" button for remote consults. `emr/kid`'s patient portal literally shows "Appointment booking is coming soon" — no video/teleconsult capability exists.

6. **Follow-up / Repeat visit (one-click)** — Docon has a "Follow-up/Repeat" button that opens a new consult pre-filled with the previous visit's symptoms, findings, and medicines for a fast repeat prescription. `emr/kid` only stores a `followUpDate` field — no prefill-from-last-visit workflow.

7. **Named, reusable consult templates** — Docon lets a doctor save an entire consult (symptoms + findings + diagnosis + medicines together) as one named template, then browse/search/sort a template list ("Adithia", "URTI", "6 Week Vaccination", etc.) and reapply it in one click. `emr/kid` only has per-field quick-pick chip suggestions (single symptom/finding/medicine at a time) — there's no "save this whole visit as a template" or template library UI.

8. **Mid-Parental Height calculator** — Docon's Growth tab includes a Father's Height / Mother's Height calculator alongside the growth charts. Not present in `emr/kid`'s growth charts.

9. **Medicine dosage warning banner** — Docon shows an explicit "You have added few medicines without dosage" warning. `emr/kid` has dose-chip UI to help fill dosage but no explicit warning banner if it's left blank.

10. **Today's queue with Seen/Cancelled tabs** — Docon's home screen shows a live daily queue (Queue / Seen / Cancelled tabs, date navigation, patient cards). `emr/kid`'s `pending-approvals.html` queue is only for parent-submitted intake awaiting approval, not a real daily patient visit queue with today's appointments.

11. **Explicit "Merge duplicate patients" action** — Docon has a one-click "Merge Patient" tool for duplicate profiles. `emr/kid` has automatic duplicate-detection/collapsing logic in search, but no explicit user-facing merge action.

## Confirmed strong / already on par or ahead

- **Vaccination matrix** — `emr/kid` (`vaccination.html`) already has a full IAP-style schedule grid with brand-name entries and a modal — on par with Docon's vaccine matrix. Worth double-checking it also surfaces an "X overdue" count and a "Print Chart" action like Docon's.
- **Growth charts** (Weight/Height/BMI/OFC vs Age) — present and using IAP reference curves, just missing the mid-parental height piece (#8 above).
- **Symptom/findings quick-pick chips** — present and comparable to Docon's chip UX.
- **Patient search** (name/mobile/ID) and "Add New Patient" fallback — present and comparable.

## Things `emr/kid` has that Docon's public site didn't show

- QR-code based reception check-in (`reception-qr.html`)
- Self-service parent portal / intake flow feeding a pending-approvals queue (`intake.html`, `portal.html`, `parent-details.html`)
- Installable PWA support (`sw.js`, manifest, offline app download flow)

## Suggested priority order

1. Certificates (high visible value, doctors ask for these constantly — fitness/leave certs)
2. Follow-up/Repeat one-click consult
3. Named consult templates (bundled, not per-field)
4. Billing/payments tracking
5. Today's queue (Queue/Seen/Cancelled) on the home screen
6. Investigation reports tab + Attachments
7. Mid-parental height calculator, dosage warning banner, explicit merge-patient action
8. Video consultation (larger lift, lower urgency for a solo/small practice)

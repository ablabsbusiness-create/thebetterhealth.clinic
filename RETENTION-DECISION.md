# Medical record retention period

**Status: adopted by the user 2026-08-27, not lawyer-vetted.** This still
isn't legal advice, and a lawyer should ideally confirm this reading before
it's relied on in a dispute — but the user directed "follow what DPDP says"
rather than waiting on outside counsel, so this document now records a real
decision instead of just framing the choice. The tension and options below
are kept as the reasoning trail.

## Decision

**Retain a paediatric patient's record until they turn 18, then 3 more
years — anonymize at age 21** (Option 2 below). Reasoning, from the statute
itself: DPDP §8(7) says erase once the purpose is no longer served *unless
another law requires retention*. For an active paediatric patient,
continuity of care (growth/vaccination/allergy history) means the purpose is
plausibly still being served throughout childhood — so retention through age
18 is itself DPDP-compliant, not a violation. NMC/MCI Regulation 1.3 is the
"another law" that then adds its own 3-year floor on top, counted from when
the patient stops being a paediatric patient (age 18). 18 + 3 = 21.

This applies to the **kid** clinic. The **lungs** clinic sees adults, so the
childhood-purpose reasoning doesn't apply there — its records follow the
plain NMC floor: **3 years from the last visit**, with no "until 18" step.

## The tension (kept for context)

## The tension

- **NMC/MCI Code of Ethics Regulations, 2002** (Regulation 1.3) requires
  medical records to be preserved for **3 years** from the date of
  commencement of treatment.
- **DPDP Act 2023 §8(7)** requires a data fiduciary to erase personal data
  once the purpose for which it was collected is no longer being served and
  retention is not required by law — i.e. retention cannot be indefinite by
  default, only for as long as a specific legal or clinical purpose demands
  it.
- For a **minor**, "as long as the purpose is served" is not obviously 3
  years from the visit — continuity of paediatric care (growth history,
  vaccination history, allergy history) plausibly extends the legitimate
  purpose until adulthood or later. There is no single Indian statute that
  states "retain until age 18 + N years" for paediatric records; that
  synthesis is exactly what needs a lawyer's judgment.

## What's changed: the DPDP Rules 2025 are now in force

Checked 2026-08-27. The **DPDP Rules 2025 were notified on 13 November
2025** ([source](https://www.india-briefing.com/news/dpdp-rules-2025-india-data-protection-law-compliance-40769.html/)),
which sharpens two things this document previously had to leave open:

- The Rules set a **minimum retention floor of one year** for personal
  data, traffic data, and processing logs generally. That's a floor, not
  an answer for medical records specifically — it doesn't resolve the
  3-years-vs-purpose-served tension above, but it does rule out "delete
  almost immediately" as ever being compliant.
- **Full substantive compliance — including retention limits — becomes
  enforceable 13 May 2027** (18 months after notification). That is a real
  operational deadline now, not a someday item: whichever option the
  lawyer picks needs to be implemented before then.
- **Significant Data Fiduciary threshold rules are still expected in
  2026, not yet published** as of this check — see
  `SIGNIFICANT-DATA-FIDUCIARY-ASSESSMENT.md`, whose "not yet notified"
  conclusion still holds but should be re-checked as that 2026 window
  closes.

None of this picks an option below for the lawyer — it just means the
choice has a hard deadline attached now.

## Options to put in front of the lawyer

1. **3 years from last visit** (bare NMC minimum) — simplest to implement,
   likely too short for a paediatric practice where continuity of care across
   childhood is the actual clinical purpose being served.
2. **Until the patient turns 18, + 3 years** — ties retention to the
   patient's own capacity to exercise their DPDP rights directly, plus the
   NMC minimum after that point. Common approach for paediatric records
   internationally, but not itself an Indian statutory anchor.
3. **A fixed long window (e.g. 25 years from DOB) regardless of last visit**
   — administratively simple, but likely retains data well past when the
   purpose is served for patients who stopped attending the clinic young,
   which cuts against §8(7).

Option 2 was adopted (see Decision above). A lawyer confirming this in
writing is still worth doing, since it strengthens the position if ever
challenged, but it is no longer blocking implementation.

## What this decision unblocked

- `tos/index.html` §7 now states the real numbers instead of the old
  placeholder — done in this pass.
- A scheduled anonymization job now exists: `api/kid/cron/retention-sweep.js`
  (age ≥ 21) and `api/lungs/cron/retention-sweep.js` (3 years since last
  visit), registered as daily Vercel Cron jobs in `vercel.json`. **Both
  default to dry-run** (`KID_RETENTION_SWEEP_LIVE` / `LUNGS_RETENTION_SWEEP_LIVE`
  unset or not `"true"`): they log which patients would be anonymized without
  changing anything. Flip the relevant one to `true` in Vercel's environment
  variables only after reviewing that clinic's dry-run output — this mutates
  real patient records and is not something to turn on unread. The two are
  independent, so kid and lungs can go live at different times.
- The action is **anonymization, not hard deletion**: identifying fields
  (name, phone, email, exact DOB) are replaced/generalized; the record and
  its clinical history remain linked under the patient ID for continuity/
  statistical purposes, but no longer identify a person, which is what
  satisfies DPDP's erasure requirement without a bug in a delete job being
  able to destroy data irrecoverably.
- The erasure path built for data-principal requests
  (`api/kid/portal/rights-request.js`) still logs requests for manual staff
  review rather than auto-deleting/anonymizing early — a request to delete
  an active patient's record inside the mandatory retention window (before
  age 21) should be refused or anonymized only with staff judgment, since
  the record may still be serving its clinical purpose.

## Status

**Adopted, partially implemented.** The sweep jobs exist and are wired into
`vercel.json` but are running in dry-run mode until reviewed and switched on.
Deadline: **13 May 2027**, when DPDP Rules 2025 retention obligations become
enforceable — the sweep should be live well before then, not right at the
deadline.

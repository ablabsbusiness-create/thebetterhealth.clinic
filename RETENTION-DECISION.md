# Medical record retention period — a decision for a lawyer

**Not legal advice.** This frames the decision and the tension in the law; it
does not resolve it. `COMPLIANCE.md` item #21 flags this as the one item in
the whole list that cannot be closed by writing code — it needs a lawyer's
sign-off because minors are involved and two legal regimes point in
different directions.

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

Option 2 is the one most compliance write-ups for paediatric providers land
on, but it is a recommendation to raise with counsel, not a decision made
here.

## What depends on this decision

Once a period is chosen:

- `tos/index.html` §7 (Data retention) needs the actual number, replacing the
  current "period required by applicable healthcare recordkeeping norms in
  India" placeholder language.
- A scheduled erasure/anonymisation job needs to be built (`COMPLIANCE.md`
  item #22) — nothing in the codebase currently ages out or deletes patient
  data on any schedule.
- The erasure path already built for data-principal requests
  (`api/kid/portal/rights-request.js`) logs requests for manual staff review
  rather than auto-deleting, specifically because this retention question
  was still open — once a lawyer sets a floor, that floor should gate what
  staff are allowed to delete early (e.g. a request to delete an active
  patient's record inside the mandatory retention window may need to be
  refused or anonymised instead of erased).

## Status

Open. No scheduled job exists. Flag to the user: this item needs a lawyer
engaged before it can be closed, not more code — and now has a real
deadline: **13 May 2027**, when DPDP Rules 2025 retention obligations
become enforceable.

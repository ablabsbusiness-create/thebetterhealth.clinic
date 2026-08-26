# PediaNex — compliance obligations when selling the EMR to other clinics

**Not legal advice.** Grounded in the code in this repo plus PRODUCT.md.
Selling to third-party practices changes your legal role, so this is a
different list from `COMPLIANCE.md` (which covers running your own clinic).

---

## The role change, and why it matters

| Whose data | Your role | Their role |
|---|---|---|
| Patients of a customer clinic | **Data Processor** (DPDP §2(k)) | The clinic is the Data Fiduciary |
| The doctor / clinic owner as your customer | **Data Fiduciary** | Data Principal |

You process patient data **only on the clinic's instructions, under a valid
contract** (§8(2)). The clinic stays liable to its patients — which is exactly
why its lawyer will push those obligations onto you contractually. Expect to be
asked for a DPA, a security summary and a breach-notification commitment before
any serious practice signs.

---

## BLOCKER — the current architecture cannot be sold as-is

| Problem | Why it blocks a sale |
|---|---|
| Firestore/Storage rules have no `request.auth` and hardcode `clinicId in ['kid','lungs']` | There is **no tenant model**. Every customer would share one open database |
| No authentication | Clinic A could read Clinic B's patients — and so could anyone on the internet |
| No per-user accounts | You cannot show a customer who accessed their patients |
| No audit log | Cannot answer "who saw this record", which clinics will ask |

Tenant isolation is existential for multi-tenant SaaS. One clinic seeing
another's paediatric records is a business-ending incident, not a bug. This has
to be designed before the first external customer, not retrofitted after.

---

## 1. DPDP Act 2023 — processor obligations

- **Data Processing Agreement** with every clinic: scope, purpose, duration, security, sub-processors, breach assistance, deletion/return on exit.
- **Sub-processor disclosure** — Google (Firebase), Vercel, MSG91, any CDN. Clinics need to know and usually need a right to object.
- **Breach assistance** — the clinic must notify the Board and its patients under §8(6); you must detect and tell them fast enough to make that possible.
- **Deletion on termination** — return or erase a clinic's data when they leave, with proof.
- **Assist with data principal rights** — access, correction and erasure requests reach the clinic, but only you can execute them.
- **Children (§9)** — every customer is paediatric, so verifiable parental consent applies across your whole install base. Build the mechanism once, centrally.
- **Purpose limitation** — never mine customer patient data for your own analytics, benchmarking or model training without a separate lawful basis.

## 2. IT Act 2000 / SPDI Rules 2011

- Health data is sensitive personal data (Rule 3) — reasonable security practices required (§43A, Rule 8).
- **ISO 27001 becomes commercially necessary**, not merely advisable — Rule 8 names it, and clinic procurement will ask. The alternative is a documented security programme audited annually by a government-approved auditor.
- §72A exposure for wrongful disclosure.

## 3. CERT-In Directions, April 2022 — often missed, and it binds you

As a service provider you must:

- **Report cyber incidents within 6 hours** of noticing them.
- **Retain logs for 180 days, within India**, and produce them on demand.
- **Synchronise system clocks** to NPL/NIC.
- Maintain customer records for the duration of the relationship plus 5 years.

Your current stack keeps no logs at all, so this is a build item, not paperwork.

## 4. ABDM (Ayushman Bharat Digital Mission) — optional, commercially valuable

Not mandatory unless you claim it. But:

- ABHA (health account) linkage, Health Facility Registry, Health Professional Registry.
- **Milestone certification (M1/M2/M3)** is what lets you advertise ABDM compliance.
- Requires conformance to the **ABDM Health Data Management Policy** and consent-manager flows.

For a product sold to Indian paediatric practices this is a real differentiator,
and increasingly a procurement question.

## 5. EHR Standards 2016 (MoHFW)

- Coding: **SNOMED CT**, **ICD-10**, **LOINC** for labs.
- Interoperability: **HL7 FHIR**.
- Data ownership provisions — the patient owns the record, the clinic holds it.

Today the EMR stores free-text chips (`Symptoms`, `Diagnosis`) with no coding
system. That is fine for one clinic, but it blocks ABDM and any data-portability
claim — and it is much cheaper to store a code alongside the chip now than to
migrate the whole history later.

## 6. Clinical and prescribing rules the product must not break

- **NMC Registered Medical Practitioner Regulations** — prescriptions carry the doctor's name, qualifications and **registration number** (the sheet already prints these via `doctorDetails`); generic names encouraged.
- **Drugs & Cosmetics Act** — Schedule H / H1 / X handling; H1 drugs carry specific record-keeping duties at the pharmacy, and a prescription product should not obstruct them.
- **Telemedicine Practice Guidelines 2020** — applies the moment you add teleconsultation.
- **Clinical Establishments Act** (state-specific) — your customers have record-retention duties, which pull against blanket DPDP erasure. The product needs a documented policy that satisfies both.

## 7. Software as a Medical Device — get an opinion

Under the Medical Devices Rules 2017, software making clinical claims can be
regulated by CDSCO. Plotting growth percentiles and flagging a missing dose is
almost certainly *informational* rather than diagnostic — but if PediaNex adds
dose **calculation**, an abnormality alert, or any interpretation ("this child
is failing to thrive"), that line gets close. Worth a written opinion before
building clinical decision support, not after.

## 8. Commercial and corporate

- GST registration; SaaS is taxable — invoicing and GSTIN on invoices.
- MSA + SLA (uptime, support response, backup and restore).
- Consumer Protection Act 2019 for the customer relationship.
- Entity, books, and insurance — **professional indemnity / cyber liability** is worth pricing early; clinics increasingly ask for it.
- Exit and portability — a clinic must be able to leave with its data in a usable format.

## 9. Only if you sell outside India

- **GDPR** for EU clinics (Art. 28 processor terms, EU representative, transfer mechanism).
- **HIPAA** for US clinics — Business Associate Agreement, and a materially higher security bar.

Do not build for these until a real customer needs them.

---

## Suggested order

1. **Tenant isolation + authentication + audit logging.** Nothing can be sold before this, and it is also most of what the DPA will promise.
2. **DPA template, sub-processor list, security summary** — the document pack procurement asks for.
3. **CERT-In logging** (180 days, held in India) — build it alongside the audit log, since it is the same work.
4. **Central children's-consent mechanism** — one implementation serving every customer.
5. **ISO 27001 path** — start the documented programme even before certification.
6. **ABDM + EHR coding** when a customer asks, or when you want it as a differentiator.
7. SaMD opinion before any clinical decision support.

## What you can honestly claim, and when

- After step 1: *"Each clinic's data is isolated and access-controlled, with an audit trail."*
- After steps 2–4: *"We process patient data under a DPA, with breach notification and children's consent handling."*
- **"DPDP compliant" and "ABDM compliant" are claims to make only with legal sign-off** — and ABDM specifically requires actual certification. Advertising it without the milestone is a misrepresentation to buyers who will check.

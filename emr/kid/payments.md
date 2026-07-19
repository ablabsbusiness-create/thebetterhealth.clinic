# Payments / Billing — How Docon Does It, and How to Port It to `emr/kid`

Researched by logging into the live Docon EMR (`docon.co.in/emr`, Shree Akshaya Clinic account — see credentials note in project memory) and walking the full billing flow: per-patient bill creation, per-patient billing history, and the clinic-wide "In Clinic Accounting" report. This is the detail behind gap #2 in [improvement needed.md](improvement%20needed.md) ("Billing / payments — Docon tracks per-patient billing history... `emr/kid` has no billing, invoicing, or payment tracking at all").

## What Docon actually has

Docon's billing is **manual record-keeping of in-clinic payments**, not an online checkout/payment-collection flow. There is no card/UPI gateway embedded in the doctor's EMR — the doctor records what the patient paid in cash/card/UPI/etc. at the desk. The only place actual electronic payment collection appears is around video consultations (see "VC Accounting" below), which is a separate, narrower flow.

### 1. Per-patient billing entry point

On every patient's profile header there's a running balance badge and an action button, next to Vaccination/Certificates/Follow-up:

```
[Patient Name]   [Office ID]   ₹0 Due       View Bills
                                Video Call · Start Consult · Templates ·
                                Follow-up/Repeat · Vaccination · Certificates ·
                                Add Bill / Payment
```

- **`₹<amount> Due`** — a live running total of unpaid balance across all of that patient's bills, always visible, not just inside a billing screen.
- **`View Bills`** — link to the patient's full billing history (see #2).
- **`Add Bill / Payment`** — opens the bill-entry modal (see below).

### 2. "Add Bill / Payment" modal

Fields, top to bottom:

| Field | Type | Notes |
|---|---|---|
| Itemized Bill | repeatable line-item list | "Add Bill Item" button adds a row; each row is an item description + amount (autocomplete against past item names, e.g. "Consultation Fee", so the doctor doesn't retype pricing every visit) |
| Total | computed, read-only | sum of line items |
| Payment | dropdown, "Select Payment" | options: **Cash, Credit Card, Debit Card, Cheque, e-Wallet, Bank Transfer, UPI** |
| (amount field) | number input, defaults `0` | amount actually paid now — can be less than Total (partial payment → creates a due balance), equal (fully paid), or the field can be left at 0 for a bill logged with no payment collected yet |
| Total | computed, read-only | shown again near the payment section, presumably reflecting due after the payment amount entered |
| Generate Receipt for Form 3C | checkbox | see "Form 3C" below |
| Save & Exit / Save & Print | buttons | Save & Print immediately opens/generates a printable receipt |

Key behavior: **a bill and a payment are the same object**, not two linked records. You don't create an invoice and then separately record payments against it in Docon's UI — each "Add Bill / Payment" action both defines what's owed (line items → Total) and records what's paid right now, and the due balance is Total minus what's been paid to date across all bills for that patient.

### 3. Per-patient billing history ("View Bills")

Route pattern observed: `/emr/bill-history/{patientId}?appointmentID=&isTeleConsult=false`

Header: `Due ₹<amount>` + an `Add Bill / Payment` shortcut, same modal as above.

Table columns: **Date · No. of Edits · Bill No. · Bill Amount · Amount Paid**

- **No. of Edits** — an audit-trail counter; every time an existing bill is edited after creation it increments (seen values 0, 1, 2 in the live data), rather than silently allowing edits with no trace.
- **Bill No.** format is financial-year-scoped and sequential: `Doc/2024-2025/1000003`, `Doc/2025-2026/1000000` — i.e. `{practiceCode}/{financialYear}/{sequence}`, and the sequence resets (or a new prefix starts) at the start of each Indian financial year (April–March).

### 4. Clinic-wide "In Clinic Accounting" report

Reached via the top-right settings menu → **Reports** → tabs: `Vaccine Reports | In Clinic Accounting | VC Accounting | Pending VC`.

**In Clinic Accounting** is the full ledger across every patient:

- **Date range filter**: `Today / 1W / 2W / 1M / 3M / 6M / 1Y / ALL` quick chips (not a raw date picker as the primary control).
- **Bill-type filter**: `All Bills / Form 3C / Due Bills` dropdown.
- **Summary tiles**: Total Payable Amount (+ total bill count), Total Deposited (+ percentage collected), Calculated Due (+ "Total Due: ₹X, Total Advance: ₹Y" breakdown — advance meaning overpayment/credit on account).
- **Bulk row selection** with `Delete` and `Add to 3C` actions, plus `Download` and `Print Form 3C` at the top.
- **Table columns**: Patient Name · Date · No. of Edits · Bill No. · **Receipt No.** · Amount · Amount Paid.
  - **Receipt No.** is a *second*, separate sequence from Bill No. — observed values like `A1007`, `A1006`, `A1005`, incrementing independently, not tied to the financial year the way Bill No. is. Likely a printed-receipt-book-style numbering (`A` + integer) distinct from the internal bill ledger number.

Real data snapshot from the live account (for scale/shape reference only): 152 bills, ₹101,009 total, 100% collected in that account — bill amounts ranged ₹400–₹5,550, consistent with small pediatric consult/procedure fees.

### 5. Form 3C

A checkbox on the bill modal and a filter/export option in the report. **Form 3C is an Indian Income Tax Act receipt format** used by professionals (doctors, in this case) for fee receipts that need to be tax-compliant/auditable — "Print Form 3C" generates receipts in that statutory layout, and "Add to 3C" lets the doctor batch-flag existing bills into that reporting set after the fact. This is a compliance feature, not something invented by Docon — worth keeping if `emr/kid` wants to be usable by Indian solo practitioners without an accountant doing manual reformatting at tax time, but it's not required for a first cut.

### 6. VC Accounting / Pending VC (video-consult payments — separate, lower priority)

- **VC Accounting** — mirrors In Clinic Accounting but scoped to teleconsult payments; empty in the audited account (no video consults had occurred), so exact columns weren't observable, but it's the same report shell filtered to video-consult-originated bills.
- **Pending VC** — columns: `Consult Time · Patient Details · Amount · Action to be Taken`. This is for teleconsults where payment collection/confirmation is still outstanding — i.e. Docon does support actual online payment collection *specifically for booking a video consult slot*, separate from and narrower than the in-clinic manual ledger above. Since `emr/kid`'s portal currently has no booking/video-consult feature at all (gap #5 in improvement needed.md), this tab isn't relevant until that feature exists.

## How to port this to `emr/kid`

`emr/kid` has no billing data model at all today, so this is new build, not a retrofit — but it should reuse the same patterns the codebase already established for [certificates.html](certificates.html) and prescriptions rather than inventing new conventions.

**Data model** — new Firestore collections under the existing `clinics/kid` namespace (see `CLINIC_FIREBASE_NAMESPACE` in [patient-details.html:2379](patient-details.html:2379), and the `clinics/kid/prescription` / `clinics/kid/history` pattern in [rx.html:131-136](rx.html:131)):
- `clinics/kid/bills/{billId}` — `{ patientId, billNo, receiptNo, date, items: [{description, amount}], total, paymentMethod, amountPaid, due, editCount, form3C: bool, createdAt, editedAt }`.
- A per-clinic counter doc (e.g. `clinics/kid/clinicSettings/billingCounters`) holding the current financial-year sequence for `billNo` and the running integer for `receiptNo`, incremented transactionally on save — mirrors how `clinicSettings/prescriptionBranding` already centralizes clinic-level config ([certificates.html feature notes](improvement%20needed.md), gap #1).
- Patient "Due" balance can be a derived read (sum of `total - amountPaid` across that patient's bills) rather than a stored field, to avoid a second source of truth going stale — compute it wherever the badge renders.

**UI**:
- Add a `₹<due> Due` badge + `Add Bill / Payment` action into the existing action bar in [patient-details.html](patient-details.html) (around [patient-details.html:4630-4634](patient-details.html:4630), next to the `Vaccination` / `Start Consult` links) and a `View Bills` link alongside it.
- `Add Bill / Payment` as a modal (reuse the modal/dialog pattern already in this file rather than a new page) with: repeatable item rows, computed total, payment-method select (the same 7 options Docon offers is a reasonable default list), amount-paid input, Form 3C checkbox, Save & Print (reusing the html2canvas/jsPDF pipeline from [preview.html](preview.html) the same way certificates did) / Save & Exit.
- New `billing-history.html` (or a tab in `patient-details.html`) for the per-patient table: Date · No. of Edits · Bill No. · Bill Amount · Amount Paid, plus the `Add Bill / Payment` shortcut.
- Clinic-wide ledger can wait — it's real value (Reports → In Clinic Accounting) but is a second screen on top of the core per-patient flow above; sequence it after per-patient billing is working end-to-end.

**Explicitly skip for v1**: VC Accounting / Pending VC (no video-consult feature exists yet to attach it to), and treat Form 3C as a nice-to-have toggle rather than blocking v1 — ship plain receipts first, add the statutory layout once a doctor actually asks for it.

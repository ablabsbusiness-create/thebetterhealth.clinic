# Prescription & medication table — emr/kid vs Docon

Comparison notes for the prescription screen and the printed sheet.

**Status:** Both parts complete. Part 1 read from our code, Part 2 from a live
Docon consult on the clinic test patient. Both captured 2026-08-21.


---

## Part 1 — What emr/kid does today

### 1.1 The two screens

| Screen | File | Role |
|---|---|---|
| Entry | `prescription.html` | Chip-based selection per section + per-medicine detail modal |
| Preview / output | `preview.html` | Renders the A4 sheet, saves to record, PDF, print, WhatsApp |

Entry never shows the sheet; preview never lets you edit content. The handoff
is a `localStorage` draft keyed per patient, committed to Firestore
(`clinics/kid/history/{id}`) when the preview page loads.

### 1.2 Printed sheet — section order

Fixed order, built in `buildPreviewHtml()` (`preview.html`):

1. **Header** — clinic title + address (left), doctor name + qualifications (right), rule underneath. Suppressible via the With/Without Header toggle for pre-printed letterhead.
2. **Patient band** — 3 columns, bordered: `Name` / `Age/Sex` / `Office ID` · `Date` / `Mobile` · `Weight` / `Height`
3. **Allergy** — always printed, even when empty (`-`)
4. **Symptoms** — with per-item detail
5. **Past Medical History**
6. **Finding** — with per-item detail
7. **Notes** — free text
8. **Diagnosis**
9. **Investigation**
10. **Medication table** — see below
11. **Instruction** — joined inline with ` | `
12. **Mini growth charts** — up to 4, in a 4-column grid
13. **Footer** — signature image or ruled line, doctor name + details, clinic address. Left or right aligned per settings.

Rows 3–9 print as single `Label: value` lines, not blocks. Empty sections
still print their label with `-`.

### 1.3 The medication table

Five columns (`renderMedicineTable()`, `preview.html`):

| # | Medication | Quantity | Frequency | Duration |
|---|---|---|---|---|
| row number, 7% width | name + optional sub-line | dose | timings, comma-joined | e.g. "5 Days" |

- **Medication cell** — composed by `formatMedicineName()` as `Type Brand (Composition)`, e.g. `Syrup Meftal-P (Mefenamic Acid)`. The type prefix is skipped if the brand already starts with it. A second, smaller italic line under the name carries the note, or the food instruction if there's no note — never both.
- **Quantity / Frequency / Duration** — bold, fall back to `-`.
- The table is wrapped in `.medicine-table-wrap` with `overflow-x: auto` and a 620px min-width, so on a phone it scrolls rather than squashing.
- No columns for route, strength as its own field, start date, or refills.

### 1.4 What's captured per medicine

Detail modal in `prescription.html`. The medicine **type** drives everything
else — inferred from the name (`syr`, `tab`, `inj`, `drops`, …) if not set
explicitly, defaulting to Syrup.

Nine types, each with its own units and dose presets (`DOSE_CONFIG_BY_TYPE`):

| Type | Units | Dose presets |
|---|---|---|
| Syrup / Suspension | ml, spoon, tsp | 1, 1.5, 2.5, 4, 5, 7.5, 10, 15 |
| Drops | drops, ml | 1–10 |
| Tablet | tablet, tab | 1/4, 1/2, 1, 1.5, 2 |
| Capsule | capsule, cap | 1, 2 |
| Inhaler | puff | 1–4 |
| Nebulization | respule, ml | 1/2, 1, 2, 2.5, 5 |
| Injection | ml, ampoule | 0.5, 1, 2, 5 |
| Cream/Ointment | application, thin layer | Small, Pea size, Thin layer, Once |
| Other | dose, ml, tablet | 1, 1.5, 2, 2.5, 5 |

**Timing has three modes**, switched by a dropdown:

- `M A E N` (daily) — morning/afternoon/evening/night checkboxes
- `Hourly / Daily` (interval) — 4h/6h/8h/12h/48h, plus Once/Twice/Thrice/Times/a day
- `Meals` — Breakfast/Lunch/Dinner × Before/After

All three modes also offer food timing as a radio: Before Food / With Food /
After Food / Empty Stomach / Bedtime.

Plus: free-text dose override, duration (stored compactly as `5d`/`2w`/`1m`
and expanded to "5 Days" at print), and a free-text note.

### 1.5 Print pipeline

- Sheet is 794px wide = 210mm at 96dpi, `min-height` one A4 page.
- Captured with html2canvas at a fixed 300dpi, embedded as lossless PNG.
- Scaled to A4 width and sliced across as many pages as needed.
- Font size is configurable 12/14/16/18/20/22/25; every element inside the sheet derives from it via `calc(var(--rx-fs) * ratio)`.
- Margins configurable in cm per side; font family Arial / Outfit / Times New Roman.
- Saved to the patient record automatically when preview opens, with a save-state banner reporting saving/saved/failed.

### 1.6 Known gaps in our own table

Worth weighing against whatever Docon does:

- Page breaks slice the sheet as an image, so a break can cut through a table row mid-line.
- No drug database — medicine names come from the clinic's own chip list, so no strength/composition lookup, no interaction or duplicate-therapy checking, no allergy cross-check against the Allergy field we print.
- Dose is not weight-calculated, despite weight being on the sheet already.
- No route column, no "continue existing medication" concept, no taper schedules.

---

## Part 2 — Docon, captured 2026-08-21

Read from a live consult on the clinic's own **test patient** (test record; no
real patient data is reproduced here). Read-only — nothing was created or saved.

### 2.1 Architecture — the finding that matters most

Docon's prescription is **not an image**. The printed sheet is a Vue app in an
iframe (`casesheetv2`), fed a `visitJson` object through `window.postMessage`.
Its rendered DOM contains:

    DIV, HEADER, HR, SPAN, B, SECTION, svg, g, line, path, text, foreignObject, A, IMG

There is **no TABLE element** (the medicine "table" is div-based) and the growth
charts are **inline SVG**, not bitmaps.

| | Docon | emr/kid |
|---|---|---|
| Sheet | Live DOM, printed natively by the browser | html2canvas raster at 300dpi |
| Text | Real vector text — selectable, searchable, sharp at any zoom | Pixels |
| Charts | Inline SVG curves | PNG images |
| PDF size | Small (text + vector) | ~0.5-1.5 MB per prescription |
| Long visits | Reflows, breaks between elements | Image sliced, can cut a row in half |

**This is the root cause of our print-quality problem.** We are fighting
resolution because we rasterise; Docon never rasterises. The dpi and
PNG-vs-JPEG work we did is compensation for an architectural choice they
didn't make.

### 2.2 Print settings — nearly identical to ours

    printOptions:    footerAlignment left, defaultLanguage en,
                     colorPrint true, fontFamily Arial, fontSize 14
    printDimensions: A4, 21cm x 29.7cm,
                     margins top 2cm / right 1cm / bottom 2cm / left 1cm

Our settings page mirrors this almost field for field — and **Docon's default
font size is 14, exactly ours.** So "print is too small" is not that Docon uses
a bigger number. At the same nominal 14, vector text prints crisply while our
raster looked soft, and our hardcoded inner sizes (10.5px body text) meant the
setting barely moved anything. Their margins are also more generous than our 1cm.

### 2.3 Medicine model — they have a drug master database

    medicineID, name, displayName, manufacturer, unit_type, category,
    compositionID, compositionName, owner ("master"), ucodeID, source
    medications: [ { quantity, quantityType, route, timing,
                     frequency1, frequency2, frequency3,
                     duration, durationType, dosageSchedule, note } ]

Differences from ours:

- **A real drug catalogue.** `owner: "master"` with a `medicineID`, manufacturer, and linked `compositionID`/`compositionName`. Ours is the clinic's own chip list with nothing behind it.
- **`medications` is an array**, not a single object — one drug can carry several regimens, i.e. tapering or step-down schedules. We support exactly one dose per medicine.
- **`route`** is a first-class field. We have none.
- **`dosageSchedule: "0,0,0,0,0,0"`** — a six-slot vector, plus `frequency1/2/3`. More granular than our M/A/E/N checkboxes.
- **Brand and generic printed together with strengths:** `Syrup Calpol (250 mg) Paracetamol(250 mg)` = `unit_type + displayName + compositionName`, each independently toggleable. We compose `Type Brand (Composition)` but have no strength field of our own.

### 2.4 The printed medicine table

Columns: index, **Medicines**, **Quantity**, **Frequency**, **Duration**.

That is the same four columns we already have, plus an index we also have. On
column set alone we are at parity. The whole gap is in what fills them —
catalogue-backed names with strengths, and route/multi-regimen data we cannot
capture.

### 2.5 Sheet sections — 38 independently toggleable

Docon's `display` object, each a doctor-level on/off:

    patientInfo, symptoms, allergies, bill, impression, findings, diagnosis,
    signature, followUp, refer, vitals, instructions, investigations,
    investigationResults, procedureResults, heightChart, weightChart, bmiChart,
    ofcChart, histories, checkUps, docRegistrationNumber, genericName, brandName,
    pharmacistNote, letterhead, footer, education, menstrual, obstetric,
    riskFactors, medicineTotals, dosageTiming, images, percentiles, qrCode,
    medicineTicks, casesheet

We have exactly one such toggle (header on/off). Sections they can print that we
have no concept of: **impression, follow-up, referral, investigation results,
procedure results, histories, check-ups, education, menstrual/obstetric, risk
factors, pharmacist note, medicine totals, medicine ticks, images**.

### 2.6 Vitals carry percentiles

Their patient band prints `Weight: 18 kg (10 %ile)`, `Height: ... (97 %ile)`,
`BMI: ... (3 %ile)`, `OFC: ... (3 %ile)` — the percentile inline beside every
value, from a `growthPercentiles` field. We print raw weight and height with no
percentile, even though we already compute percentiles for the charts.

Their chart set is Height, Weight, BMI, OFC **and Weight-for-Height**; we have
no weight-for-height.

### 2.7 Six sheet templates, six medicine layouts

- Prescription templates: `template1` ... `template6` (this clinic uses `template3`)
- Medicine renderers: `medicines-table-component`, `medicines-table2-component` (in use), `medicines-ol-single-line-component`, `medicines-ol-two-line-component`, `medicines-ol-multiline-component`, `medicines-smart-component`

The doctor picks an overall sheet design *and*, separately, how the medicine
list renders — table, or a numbered list in one/two/many lines. We have one
fixed layout.

Also registered: `diet-table`, `investigation-results-table-component`, and
`antenatal` scaffolding in the template.

### 2.8 Other things on their sheet

- **QR code** — "Scan QR code to download the digital Prescription on Docon Patient app"
- **Medical council registration number** in the footer (`docRegistrationNumber`)
- **Multi-language** — `selectedLanguage`, falling back to the patient's `preferredLanguage`, then the doctor's `printOptions.defaultLanguage`. Prescriptions can print in the patient's own language. We are English-only.
- **Findings carry severity**, printed as `Febrile (Severe)`

### 2.9 The patient screen around the prescription

Action bar: Video Call, Start Consult, Templates, Follow-up/Repeat, Vaccination,
Certificates, Add Bill / Payment. The header shows an outstanding balance
(`Rs 222 Due`) with a View Bills link.

Below it: **Vitals Trend** as a date-columned grid (Weight/Height/OFC/BMI across
recent visits), **Vaccinations** with overdue/due counts and relative timing, and
a paginated **Casesheet** viewer ("1 of 4") with Save-as-template.

Search results show name, sex, age to the day, mobile and office ID; the sidebar
also offers a **Merge Patient** tool for duplicates.

---

## What this changes for us

1. **The print pipeline is the real gap.** Moving from an html2canvas raster to a printable DOM — or server-side HTML-to-PDF — fixes sharpness, file size and mid-row page breaks in one move, and makes the text selectable. Everything else below is a feature gap; this one is architectural.
2. **Percentiles on the patient band** — cheap, we already compute them.
3. **Route, and multiple regimens per drug** — schema change, needed for tapering doses.
4. **Section toggles** — they have 38, we have 1.
5. **A medicine catalogue** with composition and strength is the foundation their name rendering sits on, and the prerequisite for any interaction or duplicate-therapy checking.

---

## Part 3 — Verified by creating a live prescription (2026-08-21)

Created a real prescription on the **test patient** to watch the medication
table behave end to end: `Syr Azithral (200 mg)`, 5 ml, Twice a day, After
Food, 3 Days. Saved (casesheet went 1-of-4 to 1-of-5).

### 3.1 The medicine entry flow

1. The Medicines card has a **`+`** action which reveals **Past medicines** — this patient's previously prescribed drugs as one-tap chips (`Syr Calpol (250 mg)`, `Dro Nasoclear Nasal`, `Sus Crocin DS`, ...). Re-prescribing is a single click.
2. A **`Search medicines`** box queries the drug master. Typing "Azithral" returned ~20 catalogue hits: `Tab Azithral250`, `Dro Azithral Junior`, `Syr Azithral (200 mg)`, `Liq Azithral (200 mg)`, `Kit Azithral XP (Kit)`, `Tab Azithral Pulse (500mg)` ... i.e. every brand/form/strength permutation, already typed and dosed.
3. An **`Add`** option exists for drugs not in the catalogue.
4. Results render as `doc-bubble > button` — they call them **bubbles**, same term we use.

Form prefixes are abbreviated in the picker (`Syr`, `Sus`, `Dro`, `Tab`, `Spr`,
`Liq`, `Kit`) but **expanded on the printed sheet** (`Syrup`). We already
adopted the abbreviated-prefix convention; we don't expand at print.

### 3.2 The dosage editor

Selecting a drug opens an editor headed by **brand over generic**:
`Azithral (200 mg)` / `Azithromycin(200 mg)`.

- **`Dose 1`** — numbered, confirming the `medications[]` array is a real multi-regimen feature, not a vestige.
- **Quantity** — unit `ml` with presets `1, 1.5, 2.5, 4, 5, 7.5, 10, 15`. **Identical to our Syrup preset list.**
- **Default Timing** switch — flips between the M/A/E/N schedule grid and the frequency chips below.
- **Frequency** — `4h 6h 8h 12h 48h` | `Once Twice Thrice 4 times 5 times` | `Before Food After Food Empty Stomach Bedtime`. Near-identical to our interval mode.
- **Duration** — custom field plus `1d 2d 3d 4d 5d 1w 10d 2w 15d 3w 4w 1m 2m 3m 6m` **and `SOS`, `Till Required`, `To Continue`, `Stat`**. We have none of those four.
- **Note**

Until a dose is set the row shows **"Medicine is without dosage"** — the same
warning concept as our dosage banner, but inline on the row rather than a
banner above the Continue button.

### 3.3 How the dose is actually stored

    quantity: 5,  quantityType: "ml"
    frequency1: "Twice",  frequency2: "",  frequency3: "a day"
    dosageSchedule: "0,0,0,0,0,0"
    timing: "After Food"
    duration: "3",  durationType: "Days"
    route: "",  note: ""

Frequency is **composed from three slots** (`frequency1 + frequency2 +
frequency3` = "Twice a day"), which is how one chip set covers both "Twice a
day" and "every 6h". `timing` holds the food relation separately.
`dosageSchedule` stays zeroed when frequency chips are used — it is the
alternate M/A/E/N representation behind the Default Timing switch.
Duration splits into value + unit rather than our packed `3d` string.

### 3.4 The printed row — not five columns

The header reads `Medicines | Quantity | Frequency | Duration`, but the body is
**three cells**, with two lines in each of the last two:

    <div>
      <span>1</span>
      <span>                                   <- name cell
        <span><span>Syrup</span> <span>Azithral (200 mg)</span></span>
        <span>Azithromycin(200 mg)</span>
      </span>
      <span>                                   <- dosage cell
        <span><span>5 ml</span> <span>Twice a day</span> <span>3 Days</span></span>
        <span>After Food</span>
      </span>
    </div>

So: line 1 of the name cell is `form + brand (strength)`, line 2 is the
generic; line 1 of the dosage cell packs quantity/frequency/duration, line 2
carries food timing. Ours is a genuine 5-column `<table>` with a single
sub-line. Theirs degrades better on narrow output because the dosage phrase
wraps as a unit.

### 3.5 Empty sections are omitted

This prescription had no symptoms, findings or diagnosis — and those lines are
simply **absent** from the sheet. Compare the earlier casesheet, which printed
`Symptoms: Cough Findings: ...` only because they had values. **We print the
label with a `-` regardless**, so our sheet always carries a row of empty
labels. Theirs stays clean.

### 3.6 There is no PDF file

This is the key structural finding. Searching every link, iframe and network
resource turned up **no PDF endpoint and no PDF generator**. `Print Rx` hands
the rendered DOM to the browser's own print dialog. The "PDF" a doctor gets is
whatever Chrome's Save-as-PDF produces.

The page carries real print CSS — 3 `@media print` blocks and these `@page`
rules:

    @page { size: 21cm 29.7cm; margin: 2cm 1cm; }   <- from the doctor's printDimensions
    @page { size: a4; margin: 1cm; }
    @page { size: 8.5in 11in; }                     <- US Letter fallback

The first is generated from the saved `printDimensions` preference, so the
doctor's page size and margins become a real `@page` rule.

**Structure of their "PDF", then:** browser-native pagination of a vector DOM
under `@page`, with page breaks falling between block elements. No jsPDF, no
html2canvas, no server render, no image anywhere except the signature and QR.
Text is selectable, charts stay vector, and the file is small.

Ours: jsPDF wrapping a 300dpi html2canvas PNG, paginated by slicing that
bitmap. Every quality problem we have traces back to this one difference.

### 3.7 Print Options — 19 toggles at print time

The preview screen has a **`Print Options (19)`** button exposing per-prescription
switches, adjustable immediately before printing:

    Billing Details(off) · Vitals · Medicine Composition · Pharmacist Note(off)
    Registration Number · Medicine Total Quantity(off) · Height/Weight/BMI/OFC Chart
    Investigation Results · Medical History · Allergies · Symptoms · Findings
    Diagnosis · Signature · Educational Qualification · Impression · Casesheet(off)
    Letterhead · Percentiles

Same screen also sets **follow-up** from chips: `3d 5d 1w 2w 1m 45d 3m 6m`.

This is a real workflow difference. Their doctor tunes what prints *for this
prescription* at the moment of printing; ours has one global header on/off in
Settings.

### 3.8 Consult screen shape

Tabs: **Consult · Vaccination · Growth · Reports · Attachment**, with
`Templates` and `Preview Rx` top-right.

Left rail: Medical History, Vitals (Weight/Height/Ofc/SPO2 inline),
**Prescription Notes** (placeholder *"this note is printed.."*) and
**Doctor Notes** (*"this note is not printed.."*).

That split is worth stealing outright — a printed note and a private note.
We have one Notes field and it always prints.

Sections down the page: Symptoms · Findings · Diagnosis · Medicines ·
Investigations · Instructions · **Procedures**. Each has a `+` and its own
"Past ..." chip list. Buttons: `Back to Consult`, `Save Rx`, `Print Rx`,
`Add Bill / Payment`.

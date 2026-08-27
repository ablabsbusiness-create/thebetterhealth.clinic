# Data processing agreements — Google, MSG91, Vercel

**Not legal advice.** DPDP Act 2023 §8(2) keeps the clinic (the data
fiduciary) liable for its processors' handling of personal data — a DPA does
not remove that liability, but it is the standard way to bind a processor to
the same obligations and to create a contractual record for the Data
Protection Board or a court. This is a status check, not an executed
agreement — nothing here should be treated as "done" until the linked
document is actually accepted/signed through each vendor's own process.

## Google (Firebase / Google Cloud)

Verified 2026-08-27 against [Google's own Cloud DPA page](https://cloud.google.com/terms/data-processing-addendum)
and [Firebase's Data Processing and Security Terms](https://firebase.google.com/terms/data-processing-terms):
the Cloud Data Processing Addendum **is incorporated into the Agreement
between Google and the customer** — it applies automatically as a term of
service, not something separately negotiated. What the search did **not**
confirm is any explicit statement that it names DPDP Act 2023 specifically
(earlier drafts of this document overstated that; corrected here).

- Action: log into the Google Cloud console for the `clinci-dr-gunda`
  project, check **IAM & Admin → Legal & Compliance** (or equivalent) for the
  Cloud Data Processing Addendum, and confirm/accept it there. Save a copy of
  the accepted terms with the effective date. Contractually already in
  effect either way, but a dated confirmation from the console is worth
  having on file.

## MSG91

Searched 2026-08-27; found no public self-serve DPA or DPDP-specific
compliance page for MSG91 — this genuinely requires direct outreach, not a
console click.

- MSG91 is a processor for one specific, narrow purpose: delivering OTP SMS
  to a phone number, per `tos/index.html` §3.
- Action: contact MSG91 support, request their standard Data Processing
  Agreement referencing DPDP Act 2023 compliance, and countersign it. Until
  that is done, the only binding terms are MSG91's standard Terms of Service.
  Draft message to send them: *"We are a healthcare provider in India using
  MSG91 for OTP SMS delivery. Under the Digital Personal Data Protection Act
  2023, we need a Data Processing Agreement with MSG91 as our processor.
  Please send your standard DPA for review and execution."*

## Vercel — a more urgent finding than the DPA question

Verified 2026-08-27 directly against
[Vercel's own Hobby plan documentation](https://vercel.com/docs/plans/hobby):

> "As stated in the fair use guidelines, **the Hobby plan restricts users to
> non-commercial, personal use only.**"

This site is currently deployed on Vercel's **free Hobby plan** and is
unambiguously a commercial healthcare business, not a personal project.
This is a Terms of Service problem independent of DPDP entirely — Vercel
can pause or suspend a Hobby deployment found in violation of fair-use
terms, which for a live clinic means the site (and the API routes patient
records and staff logins depend on) going down without warning.

Separately, Vercel's DPA (confirmed via
[vercel.com/legal/dpa](https://vercel.com/legal/dpa)) explicitly **only
applies to customers on Enterprise and Pro plans** — so a proper Vercel DPA
is not obtainable on Hobby regardless of the ToS question.

- **Action (more urgent than the DPA itself): upgrade this project to
  Vercel Pro.** One action resolves both problems — it moves the site into
  its correct, compliant tier for a commercial business, and it makes the
  DPA available to accept. Current cost is $20/developer/month (one
  developer seat covers this project).
- After upgrading: from the Vercel dashboard, check **Settings → Legal**
  (or the account's Trust Center link) for the DPA and accept/download it
  with a dated confirmation.

## What "done" looks like

For each of the three: a signed or dashboard-accepted DPA, dated, saved
alongside this file (not committed to a public repo if it contains account-
specific terms — store outside `tos/`, e.g. in a private folder or the
user's own records). This document tracks the plan; it cannot itself execute
the agreements, since each requires an action in an external vendor console
or a direct request to the vendor.

## Status

Not yet executed for any of the three. Google's DPA is contractually
already in effect by virtue of using the service (confirming/dating it in
the console is the remaining step); MSG91 needs a direct request using the
draft message above; **Vercel needs a plan upgrade before its DPA is even
available, and that upgrade is worth doing on its own terms regardless of
DPDP, since running a commercial site on Hobby risks the site itself.**
This is the action list; the outstanding work is administrative (console
clicks / a vendor support request / a plan upgrade), not code.

# Data processing agreements — Google, MSG91, Vercel

**Not legal advice.** DPDP Act 2023 §8(2) keeps the clinic (the data
fiduciary) liable for its processors' handling of personal data — a DPA does
not remove that liability, but it is the standard way to bind a processor to
the same obligations and to create a contractual record for the Data
Protection Board or a court. This is a status check, not an executed
agreement — nothing here should be treated as "done" until the linked
document is actually accepted/signed through each vendor's own process.

## Google (Firebase / Google Cloud)

- Google publishes a standard **Cloud Data Processing Addendum (DPA)** that
  covers Firebase and Google Cloud services and already **incorporates DPDP
  Act 2023 terms** for customers in India.
- For most Firebase/GCP accounts the DPA is **auto-accepted by using the
  service** (it is presented as a term of the Cloud/Firebase Terms of
  Service), but it should be **explicitly reviewed and, where the console
  offers it, formally accepted/countersigned** in the Google Cloud console
  under the account's Compliance/Legal settings, so there is a dated record
  of acceptance.
- Action: log into the Google Cloud console for the `clinci-dr-gunda`
  project, check **IAM & Admin → Legal & Compliance** (or equivalent) for the
  Cloud Data Processing Addendum, and confirm/accept it there. Save a copy of
  the accepted terms with the effective date.

## MSG91

- MSG91 is a processor for one specific, narrow purpose: delivering OTP SMS
  to a phone number, per `tos/index.html` §3.
- MSG91 offers a DPA on request for business/enterprise accounts (not
  self-serve for all plans) — this needs a **direct request to MSG91**
  through their support/sales channel, not something available in-repo.
- Action: contact MSG91 support, request their standard Data Processing
  Agreement referencing DPDP Act 2023 compliance, and countersign it. Until
  that is done, the only binding terms are MSG91's standard Terms of Service.

## Vercel

- Vercel publishes a standard **Data Processing Addendum** covering hosting
  and edge/serverless execution of this site, available from Vercel's legal/
  trust pages and, on paid plans, directly acceptable from the dashboard's
  billing/legal settings.
- Action: from the Vercel dashboard for this project's team, check
  **Settings → Legal** (or the account's Trust Center link) for the DPA and
  accept/download it with a dated confirmation.

## What "done" looks like

For each of the three: a signed or dashboard-accepted DPA, dated, saved
alongside this file (not committed to a public repo if it contains account-
specific terms — store outside `tos/`, e.g. in a private folder or the
user's own records). This document tracks the plan; it cannot itself execute
the agreements, since each requires an action in an external vendor console
or a direct request to the vendor.

## Status

Not yet executed for any of the three. This is the action list; the
outstanding work is administrative (console clicks / a vendor support
request), not code.

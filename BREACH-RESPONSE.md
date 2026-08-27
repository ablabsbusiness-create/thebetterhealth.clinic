# Data breach response process (kid EMR)

**Not legal advice — a lawyer should review this before it's ever needed.**
Written 2026-08-27, in the same spirit as `COMPLIANCE.md`: this covers what's
mechanically true about the system today, as a first draft for the user or
their lawyer to refine. Scope is the kid clinic only, matching the rest of
this compliance work — see `COMPLIANCE.md` and the phase 1/2 plan.

## Who is notified

Under DPDP Act 2023 §8(6), a personal data breach requires notifying:

1. **The Data Protection Board of India**, in the form and manner the Board
   prescribes (rules under the Act govern the exact process and timeline).
2. **Every affected data principal** — here, the parent/guardian of each
   patient whose data was involved — in a manner the Board's rules specify.

Both notifications are the clinic's obligation regardless of whether the
breach originated with the clinic's own code or with a processor (Firebase/
Google Cloud, MSG91, Vercel) — DPDP §8(2) keeps the fiduciary liable for its
processors.

## Point of contact

**Grievance Officer**: Aaditya Bhatnagar, ablabs.business@gmail.com (also
published on the public privacy policy at `/tos`). This person coordinates
the response: confirming scope, drafting notifications, and being the single
point of contact for the Board and affected principals.

## What can currently detect a breach

Stated plainly because there is no dedicated alerting today — detection
depends on someone looking:

- **Vercel function logs** (`vercel logs`, or the Vercel dashboard) — surface
  application-level errors, unexpected 500s, or unusual request volume on
  `/api/kid/*` endpoints.
- **Firebase console** — Authentication tab shows sign-ins to the
  `clinci-dr-gunda` project; Firestore usage/rules tabs show read/write
  volume and any rule-evaluation errors.
- **Google Cloud project audit logs** (via the Firebase/GCP console) — the
  authoritative record of who accessed what, if a breach needs to be scoped
  precisely.

There is no automated alert if data volume spikes, if the Firestore/Storage
rules are ever weakened again, or if credentials leak. Anyone relying on this
process should check these surfaces proactively, not wait for an alert.

## Response steps

1. **Contain.** If the cause is a credential leak or a rules regression,
   rotate the credential (`vercel env rm` / `vercel env add`, following the
   pattern already used for the Firebase service-account keys) or redeploy
   the last-known-good `firebase/firestore.rules` / `storage.rules`
   (`firebase deploy --only firestore:rules` / `--only storage`).
2. **Scope.** Use Firebase/GCP audit logs to determine what was accessed,
   by whom (or by what IP, if unauthenticated), and over what window.
3. **Notify.** The Grievance Officer drafts and sends the Data Protection
   Board notification and the notice to each affected parent/guardian.
   A lawyer should confirm the required timeline and content before either
   goes out — DPDP's implementing rules specify both, and getting either
   wrong is worse than a short delay to get it right.
4. **Record.** Keep a written record of what happened, when it was detected,
   what was done, and when each notification was sent — this record is
   itself part of demonstrating compliance if the Board ever asks.

## Notification template (starting point only)

> Subject: Notice of a data security incident — The Better Kids Clinic
>
> We are writing to inform you of a data security incident that may have
> affected [child's name / patient ID]'s personal data held by The Better
> Kids Clinic. On [date], we discovered [brief factual description]. The
> information that may have been involved includes [specific data types —
> e.g. name, date of birth, phone number, health records]. We have taken the
> following steps in response: [containment steps]. If you have questions or
> wish to exercise your rights under the Digital Personal Data Protection
> Act, 2023, please contact our Grievance Officer, Aaditya Bhatnagar, at
> ablabs.business@gmail.com.

## Not yet in place

- No automated breach/anomaly detection (flagged above).
- No fixed internal SLA for containment before a lawyer is engaged — should
  be set once the lawyer engagement itself exists.
- Lungs clinic is out of scope for this document, consistent with the rest
  of this compliance work — it runs on a separate Firebase project
  (`the-better-lungs-clinic`) with no equivalent process defined yet.

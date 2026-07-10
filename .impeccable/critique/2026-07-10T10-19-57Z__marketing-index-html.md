---
target: marketing/index.html
total_score: 27
p0_count: 2
p1_count: 2
timestamp: 2026-07-10T10-19-57Z
slug: marketing-index-html
---
Method: dual-agent (A: a3d2e90d1ea427d60 · B: a3eaffde007acfa24)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | FAQ accordion state reflects correctly; sticky header keeps orientation. Little dynamic state on a static page. |
| 2 | Match System / Real World | 4 | Genuinely fluent clinical vocabulary (IAP/WHO percentiles, meal-relative dosing, dose-level vaccine status) — reads like it was written by someone who ran a pediatric clinic. |
| 3 | User Control and Freedom | 3 | No traps, no modals, external links use `rel="noopener"` correctly. |
| 4 | Consistency and Standards | 2 | "Book a walkthrough" resolves to two different destinations depending on which instance is clicked — an anchor (`#contact`) in most places, a direct WhatsApp link in the final CTA. |
| 5 | Error Prevention | 1 | Every WhatsApp link (`wa.me/910000000000`) is a placeholder number — the page's sole conversion mechanism does not resolve to a real contact. |
| 6 | Recognition Rather Than Recall | 3 | Clear nav labels, consistent iconography, nothing requires memorization. |
| 7 | Flexibility and Efficiency of Use | 2 | One fixed path (scroll or click the one CTA); no alternate contact route. |
| 8 | Aesthetic and Minimalist Design | 2 | Clean whitespace/grid discipline, undercut by 8 repeated eyebrow kickers and a uniform 6-card icon grid adding noise without information. |
| 9 | Error Recovery | 3 | No forms to error on; FAQ pre-empts real objections (wifi, migration, security posture) as reassurance-before-error. |
| 10 | Help and Documentation | 4 | The FAQ is genuinely strong — categorized, and honest about unfinished pricing/security work rather than dodging. |
| **Total** | | **27/40** | **Acceptable — solid foundation, real gaps before this converts** |

## Anti-Patterns Verdict

**LLM assessment**: The page correctly avoids the cream-and-gradient SaaS template PRODUCT.md rules out, but lands on the *other* first-order default for a medical product: trustworthy-blue-and-white corporate SaaS. An eyebrow kicker repeats identically above all 8 sections, six pain-point cards share an identical icon+heading+text shape, and two of three type families (Inter, IBM Plex Mono) sit directly on brand.md's own reflex-reject font list, with Inter alone carrying 79% of rendered text. Applying brand.md's inverse test — describe this the way a competitor would describe theirs — it comes back as "a blue pediatric-EMR landing page with product screenshots and a features grid," close enough to the modal category page to fail the test. One pattern that looks like scaffolding but isn't: the six numbered flow-dots (01–06) under "How a visit actually flows." SKILL.md's own carve-out allows numbering when the content genuinely is a sequence — this is a real 6-step clinic-visit flow, not decorative section labeling, so it earns the numbering rather than violating the ban.

**Deterministic scan**: `detect.mjs --json marketing/index.html` exited 2 with 3 static findings: `overused-font` (Inter is a reflex default), `em-dash-overuse` (27 em-dashes in body copy, an AI cadence tell), and `numbered-section-markers` (advisory only — see the false-positive note above). The live browser overlay found 10 anti-patterns / 14 individual findings, corroborating the LLM review almost point for point: `hero-eyebrow-chip` + `all-caps-body` (the eyebrow pattern both assessments flagged independently), `icon-tile-stack` (the pain-card icon tiles), `overused-font` (Inter at 79%), three `skipped-heading` instances (h2→h4, missing h3, in the flow/roadmap/footer sections — exact match to the LLM review's finding), and — new information the LLM review didn't have — severe `low-contrast` failures: primary CTA button text at 2.6:1 (white on `#5AA6F2`, dark mode) and the three device-card labels ("Desktop"/"Tablet"/"Phone") at 2.6:1, 2.0:1, and 1.9:1, all against a 4.5:1 (or 3:1 large-text) requirement. No false positives identified; every finding was verified against the actual markup.

**Visual overlays**: Overlay injection succeeded (helper on port 8400, `window.impeccableScanAsync()` corroborated the console output independently). No screenshot artifact was produced for this run — evidence was gathered via console/eval rather than pixels, which was sufficient to verify every finding above against source.

## Overall Impression

This is a page with real substance — the copy is domain-fluent, the FAQ is unusually honest, and the roadmap section naming unbuilt features is a genuinely uncommon trust move for a landing page. But it has one showstopper (every CTA is a dead link) and a legibility failure on that same CTA in dark mode, sitting underneath a visual system that swapped one AI-default (cream+gradient) for another (blue-and-white corporate SaaS with a repeated eyebrow and a uniform card grid). The biggest opportunity: fix the CTA destination and contrast first — nothing else on this page matters to a visitor who can't complete the one action it exists for — then spend the visual-distinctiveness budget breaking the eyebrow/card-grid reflex rather than polishing what's already there.

## What's Working

- **The FAQ** is the strongest section on the page — categorized, and willing to say uncomfortable things plainly ("We're finalizing public pricing," "We're actively tightening this further"). This is the brand personality (personalized, honest, credible) actually executed, not just claimed.
- **The roadmap** naming unbuilt features as "In progress / Planned / Exploring" is a differentiated move that matches PRODUCT.md's stated design principle almost exactly, and both assessments independently treated it as a highlight.
- **Domain-specific copy** throughout reads like it was written by someone who has actually run a pediatric clinic, not a copywriter riffing on "EMR software" — the clearest evidence the "specialist, not generalist" positioning is actually landing.

## Priority Issues

**[P0] Every CTA resolves to a non-functional placeholder number**
- **Why it matters**: `wa.me/910000000000` is the page's sole conversion mechanism, used in the hero, the final CTA, and the footer. A visitor who tests it before committing 20 minutes gets an invalid-number error from WhatsApp itself — on a page whose entire pitch is "this is real, working software."
- **Fix**: Wire in the real business WhatsApp number (or a real booking link) before this goes anywhere live.
- **Suggested command**: `/impeccable harden`

**[P0] Primary CTA and device-card labels fail contrast badly in dark mode**
- **Why it matters**: The browser overlay measured white text on `#5AA6F2` (the CTA button) at 2.6:1, and the "Desktop"/"Tablet"/"Phone" labels at 2.6:1, 2.0:1, and 1.9:1 — all against a 4.5:1 (or 3:1 for bold/large text) requirement. This is the primary conversion element failing to be legible, in the exact accessibility posture PRODUCT.md commits to (standard WCAG AA).
- **Fix**: Darken the dark-mode `--blue`/`--green`/`--amber` values, or use ink-toned text on those fills instead of white, until all three clear 4.5:1 (body) / 3:1 (bold ≥14px / ≥18px).
- **Suggested command**: `/impeccable audit`

**[P1] The page is structurally the AI-SaaS template it claims to have rejected**
- **Why it matters**: An identical eyebrow kicker above all 8 sections and a uniform 6-card icon+heading+text grid are SKILL.md's own named defaults, independently confirmed by both the LLM review and the detector overlay (`hero-eyebrow-chip`, `all-caps-body`, `icon-tile-stack`). Combined with Inter carrying 79% of rendered text (a reflex-reject font per brand.md), the page reads as generic-SaaS-in-blue rather than the distinctive register PRODUCT.md's anti-references call for.
- **Fix**: Reserve the eyebrow for one deliberate spot (e.g. only the origin section) instead of default section grammar; restructure the pain points as something other than a flat identical-card grid; reconsider the type pairing against brand.md's reflex-reject list.
- **Suggested command**: `/impeccable typeset` for the font pairing, `/impeccable layout` for the card-grid restructure

**[P1] Light-mode `--muted` text fails the AA contrast floor PRODUCT.md commits to**
- **Why it matters**: Measured at ~4.07:1 against white, below the 4.5:1 floor, recurring across the trust-line, card body copy, roadmap cards, and timestamps — the single most repeated contrast failure on the page.
- **Fix**: Darken `--muted` toward `--ink-soft` sitewide.
- **Suggested command**: `/impeccable audit`

**[P2] The promised testimonial placeholder is missing entirely**
- **Why it matters**: PRODUCT.md explicitly calls for an honest "Have yet to add"-style placeholder in the Dr. Gunda Srinivas testimonial slot as a deliberate trust device — for this exact skeptical-buyer audience, a peer pediatrician's voice (even flagged as pending) is one of the most persuasive proof points available, and there is no testimonial section anywhere in the shipped HTML.
- **Fix**: Add the proof section with the honest placeholder per PRODUCT.md's Conversion & proof guidance.
- **Suggested command**: `/impeccable clarify`

## Persona Red Flags

**Jordan (first-timer, 10-second skim)**: Lands on a strong headline, but the mid-page rescue CTA ("Still doing this on paper and phone calls?") scrolls to `#contact`, which just opens the broken WhatsApp link — Jordan's fastest exit path is also the broken one.

**Riley (stress-tester)**: Clicks "Chat on WhatsApp" and gets an invalid-number error from WhatsApp itself on first contact — the worst possible finding for a brand whose entire pitch is "this is real, working software." If Riley also happens to be testing in dark mode, the CTA button text is barely legible on top of not working.

**Casey (mobile user)**: At ≤820px, the primary nav disappears with no hamburger replacement — Casey loses the ability to jump to Roadmap or FAQ except by scrolling the entire page or hunting the footer.

**Dr. Priya (skeptical Indian pediatric clinic owner, project-specific)**: Reassured by the IAP/WHO-specific language and the honest roadmap/pricing FAQ — real trust signals for this exact buyer. But she finds no peer testimonial at all (not even the honest placeholder the brief calls for), no stated price advantage despite being told this vendor is cheaper, and the WhatsApp button failing ends her evaluation before it starts.

## Minor Observations

- No `og:image`/`twitter:image` meta tag — a shared link shows no preview image.
- The "everywhere-grid" device cards (Desktop/Tablet/Phone) are decorative wireframes carrying almost no information beyond what the section intro sentence already states.
- "Book a walkthrough" appears 5 times across the page — fine as repetition once the destination is consistent and functional.
- 27–30 em-dashes flagged by the detector as an AI cadence tell; worth a copy pass to vary sentence construction.
- Heading hierarchy skips `h3` in three places (flow, roadmap, footer/contact) — confirmed independently by both assessments, cheap to fix.

## Questions to Consider

- If every CTA on the page is broken, does any other finding in this review matter until that's fixed first?
- The roadmap section earns credibility by admitting what isn't built yet — so why does the page's own promised testimonial placeholder simply not exist, instead of showing that same honesty in that slot?
- This page traded a cream-and-gradient AI template for a blue-and-white one — for a pediatric EMR, is medical-trustworthy-blue actually a braver choice, or just a different flavor of the same category reflex?

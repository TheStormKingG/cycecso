# PRODUCT.md — CYCLE pitch deck site

## What this is
The web presence of CYCLE (Caribbean Youth Conservation Leaders Ensemble), a youth-led
civil society organisation in Guyana. The site is deliberately a **four-slide business
pitch deck**, not a scrolling website: About, Our Model, Impact, Partner. One viewport
per slide, no scrolling, arrow/keyboard/swipe navigation, over a single continuous
rainforest panorama that pans one screen-width per slide.

## Register
`brand` — the design IS the product. This is a funding pitch: its audience judges the
organisation partly by the craft of this deck.

## Users
Funders and grant bodies, corporate partners, research institutions, and fellow civil
society organisations, mostly on laptops in meetings or from an emailed link. Secondary:
young Caribbean people evaluating whether CYCLE is credible.

## Brand
- Voice: confident, warm, accountable. Signature lines: "Together, we regenerate.",
  "The numbers we're willing to be held to.", "The value is in the turn."
- Identity colours come from the CYCLE logo: gold #D9A62B, red #D13030, blue #2E6FBF,
  cyan #2FA8D1, greens (#2FA06C family) — used at full strength in the cycle
  infographic; the rest of the deck stays in deep forest greens with mint accent #8FE3B4.
- Photography: real rainforest canopy (Wikimedia, CC BY 2.0, credited on-page).

## Anti-references
Generic SaaS landing pages; identical card grids; cookie-banner-covered NGO sites;
anything that reads as a template. No fabricated impact numbers: the 2030 targets are
published commitments.

## Strategic principles
- One takeaway per slide (Knaflic visual storytelling), decluttered.
- Everything fits on screen: no scrolling in any direction, enforced by a measured
  shrink-to-fit system plus an iframe test harness across 8 viewports.
- GDPR by architecture: no cookies, no trackers, no third-party requests; self-hosted
  fonts; consent-gated Supabase contact form (insert-only RLS).

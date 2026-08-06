# CYCLE website — pitch deck

Website of **CYCLE — Caribbean Youth Conservation Leaders Ensemble**, a youth-led
civil society organisation based in Guyana.

A four-slide business pitch deck that happens to live on the web. Static
site, no build step, live on **Vercel** at https://cycecso.vercel.app.

## The deck

Four slides — About · Our Model (with the five pillars) · Impact · Partner —
each sized to one viewport with **no scrolling in any direction**, navigated
with the arrows, arrow keys, swipe, wheel, or `#hash` deep links.

Behind them runs **one continuous rainforest panorama** (`assets/img/pano.jpg`,
7600×814) that pans exactly one viewport-width per slide, so moving through
the deck reads as travelling rightward across a single landscape.

Content hierarchy follows Cole Nussbaumer Knaflic's visual-storytelling rules:
each slide carries a takeaway title rather than a category label, one focal
point (colour and scale carry it), aggressive decluttering, and a narrative
arc — setup → mechanism → evidence → call to action.

Two guarantees are enforced rather than assumed:
- `styles.css` uses a **vmin-based type and spacing scale**, so one scale
  behaves in both orientations.
- `app.js` measures each slide and applies a shrink-to-fit transform
  (`--fit` / `--fit-y`) as a safety net. Verified across eight viewports from
  1920×1080 to 844×390: nothing scrolls, nothing collides with the chrome.

## Stack

- Hand-written HTML/CSS/JS — dark neumorphism over photography, minimalist
- Self-hosted fonts (Montserrat + EB Garamond, OFL) — no third-party requests, GDPR-safe
- Background photo: *Panorama Puerto Maldonado Jungle tree tops* by Ivan Mlinaric,
  CC BY 2.0 via Wikimedia Commons — credited on-screen in the deck footer
- **Supabase** backs the contact form (`cycle_messages` table, project ref `ilpnumlkhpjgadgdotwo`)
  - Row Level Security: anonymous visitors may only INSERT rows with `consent = true`; no read access
  - The key embedded in `app.js` is the *publishable* key — safe to expose by design
  - Server-side enforcement (see [supabase/schema.sql](supabase/schema.sql), the auditable source of truth):
    field-length CHECKs, email-format CHECK, and a rate-limit trigger
    (max 5 inserts/minute, 100/day globally) — a direct POST that bypasses the
    client-side validation and honeypot still hits all of these
- No cookies, no analytics, no trackers → no cookie banner required

## Deploy

Push to `main` → Vercel auto-deploys to **https://cycecso.vercel.app**.
(`vercel --prod` deploys the working tree directly.)

GitHub Pages remains wired up as a fallback but cannot publish: deployments
are cancelled account-wide on TheStormKingG. Its workflow is `workflow_dispatch`
only so pushes don't collect failures.

## Custom domain (later — cycecso.com is not purchased yet)

Once the domain is bought, update the canonical/og/sitemap/robots URLs
from `thestormkingg.github.io/cycecso` back to `cycecso.com`, then:

1. At the DNS provider for `cycecso.com`, add:
   - `A` records for the apex: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `CNAME` record `www` → `thestormkingg.github.io`
2. In the repo: Settings → Pages → Custom domain → `cycecso.com` → Save (creates the `CNAME` file), then tick **Enforce HTTPS** once the certificate is issued.

## Reading contact messages

Supabase Dashboard → project **CYCLE** → Table Editor → `cycle_messages`.
The DB password is stored locally in `.secrets/supabase.env` (never committed).

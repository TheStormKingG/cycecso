# CYCLE website

Website of **CYCLE — Caribbean Youth Conservation Leaders Ensemble**, a youth-led
civil society organisation based in Guyana.

Static site (no build step) deployed on **GitHub Pages**.

## Stack

- Hand-written HTML/CSS/JS — nature-tinted neumorphic design, minimalist
- Self-hosted fonts (Montserrat + EB Garamond, OFL) — no third-party requests, GDPR-safe
- **Supabase** backs the contact form (`cycle_messages` table, project ref `ilpnumlkhpjgadgdotwo`)
  - Row Level Security: anonymous visitors may only INSERT rows with `consent = true`; no read access
  - The key embedded in `app.js` is the *publishable* key — safe to expose by design
  - Server-side enforcement (see [supabase/schema.sql](supabase/schema.sql), the auditable source of truth):
    field-length CHECKs, email-format CHECK, and a rate-limit trigger
    (max 5 inserts/minute, 100/day globally) — a direct POST that bypasses the
    client-side validation and honeypot still hits all of these
- No cookies, no analytics, no trackers → no cookie banner required

## Deploy

Push to `main` → the Actions workflow publishes to GitHub Pages at
**https://thestormkingg.github.io/cycecso/** (no custom domain for now).

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

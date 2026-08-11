# Funder logos

One file per funder, named `funder-01.png` … `funder-10.png` to match
the order of the cards in `index.html`.

## What the file should be

- **Square**, like the member headshots — the disc crops to a circle.
- **480×480 or larger.** PNG with transparency is preferred here (unlike
  the member photos, which are JPEG): logos have hard edges and flat
  colour, which JPEG smears, and transparency lets the disc's own
  background show through.
- The disc renders the logo with `object-fit: contain` on a light tint,
  so wide wordmarks are shown whole rather than cropped to their middle.
  A logo drawn for a dark background will disappear against it — use the
  dark-on-light version.

## If a logo is missing

The card falls back to a building icon, the same way a member card falls
back to a silhouette: `app.js` removes the `<img>` on error, which
reveals the `<svg>` behind it. So a missing or broken file degrades
quietly and never shows a broken-image box.

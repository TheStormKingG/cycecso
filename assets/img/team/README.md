# Member headshots

Drop each member's photo here as `firstname-lastname.jpg`, lowercase,
hyphenated. The first card expects:

    stefan-gravesande.jpg

## What the file should be

- **Square.** The disc crops to a circle, so anything else loses edges.
- **480×480 or larger.** The disc renders up to 122px at 3x, and the
  file is served at its natural size, so there is no reason to go past
  about 720×720.
- **JPEG**, quality ~80. These are photographs behind a small circular
  mask; PNG buys nothing here and costs several times the bytes.
- **Head and shoulders, eyes around the upper third.** The crop is
  `object-position: center 22%`, chosen so a standing portrait keeps the
  face centred rather than the chest.

## If a photo is missing

Nothing breaks. `app.js` removes any `<img>` that fails to load, which
reveals the silhouette behind it, so the card looks exactly like an
unphotographed member's. That means you can add the fourteen remaining
photos one at a time without ever having a broken page in between.

## Adding a photo to a card

In `index.html`, the member's `.tm-ava` span takes the `<img>` **before**
the `<svg>`:

```html
<span class="tm-ava" aria-hidden="true"><img src="assets/img/team/firstname-lastname.jpg" alt="" width="240" height="240" loading="lazy" decoding="async"><svg …>…</svg></span>
```

Order matters: the CSS hides the silhouette with `.tm-ava img + svg`,
which only matches while the image is actually there.

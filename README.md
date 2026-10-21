# Hailey Beauty

**Thirty years of Hong Kong facial practice, now tailoring herbal care for London skin.**

The website for Hailey Beauty, an independent herbal facial studio in Oxford Circus. It is a single-page site with the full treatment menu and prices, live booking through SumUp, a before/after results gallery, and complete English, Mandarin and Cantonese versions.

Live at **[hailey-beauty.pages.dev](https://hailey-beauty.pages.dev)**

<p align="center">
  <img src="docs/screenshots/desktop-treatment.webp" alt="The treatment section of the Hailey Beauty site" />
</p>

<p align="center">
  <img src="docs/screenshots/mobile-home.webp" alt="Hailey Beauty on a phone" width="30%" />
  <img src="docs/screenshots/desktop-booking.webp" alt="Booking section and footer" width="69%" />
</p>

## What the site does

**A menu that answers questions before they are asked.** Every facial, package and waxing service lists its length, price and what the treatment involves, grouped into Signature Facials, Advanced Treatment, Packages, Waxing and Male Waxing.

**Three languages, not three pages.** English, 普通話 and 廣東話 are switched in the header and applied across every heading, price, booking label and footer note, so the whole page changes rather than a subset.

**Booking where the customer already is.** The Book Now buttons hand off to SumUp Bookings, which owns live availability and payment. The site never stores a customer record.

**Proof, not claims.** A before/after gallery of real client results in a gently auto-scrolling carousel that pauses on hover and can be dragged, alongside short treatment notes and aftercare.

**Findable.** Local business structured data, canonical URLs, a Google Maps embed with opening hours, and social links to Instagram, TikTok, Rednote and Facebook.

## Design

Bone, forest green and brass, with a Cormorant Garamond display face over Manrope body text. The layout is built around a printed-menu feel: hairline rules, small caps labels, numbered sections, and generous whitespace. Motion is limited to gentle reveals, and the whole site respects `prefers-reduced-motion`.

## Tech

- Static HTML, CSS and vanilla JavaScript — no framework, no build step
- Chinese type set in Noto Sans/Serif SC and TC alongside the Latin faces
- Booking through SumUp Bookings; map through Google Maps
- A Supabase Edge Function (`supabase/functions/studio`) that redirects `/studio/whatsapp` to the studio's WhatsApp link
- Hosted on Cloudflare Pages

```
index.html        the whole page
styles.css        design system and layout
script.js         translations, gallery, booking links, structured data
assets/           photography, before/after pairs, logo, price list PDF
supabase/         WhatsApp redirect function
docs/screenshots/ README images
```

## Run it locally

Any static server works:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`. There is nothing to install or compile.

To deploy, publish the repository root to Cloudflare Pages (or any static host). The Supabase function is optional and only needed for the WhatsApp short link.

## Editing content

- **Prices and treatments** live in the markup in `index.html`, one card per service.
- **Translations** live in the `copy` objects at the top of `script.js`, keyed `en`, `zh` and `yue`.
- **Booking, social and canonical URLs** are in `SITE_CONFIG` at the top of `script.js`.
- **Photography** goes in `assets/`; the before/after pairs follow the `ba-NN.webp` naming pattern.

## Notes

This repository contains the public website only. Client records, bookings and payments live in SumUp, and the studio's internal tools are not part of this codebase.

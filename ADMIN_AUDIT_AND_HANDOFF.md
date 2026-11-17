# Jame Bouquets — Admin Studio audit and release handoff
Date: 17 November 2026

## Objective and scope
A source-code audit and redesign of the owner-only website editor, published theme data model, custom-order background rendering, Cloudinary media handling, and shop-wide festival styling. Existing products, prices, checkout, order management, coupons, and customer records were **not deleted or reset**.

## Editor map (Admin → Website Editor → `/admin/editor`)
The editor starts on **Themes** with a phone preview. Main controls are:
- **Themes** — Default, Valentines, Durga Puja, Winter/Christmas/New Year, Eid. Each theme retains its own typography, palette, editorial copy, hero image, custom image and footer detail.
- **Hero Photos** — Cloudinary image upload per theme, focus/crop, full-width hero, parallax toggle and intensity. Default still shows its featured product.
- **Banner** — optional *horizontal strip above the hero* with editable label, message, link/button, colours, opacity, and Cloudinary image. Default starts hidden; each festival starts with a non-discount seasonal message. A banner does **not** issue a coupon.
- **Theme Details** — navbar background/text/accent, hero headline colours, custom-order image and overlay/crop, footer tagline, floor colour and optional silhouette replacement. Valentine's special details remain in **Valentine Studio**.
- **Valentine Studio** — dedicated mobile hero photo, custom-order backdrop, Valentine footer park scene, boutique copy and palette.
- **Effects** — gentle effects, snow, overlay, motion speed, parallax and product hover lift; motion honors the browser's reduced-motion setting.
- **Identity**, **Text**, **Collections**, **Style** — store footer copy, headlines/descriptions, category covers, background/button/accent colours and fonts.

**More tools** reveals page builder, section order/visibility, coupon offer badges, SEO, and version history. This reduces clutter without removing business features. Brand logo and contact details remain in Owner Dashboard → Settings, while customer/order/catalogue/coupon tools remain in their existing owner-only tabs.

## Backend and safety
- Editor drafts, published content, history and optimistic revision checks are persisted in MongoDB through `/api/admin/site-content/*`. Editor writes require authenticated owner session and the expected client header.
- Public `/api/site-content` returns only the published version; the editor verifies the **entire** public configuration (not simply theme name) after Publish.
- Cloudinary uploads require owner authentication. Files are restricted to JPEG/PNG/WebP and 5MB decoded size, with allowlisted managed folders.
- The backend creates a content-derived SHA-256 filename. The **same exact image bytes** uploaded into the same folder reuse the asset rather than creating duplicate copies. Conflicting reuploads can retrieve the stored asset; uploads use `overwrite: false`.
- Changing an editor image updates its URL in the draft; it does **not** overwrite the existing URL, which may still appear on customers' pages or an older version.
- A reference-safe cleanup API only destroys managed images when no current catalog item, store logo, published page, saved draft, or version history references them. Replaced photos may intentionally remain in Cloudinary while rollback history references them.
- Existing product photographs remain unchanged. No catalog photo is silently enlarged as a custom-order background.

## Theme floors and colours
- **Valentines**: burgundy and monochrome couple-in-park skyline.
- **Winter**: midnight navy/cream, original fir trees, cabin, Santa silhouette and stylised fireworks.
- **Eid**: dark emerald, original mosque, crescent, lanterns and palm silhouettes.
- **Durga Puja**: maroon/warm gold, original Bengali pandal, trishul, dhaak, dhunuchi and alpana.
- **Default**: restrained neutral storefront; no campaign banner or skyline until explicitly enabled or uploaded.
All four scene assets are original local SVGs under `public/seasonal/` or `public/valentines/`, not emojis or third-party copyrighted art.

## Custom-order stability
The custom-order form's decorative image is optional, fully behind interactive fields, and hidden if it cannot load. Missing backgrounds no longer trigger product photo fallbacks. `SectionErrorBoundary` keeps the rest of the storefront available if this section fails while rendering. The underlying product-size/pricing/lead-time checks and enquiry submission remain separate.

## Automated checks
GitHub Actions executes Node 22 installation, TypeScript `npm run lint`, `npm run test` (includes banner, copy, custom-order and footer regressions), and `npm run build`. Review the *latest* green run on main before signoff.

## Manual owner smoke test before boss/demo signoff
1. Confirm Render backend MongoDB and Cloudinary credentials are set in environment (do not paste credentials into the editor or GitHub).
2. Open `/admin/editor` as an owner; check Preview on **Phone** then **Desktop**.
3. Switch among five themes; edit and save a different headline/font/colour in each, switch back and check changes persist.
4. Confirm Default campaign banner is hidden; turn on a banner in Default and separately edit Winter, with colour/text/button/link and (later) an uploaded image.
5. Test one **new image**, the **identical image** uploaded again to the same managed folder, and a **different replacement**. Repeat should reuse its Cloudinary URL. Confirm replacement appears after Publish.
6. Set a missing custom-order photo and then a valid Cloudinary image; test that size selectors, quote calculation, required fields and submission still work on a real phone.
7. Enable/disable a seasonal footer scene, adjust skyline colour and check that links remain reachable. Test reduced-motion option.
8. Press Save Draft, inspect that the customer site is unchanged; then Publish and verify the customer site updates. Use Versions to restore a previous configuration.
9. Reopen the owner dashboard and verify catalog, order statuses, contacts, coupons and customer data are still present.

## Remaining release qualifications
- GitHub Actions can verify source-level typechecking, unit/SSR tests and build. It **cannot** verify a live authenticated owner session, actual Cloudinary API credentials/uploads, or a live MongoDB-backed Publish without a deployed integration test.
- No user photos were uploaded in this change, as requested. Their slots are ready in the editor.
- Identical upload reuse is exact-byte content based, not visual similarity detection: two differently compressed copies of the same photo produce different hashes.
- Rollback-safe image retention is deliberate, not an immediate Cloudinary garbage collection. Images are never deleted just because their editor slots are replaced before publishing.

## Repository
`imjabed/jerrys-garden` — default branch `main`


## Winter/Christmas theme update — 17 November 2026 (second pass)

**Editor navigation fix:** The owner editor tabs use a responsive 2–3-column wrapping grid, avoiding the previously clipped horizontal tab strip in narrow editor windows. Main panels remain visible and "More tools" still exposes the advanced panels.

**Official supplied Winter imagery (user provided Cloudinary URLs):**
- Navbar: `https://res.cloudinary.com/ajq29txd/image/upload/v1794900853/NavBar.png`
- Desktop hero: `https://res.cloudinary.com/ajq29txd/image/upload/v1794900853/Hero_Desktop.png`
- Phone hero: `https://res.cloudinary.com/ajq29txd/image/upload/v1794900852/Hero_Mobile.png`
- Full-colour footer: `https://res.cloudinary.com/ajq29txd/image/upload/v1794900853/Packing_Santa.webp`

These links are stored under Winter's editable media defaults. A one-time schema migration seeds them into pre-existing site settings (including old empty image fields). Future explicit removals are honoured using `winterAssetsReady`. The exact URLs were supplied by the owner. Remote asset delivery was not independently verified by the GitHub build and must be checked on the deployed site.

**Device-specific images and focal points:** **Hero Photos** now accepts separate desktop and phone photographs for every theme, with non-destructive X/Y focus controls for each device. **Theme Details** adds the same approach for optional custom-order backgrounds, and exposes navbar image upload, opacity, and XY focus. The custom-order section remains legible with plain theme colours when no photograph is set.

**Footer choice:** **Theme Details → Footer display** lets the owner select **Full-colour image / silhouette / no artwork**. Winter defaults to the owner-supplied Packing Santa image. The alternate Christmas skyline SVG shows fir trees, cabin, sleigh and fireworks with editable silhouette colour.

**Text editor:** **Text** provides line breaks, selection-based bold/italic markup, safe preview, theme-specific font choices, font size and text alignment for hero, custom order, craft section, shop heading/paragraph and footer description. Styling is sanitized and rendered as React text; arbitrary HTML is not executed.

**Custom order form:** The design selection now has a **Next · Contact details** button. It validates bouquet quantities, flower/wrapper colours, and delivery lead time before showing contact inputs and the enquiry submit button. The existing server-side validations and 7-day lead time remain in force.

**Backend:** Cloudinary deletion reference tracking now includes mobile hero photos, mobile custom-order photos, navbar textures and real footer artwork.

**Release tests:** New SSR/logic regression coverage in `tests/winterStudio.test.ts` includes legacy Winter migration, owner cropping constraints, safe formatted text, real/silhouette footer selection and step-one custom order UI. The full repository CI runs TypeScript checks, unit tests and production build. A production browser check remains required for owner authentication, Cloudinary image delivery, mobile layout, and two-step enquiry submission.

**Recommendation for demonstration:** Open Admin → Website Editor, choose Winter, open **Hero Photos**, toggle Phone/Desktop previews, inspect image crops, open **Theme Details** to preview the navbar and Santa footer, then go to **Text** and format a heading. Save Draft, verify the public site is unchanged, then Publish and confirm the public URL shows Winter. Test the two-step custom-order form using a valid sample delivery date and verified contact information; avoid placing a real order during a demo.


## Website banner rich text + first-visit loading — November 17, 2026

**Banner Studio (Admin → Website Editor → Banner):**
- The small label, primary announcement, and button text now have *independent* rich-text controls for line breaks, bold/italic selections, font family, size, alignment, and colour. There is a live banner preview even when a theme's banner is disabled.
- The owner may intentionally blank the label or CTA text to hide either element. Saving and publishing preserves line breaks and rich-text markers without executing HTML.
- Banner-wide controls cover background colour, overall alignment, vertical spacing, button appearance (text link / outline / filled), button fill, link destination, background photo, image visibility, and enabled/disabled state.
- Settings are stored per theme and sanitized on both edit/publish paths. Old banner drafts migrate with inherited typography and familiar original colours. The banner remains decorative and does not issue real discounts; coupons still require the separate admin coupon flow.

**First-visit minimalist loading screen (revised):**
- A lightweight HTML/CSS-only 36px circular spinner and exactly two lines of copy appear immediately before React loads: **Loading...** and **Please give us a second, we're preparing your bouquets - Jame Bouquets**. No decorative logo, page title, external icons or extra font/image requests.
- Previously the splash waited on theme and catalogue requests, so a slow Render backend kept it visible for up to 15 seconds. This coupling was removed after the owner reported an indefinitely appearing loader.
- The spinner now clears after a fixed ~2 seconds and never waits for APIs. There are three independent ways it is dismissed: a React entry-point timer, a CSS 2.45s auto-hide, and a tiny inline HTML script that removes it at 2.45s even if the React app doesn't initialize.
- If the React application never mounts, the page underneath offers a small **Refresh the shop** recovery message rather than leaving customers on a blank screen. Normal React error boundaries remain available.
- The effect is a perceived-load improvement, not a reduction in the backend's response times. It cannot ensure the intended theme has finished downloading before the two-second expiry, so check theme loading and API cold-start time separately.
- The loader is skipped on the admin editor route and respects reduced-motion preferences.

**Validation:** `tests/bannerAndLoading.test.ts` covers formatting, optional hidden copy, migration/security sanitization, fixed 2s reveal, CSS fallback, and recovery screen. GitHub Actions performs TypeScript validation, tests, and production builds; do a real-phone smoke test after Vercel deploy.

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

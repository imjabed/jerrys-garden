# Jame Bouquets Studio — Website Editor

**Separate owner-only URL:** `https://jamebouquets.vercel.app/admin/editor`

Open the existing Admin Dashboard and click **Website Editor**. Owners who visit the editor link directly must sign in first.

## Editing a collection cover photo
1. Open **Collections** in the left editor panel.
2. Select Ribbon Bouquets, Pipecleaner Bouquets, Bouquet Keychains, Pipecleaner Keychains or Gift Combos.
3. Choose **Upload category photo**. Select a photo of your actual handmade product (PNG, JPG or WebP, up to 5 MB).
4. Adjust photo position, card name, visibility and position in the list as needed.
5. Click **Save draft**, then **Publish**.

Each category can use one uploaded cover image. If no cover is set, the public card uses the image of an existing product in that category, if available. Empty categories with no cover remain a simple dark, text-only card instead of showing an invented product image.

## Other editing options
- **Text:** edit hero, shop, custom-order and craft-story headings, subtitles and descriptions.
- **Style:** select approved heading/body fonts, font size and a safe palette of colours.
- **Sections:** show or hide sections and reorder them.
- **SEO:** edit the browser title and search-summary description.
- **History:** restore previously published versions into a draft; export/import the homepage configuration as JSON.
- **Preview:** inspect approximate desktop/tablet/phone widths while editing. Always test the published storefront on a real phone.

## Publishing and safety
- **Save draft** stores changes in MongoDB but does **not** change what customers see.
- **Publish** makes the saved draft live without needing a new GitHub commit.
- Live pages only receive the published data. Owner-only endpoints validate the server-side owner session.
- Concurrent saves use revision numbers; if a newer draft exists, the editor asks you to reload instead of overwriting it.
- Images are uploaded through the existing authenticated Cloudinary endpoint; only secure Cloudinary URLs can be saved.
- Existing order, price and inventory management stays in the admin dashboard.

## Deployment and operational notes
- Deploy the latest `main` to **Render** and **Vercel** before opening the editor URL.
- Both services should continue to use their existing environment variables and credentials. MongoDB and Cloudinary must be configured for edits to save.
- The dedicated `vercel.json` rewrite supports direct page loads at `/admin/editor`.
- Product counts are calculated from the current catalog and category IDs stay linked when you rename the visible card title.
- Cover-photo uploads that are canceled before a draft is saved may remain in Cloudinary until cleaned manually.
- Editing the SEO description client-side updates the browser; social crawlers may still use the static metadata until a separate server-rendered metadata workflow is added.

# Jame Bouquets — Reference-Board Seasonal Theme Redesign

## Design brief
The four supplied UI reference boards were used as **visual references**, not embedded as full-page screenshots. They feature a luxury handmade gifting shop with light parchment panels, prominent real-product photography, richly themed decoration and a contrasting dramatic atelier section.

The redesign preserves existing products, real photos, reviews, checkout, sizing, order data and homepage copy. Only visual design, theme presets and decorative graphic assets change.

## The four reference styles

| Theme in Website Editor | Reference board | New visual treatment |
| --- | --- | --- |
| Puja Celebration | Durga Puja Jame Bouquets UI Board | Vermilion and antique gold; illuminated pandal and festive silhouettes; marigold/diya details; deep maroon atelier |
| Eid Celebration | Eid Celebration UI Design Board | Emerald and warm cream; mosque arches, crescent and hanging lanterns; gold framing; dark green atelier |
| Winter Session | Festive Jame Bouquets UI Design Board | Snowy Christmas-style forest/cottage, warm fairy lights, snowman and gift boxes; red shopping buttons; midnight blue atelier; multi-depth snowfall |
| Valentines Week | Valentine's Handmade Bouquets UI Board | Blush and rose palette; flowering tree, heart artwork, romantic couple and ribbon gifts; burgundy atelier |

**Default** remains the original minimal ivory-and-stone design with no seasonal illustration. **New Year Celebration** is retained from the previous editor as an alternate version of the festive/winter board, with additional fireworks.

## What changes on the site

- **Homepage hero** — Decorative panoramic illustrations behind the true product photograph and genuine site copy. Featured-product imagery is framed without replacing it.
- **Atelier / collections** — Dark themed backgrounds with fine gold/rose trim, the same category images already managed in the editor, and automatic product counts.
- **Shop / collection grid** — Festive filtering, real catalog photos, refined product-card borders, featured badges and matching detail buttons.
- **Custom order** — Parchment panels with seasonal trim, matching size buttons and restrained background decoration.
- **Header, footer and story** — Coordinated nav/footer finishes, typography and supporting accents.

## Artwork
The following vector files are included in `public/seasonal/`:
- `puja-festival-panorama.svg`
- `eid-elegance-panorama.svg`
- `winter-holiday-panorama.svg`
- `valentines-romance-panorama.svg`

These are decor-only SVG illustrations designed for a responsive browser layout; they are **not generated product photographs**, and the design-board collages are **not pasted into the page**.

## How to use

1. Deploy the latest `main` to Vercel and Render.
2. Sign in to the owner dashboard, open `/admin/editor`, and click **Themes**.
3. Select the desired visual preset. The editor updates its draft immediately.
4. Under **Motion**, adjust snowfall, fireworks brightness, decorative illustration visibility and placement.
5. Preview at desktop, tablet and mobile sizes. **Save draft**, then **Publish**.

Editor settings are stored in MongoDB. Selecting a preset does **not** publish automatically and does **not** replace catalog images, descriptions or order records.

If you turn **Seasonal atmosphere** or **Theme illustration** off, the decorative panoramic artwork is hidden while the chosen palette and font remain. The original Default preset stays free of this themed decoration.

**Quality note:** SVG vector artwork and CSS decoration approximate the boards' mood and visual structure, rather than reproducing each illustrated detail pixel-for-pixel. Check the actual deployed homepage on a phone and desktop before launching a themed campaign.

# Mobile-first seasonal themes

Five presets are available in **Admin → Website Editor → Themes**:

1. **Default** — Original storefront with the featured product card.
2. **Valentines** — Pink/red palette, soft floating hearts and flowers.
3. **Durga Puja** — Warm marigold/red/gold palette, diya and rising smoke.
4. **Winter / Christmas / New Year** — Snowfall, Santa sleigh and festive ornaments.
5. **Eid** — Emerald/gold palette, gently shimmering crescent moon and lanterns.

All four seasonal heroes **hide the separate featured product card**. Product records,
photos, catalogue filters, prices and checkout remain separate and unchanged.

## Seasonal photos: upload one time

Four high-resolution photo-realistic seasonal bouquet compositions were previously generated
in this conversation. They are not automatically uploaded to Cloudinary because uploading
requires the authenticated store owner's admin session.

1. Download the seasonal hero image pack from the ChatGPT conversation.
2. Sign in to the live website as owner and open **Website Editor → Themes**.
3. Under **Seasonal hero photography**, upload each matching WebP image:
   - Durga Puja → `01_Durga_Puja.webp`
   - Eid Celebration → `02_Eid.webp`
   - Winter / Christmas / New Year → `03_Winter_Christmas_NewYear.webp`
   - Valentines → `04_Valentines.webp`
4. The upload uses the authenticated `/api/upload-image` backend endpoint and saves to
   `jame_bouquets_themes` in Cloudinary. The editor saves the HTTPS CDN URL to the draft.
5. Use the **Phone** preview to inspect the hero image; then click **Publish**.
   Repeat if necessary after selecting the desired live preset.
6. The storefront uses Cloudinary automatic format, quality and size variants (`f_auto,q_auto`).

The uploaded image is a **campaign composition**, not a replacement for any actual
catalogue product photo. If no theme photo is uploaded, the seasonal hero uses its
theme palette and motion accents without falling back to the retired SVG illustrations.

## Seasonal discount banners

Open **Website Editor → Offers**, select the corresponding theme, and edit the banner
percentage, headline, details, and coupon code. Percentage banners are disabled by
default. **Create and activate the same percentage coupon in the owner Coupons panel
before turning on the banner.** A banner alone does not change prices or authorize a
discount, and it should never advertise a discount that checkout won't honor.

## Motion and performance

Theme decorative effects are CSS-only and non-interactive. They honor
`prefers-reduced-motion`. Snow element counts are limited for mobile hardware.
In **Website Editor → Motion** you can disable animations without losing the seasonal
photograph, control snowfall intensity and (on wide screens) adjust parallax.
The Default theme remains clean. The phone preview opens by default.

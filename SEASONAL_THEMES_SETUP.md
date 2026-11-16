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
2. Sign in to the live website as owner and open **Website Editor → Hero Background**.
3. Use **Background to edit** to choose Default, Valentines, Durga Puja, Winter or Eid,
   then select **Upload or replace background** for each image:
   - Durga Puja → `01_Durga_Puja.webp`
   - Eid Celebration → `02_Eid.webp`
   - Winter / Christmas / New Year → `03_Winter_Christmas_NewYear.webp`
   - Valentines → `04_Valentines.webp`
4. The upload uses the authenticated `/api/upload-image` backend endpoint and saves to
   `jame_bouquets_themes` in Cloudinary. The editor saves the HTTPS CDN URL to the draft.
5. Adjust **Background image focal point** (0–100%) for the bouquet to sit correctly behind
   the hero heading. Choose **Move hero photo gently when scrolling** and adjust
   **Parallax strength** to control the optional scroll movement.
6. Use the **Phone** preview and scroll the preview frame to inspect the image/parallax.
   To change the currently active theme, use Themes or **Preview selected theme as active theme**.
   Click **Publish** to make the active design visible to customers.
7. The storefront uses Cloudinary automatic format, quality and size variants (`f_auto,q_auto`).

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
In **Website Editor → Hero Background**, parallax can be enabled independently of the
seasonal decorative animations and can be adjusted for both desktop and phones.
On phones it uses smaller bounded CSS transforms rather than fixed backgrounds;
visitors who request reduced motion see a stationary image. The photo remains
visible even if seasonal animations are disabled.

**Default** may also have a custom Cloudinary hero background, but it retains its
separate featured product card. The editor opens with a phone preview by default.

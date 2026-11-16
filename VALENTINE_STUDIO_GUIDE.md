# Jame Bouquets — Valentine Maison

The Valentine's theme is deliberately independent of Default, Durga Puja, Winter and Eid.
The seasonal theme can be selected from **Admin → Website Editor → Themes**.
Choose **Valentine Studio** for this theme's bespoke typography, photography and colours.

## What is live in code

- Burgundy navbar with refined satin-ribbon SVG detail, pale typography and subtle gold/rose trim.
- Full-bleed Valentine hero (NO separate featured product card). Desktop photo, optional
  independently uploaded mobile portrait, editable heading, subtitle, CTA and colours.
- Secondary custom-order photographic background with adjustable crop and readability veil.
- Original single-colour park scene: a couple seated together on a bench near a flowering
  tree and lamppost, with the silhouette ground connected directly to the footer floor.
- Deep wine footer, soft sunset backdrop, editable footer scene, boutique copy, social links.
- Shared Valentine palette throughout collection cards, the product-detail page, shopping
  bag, checkout, account, tracking, reviews and store policies.
- All animation is restrained CSS. Floating Valentine emojis have been removed.
  A subtle sunset light change respects the visitor's reduced-motion setting.

## One-time image uploads

**These images are provided as a separate Valentine photo pack in the ChatGPT reply.**
They cannot be uploaded to the owner's Cloudinary account without an authenticated
owner session. Until the photo uploads are made, the website uses real product photos
from its catalogue as temporary hero/custom-order backgrounds.

1. Download `Jame_Bouquets_Valentine_Luxury_Photos.zip` from ChatGPT.
2. Sign in on the website as the owner and visit **Website Editor**.
3. Select the Valentine theme from **Themes**.
4. In **Hero Background**, choose Valentines and upload `valentine-hero.webp`.
   Adjust the focal point and optional parallax in the same panel.
5. In **Valentine Studio → Photographic hero**, upload
   `valentine-hero-mobile.webp` as the mobile hero version.
6. In **Valentine Studio → Custom order photography & copy**, upload
   `valentine-custom.webp`. The section will use it behind the custom-order form.
7. Open the Phone, Tablet and Desktop previews. Adjust hero text, image positions,
   section overlay opacity and colours as desired.
8. Click **Publish**. The public website will now use the saved Cloudinary URLs.

## Editing without developers

**Valentine Studio** includes:
- Independent Valentine hero text and button labels.
- Independent custom-order section text and photo.
- Cropping and custom image overlay intensity.
- Mobile hero photo (separate from desktop).
- Enable/disable/edit the footer skyline. The bundled SVG is at
  `public/valentines/park-couple-silhouette.svg`.
- Upload a custom transparent PNG/WebP silhouette into Cloudinary. It will be recoloured
  using the chosen silhouette colour.
- Navbar, hero, products, buttons, custom order and footer colour controls.
- Valentine footer tagline, description and note.

The **Hero Background** tab provides editable desktop photo crop and optional smooth
parallax. On mobile, it uses bounded image transforms rather than fixed backgrounds.
The **Offers** tab separately controls a Valentine percentage promotion; it must match a
real active coupon before enabling the banner.

No actual product photos, prices, orders, fulfilment or checkout code have been replaced.

## Asset licensing

The original vector silhouette in this repository was authored for Jame Bouquets and
does not require attribution to a third-party SVG library. The photos included with
the project delivery were generated for this design and should not be represented as
actual photographed inventory; the products pictured are artistic compositions.

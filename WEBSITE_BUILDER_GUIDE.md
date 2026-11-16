# Jame Bouquets Studio · Website Builder

**Editor route:** `/admin/editor` (protected by the existing owner login).

## Design from a template
Open **Admin Dashboard → Website Editor → Themes**. Choose one of six presets:

- Default (warm ivory/stone)
- Valentines Week (soft blush/burgundy)
- New Year Celebration (midnight/champagne)
- Puja Celebration (warm marigold/vermilion)
- Eid Celebration (emerald/soft gold)
- Winter Session (frost blue/silver)

Click a theme to change the **draft** palette, heading/body fonts, backgrounds and suggested ambient visual effects. Themes preserve products, category images, every written heading, all section blocks and the ordering. Click **Save draft** then **Publish** for the public site to change. More individual colour/font controls are under **Style**.

## Create and rebuild homepage sections
In **Build**, select one of these reusable layouts: Editorial text, Image & text, Photo gallery, Call to action, Highlights, Questions & answers, Spacer.

Each can be duplicated, deleted, moved, reordered, hidden, and independently styled for background/text colour, alignment and vertical padding. Images can be uploaded to Cloudinary through the existing owner-only upload endpoint. FAQ and highlight cards can be added/removed individually. The section order is managed under **Sections**, alongside the original built-in Hero, Collections, Shop, Reviews, Custom Orders and Story sections. Limit: 24 additional blocks; 8 photos/gallery; 6 cards/FAQ answers.

Original shop/product/order/review/customer functionality stays separate and cannot be accidentally rewritten by the page builder.

## Effects and movement
Open **Motion** for:
- Master effects switch
- Soft ambient glow
- Glowing particles
- Decorative moving objects: drifting petals, snow, confetti, lantern silhouettes, abstract glints
- Object density (up to 28), movement speed and opacity
- Scrolling parallax with intensity slider
- Optional subtle product/collection hover lift

Effects appear **behind hero content**, not over checkout or navigation; motion respects `prefers-reduced-motion` for accessibility. Default theme has decorative motion switched off. The seasonal presets suggest fitting effects. These are deliberately lightweight CSS-based effects rather than full-screen animation libraries.

## Header and footer
Under **Header/Footer**, enable and edit an announcement banner, choose a safe internal or HTTPS destination, change banner colours, update footer description and order notice, and choose footer background. Brand logo, store contact details and product inventory remain in **Admin Settings**.

## Recommended publishing workflow
1. Export a JSON backup from **History** before major design changes.
2. Choose a theme, build new sections, and reorder them in **Sections**.
3. Upload your actual product/brand photographs.
4. Adjust typography, section colours, animations, banner and footer.
5. Check Desktop, Tablet and Phone previews.
6. **Save draft**, then **Publish**. Previewing and saving do *not* change the live site.
7. Open the live site on real mobile browsers and test categories, product pages, checkout and order tracking.

Publishing settings are stored in MongoDB and do not require a new GitHub commit for routine content/design changes. Previously published versions can be loaded as drafts from **History**.

### Limits of the no-code editor
This is an expanded **homepage editor and reusable section builder**, not a source-code editor. The checkout, authentication, customer account, payment logic and backend APIs remain code-managed for safety. Arbitrary custom JavaScript/HTML is intentionally unsupported. Themes do not add religious symbols or generic commercial stock images.


## Upgraded theme illustrations (November 2026)

The **Themes** gallery now uses hand-crafted, transparent SVG scenes:
- **Default:** pure minimal ivory/stone layout (no seasonal illustration).
- **Valentines Week:** a softly shaded couple beneath a decorative arch and ribbon-flower details.
- **New Year Celebration:** layered champagne, silver and gold fireworks bursts.
- **Puja Celebration:** a warm diya flame, marigold garlands and alpana-inspired ornament.
- **Eid Celebration:** an ornamental arch, crescent and hanging brass-toned lanterns.
- **Winter Session:** snowy pine landscape and layered snowfall with three depths.

Go to **Website Editor → Motion** to:
1. Switch the entire seasonal atmosphere on/off.
2. Enable/disable the themed illustration.
3. Select **Hero only** or **Hero + story + custom order** for background artwork.
4. Change illustration visibility, gentle artwork movement and parallax intensity.
5. For Winter, turn on **Layered snow** and set **Snow intensity** (80–100% for extra snowfall).
6. For New Year, toggle fireworks and adjust their brightness.
7. Set motion speed. Visitors with reduced-motion preferences see static/reduced effects.

Generic glowing dots, neon-like glows and random geometric objects have been retired. All artwork remains decorative, behind the shop's content and controls; it does not appear over product detail/checkout content.

**Important:** Changes made in the editor are drafts until **Publish**. Deploy the latest frontend and backend commit before using the new theme controls; older published settings are upgraded safely when read.

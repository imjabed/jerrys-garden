# Jame Bouquets Studio — owner-first website editor roadmap
Date: 17 November 2026

## Design principle
A nontechnical administrator must be able to safely update content, images, typography, brand colours and seasonal presentation without touching repository code. Business logic (payment, pricing, customer data, authenticated actions) remains protected behind the backend.

## Status by professional editor capability

| Capability | Current state | Where |
|---|---|---|
| Click section in live preview to open controls | Implemented | Browser preview → inspector |
| Click a specific text element to edit that field | Implemented for hero, shop, story, custom-order | Browser preview → Text |
| Click a collection card to edit that card | Implemented | Browser preview → Collections |
| Undoable bold/italic, selected-word formatting | Implemented | Text → B / I |
| Explicitly remove italic from decorative accent lines | Implemented | Text → e.g. Hero accent line → Italic OFF |
| Undo/redo, reset whole-field style, clear inline emphasis | Implemented | Text toolbar |
| Line breaks, fonts, text size, alignment, text case, letter and line spacing, colour | Implemented | Text |
| Per-theme content, colours and typography | Implemented | Themes, Text, Style |
| Desktop/mobile hero image, focal-point crop and parallax | Implemented | Hero Photos |
| Navbar/custom-order/footer photos, mobile variants, and silhouette options | Implemented | Theme Details |
| Theme banners, labels, CTA, rich text, colours and links | Implemented | Banner |
| Show/hide, reorder pages' homepage sections and add/duplicate content blocks | Implemented | More Tools → Arrange / Page Builder |
| Global buttons and section backgrounds | Implemented in part | Style |
| Animation, motion, particles and parallax | Implemented | Effects |
| Draft, published version, revision/history, backup import/export | Implemented | Save/Publish; More Tools → Versions |
| SEO metadata and main theme | Implemented | More Tools → SEO |
| Font line-height accessibility and image focal preview | Implemented | Text, images, device preview |
| Accessibility audits for contrast and missing alt text | Planned | Future Accessibility panel |
| Individual section spacing, width and min/max height | Planned | Future Layout inspector |
| True drag-and-drop grid/stack/reparenting | Planned (requires safe component layout model) | Future Visual Layout |
| Device-specific text overrides and positioning | Planned | Future Responsive inspector |
| Site page creation/routing and template library | Planned | Future Pages |
| Design tokens, reusable style classes and components | Planned | Future Brand Library |
| Bulk image manager and file replacement browser | Planned | Future Media Library |
| Role-based editorial permissions and scheduled publishing | Planned | Future Team workflows |
| Real browser visual regression screenshot suite | Planned | Pre-release verification |
| Full checkout/payment/pricing code editing | Deliberately not exposed to a visual editor | Protected backend workflows |

## Interaction contract
1. Click a section on the preview, or click the exact text inside the section.
2. Inspector switches automatically. Related tools appear at the top of the panel.
3. Use phone/tablet/desktop view to inspect design. Changes to values are stored in the draft until **Save draft**; **Publish** is the separate customer-facing action.
4. Select text first then press **B** or **I**. Press the same button on the same selection again to *remove* formatting. With no selection, B and I toggle the style for the entire text field.
5. A heading's decorative accent uses text presentation styles instead of a forced `italic` class. Its Italic checkbox can be turned off completely.
6. Use Undo/Redo for textual changes in the current text editor; `Versions` restores saved/published designs as a separate action.

## Safety/limitations
- Basic bold/italic are represented as safe inline emphasis markers (not arbitrary HTML). Complex nested rich text, embedded links within arbitrary words, lists/tables or multiple font sizes in one sentence require a future structured rich text document model.
- This editor is not a replacement for arbitrary code execution. Product/catalogue/order controls remain in Owner Dashboard.
- An automated GitHub typecheck, test suite and build are not a substitute for final browser testing with owner login and a real mobile device.
- Existing site content remains in MongoDB. Changes to saved theme copy, image references and catalog items should not be silently erased.

## Recommended next implementation order
1. **Section Layout inspector:** padding/margin, min height, content width, column gaps, borders/radius, background, sticky/stacking control with guardrails.
2. **Responsive override controls:** independent mobile/desktop typography and hide/stack behaviour.
3. **Media Library:** centralized Cloudinary browse/replace/crop/reuse and image metadata controls.
4. **Pages & links:** custom page creation, navigation menu builder, component/CTA link editor, redirects.
5. **Reusable design system:** theme variables, saved typography/button presets, reusable sections.
6. **Quality controls:** contrast, keyboard navigation, alt text, responsive overflow, publish preview approval.

# Jame Bouquets — Admin and Website Editor release audit
**Date:** 17 November 2026
**Priority:** Website Editor and the banner-background rendering incident
**Source:** `main` branch; automated GitHub Actions validation with mocked backend and Chromium.

## Incident and findings
The editor previously ran only TypeScript checks, unit tests and a production build. It did **not** run real-browser editing workflows. That gap allowed selection/interaction bugs to pass CI, even though the build was green. The precise root cause of the user's **production** blank page after changing a banner background is **not independently established** without production browser logs and the live saved design.

A genuine browser test reproduced a separate defect: selecting part of a sentence and then entering a font size could lose the selection, leaving Apply ineffective. Selection capture now uses native text-selection, mouse, and keyboard events. The earlier unit tests could not detect this.

## Implemented safeguards
- `StudioErrorBoundary` isolates editing/preview rendering failures and shows a recoverable error panel instead of a blank screen.
- If the visual preview throws an error, **Publish is blocked**. Correct the draft and use **Retry preview** before publishing.
- Banner font and colour updates now use functional React state merges so rapid changes do not overwrite each other.
- New GitHub Actions gate runs a Chromium browser suite using the real Vite/React app with mock authenticated API responses, without touching live orders or customers.
- On browser test failure, CI uploads screenshots and Playwright traces for diagnosis.
- CI runs on Ubuntu 24.04 for Playwright browser compatibility.

## Automated browser workflows — passed
| Feature | Test coverage | Limits |
| --- | --- | --- |
| Banner background colour | Change Winter banner colour, check preview, save draft, publish mock backend, compare published values | Not a real production MongoDB publish |
| Five seasonal banners | Change background colours for Default, Valentine, Puja, Winter and Eid | Mock backend |
| Image upload | Upload a local PNG to mocked Cloudinary API, verify the saved image URL | Real Cloudinary credentials and CDN not exercised |
| Hero image crops | Change desktop crop, save and verify persisted value | Actual appearance on a physical phone not measured |
| Preview responsive devices | Switch Desktop, Tablet and Phone, check no runtime crash | Does not prove every CSS breakpoint/layout |
| Editor panels | Open Banner, Theme Details, Hero Photos, Text, Effects, Collections, Style and Identity for five themes | Rendering checked; not every individual control in every panel |
| Mobile editor preview | Open/close menu, select hero text, open matching editor field | Not live mobile hardware |
| Selection formatting | Select part of a banner sentence, apply font size, save text, verify markup | Advanced mixed formatting and all keyboard combinations need further testing |
| Owner Dashboard | Navigate Orders, Customer insights, Products, Offers, Reviews and Settings, then open Website Editor | Does not mutate real orders, coupons, products or customers |

## Existing automated unit / build coverage
`npm run lint`, `npm run test` and `npm run build` run for each push. Existing tests exercise defensive custom-order validation, media/settings sanitization, theme defaults, banner formatting and several other domain logic paths. Browser failures now fail the entire release workflow instead of being ignored.

## Still unverified — do NOT promise flawless live behaviour
1. Production Vercel deployment and live browser console; the connected Vercel account did not return a project matching this GitHub repository.
2. Owner login, cookies and session persistence across the real Vercel/Render domains.
3. Real MongoDB draft concurrency and publication, after real customer data is involved.
4. Real Cloudinary uploads, reuse/deduplication, replacement and cleanup.
5. Actual customer checkout, enquiry submission, order-status mutation, coupons and payment collection.
6. Every field of the entire Admin Dashboard and each possible sequence of editor actions.
7. Device visual regression screenshots, real network latency and older browser compatibility.

## Before the next boss presentation
- Confirm Vercel has deployed the latest commit from `main`, and load the real website with DevTools open.
- In the admin editor, first **save a backup/export**. Check each theme's banner background and click through Desktop, Tablet and Phone previews.
- Save a draft without publishing; confirm the public site remains unchanged. Only then publish and verify the storefront in a separate incognito window.
- Open Account, Mobile Menu, Custom Order, Collections and Footer to check visual layout.
- For new image uploads, use a disposable/sample file first and confirm the new Cloudinary image resolves.
- If a render-error recovery appears, do **not** publish. Capture the technical detail and GitHub browser-test trace.
- Keep the previous published revision available for rollback.

**Release confidence:** The code and mock-browser paths listed above are verified. Production readiness remains conditional on the outstanding live checks.

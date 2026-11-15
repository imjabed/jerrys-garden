# Jame Bouquets — Launch checklist

Use this checklist after the `Validate Jame Bouquets` GitHub Actions workflow passes.
Passing the build is **not** a substitute for testing the live domain.

## Hosting & accounts
- [ ] Deploy the latest `main` commit to **Render** (backend) and **Vercel** (frontend).
- [ ] Render runs Node 22, `npm install && npm run build`, then `npm start`.
- [ ] Confirm Render has `MONGODB_URI`, `AUTH_SECRET`, `ADMIN_EMAIL` and the configured admin password credentials.
- [ ] Verify `FRONTEND_URL` lists the actual public origin for CORS.
- [ ] Verify Vercel's `VITE_API_URL` points to the live Render service and rebuild Vercel after changing it.
- [ ] Test email OTP and order emails; confirm the AgentMail settings work.
- [ ] Confirm Cloudinary uploads, image replacements and deletion behavior.
- [ ] Verify owner 2FA if `ADMIN_TOTP_SECRET` is enabled.

## Real-customer smoke tests
- [ ] On a phone, open the website, search, view a product and add it to the bag.
- [ ] Complete a **Berhampore** test order through to the order reference (without online payment).
- [ ] Confirm a non-Berhampore city cannot be accepted, and check the address manually.
- [ ] Try a past preferred date (rejected) and leave the date blank (allowed).
- [ ] Try quantity 20 (allowed) and 21 (blocked).
- [ ] Create a live test coupon; verify valid, expired, ineligible and wrong-email scenarios.
- [ ] Place a custom enquiry with seven days' notice, confirm the local-delivery checkbox and check the quote is **not treated as collected revenue**.
- [ ] From a real customer account with a **Delivered** order, submit one review for the purchased product; verify another product is not reviewable.
- [ ] Owner → Reviews: check the new review starts Pending and publish it. Confirm the product page, product card and homepage show only published verified reviews.
- [ ] Hide an inappropriate test review and verify it disappears from public displays.
- [ ] Test order tracking as guest and signed-in customer.
- [ ] Test adding a product as owner, replacing its image, and handling a deliberately failed save.
- [ ] Check the Instagram, WhatsApp Channel, email, delivery, returns, privacy and ordering-information links.
- [ ] Check the website, favicon and mobile menu on Android and iPhone browsers.

## Before accepting public orders
- [ ] Use genuine photos of each real Jame Bouquets product; remove any old stock-image products.
- [ ] Confirm prices, stock availability, product contents and descriptions.
- [ ] Review all customer policy text and finalize your actual delivery, returns/cancellation and personal-data practices.
- [ ] Verify the public contact email and how quickly your team can realistically confirm orders.
- [ ] Verify Render and Vercel deployments are healthy, not just the GitHub CI checks.

**Notes:** Checkout sends order requests without online payment. Custom event prices remain estimates until confirmed. New product reviews require delivered orders and owner moderation.

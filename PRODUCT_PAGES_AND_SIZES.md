# Product pages & bouquet sizes — Jame Bouquets

## Product pages

All catalog products now have a dedicated, shareable route: `/products/<product-id>`. Clicking product images, names, buttons, or featured products opens the full page rather than a popup. Visitors can use the browser back button.

Below each product are up to four available suggestions, prioritizing the same collection and categories the visitor previously viewed. Browsing history is stored locally on that visitor's browser (`jb_recent_products_v1`), not attached to their account or uploaded to the server.

## Size options for catalog products

Go to **Admin Dashboard → Products → Edit Product**. For every bouquet, use **Available sizes & prices** to configure:
- Small (S): flower count and selling price
- Medium (M): flower count and selling price
- Large (L): flower count and selling price
- Extra Large (XL): flower count and selling price

Enable only the sizes you currently offer. A product may have different flower counts and prices from another product. Size pricing is recalculated and checked against the current MongoDB product record when the order is placed. Keychains and other non-bouquet items use their regular one-size pricing.

**Legacy catalog products:** Until edited, each existing bouquet retains its original price and flower count in the Medium size only; the other sizes show as unavailable. This avoids inventing prices or quantities. Configure all four options for products you want to offer in four sizes.

## Custom event order sizes

Go to **Admin Dashboard → Settings → Custom order size chart**. Set the number of flowers for Small, Medium, Large and Extra Large. The default mapping is **25 / 50 / 75 / 100** only until you save your actual size chart. Each count must be a multiple of five, between 25 and 100, increasing from Small to Extra Large. These values affect the Custom Order form and its indicative quote. The API checks the selected size and flower count against the saved settings.

## Before launch

1. Review the catalog size charts and enter the actual prices and counts.
2. Save the custom event size mapping in Settings.
3. Deploy the latest `main` branch to both Vercel and Render.
4. Test a product link opened in a new tab, browser Back, Add to Bag and Buy Now.
5. Test adding the same product in two different sizes to the bag. They should appear as separate lines with different totals.
6. Verify coupon discounts use the price of the selected size and the order record shows the correct count.
7. Test the Custom Order quote for each size and confirm the flower counts.
8. Confirm that the personalised suggestions show genuine catalog products and no fabricated reviews.

**Note:** The recommendation order uses local recently viewed categories, not individual customer profiles or external AI tracking.

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const output = new URL('../dist/', import.meta.url);
const guides = JSON.parse(await readFile(new URL('../shared/giftGuides.json', import.meta.url), 'utf8'));
const origin = 'https://jamebouquets.in';
const guidePath = (guide) => `/guides/${guide.slug}.html`;
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

await mkdir(fileURLToPath(new URL('guides/', output)), { recursive: true });

for (const guide of guides) {
  const title = `${guide.title} | Jame Bouquets`;
  const url = origin + guidePath(guide);
  const related = guides.filter((item) => item.slug !== guide.slug);
  const html = `<!doctype html>
<html lang="en-IN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(guide.description)}">
  <link rel="canonical" href="${url}">
  <link rel="icon" href="/favicon.png">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(guide.description)}">
  <meta property="og:url" content="${url}">
  <style>
    body { margin: 0; background: #fff7ef; color: #400719; font: 1rem/1.65 system-ui, sans-serif; }
    header, main, footer { max-width: 45rem; margin: auto; padding: 1.25rem; }
    header { border-bottom: 1px solid #40071930; display: flex; flex-wrap: wrap; gap: 1rem 2rem; }
    a { color: inherit; text-underline-offset: .2em; }
    h1, h2 { font-family: Georgia, serif; line-height: 1.15; }
    h1 { font-size: clamp(2rem, 6vw, 3.5rem); }
    main section { margin-top: 2rem; }
    .shop { display: inline-block; margin-top: 1rem; padding: .65rem 1.1rem; background: #400719; color: #fff7ef; border-radius: .3rem; }
    footer { border-top: 1px solid #40071930; }
  </style>
</head>
<body>
  <header><a href="/">Jame Bouquets</a><a href="/all-products">All products</a></header>
  <main>
    <h1>${escapeHtml(guide.title)}</h1>
    <p>${escapeHtml(guide.intro)}</p>
    ${guide.sections.map(([heading, body]) => `<section><h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p></section>`).join('\n    ')}
    <a class="shop" href="/all-products">Browse the Jame Bouquets catalogue</a>
  </main>
  <footer>
    <nav aria-label="Related gift guides">
      <ul>${related.map((item) => `<li><a href="${guidePath(item)}">${escapeHtml(item.title)}</a></li>`).join('')}</ul>
    </nav>
    <p>Jame Bouquets · Berhampore, Murshidabad</p>
  </footer>
</body>
</html>
`;
  await writeFile(new URL(`.${guidePath(guide)}`, output), html);
}

const index = await readFile(new URL('index.html', output), 'utf8');
const catalogueTitle = 'Shop Ribbon Bouquets & Handmade Gifts | Jame Bouquets';
const catalogueDescription = 'Browse the Jame Bouquets catalogue for handmade ribbon flower bouquets, keepsakes and gifts for anniversaries and couples.';
const catalogue = index
  .replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(catalogueTitle)}</title>`)
  .replace(/(<meta (?:name|property)="(?:description|og:description|twitter:description)" content=")[^"]*/g, `$1${escapeHtml(catalogueDescription)}`)
  .replace(/(<meta (?:name|property)="(?:og:title|twitter:title)" content=")[^"]*/g, `$1${escapeHtml(catalogueTitle)}`)
  .replace(/(<meta property="og:url" content=")[^"]*/, `$1${origin}/all-products`)
  .replace('</head>', `  <link rel="canonical" href="${origin}/all-products">\n  </head>`);
await writeFile(new URL('catalogue.html', output), catalogue);

const routes = ['/', '/all-products', ...guides.map(guidePath)];
await writeFile(new URL('sitemap.xml', output), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url><loc>${origin}${route}</loc></url>`).join('\n')}
</urlset>
`);

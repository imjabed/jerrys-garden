# Jame Bouquets

A premium handmade-gift storefront with product catalogue, custom-event enquiries,
contact-first checkout, an owner operations workspace, and order-based customer insights.

## Develop locally

Requires Node.js 22+ and a MongoDB Atlas database.

```bash
npm install
npm run lint
npm run build
npm run dev
```

Configure server secrets in Render (or a local, uncommitted `.env`). Configure
`VITE_API_URL` for the frontend in Vercel, and `FRONTEND_URL=https://jamebouquets.vercel.app`
on Render. Never commit credentials, secret keys, customer data or database URIs.

## Render deployment

Render service: **Web Service**, runtime **Node**, branch **main**.

- **Build command:** `npm install --include=dev && npm run build`
- **Start command:** `npm start`
- **Node:** use Node.js 22 (for example, `NODE_VERSION=22` on Render).
- **Root directory:** repository root (leave blank unless your service uses a separate app directory).
- **Environment:** `NODE_ENV=production`, `MONGODB_URI`, `AUTH_SECRET`, `ADMIN_EMAIL`, and configured admin password credentials; plus mail/Cloudinary secrets when enabled.

**Do not use `npm ci` for the moment.** The old lockfile was inconsistent
with `package.json` (it omitted the MongoDB dependency), so it was removed.
A fresh `package-lock.json` should be regenerated and committed after a
successful clean install. On a development computer, run `npm install` and
commit the resulting lockfile, then `npm ci` will become safe again.

The server is built to `dist/server.mjs` (ES module). An older Render
start command such as `node dist/server.cjs` will no longer work.

If a deployment fails, inspect **Render → Logs / Events** and find the first
installation, TypeScript, build, or runtime error. Out-of-memory, service
suspension and paid-plan/resource limits cannot be confirmed from source code.

## Owner security

The dashboard uses a short-lived, signed, HttpOnly session cookie; owner-only
API authorization; rate-limited sign-in; permitted-origin request checks; and
read-only database diagnostics. The customer analytics section is restricted
to authenticated owners.

**Required server variables**
- `ADMIN_EMAIL`: owner login email
- `AUTH_SECRET`: high-entropy random key. Rotating this invalidates all sessions
- `ADMIN_PASSWORD_SCRYPT`: recommended salted scrypt password hash (see below)
- `MONGODB_URI`: server-side database connection
- Cloudinary credentials for logo and product image uploads

**Optional stronger protection**
- `ADMIN_TOTP_SECRET`: base32 secret for an authenticator app (6-digit, 30-second TOTP).
  If configured, both owner login paths require a valid app-generated code.
  Generate the secret securely and enroll it in the authenticator app before
  setting it on Render. Store recovery material offline. Losing the secret and
  authenticator access requires a secure environment-level recovery by the owner.
- `ADMIN_PASSWORD`: backward-compatible legacy password. Once
  `ADMIN_PASSWORD_SCRYPT` has been tested, remove `ADMIN_PASSWORD` from Render.
- `ALLOW_DATABASE_MAINTENANCE`: defaults to disabled in production. Only
  temporarily set to `true` during controlled maintenance; restore the default
  immediately afterward.

Generate a salted hash **locally**, replacing the example password with your
own long unique password. Do not paste your password into chat or store it in
GitHub:

```bash
node -e "const c=require('node:crypto');const p=process.env.NEW_ADMIN_PASSWORD;if(!p)throw Error('Set NEW_ADMIN_PASSWORD locally');const salt=c.randomBytes(16);console.log(salt.toString('hex')+':'+c.scryptSync(p,salt,64).toString('hex'))"
```

Set the output as `ADMIN_PASSWORD_SCRYPT` on Render. The example command
reads `NEW_ADMIN_PASSWORD` from your local shell environment; clear it
afterwards. Test owner sign-in before removing the legacy variable.

**Important:** No application can be guaranteed impossible to hack. Enable
multifactor authentication, use unique credentials, keep dependencies updated,
limit MongoDB network access and database permissions, protect your hosting
accounts with MFA, and keep secure backups. The per-instance login limiter is
not a substitute for a managed WAF or distributed rate limiting.

## Owner workspace

Sign in as owner using the normal customer sign-in form (plus an authenticator
code if enabled). Use **Customer insights** to see recorded-order segments:
- **Needs follow-up:** any order placed or pending
- **Priority:** repeat buyers (3+ delivered orders), or 2+ delivered orders
  and top-quartile completed order value when there is enough data
- **Re-engage:** last order more than 60 days ago
- **New:** no delivered orders
- **Regular:** other returning buyers

These are operational segments derived from order history, not behavioral
tracking. Order values are not verified receipts or payment totals. Custom
order ranges are estimates and are not treated as revenue.

Go to **Settings → Brand identity** to upload a logo and edit the business
display name. The name always appears beside the logo in header and footer.
The change takes effect after saving the settings.

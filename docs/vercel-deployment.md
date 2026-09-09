# Deploying Alta Mortgage Group to Vercel

Vercel is built by the creators of Next.js. Deploys are atomic (no CSS/JS
mismatch ever), there's no ModSecurity/LiteSpeed to fight, and the free tier
easily covers a mortgage brokerage's traffic. Your code does not change — Vercel
reads the same GitHub repo.

Total time: ~5 minutes.

---

## Part 1 — Create the Vercel project (one time)

1. Go to **https://vercel.com**
2. Click **Sign Up** → **Continue with GitHub** (use the same GitHub account that owns the repo)
3. Authorize Vercel when prompted
4. On your Vercel dashboard, click **Add New… → Project**
5. Find **`cboerstra/AltamortgageWebsite3`** in the list → click **Import**
   - If you don't see it, click **Adjust GitHub App Permissions** and grant access to the repo
6. On the configuration screen:
   - **Framework Preset:** Next.js (auto-detected — leave it)
   - **Build Command:** leave default (`next build`)
   - **Output Directory:** leave default
   - **Install Command:** leave default
   - **Root Directory:** leave as `./`
7. **Before clicking Deploy**, expand **Environment Variables** and add the ones below (Part 2)
8. Click **Deploy**

Vercel builds and deploys in ~2 minutes. You'll get a live URL like
`alta-mortgage-website2.vercel.app` — open it and confirm the site is fully
styled. (It will be.)

---

## Part 2 — Environment variables

Add these in the Vercel project's **Settings → Environment Variables**
(or during the import screen). Set each for **Production, Preview, and Development**.

### Required
| Key | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://altamortgagegroup.net` |

### Email notifications (SMTP)
| Key | Value |
|---|---|
| `SMTP_HOST` | `mail.altamortgagegroup.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `leads@altamortgagegroup.net` |
| `SMTP_PASS` | (your mailbox password) |
| `NOTIFICATION_EMAIL` | `leads@altamortgagegroup.net` |

### CRM webhook (when ready)
| Key | Value |
|---|---|
| `CRM_API_URL` | (real webhook URL from altamortgagecrm.net) |
| `CRM_API_KEY` | (freshly generated key) |

### Database — IMPORTANT
Your `DB_HOST=localhost` will NOT work on Vercel, because Vercel doesn't run on
the same server as your Hostinger MySQL. You have two choices:

- **Option A (simplest):** Leave the `DB_*` variables OUT entirely. The app
  gracefully skips database persistence — leads still email you and forward to
  CRM. You lose only the local backup copy.
- **Option B (full persistence):** Point at a cloud database that Vercel can
  reach over the internet. Two easy paths:
  - Keep your Hostinger MySQL but enable **Remote MySQL** in cPanel (add Vercel's
    egress to the allow-list, set `DB_HOST` to the public hostname Hostinger gives
    you — NOT `localhost`).
  - Or migrate to a serverless DB (PlanetScale free tier for MySQL, or Supabase
    for Postgres). This would require a one-time code tweak — ask Claude.

Recommendation: launch with **Option A** to get live fast, add a database later.

---

## Part 3 — Point your domain at Vercel

Once you've confirmed the `.vercel.app` URL looks perfect:

1. In the Vercel project → **Settings → Domains**
2. Type `altamortgagegroup.net` → **Add**
3. Add `www.altamortgagegroup.net` too → **Add** (Vercel will redirect one to the other)
4. Vercel shows you DNS records to set. You'll see either:
   - **A record** → point `@` to `76.76.21.21`, OR
   - **Nameserver change** (Vercel may ask you to use its nameservers)
5. Go to wherever your domain's DNS is managed:
   - If your domain is registered through Hostinger: **hPanel → Domains → DNS / Nameservers**
   - Update the A record (or nameservers) to match what Vercel shows
6. Wait for DNS propagation (usually 10–60 minutes, sometimes up to a few hours)
7. Vercel auto-issues a free SSL certificate once DNS resolves — HTTPS just works

**Your site stays live on Hostinger the whole time.** Only when DNS finishes
propagating does traffic switch to Vercel. Zero downtime.

---

## Part 4 — Future deployments (automatic)

After Vercel is connected, every `git push origin main` triggers an automatic
deploy. No build buttons, no restart, no cache purge. Push → live in ~2 minutes.

Pull requests get their own preview URLs automatically.

---

## What about the Hostinger files in the repo?

`app.js`, `.htaccess`, and the cPanel docs are Hostinger-specific. Vercel simply
ignores them — they cause no harm. You can leave them in the repo as a fallback,
or delete them later once you're confident on Vercel.

---

## Verify after deploy

- [ ] `.vercel.app` URL loads fully styled
- [ ] `/api/version` returns JSON (note: `nextBuildId` present, `config.smtp` true)
- [ ] `/contact` form submits and email arrives
- [ ] `/mortgage-calculator` chart renders and sliders work
- [ ] All footer links resolve (including `/first-time-homebuyer`, `/learning-center`)
- [ ] After DNS switch: `https://altamortgagegroup.net` loads with valid SSL

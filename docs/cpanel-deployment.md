# Deploying Alta Mortgage Group to cPanel (Node.js 22)

Step-by-step deploy guide for cPanel shared hosting with **Setup Node.js App** (Phusion Passenger).

---

## 0. Prerequisites

- cPanel access for `altamortgagegroup.net`
- Node.js 22.x available in **Setup Node.js App**
- GitHub repo: `https://github.com/cboerstra/AltaMortgageWebsite2`
- Working SMTP credentials (for `/api/leads` and `/api/applications` email notifications)
- Optional: CRM webhook URL for `altamortgagecrm.net`

---

## 1. Fix the 64KB / ModSecurity 403 (do this FIRST)

The 403 you're seeing is a ModSecurity WAF rule blocking large Next.js responses. Fix one of two ways:

### Option A — `.htaccess` override (already in repo)
The repo includes a `.htaccess` at the project root that disables ModSecurity. If your host allows overrides, deploying the project automatically fixes the 403.

### Option B — Ask host support (most reliable)
If `.htaccess` doesn't work, open a ticket:

> Please disable ModSecurity for `altamortgagegroup.net`, or whitelist response sizes over 64KB. I'm running a Node.js (Next.js) app and legitimate framework responses are exceeding the default WAF rule limit, returning 403.

Most hosts do this for free in under an hour.

---

## 2. Create the Node.js App in cPanel

1. Log into cPanel.
2. Find **Setup Node.js App** (under "Software").
3. Click **+ Create Application**.
4. Fill in:
   - **Node.js version:** `22.x`
   - **Application mode:** `Production`
   - **Application root:** `altamortgage` (creates `~/altamortgage` — your project lives here)
   - **Application URL:** `altamortgagegroup.net` (or a subdomain for staging)
   - **Application startup file:** `app.js`
   - **Passenger log file:** leave default
5. Click **Create**.

cPanel auto-generates a `.htaccess` in your `public_html` (or whatever the URL maps to) that proxies requests to Passenger. **Don't delete it.**

---

## 3. Upload code (two options)

### Option A — Git clone (recommended)
1. In cPanel, open **Terminal** (under "Advanced") OR SSH in.
2. Run:
   ```bash
   cd ~/altamortgage
   git init
   git remote add origin https://github.com/cboerstra/AltaMortgageWebsite2.git
   git fetch origin
   git reset --hard origin/main
   ```
3. For future updates: `git pull` from the same directory.

### Option B — Git Version Control in cPanel
1. cPanel → **Git Version Control** → **Create**
2. Clone URL: `https://github.com/cboerstra/AltaMortgageWebsite2.git`
3. Repository path: `/home/USER/altamortgage`
4. Branch: `main`

### Option C — File Manager upload
1. Locally: `npm run build` then zip the project (exclude `node_modules` and `.next`).
2. Upload zip to `~/altamortgage` via File Manager and extract.

---

## 4. Set environment variables in cPanel

1. Back in **Setup Node.js App**, click your app.
2. Scroll to **Environment variables**.
3. Add each variable from `.env.example`. At minimum:
   - `NEXT_PUBLIC_SITE_URL=https://altamortgagegroup.net`
   - `SMTP_HOST=mail.altamortgagegroup.net`
   - `SMTP_PORT=587`
   - `SMTP_USER=info@altamortgagegroup.net`
   - `SMTP_PASS=<your-mailbox-password>`
   - `NOTIFICATION_EMAIL=leads@altamortgagegroup.net`
   - `CRM_API_URL=` (leave blank for now if not ready)
   - `CRM_API_KEY=` (leave blank for now if not ready)
4. Click **Save**.

---

## 5. Install dependencies and build

In cPanel **Setup Node.js App** there is usually a **"Run NPM Install"** button. Click it.

If that doesn't run a build, open **Terminal** and run:

```bash
cd ~/altamortgage
source /home/USER/nodevenv/altamortgage/22/bin/activate   # cPanel activates Node here
npm ci
npm run build
```

Replace `USER` with your cPanel username. The exact `source` command appears in the cPanel app detail page — copy it from there.

Build output goes into `.next/`. Don't delete it.

---

## 6. Start (or restart) the app

In cPanel **Setup Node.js App**, click **Restart Application**. Wait 5–10 seconds.

Visit `https://altamortgagegroup.net` — you should see the homepage.

---

## 7. Smoke tests

Click through these to confirm everything works:

- [ ] `/` — homepage renders, all 11 sections visible
- [ ] `/mortgage-calculator` — sliders update the chart in real time
- [ ] `/loan-options` — all 7 loan cards visible, FAQ expands
- [ ] `/apply` — wizard advances through all 6 steps, localStorage persists across refresh
- [ ] `/contact` — pre-approval form submits successfully (check email arrives)
- [ ] `/utah/weber-county` — content + city grid + FAQ
- [ ] `/sitemap.xml` — XML loads
- [ ] `/robots.txt` — text loads

If any return 403, ModSecurity is still blocking — go back to step 1.

---

## 8. Future deployments

After making code changes locally:

```bash
git add -A
git commit -m "your message"
git push origin main
```

Then on the server:

```bash
cd ~/altamortgage
git pull
source /home/USER/nodevenv/altamortgage/22/bin/activate
npm ci
npm run build
```

Then in cPanel: **Restart Application**.

---

## Troubleshooting

**"Cannot find module 'next'"** → run `npm ci` in the app directory.

**Site loads but `/api/leads` returns 500** → check **Errors** log in cPanel and verify all SMTP env vars are set.

**Pages render but no styles** → build hasn't run. Run `npm run build` and restart.

**Forms succeed but no email arrives** → SMTP creds wrong or port 587 blocked. Check with host.

**Application won't start (Passenger error)** → check Passenger log path shown in **Setup Node.js App**.

**403 persists after ModSecurity disable** → host may enforce ModSecurity at the load balancer level, above `.htaccess`. Must contact support.

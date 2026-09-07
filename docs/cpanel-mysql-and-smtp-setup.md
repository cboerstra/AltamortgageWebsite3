# cPanel MySQL Database + SMTP Setup

After this guide, every lead and application that comes in is:
1. Saved to your MySQL database (permanent record, can't be lost)
2. Forwarded to your CRM webhook (if configured)
3. Emailed to you via SMTP

The database save happens **first**, so even if CRM or email fail, you still have every lead.

---

## Part 1 — Create the MySQL Database

### 1.1 Create the database

1. Log into Hostinger cPanel
2. Find **MySQL Databases** (under "Databases")
3. Under **Create New Database**, enter a name like `altamortgage` and click **Create Database**
4. Hostinger will prefix your username — final name will look like `u833783884_altamortgage`. **Write this down.**

### 1.2 Create a database user

1. On the same page, scroll to **MySQL Users → Add New User**
2. Username: `altamortgage_user` (or anything memorable)
3. Password: click **Password Generator**, copy the password somewhere safe — you'll need it for the env vars
4. Click **Create User**

### 1.3 Grant the user access to the database

1. Scroll to **Add User to Database**
2. User: pick the user you just created
3. Database: pick the database you just created
4. Click **Add**
5. On the privileges page, check **ALL PRIVILEGES**, then click **Make Changes**

### 1.4 Create the tables

1. Back in cPanel, open **phpMyAdmin** (under "Databases")
2. On the left side, click your database name (e.g., `u833783884_altamortgage`)
3. Click the **SQL** tab at the top
4. Open `db/schema.sql` from this repo on your computer
5. Copy the **entire contents** of that file
6. Paste into the phpMyAdmin SQL textarea
7. Click **Go** at the bottom

You should see "Your SQL query has been executed successfully" twice (once per table).

### 1.5 Verify

Still in phpMyAdmin, click your database name on the left — you should now see two tables: `leads` and `applications`. Click each one and you should see all the columns from `db/schema.sql`.

---

## Part 2 — Create the Notification Mailbox (SMTP)

### 2.1 Create the mailbox

1. cPanel → **Email Accounts**
2. Click **Create**
3. Username: `leads` (so the mailbox is `leads@altamortgagegroup.net`)
4. Password: click **Generate**, copy somewhere safe
5. Click **Create**

### 2.2 Find the SMTP settings

1. On the email accounts list, click **Connect Devices** next to the new mailbox
2. Note the **Outgoing Server** (usually `mail.altamortgagegroup.net`) and **SMTP Port** (usually 587 with STARTTLS)

You now have everything you need for the SMTP env vars.

---

## Part 3 — Add Environment Variables to Node.js App

1. cPanel → **Setup Node.js App** → click the pencil icon next to your app
2. Scroll to **Environment variables**, then click **+ Add Variable** for each of these:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://altamortgagegroup.net` |
| `NODE_ENV` | `production` |
| `DB_HOST` | `localhost` |
| `DB_PORT` | `3306` |
| `DB_USER` | `u833783884_altamortgage` (your full DB user from step 1.2) |
| `DB_PASSWORD` | (the password from step 1.2) |
| `DB_NAME` | `u833783884_altamortgage` (your full DB name from step 1.1) |
| `SMTP_HOST` | `mail.altamortgagegroup.net` (from step 2.2) |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `leads@altamortgagegroup.net` |
| `SMTP_PASS` | (the mailbox password from step 2.1) |
| `NOTIFICATION_EMAIL` | `leads@altamortgagegroup.net` (or any inbox you want leads delivered to) |

For CRM forwarding (optional — leave blank to skip):

| Variable | Value |
|---|---|
| `CRM_API_URL` | `https://altamortgagecrm.net/api/webhook` |
| `CRM_API_KEY` | your CRM's API key |

3. Click **Save**
4. Click **Restart** in Setup Node.js App

---

## Part 4 — Test End to End

1. Visit `https://altamortgagegroup.net/contact`
2. Fill out the pre-approval form with **your own real email** so you can verify the notification arrives
3. Submit
4. Within a few seconds you should see:
   - **A new email in `leads@altamortgagegroup.net`** with all the form fields
   - **A new row in `leads` table** (open phpMyAdmin to see it)
5. The row in `leads` should show `email_status = 'sent'`. If it says `failed` or `pending`, check the `email_error` column for the reason.

---

## Part 5 — Querying Your Data

### Recent leads (last 10):
```sql
SELECT created_at, name, email, phone, loan_purpose, crm_status, email_status
FROM leads
ORDER BY created_at DESC
LIMIT 10;
```

### Recent applications:
```sql
SELECT created_at, ref_number, first_name, last_name, email, loan_amount, crm_status, email_status
FROM applications
ORDER BY created_at DESC
LIMIT 10;
```

### Leads where email FAILED (so you can manually follow up):
```sql
SELECT created_at, name, email, phone, loan_purpose, email_error
FROM leads
WHERE email_status = 'failed'
ORDER BY created_at DESC;
```

### Leads where CRM forwarding failed (so you can manually push):
```sql
SELECT created_at, name, email, phone, raw_payload, crm_response
FROM leads
WHERE crm_status = 'failed'
ORDER BY created_at DESC;
```

You can run these in phpMyAdmin → your database → **SQL** tab.

---

## Troubleshooting

**`ECONNREFUSED 127.0.0.1:3306`** → DB_HOST should be `localhost` (not 127.0.0.1) on most cPanel hosts.

**`Access denied for user`** → The user-to-database grant in step 1.3 was missed. Go back and add **ALL PRIVILEGES**.

**Form submits but no row in `leads`** → Check Hostinger's Node.js app log (Setup Node.js App → log file path). Look for "insertLead error" lines.

**Row appears but `email_status = 'failed'`** → Check the `email_error` column for the exact SMTP error. Most common: wrong password (regenerate the mailbox password) or wrong port (try 465 with `SMTP_PORT=465`).

**Row appears but `crm_status = 'pending'` forever** → Make sure you saved env vars and **restarted** the Node.js app. Pending means the API never tried to forward.

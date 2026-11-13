🚀 Supabase + Express.js Backend Starter

A modular Node.js/Express starter backed by Supabase Postgres. Built for freelancers and indie devs who keep shipping similar MVPs and don't want to rebuild auth and RLS every time.

⚡ What's included
🔐 Auth: signup, login, logout, forgot/update password, /me, with JWT verification middleware
🛡️ RLS that is actually enforced: every request runs through a per-request Supabase client (anon key + user's JWT), so Postgres policies apply
🤖 Triggers: auto-creates a profile row on signup, plus updated_at automation
📦 Modular structure: config/, controllers/, middleware/, routes/
⚙️ Global error handling and rate limiting on public auth routes
✅ test-rls.js: a two-user test that proves User B can't read or edit User A's data
🚫 Not included

Payments, email templates, file uploads, admin dashboard, frontend.

🚀 Quick setup
1. Get the code

Clone this repo (or click Use this template if enabled).

2. Install dependencies
bash
npm install
3. Create the database

In the Supabase SQL Editor, run schema.sql.

4. Configure environment

Copy .env.example to .env and fill in your values (Supabase Dashboard → Project Settings → API):

Variable	Description
SUPABASE_URL	Your project URL
SUPABASE_ANON_KEY	Client-safe key. Respects RLS.
SUPABASE_SERVICE_ROLE_KEY	Server only. Bypasses RLS.
PASSWORD_RESET_REDIRECT_URL	Frontend page for the reset link (whitelist it in Supabase → Auth → URL Configuration)

✅ Verify RLS
bash
node test-rls.js

You should see 4 PASS lines:

Trigger created profiles: PASS (2/2)
A sees only own row: PASS (1 rows)
A cannot read B: PASS
A cannot update B: PASS

It creates two temporary users through the admin API (no emails sent) and deletes them afterwards.

🔒 Security notes
Enable RLS on every new table, in the same migration that creates it: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
Keep the service role key on the server only. Never put it in Vite, Next.js, React or mobile code. Use it only to verify tokens and for admin tasks, never to query user data.
Use req.supabase for all user data queries so RLS applies. Identity always comes from req.user.id, never from the request body.
🔄 Updating after you customize

You own the code once you have it. Each release ships with a CHANGELOG listing the files changed, so you can diff and cherry-pick patches into your customized project.

🧪 Dev tip

Supabase's built-in email is heavily rate-limited. While developing, turn off Confirm email (Authentication → Providers → Email). For production, set up a custom SMTP provider.


This is a stripped-down demo of the key setup and RLS test. The auth routes and server wiring are in the full kit.
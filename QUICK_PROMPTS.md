# Beach Track Club — Quick Prompts

Copy-paste prompts for a new Claude Code chat. For full context see **HANDOFF.md**.

## Start any new chat with
> Read HANDOFF.md, then let's keep going on the Beach Track Club app.

---

## ▶ What to do next (in priority order)
Paste the prompt for whichever you want to work on.

**1. Finish email / SMTP** (so password-reset + auth emails actually deliver — needed before App Store). Redirect URLs are already set; this needs a Resend account + API key from you first.
> I've created a Resend account and have an API key ready. Let's finish the custom SMTP setup in Supabase, then send a test password-reset email to confirm it works.

**2. Scheduling tab** (the big unbuilt feature — coach posts sessions, athletes RSVP).
> Let's build the Scheduling tab: a `sessions` table + RLS (coach/admin writes, approved users read), a schedule view, an admin-gated "create session" form, and athlete RSVP. Plan it first, then build.

**3. App Store prep** (required before submitting).
> Let's start App Store prep: add in-app account deletion (Apple requirement), then scope wrapping the app with Capacitor for iOS (where biometric unlock and Sign in with Apple live).

**4. Content from Curtis** (names + cues).
> Here are the real names for the opaque clips: [Seated Bnp = …, Ss Hamstring Curl = …, Blf Mb = …, Chstp Mbgm = …, Ohf Maddy Mark = …, Tank = …, Maddy = …, Mike Jacky = …]. Rename them in the database.

**5. Security housekeeping** (do before launch).
> Let's do the security housekeeping: rotate the Supabase service_role key and admin password, delete the demo@ and athlete1@ test accounts, and clear the leftover unverified 2FA factor.

**Later / bigger:**
> Let's scope the college-recruiting tool — Curtis wants his existing app's features rebuilt natively into this one. I'll show you the existing app so you can inventory it and estimate.

> Let's add payments/subscriptions (Stripe) with plan-gated access.

---

## Common quick asks
**Check what's live**
> What version is currently deployed? (it's shown in the app header as v0.0.1·<sha>)

**Ship + verify a change**
> Build, commit, push, and confirm the new version is live on Cloudflare.

**Change app content/data** (most of this you can also do yourself in the app's Edit modes)
> Add a new feature flag to hide/show [section] from athletes, like the video library flag.

> Bump the app version to v0.2.0 so the header shows a clean milestone number.

**Look something up**
> Query the Supabase videos/exercises table and show me [X] (use the anon key via REST, don't scroll the app).

---

## Things you can already do yourself in the app (no Claude needed)
Sign in as **team@beachtrackclub.com** (admin), then:
- **Video Library → Edit:** rename, recategorize, reorder (drag the ⠿ grip), set a duration label, trim (in/out points), hide/delete, upload new MP4s. Toggle **Show/Hide to athletes** at the top.
- **Home → Edit:** rename / reorder / hide categories & circuits.
- **A circuit → Edit:** rename / reorder / hide exercises, and swap an exercise's GIF (tap the thumbnail).
- **An exercise page:** Add/Edit coaching cues; attach coaching videos.
- **Your profile (tap the Coach chip):** turn on two-factor authentication.

All of these save to the database instantly — no deploy, and athletes see changes right away.

---

## Reminders / gotchas
- The **email/SMTP reminder** fires ~9am the day after setup — it'll nudge you automatically.
- A new chat won't remember past chats, but **HANDOFF.md carries the state**.
- The new chat may ask you to re-confirm access to your logged-in **Chrome/Supabase** the first time it runs SQL or checks the dashboard.

# Branded auth email templates (Beach Track Club)

Deliverability-friendly HTML for Supabase Auth emails. Branded, replyable, and
clear about why the recipient got them — plain/link-only templates score worse
with spam filters.

## How to apply
Supabase dashboard → **Authentication → Emails**. For each message type below,
set the **Subject** and paste the matching `.html` file's contents into the
message body, then **Save**.

| Supabase template | File | Suggested subject |
|---|---|---|
| Reset Password | `reset_password.html` | `Reset your Beach Track Club password` |
| Confirm signup | `confirm_signup.html` | `Confirm your Beach Track Club account` |

Both use Supabase's `{{ .ConfirmationURL }}` variable (leave it exactly as-is —
Supabase fills it in per email).

## Sender
Set in **Authentication → SMTP Settings**:
- Sender email: `team@beachtrackclub.com` (real, replyable mailbox → better deliverability)
- Sender name: `Beach Track Club`

## Logo
The header logo is a hosted PNG (email clients strip inline SVG). Regenerate +
re-upload it with `node scripts/gen_logo.mjs` (rasterizes `public/favicon.svg`).
It writes `public/btc-logo.png` and uploads to
`exercise-media/brand/btc-logo.png` (the URL the templates reference).

## Sender avatar (the circle icon in Gmail)
This is NOT controlled by the email HTML. Gmail shows the avatar from the
sender's Google account. Since we send as `team@beachtrackclub.com`:
- **Set a profile photo on the `team@beachtrackclub.com` Google Workspace
  account** using `public/btc-logo.png` (Google Account → Personal info →
  Profile photo). Gmail will then show the logo next to the sender name.
- The paid alternative (BIMI + a Verified Mark Certificate, ~$1k+/yr) is not
  worth it at this stage.

## Deliverability notes
- SPF / DKIM / DMARC are configured (Resend via `send.beachtrackclub.com` +
  `resend._domainkey`; DMARC `p=none` on `_dmarc`). Authentication passes.
- A brand-new sending domain starts cold — Gmail may spam early sends until
  reputation builds. Recipients clicking **"Not spam"** and normal engagement
  warm it up over days.

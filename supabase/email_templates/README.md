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

## Deliverability notes
- SPF / DKIM / DMARC are configured (Resend via `send.beachtrackclub.com` +
  `resend._domainkey`; DMARC `p=none` on `_dmarc`). Authentication passes.
- A brand-new sending domain starts cold — Gmail may spam early sends until
  reputation builds. Recipients clicking **"Not spam"** and normal engagement
  warm it up over days.

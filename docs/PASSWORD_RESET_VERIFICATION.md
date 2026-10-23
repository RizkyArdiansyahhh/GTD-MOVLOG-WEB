# Password reset diagnosis — 18 October 2026

## Findings before edits

- HEAD: `f8d4c24`; no stash and no tracked diff using Git inside WSL.
- Mailpit was already healthy on ports 1025/8025. Routes, broker, frontend,
  notification override, SMTP-to-log failover and example mail profiles existed.
- The ignored local `.env` selected `failover` with `smtp.gmail.com:587`.
  Laravel had no cached configuration and used those same values.
- A real registered-user POST returned 302, then 200 with the generic success
  message. A token was stored, but Mailpit remained empty. Laravel logged
  `Network is unreachable` for Gmail SMTP and wrote the email to the log.
- Request logs lacked IP addresses. Reset URLs used the request host rather
  than `APP_URL`; a request from `unexpected.local` reproduced this mismatch.
- These findings do not establish that `git restore` removed working code.
  The existing password-reset feature tests survived as an untracked file.

## Minimal changes

- Local `.env`: SMTP to `mailpit:1025`, without SMTP authentication/encryption.
  `.env` stays ignored and is not included in the commit. Keep
  `APP_URL=http://localhost:8080` for this local Docker setup.
- Add request IP to existing status and exception logs.
- Build reset links from `config('app.url')` plus the named route's relative path.
- Track the existing reset tests, add URL/log/transport-failure regression checks,
  and assert successful authentication after resetting a password.

The existing `.env.example` documents Mailpit and production SMTP profiles.
Its optional `failover` mailer can report broker success when SMTP delivery
fails and the message is written only to the log. Use `MAIL_MAILER=smtp` when
verifying delivery to Mailpit.

## Verification

- Before changes: 16 password-reset tests passed, 64 assertions.
- After changes: 19 tests passed, 76 assertions.
- Cleared config, route and application caches; ran `docker compose up -d`
  and restarted `app`.
- Real HTTP with CSRF enabled: email visible in Mailpit within 0.463 seconds;
  matching token present in `password_reset_tokens`.
- Opened the emailed reset URL, submitted a new password, logged in successfully
  to `Dashboard/Index`, and confirmed the token was consumed.
- Unregistered email: identical generic success text, no new email and no token.
- Six rapid HTTP POSTs completed in 1.17 seconds with statuses
  `302, 302, 302, 302, 302, 429`; Mailpit message count remained unchanged.
- Browser checks confirmed the forgot-password form, generic feedback and
  the delivered Mailpit email. Reset submission/login used real HTTP requests
  with a temporary account; existing users' passwords were not changed.
- Logged out and removed the temporary test account after verification.

Run regression tests inside the app container:

```sh
docker compose exec -T app php artisan test --filter=PasswordResetTest
```

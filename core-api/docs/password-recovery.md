# Forgot password → verify → new password

The Auth API now implements the three steps. Live delivery is disabled until credentials are configured. SMS has a Twilio adapter; Telegram uses a dedicated recovery bot and a previously linked private chat. Email identity/validation is reserved, with local testing supported; a live email sender is not implemented.

Base URL: `http://localhost:3000/api/v1/auth` (gateway) or `http://localhost:3001/api/v1/auth` (direct Auth service).

## API examples

1. `POST /password/reset-request`

```json
{ "phone": "+85512345678", "channel": "sms" }
```

Use `"channel": "telegram"` for a linked account. Phone must include country code. The response never confirms whether an account exists and never contains the code:

```json
{
  "message": "If the account is eligible, a verification code will be sent.",
  "challengeId": "<uuid>",
  "expiresIn": 600
}
```

2. `POST /password/reset-verify`

```json
{ "challengeId": "<uuid-from-step-1>", "code": "123456" }
```

```json
{ "token": "<single-use-reset-token>", "expiresIn": 300 }
```

3. `POST /password/reset-confirm`

```json
{ "token": "<token-from-step-2>", "newPassword": "NewStrongPassword123!" }
```

```json
{ "message": "Password updated. Sign in with your new password." }
```

Then use the normal phone/password login. The reset token cannot authenticate API calls. All existing sessions and pending authentication challenges are revoked after reset. Established MFA stays enabled. New passwords must contain 8–128 characters and differ from the current password; repeat-password confirmation belongs in the client UI.

Codes expire after 10 minutes, permit five attempts, and are single-use. Verified reset grants expire after five minutes and are single-use, including concurrent submissions. A changed password/contact or inactive account invalidates outstanding grants.

Resend protection: one issued request per account per minute, maximum 10 per hour; API also throttles requests per IP. Suppressed requests return a decoy challenge ID and send nothing, so retain the initial challenge while the resend button is disabled. A later issued request invalidates older grants. Delivery failures invalidate that challenge and preserve the generic public response. Live request responses wait at least six seconds to cover provider-call timing; local mode waits at least 300ms. There is no automatic retry to avoid duplicate SMS charges. Provider acceptance is not proof of delivery to a handset.

## Local testing

Set in `.env`, then restart Auth:

```dotenv
NODE_ENV=development
PASSWORD_RESET_DELIVERY=local
```

For an existing active account, request a code and read `.local/password-reset-outbox/<challengeId>.json`. These files have mode 0600 and are ignored by version control. Codes are never included in HTTP responses or application/monitoring logs. Delete local outbox files after testing. Local mode is refused in production.

An account with an empty legacy password can recover through a valid registered phone using SMS. Unknown/inactive accounts or Telegram requests without a linked chat produce the same public response, with no usable challenge. Unconfigured channels return 503 consistently for all accounts.

## Live SMS

The included provider adapter is **Twilio**. If the existing provider is different, implement its adapter before selecting live SMS; Twilio credentials cannot configure another provider.

```dotenv
PASSWORD_RESET_DELIVERY=live
PASSWORD_RESET_SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=<account-sid>
TWILIO_AUTH_TOKEN=<secret>
TWILIO_FROM_NUMBER=<sms-enabled-sender>
# Alternatively use a Messaging Service instead of FROM_NUMBER:
TWILIO_MESSAGING_SERVICE_SID=
```

Credentials belong in deployment secrets or the ignored `.env`. Sender permissions and destination coverage must be configured with the provider. Provider requests use fixed HTTPS URLs, reject redirects, and time out after five seconds.

## Link Telegram before it is needed

Use a **dedicated recovery bot**, separate from the monitoring bot that polls updates and sends to a shared administrator chat. Never send reset codes to the monitoring group.

```dotenv
PASSWORD_RESET_TELEGRAM_BOT_TOKEN=<dedicated-bot-token>
PASSWORD_RESET_TELEGRAM_BOT_USERNAME=<username-without-@>
PASSWORD_RESET_TELEGRAM_WEBHOOK_SECRET=<random-32-to-256-characters-A-Z-a-z-0-9-underscore-hyphen>
```

Register its public HTTPS webhook with Telegram's `setWebhook`, using URL `https://<api-host>/api/v1/auth/password/telegram/webhook`, the same `secret_token`, and `allowed_updates: ["message"]`. This repository does not register a public webhook automatically. Ensure deployed ingress/IP policies allow legitimate webhook requests. Keep provider tokens out of shell history and logs.

While signed in, call `POST /password/telegram/link` with bearer authorization and `{ "password": "<current-password>" }`. Open its returned `https://t.me/<bot>?start=<one-time-token>` URL and press Start. This expires after 10 minutes. Only an authenticated Telegram webhook from the same user's private chat can consume the link. Group chats are ignored, a chat can link only one INVA account, and linking tokens cannot be replayed. Password changes invalidate pending link tokens.

`GET /me` returns `telegramRecoveryLinked` so the client can confirm linking without exposing the private chat ID.

To remove the link, call `DELETE /password/telegram/link` with bearer authorization and the current password. This also invalidates pending Telegram recovery challenges. A phone number alone does not identify a Telegram bot chat; linking is mandatory. Users who are already locked out must use SMS or the administrator recovery process first.

## Validation and scope

Migration `20261017110000_password_recovery` was applied locally after a backup at `.local/backups/password-recovery-20261017/auth-before.dump`. Test database: `inva_auth_recovery_test`, with separate synthetic users only.

```sh
# Set PASSWORD_RESET_TEST_DATABASE_URL to the migrated isolated database URL ending in _test.
npm run test:password-reset
npm run typecheck
npm run lint
npm run build:auth
```

Tests cover HTTP validation and the full three-step API, hashed codes/tokens, expiry, persistent failed attempts, cooldown, concurrent verification/reset, replay, invalidated contacts/passwords, session revocation, retained MFA, Telegram binding/webhook authentication, production-local rejection, and mocked SMS/Telegram requests. No live SMS or Telegram messages were sent during tests.

The frontend forgot-password modal still needs the code-entry and new-password steps. This change implements the API; it does not configure live provider accounts, deploy a public Telegram webhook, add an email sender, or issue automatic post-reset account notifications.

References: [OWASP password recovery](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html), [Telegram Bot API](https://core.telegram.org/bots/api#sendmessage), [Telegram account linking](https://core.telegram.org/bots/features#deep-linking), [Twilio message creation](https://www.twilio.com/docs/messaging/api/message-resource#create-a-message-resource).

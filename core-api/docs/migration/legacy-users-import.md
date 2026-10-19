# Legacy MySQL users → Auth

Implemented and locally imported on 2026-10-17. Source: MySQL `invaesta_new_db.users` on port 8889. Target: PostgreSQL `inva_auth_db.users`. Source data is read only.

| Legacy field | Auth API / storage |
|---|---|
| `id` | Unique `legacyUserId`; new Auth UUID generated separately |
| `first_name`, `last_name` | `firstName`, `lastName`; response `name` joins these |
| `gender` | `0 → MALE`, `1 → FEMALE`, `2 → OTHER`; null retained |
| `prefix`, `phone` | Unique normalized `phone` with country code; original values in migration metadata |
| `password` | `passwordHash`; existing bcrypt preserved and upgraded to Argon2id after successful login |
| Empty password | Unverifiable marker; administrator password reset required |
| `photo` | `image`; original URL or relative path preserved |
| `language` | `language`; `kh → km`, `en/km/zh` retained; original code in metadata |
| `active` | `isActive` |
| `user_type_id` | `1 → INTERNAL`, `2 → EXTERNAL`; no role or company grants |
| `created_at`, `updated_at` | UTC timestamps; original null/value retained in migration metadata |
| Remaining reference/visibility/access flags | `legacyMetadata`; historical evidence only, no effective permissions |

Gender/type meanings were verified against `/Users/senghoun/Desktop/inva-system/app/Http/Controllers/UserController.php`. No email column exists in the source. Email is now nullable; imported users authenticate through the existing phone login API. Administrative create accepts either email or phone (or both); public registration still requires email. Updating a phone-only account cannot remove its sole identity.

Do not import `password_confirmation`, `remember_token`, `fcm_token`, old sessions, roles or credentials for other services. Existing Auth users are never merged by email/phone. Existing legacy IDs are skipped on reruns, preserving later account edits. Source changes after the initial import require a separate reviewed reconciliation; reruns do not synchronize them.

## Local result

- 19,150 source users examined.
- 17,774 imported: 105 INTERNAL, 17,669 EXTERNAL; 16,535 active, 1,239 inactive.
- 11,480 imported users have no password and require a reset before login.
- 1,376 quarantined: 1,297 records sharing normalized source phone numbers; 79 invalid/missing phones.
- Existing administrator retained; target total 17,775. Imported role links: zero.
- Dry-run rerun: zero new candidates, 17,774 already imported, same 1,376 quarantined.

Quarantine identifies **all** accounts sharing a normalized phone rather than choosing an identity. Resolve ownership and source data explicitly before rerunning. No passwords or phone values appear in the report.

Local artifacts (ignored by version control):

- `.local/legacy-users-report.json`: latest report with quarantine source IDs/reasons.
- `.local/backups/legacy-users-20261017/auth-before.dump`: pre-migration Auth backup.
- `.local/backups/legacy-users-20261017/{dry-run-report,apply-report}.json`: initial evidence.

## Running again

Configure `.local/legacy-mysql.env` with `LEGACY_MYSQL_HOST`, `LEGACY_MYSQL_PORT`, `LEGACY_MYSQL_DATABASE=invaesta_new_db`, `LEGACY_MYSQL_USER`, `LEGACY_MYSQL_PASSWORD`. Protect it with mode 0600. Optional `LEGACY_MYSQL_BINARY` overrides `/opt/homebrew/bin/mysql`. Target uses `DATABASE_AUTH_URL` from `.env`.

```sh
npm run prisma:generate:auth
npm run prisma:deploy:auth
npm run migrate:legacy-users           # Preview only
npm run migrate:legacy-users -- --apply
npm run test:legacy-users
npm run typecheck
npm run build:auth
```

Import uses one target transaction, inserts in batches, and rolls back on collisions or errors. It sends no notifications. Restore the pre-migration dump only as an explicit rollback operation with services stopped and newer writes accounted for.

## Remaining work

Quarantined identities need review. Image paths still depend on the old asset host/files; this import does not copy image bytes. Legacy access flags and INTERNAL classification do not grant roles or company memberships. Map those separately. The existing frontend login form remains email-based; phone-only login is available through the auth API (`POST /api/v1/auth/login` with `phone` and `password`). Password reset is the existing administrator temporary-password flow; no new SMS recovery channel was added.

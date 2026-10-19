# Telegram error and security monitoring

Manage API alert delivery in **Super App → Authentication → Security Policy → Telegram Alerts**.
An active internal account with the ADMIN role is required. The web panel supports changing
the bot, discovering or entering a destination chat ID, enabling/disabling alerts, adjusting
limits, configuring Telegram administrators and sending a test message. Saved changes reach running services within 15 seconds.

## Initial server setup

The auth service stores the shared settings in its database and encrypts bot tokens using
AES-256-GCM. Before first use:

1. Apply the additive auth database migration:

   ```sh
   npx prisma migrate deploy --schema=prisma/auth/schema.prisma
   npm run prisma:generate:auth
   ```

2. Set `TELEGRAM_ENCRYPTION_KEY` in the auth service's secret environment to a random,
   hex-encoded 32-byte key. Keep the same key across restarts and back it up separately
   from PostgreSQL. Changing it prevents decryption of existing saved bot tokens.
3. Deploy/build the new API and Super App code and restart the services once. Subsequent
   web settings changes do not require a restart. The gateway and domain services need
   `AUTH_SERVICE_URL` pointing directly to the auth service and the existing `JWT_SECRET`.
   Use a private network or HTTPS for inter-service traffic.

For this local workspace, the migration has been applied, an encryption key has been added
to the private `.env`, and the supplied bot has been imported as encrypted settings. The
plaintext bootstrap token has been removed from `.env`. Use the web panel to review the
current destination and enabled setting.

Optional `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_CHAT_ID` and the existing
`TELEGRAM_ALERT_*` / `TELEGRAM_SECURITY_*` environment settings are used **only to seed the
first database record**. After that, the database is authoritative; editing the environment
will not overwrite web settings. Keep bootstrap tokens in auth-service deployment secrets,
never frontend `VITE_*` variables or source control. Remove the bootstrap token after import.

## Use the web panel

1. Enter the bot token and click **Save bot token**. The server verifies the token,
   encrypts it and stores the username in the database. Replacing a bot clears the old
   destination and disables automatic alerts until you complete setup.
2. Click **Open @yourbot in Telegram**, then press **Start** in Telegram. The link uses
   Telegram's [bot deep linking](https://core.telegram.org/bots/features#deep-linking).
   Return to the web panel after starting the bot. For a group, add the bot to the group
   and send a message instead.
3. Click **Get chat ID**. A single result fills the destination automatically; if multiple
   chats are found, select the intended destination. You can also enter a numeric ID manually.
4. Enable alerts if desired, then click **Save chat ID**. The destination and current alert
   settings are stored in the database. Subsequent bot changes repeat this same sequence.
5. Click **Send test message** after saving to verify delivery. Testing uses the saved bot
   and chat ID and also works while automatic alerts are disabled. A successful test does
   not enable automatic delivery: check **Enable Telegram alerts for all API services**
   and save your settings. Allow up to 15 seconds for services to receive the change.

## Groups with topics (for example, INVA Developer)

The additive `20261007110000_telegram_topics` migration stores a default topic and up to
50 service/event routing rules. It has been applied locally. On other deployments, apply
migrations, regenerate the auth Prisma client and deploy/restart auth-service.

1. In Telegram, enable **Topics** for the **INVA Developer** group and create the topics
   you want, such as **API Errors**, **Security Alerts**, and **HR**.
2. In the web panel, click **Add @yourbot to a group** and select that group. This uses
   Telegram's [group deep link](https://core.telegram.org/bots/features#deep-linking).
   Ensure the bot is permitted to send messages in the target topics.
3. While bot management is disabled, send `/start@yourbot` in each desired topic.
   Addressing the command to the bot helps it receive the update with privacy mode enabled.
   Click **Get chat ID** in Super App and select the group. Discovery shows topics found
   in recent pending messages, rather than a complete group topic directory. A topic's
   name is shown when a creation/rename service update is available; otherwise the label
   is **Topic #ID**. You can also enter the topic ID manually.
4. Select a **default topic** for unmatched alerts or leave it blank for the default
   chat destination (General in a forum group). Add rules by service, event, or both.
   Topic IDs are Telegram `message_thread_id` values, not the numbers in names such as
   “Topic 1” and “Topic 2”. Changing the group clears its old default topic and rules.
5. Save settings. Choose a **Test routing service** and **Test routing event**, then click
   **Send test message** to verify a saved rule. Leave both selectors at **Default
   destination** to test the fallback. If only one selector is chosen, the test uses
   `auth-service` or `http_error` for the other selector.
6. Configure Telegram admin user IDs and enable bot management after discovery. Buttons
   work in the default topic and all routed topics; replies stay in the originating topic.
   Requests from other topics are denied. Unblock confirmations are bound to that topic,
   and changing topic settings invalidates pending confirmations.

Example routing (illustrative Telegram IDs):

| Service | Event | Topic ID | Purpose |
| --- | --- | --- | --- |
| All services | Rate limit (`rate_limit`) | 22 | Flood/rate-limit alerts |
| All services | IP policy block (`ip_block`) | 22 | Security policy blocks |
| auth-service | All events | 11 | Auth service alerts |
| hr-service | All events | 33 | HR service alerts |
| auth-service | Rate limit (`rate_limit`) | 44 | A specific override |

Priority is **service + event → event → service → default topic** regardless of row order.
Each service/event pair must be unique. Use the default topic rather than an all-services,
all-events rule. Rules route alerts within the saved group; a matching alert is sent to
one topic. Tests use the same resolver as real alerts and do not generate fake incidents.
Actual delivery uses [Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage)
with `message_thread_id`. Deleted/closed/inaccessible topics can cause delivery failures;
the sender does not silently reroute those alerts to another topic. Clear the topic ID
and rules to return to the original private-chat or default-group delivery.

Discovery reads recent pending Telegram updates with `getUpdates`, without an offset or
long polling, and returns only chat IDs, types, labels, recent topic metadata and numeric message sender IDs. It does not acknowledge updates,
change webhooks, select a destination automatically, or export message contents. Telegram
retains updates for at most 24 hours, so send a fresh message if no chats appear. A bot with
an active webhook or a competing update reader may require manual chat ID entry. The bot
must be permitted to send to the destination. See the official
[Telegram Bot API](https://core.telegram.org/bots/api#getupdates).

## Manage security from Telegram

The additive `20261007100000_telegram_commands` migration adds administrator settings,
durable update offsets and temporary unblock confirmations. It has been applied to this
local workspace. Apply migrations and regenerate the auth client on other deployments,
then restart auth-service after deploying the code.

In **Super App → Authentication → Security Policy → Telegram Alerts**:

1. Send a fresh message to the bot and click **Get chat ID**. The panel shows recent
   sender user IDs for the selected chat. Identify your own numeric user ID and trusted
   operators' IDs; discovery never grants permissions automatically.
2. Enter those IDs in **Telegram admin user IDs**, separated by commas.
3. Check **Enable Telegram management buttons** and save. This setting is independent
   of automatic alert delivery. At least one operator, a bot and a destination are required.
4. Send `/menu`, `/blocked` or `/status` in the saved chat, or send a web test message
   to receive buttons. Newly delivered alerts also include **Blocked IPs** and **Menu**;
   IP policy block alerts additionally offer an IP-specific unblock review.

**Blocked IPs** paginates all stored blocklist rules, shows the current enforcement mode
and allows selecting a rule for removal. **Status** shows automatic-alert state, IP policy
mode and the rule count. **Unblock** requires a second, explicit confirmation. The exact
IP/CIDR rule is shown; CIDR removal affects the entire range. Confirmation expires after
five minutes, is bound to the requesting user, chat and bot, and can be consumed once.
Cancel returns to the menu and invalidates that user's pending confirmation. Changing
the bot, destination or bot administrator configuration invalidates pending confirmations.

Commands are accepted only from listed numeric user IDs in the configured chat. Group
membership alone grants no access. Management is disabled by default and remains disabled
until operators are chosen. Replacing the bot clears the operator list and disables management.
Successful removals update the same database security policy as the web panel and create
`TELEGRAM_IP_UNBLOCKED` audit records with the Telegram actor ID and removed rule. The
gateway applies changes on its next policy refresh. Other rules, allowlist restrictions,
account lockouts and throttling may still reject traffic; rate-limit alerts have no IP
unblock button because a 429 is not a blocklist ban.

The auth service reads one incoming update every five seconds using
[Telegram getUpdates](https://core.telegram.org/bots/api#getupdates) and handles
[inline keyboard callbacks](https://core.telegram.org/bots/api#inlinekeyboardbutton).
A PostgreSQL transaction advisory lock serializes readers across auth replicas. Update
offsets, policy mutations, confirmation consumption and auditing commit together;
response messages are sent after commit. Delivery is best effort, so check the audit log
if a response fails. This reader acknowledges updates and needs a dedicated bot without
an active webhook or another `getUpdates` consumer. It does not remove webhooks automatically.
Disable management before discovering a different chat. Updates are retained by Telegram
for a limited time and are not a durable command queue.

## Access and secret handling

Admin endpoints under `/api/v1/auth/security/telegram`:

| Method | Path suffix | Purpose |
| --- | --- | --- |
| GET | (none) | Read non-secret settings and token-configured status |
| PATCH | (none) | Update bot, chat ID, enabled state and limits |
| POST | `/chats` | Discover recent destination chat IDs |
| POST | `/test` | Send a fixed test message with saved credentials |

The token is write-only in the web API: neither plaintext nor ciphertext is returned.
The UI never persists bot tokens in browser storage. Settings changes and successful test
messages are audited without recording credentials or message contents. Rate limits apply
to bot changes, discovery and test sends. Admin responses have `Cache-Control: no-store`.

The gateway and domain services poll `/api/v1/auth/internal/telegram/config` for non-secret
monitoring settings and post sanitized events to `/api/v1/auth/internal/telegram/events`.
Both require short-lived HS256 service JWTs with a dedicated audience/scope. Event service
identity must match the token issuer. Normal user tokens cannot access these endpoints.
Only the auth service owns/decrypts the bot token and sends Telegram requests. Runtime
changes discard queued alerts for the old configuration; a delivery already in flight
cannot be withdrawn.

## Coverage

- HTTP 500–599 responses across all services, including upstream proxy and health failures.
- Nest error logger calls, including background workers, and caught bootstrap failures when
  monitoring and the auth relay are available.
- HTTP 429 rate-limit responses across all services, including direct auth-service
  ThrottlerGuard rejections as well as gateway/proxy responses.
- Gateway explicit IP/domain policy blocks, common `.env`, `.git`, WordPress,
  phpMyAdmin and path traversal probes, and repeated 400/401/403/404 responses from the
  same IP/status within a fixed window (10 in 60 seconds by default).

Security events indicate suspicion, not a confirmed attack. Expired sessions and legitimate
permission denials can trigger repeated-failure alerts. Detection does not inspect bodies
or SQL/XSS payloads and does not introduce automatic blocking. Existing auth lockout,
throttling and gateway security policies perform enforcement.

Domain services do not run IP-based attack detection because their socket peer is normally
the gateway. The gateway uses Fastify's resolved `request.ip`. Configure
`GATEWAY_TRUSTED_PROXIES` with only actual reverse proxy IPs/CIDRs; keep domain service ports
internal. Gateway security monitoring cannot observe traffic that bypasses it. Several
domain services currently allow broad CORS origins, so direct network exposure warrants
separate review.

## Message layout

Alerts use a shared formatter with emoji icons, Khmer/English labels, bold headings,
monospaced IP/target/request IDs, an italic review reminder and Phnom Penh time (UTC+07:00).
Delivery uses [Telegram HTML formatting](https://core.telegram.org/bots/api#html-style);
dynamic metadata is escaped and bounded before rendering. The web test button previews
the same visual style.

Example rate-limit alert (illustrative values):

```text
🚨 INVA API SHIELD - RATE LIMITED!

🛡 ស្ថានភាព (Status): សំណើត្រូវបានកំណត់អត្រា / Request rate limited (429 Too Many Requests)
⚠️ ប្រភេទ (Type): Too Many Requests / Possible Flood
🌐 IP Address: 192.0.2.1
🎯 Target: POST /api/v1/auth/login
🔎 Request ID: req-example
📝 ព័ត៌មាន (Details): The API rejected this request because the request limit was exceeded.
🧩 Service: auth-service
⚙️ Environment: non-production
⏰ Time: 07/10/2026, 08:38:44 (UTC+07:00)

សូមពិនិត្យកំណត់ហេតុ / Review service logs and security settings in Super App.
```

IP/domain policy alerts say **REQUEST BLOCKED**, while probe detection says
**SUSPICIOUS ACTIVITY**. A rate limit does not imply a persistent IP ban. Geo-location and
raw User-Agent headers are outside this formatter. Buttons appear when bot management
is configured and enabled; previously sent messages keep their original keyboard.

## Privacy and operational limits

Alert messages contain service, production/non-production environment, event category,
Phnom Penh time (UTC+07:00), HTTP status, registered route template, client IP and generated request ID when
available. Unmatched paths use a fixed label. Raw exception messages, JWT claims, bodies,
query strings, headers, cookies and token-bearing URL parameters are not exported. Nest
error logs preserve source context while withholding raw messages/stacks. Existing request
logs provide status and correlation IDs. IP addresses are sent to Telegram; use a private
operations destination.

Delivery is best effort and asynchronous. Each process has a 100-event queue and a
2,000-entry deduplication cache; rejection counters are capped at 10,000 entries. Identical
alerts are suppressed for the configured cooldown. Relay and Telegram requests have bounded
timeouts. Queued Telegram sends are spaced by one second. The configured per-minute budget
also applies in the auth dispatcher across originating services. Limits are per process;
replicated auth dispatchers do not share a distributed budget. Excess events are discarded.
Failed deliveries pause for 30 seconds or bounded Telegram `retry_after`; failed events
are not retried. Bootstrap waits up to six seconds for pending delivery before exiting.

Counters and queues reset on restart and are not a durable audit trail. If the auth service
is unavailable, other services cannot deliver alerts through it; use independent process
supervision and centralized logs. Module import/config validation failures before monitoring
construction, unhandled crashes, native console errors and caught failures without a Nest
error log remain outside this coverage. Upstream failures can generate both domain and
gateway alerts.

## Verification

Run compilation and lint checks:

```sh
# core-api
npm run typecheck
npm run lint
npm run build:all

# super-app
npm run build
```

Automated test suites and browser-test tooling were removed during project cleanup at the owner's request.
After selecting a real destination, use the web test button, then request `/.env` once in
staging to verify a `suspicious_probe` alert. Repeated identical probes within the cooldown
should not generate duplicate messages.


## Client details and rejection counts

Alerts label the count as **Rejected requests within N seconds**. This counts
responses with the same observed IP and HTTP status during the configured
monitoring period, potentially across several routes. It is not an operating
system version. The route pattern and request ID refer to the latest request;
a wildcard represents the registered proxy route, not an exact requested path.

HTTP alerts include **Browser (reported)** and **OS (reported)** using recognized
User-Agent/client-hint categories. Super App and its API Explorer send a Brave
hint when `navigator.brave.isBrave()` confirms Brave. Chromium-based browsers
without a distinctive hint are identified as **Chromium-based**, not assumed to
be Chrome. Brave's product version is unavailable; a Chromium engine major version
is labeled separately and is never presented as Brave's `1.x` product version.
macOS is reported without assuming its version or a MacBook model. All client
metadata is self-reported and is not used for authentication or enforcement.
Only recognized labels and numeric major versions are relayed; raw User-Agent
strings, arbitrary headers, bodies and query strings are not sent to Telegram.

`127.0.0.1` and `::1` are labeled as loopback/local connections. A domain service
may observe the gateway's connection IP; this is not necessarily the user's public
IP. Only the gateway uses its resolved request IP for security monitoring.
Changes appear on newly generated alerts; existing Telegram messages are unchanged.

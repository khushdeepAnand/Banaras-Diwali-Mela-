# Banaras Diwali Mela

## Phase 7 — a Kashi evening

Open **Visitor tools → Kashi Journey** for five optional local stamps: marigolds,
Ganga offering, personal fountain, Ferris wheel and chaat tasting. Stamps follow
successful gameplay, not menu clicks. Browser storage contains only versioned
activity IDs, never inventory, payment proof or account data. Reset requires
confirmation; unavailable storage falls back to memory. Clearing/editing storage
can change progress. This is not a server-verified achievement system.

**Make a rangoli** provides an eight-fold brush, five colours, starting designs,
undo, clear, reset, PNG preview/download and feature-detected native sharing.
Drawings stay on-device and survive resizing, but not closing the editor.
Keyboard visitors can add symmetric petals without a pointer.
**Festival greetings** offers five preset cues, shared only with your room and
rate-limited. Models use a short visual cue rather than a new animation rig.
Three distinct session visitors offering diyas within 30 seconds trigger one
shared, restrained golden celebration. Server-only `GROUP_DIYA_THRESHOLD` (2–4)
and `GROUP_DIYA_WINDOW_MS` (1000–120000) configure this bounded window.
Reconnect retains the same session identity; a new session is not a verified human identity.

In Photo mode, select **My Kashi Evening souvenir** to include local activity
names with the actual world photo, website watermark and Dev Deepawali 2026
branding. Preview before downloading. Sharing is optional; device delivery is not
certified. No room codes, tokens or contribution references enter the image.

See [Phase 7 report](docs/release/PHASE7-IMPLEMENTATION-REPORT.md) and
[GitHub/hosting handoff](docs/release/PHASE7-GITHUB-AND-HOSTING-HANDOFF.md).
No deployment or production settings change is authorised by this release.

### Project structure and rights

- `frontend/src/`: React UI, procedural Three.js world and unit tests.
- `frontend/e2e/`: Playwright regression tests using isolated local demo servers.
- `frontend/public/`: intended public audio, gallery and favicon assets.
- `backend/src/`: Express API, protected commerce and single-process room owner.
- `backend/migrations/`: existing SQL migrations; Phase 7 adds no tables.
- `backend/assets/`: approved public donation QR crop only; no original poster.
- `scripts/`: release, secret/private-file checks and optional owner-run verification.
- `docs/`: public technical documentation and historical release evidence, not secrets.

No project-wide open-source licence was supplied; this release does not invent one
or grant rights to the application. Dependency licences remain with their owners.
Audio attribution/licence links are preserved in
[`frontend/public/audio/CREDITS.md`](frontend/public/audio/CREDITS.md) and
[`AUDIO-ASSET-PROVENANCE.md`](docs/release/AUDIO-ASSET-PROVENANCE.md).
Public gallery images are project captures with provenance in their README.
Review these terms before redistribution. Never publish private posters, owner-only
reports, `.env`, builds, dependency folders or browser traces.

Additional root checks: `python -m unittest discover -s scripts -p "test_*.py"`;
after staging, `python scripts/github_safety.py`. Use `scripts/release_zip.py`
with new `--output` and `--extract-to` paths; it refuses overwrite and verifies CRC,
secrets, exclusions and extracted bytes.

**Phase 6 — launch experience:** Choose **Enter with Sound** (existing Kashi Radio,
respecting saved volume/mute) or **Enter Silently**. Help is available before entry.
The real scene preparation status ends only after its first rendered frame.
Use the existing map's four activity shortcuts for directions and arrival cues;
walking, camera controls and collision remain unchanged. Together now offers
validated invitation links with explicit join confirmation, copy, device share and
WhatsApp. Photo mode previews a watermarked PNG before download, with an optional
Dev Deepawali 2026 frame. Graphics Auto only reduces quality after sustained poor
performance; manual tiers remain available. Compatibility fallback includes verified
project screenshots, retry and a link to the main website.

No deployment or production changes were made. The supplied portal is
`https://banarasdiwalimela.kesug.com`; provider/plan/subdomain/Node/WSS capabilities
are unconfirmed. See [implementation and actual tests](docs/release/PHASE6-IMPLEMENTATION-REPORT.md),
[gap checklist](docs/release/PHASE6-GAPS.md) and
[website readiness](docs/release/PHASE6-WEBSITE-READINESS.md).
Historical reports below are preserved, not new live verification.

**Phase 5 — Kashi Radio:** Music+ opens the integrated radio. Choose two original
meditative compositions or two credited Creative Commons devotional/temple
recordings. Progress/seek, pause/resume, previous/next, independent music/ambience/
effect levels, mute and minimisation are available. Original synthesized river,
bells and abstract crowd textures, plus gift/offering/fountain sounds, are
separately opt-in. Fresh page loads stay silent. No authentic Ganga Aarti recording
has been cleared; the radio explains that gap instead of playing a demo as Aarti.
See [Phase 5 report](docs/release/PHASE5-AUDIO-REPORT.md),
[audio provenance](docs/release/AUDIO-ASSET-PROVENANCE.md) and the
[website integration plan](docs/release/WEBSITE-INTEGRATION-PLAN.md).
The owner-supplied Paytm QR now decodes to the intended UPI ID. Non-demo donation
QR/copy/open-UPI controls use the exact approved crop with server/client hash checks;
references stay pending manual review. Demo mode, old/mismatched proofs and missing
or altered QR bytes remain blocked. No bank settlement or deployment is claimed.
See [QR replacement evidence](docs/release/DONATION-PAYTM-REPLACEMENT-20261026.md).
Earlier phase sections below are historical.

**Phase 4 gameplay:** Phool Gali gives marigold offerings; Deep Jyoti gives clay
diyas and a virtual spark fountain; Ghat Chaat gives a once-per-session tasting
stamp. These are free virtual gifts, unrelated to displayed rupee prices or
payments. Open **Gifts** to inspect inventory and directions. At the central river
steps (X0/Z1.15), press **E** or tap the prompt to offer flowers/diyas. At the central
celebration pad (X0/Z7), light your fountain. Room inventory is server-owned;
offerings and fountains are visible to room visitors. Collections are session-only,
not database records; solo and room collections remain separate. Donation actions
remain disabled. See [Phase 4 report](docs/release/PHASE4-IMPLEMENTATION-REPORT.md)
for executed checks, limits and launch blockers. Earlier phase notes below are historical.

**Donation redesign (25 October 2026):** shared teal/gold support UI is implemented,
but the supplied poster's QR decodes to a different address than its printed
`shreeramdiwalimela@ptyes`. Payment QR/copy/open actions remain blocked; no recipient,
schema, live setting or payment enablement was changed. See
[`DONATION-UI-AND-QR-VERIFICATION.md`](docs/release/DONATION-UI-AND-QR-VERIFICATION.md)
for actual decoder evidence, private-asset handling, credentials check and tests.

**Current Phase 2:** the Phase 1 expanded world/minimap is retained, with opt-in
four-visitor WebSocket rooms, a separate quality-bounded roaming crowd and optional
beggar support through the existing donation component. Start with
[`PHASE2-IMPLEMENTATION.md`](docs/release/PHASE2-IMPLEMENTATION.md) for actual test
results, known limits and required single-process HTTPS/WSS hosting, and
[`PHASE2-FOUR-CLIENTS.md`](docs/release/PHASE2-FOUR-CLIENTS.md) for reproduction.
Local credentials belong in **`backend/.env`**, copied privately from `.env.example`;
`npm run start:local` in backend loads that file. Never use frontend/VITE variables
for server keys. No live database state, recipient/QR, production hosting or physical
device performance is verified by this phase. Phase 0/1 reports are preserved;
the older numbered-release claims below are historical, not fresh Phase 2 evidence.

**Phase 13 release candidate:** The existing **Diwali Mela** Supabase project is integrated: migrations 001/002 and SQL security checks passed, synthetic contribution/application persistence survived a backend restart, and all 55 unit/API plus 30 browser tests passed. Public payment instructions remain disabled; no payment settlement or HTTPS deployment is certified. See [`docs/phase13/VERIFICATION.md`](docs/phase13/VERIFICATION.md) for precise live-versus-harness evidence and [`docs/phase13/LAUNCH.md`](docs/phase13/LAUNCH.md) for setup and remaining launch gates. Never share credentials or archive real `.env` files.

**Phase 12:** Production configuration, persistence error handling, organiser/security regression coverage and additive database hardening. The Phase 11 world and assets are unchanged. Start with [`docs/phase12/STAGING.md`](docs/phase12/STAGING.md) for installation, migrations **001 then 002**, HTTPS deployment, payment safeguards and organiser tasks; see [`docs/phase12/VERIFICATION.md`](docs/phase12/VERIFICATION.md) for executed checks. Live Supabase, payment verification and deployment are **not certified** by this release. Phase descriptions below are historical.

**Phase 11:** The desktop opening view now frames the complete Ferris wheel alongside the Ganga and Aarti. Desktop audio controls open on demand with **Music +**; the touch layout and keyboard controls remain. Reflections, Aarti lighting, fireworks and varied rooflines received restrained refinements. Fresh captures and exact checks: [`docs/phase11/VERIFICATION.md`](docs/phase11/VERIFICATION.md). Historical Phase 10 and earlier screenshots remain unchanged.

**Phase 10:** The unintended Phase 9 caveman characters, encounters and collision areas have been removed. The token-efficient OpenCode skill remains under `.opencode/skills/token-efficient-coding/`. Phase 9 camera, water, UI and Ferris-wheel improvements are retained. See [`docs/phase10/VERIFICATION.md`](docs/phase10/VERIFICATION.md) for new screenshots and exact test results. `docs/phase9/` records the previous release and is historical, not the current scene. The only bundled sound remains a demo chime; there is no confirmed payment processing.

**Phase 8:** The ZIP remains the application baseline. The expanded opposite-bank steps, instanced distant lamps, richer near-bank havelis with balconies and illuminated openings, and wave-warped river reflections are described in [`docs/phase8/VERIFICATION.md`](docs/phase8/VERIFICATION.md), alongside fresh desktop and touch screenshots. No real payment or devotional recording has been enabled.

**Phase 5:** The welcome screen and in-world toolbar offer contribution references (₹21/₹31/₹51), temporary stall applications and a vendor directory. Server-side Zod validation, protected organiser review, a Supabase SQL migration and explicit temporary demo mode are included. **No payment is confirmed by a UTR submission.** Real contribution instructions remain disabled until persistent storage and the recipient have been verified and enabled by the organiser. See [`docs/phase5/CHANGE-REPORT.md`](docs/phase5/CHANGE-REPORT.md) before collecting real money.

**Phase 4B:** The playable ghat now includes repeating fireworks (initially off if reduced motion is preferred), a boarding pendulum on the left terrace (X -16.5, Z 9.1), a ferry dock (X 4, Z 1.15) and a Ganga cruise dock (X 17, Z 1.15). Approach a marker, press **E** or tap **Board**, and press **E** or tap **Exit ride** to return to safe walking ground. The original six stalls, Ferris wheel and Aarti remain. The new **Music** controls offer a single audio source with playlist, play/pause, next/previous, volume and mute; on portrait screens tap **Music +** to expand them. The bundled sound is an original **demo chime, not an Aarti recording**. Unprovided devotional songs are explicitly labelled. See [`docs/phase4b/CHANGE-REPORT.md`](docs/phase4b/CHANGE-REPORT.md) for screenshots, verification and missing licensed audio assets.

An original, browser-based virtual festival in progress. The frontend contains a playable procedural ghat and riverfront; the independent backend handles protected, manually reviewed records. This is not an automated payment processor or a booking guarantee.

## Prerequisites

- Node.js 24 (tested with 24.18.0), npm 11 (tested with 11.16.0). A current supported Node.js release compatible with Vite 8 is required.
- No Supabase, hosting or payment account is needed to explore the world; Supabase is required for persistent contributions and applications.

From the repository root, open two terminals:

```powershell
cd frontend
npm ci
npm run dev
```

Frontend: http://localhost:5173

Select **Enter Silently** or **Enter with Sound** to explore. Desktop: W/A/S/D or arrows to move; drag the scene to look. Touch: left joystick moves, scene drag looks. Reset returns to spawn. Graphics offers Auto and manual low/medium/high tiers. Music + opens Kashi Radio with credited tracks, optional ambience and effects. See [`docs/PLAYABLE-WORLD.md`](docs/PLAYABLE-WORLD.md) for controls and limitations.

Walk toward the upper terrace to visit the six-stall demonstration bazaar. Approach a stall and press **E** or select its prompt; on touch screens, tap the prompt. Use the close button or Escape to resume exploring. Products and prices are illustrative, not real inventory or offers. See [`docs/BAZAAR.md`](docs/BAZAAR.md).

The first procedural Ferris wheel sits on the lower right terrace. Walk to its marked boarding platform, press **E** or tap **Board the Ferris wheel**, and press **E** or tap **Exit ride** to return safely to the platform. The wheel, cabin, camera and rider move together; no tickets or purchases are involved. See [`docs/FERRIS-WHEEL.md`](docs/FERRIS-WHEEL.md).

The riverside Ganga Aarti ceremony continues as you explore. Walk toward the lower left ghat to watch three stylised priests lift their lamps beside the river. The diya-lined steps and floating lamps remain visible with sound paused. See [`docs/AARTI.md`](docs/AARTI.md) for placement, animation, audio replacement and known limits.

```powershell
cd backend
npm ci
npm run dev
```

Backend: http://localhost:3001/api/health

Without Supabase configuration, commerce submissions are unavailable by default. For **temporary local testing only**, launch the backend with `DEMO_MODE=true` and a randomly generated `ADMIN_API_TOKEN` environment variable. Demo records vanish on restart and provide **no** real payment instructions. The frontend proxies `/api` to port 3001 in development. For persistent records inspect the existing database first, apply migration 001 only if absent, then 002; never rerun 001 after 002. Set server-only `SUPABASE_URL`, preferably `SUPABASE_SECRET_KEY` (legacy `SUPABASE_SERVICE_ROLE_KEY` fallback), and `ADMIN_API_TOKEN`. Follow the current [Phase 13 launch runbook](docs/phase13/LAUNCH.md). Recipient confirmation and organiser approval remain required before enabling payment instructions.

Run checks independently in each application:

```powershell
cd frontend
npm run typecheck
npm test
npm run build
npm run test:e2e
```

```powershell
cd backend
npm run typecheck
npm test
npm run build
npm start
```

Commands assume you start in the repository root for each block. `npm start` starts the compiled backend after building with shell/provider variables; stop it with Ctrl+C. Use `npm run start:local` in `backend/` to explicitly load its private `.env`. `npm run dev` does not automatically load that file. Never commit `.env` files or secrets. Leave `VITE_API_BASE_URL` empty for the same-origin `/api` proxy; never put server credentials in a Vite variable.

Frontend browser tests use Playwright with Microsoft Edge on Windows. On other platforms install Chromium once with `cd frontend` then `npx playwright install chromium`. Browser tests launch temporary Vite (port 5174) and an isolated local demo backend (port 3101) and save disposable results in ignored `frontend/test-results/`. Normal development still uses port 3001. Do not run browser tests against a production backend.

Architecture and earlier milestones remain in [`docs/`](docs/). Phase 13 verified the organiser's existing Supabase project; no new project was created and no website was deployed. Historical reports below Phase 13 are not current integration evidence.

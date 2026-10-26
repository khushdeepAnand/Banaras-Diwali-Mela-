# Four-client verification quick start

See [architecture and limitations](PHASE2-IMPLEMENTATION.md) first. No Supabase
credentials are needed for isolated room tests; commerce is not enabled by rooms.

1. In `backend/`, run `npm ci` and `npm run build`.
2. In `frontend/`, run `npm ci`, then `npm run test:e2e -- e2e/phase2.spec.ts`.
   The existing Playwright configuration starts its own demo backend3101/Vite5174,
   clears database credentials and uses the installed Microsoft Edge on Windows
   (Chromium elsewhere). Do not start another server on those ports.
3. The room case uses four separate real browser contexts at low graphics and a
   fifth for capacity/isolation. Only this multi-client harness caps browser raster
   frame requests at5Hz, using360x480 viewports to avoid unbounded concurrent
   SwiftShader load on the shared test host. The actual application, input, WebGL,
   sockets and server remain real; this is not physical-phone FPS evidence. Other
   browser tests remain uncapped. No socket responses are mocked.
4. It checks membership, three remote rendered avatars/client, real keyboard movement
   and facing, fifth rejection, another-room isolation, actual offline/online
   reconnection with the same guest ID, and explicit leave.
5. Backend `npm test` independently exercises real sockets: racing admission,
   forged IDs, malformed/nonfinite/oversized/replayed/rate-limited messages, denied
   origins, before-join actions, collision-segment checks, token-resume authority,
   grace expiry, slot release and empty-room cleanup.

For manual separate-device testing, use the same HTTPS frontend hostname and a
WSS-capable single Node backend. Configure its exact `REALTIME_ORIGINS`; localhost
on different devices is **not** the same host. Share a created room code privately.
No public hosting, physical phones or real internet latency have been verified here.

Credentials path for this working copy:
`C:\Users\khush\Desktop\banaras-diwali-mela-phase2\banaras-diwali-mela\backend\.env`.
Use backend `npm run start:local` to load it explicitly. Never add server secrets to
frontend variables, browser storage, public assets, test reports or the release ZIP.

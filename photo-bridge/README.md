# Studio Olimpo — Photo Bridge (TEST)

Cloudflare Worker + Figma **classic plugin**. Universal for clients and websites of Studio Olimpo, not specific to GPM Design. **This is not deployed, installed or end-to-end tested.**

## Contract

- Source is Google Drive, accessed read-only by a dedicated Google service account.
- Originals are never modified on Drive. The Worker streams their original bytes via Google Drive API.
- ChatGPT/future MCP tool creates a one-hour job containing the specific Drive folder, project, Figma file key and destination page ID.
- The Figma classic plugin is opened **once manually** in the target Figma page, receives a job ID and temporary token and adds a single Section `Materiale cliente — <Project>`.
- One independent Figma image-fill rectangle per file, preserving filename, original pixel dimensions, Drive file ID, size and checksum in layer metadata.
- Files whose larger edge is above 4096px are **adapted to Figma's native 4096px limit only in volatile browser memory**, as a technical PNG representation. **The source JPEG is unchanged; this is not preservation of all source pixels inside Figma.** Compare the result visually to Figma Finder drag&drop.
- Repeated imports skip files with the same Drive ID, MD5 and size. Updated photos with the same Drive ID are flagged rather than silently replaced.
- Existing CMS frames and nine black placeholders are never modified.
- The plugin sends a per-file report to Cloudflare, but **only Figma MCP read-back can confirm actual saved layers**.

## Repository structure

| Path | Purpose |
|---|---|
| `worker/index.mjs` | Google OAuth JWT, Drive inventory, temporary jobs, binary streaming, report |
| `worker/util.mjs` | Validation and limits |
| `plugin/code.ts` | Figma classic plugin, image layers, deduplication and Section |
| `plugin/ui.html` | One-click job import UI, HTTP download and in-memory image handling |
| `plugin/manifest.json` | Figma classic manifest (requires actual classic plugin ID assigned by Figma) |
| `tests/util.test.mjs` | Automated unit tests |
| `../../.github/workflows/photo-bridge-ci.yml` | Cloud build and ZIP output (no Node required on studio Macs) |

### A. Google Cloud (one-time)

1. In a Studio Olimpo-controlled Google Cloud project, enable **Google Drive API** and create a service account exclusively for Photo Bridge.
2. Share the single **Ciao Food & Beverage / Materiale cliente** TEST Drive folder with the service account address as **Reader**, provided external sharing policies allow it.
3. Generate the account's key and store it **only** as a secret in Cloudflare. Never paste a private key into a chat, repository or Figma plugin.

### B. Cloudflare (one-time)

1. Create a Workers KV namespace `studio_olimpo_photo_jobs`.
2. Configure its ID in `wrangler.toml` with binding `JOBS`.
3. Set `ALLOWED_ROOT_IDS` to the comma-separated IDs of permitted Drive root folders (start with **only the TEST folder**). Keep client IDs outside source control where practical.
4. Set Cloudflare Worker secrets: `ADMIN_TOKEN` (random string ≥32 chars), `GOOGLE_CLIENT_EMAIL` (service account email), `GOOGLE_PRIVATE_KEY` (full PEM).
5. Deploy via Cloudflare Git integration with `photo-bridge/` as root, or from authorized CI with Wrangler. **No deployment should be attempted until bindings and secrets are configured.**
6. Verify `GET /health` returns `status: configured`.

### C. Figma (one-time)

1. GitHub Actions tests and builds `plugin/code.ts` in the cloud and generates `studio-olimpo-photo-import-classic.zip`. Download and unpack it.
2. In Figma Desktop, create a **classic development plugin** once to obtain an ID. Replace the ID placeholder in the ZIP's `manifest.json` with that real ID, then import the manifest under Plugins → Development. This is an initial registration only; users do not need Node/npm on their Macs.
3. Open the target Figma **TEST page**, invoke the plugin, and enter the Worker base URL, job ID and job token. Select **Verifica e importa fotografie**. No Finder drag/drop per file.

The classic plugin may not be privately distributed to everyone on Studio's current Figma Pro plan; internal publishing is documented for Organization/Enterprise. Use a development plugin or evaluate supported publication channels.

### D. Start a TEST job (currently API call; ChatGPT MCP connection is a separate integration)

```http
POST https://<worker>.workers.dev/v1/jobs
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json

{"project":"Ciao Food & Beverage","folderId":"<TEST_DRIVE_FOLDER_ID>","figmaFileKey":"<FIGMA_FILE_KEY>","figmaPageId":"<FIGMA_TEST_PAGE_ID>"}
```

Response: `id`, `token`, `expiresAt`, `photoCount` and `totalBytes`. Never put the permanent ADMIN_TOKEN into the plugin. The job token expires in one hour and is sent only via `X-Job-Token` headers.

### E. QA gate (mandatory before calling S02 PASS)

- First import one original (e.g. DSCF0485.jpg); compare the resulting Figma IMAGE with manual Finder drag/drop: orientation, rendering and selection/editability.
- Import all 45 photos, reconcile Drive file IDs, source bytes and Figma node IDs.
- Rerun without duplicate levels; simulate partial failure and resume; test changed source (same ID, new MD5).
- Verify one Section, zero changes to the CMS and nine black placeholders.
- Only after independent Figma read-back and visual QA, change S02's Notion status to *Collaudata*.

### Security & remaining limitations

- Do not commit service account keys, Cloudflare API tokens or access tokens.
- Workers KV is eventually consistent. A new job may not immediately appear across all Cloudflare regions; production hardening should use D1 or Durable Objects for strong consistency. Retry and deployment tests remain outstanding.
- Plugins cannot execute as background/server processes: at least one invocation in Figma is still required.
- **No automatic ChatGPT → Cloudflare API connection exists yet**. A dedicated authenticated MCP interface must be developed and connected.
- S02 is **BLOCKED** until real JPEGs are imported and verified, and the test data must be retained pending review.

**TEST:** [Figma Section](https://www.figma.com/design/FNhKtqz4Seyi48eBsDMt8G?node-id=1693-114) · [Notion S02](https://app.notion.com/p/3ff2e3b81000811f85fcefe0780fb257)

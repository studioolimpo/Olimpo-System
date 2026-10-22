
import {
  FOLDER_MIME, IMAGE_MIMES, MAX_FILES, MAX_TOTAL_BYTES,
  encodeBase64Url, isDriveId, normalizeFile, safeEqual, validateJobRequest
} from "./util.mjs";

const JOB_LIFETIME_SECONDS = 3600;
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const TOKEN_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const encoder = new TextEncoder();
let cachedToken = null;
let cachedUntil = 0;

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...extraHeaders }
  });
}
function cors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Job-Token");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Max-Age", "600");
  headers.set("Vary", "Origin");
  return new Response(response.body, { status: response.status, headers });
}
function failure(message, status = 400) { return json({ error: message }, status); }
function bearer(req) {
  const value = req.headers.get("Authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}
function adminAllowed(req, env) {
  return typeof env.ADMIN_TOKEN === "string" && env.ADMIN_TOKEN.length >= 32 &&
    safeEqual(bearer(req), env.ADMIN_TOKEN);
}
function configured(env) {
  return Boolean(env.JOBS && env.ADMIN_TOKEN && env.GOOGLE_CLIENT_EMAIL &&
    env.GOOGLE_PRIVATE_KEY && env.ALLOWED_ROOT_IDS);
}
async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return encodeBase64Url(new Uint8Array(digest));
}
function decodePrivateKey(pem) {
  const clean = pem.replace(/\\n/g, "\n").replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, "");
  const raw = atob(clean);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
async function googleToken(env) {
  if (cachedToken && Date.now() < cachedUntil) return cachedToken;
  const now = Math.floor(Date.now() / 1000);
  const jwtHeader = encodeBase64Url(encoder.encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const jwtClaims = encodeBase64Url(encoder.encode(JSON.stringify({
    iss: env.GOOGLE_CLIENT_EMAIL,
    scope: TOKEN_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3000
  })));
  const message = jwtHeader + "." + jwtClaims;
  const key = await crypto.subtle.importKey("pkcs8", decodePrivateKey(env.GOOGLE_PRIVATE_KEY), {
    name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"
  }, false, ["sign"]);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(message));
  const assertion = message + "." + encodeBase64Url(new Uint8Array(signature));
  const tokenResponse = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  if (!tokenResponse.ok) throw new Error("Autenticazione Google non riuscita: HTTP " + tokenResponse.status);
  const token = await tokenResponse.json();
  if (!token.access_token) throw new Error("Token Google mancante");
  cachedToken = token.access_token;
  cachedUntil = Date.now() + Math.max(30_000, (Number(token.expires_in || 300) - 60) * 1000);
  return cachedToken;
}
async function googleRequest(env, path, options = {}) {
  const accessToken = await googleToken(env);
  const response = await fetch(DRIVE_API + path, {
    ...options,
    headers: { Authorization: "Bearer " + accessToken, ...(options.headers || {}) },
    redirect: "error"
  });
  return response;
}
async function googleJson(env, path) {
  const response = await googleRequest(env, path);
  if (!response.ok) throw new Error("Google Drive HTTP " + response.status);
  return response.json();
}
async function assertFolderAllowed(env, folderId) {
  const roots = String(env.ALLOWED_ROOT_IDS || "").split(",").map(v => v.trim()).filter(isDriveId);
  if (!roots.length) throw new Error("Nessuna radice Drive autorizzata");
  let current = folderId;
  const visited = new Set();
  for (let depth = 0; depth < 24; depth++) {
    if (roots.includes(current)) return true;
    if (visited.has(current)) break;
    visited.add(current);
    const metadata = await googleJson(env, "/files/" + encodeURIComponent(current) +
      "?fields=id,mimeType,parents&supportsAllDrives=true");
    if (metadata.mimeType !== FOLDER_MIME || !Array.isArray(metadata.parents) || !metadata.parents.length) break;
    current = metadata.parents[0];
  }
  throw new Error("Cartella Drive esterna alle radici autorizzate");
}
async function listPhotoFiles(env, rootId) {
  const queue = [{ id: rootId, path: "", depth: 0 }];
  const foldersVisited = new Set();
  const photos = [];
  const excluded = [];
  let totalBytes = 0;
  while (queue.length) {
    const folder = queue.shift();
    if (foldersVisited.has(folder.id)) continue;
    foldersVisited.add(folder.id);
    if (foldersVisited.size > 100) throw new Error("Troppi folder: suddividere il lavoro");
    let pageToken = "";
    do {
      const q = "'" + folder.id + "' in parents and trashed = false";
      const params = new URLSearchParams({
        q, pageSize: "500",
        fields: "nextPageToken,files(id,name,mimeType,size,md5Checksum,modifiedTime,imageMediaMetadata(width,height))",
        supportsAllDrives: "true", includeItemsFromAllDrives: "true"
      });
      if (pageToken) params.set("pageToken", pageToken);
      const page = await googleJson(env, "/files?" + params.toString());
      for (const source of page.files || []) {
        if (source.mimeType === FOLDER_MIME) {
          if (folder.depth >= 8) throw new Error("Profondità delle sottocartelle eccessiva");
          queue.push({ id: source.id, path: folder.path + source.name + "/", depth: folder.depth + 1 });
          continue;
        }
        if (!IMAGE_MIMES.has(source.mimeType)) {
          excluded.push({ name: source.name, reason: "Formato non gestito", path: folder.path });
          continue;
        }
        const item = normalizeFile(source, folder.path);
        if (!item) {
          excluded.push({ name: source.name, reason: "Dimensione non supportata", path: folder.path });
          continue;
        }
        photos.push(item);
        totalBytes += item.size;
        if (photos.length > MAX_FILES || totalBytes > MAX_TOTAL_BYTES) {
          throw new Error("Lotto troppo grande: massimo 400 immagini / 3 GB per lavoro");
        }
      }
      pageToken = page.nextPageToken || "";
    } while (pageToken);
  }
  photos.sort((a,b) => (a.path + a.name).localeCompare(b.path + b.name, "it"));
  return { photos, excluded, totalBytes };
}
async function jobAndAuth(req, env, id) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const job = await env.JOBS.get("job:" + id, "json");
  if (!job || Date.now() >= job.expiresAt) return null;
  if (adminAllowed(req, env)) return job;
  const provided = req.headers.get("X-Job-Token") || "";
  if (!provided || provided.length > 256) return null;
  const digest = await sha256(provided);
  return safeEqual(job.tokenDigest, digest) ? job : null;
}
async function createJob(req, env) {
  if (!adminAllowed(req, env)) return failure("Accesso negato", 401);
  const body = await req.json().catch(() => null);
  const params = validateJobRequest(body);
  await assertFolderAllowed(env, params.folderId);
  const inventory = await listPhotoFiles(env, params.folderId);
  const id = crypto.randomUUID();
  const token = encodeBase64Url(crypto.getRandomValues(new Uint8Array(32)));
  const expiresAt = Date.now() + JOB_LIFETIME_SECONDS * 1000;
  const job = {
    id, project: params.project, folderId: params.folderId,
    figmaFileKey: params.figmaFileKey, figmaPageId: params.figmaPageId,
    photos: inventory.photos, excluded: inventory.excluded,
    totalBytes: inventory.totalBytes, createdAt: Date.now(), expiresAt,
    tokenDigest: await sha256(token)
  };
  await env.JOBS.put("job:" + id, JSON.stringify(job), { expirationTtl: JOB_LIFETIME_SECONDS });
  return json({
    id, token, expiresAt, project: job.project,
    figmaPageId: job.figmaPageId, figmaFileKey: job.figmaFileKey,
    photoCount: job.photos.length, totalBytes: job.totalBytes,
    excluded: job.excluded.length
  }, 201);
}
async function readManifest(req, env, id) {
  const job = await jobAndAuth(req, env, id);
  if (!job) return failure("Lavoro non trovato o autorizzazione scaduta", 401);
  const { tokenDigest, ...publicJob } = job;
  return json(publicJob);
}
async function streamFile(req, env, id, fileId) {
  const job = await jobAndAuth(req, env, id);
  if (!job) return failure("Lavoro non autorizzato", 401);
  const file = job.photos.find(photo => photo.id === fileId);
  if (!file) return failure("File non incluso nel lavoro", 404);
  // Protect the QA snapshot: abort if the Drive source changed after job creation.
  const metadata = await googleJson(env, "/files/" + encodeURIComponent(file.id) +
    "?fields=id,size,md5Checksum,trashed&supportsAllDrives=true");
  if (metadata.trashed || Number(metadata.size) !== file.size ||
      (file.md5Checksum && metadata.md5Checksum !== file.md5Checksum)) {
    return failure("File Drive revisionato durante il lavoro; importazione fermata", 409);
  }
  const upstream = await googleRequest(env, "/files/" + encodeURIComponent(file.id) +
    "?alt=media&supportsAllDrives=true");
  if (!upstream.ok || !upstream.body) return failure("Download Google Drive non riuscito", 502);
  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": 'attachment; filename="source-image"',
      "Cache-Control": "no-store",
      "X-Photo-Source-Size": String(file.size),
      "X-Photo-Source-Id": file.id,
      "X-Photo-Source-Md5": file.md5Checksum
    }
  });
}
async function writeReport(req, env, id) {
  const job = await jobAndAuth(req, env, id);
  if (!job) return failure("Lavoro non autorizzato", 401);
  const data = await req.json().catch(() => null);
  if (!data || !Array.isArray(data.entries) || data.entries.length > job.photos.length) {
    return failure("Report non valido");
  }
  const seen = new Set();
  const entries = [];
  for (const entry of data.entries) {
    if (!entry || !job.photos.some(f => f.id === entry.fileId) || seen.has(entry.fileId)) {
      return failure("File duplicato o estraneo al lavoro");
    }
    seen.add(entry.fileId);
    const status = String(entry.status || "");
    if (!["IMPORTED", "SKIPPED", "FAILED"].includes(status)) return failure("Stato non valido");
    const nodeId = typeof entry.nodeId === "string" ? entry.nodeId : "";
    if (status === "IMPORTED" && !/^\d+:\d+$/.test(nodeId)) return failure("Node ID non valido");
    entries.push({ fileId: entry.fileId, status, nodeId, error: String(entry.error || "").slice(0, 250) });
  }
  const ttl = Math.max(60, Math.floor((job.expiresAt - Date.now()) / 1000));
  await env.JOBS.put("report:" + id, JSON.stringify({ entries, recordedAt: Date.now() }), {
    expirationTtl: ttl
  });
  return json({ saved: true, entries: entries.length });
}
async function readReport(req, env, id) {
  if (!adminAllowed(req, env)) return failure("Accesso negato", 401);
  const job = await env.JOBS.get("job:" + id, "json");
  if (!job) return failure("Lavoro non trovato", 404);
  const report = await env.JOBS.get("report:" + id, "json");
  return json({ jobId: id, report, note: "Il report del plugin va verificato con read-back dei livelli Figma" });
}
export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return cors(new Response(null, { status: 204 }));
    try {
      const url = new URL(request.url);
      if (url.pathname === "/health" && request.method === "GET") {
        return cors(json({ service: "Studio Olimpo Photo Bridge", status: configured(env) ? "configured" : "configuration-required" }));
      }
      if (!configured(env)) return cors(failure("Servizio non configurato", 503));
      let reply;
      if (url.pathname === "/v1/jobs" && request.method === "POST") {
        reply = await createJob(request, env);
      } else {
        const manifest = /^\/v1\/jobs\/([0-9a-f-]{36})$/.exec(url.pathname);
        const photo = /^\/v1\/jobs\/([0-9a-f-]{36})\/files\/([A-Za-z0-9_-]{15,128})$/.exec(url.pathname);
        const report = /^\/v1\/jobs\/([0-9a-f-]{36})\/report$/.exec(url.pathname);
        if (manifest && request.method === "GET") reply = await readManifest(request, env, manifest[1]);
        else if (photo && request.method === "GET") reply = await streamFile(request, env, photo[1], photo[2]);
        else if (report && request.method === "POST") reply = await writeReport(request, env, report[1]);
        else if (report && request.method === "GET") reply = await readReport(request, env, report[1]);
        else reply = failure("Endpoint sconosciuto", 404);
      }
      return cors(reply);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Errore interno";
      const safe = /Dati progetto|non valid|Cartella Drive esterna|lavoro|dimensione|Lotto|folder|sottocartelle/i.test(message);
      return cors(failure(safe ? message : "Errore del servizio: controllare i log privati", safe ? 400 : 500));
    }
  }
};

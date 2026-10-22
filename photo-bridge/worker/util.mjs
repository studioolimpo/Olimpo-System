
export const FOLDER_MIME = "application/vnd.google-apps.folder";
export const IMAGE_MIMES = new Set(["image/jpeg", "image/png"]);
export const MAX_FILES = 400;
export const MAX_IMAGE_BYTES = 150_000_000;
export const MAX_TOTAL_BYTES = 3_000_000_000;

export function isDriveId(id) {
  return typeof id === "string" && /^[A-Za-z0-9_-]{15,128}$/.test(id);
}
export function isFigmaKey(key) {
  return typeof key === "string" && /^[A-Za-z0-9]{22,128}$/.test(key);
}
export function isFigmaNode(id) {
  return typeof id === "string" && /^\d+:\d+$/.test(id);
}
export function safeProject(value) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 160 && !/[\x00-\x1F]/.test(value);
}
export function safeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let i = 0; i < length; i++) diff |= (left.charCodeAt(i) || 0) ^ (right.charCodeAt(i) || 0);
  return diff === 0;
}
export function encodeBase64Url(bytes) {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
export function normalizeFile(raw, path = "") {
  if (!isDriveId(raw.id) || !IMAGE_MIMES.has(raw.mimeType)) return null;
  const size = Number(raw.size);
  if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_IMAGE_BYTES) return null;
  return {
    id: raw.id,
    name: String(raw.name || raw.id).slice(0, 240),
    path,
    mimeType: raw.mimeType,
    size,
    md5Checksum: typeof raw.md5Checksum === "string" ? raw.md5Checksum : "",
    modifiedTime: typeof raw.modifiedTime === "string" ? raw.modifiedTime : "",
    width: Number(raw.imageMediaMetadata?.width || 0),
    height: Number(raw.imageMediaMetadata?.height || 0)
  };
}
export function validateJobRequest(body) {
  if (!body || !safeProject(body.project) || !isDriveId(body.folderId) ||
      !isFigmaKey(body.figmaFileKey) || !isFigmaNode(body.figmaPageId)) {
    throw new Error("Dati progetto, cartella o pagina Figma non validi");
  }
  return {
    project: body.project.trim(),
    folderId: body.folderId,
    figmaFileKey: body.figmaFileKey,
    figmaPageId: body.figmaPageId
  };
}

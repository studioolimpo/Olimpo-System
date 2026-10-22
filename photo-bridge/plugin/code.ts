
/* Studio Olimpo — Photo Import · Figma classic plugin.
   No third-party credentials or source photographs are persisted in plugin data. */
type SourcePhoto = {
  id: string;
  name: string;
  path: string;
  mimeType: "image/jpeg" | "image/png";
  size: number;
  md5Checksum: string;
  modifiedTime: string;
  width: number;
  height: number;
};
type Message =
  | { type: "start"; jobId: string; project: string; fileKey: string; pageId: string; expected: number }
  | { type: "file-start"; photo: SourcePhoto }
  | { type: "file-prepared"; length: number; sourceWidth: number; sourceHeight: number; width: number; height: number; normalized: boolean }
  | { type: "chunk"; data: Uint8Array }
  | { type: "file-end" }
  | { type: "complete" }
  | { type: "abort" };
type FilePending = {
  source: SourcePhoto;
  bytes: Uint8Array | null;
  written: number;
  length: number;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
  normalized: boolean;
  skip: boolean;
  conflict: boolean;
};
const MAX_TRANSFER_BYTES = 150_000_000;
let active = false;
let project = "";
let jobId = "";
let total = 0;
let count = 0;
let pending: FilePending | null = null;
let section: SectionNode | null = null;
let newNodes: RectangleNode[] = [];

function notify(message: object): void { figma.ui.postMessage(message); }
function getSection(name: string): SectionNode | null {
  const matches = figma.currentPage.children.filter(
    (node): node is SectionNode => node.type === "SECTION" && node.name === name
  );
  if (matches.length > 1) throw new Error("Esistono Section duplicate: risolvere il conflitto prima di importare");
  return matches[0] || null;
}
function ensureSection(): SectionNode {
  if (section) return section;
  const s = figma.createSection();
  s.name = "Materiale cliente — " + project;
  const others = figma.currentPage.children.filter(node => node.id !== s.id);
  s.x = Math.ceil((others.length ? Math.max(...others.map(n => n.x + n.width)) : figma.viewport.center.x) + 450);
  s.y = Math.max(0, Math.round(figma.viewport.center.y - 400));
  s.resizeWithoutConstraints(1600, 1000);
  section = s;
  return s;
}
function checkExisting(source: SourcePhoto): "new" | "skip" | "conflict" {
  if (!section) return "new";
  const matches = section.children.filter(node =>
    node.type === "RECTANGLE" && node.getPluginData("so-drive-id") === source.id
  );
  if (!matches.length) return "new";
  const same = matches.some(node =>
    node.getPluginData("so-drive-md5") === source.md5Checksum &&
    node.getPluginData("so-drive-size") === String(source.size)
  );
  return same ? "skip" : "conflict";
}
function layoutNewNodes(): void {
  if (!section || !newNodes.length) return;
  const old = section.children.filter(node => !newNodes.some(fresh => fresh.id === node.id));
  const base = old.length ? Math.max(...old.map(node => node.y + node.height)) + 160 : 70;
  const gutter = 120;
  const colWidth = Math.max(...newNodes.map(node => node.width)) + gutter;
  const heights = [base, base];
  for (const node of newNodes) {
    const i = heights[0] <= heights[1] ? 0 : 1;
    node.x = 70 + i * colWidth;
    node.y = heights[i];
    heights[i] += node.height + gutter;
  }
  section.resizeWithoutConstraints(
    Math.max(1600, Math.round(colWidth * 2 + 140)),
    Math.max(1000, Math.round(Math.max(...heights) + 70))
  );
}
async function addPhoto(file: FilePending): Promise<object> {
  if (file.skip) return { type: "file-result", fileId: file.source.id, status: "SKIPPED" };
  if (file.conflict) return { type: "file-result", fileId: file.source.id, status: "FAILED", error: "Sorgente modificata su Drive: revisione da approvare" };
  if (!file.bytes || file.written !== file.length) {
    return { type: "file-result", fileId: file.source.id, status: "FAILED", error: "Trasferimento incompleto" };
  }
  let node: RectangleNode | null = null;
  try {
    const image = figma.createImage(file.bytes);
    const dimensions = await image.getSizeAsync();
    if (dimensions.width !== file.width || dimensions.height !== file.height ||
        dimensions.width > 4096 || dimensions.height > 4096) {
      throw new Error("Dimensioni Figma inattese: " + dimensions.width + "x" + dimensions.height);
    }
    const parent = ensureSection();
    node = figma.createRectangle();
    parent.appendChild(node);
    node.resize(dimensions.width, dimensions.height);
    node.name = file.source.name;
    node.fills = [{ type: "IMAGE", imageHash: image.hash, scaleMode: "FILL" }];
    node.setPluginData("so-drive-id", file.source.id);
    node.setPluginData("so-drive-md5", file.source.md5Checksum);
    node.setPluginData("so-drive-size", String(file.source.size));
    node.setPluginData("so-drive-path", file.source.path);
    node.setPluginData("so-drive-version", file.source.modifiedTime);
    node.setPluginData("so-original-width", String(file.originalWidth));
    node.setPluginData("so-original-height", String(file.originalHeight));
    node.setPluginData("so-normalized-for-figma", file.normalized ? "yes" : "no");
    node.setPluginData("so-job-id", jobId);
    newNodes.push(node);
    return {
      type: "file-result", fileId: file.source.id, status: "IMPORTED",
      nodeId: node.id, width: node.width, height: node.height
    };
  } catch (error) {
    if (node) node.remove();
    return { type: "file-result", fileId: file.source.id, status: "FAILED", error: String(error) };
  }
}

figma.showUI(__html__, { width: 380, height: 620 });
notify({ type: "context", pageId: figma.currentPage.id, fileName: figma.root.name, fileKey: figma.fileKey || null });

figma.ui.onmessage = async (msg: Message) => {
  try {
    if (msg.type === "start") {
      if (active) throw new Error("Importazione già in corso");
      if (figma.currentPage.id !== msg.pageId) throw new Error("La pagina Figma aperta è diversa da quella del lavoro. Apri la pagina TEST corretta.");
      if (figma.fileKey && figma.fileKey !== msg.fileKey) throw new Error("File Figma differente da quello autorizzato");
      if (!msg.project || msg.project.length > 160 || !/^[0-9a-f-]{36}$/i.test(msg.jobId)) throw new Error("Lavoro non valido");
      if (!Number.isInteger(msg.expected) || msg.expected < 1 || msg.expected > 400) throw new Error("Numero fotografie fuori intervallo");
      project = msg.project; jobId = msg.jobId; total = msg.expected; count = 0;
      section = getSection("Materiale cliente — " + project);
      pending = null; newNodes = []; active = true;
      notify({ type: "started", sectionId: section?.id || null });
      return;
    }
    if (msg.type === "file-start") {
      if (!active || pending || count >= total) throw new Error("Sequenza file non valida");
      const photo = msg.photo;
      if (!photo || !/^[A-Za-z0-9_-]{15,128}$/.test(photo.id) || !["image/jpeg","image/png"].includes(photo.mimeType)) throw new Error("Fonte immagine non valida");
      if (!Number.isInteger(photo.size) || photo.size < 1 || photo.size > MAX_TRANSFER_BYTES) throw new Error("Dimensione sorgente non supportata");
      const existing = checkExisting(photo);
      pending = {
        source: photo, bytes: null, written: 0, length: 0,
        originalWidth: 0, originalHeight: 0, width: 0, height: 0, normalized: false,
        skip: existing === "skip", conflict: existing === "conflict"
      };
      notify({ type: "file-started", outcome: existing });
      return;
    }
    if (msg.type === "file-prepared") {
      if (!active || !pending || pending.skip || pending.conflict || pending.bytes) throw new Error("Preparazione non prevista");
      if (!Number.isInteger(msg.length) || msg.length < 1 || msg.length > MAX_TRANSFER_BYTES) throw new Error("Immagine troppo grande");
      for (const size of [msg.width,msg.height,msg.sourceWidth,msg.sourceHeight]) {
        if (!Number.isInteger(size) || size < 1 || size > 100_000) throw new Error("Dimensione immagine non valida");
      }
      if (msg.width > 4096 || msg.height > 4096) throw new Error("Superato il limite Figma di 4096 px");
      pending.bytes = new Uint8Array(msg.length);
      pending.length = msg.length;
      pending.width = msg.width; pending.height = msg.height;
      pending.originalWidth = msg.sourceWidth; pending.originalHeight = msg.sourceHeight;
      pending.normalized = msg.normalized;
      notify({ type: "file-prepared-ack" });
      return;
    }
    if (msg.type === "chunk") {
      if (!active || !pending || !pending.bytes || pending.skip || pending.conflict) throw new Error("Chunk imprevisto");
      const bytes = new Uint8Array(msg.data);
      if (bytes.length < 1 || bytes.length > 512_000 || pending.written + bytes.length > pending.length) throw new Error("Chunk oltre il limite");
      pending.bytes.set(bytes, pending.written);
      pending.written += bytes.length;
      notify({ type: "chunk-ack", written: pending.written });
      return;
    }
    if (msg.type === "file-end") {
      if (!active || !pending) throw new Error("File non inizializzato");
      const current = pending;
      pending = null;
      count++;
      notify(await addPhoto(current));
      return;
    }
    if (msg.type === "complete") {
      if (!active || pending || count !== total) throw new Error("Lavoro incompleto");
      layoutNewNodes();
      if (section && newNodes.length) {
        figma.currentPage.selection = [section];
        figma.viewport.scrollAndZoomIntoView([section]);
      }
      const added = newNodes.map(node => node.id);
      notify({ type: "finished", sectionId: section?.id || null, createdNodeIds: added, processed: count });
      active = false;
      return;
    }
    if (msg.type === "abort") {
      active = false; pending = null;
      notify({ type: "aborted", processed: count });
    }
  } catch (error) {
    notify({ type: "failure", error: String(error) });
  }
};

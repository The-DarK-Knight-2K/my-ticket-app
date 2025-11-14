// app/lib/pdfExport.ts
import { PDFDocument } from "pdf-lib";

/**
 * Placement definition (mm)
 */
export type Placement = {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotation?: 0 | 90;
  row?: number;
  col?: number;
  index?: number;
};

/**
 * Convert millimeters to PDF points (1 pt = 1/72 in, 1 in = 25.4 mm)
 */
const mmToPt = (mm: number) => (mm * 72) / 25.4;

/**
 * Helper: convert ArrayBuffer to Blob then to ImageBitmap (browser-side)
 */
async function arrayBufferToImageBitmap(buf: ArrayBuffer): Promise<ImageBitmap> {
  const blob = new Blob([buf]);
  // createImageBitmap is fast and avoids DOM <img> sizing issues
  // browser environment required (export runs on client)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return await createImageBitmap(blob);
}

/**
 * Helper: canvas to ArrayBuffer (PNG)
 */
function canvasToArrayBuffer(canvas: HTMLCanvasElement): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Canvas toBlob produced no blob"));
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as ArrayBuffer);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(blob);
    }, "image/png");
  });
}

/**
 * Create a PNG ArrayBuffer containing the source image drawn to cover a target
 * rectangle (targetWidthPt x targetHeightPt) and rotated by rotationDegrees (0 or 90).
 *
 * The function:
 * - creates a canvas sized to target rectangle in pixels (using scale factor),
 * - draws the source image to cover the canvas (object-fit: cover),
 * - applies rotation about the canvas center when requested,
 * - returns PNG bytes (ArrayBuffer).
 *
 * This allows embedding the pre-rotated PNG directly into the PDF without using PDF transforms.
 */
async function makePreRotatedImagePngBuffer(
  sourceBuffer: ArrayBuffer,
  rotationDeg: 0 | 90,
  targetWidthPt: number,
  targetHeightPt: number
): Promise<ArrayBuffer> {
  // scale factor for canvas resolution (higher = better quality). 2 is reasonable.
  const SCALE = 2;

  // final canvas size in CSS pixels
  const canvasW = Math.max(1, Math.round(targetWidthPt * SCALE));
  const canvasH = Math.max(1, Math.round(targetHeightPt * SCALE));

  // load image bitmap
  const imgBitmap = await arrayBufferToImageBitmap(sourceBuffer);

  // create canvas
  const canvas = document.createElement("canvas");
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  // clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // For rotation: rotate the drawing context around center, then draw the image
  // We want the final PNG (when placed unrotated into the PDF) to appear rotated.
  // So we rotate the drawing coordinate system and draw the image sized to cover the rotated drawing area.
  const rad = (rotationDeg * Math.PI) / 180;

  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  if (rotationDeg !== 0) ctx.rotate(rad);

  // Determine the target box (in rotated coordinate space) we want the image to cover.
  // If rotated by 90deg, the effective target box dimensions swap.
  const targetBoxW = rotationDeg === 90 ? canvas.height : canvas.width;
  const targetBoxH = rotationDeg === 90 ? canvas.width : canvas.height;

  // compute scale to cover (object-fit: cover)
  const scale = Math.max(targetBoxW / imgBitmap.width, targetBoxH / imgBitmap.height);
  const drawW = imgBitmap.width * scale;
  const drawH = imgBitmap.height * scale;
  const drawX = -drawW / 2;
  const drawY = -drawH / 2;

  ctx.drawImage(imgBitmap, drawX, drawY, drawW, drawH);
  ctx.restore();

  // export PNG bytes
  const arr = await canvasToArrayBuffer(canvas);
  // clean up ImageBitmap (browser API)
  try {
    // @ts-ignore
    if (typeof imgBitmap.close === "function") imgBitmap.close();
  } catch (_) {}

  return arr;
}

/**
 * Main exported function:
 * - frontUrl: URL (object URL or remote) to front image/PDF
 * - backUrl: optional url for back
 * - placements: placements array for a single sheet (in mm)
 * - options: { paperWidthMm, paperHeightMm, totalCount, marginMm? }
 *
 * Behavior:
 * - Uses the placement pattern to compute pagesNeeded = ceil(totalCount / slotsPerPage).
 * - For each page, draws placements with exact x/y/width/height (mm->pt).
 * - If a placement.rotation === 90, the image bytes are pre-rotated via canvas to match orientation.
 * - Raster images (jpg/png) are embedded correctly. PDF assets (uploaded PDFs) are not embedded;
 *   they are represented by placeholders (warning logged).
 */
export async function generatePDFFromPattern(
  frontUrl: string | null,
  backUrl: string | null | undefined,
  placements: Placement[],
  options: { paperWidthMm: number; paperHeightMm: number; totalCount: number; marginMm?: number }
): Promise<Uint8Array> {
  const { paperWidthMm, paperHeightMm, totalCount } = options;
  const marginMm = options.marginMm ?? 5;

  const pdfDoc = await PDFDocument.create();

  const paperWidthPt = mmToPt(paperWidthMm);
  const paperHeightPt = mmToPt(paperHeightMm);
  const marginPt = mmToPt(marginMm);

  if (!placements || placements.length === 0) {
    throw new Error("No placements provided for export.");
  }

  const slotsPerPage = placements.length;
  const pagesNeeded = Math.ceil(totalCount / slotsPerPage);

  // Pre-fetch the source bytes once
  async function fetchBytes(url: string | null) {
    if (!url) return null;
    try {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      const contentType = res.headers?.get?.("content-type") ?? "";
      const looksLikePdf = url.toLowerCase().endsWith(".pdf") || contentType.includes("pdf");
      return { buffer, looksLikePdf };
    } catch (err) {
      console.warn("Failed to fetch asset:", url, err);
      return null;
    }
  }

  const frontFetch = await fetchBytes(frontUrl);
  const backFetch = await fetchBytes(backUrl ?? null);

  // Caches (per export run)
  const rotatedPngCache = new Map<string, ArrayBuffer>(); // key: `${rotation}_${wPt}_${hPt}` -> png bytes
  const embeddedImageCache = new Map<string, any>(); // key -> embedded image object in pdfDoc

  // Helper to get embedded image for a given source buffer + placement dims + rotation
  async function getEmbeddedImageForPlacement(sourceInfo: { buffer: ArrayBuffer; looksLikePdf: boolean } | null, p: Placement) {
    if (!sourceInfo) return null;
    if (sourceInfo.looksLikePdf) {
      // PDF-as-source not implemented for embedding here
      return { kind: "pdf" as const };
    }

    const rotation = (p.rotation ?? 0) as 0 | 90;
    const wPt = mmToPt(p.widthMm);
    const hPt = mmToPt(p.heightMm);

    const key = `${rotation}_${wPt.toFixed(3)}x${hPt.toFixed(3)}`;

    // If we already embedded for this key, return it
    if (embeddedImageCache.has(key)) return embeddedImageCache.get(key);

    // Need PNG bytes for this key — either from cache or by creating via canvas
    let pngBytes: ArrayBuffer;
    if (rotatedPngCache.has(key)) {
      pngBytes = rotatedPngCache.get(key)!;
    } else {
      // Create pre-rotated PNG bytes using canvas
      // Note: this relies on browser APIs (createImageBitmap + canvas). Export must run client-side.
      pngBytes = await makePreRotatedImagePngBuffer(sourceInfo.buffer, rotation, wPt, hPt);
      rotatedPngCache.set(key, pngBytes);
    }

    // embed into pdfDoc (PNG)
    let embeddedImg;
    try {
      embeddedImg = await pdfDoc.embedPng(pngBytes);
    } catch (err) {
      // fallback: try jpg (unlikely since we converted to PNG)
      try {
        embeddedImg = await pdfDoc.embedJpg(pngBytes);
      } catch (e) {
        console.error("Failed to embed image bytes into PDF:", e);
        return null;
      }
    }

    embeddedImageCache.set(key, { kind: "image", embeddedImg });
    return { kind: "image", embeddedImg };
  }

  // Draw pages for a source (front/back)
  async function drawPagesForSource(sourceInfo: { buffer: ArrayBuffer; looksLikePdf: boolean } | null, isFront = true) {
    if (!sourceInfo) return;

    for (let pageIndex = 0; pageIndex < pagesNeeded; pageIndex++) {
      const page = pdfDoc.addPage([paperWidthPt, paperHeightPt]);

      for (let slot = 0; slot < slotsPerPage; slot++) {
        const globalIndex = pageIndex * slotsPerPage + slot;
        if (globalIndex >= totalCount) break;

        const p = placements[slot];
        const xPt = mmToPt(p.xMm);
        const yPtFromTop = mmToPt(p.yMm);
        const wPt = mmToPt(p.widthMm);
        const hPt = mmToPt(p.heightMm);
        const drawY = page.getHeight() - yPtFromTop - hPt;

        if (sourceInfo.looksLikePdf) {
          // PDF-as-source: not embedding — draw placeholder box and text
          page.drawRectangle({
            x: xPt,
            y: drawY,
            width: wPt,
            height: hPt,
            borderColor: undefined,
            color: undefined,
          });
          page.drawText(isFront ? "PDF (not embedded)" : "PDF (not embedded)", {
            x: xPt + 5,
            y: drawY + 5,
            size: 8,
          });
          continue;
        }

        // For raster images: get embedded image (pre-rotated if needed)
        const embedded = await getEmbeddedImageForPlacement(sourceInfo, p);
        if (!embedded) continue;

        if (embedded.kind === "image") {
          try {
            page.drawImage(embedded.embeddedImg, {
              x: xPt,
              y: drawY,
              width: wPt,
              height: hPt,
            });
          } catch (err) {
            console.error("Failed to draw embedded image on PDF page:", err);
          }
        }
      } // end slots loop
    } // end pages loop
  } // end drawPagesForSource

  // draw front pages
  await drawPagesForSource(frontFetch ?? null, true);

  // draw back pages (appended)
  if (backFetch) {
    await drawPagesForSource(backFetch, false);
  }

  const bytes = await pdfDoc.save();
  return bytes;
}

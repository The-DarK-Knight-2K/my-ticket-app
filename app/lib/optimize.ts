// lib/optimize.ts
export type LayoutOptions = {
  paperWidthMm: number;
  paperHeightMm: number;
  cardWidthMm: number;
  cardHeightMm: number;
  cardCount?: number; // optional cap
  horizontalOnly?: boolean;
  verticalOnly?: boolean;
  autoRotate?: boolean;
  marginMm?: number; // optional margin around page (default 0)
};

export type Placement = {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotation: 0 | 90; // rotation applied to card (90 means swapped w/h)
  row: number;
  col: number;
  index: number; // placement index
};

/**
 * Try mixed-column packing that allows columns of non-rotated cards
 * and columns of rotated cards to coexist, maximizing fit.
 */
export function optimizeLayout(opts: LayoutOptions): { placements: Placement[]; fittedCount: number } {
  const margin = opts.marginMm ?? 0;
  const usableWidth = Math.max(0, opts.paperWidthMm - 2 * margin);
  const usableHeight = Math.max(0, opts.paperHeightMm - 2 * margin);

  // orientation A = default, B = rotated
  const A = { w: opts.cardWidthMm, h: opts.cardHeightMm, rot: 0 as const };
  const B = { w: opts.cardHeightMm, h: opts.cardWidthMm, rot: 90 as const };

  // Helpers to compute counts for columns-only layout
  const colsA = Math.floor(usableWidth / A.w);
  const rowsA = Math.floor(usableHeight / A.h);
  const countAOnly = colsA * rowsA;

  const colsB = Math.floor(usableWidth / B.w);
  const rowsB = Math.floor(usableHeight / B.h);
  const countBOnly = colsB * rowsB;

  // If rotation is forbidden or not useful, fall back to simple approach
  if (opts.horizontalOnly) {
    return buildGrid(A.w, A.h, A.rot, usableWidth, usableHeight, margin, opts.cardCount);
  }
  if (opts.verticalOnly) {
    return buildGrid(B.w, B.h, B.rot, usableWidth, usableHeight, margin, opts.cardCount);
  }

  // If autoRotate disabled, stick to default orientation
  if (!opts.autoRotate) {
    return buildGrid(A.w, A.h, A.rot, usableWidth, usableHeight, margin, opts.cardCount);
  }

  // Try mixed column strategies:
  // Strategy 1: iterate number of A-columns (0..colsA), fit B-columns in remainder
  // Strategy 2: iterate number of B-columns (0..colsB), fit A-columns in remainder
  let best = { count: 0, colsA: 0, colsB: 0, rowsA, rowsB, use: "Afirst" as const };

  for (let x = 0; x <= colsA; x++) {
    const remW = usableWidth - x * A.w;
    if (remW < -1e-9) continue;
    const y = Math.floor(remW / B.w);
    const count = x * rowsA + y * rowsB;
    if (count > best.count) {
      best = { count, colsA: x, colsB: y, rowsA, rowsB, use: "Afirst" };
    }
  }

  for (let y = 0; y <= colsB; y++) {
    const remW = usableWidth - y * B.w;
    if (remW < -1e-9) continue;
    const x = Math.floor(remW / A.w);
    const count = x * rowsA + y * rowsB;
    if (count > best.count) {
      best = { count, colsA: x, colsB: y, rowsA, rowsB, use: "Bfirst" };
    }
  }

  // Edge: maybe pure A or pure B is best
  if (countAOnly > best.count) {
    best = { count: countAOnly, colsA, colsB: 0, rowsA, rowsB, use: "Aonly" };
  }
  if (countBOnly > best.count) {
    best = { count: countBOnly, colsA: 0, colsB, rowsA, rowsB, use: "Bonly" };
  }

  // Build placements according to best.colsA and best.colsB
  const placements: Placement[] = [];
  let idx = 0;

  // x offset starts at margin
  let xOffset = margin;

  // place A columns first (left side), then B columns after them
  // columns of A: width A.w, rows rowsA, each has height A.h
  for (let ca = 0; ca < best.colsA; ca++) {
    for (let r = 0; r < best.rowsA; r++) {
      const x = margin + ca * A.w;
      const y = margin + r * A.h;
      placements.push({
        xMm: Number(x.toFixed(6)),
        yMm: Number(y.toFixed(6)),
        widthMm: Number(A.w.toFixed(6)),
        heightMm: Number(A.h.toFixed(6)),
        rotation: A.rot,
        row: r,
        col: ca,
        index: idx++,
      });
    }
    xOffset += A.w;
  }

  // columns of B placed to the right of A columns
  for (let cb = 0; cb < best.colsB; cb++) {
    for (let r = 0; r < best.rowsB; r++) {
      const x = margin + best.colsA * A.w + cb * B.w;
      const y = margin + r * B.h;
      placements.push({
        xMm: Number(x.toFixed(6)),
        yMm: Number(y.toFixed(6)),
        widthMm: Number(B.w.toFixed(6)),
        heightMm: Number(B.h.toFixed(6)),
        rotation: B.rot,
        row: r,
        col: best.colsA + cb,
        index: idx++,
      });
    }
  }

  // If user requested fewer than fitted, slice
  let final = placements;
  if (typeof opts.cardCount === "number" && opts.cardCount > 0) {
    final = placements.slice(0, opts.cardCount);
  }

  return { placements: final, fittedCount: final.length };
}

/**
 * Helper to build a simple full-grid when we force a single orientation or as fallback.
 */
function buildGrid(
  cardW: number,
  cardH: number,
  rotation: 0 | 90,
  usableWidth: number,
  usableHeight: number,
  margin: number,
  cardCount?: number
): { placements: Placement[]; fittedCount: number } {
  const cols = Math.floor(usableWidth / cardW);
  const rows = Math.floor(usableHeight / cardH);
  const placements: Placement[] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = margin + c * cardW;
      const y = margin + r * cardH;
      placements.push({
        xMm: Number(x.toFixed(6)),
        yMm: Number(y.toFixed(6)),
        widthMm: Number(cardW.toFixed(6)),
        heightMm: Number(cardH.toFixed(6)),
        rotation,
        row: r,
        col: c,
        index: idx++,
      });
    }
  }
  let final = placements;
  if (typeof cardCount === "number" && cardCount > 0) {
    final = placements.slice(0, cardCount);
  }
  return { placements: final, fittedCount: final.length };
}

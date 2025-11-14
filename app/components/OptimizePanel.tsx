"use client";

import React, { useState, useEffect } from "react";
import { useStore } from "../lib/zustandStore";
import { optimizeLayout } from "../lib/optimize";

const PRESET_SIZES = {
  A4: { w: 210, h: 297 },
  A3: { w: 297, h: 420 },
  B4: { w: 250, h: 353 }, // approximate
};

export default function OptimizePanel() {
  const layout = useStore((s) => s.layout);
  const setLayout = useStore((s) => s.setLayout);
  const setPlacements = useStore((s) => s.setPlacements);

  // local editable state to avoid spamming store while user types
  const [paperSize, setPaperSize] = useState(layout.paperSize || "A4");
  const [paperW, setPaperW] = useState(layout.paperWidthMm || 210);
  const [paperH, setPaperH] = useState(layout.paperHeightMm || 297);
  const [cardW, setCardW] = useState(layout.cardWidthMm || 50);
  const [cardH, setCardH] = useState(layout.cardHeightMm || 90);
  const [cardCount, setCardCount] = useState(layout.cardCount || 0);
  const [horizontalOnly, setHorizontalOnly] = useState(layout.horizontalOnly || false);
  const [verticalOnly, setVerticalOnly] = useState(layout.verticalOnly || false);
  const [autoRotate, setAutoRotate] = useState(layout.autoRotate ?? true);
  const [lastResult, setLastResult] = useState({ fitted: 0 });

  useEffect(() => {
    // when paperSize change to preset, update dims
    if (paperSize === "Custom") return;
    const preset = (PRESET_SIZES as any)[paperSize];
    if (preset) {
      setPaperW(preset.w);
      setPaperH(preset.h);
    }
  }, [paperSize]);

  function applyToStore() {
    setLayout({
      paperSize: paperSize as any,
      paperWidthMm: Number(paperW),
      paperHeightMm: Number(paperH),
      cardWidthMm: Number(cardW),
      cardHeightMm: Number(cardH),
      cardCount: Number(cardCount),
      horizontalOnly,
      verticalOnly,
      autoRotate,
    });
  }

  function runOptimize() {
    applyToStore();
    const opts = {
      paperWidthMm: Number(paperW),
      paperHeightMm: Number(paperH),
      cardWidthMm: Number(cardW),
      cardHeightMm: Number(cardH),
      cardCount: Number(cardCount) > 0 ? Number(cardCount) : undefined,
      horizontalOnly,
      verticalOnly,
      autoRotate,
      marginMm: 5, // safe default margin; you can expose if needed
    };
    const res = optimizeLayout(opts);
    setPlacements(res.placements);
    setLastResult({ fitted: res.fittedCount });
  }

  return (
    <aside className="w-full max-w-sm p-4 bg-white rounded-md shadow-md">
      <h3 className="font-heading text-lg mb-3">Optimize</h3>

      <label className="block text-sm text-gray-600">Paper</label>
      <div className="flex gap-2 mb-3">
        <select
          value={paperSize}
          onChange={(e) => setPaperSize(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2"
        >
          <option value="A4">A4 (210 × 297 mm)</option>
          <option value="A3">A3 (297 × 420 mm)</option>
          <option value="B4">B4 (≈250 × 353 mm)</option>
          <option value="Custom">Custom</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="text-xs text-gray-500">Paper width (mm)</label>
          <input
            type="number"
            value={paperW}
            onChange={(e) => setPaperW(Number(e.target.value))}
            className="w-full rounded-md border px-2 py-1"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Paper height (mm)</label>
          <input
            type="number"
            value={paperH}
            onChange={(e) => setPaperH(Number(e.target.value))}
            className="w-full rounded-md border px-2 py-1"
          />
        </div>
      </div>

      <label className="block text-sm text-gray-600">Card / Ticket size (mm)</label>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input
          type="number"
          value={cardW}
          onChange={(e) => setCardW(Number(e.target.value))}
          className="rounded-md border px-2 py-1"
          placeholder="width"
        />
        <input
          type="number"
          value={cardH}
          onChange={(e) => setCardH(Number(e.target.value))}
          className="rounded-md border px-2 py-1"
          placeholder="height"
        />
      </div>

      <label className="block text-sm text-gray-600">Number of cards (optional)</label>
      <input
        type="number"
        value={cardCount}
        onChange={(e) => setCardCount(Number(e.target.value))}
        className="w-full rounded-md border px-2 py-1 mb-3"
        placeholder="0 = fill maximum"
      />

      <div className="flex items-center gap-2 mb-2">
        <input
          id="hor"
          type="checkbox"
          checked={horizontalOnly}
          onChange={(e) => {
            setHorizontalOnly(e.target.checked);
            if (e.target.checked) setVerticalOnly(false);
          }}
        />
        <label htmlFor="hor" className="text-sm text-gray-600">Horizontal only</label>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <input
          id="ver"
          type="checkbox"
          checked={verticalOnly}
          onChange={(e) => {
            setVerticalOnly(e.target.checked);
            if (e.target.checked) setHorizontalOnly(false);
          }}
        />
        <label htmlFor="ver" className="text-sm text-gray-600">Vertical only</label>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input id="autor" type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
        <label htmlFor="autor" className="text-sm text-gray-600">Auto-rotate to fit more</label>
      </div>

      <div className="flex gap-2">
        <button
          onClick={runOptimize}
          className="flex-1 px-3 py-2 rounded-md bg-gradient-to-r from-[#00D1B2] to-[#00BFA6] text-white font-semibold"
        >
          Optimize
        </button>
        <button
          onClick={() => {
            applyToStore();
            // keep placements if desired
          }}
          className="px-3 py-2 rounded-md border"
        >
          Save
        </button>
      </div>

      <div className="mt-3 text-sm text-gray-600">
        Fitted: <strong>{lastResult.fitted}</strong>
      </div>
    </aside>
  );
}

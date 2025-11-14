"use client";

import React, { useMemo, useRef, useState, useEffect } from "react";
import { useStore } from "../lib/zustandStore";
import PlacementSlot from "./PlacementSlot";
import FittedBadge from "./FittedBadge";
import BottomAccent from "./BottomAccent";

type Placement = {
  index: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotation?: number;
};

export default function PaperPreview() {
  const front = useStore((s) => s.front);
  const layout = useStore((s) => s.layout);
  const placements = useStore((s) => s.placements) as Placement[];

  const BASE_PX_PER_MM = 3;
  const pxPerMm = BASE_PX_PER_MM;

  const paperPx = useMemo(() => {
    const w = Math.round((layout.paperWidthMm ?? 210) * BASE_PX_PER_MM);
    const h = Math.round((layout.paperHeightMm ?? 297) * BASE_PX_PER_MM);
    return { w, h };
  }, [layout.paperWidthMm, layout.paperHeightMm]);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [scale, setScale] = useState<number>(1);
  const [fitted, setFitted] = useState<boolean>(false);

  useEffect(() => {
    function recompute() {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;

      const style = getComputedStyle(wrapper);
      const padLeft = parseFloat(style.paddingLeft || "0");
      const padRight = parseFloat(style.paddingRight || "0");
      const availableWidth = Math.max(120, wrapper.clientWidth - padLeft - padRight);

      const topChrome = 180;
      const bottomChrome = 48;
      const availableHeight = Math.max(200, window.innerHeight - topChrome - bottomChrome);

      const scaleByWidth = availableWidth / paperPx.w;
      const scaleByHeight = availableHeight / paperPx.h;

      const newScale = Math.min(1, scaleByWidth, scaleByHeight);

      if (Math.abs(newScale - scale) > 0.001) {
        setScale(newScale);
        setFitted(newScale < 1);
      } else {
        setFitted(newScale < 1);
      }
    }

    // initial + listeners
    recompute();
    const rAFHandler = () => window.requestAnimationFrame(recompute);
    window.addEventListener("resize", rAFHandler);
    const ro = new ResizeObserver(recompute);
    if (wrapperRef.current) ro.observe(wrapperRef.current);

    return () => {
      window.removeEventListener("resize", rAFHandler);
      try {
        ro.disconnect();
      } catch (_) {}
    };
  }, [paperPx.w, paperPx.h, scale]);

  return (
    <div ref={wrapperRef} className="w-full flex justify-center px-4" style={{ maxHeight: "calc(100vh - 140px)" }}>
      <div
        className="relative bg-[#eef2f4] p-6 rounded-lg flex items-start justify-center"
        style={{ minWidth: 280, width: "100%", display: "flex", justifyContent: "center" }}
      >
        {fitted && <FittedBadge />}

        <div
          ref={pageRef}
          className="relative bg-white border rounded-sm shadow-xl"
          style={{
            width: `${paperPx.w}px`,
            height: `${paperPx.h}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 200ms ease",
            boxShadow: "0 10px 30px rgba(15,23,42,0.12)",
            border: "1px solid rgba(15,23,42,0.06)",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            {placements.map((p) => (
              <PlacementSlot
                key={p.index}
                p={p}
                front={front}
                pxPerMm={pxPerMm}
              />
            ))}
          </div>
        </div>

        <BottomAccent paperPx={paperPx} scale={scale} />
      </div>
    </div>
  );
}

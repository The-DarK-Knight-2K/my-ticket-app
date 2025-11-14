"use client";

import React from "react";
import type { SideFile } from "../lib/zustandStore";

type Placement = {
  index: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  rotation?: number;
};

export default function PlacementSlot({
  p,
  front,
  pxPerMm,
}: {
  p: Placement;
  front?: SideFile;
  pxPerMm: number;
}) {
  const left = p.xMm * pxPerMm;
  const top = p.yMm * pxPerMm;
  const w = p.widthMm * pxPerMm;
  const h = p.heightMm * pxPerMm;
  const isRot = (p.rotation ?? 0) === 90;

  const slotStyle: React.CSSProperties = {
    position: "absolute",
    left,
    top,
    width: w,
    height: h,
    border: "1px dashed rgba(0,0,0,0.12)",
    boxSizing: "border-box",
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div key={p.index} style={slotStyle} title={`#${p.index + 1}`}>
      {front?.type === "image" ? (
        !isRot ? (
          <img
            src={front.url}
            alt={front.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${h}px`,
              height: `${w}px`,
              transform: "translate(-50%,-50%) rotate(90deg)",
              transformOrigin: "center center",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <img
              src={front.url}
              alt={front.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          </div>
        )
      ) : (
        <div className="flex items-center justify-center h-full w-full text-xs text-gray-500">
          {front ? "Front page (PDF/image)" : "No front uploaded"}
        </div>
      )}

      <div
        style={{
          position: "absolute",
          bottom: 6,
          right: 8,
          fontSize: 10,
          color: "rgba(0,0,0,0.45)",
          pointerEvents: "none",
        }}
      >
        {p.index + 1}
      </div>
    </div>
  );
}

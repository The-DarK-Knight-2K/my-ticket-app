"use client";

import React from "react";
import ExportButton from "./ExportButton";
import PaperPreview from "./PaperPreview";

export default function WorkspaceLayout() {
  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Top controls */}
      <div className="w-full max-w-5xl flex items-center justify-end px-4">
        <ExportButton />
      </div>

      {/* viewport wrapper */}
      <div
        className="w-full flex justify-center px-4"
        style={{ maxHeight: "calc(100vh - 140px)" }}
      >
        <div
          className="relative bg-[#eef2f4] p-6 rounded-lg flex items-start justify-center"
          style={{ minWidth: 280, width: "100%", display: "flex", justifyContent: "center" }}
        >
          <PaperPreview />
        </div>
      </div>
    </div>
  );
}

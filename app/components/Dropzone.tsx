"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { SideFile, useStore } from "../lib/zustandStore";
import { v4 as uuidv4 } from "uuid";

interface DropzoneProps {
  side: "front" | "back";
  isDisabled?: boolean;
}

export default function Dropzone({ side, isDisabled }: DropzoneProps) {
  const file = useStore((s) => (side === "front" ? s.front : s.back));
  const setSide = useStore((s) => s.setSide);
  const removeSide = useStore((s) => s.removeSide);

  const handleDrop = useCallback(
    (acceptedFiles: File[]) => {
      const f = acceptedFiles[0];
      if (!f) return;
      const type = f.type.includes("pdf") ? "pdf" : "image";
      const sideFile: SideFile = {
        id: uuidv4(),
        name: f.name,
        type,
        file: f,
        url: URL.createObjectURL(f),
      };
      setSide(side, sideFile);
    },
    [side, setSide]
  );

  const drop = useDropzone({
    onDrop: handleDrop,
    accept: { "application/pdf": [".pdf"], "image/*": [] },
    multiple: false,
    disabled: isDisabled,
  });

  return (
    <div className="card p-4 flex flex-col items-center">
      <h3 className="font-heading text-lg mb-3">{side === "front" ? "Front side" : "Back side"}</h3>
      <div
        {...drop.getRootProps()}
        className={`w-full border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition ${
          isDisabled ? "bg-gray-50 border-gray-100 pointer-events-none opacity-50" : "border-gray-200 hover:border-[#00BFA6]"
        }`}
      >
        <input {...drop.getInputProps()} />
        {!file && (
          <p className="text-sm text-gray-500">
            Drag & drop {side} image/PDF here, or click to browse
          </p>
        )}

        {file && (
          <div className="flex flex-col items-center gap-3">
            {file.type === "image" ? (
              <img src={file.url} alt={file.name} className="max-h-40 object-contain rounded-sm shadow-sm" />
            ) : (
              <div className="w-full flex items-center justify-center p-3 bg-[#f8faf9] rounded-md text-sm">
                <span className="mr-3">📄</span>
                <div className="text-left">
                  <div className="font-medium">{file.name}</div>
                  <div className="text-xs text-gray-500">PDF file</div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                className="px-3 py-1 rounded-md bg-white border shadow-sm text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSide(side);
                }}
              >
                Remove
              </button>
              <button
                className="px-3 py-1 rounded-md bg-[#00BFA6] text-white text-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  drop.open();
                }}
              >
                Replace
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

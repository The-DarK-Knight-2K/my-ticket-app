// app/components/ExportButton.tsx
"use client";

import { saveAs } from "file-saver";
import { useStore } from "../lib/zustandStore";
import { generatePDFFromPattern } from "../lib/pdfExport";

export default function ExportButton() {
  const front = useStore((s) => s.front);
  const back = useStore((s) => s.back);
  const layout = useStore((s) => s.layout);
  const placements = useStore((s) => s.placements);

  const handleExport = async () => {
    try {
      if (!front) {
        alert("Please upload a front side before exporting.");
        return;
      }
      if (!placements || placements.length === 0) {
        alert("Nothing optimized yet — run Optimize first.");
        return;
      }

      const totalCount = Number(layout.cardCount ?? 0) || placements.length;
      if (!totalCount || totalCount <= 0) {
        alert("Set number of cards/tickets needed in the Optimize panel.");
        return;
      }

      // front/back urls (could be object URLs)
      const frontUrl = front.url;
      const backUrl = back?.url ?? null;

      const pdfBytes = await generatePDFFromPattern(frontUrl, backUrl, placements, {
        paperWidthMm: layout.paperWidthMm ?? 210,
        paperHeightMm: layout.paperHeightMm ?? 297,
        totalCount,
        marginMm: 5,
      });

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      saveAs(blob, "tickets_export.pdf");
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export PDF. Check the console for details.");
    }
  };

  return (
    <button
      onClick={handleExport}
      className="px-4 py-2 rounded-md bg-gradient-to-r from-[#00D1B2] to-[#00BFA6] text-white font-semibold shadow-md hover:scale-105 transform transition-all duration-200"
    >
      Export PDF
    </button>
  );
}

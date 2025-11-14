"use client";

import { useStore } from "../lib/zustandStore";

interface SideSelectorProps {
  onSelect: () => void; // callback to move to next step
}

export default function SideSelector({ onSelect }: SideSelectorProps) {
  const setDoubleSided = useStore((s) => s.setDoubleSided);

  const handleSideChoice = (choice: "single" | "double") => {
    setDoubleSided(choice === "double");
    onSelect(); // automatically move to next step
  };

  return (
    <div className="flex gap-6 justify-center">
      {/* Single-Sided */}
      <button
        onClick={() => handleSideChoice("single")}
        className="px-10 py-4 rounded-md font-heading text-lg font-semibold text-gray-900 shadow-md bg-white hover:bg-gradient-to-r hover:from-[#00D1B2]/30 hover:to-[#00BFA6]/30 hover:shadow-lg transform transition-all duration-300"
      >
        Single-Sided
      </button>

      {/* Double-Sided */}
      <button
        onClick={() => handleSideChoice("double")}
        className="px-10 py-4 rounded-md font-heading text-lg font-semibold text-gray-900 shadow-md bg-white hover:bg-gradient-to-r hover:from-[#00D1B2]/30 hover:to-[#00BFA6]/30 hover:shadow-lg transform transition-all duration-300"
      >
        Double-Sided
      </button>
    </div>
  );
}

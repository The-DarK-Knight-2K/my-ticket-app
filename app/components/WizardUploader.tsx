"use client";

import { useStore } from "../lib/zustandStore";
import { useRouter } from "next/navigation";
import Dropzone from "./Dropzone";

export default function WizardUploader() {
  const isDoubleSided = useStore((s) => s.isDoubleSided);
  const front = useStore((s) => s.front);
  const back = useStore((s) => s.back);
  const router = useRouter();

  const canContinue = !!front && (!isDoubleSided || !!back);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Dropzone side="front" />
        <Dropzone side="back" isDisabled={!isDoubleSided} />
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          {isDoubleSided ? "Front and back required" : "Front required"}
        </div>

        <div className="flex items-center gap-3">

          <button
            disabled={!canContinue}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition ${
              canContinue
                ? "bg-gradient-to-r from-[#00D1B2] to-[#00BFA6] text-white shadow-md"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            onClick={() => router.push("/workspace")}
          >
            Continue to Workspace
          </button>
        </div>
      </div>
    </div>
  );
}

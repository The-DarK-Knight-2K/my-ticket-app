"use client";

import { useState } from "react";
import SideSelector from "../components/SideSelector";
import WizardUploader from "../components/WizardUploader";

export default function WizardPage() {
  const [step, setStep] = useState(1); // 1 = side selection, 2 = upload

  return (
    <main className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#f7f9fa] to-[#eef2f3] px-6 py-12">
      <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl mb-12 text-center text-gray-900">
        Ticket & Card Wizard
      </h1>

      {step === 1 && (
        <div className="flex flex-col items-center gap-8">
          {/* Pass onSelect to automatically go to step 2 */}
          <SideSelector onSelect={() => setStep(2)} />
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center w-full max-w-4xl gap-6">
          <WizardUploader />
          <div className="flex gap-4 mt-6">
            {/* Back button */}
            <button
              className="px-6 py-3 rounded-md bg-gray-200 text-gray-800 font-semibold shadow-sm hover:bg-gray-300 transition-all duration-200"
              onClick={() => setStep(1)}
            >
              ← Back
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

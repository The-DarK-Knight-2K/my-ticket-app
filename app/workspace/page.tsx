// app/workspace/page.tsx
"use client";

import OptimizePanel from "../components/OptimizePanel";
import WorkspaceLayout from "../components/WorkspaceLayout";

export default function WorkspacePage() {
  return (
    <main className="min-h-screen p-8 bg-[#f6f8f9]">
      <div className="flex gap-6">
        <div className="flex-1">
          {/* Toolbar would go here (top) */}
          <WorkspaceLayout />
        </div>

        <div className="w-96">
          <OptimizePanel />
        </div>
      </div>
    </main>
  );
}

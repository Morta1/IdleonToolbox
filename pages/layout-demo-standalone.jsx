"use client";

import { useState } from "react";

export default function LayoutDemoStandalone() {
  const [showDrawer, setShowDrawer] = useState(false);
  const [adSize, setAdSize] = useState("160px");

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-zinc-800 border-b border-zinc-700 flex items-center px-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-zinc-900">
            IT
          </div>
          <span className="font-semibold text-lg">Idleon Toolbox</span>
        </div>
        <nav className="ml-8 flex gap-6">
          <button
            onClick={() => setShowDrawer(false)}
            className={`px-3 py-1 rounded ${!showDrawer ? "bg-zinc-700" : "hover:bg-zinc-700/50"}`}
          >
            Homepage
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className={`px-3 py-1 rounded ${showDrawer ? "bg-zinc-700" : "hover:bg-zinc-700/50"}`}
          >
            Account
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className={`px-3 py-1 rounded ${showDrawer ? "bg-zinc-700" : "hover:bg-zinc-700/50"}`}
          >
            Characters
          </button>
          <button
            onClick={() => setShowDrawer(true)}
            className={`px-3 py-1 rounded ${showDrawer ? "bg-zinc-700" : "hover:bg-zinc-700/50"}`}
          >
            Tools
          </button>
        </nav>

        {/* Controls */}
        <div className="ml-auto flex items-center gap-4">
          <select
            value={adSize}
            onChange={(e) => setAdSize(e.target.value)}
            className="bg-zinc-700 border border-zinc-600 rounded px-2 py-1 text-sm"
          >
            <option value="160px">160px ads (medium screens)</option>
            <option value="300px">300px ads (large screens)</option>
          </select>
        </div>
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex pb-20">
        {/* Left Ad Column - Only visible when drawer is NOT shown */}
        {!showDrawer && (
          <aside
            className="bg-red-900/30 border-r border-red-800/50 flex-shrink-0 flex flex-col items-center justify-center"
            style={{ width: adSize }}
          >
            <div className="sticky top-20 p-2 text-center">
              <div className="border-2 border-dashed border-red-500/50 rounded-lg p-4 bg-red-950/50">
                <span className="text-red-400 text-sm font-medium">LEFT AD</span>
                <div className="text-red-500/70 text-xs mt-1">{adSize} wide</div>
              </div>
            </div>
          </aside>
        )}

        {/* Drawer - Only visible on account/characters/tools pages */}
        {showDrawer && (
          <aside className="w-60 bg-zinc-800 border-r border-zinc-700 flex-shrink-0">
            <div className="sticky top-16 p-4">
              <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
                Navigation Drawer
              </h3>
              <nav className="space-y-1">
                {["General", "Skills", "Bags", "Storage", "Stamps", "Bribes", "Cards", "Gems"].map(
                  (item) => (
                    <div
                      key={item}
                      className="px-3 py-2 rounded hover:bg-zinc-700/50 cursor-pointer text-zinc-300"
                    >
                      {item}
                    </div>
                  )
                )}
              </nav>
            </div>
          </aside>
        )}

        {/* Main Content Area - Always Centered */}
        <main className="flex-1 flex justify-center overflow-auto">
          <div className="w-full max-w-4xl p-6">
            {/* Content Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">
                {showDrawer ? "Account / Characters / Tools Page" : "Homepage"}
              </h1>
              <p className="text-zinc-400">
                {showDrawer
                  ? "The drawer replaces the left ad. Content stays centered with right ad visible."
                  : "Both left and right ads are visible. Content is centered between them."}
              </p>
            </div>

            {/* Demo Content Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <div className="w-full h-24 bg-zinc-700 rounded mb-3 flex items-center justify-center text-zinc-500">
                    Content Block {i}
                  </div>
                  <h3 className="font-medium mb-1">Card Title {i}</h3>
                  <p className="text-sm text-zinc-400">
                    This is example content to demonstrate the layout.
                  </p>
                </div>
              ))}
            </div>

            {/* Layout Info Box */}
            <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-amber-400">Current Layout State</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-zinc-400">Left Side:</span>
                  <span className="ml-2 font-medium">
                    {showDrawer ? "Drawer (240px)" : `Ad (${adSize})`}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Right Side:</span>
                  <span className="ml-2 font-medium">Ad ({adSize})</span>
                </div>
                <div>
                  <span className="text-zinc-400">Content:</span>
                  <span className="ml-2 font-medium">Centered (max 896px)</span>
                </div>
                <div>
                  <span className="text-zinc-400">Page Type:</span>
                  <span className="ml-2 font-medium">{showDrawer ? "With Drawer" : "No Drawer"}</span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Ad Column - Always Visible */}
        <aside
          className="bg-red-900/30 border-l border-red-800/50 flex-shrink-0 flex flex-col items-center"
          style={{ width: adSize }}
        >
          <div className="sticky top-20 p-2 text-center">
            <div className="border-2 border-dashed border-red-500/50 rounded-lg p-4 bg-red-950/50">
              <span className="text-red-400 text-sm font-medium">RIGHT AD</span>
              <div className="text-red-500/70 text-xs mt-1">{adSize} wide</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Ad Banner - Fixed */}
      <footer className="fixed bottom-0 left-0 right-0 h-20 bg-red-900/30 border-t border-red-800/50 flex items-center justify-center z-40">
        <div className="border-2 border-dashed border-red-500/50 rounded-lg px-8 py-3 bg-red-950/50">
          <span className="text-red-400 font-medium">BOTTOM AD BANNER</span>
          <span className="text-red-500/70 text-sm ml-2">(728x90 or similar)</span>
        </div>
      </footer>
    </div>
  );
}

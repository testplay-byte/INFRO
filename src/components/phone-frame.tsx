"use client";

import { useEffect, useState } from "react";

/**
 * PhoneFrame — shows children inside a phone silhouette on desktop,
 * full-screen on mobile. Detects screen size and adapts.
 *
 * Desktop: phone frame with punch-hole camera, less-rounded corners,
 * no surrounding text (text is on the sides only, not top/bottom).
 * Scrollbar is hidden.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-white overflow-hidden">
        <div className="h-full w-full overflow-y-auto no-scrollbar">{children}</div>
      </div>
    );
  }

  // Desktop — phone silhouette with side text
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-200 p-8">
      <div className="flex items-center gap-12">
        {/* Left side text */}
        <div className="text-right max-w-[200px] hidden lg:block">
          <h2 className="text-xl font-bold text-neutral-800">Infro</h2>
          <p className="text-sm text-neutral-500 mt-2 leading-relaxed">
            Interactive UI prototype for the Android app.
          </p>
          <p className="text-xs text-neutral-400 mt-4">
            Click through the screens to evaluate the design.
          </p>
        </div>

        {/* Phone frame */}
        <div className="relative">
          <div className="w-[380px] h-[800px] bg-neutral-900 rounded-[40px] p-[10px] shadow-2xl">
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[32px] overflow-hidden relative">
              {/* Status bar */}
              <div className="absolute top-0 left-0 right-0 h-9 z-50 flex items-center justify-between px-7 pointer-events-none">
                <span className="text-[12px] font-semibold text-neutral-900">9:41</span>
                <div className="flex items-center gap-1.5">
                  <SignalIcon />
                  <WifiIcon />
                  <BatteryIcon />
                </div>
              </div>
              {/* Punch-hole camera (centered) */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[10px] h-[10px] bg-neutral-900 rounded-full z-50 pointer-events-none" />

              {/* Content area — no scrollbar */}
              <div className="h-full w-full overflow-y-auto no-scrollbar pt-9">
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Right side text */}
        <div className="max-w-[200px] hidden lg:block">
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Tip</p>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                Tap cards and buttons to navigate through the app flow.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-700 uppercase tracking-wider">Status</p>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                Prototype — not connected to real analysis. Mock data is used.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="16" height="11" viewBox="0 0 18 12" fill="none">
      <rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor" className="text-neutral-900" />
      <rect x="5" y="5" width="3" height="7" rx="0.5" fill="currentColor" className="text-neutral-900" />
      <rect x="10" y="2" width="3" height="10" rx="0.5" fill="currentColor" className="text-neutral-900" />
      <rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor" className="text-neutral-900 opacity-30" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="15" height="11" viewBox="0 0 16 12" fill="none">
      <path d="M8 3C5 3 2.5 4 0.5 5.8L8 12L15.5 5.8C13.5 4 11 3 8 3Z" fill="currentColor" className="text-neutral-900" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-[22px] h-[11px] rounded-[2.5px] border border-neutral-900 relative p-[1.5px]">
        <div className="h-full w-[80%] bg-neutral-900 rounded-[1px]" />
      </div>
      <div className="w-[1.5px] h-[4px] bg-neutral-900 rounded-r-sm" />
    </div>
  );
}

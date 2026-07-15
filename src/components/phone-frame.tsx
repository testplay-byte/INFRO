"use client";

import { useEffect, useState } from "react";

/**
 * PhoneFrame — shows children inside a phone silhouette on desktop,
 * full-screen on mobile. Detects screen size and adapts.
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
    // Full screen on mobile — no frame
    return (
      <div className="fixed inset-0 bg-white overflow-hidden">
        <div className="h-full w-full overflow-y-auto">{children}</div>
      </div>
    );
  }

  // Desktop — phone silhouette
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-8">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Infro Android App</h1>
          <p className="text-sm text-neutral-500 mt-1">Interactive UI prototype — click through the screens</p>
        </div>

        {/* Phone frame */}
        <div className="relative">
          {/* Outer frame */}
          <div className="w-[390px] h-[844px] bg-neutral-900 rounded-[55px] p-[12px] shadow-2xl">
            {/* Screen */}
            <div className="w-full h-full bg-white rounded-[44px] overflow-hidden relative">
              {/* Status bar */}
              <div className="absolute top-0 left-0 right-0 h-11 z-50 flex items-center justify-between px-8 pointer-events-none">
                <span className="text-[13px] font-semibold text-neutral-900">9:41</span>
                <div className="flex items-center gap-1.5">
                  <SignalIcon />
                  <WifiIcon />
                  <BatteryIcon />
                </div>
              </div>
              {/* Dynamic island / notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-[110px] h-[33px] bg-neutral-900 rounded-full z-50 pointer-events-none" />

              {/* Content area */}
              <div className="h-full w-full overflow-y-auto pt-11">
                {children}
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-400 max-w-xs text-center">
          This is a design prototype showing how the Android app will look and function.
          Once the UI is confirmed, the native APK will be built to match exactly.
        </p>
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
      <rect x="0" y="8" width="3" height="4" rx="0.5" fill="currentColor" className="text-neutral-900" />
      <rect x="5" y="5" width="3" height="7" rx="0.5" fill="currentColor" className="text-neutral-900" />
      <rect x="10" y="2" width="3" height="10" rx="0.5" fill="currentColor" className="text-neutral-900" />
      <rect x="15" y="0" width="3" height="12" rx="0.5" fill="currentColor" className="text-neutral-900 opacity-30" />
    </svg>
  );
}

function WifiIcon() {
  return (
    <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
      <path d="M8 3C5 3 2.5 4 0.5 5.8L8 12L15.5 5.8C13.5 4 11 3 8 3Z" fill="currentColor" className="text-neutral-900" />
    </svg>
  );
}

function BatteryIcon() {
  return (
    <div className="flex items-center gap-1">
      <div className="w-[24px] h-[12px] rounded-[3px] border border-neutral-900 relative p-[1.5px]">
        <div className="h-full w-[80%] bg-neutral-900 rounded-[1px]" />
      </div>
      <div className="w-[1.5px] h-[4px] bg-neutral-900 rounded-r-sm" />
    </div>
  );
}

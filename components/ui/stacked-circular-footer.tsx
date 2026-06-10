import * as React from "react"
import { ShieldCheck, RefreshCw } from "lucide-react"

interface StackedCircularFooterProps {
  onOpenAbout?: () => void;
  onForceReload?: () => void;
  onScrollToDocs?: () => void;
}

function StackedCircularFooter({
  onOpenAbout,
  onForceReload,
  onScrollToDocs
}: StackedCircularFooterProps) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="bg-background py-14 border-t border-neutral-900 mt-12 bg-black select-none relative z-10" id="app-footer">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col items-center">
          {/* Authentic Styled ChatReader Logo skew badge with interactive click to scroll to top */}
          <button 
            onClick={scrollToTop}
            className="mb-6 flex items-center justify-center w-12 h-12 bg-[#bfff00] text-black rounded-none shadow-lg -skew-x-6 hover:scale-105 active:scale-95 transition-transform cursor-pointer group"
            title="Back to Top"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transform skew-x-6 text-black">
              <path d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12H8v-2h8v2zm0-4H8V8h8v2z" />
            </svg>
          </button>

          {/* Fully customized, highly integrated links */}
          <nav className="mb-6 flex flex-wrap justify-center gap-6 text-xs sm:text-sm font-semibold uppercase tracking-wider font-mono">
            {onForceReload && (
              <button 
                onClick={onForceReload} 
                className="hover:text-rose-400 text-neutral-200 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 uppercase tracking-widest text-[10px]"
                title="Wipe state & reboot context"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-500" /> Purge Cache
              </button>
            )}
          </nav>

          {/* Tech and privacy security metadata highlights */}
          <div className="mb-6 flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-neutral-500 font-mono text-[10px] uppercase tracking-widest text-center">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/20 px-2.5 py-1 border border-emerald-950">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Client Isolated
            </span>
            <span className="hidden sm:inline">•</span>
            <span>No Remote Storage</span>
            <span className="hidden sm:inline">•</span>
            <span>Local Parsing Engine</span>
          </div>

          <div className="text-center space-y-2">
            <p className="text-xs text-neutral-400 font-mono uppercase tracking-wider">
              © 2026 CHATREADER PRO. LOCAL CONVERSATION DIAGNOSTICS SUITE.
            </p>
            <p className="text-[9px] text-neutral-600 font-mono uppercase tracking-widest">
              SECURE BROWSING ISOLATION PROTOCOL ACTIVE.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export { StackedCircularFooter }

"use client";
import React, { useState, useEffect } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import DotPattern from "@/components/ui/dot-pattern-1";
import { StackedCircularFooter } from "@/components/ui/stacked-circular-footer";
import { 
  MessageSquare, 
  BarChart3, 
  Brain, 
  Activity, 
  Sparkles, 
  Gauge, 
  Zap, 
  Flame, 
  Users, 
  TrendingUp,
  Cpu,
  Clock,
  Unlock,
  ShieldCheck
} from "lucide-react";

type DemoStep = "parse" | "analyze" | "summarize";

export function HeroScrollDemo() {
  const [activeStep, setActiveStep] = useState<DemoStep>("analyze");
  const [autoRotate, setAutoRotate] = useState(true);

  // Auto-play interval for dynamic presentation
  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => {
        if (prev === "parse") return "analyze";
        if (prev === "analyze") return "summarize";
        return "parse";
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [autoRotate]);

  return (
    <div className="flex flex-col overflow-hidden pb-12 pt-12 bg-black border-t border-neutral-900" id="chatreader-hero-visualizer">
      <ContainerScroll
        titleComponent={
          <div className="space-y-4 px-4 select-none">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-black text-[#bfff00] bg-[#bfff00]/10 border border-[#bfff00]/30 px-3.5 py-1.5 uppercase tracking-widest rounded-none">
              <span className="w-1.5 h-1.5 bg-[#bfff00] rounded-none animate-ping" />
              INTEGRATED SECURE SIMULATION PORTAL
            </span>
            
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase font-display leading-tight">
              Transforms Raw Logs <br className="hidden sm:inline" />
              <span className="text-4xl md:text-[5.5rem] font-extrabold mt-1 leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#bfff00] via-amber-300 to-[#bfff00]">
                Into Smart Insights
              </span>
            </h1>
            
            <p className="text-neutral-400 font-sans text-xs max-w-xl mx-auto leading-relaxed">
              Drop any exported chat file. Watch ChatReader safely parse timezone matrices, summarize key initiatives, rank dialogue leaders, and organize priorities—all in-browser.
            </p>

            {/* Simulated Interactive Switchers */}
            <div className="flex flex-wrap justify-center items-center gap-2 pt-2" id="demo-step-controls">
              {(["parse", "analyze", "summarize"] as DemoStep[]).map((step) => {
                const label = 
                  step === "parse" ? "1. Recursive Parser" :
                  step === "analyze" ? "2. Dashboard metrics" :
                  "3. AI Summarizer";
                const Icon = 
                  step === "parse" ? MessageSquare :
                  step === "analyze" ? BarChart3 :
                  Brain;
                const isSelected = activeStep === step;

                return (
                  <button
                    key={step}
                    onClick={() => {
                      setActiveStep(step);
                      setAutoRotate(false); // Stop auto-rotation when user manually interacts
                    }}
                    className={`px-3 py-2 text-[10px] font-black font-mono uppercase tracking-wider border transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#111] border-[#bfff00] text-white shadow-[0_0_15px_rgba(191,255,0,0.15)]"
                        : "bg-black border-neutral-850 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#bfff00]" : "text-neutral-600"}`} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        }
      >
        {/* Core Simulated App viewport */}
        <div className="w-full h-full bg-[#0a0a0c] text-white flex flex-col p-3 sm:p-5 font-sans justify-between relative overflow-hidden select-none">
          {/* Simulated App Header */}
          <div className="flex items-center justify-between border-b border-neutral-900 pb-3 mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-[#bfff00] text-black font-black text-[12px] flex items-center justify-center rounded-none font-mono tracking-widest shrink-0">
                CR
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black font-mono tracking-wider text-neutral-100 uppercase leading-none">CHATREADER</span>
                  <span className="px-1 py-0.2 bg-emerald-500/10 text-emerald-400 text-[7px] font-bold font-mono uppercase tracking-wider rounded border border-emerald-500/25">SECURE</span>
                </div>
                <span className="text-[8px] font-mono text-neutral-500 block uppercase leading-none mt-0.5">LOCAL DEEP CORE INTERPOLATION ACTIVE</span>
              </div>
            </div>

            {/* Step Banner */}
            <div className="flex items-center gap-2 text-right">
              <span className="hidden sm:inline text-[8px] font-mono text-neutral-500 uppercase tracking-widest">ACTIVE SIMULATION LAYER:</span>
              <span className="font-mono text-[9px] font-black bg-neutral-950 border border-neutral-800 px-2 py-0.5 text-[#bfff00] uppercase tracking-wide">
                {activeStep === "parse" && "📄 RAW STRING TO STRUCTURED SCHEMAS"}
                {activeStep === "analyze" && "📊 METRICS & PARTICIPANT DECK"}
                {activeStep === "summarize" && "🧠 OFF-GRID COGNITIVE INTELLIGENCE"}
              </span>
            </div>
          </div>

          {/* MAIN SIMULATOR SCREEN CONTENT (Conditional rendering) */}
          <div className="flex-1 overflow-hidden min-h-0 relative flex flex-col" id="simulator-canvas">
            {/* Step 1: RAW STRING PARSER */}
            {activeStep === "parse" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full items-stretch" id="step-parse-grid">
                {/* Unparsed Code Block */}
                <div className="bg-black border border-neutral-900 p-4 flex flex-col justify-between font-mono text-[10px] leading-relaxed text-neutral-400 h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-950 pb-2">
                      <span className="text-[8px] font-black tracking-widest text-neutral-500 uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3 text-neutral-600" /> RAW EXPORTED BUFFER SOURCE
                      </span>
                      <span className="text-neutral-600 text-[8px]">UNSTRUCTURED TEXT .TXT</span>
                    </div>
                    <div className="space-y-2 text-neutral-400">
                      <p className="border-l-2 border-neutral-800 pl-2 py-0.5">
                        <span className="text-neutral-600">[12/06/2026, 09:12:05]</span> <strong className="text-neutral-200">Sarah Jenkins:</strong> Did we publish the build to sandbox? 🚀
                      </p>
                      <p className="border-l-2 border-neutral-800 pl-2 py-0.5">
                        <span className="text-neutral-600">[12/06/2026, 09:12:44]</span> <strong className="text-neutral-200">Alex Rivera:</strong> Ready on port 3000 but the OAuth callback requires SSL certification! Can somebody patch?
                      </p>
                      <p className="border-l-2 border-[#bfff00]/30 pl-2 py-0.5 bg-[#bfff00]/5 text-[#bfff00]">
                        <span className="text-[#bfff00]/50">[12/06/2026, 09:14:12]</span> <strong className="text-white">Sarah Jenkins:</strong> Standard dev server runs fine local! Let me coordinate with engineering. 👍
                      </p>
                      <p className="border-l-2 border-neutral-800 pl-2 py-0.5">
                        <span className="text-neutral-600">[12/06/2026, 09:15:00]</span> <strong className="text-neutral-200">System:</strong> (Sarah Jenkins changed the subject to "Ship Deck v4")
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-950 text-neutral-600 text-[8.5px] uppercase tracking-wide flex items-center justify-between">
                    <span>⚡ recursive parsing chunk size: 4096 bytes</span>
                    <span>No errors</span>
                  </div>
                </div>

                {/* Structured Beautiful Bubble output */}
                <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-none flex flex-col justify-between h-full relative">
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[7px] font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                    <ShieldCheck className="w-2.5 h-2.5" /> RECURSION VERIFIED
                  </div>
                  
                  <div className="space-y-3.5">
                    <span className="block font-mono text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                      TRANSFORMED STRUCTURED REPLICA:
                    </span>
                    
                    {/* Simulated bubble items */}
                    <div className="space-y-3">
                      {/* Msg 1 */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-6 h-6 rounded-none bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center text-[10px] font-bold font-mono">
                          SJ
                        </div>
                        <div className="bg-neutral-900 border border-neutral-800 p-2 text-xs flex-1 max-w-[85%]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-amber-400 font-display">Sarah Jenkins</span>
                            <span className="text-[8px] text-neutral-505 font-mono">09:12 AM</span>
                          </div>
                          <p className="text-neutral-200 text-[11px] leading-relaxed">
                            Did we publish the build to sandbox? 🚀
                          </p>
                        </div>
                      </div>

                      {/* Msg 2 */}
                      <div className="flex items-start gap-2.5 justify-end">
                        <div className="bg-neutral-900/40 border border-[#bfff00]/25 p-2 text-xs flex-1 max-w-[85%] text-right bg-[#bfff00]/[0.02]">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[8px] text-neutral-505 font-mono">09:12 AM</span>
                            <span className="text-[10px] font-bold text-[#bfff00] font-display">Alex Rivera</span>
                          </div>
                          <p className="text-neutral-200 text-[11px] leading-relaxed text-left">
                            Ready on port 3000 but the OAuth callback requires SSL certification! Can somebody patch?
                          </p>
                        </div>
                        <div className="w-6 h-6 rounded-none bg-[#bfff00]/10 text-[#bfff00] border border-[#bfff00]/30 flex items-center justify-center text-[10px] font-bold font-mono">
                          AR
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[8px] font-mono text-neutral-500 uppercase">
                    <span>Parsed 4 dialog vectors</span>
                    <span className="text-[#bfff00] font-bold">100% Client-side privacy</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: DASHBOARD PREVIEW */}
            {activeStep === "analyze" && (
              <div className="space-y-3.5 h-full flex flex-col justify-between" id="step-analyze-grid">
                {/* Grid summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  <div className="bg-[#101012] border border-neutral-850 p-2.5 rounded-none flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-450 uppercase tracking-wider">TOTAL MESSAGES</span>
                      <span className="text-md sm:text-lg font-black font-mono text-white mt-0.5">2,845</span>
                    </div>
                    <Gauge className="w-5 h-5 text-[#bfff00]" />
                  </div>

                  <div className="bg-[#101012] border border-neutral-850 p-2.5 rounded-none flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-450 uppercase tracking-wider">DIALOG WORDS</span>
                      <span className="text-md sm:text-lg font-black font-mono text-white mt-0.5">38,122</span>
                    </div>
                    <Zap className="w-5 h-5 text-amber-400" />
                  </div>

                  <div className="bg-[#101012] border border-neutral-850 p-2.5 rounded-none flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-450 uppercase tracking-wider">EMOJI FLAMES</span>
                      <span className="text-md sm:text-lg font-black font-mono text-white mt-0.5">1,104</span>
                    </div>
                    <Flame className="w-5 h-5 text-pink-500" />
                  </div>

                  <div className="bg-[#101012] border border-neutral-850 p-2.5 rounded-none flex items-center justify-between">
                    <div>
                      <span className="block text-[8px] font-mono text-neutral-450 uppercase tracking-wider">PARTICIPANTS</span>
                      <span className="text-md sm:text-lg font-black font-mono text-white mt-0.5">3 MEMB</span>
                    </div>
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                </div>

                {/* Simulated Leaderboard and mini timeline trend */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 min-h-0 items-stretch">
                  <div className="bg-[#0f0f11] border border-neutral-850 p-3 rounded-none col-span-2 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono font-black uppercase text-neutral-400 tracking-wider">DIALOGUE PARTICIPANTS LEADERBOARD</span>
                        <span className="text-[8px] font-mono text-[#bfff00]">ACTIVE RECORD MATRIX</span>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Speaker 1 */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono lowercase">
                            <span className="text-white font-bold">@sarah_jenkins</span>
                            <span className="text-neutral-400">1,424 messages (50%)</span>
                          </div>
                          <div className="w-full bg-neutral-900 border border-neutral-850 h-2.5 rounded-none overflow-hidden relative">
                            <div className="bg-[#bfff00] h-full" style={{ width: "50%" }} />
                          </div>
                        </div>

                        {/* Speaker 2 */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono lowercase">
                            <span className="text-white font-bold">@alex_rivera</span>
                            <span className="text-neutral-400">1,110 messages (39%)</span>
                          </div>
                          <div className="w-full bg-neutral-900 border border-neutral-850 h-2.5 rounded-none overflow-hidden relative">
                            <div className="bg-amber-400 h-full" style={{ width: "39%" }} />
                          </div>
                        </div>

                        {/* Speaker 3 */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-mono lowercase">
                            <span className="text-white font-bold">@kate_developer</span>
                            <span className="text-neutral-400">311 messages (11%)</span>
                          </div>
                          <div className="w-full bg-neutral-900 border border-neutral-850 h-2.5 rounded-none overflow-hidden relative">
                            <div className="bg-pink-500 h-full" style={{ width: "11%" }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-[8px] font-mono text-neutral-500 flex items-center justify-between uppercase pt-1 border-t border-neutral-900 mt-2">
                      <span>Timeline Period: Sep 12 - Oct 29</span>
                      <span>Total Words: 38,122</span>
                    </div>
                  </div>

                  {/* Micro Timeline Trend info */}
                  <div className="bg-[#0f0f11] border border-neutral-850 p-3 rounded-none flex flex-col justify-between">
                    <div>
                      <span className="block text-[9px] font-mono font-black uppercase text-neutral-400 tracking-wider mb-2">DIALOGUE VELOCITY</span>
                      
                      <div className="flex items-end justify-between h-16 pt-2 pb-1 border-b border-neutral-900">
                        <div className="w-4 bg-[#bfff00]/30 hover:bg-[#bfff00] transition-colors h-[40%]" title="Mon: 40%" />
                        <div className="w-4 bg-[#bfff00]/40 hover:bg-[#bfff00] transition-colors h-[55%]" title="Tue: 55%" />
                        <div className="w-4 bg-amber-400/30 hover:bg-amber-400 transition-colors h-[25%]" title="Wed: 25%" />
                        <div className="w-4 bg-[#bfff00]/80 hover:bg-[#bfff00] transition-colors h-[90%]" title="Thu: 90%" />
                        <div className="w-4 bg-pink-500/50 hover:bg-pink-500 transition-colors h-[65%]" title="Fri: 65%" />
                        <div className="w-4 bg-neutral-900 border border-neutral-800 h-[10%]" title="Sat: 10%" />
                        <div className="w-4 bg-neutral-900 border border-neutral-800 h-[5%]" title="Sun: 5%" />
                      </div>
                    </div>

                    <div className="space-y-1 block mt-2">
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-neutral-550">PEAK INITIATION HOUR</span>
                        <span className="text-white font-bold">14:00 (O&apos;CLOCK)</span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-neutral-550">MOST USED EMOJI</span>
                        <span className="text-[#bfff00] font-black">🚀 (74 TIMES)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: AI SUMMARIZER SUMMARY */}
            {activeStep === "summarize" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 h-full items-stretch" id="step-summarize-grid">
                {/* Highlight summary card */}
                <div className="md:col-span-2 bg-[#0d0d0f] border border-neutral-850 p-4 rounded-none flex flex-col justify-between h-full">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                      <span className="text-[9px] font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#bfff00]" /> COGNITIVE SITUATION BRIEFING
                      </span>
                      <span className="text-[8px] font-mono text-emerald-400 lowercase">@gemini-3.5-flash</span>
                    </div>

                    <div className="space-y-2.5 text-neutral-300">
                      <p className="text-[11px] leading-relaxed font-sans">
                        The group trace covers key collaborative development targets surrounding a sandbox software deployment on port 3000. Peak engagement centers around security parameters, particularly SSL setup in development.
                      </p>
                      
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-start gap-2 text-[10.5px] font-mono text-neutral-200">
                          <span className="text-[#bfff00] font-black mt-0.5">✦</span>
                          <p>
                            <span className="text-white font-bold">Primary blocker:</span> Alex identified missing SSL credentials for development environments.
                          </p>
                        </div>
                        <div className="flex items-start gap-2 text-[10.5px] font-mono text-neutral-200">
                          <span className="text-[#bfff00] font-black mt-0.5">✦</span>
                          <p>
                            <span className="text-white font-bold">Action scheduled:</span> Sarah will align core configuration scripts with local systems.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 flex items-center justify-between text-[8px] font-mono text-neutral-500 uppercase mt-4">
                    <span>Generated in 4.2 seconds</span>
                    <span className="text-amber-400 font-bold">Zero cloud tracking</span>
                  </div>
                </div>

                {/* Priority action items list */}
                <div className="bg-black border border-neutral-850 p-4 rounded-none flex flex-col justify-between h-full relative overflow-hidden">
                  <div className="space-y-3">
                    <span className="block font-mono text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                      CRITICAL ACTION PROTOCOLS:
                    </span>

                    <div className="space-y-2">
                      {/* Item 1 */}
                      <div className="bg-neutral-950 border border-neutral-900 p-2 text-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono font-black bg-[#bfff00]/10 text-[#bfff00] px-1 py-0.2 rounded uppercase tracking-wider">HIGH priority</span>
                          <span className="text-neutral-500 text-[8px] font-mono">TASK #01</span>
                        </div>
                        <p className="text-neutral-200 text-[10.5px] font-mono font-bold leading-normal">
                          Resolve OAuth TLS SSL validation exceptions.
                        </p>
                        <span className="text-[8.5px] font-mono text-neutral-500 lowercase mt-1 block">ASSIGNED TO @ALEX_RIVERA</span>
                      </div>

                      {/* Item 2 */}
                      <div className="bg-neutral-950 border border-neutral-900 p-2 text-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-mono font-black bg-neutral-900 text-neutral-400 px-1 py-0.2 rounded uppercase tracking-wider">MEDIUM priority</span>
                          <span className="text-neutral-500 text-[8px] font-mono">TASK #02</span>
                        </div>
                        <p className="text-neutral-300 text-[10.5px] font-sans leading-normal">
                          Execute standard port sandbox diagnostics verify integrity.
                        </p>
                        <span className="text-[8.5px] font-mono text-neutral-500 lowercase mt-1 block">ASSIGNED TO @SARAH_JENKINS</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-900 text-[8px] font-mono text-neutral-600 uppercase">
                    <span>Double check with raw dialog logs</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Simulated App Footer */}
          <div className="border-t border-neutral-900 pt-3 mt-3 flex flex-col sm:flex-row items-center justify-between text-[8px] font-mono text-neutral-500 tracking-wider shrink-0 gap-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3 text-[#bfff00]" /> CR MEMORY SCRATCHPAD BUFFER: LOADED OK
              </span>
              <span className="hidden md:inline">SYSTEM VERSION PRO S2.4</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 bg-neutral-900 border border-neutral-800 text-neutral-400 lowercase">secure_client_sandbox_v2</span>
              <span className="text-neutral-400 font-bold uppercase tracking-widest">ACTIVE PORTAL</span>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}

export function Quote() {
  return (
    <>
      <div className="mx-auto mb-10 max-w-7xl px-6 md:mb-20 xl:px-0">
        <div className="relative flex flex-col items-center border border-red-500/30 bg-neutral-950/20 py-8 rounded-xl overflow-hidden shadow-2xl">
          <DotPattern width={8} height={8} className="opacity-20 fill-neutral-500" />

          <div className="absolute -left-1.5 -top-1.5 h-3 w-3 bg-red-500 text-white" />
          <div className="absolute -bottom-1.5 -left-1.5 h-3 w-3 bg-red-500 text-white" />
          <div className="absolute -right-1.5 -top-1.5 h-3 w-3 bg-red-500 text-white" />
          <div className="absolute -bottom-1.5 -right-1.5 h-3 w-3 bg-red-500 text-white" />

          <div className="relative z-20 mx-auto max-w-7xl px-6 py-6 md:p-10 xl:py-16 text-center">
            <p className="md:text-lg text-xs text-red-500 uppercase font-mono tracking-widest mb-4">
              I believe
            </p>
            <div className="text-2xl tracking-tighter md:text-5xl lg:text-6xl xl:text-7xl space-y-2 uppercase font-black italic text-white leading-tight font-display">
              <div className="flex flex-wrap justify-center gap-1 md:gap-3">
                <span className="font-semibold text-white">"Design should be</span>
                <span className="font-thin text-neutral-400">easy to</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1 md:gap-3">
                <span className="font-thin text-neutral-400">understand</span>
                <span className="font-semibold text-white">because</span>
                <span className="font-thin text-neutral-400">simple</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1 md:gap-3">
                <span className="font-thin text-neutral-400">ideas</span>
                <span className="font-semibold text-white">are quicker to</span>
              </div>
              <div className="text-red-500 font-extrabold">grasp..."</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function StackedCircularFooterDemo() {
  return (
    <div className="block">
      <StackedCircularFooter />
    </div>
  );
}

import { HeroSection } from "@/components/ui/hero-section-dark"

export function HeroSectionDemo() {
  return (
    <HeroSection
      title="Welcome to Our Platform"
      subtitle={{
        regular: "Transform your ideas into ",
        gradient: "beautiful digital experiences",
      }}
      description="Transform your ideas into reality with our comprehensive suite of development tools and resources."
      ctaText="Browse Insights"
      ctaHref="#analytics"
      bottomImage={{
        light: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
        dark: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80",
      }}
      gridOptions={{
        angle: 65,
        opacity: 0.4,
        cellSize: 50,
        lightLineColor: "#4a4a4a",
        darkLineColor: "#2a2a2a",
      }}
    />
  )
}


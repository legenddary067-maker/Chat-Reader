import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  FileText, 
  ShieldCheck, 
  RefreshCw, 
  Smartphone, 
  ChevronRight, 
  AlertTriangle,
  FileCode,
  Lock,
  MessageSquare,
  Instagram,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForceReload: () => void;
}

type TabType = 'overview' | 'whatsapp' | 'instagram' | 'privacy' | 'troubleshoot';

export default function AboutModal({ isOpen, onClose, onForceReload }: AboutModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="about-modal-wrapper">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md cursor-pointer"
          id="about-backdrop"
        />

        {/* Modal body container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative bg-[#0d0d0d] border border-neutral-850 w-full max-w-3xl h-[85vh] md:h-[75vh] flex flex-col shadow-2xl rounded-none overflow-hidden"
          id="about-container"
        >
          {/* Neon Top line accent */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-sky-500 via-[#bfff00] to-amber-400" />

          {/* Header Title bar */}
          <div className="flex items-center justify-between p-5 border-b border-neutral-900 bg-black" id="about-header">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-[#bfff00]/15 border border-[#bfff00]/20 text-[#bfff00] shrink-0">
                <Compass className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-sm font-black italic text-white tracking-widest uppercase font-display">
                  DIAGNOSTICS & SYSTEM HANDBOOK ///
                </h3>
                <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest font-bold">ABOUT, Manual Specifications & Recovery Procedures</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1.5 border border-neutral-900 hover:border-neutral-800 text-neutral-400 hover:text-white transition-all cursor-pointer"
              aria-label="Close handbook"
              id="about-close-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick tab navigators */}
          <div className="flex flex-wrap border-b border-neutral-900 bg-black/40 px-3 py-1.5 gap-1.5" id="about-tab-navs">
            {(['overview', 'whatsapp', 'instagram', 'privacy', 'troubleshoot'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-[#bfff00] text-black font-extrabold'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
                id={`about-tab-${tab}`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'whatsapp' && 'WhatsApp Export'}
                {tab === 'instagram' && 'Instagram JSON'}
                {tab === 'privacy' && 'Security & Trust'}
                {tab === 'troubleshoot' && 'Troubleshoot / Recovery'}
              </button>
            ))}
          </div>

          {/* Body contents */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar text-left text-xs text-neutral-300 font-sans" id="about-modal-body">
            
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-fadeIn" id="about-view-overview">
                <div className="space-y-2">
                  <h4 className="text-white font-extrabold text-sm font-display tracking-widest uppercase">
                    🌌 CHATREADER CAPABILITIES IN DEPTH
                  </h4>
                  <p className="text-neutral-400 leading-relaxed">
                    ChatReader is a custom, fully client-side conversational analysis suite engineered for modern developers. It safely processes history log formats, extracts dynamic statistics, indexes voice notes/media archives, renders high-fidelity screenshot replicas, and compiles multi-page interactive Chatbooks inside your container memory safely.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-black border border-neutral-900 space-y-2 rounded-none">
                    <div className="flex items-center gap-2 text-[#bfff00] font-mono font-bold uppercase text-[11px] tracking-wider">
                      <FileCode className="w-4 h-4 shrink-0" />
                      <span>Regular Expression Engine</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                      Recognizes varying operating system timeline logs, custom multi-national 12/24 hour timestamps, emojis, name patterns, status changes, and image/source attachments recursively.
                    </p>
                  </div>

                  <div className="p-4 bg-black border border-neutral-900 space-y-2 rounded-none">
                    <div className="flex items-center gap-2 text-sky-400 font-mono font-bold uppercase text-[11px] tracking-wider">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Zero Remote Intercept</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                      Strict architecture ensures your private chat files never reach an external server. Everything, including complex image rendering, occurs inside your tab thread memory.
                    </p>
                  </div>
                </div>

                <div className="border border-neutral-850 bg-neutral-950 p-4 space-y-3">
                  <h5 className="font-bold text-white uppercase tracking-widest text-[10px] font-mono text-[#bfff00]">
                    🚀 HOW TO START RAPIDLY ///
                  </h5>
                  <div className="space-y-2 text-[11px]">
                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-neutral-400 flex items-center justify-center font-bold text-[10px] border border-neutral-850 shrink-0">1</span>
                      <p className="text-neutral-300">
                        Export your conversational log as a <strong className="text-white">ZIP package with attachments/media</strong> from WhatsApp or direct messenger.
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-neutral-400 flex items-center justify-center font-bold text-[10px] border border-neutral-850 shrink-0">2</span>
                      <p className="text-neutral-300">
                        Drag the archive in, or press the device browser selector button to mount the raw directory files.
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-neutral-900 text-neutral-400 flex items-center justify-center font-bold text-[10px] border border-neutral-850 shrink-0">3</span>
                      <p className="text-neutral-300">
                        Watch metrics, heatmaps, lexical indices, image attachments, and customizable chat designs update in the layout viewport.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'whatsapp' && (
              <div className="space-y-6 animate-fadeIn" id="about-view-whatsapp">
                <div className="space-y-2">
                  <h4 className="text-emerald-400 font-extrabold text-sm font-display tracking-widest uppercase flex items-center gap-2">
                    <MessageSquare className="w-4.5 h-4.5" /> WHATSAPP EXPORT WALKTHROUGH
                  </h4>
                  <p className="text-neutral-400">
                    Follow these step-by-step procedures based on your mobile device OS to guarantee clean structural syntax for ChatReader diagnostics.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-neutral-950 border border-neutral-900 space-y-3">
                    <p className="font-bold text-white font-mono uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>FOR APPLE IOS DEVICES</span>
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[11px] text-neutral-400">
                      <li>Launch WhatsApp on your iPhone and open the private dialogue or group conversation.</li>
                      <li>Tap the profile header card (partner name or group title) at the very top.</li>
                      <li>Scroll down the menu screen and select <strong className="text-white">"Export Chat"</strong>.</li>
                      <li>A dialog will query: <strong className="text-white">Attach Media?</strong> Select <strong className="text-emerald-400">"Attach Media"</strong> to capture photos and audio or <strong className="text-neutral-300">"Without Media"</strong>.</li>
                      <li>Select "Save to Files" to download the compiled ZIP directly onto your phone dashboard, then upload it into ChatReader.</li>
                    </ul>
                  </div>

                  <div className="p-4 bg-neutral-950 border border-neutral-900 space-y-3">
                    <p className="font-bold text-white font-mono uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#bfff00]" />
                      <span>FOR ANDROID DEVICES</span>
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[11px] text-neutral-400">
                      <li>Launch WhatsApp on your handset and tap inside the conversation viewport.</li>
                      <li>Tap the top-right <strong className="text-white">Triple-Dot (︙) Options Menu</strong>.</li>
                      <li>Navigate to <strong className="text-white">More ➜ Export Chat</strong>.</li>
                      <li>Choose <strong className="text-[#bfff00]">Without Media / Include Media</strong> based on memory budgets.</li>
                      <li>Transfer the downloaded `.txt` document or ZIP files to your workspace for simple browser drop-in action.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'instagram' && (
              <div className="space-y-6 animate-fadeIn" id="about-view-instagram">
                <div className="space-y-2">
                  <h4 className="text-rose-400 font-extrabold text-sm font-display tracking-widest uppercase flex items-center gap-2">
                    <Instagram className="w-4.5 h-4.5" /> INSTAGRAM DUMP SPECIFICATIONS
                  </h4>
                  <p className="text-neutral-400">
                    Instagram uses structured JSON files inside accounts archives. ChatReader processes these JSON matrices elegantly to keep direct messages readable.
                  </p>
                </div>

                <div className="border border-neutral-850 bg-neutral-950/80 p-5 space-y-4">
                  <h5 className="font-mono text-[11px] font-bold text-white uppercase tracking-widest text-rose-400">DOWNLOAD MANUAL SYSTEM SEQUENCE</h5>
                  <div className="space-y-3 text-[11px] text-neutral-400">
                    <div className="flex gap-2">
                      <span className="text-[#bfff00]">▋</span>
                      <p>Open Instagram settings, search or navigate directly down into Meta's <strong className="text-white">"Accounts Center"</strong> tab.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#bfff00]">▋</span>
                      <p>Tap <strong className="text-white">Your Information and Permissions</strong>, then tap the <strong className="text-white">"Download Your Information"</strong> page.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#bfff00]">▋</span>
                      <p>Request data copy, click <strong className="text-white">"Some of your Information"</strong>, select <strong className="text-white">"Messages"</strong>, and press continue.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#bfff00]">▋</span>
                      <p>CRITICAL SETUP: Switch Format option from HTML to <strong className="text-[#bfff00] bg-neutral-900 border border-neutral-800 px-1 py-0.5 font-bold rounded">JSON Format Mode</strong>. Choose media quality level and request generation.</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#bfff00]">▋</span>
                      <p>Once Meta finishes, download the archive, look inside into the <strong className="text-white">your_instagram_activity/messages/inbox/...</strong> folder, and upload the target dialogue JSON or zip directory here.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6 animate-fadeIn" id="about-view-privacy">
                <div className="space-y-2">
                  <h4 className="text-[#bfff00] font-extrabold text-sm font-display tracking-widest uppercase flex items-center gap-2">
                    <Lock className="w-4.5 h-4.5" /> ABSOLUTE LOCAL CLIENT ISOLATION
                  </h4>
                  <p className="text-neutral-400">
                    Your personal logs represent sensitive data. Our architectural approach ensures absolute transparency and reliable client isolation:
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5 p-4 bg-black border border-neutral-900">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-white">No External Database Pipeline</span>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Data buffers are parsed strictly inside transient React scope triggers. When you load a ZIP or text file, standard JavaScript API calls extract byte contents immediately in-browser. Nothing is queried, transmitted, or logged to remote machines.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-4 bg-black border border-neutral-900">
                    <Lock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-mono font-bold text-[11px] uppercase tracking-wider text-white">No Cloud Storing of Key Secrets</span>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        AI summarizes leverage localized, secure proxy variables or prompts that you initiate directly. No private logs are indexed, or retained on servers beyond the processing turn limit.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'troubleshoot' && (
              <div className="space-y-6 animate-fadeIn" id="about-view-troubleshoot">
                <div className="space-y-2">
                  <h4 className="text-rose-500 font-extrabold text-sm font-display tracking-widest uppercase flex items-center gap-2">
                    <AlertTriangle className="w-4.5 h-4.5" /> FAULT TRAPPING & OUT-OF-MEMORY RECOVERY
                  </h4>
                  <p className="text-neutral-400">
                    Because ChatReader compiles, renders, and processes multi-page graphics inside your browser canvas threads, large chats (10,000+ records) may hitting sandboxed memory caps or get occasionally stuck. Use these protocols for recovery.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-[#1f0d0e] border border-rose-950 rounded-none space-y-3">
                    <p className="font-bold text-rose-400 font-mono uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <span>⚙️ RECOVERY OPERATION PROCEDURES</span>
                    </p>
                    <ul className="list-disc pl-5 space-y-2 text-[11px] text-neutral-400">
                      <li><strong className="text-white">App freezes during PDF Export?</strong> This happens if chat transcript is extremely long. Use the interactive filters to slice logs by participant or date before exporting! This limits memory canvas strain beautifully.</li>
                      <li><strong className="text-white">Incorrect Sender Alignment?</strong> If messages float wrong, select your custom nickname in the chat view sidebar to realign conversational streams accurately.</li>
                      <li><strong className="text-white">Is something still stuck?</strong> If the rendering engine gets into an unrecoverable infinite loop or throws rendering failures, touch the Force Recover action below. It completely flushes state registers and triggers a complete system restart.</li>
                    </ul>
                  </div>

                  <div className="border border-neutral-850 p-5 bg-black flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                      <h5 className="font-mono text-[11px] font-bold text-white uppercase tracking-wider">HARD SAFE RESTART ENGINE</h5>
                      <p className="text-[10px] text-neutral-500 leading-relaxed">Wipes current workspace registers, cleans temporary browser storage buffers, and forces clean live app launch.</p>
                    </div>
                    <button
                      onClick={() => {
                        onClose();
                        onForceReload();
                      }}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-mono font-black uppercase text-[10px] tracking-widest cursor-pointer shadow-lg active:scale-95 transition-all flex items-center gap-2 shrink-0"
                      id="handbook-hard-reload-btn"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin-reverse" />
                      <span>PERFORM RECOVERY RUN</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Handbook Footer indicator */}
          <div className="p-4 bg-black border-t border-neutral-900 flex justify-between items-center text-[10px] text-neutral-500 font-mono uppercase" id="about-footer">
            <span>📚 ChatReader System Spec v2.4</span>
            <button 
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white uppercase font-bold text-[10px] tracking-wider cursor-pointer font-bold active:scale-95 transition-all"
              id="about-footer-dismiss-btn"
            >
              DISMISS HANDBOOK
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

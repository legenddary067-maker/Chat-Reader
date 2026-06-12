/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { ChatMessage, ChatStats } from './types';
import { 
  parseWhatsAppChat, 
  parseInstagramChat, 
  calculateStats,
  bindAttachments
} from './utils/parser';
import { 
  SAMPLE_SPACE_HACKATHON, 
  SAMPLE_FAMILY_DINNER
} from './utils/sampleData';
import Dashboard from './components/Dashboard';
import ChatViewer from './components/ChatViewer';
import ExportButton from './components/ExportButton';
import ChatbookCreator from './components/ChatbookCreator';
import AiSummarizer from './components/AiSummarizer';
import AboutModal from './components/AboutModal';
import DotPattern from '@/components/ui/dot-pattern-1';
import { RetroGrid } from '@/components/ui/hero-section-dark';
import { GlowyWavesHero } from '@/components/ui/glowy-waves-hero-shadcnui';
import { StackedCircularFooter } from '@/components/ui/stacked-circular-footer';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Coffee, 
  BookOpen, 
  Eye, 
  RefreshCw, 
  ChevronRight, 
  Clipboard, 
  Info,
  Smartphone,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('chatreader-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('chatreader-theme', theme);
    const rootEl = document.getElementById('chatreader-root');
    if (rootEl) {
      if (theme === 'light') {
        rootEl.classList.add('light-mode');
        rootEl.classList.remove('dark-mode');
        document.documentElement.classList.add('light-mode');
        document.documentElement.classList.remove('dark-mode');
      } else {
        rootEl.classList.add('dark-mode');
        rootEl.classList.remove('light-mode');
        document.documentElement.classList.add('dark-mode');
        document.documentElement.classList.remove('light-mode');
      }
    }
  }, [theme]);

  // Handbook and Diagnostic states
  const [showAbout, setShowAbout] = useState(false);

  const handleForceReload = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  // PWA installation states
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showMobileBanner, setShowMobileBanner] = useState(false);

  useEffect(() => {
    // Detect mobile/tablet to conditionally show helpful instructions
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    // Only show mobile banner if not running in standalone (PWA) mode already
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isMobileDevice && !isStandalone) {
      setShowMobileBanner(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  // Parsing states
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [sourceType, setSourceType] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [errorText, setErrorText] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'stats' | 'chat' | 'chatbook' | 'ai-summary'>('stats');

  // Parse chat inputs
  const handleChatData = (rawText: string, name: string, type: 'whatsapp' | 'instagram') => {
    try {
      setErrorText('');
      let parsedMsgs: ChatMessage[] = [];
      if (type === 'whatsapp') {
        parsedMsgs = parseWhatsAppChat(rawText);
      } else {
        parsedMsgs = parseInstagramChat(rawText);
      }

      if (parsedMsgs.length === 0) {
        throw new Error('No matched messages. Could not parse timestamps. Check your chat text layout format.');
      }

      setMessages(parsedMsgs);
      setFileName(name);
      setSourceType(type);
      setActiveTab('stats');
    } catch (e: any) {
      setErrorText(e?.message || 'Failed to parse chat log. Check format contents.');
    }
  };

  // Sample triggers
  const loadSample = (sampleType: 'hackathon' | 'family') => {
    if (sampleType === 'hackathon') {
      handleChatData(SAMPLE_SPACE_HACKATHON, 'Space_Hackathon_Group.txt', 'whatsapp');
    } else {
      handleChatData(SAMPLE_FAMILY_DINNER, 'Family_Dinner_Logistics.txt', 'whatsapp');
    }
  };

  // Drag Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processUploadedFile = async (file: File) => {
    try {
      setErrorText('');
      
      if (file.name.endsWith('.zip')) {
        const JSZipModule = await import('jszip');
        const JSZip = JSZipModule.default;
        const zip = new JSZip();
        const arrayBuffer = await file.arrayBuffer();
        const zipContents = await zip.loadAsync(arrayBuffer);

        const fileNames = Object.keys(zipContents.files);
        let mainChatFileName = '';

        // Prioritize iOS '_chat.txt'
        const iosTxt = fileNames.find(n => n.toLowerCase() === '_chat.txt' || n.toLowerCase().endsWith('/_chat.txt'));
        if (iosTxt) {
          mainChatFileName = iosTxt;
        } else {
          // Android usually has "WhatsApp Chat with..." or similar, prioritize ending in .txt with 'whatsapp' or 'chat'
          const matchingTxt = fileNames.find(n => n.toLowerCase().endsWith('.txt') && (n.toLowerCase().includes('whatsapp') || n.toLowerCase().includes('chat')));
          if (matchingTxt) {
            mainChatFileName = matchingTxt;
          } else {
            // Falls back to any txt
            const anyTxt = fileNames.find(n => n.toLowerCase().endsWith('.txt'));
            if (anyTxt) {
              mainChatFileName = anyTxt;
            } else {
              // Instagram json
              const anyJson = fileNames.find(n => n.toLowerCase().endsWith('.json') && (n.toLowerCase().includes('message') || n.toLowerCase().includes('direct')));
              if (anyJson) {
                mainChatFileName = anyJson;
              }
            }
          }
        }

        if (!mainChatFileName) {
          setErrorText('No chat trace (.txt or .json) file was detected in this ZIP archive. Make sure it has your exported files.');
          return;
        }

        const textContent = await zipContents.files[mainChatFileName].async('string');

        // Extract media as local Blobs
        const mediaUrls: { [name: string]: string } = {};
        for (const [name, zipObject] of Object.entries(zipContents.files)) {
          if (zipObject.dir) continue;

          const lowerName = name.toLowerCase();
          const isMedia = 
            lowerName.endsWith('.jpg') || 
            lowerName.endsWith('.jpeg') || 
            lowerName.endsWith('.png') || 
            lowerName.endsWith('.gif') || 
            lowerName.endsWith('.webp') || 
            lowerName.endsWith('.heic') || 
            lowerName.endsWith('.mp4') || 
            lowerName.endsWith('.mov') || 
            lowerName.endsWith('.mp3') || 
            lowerName.endsWith('.m4a') || 
            lowerName.endsWith('.wav') || 
            lowerName.endsWith('.opus') || 
            lowerName.endsWith('.ogg') ||
            lowerName.endsWith('.pdf');

          if (isMedia) {
            const baseName = name.split('/').pop() || name;
            try {
              const fileBlob = await zipObject.async('blob');
              const objectUrl = URL.createObjectURL(fileBlob);
              mediaUrls[baseName] = objectUrl;
            } catch (err) {
              console.warn("Failed to extract file:", name, err);
            }
          }
        }

        const isJson = mainChatFileName.endsWith('.json');
        const type = isJson ? 'instagram' : 'whatsapp';
        
        let parsedMsgs = isJson 
          ? parseInstagramChat(textContent) 
          : parseWhatsAppChat(textContent, mediaUrls);

        if (parsedMsgs.length === 0) {
          setErrorText('No readable chat messages found in the ZIP contents.');
          return;
        }

        setMessages(parsedMsgs);
        setFileName(file.name);
        setSourceType(type);
        setActiveTab('stats');
      } else {
        const isJson = file.name.endsWith('.json');
        const reader = new FileReader();
        reader.onload = (event) => {
          const textValue = event.target?.result as string;
          handleChatData(
            textValue, 
            file.name, 
            isJson ? 'instagram' : 'whatsapp'
          );
        };
        reader.onerror = () => {
          setErrorText('Failed to read the file.');
        };
        reader.readAsText(file);
      }
    } catch (e: any) {
      setErrorText(`Error loading file: ${e.message || e}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      processUploadedFile(file);
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteContent.trim()) {
      setErrorText('Please paste some text messages to parse.');
      return;
    }
    // Try to guess if JSON or TXT
    const cleanPaste = pasteContent.trim();
    const isJson = cleanPaste.startsWith('{') || cleanPaste.startsWith('[');
    handleChatData(
      cleanPaste, 
      isJson ? 'Pasted_Instagram_DM.json' : 'Pasted_WhatsApp_Export.txt', 
      isJson ? 'instagram' : 'whatsapp'
    );
    setPasteContent('');
    setIsPasting(false);
  };

  // Derive stats
  const chatStats: ChatStats | null = useMemo(() => {
    if (messages.length === 0) return null;
    return calculateStats(messages);
  }, [messages]);

  // Senders list
  const participantsList = useMemo(() => {
    if (!chatStats) return [];
    return Object.keys(chatStats.participants);
  }, [chatStats]);

  const handleReset = () => {
    setMessages([]);
    setFileName('');
    setSourceType('');
    setErrorText('');
  };

  return (
    <div className="min-h-screen bg-[#080808] text-neutral-200 transition-all duration-305 flex flex-col font-sans carbon-grid" id="chatreader-root">
      
      {/* Dynamic Navigation Sticky Top Bar Header */}
      <header className="bg-black border-b border-neutral-900 sticky top-0 z-30 shadow-xl" id="app-header">
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#bfff00] via-amber-400 to-purple-600" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 bg-[#bfff00] text-black rounded-lg shadow-lg select-none leading-none btn-glowing-effect" id="logo-badge">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5.5 h-5.5 text-black">
                <path d="M19 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h4l3 3 3-3h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 12H8v-2h8v2zm0-4H8V8h8v2z" />
              </svg>
            </span>
            <div>
              <h1 className="text-lg font-black text-white tracking-widest uppercase flex items-center gap-2 font-display">
                CHATREADER <span className="text-[9px] font-mono text-black font-black bg-[#bfff00] px-2 py-0.5 rounded-md tracking-widest leading-none">PRO S2.4</span>
              </h1>
              <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-widest font-bold">SECURE CONVERSATION LOG ANALYSIS & INSIGHTS</p>
            </div>
          </div>

          {/* Theme Toggler Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-2 sm:px-3 sm:py-1.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-850 hover:border-[#bfff00] text-[#bfff00] transition-all cursor-pointer rounded-none flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-wider select-none"
              id="theme-toggler"
              title="Toggle theme (High-Contrast Light / Dark Mode)"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4.5 h-4.5 text-amber-400 shrink-0" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* PWA Installation Instructions Banners to remove browser tabs */}
      {installPrompt && (
        <div className="bg-[#11160a] border-b border-[#bfff00]/20 text-[#bfff00] text-xs py-3 px-4 shadow-inner" id="android-install-banner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-[11px]">
              <Smartphone className="w-4.5 h-4.5 animate-pulse text-[#bfff00] shrink-0" />
              <span>Running on Chrome? Install ChatReader into your system launcher to completely remove browser tabs!</span>
            </span>
            <button
              onClick={handleInstallPWA}
              className="bg-[#bfff00] hover:bg-white text-black font-extrabold px-4 py-1.5 text-xs font-mono tracking-widest uppercase rounded-none transition-colors duration-200 active:scale-95 shrink-0 cursor-pointer"
            >
              INSTALL APP
            </button>
          </div>
        </div>
      )}

      {showMobileBanner && (
        <div className="bg-[#101010] border-b border-neutral-900 text-neutral-300 text-xs py-3 px-4" id="mobile-install-banner">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="flex flex-wrap items-center justify-center sm:justify-start gap-2 font-mono text-[11px] uppercase tracking-wide">
              <Smartphone className="w-4 h-4 text-[#bfff00] shrink-0" />
              <span>IMMERSIVE VIEWPORT: TAP SHARE / OPTIONS (📤 OR ︙) AND SELECT <strong className="text-[#bfff00]">"ADD TO HOME SCREEN"</strong> TO HIDE BROWSER TABS</span>
            </span>
            <button
              onClick={() => setShowMobileBanner(false)}
              className="text-neutral-500 hover:text-white font-mono uppercase text-[10px] tracking-widest font-black shrink-0 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          
          {/* Welcome Screen - Beautifully Immersive 3D Spline and Portal Simulator Integration */}
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5xl mx-auto w-full py-6 md:py-12 space-y-10 relative overflow-hidden"
              key="intro-panel"
              id="intro-page"
            >
              {/* Glowy Waves Hero Sandbox Integration with Reactive Waves */}
              <GlowyWavesHero
                theme={theme}
                onLaunchClick={() => {
                  const fileInputEl = document.getElementById("file-input-trigger");
                  if (fileInputEl) {
                    (fileInputEl as HTMLInputElement).click();
                  }
                }}
                onExploreClick={() => {
                  loadSample('hackathon');
                }}
              />

              {/* Central drag & drop card component */}
              <div className="bg-[#101010] border border-neutral-850 rounded-none p-6 md:p-8 shadow-2xl space-y-6 relative" id="uploader-card">
                <div className="absolute top-0 left-0 bg-[#bfff00] w-20 h-0.5" />
                <div className="absolute bottom-0 right-0 bg-[#bfff00] w-20 h-0.5" />
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-xl p-6 sm:p-10 text-center transition-all duration-300 ${
                    dragActive
                      ? 'border-[#bfff00] bg-neutral-900/60'
                      : 'border-neutral-800 hover:border-neutral-750 bg-black/40'
                  }`}
                  id="drop-zone"
                >
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 text-[#bfff00] rounded-lg flex items-center justify-center shadow-md">
                      <Upload className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-white uppercase tracking-wider font-mono">
                        DRAG & DROP CHAT ARCHIVE
                      </p>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
                        Drop a WhatsApp exported <span className="font-mono font-bold text-[10.5px] text-[#bfff00] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">.zip / .txt</span> file or Instagram <span className="font-mono font-bold text-[10.5px] text-[#bfff00] bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">.json</span> file to begin analysis.
                      </p>
                    </div>

                    <div className="pt-3">
                      <label className="inline-flex items-center justify-center px-5 py-2 border border-neutral-800 bg-neutral-900 text-neutral-300 hover:text-white hover:border-[#bfff00] rounded-md shadow-lg cursor-pointer text-xs font-bold font-mono uppercase tracking-wider transition-all duration-200">
                        <span>SELECT FILE FROM DEVICE</span>
                        <input
                          type="file"
                          accept=".txt,.json,.zip"
                          onChange={handleFileInput}
                          className="hidden"
                          id="file-input-trigger"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Paste Area Expansion trigger */}
                <div className="border-t border-neutral-900 pt-4 flex flex-col items-center">
                  {!isPasting ? (
                    <button
                      onClick={() => setIsPasting(true)}
                      className="text-xs font-bold text-neutral-400 hover:text-[#bfff00] font-mono uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                      id="paste-toggle"
                    >
                      <Clipboard className="w-3.5 h-3.5" /> PASTE RAW TEXT LOG INSTEAD
                    </button>
                  ) : (
                    <div className="w-full space-y-3" id="paste-input-container">
                      <div className="flex justify-between items-center text-xs text-neutral-400 font-mono uppercase tracking-wider">
                        <span className="font-semibold">PASTE DUMP LOG BELOW:</span>
                        <button
                          onClick={() => setIsPasting(false)}
                          className="text-rose-500 hover:text-rose-400 font-bold transition-colors cursor-pointer"
                          id="cancel-paste"
                        >
                          CANCEL
                        </button>
                      </div>
                      <textarea
                        value={pasteContent}
                        onChange={(e) => setPasteContent(e.target.value)}
                        placeholder="[01/06/2026, 09:15:22] Joseph: Morning guys!&#10;[01/06/2026, 09:16:40] Angie: Hey there"
                        rows={5}
                        className="w-full bg-[#0a0a0a] border border-neutral-800 rounded-lg p-3 text-xs font-mono text-neutral-300 focus:border-[#bfff00] focus:outline-hidden transition-all placeholder-neutral-700"
                        id="paste-textarea"
                      />
                      <button
                        onClick={handlePasteSubmit}
                        className="w-full py-2 bg-[#bfff00] hover:bg-[#a6d800] text-black rounded-lg shadow-md text-xs font-bold font-mono uppercase tracking-wider cursor-pointer transition-all active:scale-98"
                        id="paste-submit"
                      >
                        COMPILE & ANALYZE PASTE
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Banner inside card */}
                {errorText && (
                  <div className="bg-[#1f0a0d] border border-rose-950 p-4 rounded-lg text-rose-300 text-xs text-center font-mono leading-relaxed shadow-lg mx-auto w-full" id="error-banner">
                    <p className="font-bold flex items-center justify-center gap-1.5 uppercase text-[#ff3a4c] tracking-wider text-[11px]">
                      ⚠️ LOG PARSING SYNTAX FAILURE
                    </p>
                    <p className="text-[10px] mt-1 text-neutral-400">{errorText}</p>
                  </div>
                )}
              </div>

              {/* Loading Samples Triggers Grid */}
              <div className="space-y-4" id="samples-section">
                <h3 className="text-center font-bold uppercase tracking-widest text-[9px] text-[#bfff00] font-mono">
                  📂 NO EXPORT DATA AVAILABLE? INITIALIZE SIMULATED SESSIONS ///
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div
                    onClick={() => loadSample('hackathon')}
                    className="p-4 bg-[#101010] hover:bg-neutral-900 border border-neutral-850 hover:border-[#bfff00] rounded-none cursor-pointer flex flex-col justify-between gap-3 transition-all duration-300 group"
                    id="sample-hackathon-trigger"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-neutral-950 text-[#bfff00] group-hover:bg-black rounded-none border border-neutral-850">
                        <Sparkles className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-xs sm:text-sm uppercase font-display tracking-wider group-hover:text-[#bfff00] transition-colors">🌌 SESSION 1: DEEP MARS COLONY CREW</h4>
                        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                          A high-stakes sci-fi group log with atmospheric density levels, message statistics, and dehydrated taco reviews.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => loadSample('family')}
                    className="p-4 bg-[#101010] hover:bg-neutral-900 border border-neutral-850 hover:border-[#bfff00] rounded-none cursor-pointer flex flex-col justify-between gap-3 transition-all duration-300 group"
                    id="sample-family-trigger"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-neutral-950 text-[#bfff00] group-hover:bg-black rounded-none border border-neutral-850">
                        <Smartphone className="w-4.5 h-4.5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-white text-xs sm:text-sm uppercase font-display tracking-wider group-hover:text-[#bfff00] transition-colors">🍔 SESSION 2: REGULAR FAMILY CHAT</h4>
                        <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                          A real-world dialogue archive detailing dad-caps locks, missing keys, and late family BBQ coordination logistics.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informative Security details helper banner */}
              <div className="bg-[#101010] border border-neutral-850 p-4 rounded-none flex items-start gap-3 text-[11px] leading-relaxed text-neutral-400 relative overflow-hidden" id="encryption-disclaimer">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#bfff00]" />
                <Info className="w-4 h-4 text-[#bfff00] shrink-0 mt-0.5" />
                <p>
                  <span className="font-bold text-white font-mono uppercase tracking-widest text-[#bfff00]">LOCAL CLIENT-SIDE ISOLATION ///</span> All chat logs parsing, regex checks, and attachment extracts are rendered in your browser sandbox. File bytes never hit remote servers. Max speed, absolute security.
                </p>
              </div>

              {/* How to export brief panel */}
              <div className="border border-neutral-850 bg-[#101010] p-5 rounded-none animate-fadeIn" id="how-to-accordion">
                <h4 className="font-black text-xs text-white uppercase tracking-wider mb-4 flex items-center gap-1.5 font-display italic">
                  <BookOpen className="w-4 h-4 text-[#bfff00]" /> EXPORT MANUAL SPEC & GUIDELINES ///
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs text-neutral-400 font-sans">
                  <div className="space-y-2">
                    <p className="font-bold text-white flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-widest text-[#bfff00]">🟢 WHATSAPP MANUAL EXPORT:</p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-neutral-400 leading-relaxed font-mono">
                      <li>Launch WhatsApp, navigate to target dialog, tap their upper profile.</li>
                      <li>Scroll down the options list and search for <span className="font-bold text-white">"Export Chat"</span>.</li>
                      <li>Select <span className="font-bold text-white">"Without Media"</span> for lightning-fast logs, or <span className="font-bold text-[#bfff00]">"With Media"</span> to drag in voice notes and pictures.</li>
                    </ol>
                  </div>
                  <div className="space-y-2">
                    <p className="font-bold text-white flex items-center gap-1.5 font-mono uppercase text-[10px] tracking-widest text-[#bfff00]">📸 INSTAGRAM JSON DUMP:</p>
                    <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-neutral-400 leading-relaxed font-mono">
                      <li>Go to Instagram Accounts Hub ➜ <span className="font-bold text-white">Your Information and Permissions</span>.</li>
                      <li>Select the <span className="font-bold text-white">Download Your Information</span> panel.</li>
                      <li>Configure single topic, request direct chats only, pick <span className="font-bold text-[#bfff00]">JSON FORMAT</span>, and load the corresponding JSON trace here.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* System Handbook Quick Trigger Block */}
              <div className="border border-neutral-850 bg-gradient-to-br from-[#0a0a0b] to-[#121214] p-5 rounded-none relative overflow-hidden group shadow-2xl mt-4" id="intro-handbook-controls">
                {/* Visual accent corner mark */}
                <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#bfff00]/10 to-transparent pointer-events-none" />
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 w-full relative z-10">
                  <div className="text-left space-y-1 w-full md:flex-1">
                    <h5 className="text-white text-xs font-black tracking-widest font-mono uppercase flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-[#bfff00] rounded-none rotate-45" />
                      <span>TROUBLESHOOTING & SYSTEM RESOURCE HANDBOOK</span>
                    </h5>
                    <p className="text-[10px] text-neutral-400 leading-relaxed font-sans max-w-xl">
                      Read about private WhatsApp and Instagram files parsing guidelines, sandboxing protocols, and native memory configurations. Use the force recovery trigger to purge active caches.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                    <button
                      onClick={() => setShowAbout(true)}
                      className={`px-5 py-3 border font-mono font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 active:scale-95 group/btn ${
                        theme === 'light'
                          ? "bg-black text-white border-slate-400"
                          : "bg-black text-neutral-300 hover:text-white border-neutral-800 hover:border-[#bfff00]/65"
                      }`}
                      id="intro-btn-guide"
                    >
                      <BookOpen className="w-4 h-4 text-[#bfff00] group-hover/btn:scale-110 transition-transform" />
                      <span>OPEN SYSTEM HANDBOOK</span>
                    </button>
                    <button
                      onClick={handleForceReload}
                      className={`px-5 py-3 border font-mono font-extrabold text-[11px] uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 active:scale-95 group/btn-reload ${
                        theme === 'light'
                          ? "border-slate-300 text-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                          : "border-neutral-800 hover:border-rose-850/70 hover:bg-rose-950/15 text-neutral-400 hover:text-rose-400 bg-transparent"
                      }`}
                      id="intro-btn-force-reload"
                      title="Forcibly wipes state cache and reboots browser context"
                    >
                      <RefreshCw className="w-4 h-4 text-rose-500 group-hover/btn-reload:rotate-180 transition-transform" />
                      <span>FORCE SYSTEM RECOVERY</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 w-full"
              key="workspace-content"
              id="analytics-workspace"
            >
              {/* Session Status & Quick Reset Subheader Panel */}
              <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-[#0d0d0f] border border-neutral-850 p-3.5 px-4 rounded-none gap-4 shadow-2xl relative select-none" id="active-session-status-bar">
                {/* Thin top accent indicator line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[#bfff00]/20 to-transparent" />
                
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-mono">
                  <div className="flex items-center gap-2 bg-neutral-950/80 px-2.5 py-1.5 border border-neutral-850/80">
                    <span className="w-2 h-2 rounded-full bg-[#bfff00] animate-pulse shrink-0" />
                    <span className="text-neutral-500 font-black uppercase text-[10px] tracking-wider">SECURED REPOSITORY TRACE:</span>
                    <span className="text-[#bfff00] font-black tracking-wider uppercase truncate max-w-[200px] sm:max-w-md">{fileName || 'Active Session'}</span>
                  </div>
                  
                  <div className="px-2.5 py-1.5 bg-neutral-950/80 border border-neutral-850/80 text-neutral-400 font-bold tracking-wider text-[10px] uppercase">
                    {messages.length.toLocaleString()} LOGS LOADED
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto shrink-0 justify-end" id="session-action-deck">
                  <button
                    onClick={() => setShowAbout(true)}
                    className={`flex-1 sm:flex-initial px-4 py-2 border transition-all duration-300 text-[11px] flex items-center justify-center gap-2 cursor-pointer font-bold font-mono uppercase tracking-wider shadow-sm hover:shadow-[0_0_12px_rgba(191,255,0,0.1)] ${
                      theme === 'light'
                        ? "bg-black text-[#bfff00] border-slate-400"
                        : "bg-black text-[#bfff00] hover:text-white border-neutral-800 hover:border-[#bfff00]/50"
                    }`}
                    id="workspace-about-btn"
                    title="Open diagnostic rules and specifications"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>SYSTEM MANUAL</span>
                  </button>

                  <button
                    onClick={handleForceReload}
                    className={`flex-1 sm:flex-initial px-4 py-2 border transition-all duration-300 text-[11px] flex items-center justify-center gap-2 cursor-pointer font-bold font-mono uppercase tracking-wider shadow-sm hover:shadow-[0_0_12px_rgba(239,68,68,0.1)] ${
                      theme === 'light'
                        ? "border-slate-300 text-slate-200 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300"
                        : "border-neutral-800 hover:border-rose-950 hover:bg-rose-950/10 text-neutral-400 hover:text-rose-400"
                    }`}
                    id="workspace-reload-btn"
                    title="Triggers hard recovery wipe"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                    <span>FORCE RELOAD</span>
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto px-4 py-2 border border-dashed border-neutral-800 hover:border-rose-900/40 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/20 active:scale-97 transition-all duration-300 text-[11px] flex items-center justify-center gap-2 cursor-pointer font-bold font-mono uppercase tracking-widest"
                    id="reset-chat-btn"
                    title="Wipes current log bytes from your device sandbox and restores welcome screen"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                    <span>EJECT ARCHIVE</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Sub-header Navigation Tabs */}
              <div className="border-b border-neutral-900 pb-2 flex gap-2 flex-wrap items-center animate-fade-in" id="workspace-tabs-bar">
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer rounded-lg border ${
                    activeTab === 'stats'
                      ? 'bg-[#bfff00] border-[#bfff00] text-black shadow-md'
                      : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white hover:bg-neutral-900'
                  }`}
                  id="tab-trigger-stats"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Grid Analytics</span>
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer rounded-lg border ${
                    activeTab === 'chat'
                      ? 'bg-[#bfff00] border-[#bfff00] text-black shadow-md'
                      : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white hover:bg-neutral-900'
                  }`}
                  id="tab-trigger-chat"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat Transcription</span>
                </button>
                <button
                  onClick={() => setActiveTab('chatbook')}
                  className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer rounded-lg border ${
                    activeTab === 'chatbook'
                      ? 'bg-[#bfff00] border-[#bfff00] text-black shadow-md'
                      : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white hover:bg-neutral-900'
                  }`}
                  id="tab-trigger-chatbook"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Creative Chatbook</span>
                </button>
                <button
                  onClick={() => setActiveTab('ai-summary')}
                  className={`px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer rounded-lg border ${
                    activeTab === 'ai-summary'
                      ? 'bg-[#bfff00] border-[#bfff00] text-black shadow-md'
                      : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-white hover:bg-neutral-900'
                  }`}
                  id="tab-trigger-ai-summary"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Summaries & Insights</span>
                </button>
              </div>

              {/* Dynamic loaded view matching active tab */}
              {chatStats && (
                <div id="active-tab-panel" className="overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeInOut" }}
                      className="w-full"
                    >
                      {activeTab === 'stats' ? (
                        <Dashboard stats={chatStats} messages={messages} />
                      ) : activeTab === 'chat' ? (
                        <ChatViewer messages={messages} participants={participantsList} stats={chatStats} fileName={fileName} />
                      ) : activeTab === 'chatbook' ? (
                        <ChatbookCreator messages={messages} stats={chatStats} fileName={fileName} />
                      ) : (
                        <AiSummarizer messages={messages} stats={chatStats} fileName={fileName} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>
      
      {/* Universal Beautiful Newsletter & Community Footer */}
      <StackedCircularFooter 
        onOpenAbout={() => setShowAbout(true)}
        onForceReload={handleForceReload}
        onScrollToDocs={() => {
          const el = document.getElementById('how-to-accordion');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' });
          } else {
            // Check if user has uploaded data and is on dashboard, scroll to top or general handbook view
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
      />

      {/* Interactive Handbook Specs & Diagnostics Overlay */}
      <AboutModal 
        isOpen={showAbout} 
        onClose={() => setShowAbout(false)} 
        onForceReload={handleForceReload} 
      />
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, ChatStats } from '../types';
import { 
  Download, 
  Printer, 
  FileText, 
  ChevronDown, 
  Smartphone, 
  Sparkles, 
  FileCode, 
  Check, 
  Moon, 
  Sun, 
  Loader2, 
  Eye, 
  Laptop 
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ExportButtonProps {
  messages: ChatMessage[];
  stats: ChatStats;
  chatTitle: string;
  alignUser?: string;
  theme?: string;
}

export default function ExportButton({ 
  messages, 
  stats, 
  chatTitle, 
  alignUser = '', 
  theme = 'ios-dark' 
}: ExportButtonProps) {
  const [exportingHtml, setExportingHtml] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');

  // Helper code to escape HTML characters safely
  const esc = (text: string) => {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const getFileSize = (fileName: string) => {
    if (fileName.toLowerCase().includes('joseph')) return '2.4 MB';
    if (fileName.toLowerCase().includes('chat')) return '2.4 MB';
    const ext = fileName.split('.').pop() || '';
    if (ext.toLowerCase() === 'zip') return '2.1 MB';
    if (ext.toLowerCase() === 'png' || ext.toLowerCase() === 'jpg') return '840 KB';
    if (ext.toLowerCase() === 'pdf') return '1.2 MB';
    return '140 KB';
  };

  // 1. Generation of Interactive Standalone Chat Simulation HTML Document
  const handleExportHtml = () => {
    setExportingHtml(true);

    const escTitle = esc(chatTitle || 'ChatReader_Log');

    // Pre-process every message to embed into the self-contained JS array
    const messageRowsHtml = messages.map(msg => {
      const isSystem = msg.isSystem ? 'true' : 'false';
      const timeStr = msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateKey = msg.timestamp.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Attachment properties mapping
      let attachmentJson = 'null';
      if (msg.attachment) {
        attachmentJson = JSON.stringify({
          fileName: msg.attachment.fileName,
          localUrl: msg.attachment.localUrl || msg.attachment.fileName, // fallback to plain filename for local unzipped mapping!
          fileType: msg.attachment.fileType
        });
      }

      // Reactions list mapping
      const reactionsJson = msg.reactions ? JSON.stringify(msg.reactions) : '[]';

      // Reply-to thread mapping
      const replyToJson = msg.replyTo ? JSON.stringify(msg.replyTo) : 'null';

      return `  {
    id: ${JSON.stringify(msg.id)},
    sender: ${JSON.stringify(msg.sender)},
    content: ${JSON.stringify(msg.content)},
    isSystem: ${isSystem},
    timestampISO: ${JSON.stringify(msg.timestamp.toISOString())},
    timeLabel: ${JSON.stringify(timeStr)},
    dateLabel: ${JSON.stringify(dateKey)},
    attachment: ${attachmentJson},
    reactions: ${reactionsJson},
    replyTo: ${replyToJson}
  }`;
    }).join(',\n');

    const participantsListJson = JSON.stringify(Object.keys(stats.participants));

    // Standalone self-contained HTML layout code containing all simulator CSS presets & custom JS runtime
    const fileContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ChatReader Interactive Export: ${escTitle}</title>
    <!-- Tailwind Play CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(125, 125, 125, 0.3);
        border-radius: 4px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(125, 125, 125, 0.5);
      }

      /* Custom Font Imports - Match Applet Typography rules */
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=JetBrains+Mono:wght@400;500;750&display=swap');

      /* Standard alignment overrides for printing */
      @media print {
        header, .toolbar-panel, #print-banner, .theme-switches {
          display: none !important;
        }
        body {
          background: white !important;
          color: black !important;
        }
        .main-container {
          max-width: 100% !important;
          padding: 0 !important;
        }
        .simulator-window {
          border: none !important;
          box-shadow: none !important;
          background: white !important;
          height: auto !important;
          overflow: visible !important;
        }
        .messages-list-wrapper {
          overflow: visible !important;
          height: auto !important;
          background: white !important;
        }
        .bubble {
          page-break-inside: avoid !important;
          box-shadow: none !important;
          border: 1px solid #e2e8f0 !important;
          background: #ffffff !important;
          color: #1a202c !important;
        }
        .me-bubble {
          background: #f0fdf4 !important;
          border-color: #bbf7d0 !important;
        }
      }
    </style>
  </head>
  <body class="bg-[#09090b] text-neutral-200 min-h-screen font-sans flex flex-col justify-start">
    
    <!-- Dynamic Header -->
    <header class="bg-black border-b border-neutral-800 py-4 px-6 sticky top-0 z-50 shadow-md">
      <div class="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
        <div>
          <span class="text-[10px] bg-[#bfff00]/25 text-[#bfff00] border border-[#bfff00]/30 font-bold px-2.5 py-0.5 rounded font-mono tracking-widest uppercase">
            Interactive Standalone Simulation Model
          </span>
          <h1 class="text-lg font-black text-white hover:text-[#bfff00] tracking-wide mt-1 uppercase flex items-center gap-2">
            <span>💬</span> CHATREADER EXPORT: ${escTitle}
          </h1>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Align user selection -->
          <div class="flex flex-col gap-0.5">
            <span class="text-[8px] uppercase tracking-wider font-extrabold text-neutral-400 font-mono">My Identity (Right align):</span>
            <select id="meAlignSelect" onchange="changeAlignUser(this.value)" class="bg-[#121212] border border-neutral-800 text-neutral-200 text-xs px-2.5 py-1.5 focus:outline-none focus:border-[#bfff00] font-mono">
              <option value="">(No alignment - left stack)</option>
            </select>
          </div>

          <!-- Search filter option -->
          <div class="flex flex-col gap-0.5">
            <span class="text-[8px] uppercase tracking-wider font-extrabold text-neutral-400 font-mono">Search keyword:</span>
            <input type="text" id="offlineSearch" oninput="filterMessages(this.value)" placeholder="Search transcript..." class="bg-[#121212] border border-neutral-800 text-neutral-200 text-xs px-2.5 py-1.5 focus:outline-none focus:border-[#bfff00] placeholder-neutral-600 font-mono" />
          </div>

          <button onclick="window.print()" class="bg-[#3b82f6]/20 border border-blue-500/40 text-blue-400 font-bold hover:bg-[#3b82f6]/40 px-3.5 py-1.5 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-3a2 2 0 00-2-2H9a2 2 0 00-2 2v3a2 2 0 002 2zm3-11h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Print to PDF
          </button>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8 main-container">
      
      <!-- Built-in metrics panel -->
      <section class="bg-[#111112] border border-neutral-805 p-5 shadow-2xl rounded-2xl toolbar-panel">
        <h2 class="text-xs font-black text-[#bfff00] uppercase tracking-widest font-mono mb-4 flex items-center gap-1.5">
          <span class="w-2 h-2 bg-[#bfff00] rounded-full animate-pulse"></span> ARCHIVED LOG METRICS SUITE
        </h2>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
            <span class="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono block">Total Messages</span>
            <span class="text-2xl font-black text-white font-mono mt-1 block">${stats.totalMessages.toLocaleString()}</span>
          </div>
          <div class="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
            <span class="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono block">Total Words</span>
            <span class="text-2xl font-black text-white font-mono mt-1 block">${stats.totalWords.toLocaleString()}</span>
          </div>
          <div class="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
            <span class="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono block">Total Emojis</span>
            <span class="text-2xl font-black text-white font-mono mt-1 block">${stats.totalEmojis.toLocaleString()}</span>
          </div>
          <div class="bg-neutral-900 border border-neutral-800 p-4 rounded-xl">
            <span class="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-mono block">Speaker Contacts</span>
            <span class="text-2xl font-black text-[#bfff00] font-mono mt-1 block">${Object.keys(stats.participants).length.toLocaleString()}</span>
          </div>
        </div>
      </section>

      <!-- Simulation theme controls inside exported file -->
      <section class="flex flex-col gap-2.5 toolbar-panel theme-switches">
        <span class="text-[10px] uppercase font-bold text-neutral-400 tracking-wider font-mono">Select Offline Simulation Skin:</span>
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="setTheme('ios-dark')" id="btn-theme-ios-dark" class="px-3.5 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase border border-neutral-800 bg-[#121212] hover:text-[#bfff00] transition-colors rounded">📱 WhatsApp Dark</button>
          <button onclick="setTheme('ios-light')" id="btn-theme-ios-light" class="px-3.5 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase border border-neutral-800 bg-[#121212] hover:text-[#bfff00] transition-colors rounded">🔆 WhatsApp Light</button>
          <button onclick="setTheme('lando-neon')" id="btn-theme-lando-neon" class="px-3.5 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase border border-neutral-800 bg-[#121212] hover:text-[#bfff00] transition-colors rounded">⚡ ChatReader Neon</button>
          <button onclick="setTheme('cosmic')" id="btn-theme-cosmic" class="px-3.5 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase border border-neutral-800 bg-[#121212] hover:text-[#bfff00] transition-colors rounded">🌌 Cosmic Space</button>
        </div>
      </section>

      <!-- Smartphone lookalike chassis frame -->
      <div class="max-w-[430px] w-full mx-auto relative bg-[#09090b] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col justify-between overflow-hidden simulator-window">
        
        <!-- Operating internal display screen -->
        <div class="w-full h-[710px] bg-black overflow-hidden flex flex-col relative" id="phoneContainer">
          
          <!-- Physical status line -->
          <div class="h-9 px-5 flex items-center justify-between text-[11px] font-bold z-30 select-none border-b border-neutral-900/30" id="statusBar">
            <span class="font-sans">17:20</span>
            <div class="flex items-center gap-1">
              <span class="text-[9px]">5G</span>
              <span>🔋 100%</span>
            </div>
          </div>

          <!-- iOS WhatsApp-styled header inside the exported file -->
          <div class="p-2.5 px-3 flex items-center justify-between border-b shrink-0 z-20" id="chatHeader">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-blue-500 font-semibold text-lg select-none mr-1">‹</span>
              <div id="headerAvatar" class="w-9 h-9 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center font-extrabold text-xs text-emerald-400 uppercase select-none shrink-0">
                CR
              </div>
              <div class="leading-tight text-left min-w-0">
                <h4 id="headerTitle" class="font-bold text-[14px] truncate tracking-tight text-white">Conversation</h4>
                <p class="text-[10px] text-gray-400">online</p>
              </div>
            </div>
            
            <div class="flex items-center gap-4 text-blue-500 shrink-0 select-none">
              <span>📹</span>
              <span>📞</span>
            </div>
          </div>

          <!-- Wallpaper main-scroller stream of messages -->
          <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative messages-list-wrapper" id="chatScroller">
            <!-- Messages will be rendered dynamically by JavaScript here -->
          </div>

          <!-- Bottom placeholder panel for aesthetics matching screenshots -->
          <div class="p-2.5 pb-4 px-3 flex items-center gap-2 select-none border-t" id="chatFooter">
            <span class="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold text-lg select-none">+</span>
            <div class="flex-1 border rounded-full px-4.5 py-1.5 text-xs bg-neutral-900/45 border-neutral-800 text-neutral-500 text-left">Message</div>
            <span class="text-xl opacity-80">📷</span>
            <span class="text-xl opacity-80">🎙️</span>
          </div>

        </div>
      </div>

    </main>

    <footer class="bg-black py-8 text-center text-xs text-neutral-550 border-t border-neutral-900 mt-20 toolbar-panel">
      <p>Self-contained archived session log file powered by <span class="font-bold text-[#bfff00]">ChatReader Engine</span></p>
    </footer>

    <!-- INTERACTIVE SCRIPTS TO HYDRATE THE EXPORTED LOG OFFLINE -->
    <script>
      // Helper code to escape HTML characters safely at runtime
      function esc(text) {
        if (!text) return '';
        return String(text)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      // Hydrate messages array injected dynamically
      const rawMessages = [
${messageRowsHtml}
      ];

      // Safe hydration of sender identifiers
      const participants = ${participantsListJson};

      // Current layout configuration state variables mirroring App.tsx
      let activeTheme = "${theme || 'ios-dark'}";
      let alignUser = "${esc(alignUser)}";
      let filterQuery = "";

      // Initialize aligns dropdown UI selector
      const meSelect = document.getElementById("meAlignSelect");
      participants.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        if (p === alignUser) opt.selected = true;
        meSelect.appendChild(opt);
      });

      // Simple theme preset CSS parameters mapping
      const themesMap = {
        "ios-dark": {
          bg: "#0b141a",
          textColor: "text-slate-100",
          headerBg: "#1c1c1e",
          headerText: "text-white",
          headerBorder: "border-[#2c2c2e]",
          footerBg: "#1c1c1e",
          scrollerBg: "#0b141a",
          scrollerBorder: "border-[#202c33]",
          wallpaper: "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
          statusBarBg: "#0f0f14",
          statusBarText: "text-white",
          myBubble: "bg-[#005c4b] text-white border-transparent",
          partnerBubble: "bg-[#202c33] text-[#e9edef] border-transparent"
        },
        "ios-light": {
          bg: "#efeae2",
          textColor: "text-slate-900",
          headerBg: "#f6f6f6",
          headerText: "text-black",
          headerBorder: "border-gray-200",
          footerBg: "#f6f6f6",
          scrollerBg: "#efeae2",
          scrollerBorder: "border-slate-200",
          wallpaper: "https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png",
          statusBarBg: "#f6f6f6",
          statusBarText: "text-black",
          myBubble: "bg-[#d9fdd3] text-[#111b21] border-transparent shadow-sm",
          partnerBubble: "bg-white text-[#111b21] border-[#f0f0f5] shadow-sm"
        },
        "lando-neon": {
          bg: "#000000",
          textColor: "text-[#bfff00]",
          headerBg: "#0a0a0a",
          headerText: "text-white",
          headerBorder: "border-neutral-900",
          footerBg: "#0c0c0c",
          scrollerBg: "#000000",
          scrollerBorder: "border-neutral-950",
          wallpaper: "",
          statusBarBg: "#000000",
          statusBarText: "text-[#bfff00]",
          myBubble: "bg-[#bfff00] text-black border-[#bfff00] font-mono font-medium",
          partnerBubble: "bg-[#121212] text-white border-neutral-800 font-mono"
        },
        "cosmic": {
          bg: "radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%)",
          textColor: "text-slate-100",
          headerBg: "#160d2b",
          headerText: "text-white",
          headerBorder: "border-purple-900/60",
          footerBg: "#110b21",
          scrollerBg: "#080315",
          scrollerBorder: "border-indigo-950",
          wallpaper: "",
          statusBarBg: "#0d061f",
          statusBarText: "text-indigo-200",
          myBubble: "bg-indigo-600 text-white border-transparent shadow-lg",
          partnerBubble: "bg-slate-800 text-violet-100 border-transparent shadow-md"
        }
      };

      // Speaker mapping utilities for colored contact headers inside groups
      const speakerColors = [
        "text-orange-500", "text-blue-500", "text-emerald-500", "text-yellow-500", "text-purple-500", "text-pink-500"
      ];
      const speakerColorMap = {};
      participants.forEach((p, index) => {
        speakerColorMap[p] = speakerColors[index % speakerColors.length];
      });

      // Renders the messages list live on screen
      function renderMessages() {
        const chatScroller = document.getElementById("chatScroller");
        chatScroller.innerHTML = "";

        const preset = themesMap[activeTheme];

        // Group messages by date to render dividers
        let currentGroupKey = null;

        const filtered = rawMessages.filter(msg => {
          if (!filterQuery) return true;
          return msg.content.toLowerCase().includes(filterQuery.toLowerCase()) || 
                 msg.sender.toLowerCase().includes(filterQuery.toLowerCase());
        });

        if (filtered.length === 0) {
          chatScroller.innerHTML = \`<div class="text-center py-12 text-zinc-500 font-mono text-xs">NO DISCOVERED TRACES</div>\`;
          return;
        }

        filtered.forEach(msg => {
          // Render date headers
          if (msg.dateLabel !== currentGroupKey) {
            currentGroupKey = msg.dateLabel;
            const div = document.createElement("div");
            div.className = "flex justify-center my-3 select-none";
            
            const badgeClass = activeTheme === 'ios-light'
              ? 'bg-neutral-250 text-neutral-800'
              : 'bg-neutral-850 text-neutral-400';
            
            div.innerHTML = \`<span class="px-2.5 py-0.5 rounded text-[9.5px] font-bold font-mono tracking-wider \${badgeClass}">\${esc(msg.dateLabel.toUpperCase())}</span>\`;
            chatScroller.appendChild(div);
          }

          // Generate message bubble wrapper
          const wrap = document.createElement("div");
          const isMe = alignUser && msg.sender.toLowerCase().trim() === alignUser.toLowerCase().trim();
          
          if (msg.isSystem) {
            wrap.className = "flex justify-center text-center my-1.5 px-4";
            wrap.innerHTML = \`<span class="px-2.5 py-0.5 border text-[9.5px] font-bold rounded-md bg-neutral-900 border-neutral-850 text-zinc-500 select-none">\${esc(msg.content)}</span>\`;
          } else {
            wrap.className = \`flex \${isMe ? "justify-end" : "justify-start"} items-end gap-1.5 w-full\`;

            // Quote block if replying
            let quoteHtml = "";
            if (msg.replyTo) {
              const quoteClass = activeTheme === 'ios-light' ? 'bg-black/5 border-emerald-600' : 'bg-black/20 border-cyan-400';
              quoteHtml = \`
              <div class="mb-1.5 p-1.5 rounded text-[10px] border-l-[3.5px] \${quoteClass} leading-tight text-left">
                <span class="block font-black text-[9px] uppercase tracking-wide opacity-80">\${esc(msg.replyTo.sender)}</span>
                <span class="opacity-75 line-clamp-2">\${esc(msg.replyTo.content)}</span>
              </div>
              \`;
            }

            // Embedded attachment files block
            let attachmentHtml = "";
            if (msg.attachment) {
              const file = msg.attachment;
              if (file.fileType === 'image') {
                attachmentHtml = \`
                <div class="relative overflow-hidden rounded-xl bg-black/10 my-1">
                  <img src="\${esc(file.localUrl)}" class="max-h-48 w-full object-cover rounded-xl" onerror="this.outerHTML='<div class=\\'p-4 border border-dashed border-neutral-800 rounded text-center text-xs text-neutral-500 font-mono\\'>📷 Photo: \${esc(file.fileName)} (File next to HTML to load)</div>'" />
                </div>
                \`;
              } else if (file.fileType === 'audio') {
                attachmentHtml = \`
                <div class="flex items-center gap-2 bg-black/10 p-2 rounded-lg my-1 max-w-[210px] text-left">
                  <div class="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 select-none">🎙️</div>
                  <div class="flex-1 min-w-0">
                    <span class="text-[10px] block font-mono font-bold truncate text-current">\${esc(file.fileName)}</span>
                    <audio src="\${esc(file.localUrl)}" controls class="w-full h-6 mt-1 scale-95 origin-left" style="outline:none;"></audio>
                  </div>
                </div>
                \`;
              } else if (file.fileType === 'video') {
                attachmentHtml = \`
                <div class="relative overflow-hidden rounded-xl bg-black my-1">
                  <video src="\${esc(file.localUrl)}" controls class="max-h-40 w-full rounded" onerror="this.outerHTML='<div class=\\'p-4 border border-dashed border-neutral-800 rounded text-center text-xs text-neutral-500 font-mono\\'>🎬 Video: \${esc(file.fileName)}</div>'"></video>
                </div>
                \`;
              } else {
                attachmentHtml = \`
                <a href="\${esc(file.localUrl)}" target="_blank" class="flex items-center gap-2.5 bg-black/5 p-2 rounded-xl my-1 border border-neutral-800 max-w-[215px] hover:bg-black/10 transition-colors text-left text-current">
                  <span class="text-xl shrink-0 select-none">📄</span>
                  <div class="min-w-0 flex-1 leading-snug">
                    <p class="font-bold truncate text-[11px] text-current">\${esc(file.fileName)}</p>
                    <p class="text-[9px] text-neutral-500 font-mono tracking-tight lowercase">offline zip archive</p>
                  </div>
                </a>
                \`;
              }
            }

            const senderLabel = !isMe ? \`<span class="text-[10.5px] font-bold tracking-tight mb-0.5 text-left leading-none \${speakerColorMap[msg.sender] || 'text-indigo-400'}">\${esc(msg.sender)}</span>\` : "";

            const bubbleClass = isMe ? preset.myBubble : preset.partnerBubble;
            const bubbleBorder = isMe ? "rounded-tr-xs" : "rounded-tl-xs";

            // Reactions pill if loaded
            let reactionsHtml = "";
            if (msg.reactions && msg.reactions.length > 0) {
              const reactionsBg = activeTheme === 'ios-light' ? 'bg-[#ece5dd] border-[#cbd5e1]' : 'bg-[#1f2c34] border-[#374151]';
              const reactionItems = Array.from(new Set(msg.reactions.map(r => r.emoji))).slice(0,3).join('');
              reactionsHtml = \`
              <div class="absolute -bottom-2 \${isMe ? 'right-3' : 'left-3'} px-1.5 py-0.5 border shadow rounded-full text-[10px] leading-none select-none \${reactionsBg}">
                <span>\${reactionItems}</span>
                \${msg.reactions.length > 1 ? \`<span class="pl-1 font-bold text-[8px]">\${msg.reactions.length}</span>\` : ''}
              </div>
              \`;
            }

            // High-contrast read double-check ticks for outgoing text messages
            const ticksHtml = isMe ? \`<span class="text-[#30d0c7] font-bold ml-0.5">✓✓</span>\` : "";

            wrap.innerHTML = \`
              <div class="max-w-[85%] rounded-2xl p-2.5 px-3 flex flex-col transition-all border border-transparent shadow-xs relative \${bubbleClass} \${bubbleBorder}">
                \${senderLabel}
                \${quoteHtml}
                \${attachmentHtml}
                \${msg.content && !msg.attachment ? \`<p class="text-xs text-left leading-relaxed break-all font-sans whitespace-pre-wrap">\${esc(msg.content)}</p>\` : ""}
                <span class="text-[8.5px] text-[#8e8e93] font-mono font-medium self-end mt-1 flex items-center gap-0.5 leading-none select-none">
                  <span>\${esc(msg.timeLabel)}</span>
                  \${ticksHtml}
                </span>
                \${reactionsHtml}
              </div>
            \`;
          }
          chatScroller.appendChild(wrap);
        });

        // Trigger smooth scroll to bottom initially
        chatScroller.scrollTop = chatScroller.scrollHeight;
      }

      // Live offline theme controls implementation
      function setTheme(tId) {
        activeTheme = tId;
        const config = themesMap[tId];

        // Apply visual button rings
        const keys = Object.keys(themesMap);
        keys.forEach(k => {
          const btn = document.getElementById("btn-theme-" + k);
          if (k === tId) {
            btn.className = "px-3.5 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase border border-[#bfff00] bg-[#bfff00]/10 text-[#bfff05] rounded shadow-md ring-1 ring-[#bfff00]/20";
          } else {
            btn.className = "px-3.5 py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase border border-neutral-800 bg-[#121212] hover:text-[#bfff00] hover:bg-neutral-850 text-neutral-400 transition-colors rounded";
          }
        });

        // Refresh phone frame background colors
        const container = document.getElementById("phoneContainer");
        const header = document.getElementById("chatHeader");
        const scroller = document.getElementById("chatScroller");
        const status = document.getElementById("statusBar");
        const footer = document.getElementById("chatFooter");

        const avatar = document.getElementById("headerAvatar");
        const hTitle = document.getElementById("headerTitle");

        if (tId === 'ios-light') {
          container.className = "w-full h-[710px] bg-[#efeae2] overflow-hidden flex flex-col relative text-slate-800";
          header.className = "p-2.5 px-3 flex items-center justify-between border-b shrink-0 z-20 bg-[#f6f6f6] text-black border-slate-200 shadow-3xs";
          status.className = "h-9 px-5 flex items-center justify-between text-[11px] font-bold z-30 select-none border-b border-gray-200/50 bg-[#f6f6f6] text-black";
          footer.className = "p-2.5 pb-4 px-3 flex items-center gap-2 select-none border-t border-slate-200 bg-[#f6f6f6] text-slate-700";
          
          avatar.className = "w-9 h-9 rounded-full bg-zinc-200 border border-black/5 flex items-center justify-center font-extrabold text-xs text-zinc-800 uppercase select-none shrink-0";
          hTitle.className = "font-bold text-[14px] truncate tracking-tight text-slate-900";

          scroller.style.backgroundImage = "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')";
          scroller.style.backgroundBlendMode = "normal";
          scroller.style.backgroundColor = "#efeae2";
        } else {
          container.className = \`w-full h-[710px] overflow-hidden flex flex-col relative \${config.textColor}\`;
          header.className = \`p-2.5 px-3 flex items-center justify-between border-b shrink-0 z-20 \${config.headerBg} \${config.headerText} \${config.headerBorder}\`;
          status.className = \`h-9 px-5 flex items-center justify-between text-[11px] font-bold z-30 select-none border-b border-white/5 \${config.headerBg} \${config.statusBarText}\`;
          footer.className = \`p-2.5 pb-4 px-3 flex items-center gap-2 select-none border-t bg-black/25 \${config.headerBorder}\`;

          avatar.className = "w-9 h-9 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center font-extrabold text-xs text-emerald-400 uppercase select-none shrink-0";
          hTitle.className = "font-bold text-[14px] truncate tracking-tight text-white";

          if (config.wallpaper) {
            scroller.style.backgroundImage = "url('" + config.wallpaper + "')";
            scroller.style.backgroundBlendMode = "multiply";
            scroller.style.backgroundColor = config.scrollerBg;
          } else {
            scroller.style.backgroundImage = "none";
            scroller.style.background = config.bg;
          }
        }

        // Apply header text values
        if (participants.length > 0) {
          const partnerName = alignUser ? participants.filter(p => p !== alignUser).join(', ') || alignUser : participants.join(', ');
          hTitle.textContent = partnerName;
          avatar.textContent = partnerName.slice(0, 2);
        }

        renderMessages();
      }

      function changeAlignUser(uName) {
        alignUser = uName;
        setTheme(activeTheme);
      }

      function filterMessages(kw) {
        filterQuery = kw;
        renderMessages();
      }

      // Boot application details initially
      setTheme(activeTheme);
    </script>
  </body>
</html>`;

    // Download file Blob action
    const blob = new Blob([fileContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChatReader_${chatTitle.replace(/\s+/g, '_') || 'Export'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setExportingHtml(false);
    }, 650);
  };

  // 3. Export to plain TXT file format
  const handleExportTxt = () => {
    const title = chatTitle || 'ChatReader_Transcript';
    const cleanLines = messages.map(msg => {
      if (msg.isSystem) {
        return `[SYSTEM] ${msg.content}`;
      }
      const dateStr = msg.timestamp.toLocaleDateString();
      const timeStr = msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      const senderText = msg.sender || 'Unknown';
      const attachmentText = msg.attachment ? ` <<Attachment: ${msg.attachment.fileName}>>` : '';
      const contentText = msg.content || '';
      return `[${dateStr} ${timeStr}] ${senderText}: ${contentText}${attachmentText}`;
    });

    const fileContent = cleanLines.join('\n');
    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ChatReader_${title.replace(/\s+/g, '_') || 'Transcript'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'html' | 'txt'>('pdf');
  const [previewTheme, setPreviewTheme] = useState<'ios-light' | 'ios-dark'>(theme === 'ios-light' ? 'ios-light' : 'ios-dark');
  const [previewPages, setPreviewPages] = useState<string[]>([]);
  const [previewZoom, setPreviewZoom] = useState<number>(0.75);

  const partitionMessages = (subjectMessages: ChatMessage[], selectedTheme: string): string[] => {
    const isL = selectedTheme === 'ios-light';
    const bgCol = isL ? '#efeae2' : '#0b141a';
    const hdBg = isL ? '#f0f2f5' : '#1f2c34';
    const hdText = isL ? '#111b21' : '#e9edef';
    const pName = Object.keys(stats.participants).filter(p => p !== alignUser).join(', ') || alignUser || 'Chat Group';

    const meCol = isL ? '#d9fdd3' : '#005c4b';
    const meTex = isL ? '#111b21' : '#e9edef';
    const partCol = isL ? '#ffffff' : '#202c33';
    const partTex = isL ? '#111b21' : '#e9edef';

    // Temporary element measuring channel
    const measureContainer = document.createElement('div');
    measureContainer.style.position = 'absolute';
    measureContainer.style.left = '-9999px';
    measureContainer.style.top = '-9999px';
    measureContainer.style.width = '560px';
    measureContainer.style.visibility = 'hidden';
    measureContainer.style.backgroundColor = bgCol;
    measureContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    document.body.appendChild(measureContainer);

    let currentIdx = 1;

    const makePage = () => {
      const el = document.createElement('div');
      el.style.width = '560px';
      el.style.padding = '24px 20px';
      el.style.boxSizing = 'border-box';
      el.style.backgroundColor = bgCol;
      el.style.color = isL ? '#111b21' : '#e9edef';
      return el;
    };

    let activePage = makePage();
    measureContainer.appendChild(activePage);

    const writeHeader = (el: HTMLDivElement, pageNumber: number) => {
      let headHtml = '';
      if (pageNumber === 1) {
        headHtml = `
          <div style="box-sizing: border-box; background-color: ${hdBg}; color: ${hdText}; padding: 12px 16px; display: flex; align-items: center; border-radius: 8px; margin-bottom: 20px; border: 1px solid ${isL ? '#e1e3e5' : '#222d34'};">
            <div style="width: 36px; height: 36px; background-color: ${isL ? '#ccc' : '#4f5e67'}; border-radius: 50%; margin-right: 12px; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; color: #fff;">
              ${pName.slice(0, 2).toUpperCase()}
            </div>
            <div style="flex: 1; text-align: left;">
              <div style="font-weight: bold; font-size: 14px; margin: 0; color: ${isL ? '#111b21' : '#e9edef'};">${esc(pName)}</div>
              <div style="font-size: 10px; opacity: 0.7; margin-top: 1px; color: ${isL ? '#667781' : '#8696a0'};">Chat Transcript • Page ${pageNumber}</div>
            </div>
          </div>
        `;
      } else {
        headHtml = `
          <div style="box-sizing: border-box; border-bottom: 1px solid ${isL ? '#e1e3e5' : '#222d34'}; padding-bottom: 6px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: ${isL ? '#667781' : '#8696a0'}; opacity: 0.85;">
            <div style="font-weight: bold;">${esc(pName)} • Chat Transcript</div>
            <div>Page ${pageNumber}</div>
          </div>
        `;
      }
      el.innerHTML = headHtml;
    };

    writeHeader(activePage, currentIdx);

    const makeMsgHtml = (msg: ChatMessage) => {
      if (msg.isSystem) {
        return `
        <div class="system-row" style="display: block; text-align: center; width: 100%; margin: 10px 0; clear: both; box-sizing: border-box;">
          <span class="system-pill" style="display: inline-block; background-color: ${isL ? 'rgba(255,255,255,0.95)' : '#182229'}; color: ${isL ? '#667781' : '#8696a0'}; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; border-radius: 7px; padding: 5px 12px; border: 1px solid ${isL ? '#e1e3e5' : 'rgba(255,255,255,0.04)'}; box-shadow: 0 1px 1.5px rgba(0,0,0,0.06); text-align: center;">
            ${esc(msg.content)}
          </span>
        </div>
        `;
      }

      const isMe = alignUser && msg.sender.toLowerCase().trim() === alignUser.toLowerCase().trim();
      const bBg = isMe ? meCol : partCol;
      const bText = isMe ? meTex : partTex;
      const floatDir = isMe ? 'right' : 'left';
      const radStyle = isMe ? 'border-top-right-radius: 0;' : 'border-top-left-radius: 0;';
      const ticks = isMe ? `<span style="color: ${isL ? '#53bdeb' : '#30d0c7'}; font-weight: bold; font-size: 10px; margin-left: 3px;">✓✓</span>` : '';
      const tmStr = msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const sHead = !isMe ? `<div class="bubble-sender" style="font-size: 10.5px; font-weight: bold; margin-bottom: 3px; color: ${isL ? '#008069' : '#53bdeb'}; font-family: -apple-system, sans-serif;">${esc(msg.sender)}</div>` : '';

      let attachHtml = '';
      if (msg.attachment) {
        const file = msg.attachment;
        if (file.fileType === 'image') {
          attachHtml = `
          <div class="attachment-box photo" style="border-radius: 6px; overflow: hidden; margin-bottom: 4px; display: block; width: 200px; height: 140px; background-color: rgba(0,0,0,0.1);">
            <img src="${esc(file.localUrl || file.fileName)}" onerror="this.outerHTML='<div class=\\'placeholder-file\\' style=\\'padding: 16px; border: 1px dashed rgba(255,255,255,0.15); border-radius: 6px; text-align: center; font-size: 11px; font-family: monospace; opacity: 0.7;\\'>📷 Photo: ${esc(file.fileName)}</div>'" style="width: 200px; height: 140px; object-fit: cover; border-radius: 6px; display: block;" />
          </div>`;
        } else {
          attachHtml = `
          <div class="attachment-box generic" style="border-radius: 6px; overflow: hidden; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.08); padding: 8px; font-family: -apple-system, sans-serif;">
            <span class="doc-icon" style="font-size: 16px;">📄</span>
            <span class="doc-name" style="font-size: 11px; opacity: 0.9; word-break: break-all; color: ${bText};">${esc(file.fileName)}</span>
          </div>`;
        }
      }

      return `
      <div class="msg-row" style="display: block; width: 100%; margin-bottom: 8px; clear: both; box-sizing: border-box;">
        <div class="bubble" style="float: ${floatDir}; max-width: 80%; padding: 8px 12px; border-radius: 10px; ${radStyle} background-color: ${bBg}; color: ${bText}; font-size: 13px; line-height: 1.45; box-shadow: 0 1px 1px rgba(0,0,0,0.08); word-wrap: break-word; display: inline-block; text-align: left; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
          ${sHead}
          ${attachHtml}
          ${msg.content ? `<div class="bubble-content" style="white-space: pre-wrap; word-break: break-word; ${msg.attachment ? 'margin-top: 4px;' : ''}">${esc(msg.content)}</div>` : ''}
          <div class="bubble-meta" style="font-size: 8.5px; opacity: 0.65; display: block; text-align: right; margin-top: 4px;">
            ${tmStr}
            ${ticks}
          </div>
        </div>
      </div>
      `;
    };

    const outPages: string[] = [];

    subjectMessages.forEach((msg) => {
      const bWrapper = document.createElement('div');
      bWrapper.innerHTML = makeMsgHtml(msg);
      activePage.appendChild(bWrapper);

      if (activePage.scrollHeight > 740) {
        activePage.removeChild(bWrapper);
        outPages.push(activePage.innerHTML);

        currentIdx++;
        activePage = makePage();
        measureContainer.appendChild(activePage);
        writeHeader(activePage, currentIdx);
        activePage.appendChild(bWrapper);
      }
    });

    outPages.push(activePage.innerHTML);
    document.body.removeChild(measureContainer);
    return outPages;
  };

  const computePreviewPages = (selectedTheme: string): string[] => {
    // Only compile the latest 250 dialogue blocks for visual performance
    return partitionMessages(messages.slice(-250), selectedTheme);
  };

  // 2. High-fidelity dynamic PDF generation over ALL messages (No limit) via page-by-page drawing
  const handleExportPdf = async () => {
    setExportingPdf(true);
    setPdfProgressText('Initializing full chat compilation...');
    
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // Partition ALL messages into A4 pages with no message limit restriction
      const allPageHtmlStrings = partitionMessages(messages, previewTheme);
      const totalPages = allPageHtmlStrings.length;
      
      setPdfProgressText(`Paginated into ${totalPages} visual sheets. Initializing PDF document...`);
      await new Promise(resolve => setTimeout(resolve, 50));

      const isL = previewTheme === 'ios-light';
      const bgColorCode = isL ? '#efeae2' : '#0b141a';

      // Setup jsPDF with robust positional parameters [560px, 792px]
      const pdf = new jsPDF('p', 'px', [560, 792]);

      // Temporary browser mount styled as fixed hidden view allowing canvas capture safe from viewport clipping
      const buildParent = document.createElement('div');
      buildParent.style.position = 'fixed';
      buildParent.style.top = '0';
      buildParent.style.left = '0';
      buildParent.style.width = '560px';
      buildParent.style.height = '792px';
      buildParent.style.zIndex = '-99999';
      buildParent.style.pointerEvents = 'none';
      buildParent.style.overflow = 'hidden';
      document.body.appendChild(buildParent);

      for (let i = 0; i < totalPages; i++) {
        setPdfProgressText(`Rendering sheet ${i + 1} of ${totalPages} to crisp PDF page...`);
        
        // Setup individual page layout to render in canvas
        const pageEl = document.createElement('div');
        pageEl.style.width = '560px';
        pageEl.style.height = '792px';
        pageEl.style.boxSizing = 'border-box';
        pageEl.style.overflow = 'hidden';
        pageEl.style.backgroundColor = bgColorCode;
        pageEl.style.color = isL ? '#111b21' : '#e9edef';
        pageEl.style.padding = '24px 20px';
        pageEl.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        pageEl.innerHTML = allPageHtmlStrings[i];
        buildParent.appendChild(pageEl);

        // Render to canvas with safe CORS failover structure
        let canvas;
        try {
          canvas = await html2canvas(pageEl, {
            scale: 1.5, // Crisp 1.5 density ratio
            useCORS: true,
            logging: false,
            backgroundColor: bgColorCode
          });
        } catch (canvasErr) {
          console.warn(`Primary CORS render failed for sheet ${i + 1}, falling back to local-only safety render`, canvasErr);
          // Strip photos and attachments to guarantee compilation completes instead of throwing taint errors
          const imageAttachments = pageEl.querySelectorAll('img');
          imageAttachments.forEach(img => {
            const replacePill = document.createElement('div');
            replacePill.style.border = '1px dashed rgba(125,125,125,0.4)';
            replacePill.style.padding = '10px 16px';
            replacePill.style.borderRadius = '8px';
            replacePill.style.textAlign = 'center';
            replacePill.style.fontSize = '9.5px';
            replacePill.style.fontFamily = 'monospace';
            replacePill.style.margin = '4px 0';
            replacePill.textContent = '📷 Media Attachment (Compressed in PDF)';
            img.replaceWith(replacePill);
          });

          canvas = await html2canvas(pageEl, {
            scale: 1.2,
            useCORS: false,
            logging: false,
            backgroundColor: bgColorCode
          });
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) {
          pdf.addPage([560, 792], 'portrait');
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, 560, 792, undefined, 'FAST');
        
        // Remove the page element to keep memory pristine
        buildParent.removeChild(pageEl);

        // Yield execution to make sure browser never freezes
        await new Promise((resolve) => setTimeout(resolve, 15));
      }

      setPdfProgressText('Saving PDF archive file...');
      pdf.save(`Chatbook_${chatTitle.replace(/\s+/g, '_') || 'Export'}.pdf`);
      document.body.removeChild(buildParent);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setExportingPdf(false);
      setPdfProgressText('');
    }
  };

  useEffect(() => {
    if (isOpen && selectedFormat === 'pdf') {
      try {
        const generated = computePreviewPages(previewTheme);
        setPreviewPages(generated);
      } catch (err) {
        console.error("Unable to compile print layout pages of chat:", err);
      }
    }
  }, [isOpen, selectedFormat, previewTheme, messages, alignUser]);

  const handleDownloadActiveFormat = () => {
    if (selectedFormat === 'pdf') {
      handleExportPdf();
    } else if (selectedFormat === 'html') {
      handleExportHtml();
    } else {
      handleExportTxt();
    }
  };

  const getTxtPreviewText = () => {
    const title = chatTitle || 'ChatReader_Transcript';
    const linesSlice = messages.slice(0, 50).map(msg => {
      if (msg.isSystem) {
        return `[SYSTEM] ${msg.content}`;
      }
      const dStr = msg.timestamp.toLocaleDateString();
      const tStr = msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
      const senderText = msg.sender || 'Unknown';
      const attachmentText = msg.attachment ? ` <<Attachment: ${msg.attachment.fileName}>>` : '';
      const contentText = msg.content || '';
      return `[${dStr} ${tStr}] ${senderText}: ${contentText}${attachmentText}`;
    });
    if (messages.length > 50) {
      linesSlice.push(`\n... [Truncated: ${messages.length - 50} more dialogue blocks in final download] ...`);
    }
    return linesSlice.join('\n');
  };

  // Theme palettes computed for preview window wrappers
  const isLight = theme === 'ios-light';
  const bgColor = isLight ? '#efeae2' : '#0b141a';
  const headerBg = isLight ? '#f0f2f5' : '#1f2c34';
  const headerText = isLight ? '#111b21' : '#e9edef';
  const partnerName = Object.keys(stats.participants).filter(p => p !== alignUser).join(', ') || alignUser || 'Chat Group';

  const printGroupedDates = useMemo(() => {
    const groups: { dateKey: string; items: ChatMessage[] }[] = [];
    let currentKey = '';
    let currentItems: ChatMessage[] = [];

    messages.forEach(msg => {
      let dateKey = '';
      if (msg.isSystem) {
        dateKey = 'System';
      } else {
        dateKey = msg.timestamp.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }

      if (dateKey !== currentKey) {
        if (currentKey) {
          groups.push({ dateKey: currentKey, items: currentItems });
        }
        currentKey = dateKey;
        currentItems = [msg];
      } else {
        currentItems.push(msg);
      }
    });

    if (currentKey) {
      groups.push({ dateKey: currentKey, items: currentItems });
    }

    return groups;
  }, [messages]);

  return (
    <div className="w-full flex justify-center py-2" id="export-action-container">
      {/* Prime Main Direct Action Trigger */}
      <button
        type="button"
        onClick={() => {
          setSelectedFormat('pdf');
          setIsOpen(true);
        }}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-[#bfff00] hover:bg-white text-black font-mono font-black tracking-wider uppercase transition-all duration-200 active:scale-98 cursor-pointer shadow-lg"
        id="trigger-export-dialog-btn"
      >
        <Download className="w-4.5 h-4.5 shrink-0" />
        <span>DOWNLOAD CHATBOOK</span>
        <ChevronDown className="w-4 h-4 shrink-0 opacity-70" />
      </button>

      {/* Modern High-End Multi-Format Split Screen Studio Preview Drawer */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4 animate-fadeIn" 
          id="export-format-modal"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={`w-full max-w-6xl h-[92vh] sm:h-[86vh] rounded-none shadow-2xl overflow-hidden flex flex-col md:flex-row justify-start border ${
              isLight 
                ? 'bg-white border-slate-250 text-slate-900' 
                : 'bg-[#0c0c0e] border-neutral-800'
            }`}
            id="export-modal-body"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Control Column panel */}
            <div className={`w-full md:w-[380px] shrink-0 md:border-r flex flex-col justify-between h-full overflow-hidden ${
              isLight 
                ? 'bg-slate-50 border-slate-200' 
                : 'bg-[#09090b] border-neutral-900'
            }`} id="preview-control-panel">
              
              {/* Selector branding & statistics heading */}
              <div className={`p-5 border-b space-y-3 shrink-0 ${
                isLight ? 'bg-slate-100/50 border-slate-200' : 'bg-black/40 border-neutral-900'
              }`}>
                <div className="flex justify-between items-center">
                  <span className={`text-[8px] font-mono font-bold px-2 py-0.5 uppercase tracking-widest border ${
                    isLight 
                      ? 'bg-slate-100 text-slate-800 border-slate-300' 
                      : 'bg-[#bfff00]/15 text-[#bfff00] border-[#bfff00]/20'
                  }`}>
                    STUDIO WORKSPACE
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className={`font-mono text-[9px] px-2 py-1 uppercase tracking-wider border cursor-pointer transition-all ${
                      isLight 
                        ? 'text-slate-600 hover:text-slate-900 border-slate-250 hover:bg-slate-100' 
                        : 'text-neutral-500 hover:text-white border-neutral-850 hover:bg-neutral-900'
                    }`}
                    id="export-close-btn"
                  >
                    ✕ CLOSE
                  </button>
                </div>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-wider font-mono ${
                    isLight ? 'text-slate-900' : 'text-white'
                  }`}>
                    DOWNLOAD CHATBOOK
                  </h3>
                  <p className={`text-[10px] mt-1.5 font-mono uppercase truncate ${
                    isLight ? 'text-slate-600' : 'text-neutral-500'
                  }`}>
                    ARCHIVE: {chatTitle.replace(/\s+/g, '_') || 'chat'}
                  </p>
                </div>
              </div>

              {/* Selection Options Frame */}
              <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
                <span className={`text-[9px] font-mono tracking-wider uppercase font-bold block mb-1 ${
                  isLight ? 'text-slate-500' : 'text-neutral-400'
                }`}>
                  1. CHOOSE DOWNLOAD FORMAT
                </span>

                {/* Option Slider 1: PDF WhatsApp screenshot replica */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat('pdf')}
                  className={`w-full text-left p-3.5 transition-all duration-200 flex gap-3 cursor-pointer outline-hidden items-start border ${
                    isLight
                      ? selectedFormat === 'pdf'
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      : selectedFormat === 'pdf' 
                        ? 'bg-neutral-900/80 border-[#bfff00]/50 shadow-md ring-1 ring-[#bfff00]/20' 
                        : 'bg-neutral-950/40 border-neutral-850 hover:bg-[#121214] hover:border-neutral-700'
                  }`}
                  id="select-format-pdf-card"
                >
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border ${
                    isLight
                      ? selectedFormat === 'pdf' ? 'bg-emerald-100 border-emerald-300' : 'bg-slate-100 border-slate-250'
                      : selectedFormat === 'pdf' ? 'bg-[#bfff00]/15 border-[#bfff00]/25' : 'bg-neutral-900 border-neutral-800'
                  }`}>
                    <Printer className={`w-4 h-4 ${
                      isLight
                        ? selectedFormat === 'pdf' ? 'text-emerald-700' : 'text-slate-500'
                        : selectedFormat === 'pdf' ? 'text-[#bfff00]' : 'text-zinc-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono font-black text-[11px] uppercase ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        Screenshot Replica PDF
                      </span>
                      <span className="text-[8px] bg-sky-950 text-sky-450 border border-sky-850 font-bold font-mono px-1 rounded-xs uppercase">
                        .pdf
                      </span>
                    </div>
                    <p className={`text-[10px] leading-relaxed mt-1 ${
                      isLight ? 'text-slate-600' : 'text-zinc-500'
                    }`}>
                      Visual catalog design. Virtual pages mapped with realistic message clouds, color tickers, and exact custom themes.
                    </p>
                  </div>
                </button>

                {/* Option Slider 2: Standalone Interactive HTML Simulation */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat('html')}
                  className={`w-full text-left p-3.5 transition-all duration-200 flex gap-3 cursor-pointer outline-hidden items-start border ${
                    isLight
                      ? selectedFormat === 'html'
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      : selectedFormat === 'html' 
                        ? 'bg-neutral-900/80 border-[#bfff00]/50 shadow-md ring-1 ring-[#bfff00]/20' 
                        : 'bg-neutral-950/40 border-neutral-850 hover:bg-[#121214] hover:border-neutral-700'
                  }`}
                  id="select-format-html-card"
                >
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border ${
                    isLight
                      ? selectedFormat === 'html' ? 'bg-emerald-100 border-emerald-300' : 'bg-slate-100 border-slate-250'
                      : selectedFormat === 'html' ? 'bg-[#bfff00]/15 border-[#bfff00]/25' : 'bg-neutral-900 border-neutral-800'
                  }`}>
                    <Download className={`w-4 h-4 ${
                      isLight
                        ? selectedFormat === 'html' ? 'text-emerald-700' : 'text-slate-500'
                        : selectedFormat === 'html' ? 'text-[#bfff00]' : 'text-zinc-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono font-black text-[11px] uppercase ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        Interactive HTML Code
                      </span>
                      <span className="text-[8px] bg-emerald-950 text-emerald-400 border border-emerald-850 font-bold font-mono px-1 rounded-xs uppercase">
                        .html
                      </span>
                    </div>
                    <p className={`text-[10px] leading-relaxed mt-1 ${
                      isLight ? 'text-slate-600' : 'text-zinc-500'
                    }`}>
                      Standalone simulated webapp. Offline metrics graphs, reactions search, and light/dark instant theme toggling.
                    </p>
                  </div>
                </button>

                {/* Option Slider 3: Plain Text Log */}
                <button
                  type="button"
                  onClick={() => setSelectedFormat('txt')}
                  className={`w-full text-left p-3.5 transition-all duration-200 flex gap-3 cursor-pointer outline-hidden items-start border ${
                    isLight
                      ? selectedFormat === 'txt'
                        ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-200'
                        : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                      : selectedFormat === 'txt' 
                        ? 'bg-neutral-900/80 border-[#bfff00]/50 shadow-md ring-1 ring-[#bfff00]/20' 
                        : 'bg-neutral-950/40 border-neutral-850 hover:bg-[#121214] hover:border-neutral-700'
                  }`}
                  id="select-format-txt-card"
                >
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center shrink-0 border ${
                    isLight
                      ? selectedFormat === 'txt' ? 'bg-emerald-100 border-emerald-300' : 'bg-slate-100 border-slate-250'
                      : selectedFormat === 'txt' ? 'bg-[#bfff00]/15 border-[#bfff00]/25' : 'bg-neutral-900 border-neutral-800'
                  }`}>
                    <FileText className={`w-4 h-4 ${
                      isLight
                        ? selectedFormat === 'txt' ? 'text-emerald-700' : 'text-slate-500'
                        : selectedFormat === 'txt' ? 'text-[#bfff00]' : 'text-zinc-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-mono font-black text-[11px] uppercase ${
                        isLight ? 'text-slate-900' : 'text-white'
                      }`}>
                        Raw Plain Text Log
                      </span>
                      <span className="text-[8px] bg-yellow-950 text-yellow-400 border border-yellow-850 font-bold font-mono px-1 rounded-xs uppercase">
                        .txt
                      </span>
                    </div>
                    <p className={`text-[10px] leading-relaxed mt-1 ${
                      isLight ? 'text-slate-600' : 'text-zinc-500'
                    }`}>
                      Plain txt transcription logs. Chronological records of chat timestamps & attachments – ideal for indexing or AI analysis.
                    </p>
                  </div>
                </button>

                {/* Formatting specific toggle selectors */}
                {selectedFormat === 'pdf' && (
                  <div className="pt-3 border-t border-neutral-900 space-y-2 animate-fadeIn" id="pdf-customizer-pane">
                    <span className="text-[8.5px] font-mono text-neutral-500 tracking-wider uppercase font-bold block">
                      CUSTOMIZE PDF THEME STYLE
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewTheme('ios-dark')}
                        className={`py-1.5 px-3 font-mono text-[9px] font-bold border cursor-pointer uppercase tracking-wider text-center transition-all ${
                          isLight
                            ? previewTheme === 'ios-dark'
                              ? 'bg-slate-900 text-white border-slate-700 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                            : previewTheme === 'ios-dark'
                              ? 'bg-black text-white border-neutral-700'
                              : 'bg-neutral-950 text-zinc-500 border-neutral-900 hover:text-white'
                        }`}
                        id="pdf-theme-preset-dark"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Moon className="w-3 h-3 text-sky-450" /> DARK STYLE
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTheme('ios-light')}
                        className={`py-1.5 px-3 font-mono text-[9px] font-bold border cursor-pointer uppercase tracking-wider text-center transition-all ${
                          isLight
                            ? previewTheme === 'ios-light'
                              ? 'bg-slate-900 text-white border-slate-700 shadow-sm'
                              : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                            : previewTheme === 'ios-light'
                              ? 'bg-neutral-100 text-black border-neutral-300'
                              : 'bg-neutral-950 text-zinc-500 border-neutral-900 hover:text-white'
                        }`}
                        id="pdf-theme-preset-light"
                      >
                        <span className="inline-flex items-center gap-1">
                          <Sun className="w-3 h-3 text-amber-500" /> LIGHT STYLE
                        </span>
                      </button>
                    </div>

                  </div>
                )}
              </div>

              {/* Action Trigger Block */}
              <div className="p-5 border-t border-neutral-900 bg-neutral-950/70 space-y-3 shrink-0">
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase">
                  <span>TOTAL MESSAGES:</span>
                  <span className={isLight ? "text-slate-900 font-bold" : "text-white font-bold"}>{messages.length.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-400 uppercase">
                  <span>EST. TOTAL SIZE:</span>
                  <span className={isLight ? "text-slate-900 font-bold" : "text-white font-bold"}>~{getFileSize(chatTitle)}</span>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadActiveFormat}
                  disabled={exportingHtml || exportingPdf}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-[#bfff00] hover:bg-white text-black font-mono font-black text-xs tracking-wider uppercase transition-all duration-200 active:scale-98 cursor-pointer shadow-lg mt-1"
                  id="final-preview-download-btn"
                >
                  {(exportingHtml || exportingPdf) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>COMPILING FILE...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 shrink-0" />
                      <span>DOWNLOAD .{selectedFormat.toUpperCase()} NOW</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Right Live Canvas Preview Panel */}
            <div className="hidden md:flex flex-1 bg-[#101012] flex-col justify-between overflow-hidden relative" id="preview-workspace-pane">
              
              {/* Workspace Header Panel */}
              <div className="p-4 px-6 border-b border-neutral-900 bg-neutral-950/50 flex flex-wrap justify-between items-center gap-3 select-none">
                <div className="flex items-center gap-2">
                  <Eye className="w-3.5 h-3.5 text-[#bfff00]" />
                  <span className="text-[10px] font-mono font-bold tracking-widest text-neutral-400 uppercase">
                    LIVE RENDER VIEWPORT ({selectedFormat.toUpperCase()})
                  </span>
                </div>

                {/* Zoom Controller specifically for PDF Pages Preview */}
                {selectedFormat === 'pdf' && (
                  <div className="flex items-center gap-3 bg-black border border-neutral-850 px-3 py-1.5" id="canvas-zoom-slider-box">
                    <span className="text-[8.5px] font-mono text-neutral-500 uppercase font-black">PREVIEW ZOOM:</span>
                    <input 
                      type="range"
                      min="0.45"
                      max="1.15"
                      step="0.05"
                      value={previewZoom}
                      onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                      className="w-24 accent-[#bfff05] bg-neutral-850 h-1 cursor-pointer"
                    />
                    <span className="text-[8.5px] font-mono text-[#bfff00] font-bold w-8 text-center">
                      {Math.round(previewZoom * 100)}%
                    </span>
                  </div>
                )}
                
                <span className="text-[8px] px-2 py-0.5 bg-neutral-900 border border-neutral-850 text-neutral-550 font-mono tracking-widest uppercase font-semibold">
                  SPOOL_READY
                </span>
              </div>

              {/* Viewport Render Case Handler */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-neutral-900/30 w-full" id="viewport-canvas-wrapper">
                
                {/* CASE A: Printable PDF Virtual Page Array */}
                {selectedFormat === 'pdf' && (
                  <div className="flex flex-col items-center w-full min-w-[580px] origin-top pt-2" id="pdf-stacked-view">
                    
                    {/* Small notice about page numbers and subset restriction */}
                    <div className="w-[560px] bg-sky-950/20 text-sky-400 text-[9.5px] border border-sky-900/40 p-3 mb-6 font-sans leading-relaxed flex items-start gap-2 max-w-full">
                      <span className="text-sm">🗣️</span>
                      <div>
                        <p className="font-bold font-mono text-[9px] uppercase tracking-wider text-sky-200">PDF Layout Preview Mode</p>
                        <p className="mt-0.5">Below is the exact output representation of your finished PDF pages. For optimal on-device UI rendering cache speed, this live preview streams up to 250 dialogue blocks. Your downloaded PDF will contain the full history budget.</p>
                      </div>
                    </div>

                    {previewPages.length > 0 ? (
                      <div className="flex flex-col items-center gap-6 pb-20">
                        {previewPages.map((pageHtml, idx) => {
                          const isL = previewTheme === 'ios-light';
                          return (
                            <div 
                              key={idx} 
                              className="relative shadow-2xl transition-all duration-200 border border-neutral-850 hover:border-neutral-700 hover:shadow-[#bfff00]/2 bg-neutral-950"
                              style={{
                                width: `${560 * previewZoom}px`,
                                height: `${792 * previewZoom}px`,
                                overflow: 'hidden'
                              }}
                              id={`preview-page-envelope-${idx}`}
                            >
                              <div
                                style={{
                                  transform: `scale(${previewZoom})`,
                                  transformOrigin: 'top left',
                                  width: '560px',
                                  height: '792px',
                                  boxSizing: 'border-box',
                                  backgroundColor: isL ? '#efeae2' : '#0b141a',
                                  color: isL ? '#111b21' : '#e9edef',
                                  padding: '24px 20px',
                                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                                }}
                                className="overflow-hidden"
                                dangerouslySetInnerHTML={{ __html: pageHtml }}
                              />
                              
                              {/* Stacked indicator badges */}
                              <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md text-[8px] font-mono text-neutral-400 px-2 py-0.5 border border-neutral-800 uppercase tracking-widest select-none">
                                Page {idx + 1} of {previewPages.length}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64 font-mono text-xs text-neutral-600">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-700 mb-3" />
                        <span>PRE-COMPILING RENDER PREVIEW PAGES...</span>
                      </div>
                    )}
                  </div>
                )}

                {/* CASE B: Standalone HTML Replica Device Mockup */}
                {selectedFormat === 'html' && (
                  <div className="w-full max-w-lg flex flex-col justify-start items-center pt-3 select-none" id="html-device-mock">
                    <div className="w-full bg-[#0d0d0f] border border-neutral-850 rounded-lg overflow-hidden flex flex-col shadow-2xl h-[460px]">
                      {/* Browser Header Bar */}
                      <div className="bg-[#131317] border-b border-neutral-900 px-4 py-2 flex items-center justify-between shrink-0 font-mono text-[9px] text-zinc-500">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
                          <span className="ml-2 bg-neutral-900 border border-neutral-850 px-2 py-0.5 rounded-xs tracking-tight">
                            file:///ChatReader_{chatTitle.replace(/\s+/g, '_') || 'Export'}.html
                          </span>
                        </div>
                        <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px]">● SPA BUILDER</span>
                      </div>

                      {/* Mock content representation */}
                      <div className="p-6 overflow-y-auto flex-1 bg-[#09090b] text-neutral-200 flex flex-col justify-between font-sans">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 border-b border-neutral-900 pb-3">
                            <Sparkles className="w-4 h-4 text-[#bfff00]" />
                            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#bfff00]">
                              CLIENT-SIDE SIMULATION ARCHIVE
                            </span>
                          </div>
                          
                          <p className="text-[11px] leading-relaxed text-zinc-400 font-sans">
                            Your exported HTML contains a responsive chat replay dashboard with modern features. Open the downloaded file in Google Chrome, Safari, or Microsoft Edge.
                          </p>

                          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono uppercase tracking-tight pt-1">
                            <div className="bg-[#121215] border border-neutral-850 p-2.5 rounded-xs">
                              <span className="text-[#bfff00]">✓ TEXT SEARCH</span>
                              <p className="text-[8px] text-neutral-500 mt-0.5">Query index offline</p>
                            </div>
                            <div className="bg-[#121215] border border-neutral-850 p-2.5 rounded-xs">
                              <span className="text-[#bfff00]">✓ CONTACT TABS</span>
                              <p className="text-[8px] text-neutral-500 mt-0.5">Filter message sender</p>
                            </div>
                            <div className="bg-[#121215] border border-neutral-850 p-2.5 rounded-xs">
                              <span className="text-[#bfff00]">✓ COMPACT TOGGLES</span>
                              <p className="text-[8px] text-neutral-500 mt-0.5">Stats and metrics</p>
                            </div>
                            <div className="bg-[#121215] border border-neutral-850 p-2.5 rounded-xs">
                              <span className="text-[#bfff00]">✓ DESIGN THEMES</span>
                              <p className="text-[8px] text-neutral-500 mt-0.5">Light or dark sync</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-[#141417]/60 border border-neutral-900 p-3 flex justify-between items-center text-[9px] font-mono uppercase mt-6">
                          <span className="text-neutral-500">Stand-Alone Package Capacity:</span>
                          <span className="text-zinc-200 font-black">{messages.length.toLocaleString()} messages</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CASE C: Plain text terminal/console viewer mockup */}
                {selectedFormat === 'txt' && (
                  <div className="w-full max-w-2xl flex flex-col justify-start pt-3" id="plaintext-code-mock">
                    <div className="w-full bg-[#0a0a0d] border border-neutral-850 rounded-lg overflow-hidden flex flex-col shadow-2xl h-[460px]">
                      {/* Monospace tab panel header */}
                      <div className="bg-[#121216] border-b border-neutral-900 px-4 py-2 flex justify-between items-center text-[9px] font-mono text-neutral-500 select-none uppercase">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-500 font-bold">📄</span>
                          <span className="tracking-tight text-neutral-400 font-bold font-mono">
                            {chatTitle.replace(/\s+/g, '_') || 'ChatReader'}.txt — Plain transcript file
                          </span>
                        </div>
                        <span>UTF-8 • LINE BY LINE TEXT</span>
                      </div>
                      <div className="flex-1 p-5 overflow-auto font-mono text-[10px] text-zinc-300 bg-[#050506] leading-relaxed whitespace-pre select-all text-left">
                        {getTxtPreviewText()}
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Compiler global loading overlay */}
      {(exportingHtml || exportingPdf) && (
        <div className="fixed inset-0 z-[100050] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 select-none animate-fadeIn">
          <div className="w-12 h-12 border-2 border-[#bfff00] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-[#bfff00] font-mono font-black uppercase tracking-widest text-xs mt-6 animate-pulse">
            {exportingPdf ? 'COMPILING CHATBOOK PDF...' : 'COMPILING CHATBOOK ARCHIVE FILES...'}
          </span>
          {exportingPdf && pdfProgressText && (
            <div className="mt-3 bg-neutral-900 border border-[#bfff00]/25 rounded-md px-4 py-2 text-[#bfff00] font-mono text-[11px] font-bold shadow-lg animate-pulse text-center">
              {pdfProgressText}
            </div>
          )}
          <p className="text-neutral-500 text-[9.5px] font-mono uppercase tracking-wider mt-3 max-w-sm text-center leading-relaxed">
            {exportingPdf 
              ? 'Please remain on the page while the on-device graphics engine packages your high-fidelity screenshot assets.'
              : 'Please remain on the page while the on-device engine builds your standalone HTML file.'
            }
          </p>
        </div>
      )}

      {/* PORTAL FOR HIGH-FIDELITY VECTOR PRINT TO PDF (100% full dialogue range, zero budgets limitation, zero freezes!) */}
      {createPortal(
        <div className="hidden print:block absolute inset-0 bg-white text-black z-50 text-left font-sans" id="print-chatbook-container-portable" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
          {/* HEADER SECTION --- PRINT ONLY */}
          <div 
            className="p-5 flex items-center justify-between border-b shrink-0 animate-fadeIn"
            style={{
              backgroundColor: previewTheme === 'ios-light' ? '#f0f2f5' : '#1f2c34',
              borderColor: previewTheme === 'ios-light' ? '#e1e3e5' : '#222d34',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-xs uppercase"
                style={{
                  backgroundColor: previewTheme === 'ios-light' ? '#ccc' : '#4f5e67',
                  color: '#fff',
                }}
              >
                {partnerName.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm" style={{ color: previewTheme === 'ios-light' ? '#111b21' : '#e9edef' }}>{partnerName}</h4>
                <p className="text-[10px] text-gray-400 font-mono uppercase">Archived Chat Transcript • All {messages.length.toLocaleString()} Messages</p>
              </div>
            </div>
          </div>

          {/* CHATBUBBLES CONTAINER --- PRINT ONLY */}
          <div 
            className="p-6 space-y-3 min-h-screen text-left"
            style={{
              backgroundColor: previewTheme === 'ios-light' ? '#efeae2' : '#0b141a',
            }}
          >
            {printGroupedDates.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-2">
                {group.dateKey !== 'System' && (
                  <div className="flex justify-center my-4 break-inside-avoid page-break-inside-avoid">
                    <span className={`px-3 py-1 text-[10px] font-bold rounded-full border ${
                      previewTheme === 'ios-light' 
                        ? 'bg-neutral-200 border-neutral-300 text-neutral-800' 
                        : 'bg-neutral-805 border-neutral-800 text-neutral-300'
                    }`}>
                      {group.dateKey.toUpperCase()}
                    </span>
                  </div>
                )}

                {group.items.map(msg => {
                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2 text-center break-inside-avoid page-break-inside-avoid">
                        <span className="px-3.5 py-1 text-[9.5px] bg-[#182229] border border-transparent rounded-lg text-gray-400 italic font-medium whitespace-pre-wrap max-w-sm">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  const isMe = alignUser && msg.sender.toLowerCase().trim() === alignUser.toLowerCase().trim();
                  const timeStr = msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
                  const ticksPill = isMe ? <span style={{ color: previewTheme === 'ios-light' ? '#53bdeb' : '#30d0c7', marginLeft: '3px' }}>✓✓</span> : null;

                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-2 break-inside-avoid page-break-inside-avoid`}>
                      <div 
                        className="p-2.5 px-3 rounded-2xl flex flex-col shadow-xs max-w-[80%] border border-transparent whitespace-pre-wrap relative text-left"
                        style={{
                          backgroundColor: isMe 
                            ? (previewTheme === 'ios-light' ? '#d9fdd3' : '#005c4b') 
                            : (previewTheme === 'ios-light' ? '#ffffff' : '#202c33'),
                          color: isMe 
                            ? (previewTheme === 'ios-light' ? '#111b21' : '#e9edef') 
                            : (previewTheme === 'ios-light' ? '#111b21' : '#e9edef'),
                          borderTopRightRadius: isMe ? '0px' : '16px',
                          borderTopLeftRadius: !isMe ? '0px' : '16px',
                        }}
                      >
                        {!isMe && (
                          <span className={`text-[10.5px] font-bold tracking-tight mb-1 text-left ${
                            previewTheme === 'ios-light' ? 'text-[#008069]' : 'text-cyan-400'
                          }`}>
                            {msg.sender}
                          </span>
                        )}

                        {msg.replyTo && (
                          <div 
                            className="mb-1.5 p-1.5 rounded text-[10px] border-l-[3.5px] leading-tight text-left"
                            style={{
                              backgroundColor: previewTheme === 'ios-light' ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
                              borderLeftColor: previewTheme === 'ios-light' ? '#008069' : '#0ea5e9',
                            }}
                          >
                            <span className="block font-black text-[9px] uppercase tracking-wide opacity-80">{msg.replyTo.sender}</span>
                            <span className="opacity-75">{msg.replyTo.content}</span>
                          </div>
                        )}

                        {msg.attachment && (
                          <div className="mb-1">
                            {msg.attachment.fileType === 'image' ? (
                              <img 
                                src={msg.attachment.localUrl || msg.attachment.fileName} 
                                alt="Attachment" 
                                className="max-h-52 w-full object-cover rounded-lg"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLElement).outerHTML = `<div style="padding: 12px; border: 1px dashed rgba(125,125,125,0.5); font-family: monospace; text-align: center; font-size: 10px;">📷 Photo: ${msg.attachment?.fileName}</div>`;
                                }}
                              />
                            ) : (
                              <div className="p-2 bg-black/10 rounded-lg flex items-center gap-2 text-left">
                                <span className="text-lg">📄</span>
                                <span className="text-[10px] truncate">{msg.attachment.fileName}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {msg.content && <p className="text-xs text-left leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>}

                        <span className="text-[8px] opacity-65 font-mono text-right mt-1.5 flex items-center justify-end gap-0.5 leading-none select-none">
                          <span>{timeStr}</span>
                          {ticksPill}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}

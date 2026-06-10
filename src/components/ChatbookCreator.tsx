/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, ChatStats } from '../types';
import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  BookOpen, 
  Printer, 
  FileText, 
  Download, 
  Heart, 
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Columns,
  RefreshCw,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface ChatbookCreatorProps {
  messages: ChatMessage[];
  stats: ChatStats;
  fileName: string;
}

type ThemePreset = 'whatsapp' | 'pink' | 'cosmic' | 'minimal';
type FontTheme = 'serif' | 'sans' | 'mono';

export default function ChatbookCreator({ messages, stats, fileName }: ChatbookCreatorProps) {
  // 1. Cover Config State
  const defaultTitle = useMemo(() => {
    const withoutExt = fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
    return `The Chronicles of ${withoutExt}`;
  }, [fileName]);

  const [coverTitle, setCoverTitle] = useState(defaultTitle);
  const [coverSubtitle, setCoverSubtitle] = useState('Our compiled conversational archives & memory book');
  const [dedicationText, setDedicationText] = useState('For my favorite person, with whom I shared these milestones, late-night talks, and laughter.');
  const [authorName, setAuthorName] = useState('Compiled with ChatReader');

  // 2. Format & Layout Config state
  const [themePreset, setThemePreset] = useState<ThemePreset>('whatsapp');
  const [fontTheme, setFontTheme] = useState<FontTheme>('sans');
  const [alignMeSender, setAlignMeSender] = useState<string>(() => {
    const participants = Object.keys(stats.participants);
    const meIndex = participants.findIndex(p => p.toLowerCase().includes('me') || p.toLowerCase().includes('leo'));
    return meIndex !== -1 ? participants[meIndex] : (participants[0] || '');
  });

  const [pageSizeLimit, setPageSizeLimit] = useState<'all' | '100' | '500' | '1000' | 'custom'>('500');
  const [startDateStr, setStartDateStr] = useState<string>('');
  const [endDateStr, setEndDateStr] = useState<string>('');

  const [showDateHeaders, setShowDateHeaders] = useState(true);
  const [showSystemLogs, setShowSystemLogs] = useState(false);
  const [showRunningHeader, setShowRunningHeader] = useState(true);

  // 3. UI active preview page selector state (for mock book container)
  const [previewPageIdx, setPreviewPageIdx] = useState(0);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingHtml, setGeneratingHtml] = useState(false);

  const participantsList = useMemo(() => Object.keys(stats.participants), [stats]);

  // Handle message limits and ranges
  const selectedMessages = useMemo(() => {
    let list = [...messages];
    
    // Sort chronological just to be safe
    list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Apply system logs toggle
    if (!showSystemLogs) {
      list = list.filter(m => !m.isSystem);
    }

    // Apply dates filter
    if (pageSizeLimit === 'custom') {
      if (startDateStr) {
        const start = new Date(startDateStr);
        list = list.filter(m => m.timestamp >= start);
      }
      if (endDateStr) {
        const end = new Date(endDateStr);
        // Add 23:59:59 to capture full end day
        end.setHours(23, 59, 59, 999);
        list = list.filter(m => m.timestamp <= end);
      }
    } else {
      const limitMap = { 'all': Infinity, '100': 100, '500': 500, '1000': 1000 };
      const limit = limitMap[pageSizeLimit as keyof typeof limitMap] || 500;
      if (list.length > limit) {
        list = list.slice(0, limit);
      }
    }

    return list;
  }, [messages, pageSizeLimit, startDateStr, endDateStr, showSystemLogs]);

  // Grouped by date helper for actual content preview and printing
  const groupedDates = useMemo(() => {
    const groups: { dateKey: string; items: ChatMessage[] }[] = [];
    let currentKey = '';
    let currentItems: ChatMessage[] = [];

    selectedMessages.forEach(msg => {
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
  }, [selectedMessages]);

  const activeDateRangeStr = useMemo(() => {
    if (selectedMessages.length === 0) return 'Empty Range';
    const first = selectedMessages[0].timestamp;
    const last = selectedMessages[selectedMessages.length - 1].timestamp;
    const format = (d: Date) => d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    return `${format(first)} — ${format(last)}`;
  }, [selectedMessages]);

  // Visual Theme mapping helper
  const themeStyles = useMemo(() => {
    switch (themePreset) {
      case 'pink':
        return {
          coverBg: 'bg-gradient-to-br from-pink-700 via-rose-800 to-pink-900',
          coverBorder: 'border-pink-300',
          bannerBg: 'bg-rose-50',
          bannerText: 'text-rose-700',
          accentColor: '#E11D48',
          accentText: 'text-rose-600',
          rightBubbleBg: 'bg-[#FCE7F3]',
          rightBubbleBorder: 'border-[#F8D2EA]',
          rightBubbleColor: 'text-[#500724]',
          leftBubbleBg: 'bg-[#FFFDFB]',
          leftBubbleBorder: 'border-[#FFF0EB]',
          leftBubbleColor: 'text-[#1F2937]',
          timestampColor: 'text-rose-400',
          senderNameColor: 'text-rose-700',
          tagline: '🌸 Rose Pink Blossom'
        };
      case 'cosmic':
        return {
          coverBg: 'bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#1E1B4B]',
          coverBorder: 'border-indigo-400',
          bannerBg: 'bg-indigo-950',
          bannerText: 'text-indigo-300',
          accentColor: '#6366F1',
          accentText: 'text-indigo-400',
          rightBubbleBg: 'bg-[#312E81]',
          rightBubbleBorder: 'border-[#4338CA]',
          rightBubbleColor: 'text-[#E0E7FF]',
          leftBubbleBg: 'bg-[#1E293B]',
          leftBubbleBorder: 'border-[#334155]',
          leftBubbleColor: 'text-[#F1F5F9]',
          timestampColor: 'text-indigo-300',
          senderNameColor: 'text-fuchsia-400',
          tagline: '🌌 Cosmic Interstellar Indigo'
        };
      case 'minimal':
        return {
          coverBg: 'bg-gradient-to-br from-slate-800 via-slate-900 to-black',
          coverBorder: 'border-slate-500',
          bannerBg: 'bg-slate-100',
          bannerText: 'text-slate-800',
          accentColor: '#171717',
          accentText: 'text-slate-800',
          rightBubbleBg: 'bg-[#F3F4F6]',
          rightBubbleBorder: 'border-[#E5E7EB]',
          rightBubbleColor: 'text-[#1F2937]',
          leftBubbleBg: 'bg-[#FFFFFF]',
          leftBubbleBorder: 'border-[#E5E7EB]',
          leftBubbleColor: 'text-[#1F2937]',
          timestampColor: 'text-slate-450',
          senderNameColor: 'text-slate-750',
          tagline: '🔳 Swiss Minimal Slate'
        };
      case 'whatsapp':
      default:
        return {
          coverBg: 'bg-gradient-to-br from-[#075E54] via-[#128C7E] to-[#0A4E46]',
          coverBorder: 'border-teal-300',
          bannerBg: 'bg-teal-50',
          bannerText: 'text-teal-800',
          accentColor: '#128C7E',
          accentText: 'text-teal-700',
          rightBubbleBg: 'bg-[#DCF8C6]',
          rightBubbleBorder: 'border-[#C9ECB2]',
          rightBubbleColor: 'text-[#111B21]',
          leftBubbleBg: 'bg-[#FFFFFF]',
          leftBubbleBorder: 'border-[#E5E7EB]',
          leftBubbleColor: 'text-[#111B21]',
          timestampColor: 'text-gray-400',
          senderNameColor: 'text-teal-600',
          tagline: '🟢 Classic Chat Greens'
        };
    }
  }, [themePreset]);

  // Font Theme layout helpers
  const fontClass = useMemo(() => {
    if (fontTheme === 'serif') return 'font-serif-elegant';
    if (fontTheme === 'mono') return 'font-mono-cyber';
    return 'font-sans-modern';
  }, [fontTheme]);

  // Simulation Preview Mock-Up pages array
  const mockPreviewPagesCount = 3;

  const handlePageNext = () => {
    setPreviewPageIdx(p => Math.min(p + 1, mockPreviewPagesCount - 1));
  };
  const handlePagePrev = () => {
    setPreviewPageIdx(p => Math.max(p - 1, 0));
  };

  // 4. Standalone Printable HTML chatbook compilation
  const handleDownloadHtml = () => {
    setGeneratingHtml(true);

    const esc = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const cleanTitle = esc(coverTitle || 'My Chatbook');
    const cleanSubtitle = esc(coverSubtitle || '');
    const cleanAuthor = esc(authorName || 'ChatReader');
    const cleanDedication = esc(dedicationText || '');

    // Map themes directly inside static elements
    const isDark = themePreset === 'cosmic';

    // Compile message rows
    const compiledMessagesHtml = groupedDates.map((group, gIdx) => {
      const isDateHeader = group.dateKey !== 'System' && showDateHeaders;
      const groupRows = group.items.map(msg => {
        if (msg.isSystem) {
          return `
          <div class="system-row flex justify-center text-center my-3 break-inside-avoid">
            <span class="px-4 py-1.5 text-[10px] bg-slate-150 border border-slate-200 italic rounded-lg text-slate-550 max-w-md">${esc(msg.content)}</span>
          </div>`;
        }

        const isMe = msg.sender === alignMeSender;
        const timeStr = msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        const senderNameColorCss = isMe ? 'color: ' + themeStyles.accentColor : 'color: inherit; opacity: 0.7;';

        return `
        <div class="bubble-row flex ${isMe ? 'justify-end' : 'justify-start'} my-2 break-inside-avoid">
          <div class="bubble p-3 rounded-lg max-w-[72%] border shadow-3xs flex flex-col"
               style="background-color: ${isMe ? themeStyles.rightBubbleBg : themeStyles.leftBubbleBg}; 
                      border-color: ${isMe ? themeStyles.rightBubbleBorder : themeStyles.leftBubbleBorder}; 
                      color: ${isMe ? themeStyles.rightBubbleColor : themeStyles.leftBubbleColor};">
            ${!isMe ? `<span class="text-[11px] font-extrabold tracking-tight mb-1" style="${senderNameColorCss}">${esc(msg.sender)}</span>` : ''}
            ${msg.replyTo ? `
            <div class="quote-card mb-2 p-1.5 rounded" style="background-color: rgba(0,0,0,0.04); border-left: 3px solid ${isMe ? themeStyles.accentColor : '#888888'}; padding: 4px 8px; font-size: 9.5px; margin-bottom: 6px; border-radius: 4px;">
              <span class="font-extrabold" style="color: ${isMe ? themeStyles.accentColor : '#444444'}">${esc(msg.replyTo.sender === alignMeSender ? 'You' : msg.replyTo.sender)}</span>
              <p class="truncate opacity-75 m-0" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin: 0;">${esc(msg.replyTo.content)}</p>
            </div>
            ` : ''}
            <p class="text-xs break-words whitespace-pre-wrap leading-relaxed m-0">${esc(msg.content)}</p>
            <span class="text-[8px] opacity-50 font-mono text-right mt-1.5 block">${timeStr}</span>
          </div>
        </div>`;
      }).join('\n');

      return `
      <div class="date-section">
        ${isDateHeader ? `
        <div class="date-header flex justify-center my-5 break-inside-avoid">
          <span class="px-3.5 py-1 text-[10px] font-bold rounded-full ${isDark ? 'bg-indigo-950 border border-indigo-900 text-indigo-300' : 'bg-slate-100 border border-slate-200 text-slate-700'}">${group.dateKey}</span>
        </div>` : ''}
        ${groupRows}
      </div>`;
    }).join('\n');

    // Combine into complete single HTML document
    const staticBookCode = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${cleanTitle} — A Gift Chatbook</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      
      .theme-font-serif { font-family: 'Playfair Display', 'Lora', Georgia, serif; }
      .theme-font-sans { font-family: 'Outfit', 'Inter', sans-serif; }
      .theme-font-mono { font-family: 'Space Grotesk', 'JetBrains Mono', monospace; }
      
      .break-inside-avoid {
        break-inside: avoid;
        page-break-inside: avoid;
      }
      .break-before-page {
        break-before: page;
        page-break-before: always;
      }

      @media print {
        @page {
          size: A4;
          margin: 18mm 15mm 18mm 15mm;
        }
        body {
          background: #ffffff !important;
          color: #000000 !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        .no-print {
          display: none !important;
        }
        .print-layout {
          display: block !important;
        }
      }
    </style>
  </head>
  <body class="bg-slate-100 min-h-screen ${fontTheme === 'serif' ? 'theme-font-serif' : fontTheme === 'mono' ? 'theme-font-mono' : 'theme-font-sans'} text-slate-800 flex flex-col">
    
    <!-- FLOATING ACTION OVERLAY FOR PRINTING -->
    <div class="no-print bg-white/95 border-b border-slate-200 py-3.5 px-6 sticky top-0 z-50 shadow-sm backdrop-blur-xs">
      <div class="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div>
          <h1 class="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1">
            <span>✨</span> ${cleanTitle} <span class="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none">Draft Pre-Compiled</span>
          </h1>
          <p class="text-[10px] text-slate-500 font-medium">To compile your high-fidelity PDF, just click on "Save as PDF" or "Print Book".</p>
        </div>
        <button onclick="window.print()" class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-xs font-bold transition-all cursor-pointer">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
          <span>Print / Save as PDF</span>
        </button>
      </div>
    </div>

    <!-- BOOK LAYOUT -->
    <main class="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-10 space-y-12">
      
      <!-- PAGE 1: COVER PAGE STYLE -->
      <section class="bg-white border border-slate-200 rounded-3xl p-12 sm:p-20 shadow-xs flex flex-col justify-between aspect-[210/297] relative overflow-hidden break-before-page">
        <div class="absolute inset-0 opacity-5 pointer-events-none" style="background-color: ${themeStyles.accentColor};"></div>
        <div class="border-2 border-dashed rounded-2xl p-6 sm:p-10 flex-grow flex flex-col justify-between" style="border-color: ${themeStyles.accentColor}40;">
          <div class="text-center space-y-3 pt-6">
            <span class="text-[10px] font-mono tracking-widest uppercase opacity-60 font-black" style="color: ${themeStyles.accentColor};">A Generative Chatbook</span>
            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight" style="color: ${themeStyles.accentColor};">${cleanTitle}</h1>
            <div class="w-16 h-1 mx-auto my-3 rounded-full" style="background-color: ${themeStyles.accentColor};"></div>
            <p class="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed italic">${cleanSubtitle}</p>
          </div>

          <div class="text-center py-6">
            <span class="text-4xl">📚</span>
          </div>

          <div class="text-center space-y-2 pb-6">
            <p class="text-[10px] font-mono uppercase tracking-wider text-slate-400">Archival Range</p>
            <p class="text-xs font-bold text-slate-800">${esc(activeDateRangeStr)}</p>
            <p class="text-[9px] font-mono text-slate-400 mt-2">${cleanAuthor}</p>
          </div>
        </div>
      </section>

      <!-- PAGE 2: DEDICATION & STATS SUMMARY -->
      ${cleanDedication ? `
      <section class="bg-white border border-slate-200 rounded-3xl p-12 sm:p-20 shadow-xs flex flex-col justify-between aspect-[210/297] break-before-page relative">
        <div class="flex-grow flex flex-col justify-center text-center space-y-6">
          <span class="text-xl">💝</span>
          <h2 class="text-lg font-bold uppercase tracking-widest text-slate-400 font-mono">Dedication</h2>
          <p class="text-sm leading-relaxed text-slate-700 italic max-w-md mx-auto whitespace-pre-wrap">"${cleanDedication}"</p>
          <div class="w-12 h-px bg-slate-200 mx-auto"></div>
        </div>

        <div class="border-t border-slate-100 pt-6 mt-auto">
          <div class="grid grid-cols-2 gap-4 text-center text-xs">
            <div class="p-3 bg-slate-50 rounded-xl">
              <p class="text-[9px] text-slate-400 font-mono uppercase tracking-wide">Total Logged</p>
              <p class="text-base font-black text-slate-850 font-mono">${stats.totalMessages.toLocaleString()} msgs</p>
            </div>
            <div class="p-3 bg-slate-50 rounded-xl">
              <p class="text-[9px] text-slate-400 font-mono uppercase tracking-wide">Shared Words</p>
              <p class="text-base font-black text-slate-850 font-mono">${stats.totalWords.toLocaleString()} words</p>
            </div>
          </div>
        </div>
      </section>
      ` : ''}

      <!-- PAGE 3+: RECONSTRUCTED CHAT WALL -->
      <section class="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs min-h-[400px] break-before-page">
        ${showRunningHeader ? `
        <div class="no-print flex justify-between items-center pb-3 border-b border-slate-100 text-[10px] text-slate-450 font-mono mb-6">
          <span>${cleanTitle}</span>
          <span>${esc(activeDateRangeStr)}</span>
        </div>` : ''}

        <div class="space-y-4">
          ${compiledMessagesHtml}
        </div>
      </section>

    </main>

    <!-- FOOTER -->
    <footer class="no-print py-8 text-center text-[10px] text-slate-400 border-t border-slate-200 mt-12">
      <p>Compiled dynamically via <span class="font-bold text-[#bfff00] bg-black px-1.5 py-0.5">ChatReader</span> Engine. Standard A4 Vector Output Layout.</p>
    </footer>
  </body>
</html>`;

    const blob = new Blob([staticBookCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${coverTitle.replace(/\s+/g, '_') || 'Gift_Chatbook'}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setTimeout(() => {
      setGeneratingHtml(false);
    }, 1000);
  };

  // 5. Trigger Direct Native Print using temporary injection portal
  const handleDirectPrint = () => {
    setGeneratingPdf(true);

    // Save configurations and style options
    try {
      // Open immediate native print panel.
      // In order to make it look 100% pristine and prevent general UI from printing,
      // we utilize our specialized css print media styles.
      // We will let the window.print call execute.
      window.print();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => {
        setGeneratingPdf(false);
      }, 500);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="chatbook-creator-root">
      
      {/* Universal Hidden Element only rendered during print/PDF export */}
      {createPortal(
        <div className="hidden print:block absolute inset-0 bg-white text-black z-50" id="print-chatbook-container-portable">
          {/* COVER PAGE PRINT ONLY */}
          <div className="h-[297mm] w-[210mm] max-h-[297mm] max-w-[210mm] p-[20mm] flex flex-col justify-between border border-transparent bg-white page-break-before-always relative">
            <div className="border border-dashed rounded-xl p-[10mm] h-full flex flex-col justify-between" style={{ borderColor: themeStyles.accentColor }}>
              <div className="text-center space-y-4 pt-12">
                <span className="text-[11px] uppercase tracking-wider font-mono font-bold" style={{ color: themeStyles.accentColor }}>A Generative Memory Book</span>
                <h1 className="text-3xl font-black leading-tight" style={{ color: themeStyles.accentColor }}>{coverTitle}</h1>
                <div className="w-16 h-1 mx-auto my-2 rounded-full" style={{ backgroundColor: themeStyles.accentColor }}></div>
                <p className="text-xs text-gray-500 italic max-w-sm mx-auto">{coverSubtitle}</p>
              </div>

              <div className="text-center py-6">
                <span className="text-5xl">📚</span>
              </div>

              <div className="text-center space-y-2 pb-12 font-mono">
                <p className="text-[9px] text-gray-455 uppercase tracking-widest">Chronological Archive Range</p>
                <p className="text-xs font-bold text-slate-800">{activeDateRangeStr}</p>
                <p className="text-[9px] text-gray-400 mt-2">{authorName}</p>
              </div>
            </div>
          </div>

          {/* DEDICATION PAGE PRINT ONLY */}
          {dedicationText && (
            <div className="h-[297mm] w-[210mm] max-h-[297mm] max-w-[210mm] p-[25mm] flex flex-col justify-between bg-white page-break-before-always relative">
              <div className="flex-grow flex flex-col justify-center text-center space-y-8">
                <span className="text-2xl">💝</span>
                <h2 className="text-xs font-black tracking-widest uppercase text-gray-400 font-mono">Dedication Note</h2>
                <p className="text-sm italic leading-relaxed text-gray-700 whitespace-pre-wrap max-w-md mx-auto">"{dedicationText}"</p>
                <div className="w-12 h-px bg-slate-200 mx-auto"></div>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-auto">
                <div className="grid grid-cols-2 gap-4 text-center text-[10px] font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-gray-455">Total Messages</p>
                    <p className="text-sm font-black text-slate-800">{stats.totalMessages.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <p className="text-gray-455">Total Words</p>
                    <p className="text-sm font-black text-slate-800">{stats.totalWords.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CHAT LOGS PAGE PRINT ONLY */}
          <div className="p-[15mm] bg-white text-black min-h-screen page-break-before-always">
            {showRunningHeader && (
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-[9px] font-mono text-gray-400 mb-6">
                <span>{coverTitle}</span>
                <span>{activeDateRangeStr}</span>
              </div>
            )}

            <div className="space-y-3">
              {groupedDates.map((group, groupIdx) => {
                const showHd = group.dateKey !== 'System' && showDateHeaders;
                return (
                  <div key={groupIdx} className="space-y-2">
                    {showHd && (
                      <div className="flex justify-center my-4 page-break-inside-avoid">
                        <span className="px-3 py-1 bg-slate-100 border border-slate-250 text-[10px] font-bold rounded-full text-slate-700">
                          {group.dateKey}
                        </span>
                      </div>
                    )}

                    {group.items.map(msg => {
                      if (msg.isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-2 text-center page-break-inside-avoid">
                            <span className="px-4 py-1 text-[9px] bg-yellow-50 border border-yellow-250 text-yellow-800 rounded-lg italic max-w-sm">
                              {msg.content}
                            </span>
                          </div>
                        );
                      }

                      const isMe = msg.sender === alignMeSender;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} my-2.5 page-break-inside-avoid`}>
                          <div 
                            className="p-3 rounded-lg border max-w-[70%] flex flex-col shadow-3xs"
                            style={{
                              backgroundColor: isMe ? themeStyles.rightBubbleBg : themeStyles.leftBubbleBg,
                              borderColor: isMe ? themeStyles.rightBubbleBorder : themeStyles.leftBubbleBorder,
                              color: isMe ? themeStyles.rightBubbleColor : themeStyles.leftBubbleColor
                            }}
                          >
                            {!isMe && (
                              <span 
                                className="text-[10px] font-black tracking-tight mb-1" 
                                style={{ color: themeStyles.senderNameColor }}
                              >
                                {msg.sender}
                              </span>
                            )}
                            {msg.replyTo && (
                              <div className="mb-1.5 p-1.5 rounded-sm text-[9.5px] border-l-[3px] leading-tight flex flex-col bg-black/5 dark:bg-white/5" style={{ borderColor: isMe ? themeStyles.accentColor : '#888888' }}>
                                <span className="font-bold text-[9px] opacity-75">{msg.replyTo.sender === alignMeSender ? 'You' : msg.replyTo.sender}</span>
                                <p className="opacity-70 truncate m-0">{msg.replyTo.content}</p>
                              </div>
                            )}
                            <p className="text-[11px] leading-relaxed break-words whitespace-pre-wrap m-0">
                              {msg.content}
                            </p>
                            <span className="text-[8px] opacity-50 font-mono text-right mt-1">
                              {msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DESKTOP/MOBILE DESIGNER SCREEN SPLIT */}
      <h3 className="sr-only">Chatbook configurations and previews</h3>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="designer-split-grid">
        
        {/* LEFT COLUMN: CONTROLS & LAYOUT PARAMS (COL SPAN 5) */}
        <div className="lg:col-span-5 space-y-6" id="designer-settings-panel">
          
          {/* Section: Designer Header */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-1">
            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 hover:text-indigo-900 border border-indigo-150 text-[10px] font-mono rounded font-bold uppercase tracking-wider">
              🎁 Instant Lume Style Book Mode
            </span>
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Chatbook Style Designer
            </h3>
            <p className="text-xs text-slate-500 leading-normal">
              Configure parameters to generate a beautifully aligned gift PDF paper book.
            </p>
          </div>

          {/* Section: Cover Customizer details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> Book Cover Details
            </h4>

            {/* Inputs Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Book Main Title</label>
              <input
                type="text"
                value={coverTitle}
                onChange={(e) => setCoverTitle(e.target.value)}
                placeholder="Our Shared Chatlog..."
                className="w-full bg-slate-50 border border-slate-250 text-slate-900 placeholder-slate-450 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
                id="inp-cover-title"
              />
            </div>

            {/* Inputs Subtitle/Caption */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Subtitle Caption</label>
              <input
                type="text"
                value={coverSubtitle}
                onChange={(e) => setCoverSubtitle(e.target.value)}
                placeholder="A funny memory catalog..."
                className="w-full bg-slate-50 border border-slate-250 text-slate-900 placeholder-slate-450 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
                id="inp-cover-subtitle"
              />
            </div>

            {/* Input Dedication Note Text */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                <span>Page 2 Dedication Note</span>
                <span className="text-[9px] text-gray-400 capitalize normal-case">(optional block)</span>
              </label>
              <textarea
                value={dedicationText}
                onChange={(e) => setDedicationText(e.target.value)}
                placeholder="Enter some beautiful dedicating lines..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-250 text-slate-900 placeholder-slate-450 rounded-xl p-3 text-xs leading-relaxed focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
                id="inp-cover-dedication"
              />
            </div>

            {/* Input Author */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Footer Signature Credits</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
                id="inp-cover-author"
              />
            </div>
          </div>

          {/* Section: Bubble Themes & Typo Options */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-emerald-500" /> Typography & Themes
            </h4>

            {/* Presets Grid */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Cover Palette Presets</label>
              <div className="grid grid-cols-2 gap-2">
                {(['whatsapp', 'pink', 'cosmic', 'minimal'] as ThemePreset[]).map(key => (
                  <button
                    key={key}
                    onClick={() => setThemePreset(key)}
                    className={`px-3 py-2 border rounded-xl text-left text-xs font-bold capitalize transition-all flex items-center justify-between ${
                      themePreset === key 
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 scale-102 font-extrabold shadow-3xs'
                        : 'border-slate-150 bg-white hover:border-slate-200 text-slate-700'
                    }`}
                    id={`palette-${key}`}
                  >
                    <span>{key}</span>
                    <span 
                      className={`w-3.5 h-3.5 rounded-full border border-white`}
                      style={{
                        backgroundColor: 
                          key === 'whatsapp' ? '#128C7E' : 
                          key === 'pink' ? '#BE185D' : 
                          key === 'cosmic' ? '#312E81' : '#111827'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Selectors */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Aesthetic Typography Face</label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { key: 'sans', label: 'Modern Sans', style: 'Outfit' },
                  { key: 'serif', label: 'Classic Serif', style: 'Georgia' },
                  { key: 'mono', label: 'Tech Mono', style: 'Courier' }
                ].map(obj => (
                  <button
                    key={obj.key}
                    onClick={() => setFontTheme(obj.key as FontTheme)}
                    className={`p-2 border rounded-xl text-center text-xs transition-all ${
                      fontTheme === obj.key 
                        ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 font-bold'
                        : 'border-slate-150 bg-slate-50 text-slate-600'
                    }`}
                    id={`font-opt-${obj.key}`}
                  >
                    <p className="font-semibold leading-none">{obj.label}</p>
                    <p className="text-[10px] opacity-50 mt-1 font-mono leading-none">{obj.style}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Treat as Me mapping Alignment */}
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Treat as "Me" (Right-Aligned Bubbles)</label>
              <select
                value={alignMeSender}
                onChange={(e) => setAlignMeSender(e.target.value)}
                className="w-full bg-slate-50 border border-slate-250 text-slate-900 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden font-medium"
                id="select-me-align"
              >
                {participantsList.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section: Size Limits & Page Breaks */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 text-amber-500" /> Book Capacity & Range
            </h4>

            {/* Predefined message range limits */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Limit message count</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { key: '100', val: 'First 100 msgs' },
                  { key: '500', val: 'First 500 msgs' },
                  { key: '1000', val: 'First 1000 msgs' },
                  { key: 'all', val: 'Include Everything' },
                  { key: 'custom', val: 'Custom Date Range' }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setPageSizeLimit(item.key as any)}
                    className={`px-2.5 py-1.5 border rounded-lg text-center text-[11px] font-bold transition-all ${
                      pageSizeLimit === item.key 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800'
                        : 'border-slate-150 bg-white text-slate-600 hover:border-slate-250'
                    }`}
                    id={`limit-pill-${item.key}`}
                  >
                    {item.val}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range inputs if Custom selected */}
            {pageSizeLimit === 'custom' && (
              <div className="grid grid-cols-2 gap-3 pt-1 animate-fade-in" id="custom-date-inputs">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wide text-gray-500">Date from:</span>
                  <input
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden font-medium"
                    id="date-pick-start"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-wide text-gray-500">Date To:</span>
                  <input
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden font-medium"
                    id="date-pick-end"
                  />
                </div>
              </div>
            )}

            {/* Toggle Toggles Grid settings */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">Display date dividers</p>
                  <p className="text-[10px] text-gray-400">Organize entries chronology</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDateHeaders}
                    onChange={(e) => setShowDateHeaders(e.target.checked)}
                    className="sr-only peer"
                    id="toggle-date-headers"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-slate-700">Include notifications logs</p>
                  <p className="text-[10px] text-gray-400">Add WhatsApp system indicators</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showSystemLogs}
                    onChange={(e) => setShowSystemLogs(e.target.checked)}
                    className="sr-only peer"
                    id="toggle-sys-logs"
                  />
                  <div className="w-8 h-4.5 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BOOK VIEW DRAUGHT SIMULATOR PREVIEW (COL SPAN 7) */}
        <div className="lg:col-span-7 space-y-6" id="designer-canvas-preview">
          
          {/* Action trigger row banner */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs" id="preview-actions-bar">
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" /> Included: <span className="font-bold text-indigo-800">{selectedMessages.length} messages</span> matching criteria
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadHtml}
                disabled={generatingHtml}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 border border-slate-900 hover:bg-slate-800 text-white hover:text-indigo-200 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                id="btn-dl-html-book"
                title="Generates a packageable standalone A4 Gift Chatbook HTML file with instant print layouts built-in."
              >
                <Download className="w-3.5 h-3.5" />
                <span>{generatingHtml ? 'Creating...' : 'Download Gift Book'}</span>
              </button>

              <button
                onClick={handleDirectPrint}
                disabled={generatingPdf}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white hover:text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
                id="btn-direct-print-pdf"
                title="Opens standard browser print popup configured perfectly with matching margins. Select 'Save as PDF' to save."
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{generatingPdf ? 'Starting...' : 'Print / Save PDF'}</span>
              </button>
            </div>
          </div>

          {/* SATELLITE CANVAS DECK VIEW */}
          <div className="space-y-4">
            
            <div className="flex justify-between items-center px-2">
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#94a3b8] font-mono">
                A4 Page Mock Editor Preview ({previewPageIdx + 1} of {mockPreviewPagesCount})
              </p>

              {/* Slider helpers buttons */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-lg">
                <button
                  onClick={handlePagePrev}
                  disabled={previewPageIdx === 0}
                  className="p-1 px-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-md transition-all bg-white shadow-3xs"
                  id="btn-prev-page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-mono px-2 font-bold text-slate-700">Page {previewPageIdx + 1}</span>
                <button
                  onClick={handlePageNext}
                  disabled={previewPageIdx === mockPreviewPagesCount - 1}
                  className="p-1 px-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 rounded-md transition-all bg-white shadow-3xs"
                  id="btn-next-page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* THE VISUAL SIMULATED CANVAS ELEMENT */}
            <div 
              className={`bg-white border border-slate-200/80 rounded-2xl w-full aspect-[210/297] shadow-lg flex flex-col justify-between transition-all duration-300 relative overflow-hidden select-none select-none ${fontClass}`}
              id="a4-simulated-stage"
            >
              
              {/* Cover simulation highlight ornament overlay element */}
              <div className="absolute inset-x-0 top-0 h-1 bg-indigo-500 opacity-0 pointer-events-none" />

              {/* DYNAMIC PAGE RENDER MULTIPLEXER */}
              
              {/* PAGE 1: COVER SLATE PREVIEW */}
              {previewPageIdx === 0 && (
                <div className={`p-8 sm:p-12 w-full h-full flex flex-col justify-between relative`} id="page-preview-0">
                  <div className={`absolute inset-0 opacity-5 pointer-events-none ${themeStyles.coverBg}`} />
                  <div className={`border-2 border-dashed rounded-xl p-4 sm:p-6 flex-grow flex flex-col justify-between`} style={{ borderColor: themeStyles.accentColor + '50' }}>
                    
                    <div className="text-center space-y-2 pt-4">
                      <span className="text-[9px] font-mono tracking-widest font-black uppercase" style={{ color: themeStyles.accentColor }}>Memory Archivists</span>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight" style={{ color: themeStyles.accentColor }}>
                        {coverTitle}
                      </h2>
                      <div className="w-10 h-0.5 mx-auto rounded-full" style={{ backgroundColor: themeStyles.accentColor }}></div>
                      <p className="text-[10px] text-gray-500 italic max-w-[180px] mx-auto leading-normal">
                        "{coverSubtitle}"
                      </p>
                    </div>

                    <div className="text-center pt-2">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-50 border border-slate-100 shadow-3xs">
                        <span className="text-2xl">📖</span>
                      </div>
                    </div>

                    <div className="text-center space-y-1.5 font-mono">
                      <p className="text-[8px] text-gray-400 uppercase tracking-widest">Historical Range</p>
                      <p className="text-[10px] font-bold text-slate-800">{activeDateRangeStr}</p>
                      <p className="text-[8px] text-gray-400 italic mt-1">{authorName}</p>
                    </div>

                  </div>
                </div>
              )}

              {/* PAGE 2: DEDICATION & STATS PREVIEW */}
              {previewPageIdx === 1 && (
                <div className="p-8 sm:p-12 w-full h-full flex flex-col justify-between relative" id="page-preview-1">
                  <div className="flex-grow flex flex-col justify-center text-center space-y-4">
                    <span className="text-xl">💝</span>
                    <h2 className="text-[10px] font-black tracking-widest uppercase text-gray-400 font-mono">Dedication Note</h2>
                    <p className="text-[11px] leading-relaxed text-gray-700 italic max-w-xs mx-auto whitespace-pre-wrap">
                      "{dedicationText || '(No dedication text set. It will be excluded from the print output)'}"
                    </p>
                    <div className="w-10 h-px bg-slate-200 mx-auto"></div>
                  </div>

                  {/* Summary metric banner cards inside simulation */}
                  <div className="border-t border-slate-100 pt-4 mt-auto">
                    <div className="grid grid-cols-2 gap-3 text-center font-mono">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl leading-normal">
                        <p className="text-[8px] text-gray-400 uppercase tracking-wide">Total Msgs</p>
                        <p className="text-xs font-black text-slate-850">{stats.totalMessages.toLocaleString()}</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl leading-normal">
                        <p className="text-[8px] text-gray-400 uppercase tracking-wide">Included</p>
                        <p className="text-xs font-black text-indigo-750 font-bold">{selectedMessages.length.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* PAGE 3: CHATLOG RECORD FLOW PREVIEW */}
              {previewPageIdx === 2 && (
                <div className="p-5 sm:p-8 w-full h-full flex flex-col justify-start relative overflow-hidden text-left" id="page-preview-2">
                  
                  {/* Top running header */}
                  {showRunningHeader && (
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 text-[8px] font-mono text-gray-400 mb-4 tracking-tight">
                      <span className="truncate max-w-[120px]">{coverTitle}</span>
                      <span className="font-semibold text-[7px] text-indigo-700 bg-indigo-50 px-1 rounded">Page 3 Archive</span>
                    </div>
                  )}

                  {/* Simulated Bubbles feed */}
                  <div className="space-y-3 overflow-y-auto max-h-[85%] pr-1 scrollbar-thin">
                    {groupedDates.slice(0, 2).map((group, groupIdx) => {
                      const showHd = group.dateKey !== 'System' && showDateHeaders;
                      return (
                        <div key={groupIdx} className="space-y-1.5">
                          {showHd && (
                            <div className="flex justify-center my-2">
                              <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-[8px] font-bold rounded-full text-slate-500">
                                {group.dateKey}
                              </span>
                            </div>
                          )}

                          {group.items.slice(0, 4).map((msg, mIdx) => {
                            if (msg.isSystem) return null;
                            const isMe = msg.sender === alignMeSender;
                            return (
                              <div key={mIdx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div 
                                  className="p-2.5 rounded-lg border max-w-[80%] flex flex-col shadow-3xs"
                                  style={{
                                    backgroundColor: isMe ? themeStyles.rightBubbleBg : themeStyles.leftBubbleBg,
                                    borderColor: isMe ? themeStyles.rightBubbleBorder : themeStyles.leftBubbleBorder,
                                    color: isMe ? themeStyles.rightBubbleColor : themeStyles.leftBubbleColor
                                  }}
                                >
                                  {!isMe && (
                                    <span 
                                      className="text-[9px] font-black tracking-tight mb-0.5" 
                                      style={{ color: themeStyles.senderNameColor }}
                                    >
                                      {msg.sender}
                                    </span>
                                  )}
                                  {msg.replyTo && (
                                    <div className="mb-1 p-1 rounded-sm text-[8.5px] border-l-2 leading-none bg-black/5 dark:bg-white/5 opacity-80" style={{ borderColor: isMe ? themeStyles.accentColor : '#888888' }}>
                                      <span className="font-bold text-[8px]">{msg.replyTo.sender === alignMeSender ? 'You' : msg.replyTo.sender}</span>
                                      <p className="opacity-70 truncate m-0 text-[8px]">{msg.replyTo.content}</p>
                                    </div>
                                  )}
                                  <p className="text-[10px] leading-relaxed break-all whitespace-pre-wrap m-0">
                                    {msg.content.length > 80 ? msg.content.substring(0, 80) + '...' : msg.content}
                                  </p>
                                  <span className="text-[7px] opacity-50 font-mono text-right mt-1 font-medium">
                                    {msg.timestamp.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {selectedMessages.length === 0 && (
                      <div className="text-center py-12 text-slate-400 text-xs text-medium italic">
                        Empty records. Adjust dates.
                      </div>
                    )}
                  </div>

                  {/* Fade mask at bottom representing continue flow */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white to-transparent h-12 flex items-end justify-center pointer-events-none pb-4">
                    <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">Continued on subsequent pages...</span>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Secure sandbox alert box */}
          <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl flex items-center gap-2 text-[11px] font-medium text-slate-500" id="sandbox-alert">
            <Lock className="w-4 h-4 text-indigo-500 shrink-0" />
            <p>PDF compiles locally using the browser's high-fidelity vector engine. Your personal files remain fully offline and safe.</p>
          </div>

        </div>
      </div>
    </div>
  );
}

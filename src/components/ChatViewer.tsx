/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ChatMessage, ChatStats } from '../types';
import { 
  Search, 
  User, 
  CheckCheck, 
  CornerUpLeft, 
  X, 
  Plus,
  Camera,
  Mic,
  Ban,
  Phone,
  Video
} from 'lucide-react';
import ExportButton from './ExportButton';

type ChatTheme = 'ios-dark' | 'ios-light' | 'lando-neon' | 'cosmic';

interface ParsedCall {
  isCall: boolean;
  type: 'voice' | 'video';
  isSilenced: boolean;
  isMissed: boolean;
  title: string;
  subtitle: string;
}

function detectAndParseCall(content: string): ParsedCall {
  const clean = content
    .replace(/[\u200b-\u200d\u200e\u200f\u202a-\u202e\ufeff]/g, '')
    .trim();

  // Strip common emojis that might be in some exports
  const cleanNoEmoji = clean.replace(/[📱📞📹🚫⚠️]/g, '').trim();

  const lines = cleanNoEmoji.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || '';
  
  // Regex to detect WhatsApp voice/video calls logs
  const isCallText = 
    /voice\s*call/i.test(cleanNoEmoji) || 
    /video\s*call/i.test(cleanNoEmoji) || 
    /missed\s*call/i.test(cleanNoEmoji) || 
    /silenced\s*call/i.test(cleanNoEmoji) ||
    /^voice\s*call/i.test(firstLine) ||
    /^video\s*call/i.test(firstLine);

  if (!isCallText) {
    return {
      isCall: false,
      type: 'voice',
      isSilenced: false,
      isMissed: false,
      title: '',
      subtitle: ''
    };
  }

  const isVideo = /video/i.test(cleanNoEmoji);
  const isSilenced = /silenced/i.test(cleanNoEmoji);
  const isMissed = /missed/i.test(cleanNoEmoji);

  let title = firstLine;
  let subtitle = '';

  if (lines.length > 1) {
    subtitle = lines[1];
  } else {
    // Check parenthesis format like: "Voice call (51 sec)"
    const parenMatch = firstLine.match(/^([^(]+)\(([^)]+)\)$/);
    if (parenMatch) {
      title = parenMatch[1].trim();
      subtitle = parenMatch[2].trim();
    } else {
      const colonIndex = firstLine.indexOf(':');
      if (colonIndex > 0 && /voice\s*call|video\s*call/i.test(firstLine.substring(0, colonIndex))) {
        title = firstLine.substring(0, colonIndex).trim();
        subtitle = firstLine.substring(colonIndex + 1).trim();
      } else {
        if (isSilenced) {
          subtitle = 'Focus mode';
        } else if (isMissed) {
          subtitle = 'Missed';
        } else {
          subtitle = isVideo ? 'Video call' : 'Voice call';
        }
      }
    }
  }

  // Double check title cleanup (remove (51 sec) from title if still there)
  title = title.replace(/\([^)]+\)/g, '').trim();

  // Normalize titles to match WhatsApp standard
  const titleLower = title.toLowerCase();
  if (titleLower.includes('silenced')) {
    title = isVideo ? 'Silenced video call' : 'Silenced voice call';
  } else if (titleLower.includes('missed')) {
    title = isVideo ? 'Missed video call' : 'Missed voice call';
  } else {
    title = isVideo ? 'Video call' : 'Voice call';
  }

  return {
    isCall: true,
    type: isVideo ? 'video' : 'voice',
    isSilenced,
    isMissed,
    title,
    subtitle
  };
}

function VoiceNotePlayer({ 
  msg, 
  isMe, 
  theme, 
  alignUser 
}: { 
  msg: ChatMessage; 
  isMe: boolean; 
  theme: ChatTheme; 
  alignUser: string;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(12);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (msg.id) {
      const code = msg.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const mockDur = 3 + (code % 28); // mock length between 3s and 30s
      setDuration(mockDur);
    }
  }, [msg.id]);

  useEffect(() => {
    if (msg.attachment?.localUrl) {
      const audio = new Audio(msg.attachment.localUrl);
      audioRef.current = audio;

      const onTimeUpdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100);
          setElapsed(audio.currentTime);
        }
      };

      const onLoadedMetadata = () => {
        if (audio.duration) {
          setDuration(audio.duration);
        }
      };

      const onEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setElapsed(0);
      };

      audio.addEventListener('timeupdate', onTimeUpdate);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', onTimeUpdate);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('ended', onEnded);
      };
    }
  }, [msg.attachment?.localUrl]);

  useEffect(() => {
    if (!msg.attachment?.localUrl && isPlaying) {
      const startTime = Date.now() - (elapsed * 1000);
      timerRef.current = setInterval(() => {
        const secondsSpent = (Date.now() - startTime) / 1000;
        if (secondsSpent >= duration) {
          setIsPlaying(false);
          setProgress(100);
          setElapsed(duration);
          clearInterval(timerRef.current);
          
          setTimeout(() => {
            setProgress(0);
            setElapsed(0);
          }, 600);
        } else {
          setElapsed(secondsSpent);
          setProgress((secondsSpent / duration) * 100);
        }
      }, 50);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [isPlaying, msg.attachment?.localUrl, duration]);

  const togglePlay = () => {
    if (msg.attachment?.localUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(e => console.error("Audio playback error:", e));
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const numBars = 22;
  const bars = useMemo(() => {
    const list = [];
    const code = msg.id ? msg.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 100;
    for (let i = 0; i < numBars; i++) {
      const height = 4 + (((code + i * 17) % 7) * 2.8);
      list.push(height);
    }
    return list;
  }, [msg.id]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickedPercentage = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const newTime = (clickedPercentage / 100) * duration;
    
    if (msg.attachment?.localUrl && audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setProgress(clickedPercentage);
    setElapsed(newTime);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const senderInitials = msg.sender ? msg.sender.slice(0, 2).toUpperCase() : 'WA';

  const getWaveformColor = (active: boolean) => {
    const isDark = theme === 'ios-dark' || theme === 'lando-neon' || theme === 'cosmic';
    
    if (active) {
      if (theme === 'lando-neon') return 'bg-[#bfff00]';
      if (theme === 'cosmic') return 'bg-cyan-400';
      if (isMe) {
        return isDark ? 'bg-emerald-300' : 'bg-emerald-700';
      } else {
        return isDark ? 'bg-emerald-400' : 'bg-emerald-600';
      }
    } else {
      if (isMe) {
        return theme === 'ios-light' ? 'bg-[#c9ecb2]/85' : 'bg-white/20';
      } else {
        return theme === 'ios-light' ? 'bg-zinc-250' : 'bg-white/15';
      }
    }
  };

  return (
    <div className="flex items-center gap-2.5 w-full max-w-[270px] p-1 text-left leading-none" id={`voice-player-${msg.id}`}>
      <div className="relative shrink-0 select-none">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-[11px] uppercase tracking-wider relative ${
          isMe 
            ? 'bg-black/15 text-white/95 border border-white/5' 
            : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-200 border border-black/5'
        }`}>
          {senderInitials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-[14px] h-[14px] rounded-full bg-[#128c7e] border border-white dark:border-zinc-800 text-white flex items-center justify-center text-[7px] font-bold select-none leading-none p-0 p-0.5">
          🎙️
        </span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1 py-0.5">
        <div className="flex items-center gap-2 min-w-0 h-[26px]">
          <button 
            type="button"
            onClick={togglePlay}
            className={`w-[26px] h-[26px] rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0 select-none focus:outline-hidden ${
              isMe 
                ? 'bg-black/10 text-white hover:bg-black/20' 
                : 'bg-zinc-150 dark:bg-zinc-800 text-[#111b21] dark:text-white border border-transparent hover:bg-zinc-200'
            }`}
          >
            {isPlaying ? (
              <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-2.5 h-2.5 fill-current translate-x-px" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <div 
            onClick={handleTimelineClick}
            className="flex-1 h-8 flex items-center gap-[1.5px] cursor-pointer relative py-1"
          >
            {bars.map((barHeight, idx) => {
              const isActive = (idx / numBars) * 100 <= progress;
              return (
                <div 
                  key={idx}
                  className={`w-[2.2px] rounded-full transition-colors ${getWaveformColor(isActive)}`}
                  style={{ height: `${barHeight}px` }}
                />
              );
            })}

            <div 
              className="absolute w-2 h-2 rounded-full bg-white shadow-xs border border-zinc-350 pointer-events-none transform -translate-x-1/2"
              style={{ left: `${progress}%`, top: '50%', marginTop: '-4px' }}
            />
          </div>
        </div>

        <div className="flex justify-between items-center text-[9px] opacity-70 font-mono select-none px-0.5 leading-none mt-0.5">
          <span className="font-bold tracking-tight">
            {formatTime(isPlaying ? elapsed : 0)}
          </span>
          <span className="text-[9px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

interface ChatViewerProps {
  messages: ChatMessage[];
  participants: string[];
  stats?: ChatStats;
  fileName?: string;
}

export default function ChatViewer({ messages, participants, stats, fileName }: ChatViewerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSenderFilter, setSelectedSenderFilter] = useState<string | null>(null);
  const [alignUser, setAlignUser] = useState<string>(''); // Determines "Me"
  const [theme, setTheme] = useState<ChatTheme>(() => {
    const isPageLight = typeof document !== 'undefined' && document.getElementById('chatreader-root')?.classList.contains('light-mode');
    return isPageLight ? 'ios-light' : 'ios-dark';
  });

  useEffect(() => {
    const updateTheme = () => {
      const isPageLight = document.getElementById('chatreader-root')?.classList.contains('light-mode');
      setTheme(isPageLight ? 'ios-light' : 'ios-dark');
    };
    
    // Initial update
    updateTheme();
    
    // Set up MutationObserver to sync theme whenever classlist of chatreader-root updates
    const rootEl = document.getElementById('chatreader-root');
    if (!rootEl) return;
    
    const observer = new MutationObserver(updateTheme);
    observer.observe(rootEl, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);
  const [density, setDensity] = useState<'cozy' | 'compact'>('cozy');

  // Reply selection state
  const [replyingMessage, setReplyingMessage] = useState<ChatMessage | null>(null);
  const [customReplies, setCustomReplies] = useState<{[msgId: string]: ChatMessage['replyTo']}>({});

  // Dynamic file size simulator matching Joseph zip card
  const getFileSize = (fileName: string) => {
    if (fileName.toLowerCase().includes('joseph')) return '2.4 MB';
    if (fileName.toLowerCase().includes('chat')) return '2.4 MB';
    const ext = fileName.split('.').pop() || '';
    if (ext.toLowerCase() === 'zip') return '2.1 MB';
    if (ext.toLowerCase() === 'png' || ext.toLowerCase() === 'jpg') return '840 KB';
    if (ext.toLowerCase() === 'pdf') return '1.2 MB';
    return '140 KB';
  };

  // Automatic color mapper for speakers so they have matching colors like WhatsApp
  const senderColors = useMemo(() => {
    const colors = [
      'text-orange-500',
      'text-blue-500',
      'text-emerald-500',
      'text-amber-500',
      'text-purple-500',
      'text-indigo-400',
      'text-pink-500',
      'text-cyan-400',
      'text-rose-500',
      'text-teal-400',
    ];
    const mapping: { [name: string]: string } = {};
    participants.forEach((p, idx) => {
      mapping[p] = colors[idx % colors.length];
    });
    return mapping;
  }, [participants]);

  // Set default align user (usually first participant found, or "Me")
  useMemo(() => {
    const meIndex = participants.findIndex(p => p.toLowerCase().includes('me') || p.toLowerCase().includes('leo'));
    if (meIndex !== -1) {
      setAlignUser(participants[meIndex]);
    } else if (participants.length > 1) {
      setAlignUser(participants[0]); // default
    }
  }, [participants]);

  // Lazy loading state for extreme performance with large conversations
  const [visibleCount, setVisibleCount] = useState(200);

  // Reset display window on file/logs count change
  useEffect(() => {
    setVisibleCount(200);
  }, [messages, selectedSenderFilter]);

  // Filter messages based on search query AND speaker filter
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      const matchesSearch = msg.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            msg.sender.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSender = selectedSenderFilter ? msg.sender === selectedSenderFilter : true;
      return matchesSearch && matchesSender;
    });
  }, [messages, searchQuery, selectedSenderFilter]);

  // Sliced messages to keep rendering size low and execution fast
  const slicedMessages = useMemo(() => {
    if (filteredMessages.length <= visibleCount) {
      return filteredMessages;
    }
    return filteredMessages.slice(filteredMessages.length - visibleCount);
  }, [filteredMessages, visibleCount]);

  // Group messages by Date (e.g., Yesterday / Today, or readable local format) to render date dividers
  const groupedByDate = useMemo(() => {
    const groups: { [dateKey: string]: ChatMessage[] } = {};
    slicedMessages.forEach(msg => {
      const dateKey = msg.timestamp.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return Object.entries(groups);
  }, [slicedMessages]);

  const highlightText = (text: string, search: string) => {
    if (!search) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={i} className="bg-[#bfff00]/90 text-black font-extrabold rounded px-0.5">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Background Theme Styling Class generator
  const getThemeBackgroundStyles = () => {
    switch (theme) {
      case 'ios-dark':
        return 'bg-[#0b141a] text-slate-100 border-[#202c33]';
      case 'lando-neon':
        return 'bg-[#000000] text-[#bfff00] border-neutral-900';
      case 'cosmic':
        return 'bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-slate-100 border-purple-900';
      case 'ios-light':
      default:
        return 'bg-[#efeae2] text-slate-900 border-slate-200'; // sandy whatsapp background
    }
  };

  const getThemeBubbleStyles = (isMe: boolean) => {
    if (isMe) {
      switch (theme) {
        case 'ios-dark':
          return 'bg-[#005c4b] text-white border-transparent';
        case 'lando-neon':
          return 'bg-[#bfff00] text-black border-[#bfff00] font-mono font-medium';
        case 'cosmic':
          return 'bg-indigo-600 text-white border-transparent shadow-lg';
        case 'ios-light':
        default:
          return 'bg-[#d9fdd3] text-[#111b21] border-transparent shadow-3xs'; // real light-green WA bubble
      }
    } else {
      switch (theme) {
        case 'ios-dark':
          return 'bg-[#202c33] text-[#e9edef] border-transparent';
        case 'lando-neon':
          return 'bg-[#121212] text-white border-neutral-800 font-mono';
        case 'cosmic':
          return 'bg-slate-800 text-purple-100 border-transparent shadow-md';
        case 'ios-light':
        default:
          return 'bg-white text-[#111b21] border-[#f0f0f5] shadow-3xs'; // classic white bubble
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="chat-viewer-tab">
      
      {/* Control Actions toolbar - Rebuilt in clean ChatReader neon style */}
      <div className="bg-[#0c0c0c] border border-neutral-800 rounded-xl p-5 shadow-xl space-y-4" id="toolbar">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Senders drop down (Who is Me) */}
          <div className="flex-1 flex flex-col gap-2" id="toolbar-setup-row">
            <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#bfff00] rounded-full" /> Treat as "Me" (Outgoing Sender):
            </span>
            <select
              value={alignUser}
              onChange={(e) => setAlignUser(e.target.value)}
              className="w-full bg-[#121212] border border-neutral-800 hover:border-neutral-700 text-white rounded-lg px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-[#bfff00]"
              id="align-user-select"
            >
              <option value="">(No alignment - list style)</option>
              {participants.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search string input */}
          <div className="flex-1 flex flex-col gap-2" id="search-input-field">
            <span className="text-[10px] uppercase font-bold text-neutral-400 font-mono tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#bfff00] rounded-full" /> Search Chat Buffer content:
            </span>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                placeholder="Type keyword to scan messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-[#121212] text-white border border-neutral-800 rounded-lg focus:outline-hidden focus:border-[#bfff00] placeholder-neutral-600 font-mono"
                id="chat-search"
              />
            </div>
          </div>
        </div>

        {/* Filters and Look Configurations rows */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-neutral-900 text-xs">
          
          {/* Theme chips list */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 max-w-full overflow-hidden w-full" id="theme-toggles">
            <span className="text-neutral-400 font-bold mr-2 uppercase text-[10px] tracking-wider font-mono shrink-0">Simulator Theme:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar whitespace-nowrap py-1 scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
              {(['ios-dark', 'ios-light', 'lando-neon', 'cosmic'] as ChatTheme[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTheme(t)}
                  className={`capitalize px-3 py-1 text-[10px] rounded-md border font-mono tracking-wider font-extrabold transition-all duration-200 shrink-0 ${
                    theme === t
                      ? 'bg-[#bfff00] text-black border-[#bfff00] shadow-[#bfff00]/20 shadow-md'
                      : 'bg-neutral-900 text-neutral-450 border-neutral-800 hover:text-neutral-200 hover:border-neutral-700 hover:bg-neutral-850'
                  }`}
                  id={`theme-btn-${t}`}
                >
                  {t === 'ios-dark' ? '📱 WhatsApp Dark' : t === 'ios-light' ? '🔆 WhatsApp Light' : t === 'lando-neon' ? '⚡ ChatReader Neon' : '🌌 Cosmic Space'}
                </button>
              ))}
            </div>
          </div>

          {/* Density settings and general helper tools */}
          <div className="flex items-center gap-4" id="view-options">
            <div className="flex items-center gap-1.5">
              <span className="text-neutral-400 font-bold uppercase text-[10px] tracking-wider font-mono">Padding Density:</span>
              <button
                onClick={() => setDensity('cozy')}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-bold ${
                  density === 'cozy' ? 'bg-[#bfff00]/20 text-[#bfff00] border border-[#bfff00]/40' : 'text-neutral-400 font-medium hover:text-neutral-200'
                }`}
                id="density-cozy-btn"
              >
                Cozy
              </button>
              <button
                onClick={() => setDensity('compact')}
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-bold ${
                  density === 'compact' ? 'bg-[#bfff00]/20 text-[#bfff00] border border-[#bfff00]/40' : 'text-neutral-400 font-medium hover:text-neutral-200'
                }`}
                id="density-compact-btn"
              >
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Sender Specific filtering pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-neutral-900" id="filter-sender-row">
          <span className="text-[10px] text-neutral-400 font-mono tracking-wider uppercase mr-2 font-bold">Filter by Speaker:</span>
          <button
            onClick={() => setSelectedSenderFilter(null)}
            className={`px-3 py-1 text-[10px] font-bold font-mono tracking-wider rounded-md border transition-all ${
              selectedSenderFilter === null
                ? 'bg-[#bfff00]/20 text-[#bfff00] border-[#bfff00]'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-750 hover:text-neutral-200'
            }`}
            id="all-speakers-pill"
          >
            ALL SPEAKERS
          </button>
          {participants.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedSenderFilter(selectedSenderFilter === p ? null : p)}
              className={`px-2.5 py-1 text-[10px] font-mono tracking-wider rounded-md border transition-all ${
                selectedSenderFilter === p
                  ? 'bg-[#bfff00]/20 text-[#bfff00] border-[#bfff00]'
                  : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-700 hover:text-white'
              }`}
              id={`speaker-pill-${idx}`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>



      {/* Frameless Flat Screenshot Panel Container */}
      <div className="max-w-[430px] w-full mx-auto relative bg-[#09090b] border border-neutral-800 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col justify-between overflow-hidden" id="iphone-device-chassis">
        {/* Digital display screen inside chassis */}
        <div className="w-full h-[730px] bg-black overflow-hidden flex flex-col relative" id="virtual-phone-display">
          
          {/* Physical status bar */}
          <div className={`h-10 px-6 flex items-center justify-between z-30 select-none text-[11px] font-bold tracking-tight shrink-0 ${
            theme === 'ios-light' ? 'bg-[#f6f6f6] text-black' : 'bg-[#0f0f14] text-white/95'
          }`} id="iphone-status-line">
            {/* Outgoing display time matching image sample */}
            <span className="font-sans">17:20</span>
            
            {/* Capsule dynamic island widget overlay */}
            <div className="w-24 h-6 bg-black rounded-full absolute left-1/2 transform -translate-x-1/2 top-1.5 z-40 flex items-center justify-center border border-neutral-800/10" id="dynamic-island">
              <div className="w-2 h-2 rounded-full bg-[#05051a] absolute right-4 scale-90" />
            </div>

            <div className="flex items-center gap-1.5 font-sans">
              <span className="text-[9px] tracking-tight text-current opacity-90">5G</span>
              <span className="text-[10px] opacity-90">🔋 81%</span>
            </div>
          </div>

          {/* Genuine iOS WhatsApp Top bar header */}
          <div className={`p-2 py-2.5 px-3 flex items-center justify-between select-none border-b shrink-0 z-20 ${
            theme === 'ios-light' 
              ? 'bg-[#f6f6f6] text-[#000000] border-gray-200' 
              : theme === 'lando-neon'
              ? 'bg-[#0a0a0a] text-white border-neutral-900'
              : 'bg-[#1c1c1e] text-white border-[#2c2c2e]'
          }`} id="ios-whatsapp-top-header">
            
            <div className="flex items-center gap-2 min-w-0">
              {/* Back Button with unread count badge exactly matching iOS */}
              <button className="flex items-center text-[#007aff] hover:opacity-80 transition-all font-semibold select-none cursor-pointer shrink-0">
                <span className="text-xl leading-none">‹</span>
                <span className="text-[14px] font-medium leading-none ml-0.5">2</span>
              </button>

              {/* Avatar circle */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs uppercase shrink-0 select-none ${
                theme === 'ios-light' ? 'bg-zinc-200 text-zinc-700' : 'bg-[#2c2c2e] text-emerald-400 border border-white/5'
              }`}>
                {participants.length > 0 
                  ? (alignUser ? participants.find(p => p !== alignUser) || participants[0] : participants[0]).slice(0, 2)
                  : 'WA'
                }
              </div>

              {/* Chat info details layout */}
              <div className="leading-tight text-left min-w-0">
                <h4 className="font-bold text-[14px] text-current truncate tracking-tight">
                  {participants.length > 0 
                    ? (alignUser ? participants.filter(p => p !== alignUser).join(', ') || alignUser : participants.join(', '))
                    : 'WhatsApp Chat'
                  }
                </h4>
                <p className={`text-[10px] font-medium ${theme === 'ios-light' ? 'text-gray-500' : 'text-gray-400'}`}>
                  online
                </p>
              </div>
            </div>

            {/* iOS Telephone and camera Call actions */}
            <div className="flex items-center gap-4 text-[#007aff] px-1 shrink-0">
              <button className="hover:opacity-80 transition-opacity cursor-pointer">
                {/* iOS Camcorder SVG */}
                <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                  <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11z" />
                </svg>
              </button>
              <button className="hover:opacity-80 transition-opacity cursor-pointer">
                {/* iOS Handset Call SVG */}
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.15 15.15 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1-.27 11.53 11.53 0 0 0 3.61.57 1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1A16 16 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1 11.53 11.53 0 0 0 .57 3.61 1 1 0 0 1-.27 1z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Genuine iOS WhatsApp Chat Wallpaper Scroller wall */}
          <div
            className={`flex-1 overflow-y-auto p-3.5 sm:p-4.5 transition-all duration-300 flex flex-col gap-2 relative ${getThemeBackgroundStyles()}`}
            id="chat-scroller-main"
            style={{
              backgroundImage: theme === 'ios-light' || theme === 'ios-dark' 
                ? `url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')`
                : undefined,
              backgroundBlendMode: theme === 'ios-dark' ? 'multiply' : 'normal',
              backgroundColor: theme === 'ios-dark' ? '#0b141a' : theme === 'ios-light' ? '#efeae2' : undefined
            }}
          >
            {/* Lazy Load Incremental Trigger Button */}
            {filteredMessages.length > visibleCount && (
              <div className="flex justify-center my-3" id="load-older-btn-wrapper">
                <button
                  type="button"
                  onClick={() => setVisibleCount(v => Math.min(v + 1000, filteredMessages.length))}
                  className={`px-4 py-2 text-[10px] font-mono tracking-widest font-black uppercase transition-all duration-200 border rounded-lg cursor-pointer ${
                    theme === 'ios-light'
                      ? 'bg-white hover:bg-neutral-100 text-zinc-700 border-zinc-200 shadow-3xs'
                      : 'bg-[#182229]/95 hover:bg-black text-[#bfff00] border-neutral-800 hover:border-[#bfff00]/50 shadow-md'
                  }`}
                  id="load-older-msg-btn"
                >
                  ◀ LOAD 1,000 OLDER MESSAGES ({filteredMessages.length - visibleCount} LEFT)
                </button>
              </div>
            )}

            {groupedByDate.map(([dateKey, messagesInDate]) => (
              <div key={dateKey} className="space-y-2.5 w-full flex flex-col" id={`date-group-${dateKey.replace(/\s+/g, '-')}`}>
                
                {/* Date bubble badge centered */}
                <div className="flex justify-center my-3" id={`divider-row-${dateKey.replace(/\s+/g, '-')}`}>
                  <span className={`px-3 py-1 text-[10px] font-semibold tracking-tight rounded-md select-none ${
                    theme === 'ios-light'
                      ? 'bg-neutral-200/90 text-neutral-800'
                      : 'bg-[#182229] border border-transparent text-gray-400'
                  }`}>
                    {dateKey.toUpperCase().includes('TODAY') || dateKey.toUpperCase().includes('YESTERDAY') ? dateKey : dateKey}
                  </span>
                </div>

                {/* Direct loop of message speech bubbles */}
                {messagesInDate.map((msg) => {
                  const isSystem = msg.isSystem;
                  if (isSystem) {
                    const isEncryption = msg.content.toLowerCase().includes('encrypted') || msg.content.toLowerCase().includes('security code');
                    
                    if (isEncryption) {
                      return (
                        <div key={msg.id} className="flex justify-center text-center my-2.5 px-4" id={`sys-encryption-${msg.id}`}>
                          <div className={`p-2 px-3 rounded-lg max-w-xs text-[10.5px] leading-relaxed text-center flex items-start gap-1.5 shadow-xs select-none border border-yellow-700/10 ${
                            theme === 'ios-light'
                              ? 'bg-[#ffe395]/45 text-[#614b0f]'
                              : 'bg-[#182229]/95 text-[#ffd360]'
                          }`}>
                            <span className="text-xs shrink-0 select-none">🔒</span>
                            <span className="font-semibold text-left">
                              {msg.content}
                            </span>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={msg.id} className="flex justify-center text-center my-1.5 px-4" id={`sys-general-${msg.id}`}>
                          <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-md select-none border ${
                            theme === 'ios-light'
                              ? 'bg-white/85 text-zinc-500 border-zinc-200/60'
                              : 'bg-neutral-800/80 text-[#8e8e93] border-transparent'
                          }`}>
                            {msg.content}
                          </span>
                        </div>
                      );
                    }
                  }

                  const isUserMe = (senderName: string) => {
                    if (!senderName) return false;
                    const cleaned = senderName.trim().toLowerCase();
                    return cleaned === 'you' || cleaned === 'me' || (alignUser && cleaned === alignUser.trim().toLowerCase());
                  };

                  const isMe = alignUser === msg.sender;
                  const matchesSearch = searchQuery && msg.content.toLowerCase().includes(searchQuery.toLowerCase());
                  const normContent = msg.content.toLowerCase().trim();
                  const callInfo = detectAndParseCall(msg.content);
                  
                  // Check if deleted exactly
                  const isDeleted = normContent === 'this message was deleted.' ||
                                    normContent === 'this message was deleted' ||
                                    normContent === 'you deleted this message.' ||
                                    normContent === 'you deleted this message' ||
                                    (normContent.startsWith('🚫') && (normContent.includes('message was deleted') || normContent.includes('deleted this message')));

                  // Resolve combined replies
                  const activeReply = msg.replyTo || customReplies[msg.id];

                  // Styling for quote cards
                  const getQuoteCardStyles = (quotedSender: string, bubbleSentByMe: boolean) => {
                    const isQuotedMe = isUserMe(quotedSender);
                    let accentBorderColor = 'border-[#25d366]';
                    let accentTextColor = 'text-[#25d366]';

                    if (isQuotedMe) {
                      const isDark = theme === 'ios-dark' || theme === 'lando-neon' || theme === 'cosmic';
                      accentBorderColor = isDark ? 'border-[#30d0c7]' : 'border-[#008069]';
                      accentTextColor = isDark ? 'text-[#30d0c7]' : 'text-[#008069]';
                    } else {
                      const mappedClass = senderColors[quotedSender];
                      if (mappedClass) {
                        accentTextColor = mappedClass;
                        accentBorderColor = mappedClass.replace('text-', 'border-');
                      } else {
                        accentTextColor = 'text-orange-400';
                        accentBorderColor = 'border-orange-400';
                      }
                    }

                    let bg = 'bg-black/5';
                    if (theme === 'ios-dark') {
                      bg = bubbleSentByMe ? 'bg-[#004a3e]' : 'bg-[#1c1c1e]';
                    } else if (theme === 'lando-neon') {
                      bg = bubbleSentByMe ? 'bg-black/20' : 'bg-black/40';
                    } else {
                      bg = bubbleSentByMe ? 'bg-[#c3ecd0]/60' : 'bg-[#f0f2f5]';
                    }

                    return { bg, accentBorderColor, accentTextColor };
                  };

                  const quoteStyles = activeReply ? getQuoteCardStyles(activeReply.sender, isMe) : null;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-center gap-1.5 group relative`}
                      id={`message-bubble-wrapper-${msg.id}`}
                    >
                      {/* Manual link quote selector trigger button on hover */}
                      {!replyingMessage && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyingMessage(msg);
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 bg-neutral-900 border border-neutral-800 hover:border-[#bfff00] text-neutral-400 hover:text-white rounded-full transition-all cursor-pointer shadow-md select-none shrink-0 w-6 h-6 flex items-center justify-center ${
                            isMe ? 'order-first' : 'order-last'
                          }`}
                          title="Click here to link raw reply thread mapping manually"
                          id={`btn-reply-link-${msg.id}`}
                        >
                          <CornerUpLeft className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Speech Bubble Container */}
                      <div
                        onClick={() => {
                          if (replyingMessage) {
                            if (replyingMessage.id === msg.id) return; // cannot reply to self
                            setCustomReplies(prev => ({
                              ...prev,
                              [replyingMessage.id]: {
                                id: msg.id,
                                sender: msg.sender,
                                content: msg.content
                              }
                            }));
                            setReplyingMessage(null);
                          }
                        }}
                        className={`max-w-[85%] rounded-2xl px-3 flex flex-col transition-all border relative ${
                          isMe 
                            ? 'rounded-tr-xs ml-10' 
                            : 'rounded-tl-xs mr-10'
                        } ${
                          density === 'compact' ? 'py-1' : 'py-2'
                        } ${getThemeBubbleStyles(isMe)} ${
                          matchesSearch ? 'ring-3 ring-[#bfff00]' : ''
                        } ${
                          replyingMessage 
                            ? replyingMessage.id === msg.id
                              ? 'ring-2 ring-[#007aff] scale-98 opacity-90'
                              : 'cursor-pointer hover:scale-[1.015] hover:ring-2 hover:ring-amber-500 hover:border-amber-400 border-dashed border-neutral-700'
                            : ''
                        }`}
                        id={`bubble-${msg.id}`}
                      >
                        {/* Sender's label for group incoming messages */}
                        {!isMe && !isDeleted && !callInfo.isCall && (
                          <span className={`text-[11.5px] font-bold tracking-tight mb-0.5 text-left leading-none ${senderColors[msg.sender] || 'text-orange-400'}`} id={`sender-sub-${msg.id}`}>
                            {msg.sender}
                          </span>
                        )}

                        {callInfo.isCall ? (
                          <div className="flex items-center gap-3 py-1.5 min-w-[210px] sm:min-w-[230px]" id={`call-bubble-${msg.id}`}>
                            {/* Circle badge */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                              theme === 'ios-light' ? 'bg-[#f0f0f4]' : 'bg-[#2a2b2e]'
                            }`}>
                              <div className="relative flex items-center justify-center">
                                {callInfo.type === 'video' ? (
                                  <Video className={`w-4 h-4 ${
                                    callInfo.isSilenced || callInfo.isMissed 
                                      ? 'text-[#ff453a]' 
                                      : (theme === 'ios-light' ? 'text-zinc-600' : 'text-zinc-300')
                                  }`} style={{ transform: 'scaleX(-1)' }} />
                                ) : (
                                  <Phone className={`w-4 h-4 ${
                                    callInfo.isSilenced || callInfo.isMissed 
                                      ? 'text-[#ff453a]' 
                                      : (theme === 'ios-light' ? 'text-zinc-600' : 'text-zinc-300')
                                  }`} />
                                )}
                                {/* Red or gray arrow symbol indicating incoming call */}
                                <span className={`absolute -bottom-[2px] -right-[1.5px] text-[10.5px] font-extrabold leading-none select-none ${
                                  callInfo.isSilenced || callInfo.isMissed 
                                    ? 'text-[#ff453a]' 
                                    : (theme === 'ios-light' ? 'text-zinc-500' : 'text-zinc-400')
                                }`}>
                                  ↙
                                </span>
                              </div>
                            </div>

                            {/* Call description contents */}
                            <div className="flex-1 flex flex-col justify-center min-w-0 text-left">
                              <span className={`text-[13px] font-semibold leading-tight tracking-tight truncate ${
                                theme === 'ios-light' ? 'text-zinc-900' : 'text-zinc-100'
                              }`}>
                                {callInfo.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                <span className={`text-[11.5px] leading-tight truncate flex-1 ${
                                  callInfo.isSilenced || callInfo.isMissed 
                                    ? 'text-[#8e8e93]' 
                                    : 'text-[#8e8e93]'
                                }`}>
                                  {callInfo.subtitle}
                                </span>
                                <span className="text-[9px] text-[#8e8e93] font-mono leading-none select-none pr-0.5 shrink-0">
                                  {msg.timestamp.toLocaleTimeString(undefined, {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: false
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            {isDeleted ? (
                              /* Prohibited Deleted message block matching the requested iOS styling */
                              <div className="flex items-center gap-1.5 text-[11.5px] text-zinc-500 dark:text-zinc-500 py-1 font-normal select-none italic" id={`deleted-msg-row-${msg.id}`}>
                                <span className="text-zinc-400 dark:text-zinc-500 font-sans select-none tracking-normal">🚫</span>
                                <span>
                                  {isMe ? 'You deleted this message.' : 'This message was deleted.'}
                                </span>
                              </div>
                            ) : (
                              <>
                                {/* Embedded Reply block inside bubble card */}
                                {activeReply && quoteStyles && (
                                  <div 
                                    className={`mb-1.5 p-1.5 px-2.5 rounded-lg text-[11px] border-l-[3px] leading-snug flex flex-col gap-0.5 cursor-pointer max-w-full text-left transition-colors ${quoteStyles.bg} ${quoteStyles.accentBorderColor}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (activeReply.id) {
                                        const targetEl = document.getElementById(`bubble-${activeReply.id}`);
                                        if (targetEl) {
                                          targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          targetEl.classList.add('ring-3', 'ring-[#007aff]');
                                          setTimeout(() => {
                                            targetEl.classList.remove('ring-3', 'ring-[#007aff]');
                                          }, 1500);
                                        }
                                      }
                                    }}
                                  >
                                    <span className={`font-black text-[9.5px] uppercase tracking-wide ${quoteStyles.accentTextColor}`}>
                                      {isUserMe(activeReply.sender) ? 'You' : activeReply.sender}
                                    </span>
                                    <p className="opacity-80 truncate text-[10.5px]">
                                      {activeReply.content}
                                    </p>
                                  </div>
                                )}

                                {/* Document item preview layout matching Joseph zip */}
                                {msg.attachment && (
                                  <div className="my-1 max-w-full">
                                    {msg.attachment.fileType === 'document' && (
                                      <a 
                                        href={msg.attachment.localUrl || '#'} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        download={msg.attachment.localUrl ? msg.attachment.fileName : undefined} 
                                        className={`flex items-start gap-2.5 p-2 rounded-xl transition-all text-xs text-left ${
                                          isMe 
                                            ? 'bg-[#002e25] text-white border border-[#ffffff]/5' 
                                            : 'bg-[#1c1c1e] text-slate-100 border border-[#ffffff]/5'
                                        }`}
                                        onClick={(e) => {
                                          if (!msg.attachment?.localUrl) {
                                            e.preventDefault();
                                          }
                                        }}
                                      >
                                        <div className="p-2 bg-[#025243] text-white rounded-lg select-none flex items-center justify-center shrink-0">
                                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                        </div>
                                        <div className="min-w-0 flex-1 leading-snug py-0.5">
                                          <p className="font-bold truncate text-[12px] text-white leading-tight">
                                            {msg.attachment.fileName}
                                          </p>
                                          <p className="text-[10px] text-gray-400 mt-1 font-mono tracking-tight">
                                            {getFileSize(msg.attachment.fileName)} • zip
                                          </p>
                                        </div>
                                      </a>
                                    )}

                                    {/* Image, video, and audio embeds */}
                                    {msg.attachment.fileType === 'image' && (
                                      msg.attachment.localUrl ? (
                                        <div className="relative overflow-hidden rounded-xl border border-white/5 shadow-3xs max-w-full bg-black/40" id={`photo-frame-${msg.id}`}>
                                          <a 
                                            href={msg.attachment.localUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            download={msg.attachment.fileName} 
                                            className="block max-h-60"
                                          >
                                            <img 
                                              src={msg.attachment.localUrl} 
                                              alt="Visual upload" 
                                              referrerPolicy="no-referrer" 
                                              className="max-h-60 w-full object-cover rounded-xl" 
                                            />
                                          </a>
                                          {/* WhatsApp HD badge overlay bottom-left */}
                                          <div className="absolute bottom-2 left-2 select-none pointer-events-none bg-black/45 text-[8.5px] font-black text-white/95 px-1 py-0.5 rounded-sm uppercase tracking-wide">
                                            HD
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="w-[260px] h-[170px] rounded-xl relative flex flex-col justify-between p-3 select-none overflow-hidden bg-gradient-to-tr from-slate-900 via-neutral-950 to-indigo-950/40 border border-white/[0.08]" id={`mock-photo-${msg.id}`}>
                                          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20" />
                                          <div className="flex items-center gap-1.5 opacity-40 select-none">
                                            <div className="w-1.5 h-1.5 bg-sky-500 rounded-full" />
                                            <span className="text-[10px] font-mono tracking-wider uppercase font-extrabold text-[#94a3b8]">Offline Asset</span>
                                          </div>
                                          <div className="flex flex-col items-center justify-center gap-1 flex-1 select-none">
                                            <span className="text-3xl filter drop-shadow-md leading-none">📷</span>
                                            <span className="text-xs font-sans font-black text-white tracking-wide uppercase select-none mt-1">Photo Message</span>
                                          </div>
                                          <div className="text-[8px] font-mono text-zinc-500 text-right uppercase tracking-normal select-none">
                                            Visual archive saved
                                          </div>
                                        </div>
                                      )
                                    )}

                                    {/* Video embeds */}
                                    {msg.attachment.fileType === 'video' && (
                                      msg.attachment.localUrl ? (
                                        <video src={msg.attachment.localUrl} controls className="max-h-52 w-full rounded-lg bg-black" />
                                      ) : (
                                        <div className="w-[260px] h-[170px] rounded-xl relative flex flex-col justify-between p-3 select-none overflow-hidden bg-gradient-to-tr from-slate-900 via-neutral-950 to-purple-950/40 border border-white/[0.08]" id={`mock-video-${msg.id}`}>
                                          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-black/20" />
                                          <div className="flex items-center gap-1.5 opacity-40 select-none">
                                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                            <span className="text-[10px] font-mono tracking-wider uppercase font-extrabold text-[#94a3b8]">Video Storage</span>
                                          </div>
                                          <div className="flex flex-col items-center justify-center gap-1 flex-1 select-none">
                                            <span className="text-3xl filter drop-shadow-md leading-none">🎥</span>
                                            <span className="text-xs font-sans font-black text-white tracking-wide uppercase select-none mt-1">Video Recording</span>
                                          </div>
                                          <div className="text-[8px] font-mono text-zinc-500 text-right uppercase tracking-normal select-none">
                                            Cinematic capture buffered
                                          </div>
                                        </div>
                                      )
                                    )}

                                    {/* Audio embeds */}
                                    {msg.attachment.fileType === 'audio' && (
                                      <VoiceNotePlayer msg={msg} isMe={isMe} theme={theme} alignUser={alignUser} />
                                    )}
                                  </div>
                                )}

                                {/* Standard message textual representation */}
                                {(!msg.attachment || (msg.content.replace(/<attached:\s*([^>]+)>/i, '').replace(/^.+?\s*\((file attached|attached)\)$/i, '').replace(/^.+?\s*<(attached)>/i, '').replace(/<.+?omitted>/i, '').trim().length > 0)) && (
                                  <p className={`text-xs select-text text-left break-words whitespace-pre-wrap ${density === 'compact' ? 'leading-tight' : 'leading-relaxed'}`} id={`content-${msg.id}`}>
                                    {highlightText(
                                      msg.attachment 
                                        ? msg.content.replace(/<attached:\s*([^>]+)>/i, '').replace(/^.+?\s*\((file attached|attached)\)$/i, '').replace(/^.+?\s*<(attached)>/i, '').replace(/<.+?omitted>/i, '').trim()
                                        : msg.content, 
                                      searchQuery
                                    )}
                                  </p>
                                )}
                              </>
                            )}

                            {/* Speech Bubble timestamp and tick marks inside bottom corner */}
                            <span className="text-[9px] text-[#8e8e93] font-mono font-medium self-end mt-1 flex items-center justify-end gap-0.5 leading-none select-none">
                              <span>
                                {msg.timestamp.toLocaleTimeString(undefined, {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: false
                                })}
                              </span>
                              {isMe && !isDeleted && (
                                /* Blue double tick ticks state from screenshots */
                                <span className="text-[#30d0c7] tracking-normal inline-block ml-0.5 font-bold">✓✓</span>
                              )}
                            </span>
                          </>
                        )}

                        {/* Interactive Emojis reactions overlay */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div 
                            className={`absolute -bottom-2.5 shrink-0 flex items-center gap-0.5 rounded-full px-1.5 py-0.5 shadow-md border hover:scale-105 active:scale-95 transition-transform cursor-default z-10 select-none ${
                              isMe ? 'right-3' : 'left-3'
                            }`}
                            style={{
                              backgroundColor: theme === 'ios-light' ? '#ece5dd' : '#1f2c34',
                              borderColor: theme === 'ios-light' ? '#cbd5e1' : '#374151',
                              color: theme === 'ios-light' ? '#111b21' : '#e9edef'
                            }}
                            title={msg.reactions.map(r => `${r.sender}: ${r.emoji}`).join(', ')}
                            id={`bubble-reactions-${msg.id}`}
                          >
                            <span className="text-[11px] leading-none">
                              {Array.from(new Set(msg.reactions.map(r => r.emoji))).slice(0, 3).join('')}
                            </span>
                            {msg.reactions.length > 1 && (
                              <span className="text-[9px] font-bold pl-0.5 leading-none">
                                {msg.reactions.length}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Empty stats filtering */}
            {groupedByDate.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-70" id="empty-results">
                <span className="text-3xl">🚫</span>
                <p className="font-bold text-sm text-neutral-400 mt-2 font-mono uppercase tracking-wider">No matching traces</p>
              </div>
            )}
          </div>

          {/* Active Reply Banner popup mode */}
          {replyingMessage && (
            <div className={`p-2 px-3 flex items-center justify-between text-xs font-medium shrink-0 animate-slide-up select-none border-t ${
              theme === 'ios-light' ? 'bg-[#e5e5ea] text-zinc-700' : 'bg-[#1c1c1e] text-zinc-300 border-[#2c2c2e]'
            }`} id="active-reply-banner">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <CornerUpLeft className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <div className="truncate text-left leading-tight">
                  <span className="block font-extrabold text-[9.5px] uppercase tracking-wider text-blue-500">
                    Manual Thread Mapping Mode
                  </span>
                  <span className="text-[10px] opacity-75 truncate block">
                    Now click the message that <strong>{replyingMessage.sender}</strong> is replying to
                  </span>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setReplyingMessage(null)}
                className="hover:opacity-60 transition-opacity p-0.5 shrink-0 ml-2"
              >
                <X className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
          )}

          {/* iOS physical Bottom bar and button elements conforming to user's second screenshot */}
          <div className={`p-2.5 pb-5 px-3 flex items-center gap-2 select-none border-t shrink-0 ${
            theme === 'ios-light' ? 'bg-[#f6f6f6] border-zinc-200' : 'bg-[#0f0f14] border-neutral-900/40'
          }`} id="ios-input-bar">
            
            {/* Left iOS plus button */}
            <button 
              title="Add attachment" 
              className="text-[#007aff] hover:opacity-75 p-1 active:opacity-60 shrink-0 select-none cursor-pointer focus:outline-hidden"
            >
              {/* Rounded simple iOS style + */}
              <div className="w-7 h-7 bg-[#007aff]/10 rounded-full flex items-center justify-center font-bold text-[18px] leading-none text-[#007aff]">
                +
              </div>
            </button>

            {/* Main message text capsule input */}
            <div className={`flex-1 rounded-full px-3.5 py-1.5 flex items-center justify-between border min-w-0 h-9 shrink-0 ${
              theme === 'ios-light' 
                ? 'bg-[#ffffff] border-zinc-200' 
                : 'bg-[#1c1c1e] border-neutral-800'
            }`}>
              <span className={`text-[13px] font-normal leading-normal select-none truncate opacity-40 ${
                theme === 'ios-light' ? 'text-zinc-800' : 'text-zinc-100'
              }`}>
                Message
              </span>

              {/* Sticker folding paper page icon on inside right */}
              <button className="text-[#007aff] hover:opacity-70 p-0.5 select-none focus:outline-hidden">
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </button>
            </div>

            {/* Right iOS camera attachment and audio microphone icons packs */}
            <button className="text-[#007aff] hover:opacity-75 p-1 active:opacity-60 shrink-0 select-none cursor-pointer focus:outline-hidden">
              <Camera className="w-5.2 h-5.2 text-[#007aff]" />
            </button>

            <button className="text-[#007aff] hover:opacity-75 p-1 active:opacity-60 shrink-0 select-none cursor-pointer focus:outline-hidden">
              <Mic className="w-5 h-5 text-[#007aff]" />
            </button>
          </div>
        </div>
      </div>

      {/* Offline Download Action Segment Under the Chat Preview */}
      {stats && (
        <div className="max-w-[430px] w-full mx-auto mt-4 bg-[#101010] border border-neutral-850 p-5 shadow-xl flex flex-col items-center gap-3 text-center rounded-xl" id="under-chat-export-banner">
          <div>
            <h4 className="text-[11px] font-black text-[#bfff00] uppercase tracking-widest font-mono">💾 DOWNLOAD OFFLINE TRANSCRIPT</h4>
            <p className="text-[10.5px] text-neutral-400 mt-1 leading-relaxed font-sans">
              Save the parsed dialogues and images as a standalone HTML file. Works completely offline.
            </p>
          </div>
          <ExportButton 
            messages={messages} 
            stats={stats} 
            chatTitle={(fileName || 'chat').replace(/\.[^/.]+$/, "")} 
            alignUser={alignUser}
            theme={theme}
          />
        </div>
      )}
    </div>
  );
}

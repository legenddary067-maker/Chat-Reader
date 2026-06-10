/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import * as React from 'react';
import { ChatStats, ParticipantStats, ChatMessage } from '../types';
import { calculateStats } from '../utils/parser';
import { 
  Trophy, 
  Flag,
  Gauge, 
  Timer, 
  Zap, 
  Flame, 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  Sparkles, 
  Activity, 
  AlertCircle,
  CalendarDays
} from 'lucide-react';
import { motion } from 'motion/react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarPicker } from '@/components/ui/calendar';

interface DashboardProps {
  stats: ChatStats;
  messages?: ChatMessage[];
}

export default function Dashboard({ stats, messages = [] }: DashboardProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [slideStart, setSlideStart] = useState(0);
  const [slideEnd, setSlideEnd] = useState(() => stats.timeline.length > 0 ? stats.timeline.length - 1 : 0);

  const [startIndex, setStartIndex] = useState(0);
  const [endIndex, setEndIndex] = useState(() => stats.timeline.length > 0 ? stats.timeline.length - 1 : 0);

  useEffect(() => {
    setSlideStart(0);
    setSlideEnd(stats.timeline.length > 0 ? stats.timeline.length - 1 : 0);
    setStartIndex(0);
    setEndIndex(stats.timeline.length > 0 ? stats.timeline.length - 1 : 0);
  }, [stats.timeline.length, stats.totalMessages]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setStartIndex(slideStart);
      setEndIndex(slideEnd);
    }, 120);
    return () => clearTimeout(handler);
  }, [slideStart, slideEnd]);

  const rawTimeline = stats.timeline;

  const safeStart = Math.min(startIndex, endIndex);
  const safeEnd = Math.max(startIndex, endIndex);

  const boundedStart = Math.min(Math.max(0, safeStart), rawTimeline.length - 1);
  const boundedEnd = Math.min(Math.max(boundedStart, safeEnd), rawTimeline.length - 1);

  const hasTimeline = rawTimeline && rawTimeline.length > 0;
  const startDateStr = hasTimeline ? rawTimeline[boundedStart]?.date : null;
  const endDateStr = hasTimeline ? rawTimeline[boundedEnd]?.date : null;

  const activeMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    if (!startDateStr || !endDateStr) return messages;

    return messages.filter(msg => {
      if (msg.isSystem) return false;
      const timestamp = msg.timestamp;
      const dStr = timestamp instanceof Date 
        ? timestamp.toISOString().split('T')[0] 
        : new Date(timestamp).toISOString().split('T')[0];
      return dStr >= startDateStr && dStr <= endDateStr;
    });
  }, [messages, startDateStr, endDateStr]);

  const activeStats = useMemo(() => {
    if (activeMessages.length === 0) return stats;
    return calculateStats(activeMessages);
  }, [activeMessages, stats]);

  const {
    totalMessages,
    totalWords,
    totalCharacters,
    totalEmojis,
    participants,
    allEmojis,
    allWords,
    timeline,
    hourlyDistribution,
    dayOfWeekDistribution,
    dateRange,
    peakHour,
    peakDay,
  } = activeStats;

  const participantArray = (Object.values(participants) as ParticipantStats[]).sort(
    (a, b) => b.messageCount - a.messageCount
  );

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Calculate dialogue interactivity links
  const conversationTopology = useMemo(() => {
    if (!activeMessages || activeMessages.length < 2) return { nodes: [], links: [] };

    // Collect all unique participant names
    const uniqueNames = Object.keys(participants);
    if (uniqueNames.length === 0) return { nodes: [], links: [] };

    // Initialize nodes
    const nodes = uniqueNames.map((name, idx) => ({
      id: name,
      index: idx,
      messageCount: participants[name]?.messageCount || 0
    })).sort((a, b) => b.messageCount - a.messageCount);

    // Matrix of interaction scores
    const matrix: Record<string, Record<string, number>> = {};
    uniqueNames.forEach(n1 => {
      matrix[n1] = {};
      uniqueNames.forEach(n2 => {
        matrix[n1][n2] = 0;
      });
    });

    // Count transitions: sender B replying near after sender A
    for (let i = 1; i < activeMessages.length; i++) {
      const prev = activeMessages[i - 1];
      const curr = activeMessages[i];
      if (!prev.sender || !curr.sender || prev.sender === curr.sender || prev.isSystem || curr.isSystem) continue;

      const prevTime = prev.timestamp instanceof Date ? prev.timestamp.getTime() : new Date(prev.timestamp).getTime();
      const currTime = curr.timestamp instanceof Date ? curr.timestamp.getTime() : new Date(curr.timestamp).getTime();
      
      // transition within 3 minutes (180 seconds)
      if (Math.abs(currTime - prevTime) <= 180 * 1000) {
        if (matrix[prev.sender]?.[curr.sender] !== undefined) {
          matrix[prev.sender][curr.sender] += 1;
          matrix[curr.sender][prev.sender] += 1; // Undirected topology
        }
      }
    }

    // Create links list
    const links: { source: string; target: string; value: number }[] = [];
    for (let i = 0; i < uniqueNames.length; i++) {
      for (let j = i + 1; j < uniqueNames.length; j++) {
        const u1 = uniqueNames[i];
        const u2 = uniqueNames[j];
        const val = matrix[u1][u2];
        if (val > 0) {
          links.push({ source: u1, target: u2, value: val });
        }
      }
    }

    links.sort((a, b) => b.value - a.value);

    return { nodes, links };
  }, [activeMessages, participants]);

  // Helper for format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDayName = (dayIndex: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour} ${period}`;
  };

  // Dialogue style complexity profiles mapper based on average message character count
  const getDialogueProfile = (p: ParticipantStats) => {
    const avgChars = p.messageCount > 0 ? Math.round(p.characterCount / p.messageCount) : 0;
    if (avgChars > 75) {
      return { 
        name: "Classic Essayist", 
        color: "border-white text-white", 
        bg: "bg-white text-black", 
        icon: "E",
        desc: "Profile: Long, deep, reflective essays" 
      };
    } else if (avgChars > 30) {
      return { 
        name: "Consistent Converser", 
        color: "border-amber-400 text-amber-400", 
        bg: "bg-amber-400 text-black", 
        icon: "C",
        desc: "Profile: Mid-length consistent messaging" 
      };
    } else {
      return { 
        name: "Rapid Responder", 
        color: "border-rose-500 text-rose-500", 
        bg: "bg-rose-500 text-white", 
        icon: "R",
        desc: "Profile: Quick, active reply bursts" 
      };
    }
  };

  // SVG Charting Configurations
  const renderHourlyChart = (data: number[]) => {
    const maxVal = Math.max(...data, 1);
    const height = 140;
    const paddingLeft = 35;
    const paddingRight = 10;
    const paddingTop = 15;
    const paddingBottom = 25;

    return (
      <div className="relative pt-2" id="hourly-chart-container">
        <svg className="w-full overflow-visible" height={height} viewBox={`0 0 500 ${height}`}>
          {/* Horizontal gridlines with high-spec motorsports aesthetics */}
          {[0, 0.5, 1].map((ratio, idx) => {
            const y = paddingTop + (1 - ratio) * (height - paddingTop - paddingBottom);
            return (
              <line
                key={idx}
                x1={paddingLeft}
                y1={y}
                x2={500 - paddingRight}
                y2={y}
                stroke="#2a2a2a"
                strokeWidth="1"
                strokeDasharray="4 4"
                id={`gridline-h-${idx}`}
              />
            );
          })}

          {/* Render Activity Bars with signature bright neon coloring */}
          {data.map((val, hour) => {
            const barWidth = 14;
            const barSpacing = (500 - paddingLeft - paddingRight - (24 * barWidth)) / 23;
            const x = paddingLeft + hour * (barWidth + barSpacing);
            const barHeight = (val / maxVal) * (height - paddingTop - paddingBottom);
            const y = height - paddingBottom - barHeight;

            // Accent high frequency bars
            const isHighest = val === maxVal && val > 0;

            return (
              <g key={hour} className="group/bar cursor-pointer" id={`group-bar-${hour}`}>
                {/* Background glow bar on hover */}
                <rect
                  x={x - 1}
                  y={paddingTop}
                  width={barWidth + 2}
                  height={height - paddingTop - paddingBottom}
                  className="fill-transparent group-hover/bar:fill-neutral-900/40 transition-all rounded"
                />
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx="1"
                  className={`transition-all duration-300 ${
                    isHighest 
                      ? 'fill-purple-500 brightness-110 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]' 
                      : 'fill-[#bfff00] hover:fill-amber-400'
                  }`}
                  id={`bar-rect-${hour}`}
                />
                <title>{`${formatHour(hour)}: ${val.toLocaleString()} messages`}</title>
              </g>
            );
          })}

          {/* Axis Labels */}
          {data.map((_, hour) => {
            if (hour % 4 !== 0 && hour !== 23) return null;
            const barWidth = 14;
            const barSpacing = (500 - paddingLeft - paddingRight - (24 * barWidth)) / 23;
            const x = paddingLeft + hour * (barWidth + barSpacing) + (barWidth / 2);
            return (
              <text
                key={hour}
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="text-[9px] fill-neutral-500 font-mono uppercase tracking-widest font-bold"
                id={`axis-label-${hour}`}
              >
                {hour % 12 === 0 ? 12 : hour % 12}
                {hour >= 12 ? 'p' : 'a'}
              </text>
            );
          })}

          {/* Left Y Axis labels */}
          <text
            x={10}
            y={paddingTop + 5}
            textAnchor="start"
            className="text-[8px] fill-[#bfff00] font-mono font-bold"
            id="y-axis-max"
          >
            {maxVal}
          </text>
          <text
            x={10}
            y={height - paddingBottom}
            textAnchor="start"
            className="text-[8px] fill-neutral-600 font-mono"
            id="y-axis-min"
          >
            0
          </text>
        </svg>
      </div>
    );
  };

  // Weekly racing activity bars style
  const renderWeeklyChart = (data: number[]) => {
    const maxVal = Math.max(...data, 1);
    const labels = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

    return (
      <div className="space-y-3.5" id="weekly-chart-list">
        {data.map((val, idx) => {
          const percentage = (val / maxVal) * 100;
          const isHighest = val === maxVal && val > 0;

          return (
            <div key={idx} className="space-y-1 group" id={`weekly-bar-row-${idx}`}>
              <div className="flex justify-between items-center text-[10px] font-mono tracking-wider">
                <span className="font-bold text-neutral-400 group-hover:text-[#bfff00] transition-colors">{labels[idx]}</span>
                <span className={`font-bold ${isHighest ? 'text-purple-400' : 'text-neutral-350'}`}>
                  {val.toLocaleString()} <span className="text-[9px] text-neutral-500">MESSAGES</span>
                  {isHighest && (
                    <span className="ml-2 px-1 py-0.2 bg-purple-950/80 text-purple-400 text-[8px] border border-purple-800 rounded font-black">
                      PEAK CHAT DAY
                    </span>
                  )}
                </span>
              </div>
              <div className="w-full bg-[#181818] h-3.5 border border-neutral-900 overflow-hidden relative p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: idx * 0.04 }}
                  className={`h-full relative overflow-hidden ${
                    isHighest 
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 shadow-[0_0_10px_rgba(168,85,247,0.4)]' 
                      : 'bg-gradient-to-r from-[#bfff00]/70 to-[#bfff00] group-hover:from-amber-400 group-hover:to-amber-300'
                  }`}
                >
                  {/* Subtle racing stripe overlays */}
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.15)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.15)_75%,transparent_75%,transparent)] bg-[length:8px_8px]" />
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTimelineZoomChart = () => {
    const fullTimeline = stats.timeline;
    if (!fullTimeline || fullTimeline.length === 0) {
      return (
        <div className="bg-neutral-900/50 border border-neutral-800 p-8 text-center" id="timeline-empty">
          <p className="text-xs text-neutral-500 font-mono uppercase tracking-widest">No timeline activity logs available for zooming</p>
        </div>
      );
    }

    const getIndexFromDate = (dateStr: string) => {
      if (!dateStr) return 0;
      let closestIndex = 0;
      let closestDiff = Infinity;
      const targetTime = new Date(dateStr).getTime();
      for (let i = 0; i < fullTimeline.length; i++) {
        const itemTime = new Date(fullTimeline[i].date).getTime();
        if (isNaN(itemTime)) continue;
        const diff = Math.abs(itemTime - targetTime);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestIndex = i;
        }
      }
      return closestIndex;
    };

    const safeStart = Math.min(Math.max(0, startIndex), fullTimeline.length - 1);
    const safeEnd = Math.min(Math.max(safeStart, endIndex), fullTimeline.length - 1);

    const safeSlideStart = Math.min(Math.max(0, slideStart), fullTimeline.length - 1);
    const safeSlideEnd = Math.min(Math.max(safeSlideStart, slideEnd), fullTimeline.length - 1);

    const sliced = fullTimeline.slice(safeStart, safeEnd + 1);
    const maxVal = Math.max(...sliced.map(d => d.count), 1);
    
    // Window-specific aggregate stats
    const windowMessages = sliced.reduce((acc, curr) => acc + curr.count, 0);
    const windowDays = sliced.length;
    const windowAvg = windowDays > 0 ? Math.round(windowMessages / windowDays) : 0;
    
    let windowPeak = { date: 'N/A', count: 0 };
    sliced.forEach(d => {
      if (d.count > windowPeak.count) {
        windowPeak = { date: d.date, count: d.count };
      }
    });

    const height = 180;
    const width = 600;
    const paddingLeft = 45;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;

    const plotWidth = width - paddingLeft - paddingRight;
    const plotHeight = height - paddingTop - paddingBottom;

    // Generate path points
    let points = "";
    let areaPoints = "";
    
    if (sliced.length > 1) {
      const coords = sliced.map((d, index) => {
        const x = paddingLeft + (index / (sliced.length - 1)) * plotWidth;
        const y = paddingTop + plotHeight - (d.count / maxVal) * plotHeight;
        return { x, y };
      });
      
      points = coords.map(c => `${c.x},${c.y}`).join(" ");
      areaPoints = `${paddingLeft},${paddingTop + plotHeight} ` + points + ` ${paddingLeft + plotWidth},${paddingTop + plotHeight}`;
    } else if (sliced.length === 1) {
      const x = paddingLeft + plotWidth / 2;
      const y = paddingTop + plotHeight - (sliced[0].count / maxVal) * plotHeight;
      points = `${x},${y}`;
      areaPoints = `${x},${paddingTop + plotHeight} ${x},${y} ${x},${paddingTop + plotHeight}`;
    }

    return (
      <div className="bg-[#121212] border border-neutral-800 p-6 shadow-xl space-y-5" id="timeline-zoom-panel">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 border-b border-neutral-900 gap-3">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#bfff00]" /> CHAT ACTIVITY TIMELINE
            </h3>
            <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-wider">
              DRAG SLIDERS BELOW TO ZOOM INTO SPECIFIC TIME SEGMENTS
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(safeStart > 0 || safeEnd < fullTimeline.length - 1) && (
              <button
                onClick={() => {
                  setSlideStart(0);
                  setSlideEnd(fullTimeline.length - 1);
                  setStartIndex(0);
                  setEndIndex(fullTimeline.length - 1);
                }}
                className="text-[9px] font-mono bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-amber-550 px-2 py-1 uppercase tracking-widest transition-all cursor-pointer"
                id="reset-zoom-btn"
              >
                Reset Zoom
              </button>
            )}
            <span className="text-[9px] font-mono text-[#bfff00] bg-black px-2 py-1 border border-neutral-850 font-black uppercase tracking-widest">
              ZOOM ENABLED
            </span>
          </div>
        </div>

        {/* Dynamic SVG Interactive Chart */}
        <div className="relative pt-1" id="timeline-svg-container">
          <svg className="w-full overflow-visible" height={height} viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <linearGradient id="timeline-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bfff00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#bfff00" stopOpacity="0.00" />
              </linearGradient>
              <linearGradient id="single-day-glow" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#bfff00" stopOpacity="0" />
                <stop offset="100%" stopColor="#bfff00" stopOpacity="0.45" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = paddingTop + (1 - ratio) * plotHeight;
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#1e1e1e"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    id={`timeline-gridline-h-${idx}`}
                  />
                  {/* Y Axis Values */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="text-[8px] fill-neutral-600 font-mono"
                  >
                    {Math.round(ratio * maxVal).toLocaleString()}
                  </text>
                </g>
              );
            })}

            {sliced.length > 0 && (
              <>
                {/* Area Background Gradient fill */}
                {sliced.length > 1 && (
                  <polygon
                    points={areaPoints}
                    fill="url(#timeline-grad)"
                    id="timeline-area-glow"
                  />
                )}

                {/* Main Spark Line */}
                {sliced.length > 1 ? (
                  <polyline
                    fill="none"
                    stroke="#bfff00"
                    strokeWidth="1.5"
                    points={points}
                    id="timeline-spark-line"
                  />
                ) : (
                  <g id="timeline-single-day-group">
                    {/* Visual beam of light for single day metrics */}
                    <rect
                      x={paddingLeft + plotWidth / 2 - 20}
                      y={paddingTop + plotHeight - (sliced[0].count / maxVal) * plotHeight}
                      width="40"
                      height={(sliced[0].count / maxVal) * plotHeight}
                      fill="url(#single-day-glow)"
                      rx="4"
                    />
                    <line
                      x1={paddingLeft + plotWidth / 2}
                      y1={paddingTop + plotHeight}
                      x2={paddingLeft + plotWidth / 2}
                      y2={paddingTop + plotHeight - (sliced[0].count / maxVal) * plotHeight}
                      stroke="#bfff00"
                      strokeWidth="2"
                    />
                    <circle
                      cx={paddingLeft + plotWidth / 2}
                      cy={paddingTop + plotHeight - (sliced[0].count / maxVal) * plotHeight}
                      r="5.5"
                      className="fill-amber-400 stroke-black stroke-2"
                    />
                  </g>
                )}

                {/* Render subtle helper circles for peaks or data density */}
                {sliced.length <= 100 && sliced.map((d, idx) => {
                  const x = paddingLeft + (idx / Math.max(1, sliced.length - 1)) * plotWidth;
                  const y = paddingTop + plotHeight - (d.count / maxVal) * plotHeight;
                  const isPeakInWindow = d.count === windowPeak.count && d.count > 0;
                  
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={isPeakInWindow ? "3" : "1.5"}
                      className={`cursor-pointer transition-all duration-200 hover:r-4 ${
                        isPeakInWindow 
                          ? 'fill-purple-400 stroke-black stroke-[1.5]' 
                          : 'fill-[#bfff00]/60 hover:fill-amber-400'
                      }`}
                      id={`timeline-point-dot-${idx}`}
                    >
                      <title>{`${d.date}: ${d.count.toLocaleString()} messages`}</title>
                    </circle>
                  );
                })}
              </>
            )}

            {/* Unique, uncluttered X-Axis labels across sliced range */}
            {sliced.length > 0 && (() => {
              if (sliced.length === 1) {
                let labelText = sliced[0].date;
                try {
                  const innerDate = new Date(sliced[0].date);
                  if (!isNaN(innerDate.getTime())) {
                    labelText = innerDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
                  }
                } catch (_) {}
                return (
                  <text
                    x={paddingLeft + plotWidth / 2}
                    y={height - 8}
                    textAnchor="middle"
                    className="text-[8px] fill-[#bfff00] font-mono uppercase font-semibold text-center"
                    id="timeline-x-tick-single"
                  >
                    {labelText}
                  </text>
                );
              }

              // Multi-day unique tick indices locator (max 5 positions)
              const tickIndices: number[] = [];
              const numTicks = Math.min(5, sliced.length);
              if (numTicks === 2) {
                tickIndices.push(0, sliced.length - 1);
              } else if (numTicks === 3) {
                tickIndices.push(0, Math.floor((sliced.length - 1) / 2), sliced.length - 1);
              } else {
                for (let i = 0; i < numTicks; i++) {
                  const idx = Math.round((i / (numTicks - 1)) * (sliced.length - 1));
                  if (!tickIndices.includes(idx)) {
                    tickIndices.push(idx);
                  }
                }
              }

              return tickIndices.map((index, idx) => {
                const dateObj = sliced[index];
                if (!dateObj) return null;
                const x = paddingLeft + (index / (sliced.length - 1)) * plotWidth;
                
                let labelText = dateObj.date;
                try {
                  const innerDate = new Date(dateObj.date);
                  if (!isNaN(innerDate.getTime())) {
                    labelText = innerDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }
                } catch (_) {}

                return (
                  <text
                    key={idx}
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className="text-[8px] fill-neutral-500 font-mono uppercase font-semibold"
                    id={`timeline-x-tick-${idx}`}
                  >
                    {labelText}
                  </text>
                );
              });
            })()}
          </svg>
        </div>

        {/* Responsive Interactive Calendar Date Bounds Selectors */}
        <div className="bg-neutral-950 border border-neutral-900 p-4 space-y-4" id="timeline-calendar-controls">
          <div className="grid grid-cols-1 md:grid-cols-3 items-center text-center gap-3 text-[10.5px] uppercase font-mono tracking-widest border-b border-neutral-900 pb-4">
            <div className="flex items-center justify-center gap-1.5 bg-neutral-900/30 border border-neutral-900 px-3 py-1.5">
              <span className="text-neutral-500">START BOUNDS:</span>
              <span className="text-white font-bold">{fullTimeline[safeSlideStart]?.date}</span>
            </div>
            <div>
              <span className="italic font-black text-[#bfff00] bg-neutral-900/60 border border-[#bfff00]/20 px-3 py-1.5 select-none tracking-widest rounded-none">
                {safeSlideEnd - safeSlideStart + 1} DAYS SELECTED
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 bg-neutral-900/30 border border-neutral-900 px-3 py-1.5">
              <span className="text-neutral-500">END BOUNDS:</span>
              <span className="text-white font-bold">{fullTimeline[safeSlideEnd]?.date}</span>
            </div>
          </div>

          <div className="relative flex flex-col sm:flex-row gap-4 py-1" id="calendar-inputs-rack">
            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="timeline-start-calendar" className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                FROM DATE:
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-black border border-neutral-850 hover:border-[#bfff00] text-white hover:text-[#bfff00] px-3 py-5.5 text-xs font-mono justify-center items-center gap-2 cursor-pointer transition-all rounded-none"
                    id="timeline-start-calendar"
                  >
                    <CalendarDays className="h-4 w-4 text-neutral-400" />
                    <span>{fullTimeline[safeSlideStart]?.date || "Select Start"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-0 bg-transparent w-auto">
                  <CalendarPicker
                    mode="single"
                    selected={(() => {
                      const dStr = fullTimeline[safeSlideStart]?.date;
                      if (!dStr) return undefined;
                      const parts = dStr.split('-');
                      return parts.length === 3 ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) : new Date(dStr);
                    })()}
                    onSelect={(date) => {
                      if (date) {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, "0");
                        const d = String(date.getDate()).padStart(2, "0");
                        const idx = getIndexFromDate(`${y}-${m}-${d}`);
                        setSlideStart(Math.min(idx, slideEnd));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label htmlFor="timeline-end-calendar" className="text-[9px] text-neutral-500 uppercase tracking-widest font-mono">
                TO DATE:
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-black border border-neutral-850 hover:border-amber-450 text-white hover:text-amber-400 px-3 py-5.5 text-xs font-mono justify-center items-center gap-2 cursor-pointer transition-all rounded-none"
                    id="timeline-end-calendar"
                  >
                    <CalendarDays className="h-4 w-4 text-neutral-400" />
                    <span>{fullTimeline[safeSlideEnd]?.date || "Select End"}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 border-0 bg-transparent w-auto">
                  <CalendarPicker
                    mode="single"
                    selected={(() => {
                      const dStr = fullTimeline[safeSlideEnd]?.date;
                      if (!dStr) return undefined;
                      const parts = dStr.split('-');
                      return parts.length === 3 ? new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])) : new Date(dStr);
                    })()}
                    onSelect={(date) => {
                      if (date) {
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, "0");
                        const d = String(date.getDate()).padStart(2, "0");
                        const idx = getIndexFromDate(`${y}-${m}-${d}`);
                        setSlideEnd(Math.max(idx, slideStart));
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* Detailed aggregate analytical metrics panel for the active zoom window */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2" id="timeline-zoom-stats">
          <motion.div 
            key={`${safeStart}-${safeEnd}-messages`}
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-neutral-950 p-3.5 border border-neutral-900 font-mono text-xs text-center space-y-0.5"
          >
            <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">MESSAGES IN WINDOW</p>
            <p className="text-sm font-black text-[#bfff00]">{windowMessages.toLocaleString()}</p>
          </motion.div>
          <motion.div 
            key={`${safeStart}-${safeEnd}-avg`}
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-neutral-950 p-3.5 border border-neutral-900 font-mono text-xs text-center space-y-0.5"
          >
            <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">DAILY RUNNING AVG</p>
            <p className="text-sm font-black text-amber-400">{windowAvg.toLocaleString()} <span className="text-[9px] text-neutral-600">MSG/DAY</span></p>
          </motion.div>
          <motion.div 
            key={`${safeStart}-${safeEnd}-peak`}
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-neutral-950 p-3.5 border border-neutral-900 font-mono text-xs text-center space-y-0.5"
          >
            <p className="text-[8px] text-neutral-500 uppercase tracking-widest font-bold">PEAK STAGE DATE</p>
            <p className="text-xs font-bold text-white uppercase truncate">{windowPeak.date}</p>
            <p className="text-[7.5px] text-neutral-500 uppercase">[{windowPeak.count.toLocaleString()} msg max]</p>
          </motion.div>
        </div>
      </div>
    );
  };

  const activeParticipant: ParticipantStats | null = selectedParticipant
    ? participants[selectedParticipant]
    : null;

  return (
    <div className="space-y-10 animate-fade-in text-neutral-200" id="dashboard-tab">
      
      {/* Date Range & Summary Banner */}
      <div className="relative bg-[#111] overflow-hidden border border-neutral-800 p-6 md:p-8 rounded-none shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6" id="dashboard-banner">
        {/* Decorative gradient glowing lines */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#bfff00]/5 to-transparent skew-x-12 pointer-events-none" />
        <div className="absolute left-0 bottom-0 h-1 bg-gradient-to-r from-[#bfff00] via-amber-400 to-purple-500 w-full animate-pulse" />
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 text-[9px] font-black bg-neutral-900 text-[#bfff00] border border-neutral-800 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#bfff00]" /> ANALYSIS COMPILED
            </span>
            <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest font-bold">DIGEST S1-S3</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black italic tracking-wider text-white uppercase font-display">
            CHAT PERFORMANCE INSIGHTS <span className="text-[#bfff00]">///</span>
          </h2>
          <p className="text-xs text-neutral-400 flex flex-wrap items-center gap-2 font-mono">
            <Calendar className="w-3.5 h-3.5 text-[#bfff00]" />
            <span className="uppercase text-[10px] text-neutral-500">ACTIVE TIMING:</span>
            <span className="font-bold text-neutral-200">{formatDate(dateRange.start)}</span>
            <span className="text-neutral-700">➜</span>
            <span className="font-bold text-neutral-200">{formatDate(dateRange.end)}</span>
          </p>
        </div>

        {/* Peak Session & Peak Activity day info */}
        <div className="flex flex-wrap gap-4 text-xs font-mono bg-black border border-neutral-850 p-4 relative z-10">
          <div className="space-y-0.5 min-w-[124px]">
            <p className="text-[#bfff00] font-black text-[9px] uppercase tracking-widest flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#bfff00]" /> PEAK SPEED ZONE
            </p>
            <p className="font-bold text-white text-base">
              {formatHour(peakHour)}
            </p>
            <p className="text-[8px] text-neutral-500 uppercase">Most Active Hour</p>
          </div>
          
          <div className="w-px bg-neutral-800 self-stretch" />
          
          <div className="space-y-0.5 min-w-[124px]">
            <p className="text-purple-400 font-black text-[9px] uppercase tracking-widest flex items-center gap-1 animate-pulse">
              <Trophy className="w-3 h-3 text-purple-400" /> PEAK CHAT DAY
            </p>
            <p className="font-bold text-purple-300 text-sm truncate">
              {peakDay ? peakDay.date : 'N/A'}
            </p>
            <p className="text-[8px] text-neutral-500 uppercase">{peakDay ? `${peakDay.count.toLocaleString()} msg peak` : 'Record count empty'}</p>
          </div>
        </div>
      </div>

      {/* CATEGORY 1: CONVERSATIONAL VOLUME & INVOLVEMENT STANDINGS */}
      <div className="border border-neutral-800 bg-[#0c0c0e]/30 p-6 space-y-6 relative shadow-lg" id="group-volume-engagement">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#bfff00] via-neutral-800 to-transparent" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-900">
          <div className="space-y-1">
            <span className="text-[8px] bg-[#bfff00]/15 text-[#bfff00] border border-[#bfff00]/25 font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
              CATEGORY 01 // OVERVIEW &amp; INVOLVEMENT
            </span>
            <h3 className="text-sm font-black text-white font-mono uppercase tracking-widest flex items-center gap-2">
              CONVERSATIONAL VOLUME &amp; SPEAKER STANDINGS
            </h3>
          </div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase">Interactive Engagement Analytics</span>
        </div>

        {/* Grid of Key Bento metrics (Styled as Premium Dialogue Dials) - Trigger Anims on filter or date change */}
        <motion.div 
          key={`${startIndex}-${endIndex}-${selectedParticipant || 'all'}`}
          initial={{ opacity: 0.85, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4" 
          id="stats-bento-grid"
        >
          <div className="bg-[#121212]/90 border border-neutral-800/80 p-5 relative overflow-hidden group shadow-md" id="metric-messages">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#bfff00]" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black font-mono text-neutral-400 uppercase tracking-widest">TOTAL MESSAGES</span>
              <div className="p-1.5 bg-neutral-900 border border-neutral-800 text-[#bfff00] group-hover:scale-110 transition-transform">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-[#bfff00] transition-colors">
              {totalMessages.toLocaleString()}
            </p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-900 text-[9px] font-mono text-neutral-500">
              <span>DIALECT VOL</span>
              <span className="text-[#bfff55] font-bold">STABLE</span>
            </div>
          </div>

          <div className="bg-[#121212]/90 border border-neutral-800/80 p-5 relative overflow-hidden group shadow-md" id="metric-words">
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-400" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black font-mono text-neutral-400 uppercase tracking-widest">DIALOGUE WORDS</span>
              <div className="p-1.5 bg-neutral-900 border border-neutral-800 text-amber-400 group-hover:scale-110 transition-transform">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-amber-400 transition-colors">
              {totalWords.toLocaleString()}
            </p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-900 text-[9px] font-mono text-[#bfff00] font-bold uppercase">
              <span>AVG DENSITY:</span>
              <span className="text-amber-400 font-bold">{totalMessages > 0 ? Math.round(totalWords / totalMessages) : 0} W/MSG</span>
            </div>
          </div>

          <div className="bg-[#121212]/90 border border-neutral-800/80 p-5 relative overflow-hidden group shadow-md" id="metric-emojis">
            <div className="absolute top-0 left-0 w-full h-1 bg-pink-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black font-mono text-neutral-400 uppercase tracking-widest">EMOTIVE EMOJIS</span>
              <div className="p-1.5 bg-neutral-900 border border-neutral-800 text-pink-500 group-hover:scale-110 transition-transform">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-pink-500 transition-colors">
              {totalEmojis.toLocaleString()}
            </p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-900 text-[9px] font-mono text-[#bfff00] font-bold uppercase">
              <span>EMOJI PROFILE:</span>
              <span className="text-pink-400 font-bold">{totalMessages > 0 ? (totalEmojis / totalMessages).toFixed(2) : 0} EM/MSG</span>
            </div>
          </div>

          <div className="bg-[#121212]/90 border border-neutral-800/80 p-5 relative overflow-hidden group shadow-md" id="metric-participants">
            <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black font-mono text-neutral-400 uppercase tracking-widest">PARTICIPANTS</span>
              <div className="p-1.5 bg-neutral-900 border border-neutral-800 text-purple-400 group-hover:scale-110 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-black text-white font-mono tracking-tight group-hover:text-purple-400 transition-colors">
              {participantArray.length.toLocaleString()}
            </p>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-neutral-900 text-[9px] font-mono text-purple-400 font-bold uppercase">
              <span>ACTIVE CHANNELS</span>
              <span className="text-purple-400 font-bold">ALL GREEN</span>
            </div>
          </div>
        </motion.div>

        {/* Modular Grid: Standings Leaderboard + Interaction Topology Graph */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="leaderboard-topology-wrapper">
          
          {/* Active Speakers Leaderboard (Left Side) */}
          <div className="xl:col-span-6 bg-[#121212]/80 border border-neutral-800/80 p-6 shadow-xl relative flex flex-col justify-between" id="participants-ranked-panel">
            <div>
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-neutral-900">
                <h3 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-2">
                  <Trophy className="w-4 h-3.5 text-[#bfff00]" /> ACTIVE SPEAKERS LEADERBOARD
                </h3>
                <span className="text-[8px] font-mono text-neutral-500 uppercase font-extrabold tracking-widest">TAP A SENDER TO ZOOM</span>
              </div>

              <div className="space-y-4 max-h-[480px] overflow-y-auto no-scrollbar pr-1">
                {participantArray.map((p, idx) => {
                  const percentage = ((p.messageCount / totalMessages) * 100).toFixed(1);
                  const isSelected = selectedParticipant === p.name;
                  const profile = getDialogueProfile(p);

                  const leaderMsgCount = participantArray[0]?.messageCount || 1;
                  const deltaMsgs = p.messageCount - leaderMsgCount;
                  const deltaStr = deltaMsgs === 0 ? "LEADER" : `${deltaMsgs.toLocaleString()} msg`;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedParticipant(isSelected ? null : p.name)}
                      className={`p-4 border transition-all duration-300 cursor-pointer relative ${
                        isSelected
                          ? 'border-[#bfff00] bg-black shadow-lg shadow-[#bfff00]/2'
                          : 'border-neutral-850 bg-neutral-900/40 hover:border-[#bfff00]/50 hover:bg-neutral-900/80'
                      }`}
                      id={`p-row-${idx}`}
                    >
                      {isSelected && (
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#bfff00] shadow-[0_0_8px_#bfff00] animate-pulse" />
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex items-center justify-center w-7 h-7 font-black font-mono text-[10px] border rounded-none transition-all duration-300 ${
                            idx === 0 
                              ? 'bg-[#bfff00] text-black border-[#bfff00]' 
                              : 'bg-neutral-950 text-neutral-400 border-neutral-850'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-white text-xs sm:text-sm tracking-wide uppercase font-display">{p.name}</h4>
                            <span className="text-[7.5px] font-mono font-bold text-neutral-500 uppercase tracking-widest bg-neutral-950 px-1.5 py-0.5 border border-neutral-850">
                              PARTICIPANT MEMBER
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <span 
                            title={profile.desc}
                            className={`w-6 h-6 rounded-full border-2 ${profile.color} flex items-center justify-center font-black font-mono text-[9px] bg-black shrink-0 relative`}
                          >
                            {profile.icon}
                          </span>

                          <div className="text-right">
                            <span className="font-mono text-xs sm:text-xs font-black text-white">
                              {p.messageCount.toLocaleString()} MESSAGES
                            </span>
                            <span className={`text-[8.5px] font-mono font-extrabold px-1.5 py-0.5 ml-2 ${
                              idx === 0 ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-neutral-950 text-neutral-400'
                            }`}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full bg-neutral-950 h-2 border border-neutral-900 relative p-0.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                          className={`h-full ${
                            idx === 0 
                              ? 'bg-[#bfff00]' 
                              : 'bg-neutral-600'
                          }`}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 text-[8px] font-mono text-neutral-400 mt-2.5 pt-2 border-t border-dashed border-neutral-850">
                        <span className="flex items-center gap-1"><Timer className="w-3 h-3 text-[#bfff00]" /> DIFF: <span className="text-white font-bold">{deltaStr}</span></span>
                        <span>📊 LENGTH: <span className="text-neutral-200 font-bold">{p.wordCount.toLocaleString()} WORDS</span></span>
                        <span>💡 COMMUNICATIVE: <span className="text-neutral-200 font-bold">{p.emojiCount.toLocaleString()} EM</span></span>
                        <span>⚡ COMPLEXITY: <span className="text-[#bfff00] font-bold">{Math.round(p.characterCount / p.messageCount)} CH</span></span>
                      </div>

                      {/* Focus statistics list */}
                      {isSelected && (() => {
                        const sentimentTotal = (p.sentiment?.positive || 0) + (p.sentiment?.neutral || 0) + (p.sentiment?.negative || 0) || 1;
                        const posPct = Math.round(((p.sentiment?.positive || 0) / sentimentTotal) * 100);
                        const negPct = Math.round(((p.sentiment?.negative || 0) / sentimentTotal) * 100);
                        const neuPct = Math.max(0, 100 - posPct - negPct);

                        return (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            transition={{ duration: 0.3 }}
                            className="mt-3.5 pt-3.5 border-t border-neutral-900 space-y-3.5 overflow-hidden"
                          >
                            <div className="flex justify-between items-center bg-[#0a0a0a] p-2 border border-neutral-900 rounded font-mono">
                              <span className="text-[10px] text-neutral-400 uppercase font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-neutral-500" /> CLASSIFICATION:
                              </span>
                              <span className="text-[9px] text-white font-extrabold bg-neutral-900 px-2 py-0.5 border border-neutral-800 rounded flex items-center gap-1.5 animate-pulse">
                                {profile.name}
                              </span>
                            </div>

                            {/* Advanced Dynamic Sentiment Distribution */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[8.5px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                                <span>SPEECH SENTIMENT TRAJECTORY:</span>
                                <span className="flex gap-2">
                                  <span className="text-emerald-400">POS {posPct}%</span>
                                  <span className="text-neutral-400">NEU {neuPct}%</span>
                                  <span className="text-pink-400">NEG {negPct}%</span>
                                </span>
                              </div>
                              <div className="w-full bg-neutral-950 h-2 border border-neutral-900 overflow-hidden flex">
                                <div style={{ width: `${posPct}%` }} className="h-full bg-emerald-500 duration-500 transition-all" title={`Positive: ${posPct}%`} />
                                <div style={{ width: `${neuPct}%` }} className="h-full bg-neutral-600 duration-500 transition-all" title={`Neutral: ${neuPct}%`} />
                                <div style={{ width: `${negPct}%` }} className="h-full bg-pink-500 duration-500 transition-all" title={`Negative: ${negPct}%`} />
                              </div>
                            </div>

                            {/* Inquiring and Timing Analytics */}
                            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                              <div className="p-2 bg-neutral-950 border border-neutral-900 rounded">
                                <p className="text-[8px] text-neutral-500 uppercase font-bold mb-0.5">❓ DIALOGUE QUERIES</p>
                                <p className="text-xs font-bold text-white">{(p.questionCount || 0).toLocaleString()} <span className="text-[9px] text-neutral-600 font-bold">QS</span></p>
                              </div>
                              <div className="p-2 bg-neutral-950 border border-neutral-900 rounded">
                                <p className="text-[8px] text-neutral-500 uppercase font-bold mb-0.5">🌙 LATE NIGHT TRANSCRIPTS</p>
                                <p className="text-xs font-bold text-amber-500">{(p.lateNightCount || 0).toLocaleString()} <span className="text-[9px] text-neutral-600 font-bold">MSGS</span></p>
                              </div>
                            </div>
                            
                            <p className="text-[8px] text-[#bfff55] font-black uppercase tracking-widest">TOP RECORDED CHAT SYMBOLS:</p>
                            <div className="flex flex-wrap gap-1.5">
                              {Object.entries(p.emojis)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 8)
                                .map(([em, count], eidx) => (
                                  <span
                                    key={eidx}
                                    className="inline-flex items-center gap-1 bg-black border border-neutral-800 text-xs px-2 py-0.5 text-white font-mono"
                                  >
                                    <span>{em}</span>
                                    <span className="text-[8px] text-[#bfff00] font-black">{count}</span>
                                  </span>
                                ))}
                              {Object.keys(p.emojis).length === 0 && (
                                <span className="text-[10px] text-neutral-500 italic font-mono uppercase">Analysis feedback: No emojis registered</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Conversation Interactivity Network topology (Right Side) */}
          <div className="xl:col-span-6 bg-[#121212]/80 border border-neutral-800/80 p-6 shadow-xl relative flex flex-col justify-between" id="conversation-topology-panel">
            <div>
              <div className="flex justify-between items-center mb-5 pb-2 border-b border-neutral-900">
                <h3 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-2">
                  <Activity className="w-4 h-3.5 text-[#bfff00] animate-pulse" /> DIALOGUE TOPOLOGY MATRIX
                </h3>
                <span className="text-[8px] font-mono text-neutral-500 uppercase font-extrabold tracking-widest">
                  HOVER SPEECH HOOPS TO INSPECT COUPLING
                </span>
              </div>

              {conversationTopology.nodes.length < 2 ? (
                <div className="h-[340px] flex items-center justify-center border border-neutral-900 bg-neutral-950/40">
                  <div className="text-center space-y-2 p-4">
                    <p className="text-xs text-neutral-500 uppercase tracking-widest font-mono">Insufficient partners to map topology</p>
                    <p className="text-[9px] text-neutral-600 uppercase font-mono">Topology mapping indices require at least 2 distinct concurrent speakers.</p>
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col items-center">
                  {/* Circular SVG Map */}
                  <svg className="w-full max-w-[380px] h-auto overflow-visible select-none" viewBox="0 0 440 380">
                    <defs>
                      <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3.5" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* INTERACTIVE SPLINE CONNECTIONS */}
                    <g id="topology-splines">
                      {(() => {
                        const cx = 220;
                        const cy = 190;
                        const r = 105;
                        const maxVal = Math.max(...conversationTopology.links.map(l => l.value), 1);

                        // Layout positions
                        const positions = conversationTopology.nodes.map((n, idx) => {
                          const angle = (idx / conversationTopology.nodes.length) * 2 * Math.PI - Math.PI / 2;
                          return {
                            id: n.id,
                            x: cx + r * Math.cos(angle),
                            y: cy + r * Math.sin(angle),
                            angle
                          };
                        });

                        const hoveredNeighbors = new Set<string>();
                        if (hoveredNode) {
                          conversationTopology.links.forEach(l => {
                            if (l.source === hoveredNode) hoveredNeighbors.add(l.target);
                            if (l.target === hoveredNode) hoveredNeighbors.add(l.source);
                          });
                        }

                        const selectedNeighbors = new Set<string>();
                        if (selectedParticipant) {
                          conversationTopology.links.forEach(l => {
                            if (l.source === selectedParticipant) selectedNeighbors.add(l.target);
                            if (l.target === selectedParticipant) selectedNeighbors.add(l.source);
                          });
                        }

                        return (
                          <>
                            {/* Curved link splines */}
                            {conversationTopology.links.map((link, idx) => {
                              const sPos = positions.find(p => p.id === link.source);
                              const tPos = positions.find(p => p.id === link.target);
                              if (!sPos || !tPos) return null;

                              const midX = (sPos.x + tPos.x) / 2;
                              const midY = (sPos.y + tPos.y) / 2;
                              const ctrlX = (midX + cx) / 2;
                              const ctrlY = (midY + cy) / 2;

                              const isHighlighted = 
                                (hoveredNode === link.source || hoveredNode === link.target) || 
                                (selectedParticipant === link.source || selectedParticipant === link.target);

                              const hasAnyHover = hoveredNode !== null;
                              const hasAnySelect = selectedParticipant !== null;

                              let strokeColor = 'rgba(191, 255, 0, 0.15)';
                              let opacity = 0.35;
                              let strokeWidth = 1 + (link.value / maxVal) * 4;

                              if (isHighlighted) {
                                strokeColor = '#bfff00';
                                opacity = 0.95;
                                strokeWidth = strokeWidth + 1.5;
                              } else if (hasAnyHover || hasAnySelect) {
                                opacity = 0.08;
                              }

                              return (
                                <path
                                  key={`chord-${idx}`}
                                  d={`M ${sPos.x} ${sPos.y} Q ${ctrlX} ${ctrlY} ${tPos.x} ${tPos.y}`}
                                  fill="none"
                                  stroke={strokeColor}
                                  strokeWidth={strokeWidth}
                                  strokeLinecap="round"
                                  opacity={opacity}
                                  className="transition-all duration-200"
                                  style={isHighlighted ? { filter: 'url(#neon-glow)' } : {}}
                                />
                              );
                            })}

                            {/* CENTRAL METRIC MONITOR PANEL */}
                            {(() => {
                              const activeItem = hoveredNode || selectedParticipant;
                              if (activeItem) {
                                const count = conversationTopology.links
                                  .filter(l => l.source === activeItem || l.target === activeItem)
                                  .reduce((acc, l) => acc + l.value, 0);
                                const partnerCount = conversationTopology.links
                                  .filter(l => l.source === activeItem || l.target === activeItem).length;
                                
                                const displayName = activeItem.length > 14 ? activeItem.slice(0, 11) + '..' : activeItem;

                                return (
                                  <g transform={`translate(${cx}, ${cy})`} className="pointer-events-none">
                                    <circle r="46" fill="#09090b" stroke="#bfff00" strokeWidth="1.5" strokeDasharray="3 3" />
                                    <text y="-14" textAnchor="middle" className="text-[7.5px] fill-neutral-400 font-mono font-extrabold tracking-widest uppercase">SPEAKER ACTIVE</text>
                                    <text y="3" textAnchor="middle" className="text-[10px] fill-[#bfff00] font-mono font-black uppercase tracking-wider">{displayName}</text>
                                    <text y="16" textAnchor="middle" className="text-[8px] fill-white font-mono font-bold tracking-wide">{count} REPLIES</text>
                                    <text y="26" textAnchor="middle" className="text-[7.5px] fill-neutral-400 font-mono font-medium">WITH {partnerCount} MEMBERS</text>
                                  </g>
                                );
                              } else {
                                return (
                                  <g transform={`translate(${cx}, ${cy})`} className="pointer-events-none">
                                    <circle r="46" fill="#0c0c0e" stroke="#262626" strokeWidth="1.5" />
                                    <text y="-11" textAnchor="middle" className="text-[7.5px] fill-neutral-400 font-mono font-black tracking-wider uppercase">COUPLING MATRIX</text>
                                    <text y="5" textAnchor="middle" className="text-[11px] fill-[#bfff00] font-mono font-black tracking-widest">{conversationTopology.links.length} EDGES</text>
                                    <text y="17" textAnchor="middle" className="text-[6.5px] fill-neutral-500 font-mono uppercase font-black tracking-wider">STABLE COHESION</text>
                                  </g>
                                );
                              }
                            })()}

                            {/* SPEAKER NODES */}
                            {positions.map((node, nIdx) => {
                              const isHovered = hoveredNode === node.id;
                              const isSelected = selectedParticipant === node.id;
                              const hasAnyHover = hoveredNode !== null;
                              const hasAnySelect = selectedParticipant !== null;

                              const isDimmed = 
                                (hasAnyHover && !isHovered && !hoveredNeighbors.has(node.id)) ||
                                (hasAnySelect && !isSelected && !selectedNeighbors.has(node.id));

                              const initials = node.id.slice(0, 2).toUpperCase();

                              // Label layout parameters
                              const cos = Math.cos(node.angle);
                              const sin = Math.sin(node.angle);
                              
                              // Space labels out cleanly using a proportional airGap metric outward from the node boundary
                              const airGap = isHovered || isSelected ? 19 : 15;
                              const nodeRadius = isHovered || isSelected ? 13.5 : 11;
                              const totalReach = nodeRadius + airGap;

                              const lblX = node.x + cos * totalReach;
                              let lblY = node.y + sin * totalReach;

                              let txtAnchor: 'start' | 'end' | 'middle' = 'middle';
                              let dominantBaseline = 'central';

                              if (Math.abs(cos) > 0.45) {
                                // Side labels: snap horizontally, center vertically, add a tiny organic curve offset
                                txtAnchor = cos > 0 ? 'start' : 'end';
                                dominantBaseline = 'central';
                                lblY = node.y + sin * 6;
                              } else {
                                // Vertical alignment sector
                                txtAnchor = 'middle';
                                if (sin > 0) {
                                  // Bottom nodes: float below
                                  dominantBaseline = 'hanging';
                                  lblY = node.y + totalReach - 1.5;
                                } else {
                                  // Top nodes: sit above
                                  dominantBaseline = 'auto';
                                  lblY = node.y - totalReach + 1.5;
                                }
                              }

                              return (
                                <g
                                  key={node.id}
                                  className="cursor-pointer"
                                  onMouseEnter={() => setHoveredNode(node.id)}
                                  onMouseLeave={() => setHoveredNode(null)}
                                  onClick={() => setSelectedParticipant(isSelected ? null : node.id)}
                                  opacity={isDimmed ? 0.45 : 1}
                                >
                                  {isSelected && (
                                    <circle
                                      cx={node.x}
                                      cy={node.y}
                                      r="18"
                                      fill="none"
                                      stroke="#bfff00"
                                      strokeWidth="1.5"
                                      className="animate-ping opacity-50"
                                    />
                                  )}

                                  <circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={isHovered || isSelected ? "13.5" : "11"}
                                    fill={isHovered || isSelected ? "#bfff00" : "#141417"}
                                    stroke={isHovered || isSelected ? '#bfff00' : '#525252'}
                                    strokeWidth={isHovered || isSelected ? "2.5" : "1.2"}
                                    className="transition-all duration-150"
                                  />

                                  <text
                                    x={node.x}
                                    y={node.y}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    className="text-[9.5px] font-mono font-black"
                                    fill={isHovered || isSelected ? '#000000' : '#e5e5e5'}
                                  >
                                    {initials}
                                  </text>

                                  {/* High-Contrast Readability Backdrop Outline */}
                                  <text
                                    x={lblX}
                                    y={lblY}
                                    textAnchor={txtAnchor}
                                    dominantBaseline={dominantBaseline}
                                    stroke="#000000"
                                    strokeWidth="4"
                                    strokeLinejoin="round"
                                    className="text-[9.5px] font-mono font-black uppercase tracking-widest select-none pointer-events-none"
                                    opacity="0.95"
                                  >
                                    {node.id}
                                  </text>

                                  {/* Crisp Readable Text Foreground */}
                                  <text
                                    x={lblX}
                                    y={lblY}
                                    textAnchor={txtAnchor}
                                    dominantBaseline={dominantBaseline}
                                    className="text-[9.5px] font-mono font-black uppercase tracking-widest transition-colors duration-150"
                                    fill={isHovered || isSelected ? '#bfff00' : '#e4e4e7'}
                                  >
                                    {node.id}
                                  </text>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                    </g>
                  </svg>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-900 bg-neutral-950/20 p-2.5 text-center" id="topology-legends-wrapper">
              <span className="text-[8px] text-neutral-500 font-mono tracking-widest uppercase block mb-1">PROXIMITY NETWORK LEGEND:</span>
              <div className="flex flex-wrap justify-center gap-4 font-mono text-[7.5px] text-neutral-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-[#bfff00]" /> ACTIVE COUPLING</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 bg-neutral-850" /> WEAK REACTION</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#bfff00] bg-black" /> SELECTED SPEAKER</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* CATEGORY 2: TEMPORAL DISTRIBUTION & TIMELINE DYNAMICS */}
      <div className="border border-neutral-800 bg-[#0c0c0e]/30 p-6 space-y-6 relative shadow-lg" id="group-temporal-patterns">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-400 via-neutral-800 to-transparent" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-900">
          <div className="space-y-1">
            <span className="text-[8px] bg-amber-400/15 text-amber-400 border border-amber-400/25 font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
              CATEGORY 02 // TIMELINES &amp; DENSITY
            </span>
            <h3 className="text-sm font-black text-white font-mono uppercase tracking-widest flex items-center gap-2">
              TEMPORAL PATTERNS &amp; ZOOMABLE TIMELINES
            </h3>
          </div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase">Chronological Dialogue Cycles</span>
        </div>

        {/* Interactive Zoomable Daily Activity Timeline */}
        <div className="relative border border-neutral-850 bg-neutral-900/30 p-1" id="timeline-zoom-container">
          {renderTimelineZoomChart()}
        </div>

        {/* Two-Column pattern layout for patterns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="temporal-pattern-charts">
          
          {/* Sits left inside temporal pattern grid - Hourly Dialogue density inside 2-span */}
          <div className="lg:col-span-2 bg-[#121212]/90 border border-neutral-800 p-6 shadow-xl relative" id="hourly-activity-chart-panel">
            <div className="flex justify-between items-center mb-5 pb-2 border-b border-neutral-900">
              <h3 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-400" /> HOURLY DIALOGUE DENSITY CHART
              </h3>
              <span className="text-[8px] font-mono text-[#bfff00] bg-black px-1.5 py-0.5 border border-neutral-850 font-black uppercase tracking-widest">LIVE DATA FEED</span>
            </div>
            
            <motion.div
              key={`${selectedParticipant || 'all'}-${startIndex}-${endIndex}-hourly`}
              initial={{ opacity: 0.75, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            >
              {renderHourlyChart(
                activeParticipant ? activeParticipant.hourlyDistribution : hourlyDistribution
              )}
            </motion.div>
            
            <p className="text-[9px] text-neutral-550 italic mt-3 text-center uppercase font-mono tracking-tight bg-black/40 py-1 border border-neutral-900/60 font-medium">
              {activeParticipant ? `FILTERING BY SPEAKER: "${activeParticipant.name}"` : 'CUMULATIVE CONVERSATION TIMING CYCLES'}
            </p>
          </div>

          {/* Sits right inside temporal pattern grid - Weekly distribution pattern */}
          <div className="bg-[#121212]/90 border border-neutral-800 p-6 shadow-xl" id="weekly-density-panel">
            <div className="flex justify-between items-center mb-4 pb-1 border-b border-neutral-900">
              <h3 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#bfff00]" /> WEEKLY DENSITY
              </h3>
              <span className="text-[8px] text-neutral-500 font-mono uppercase">WEEK CYCLES</span>
            </div>
            
            <motion.div
              key={`${selectedParticipant || 'all'}-${startIndex}-${endIndex}-weekly`}
              initial={{ opacity: 0.75 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35 }}
            >
              {renderWeeklyChart(
                activeParticipant ? activeParticipant.dayOfWeekDistribution : dayOfWeekDistribution
              )}
            </motion.div>
          </div>

        </div>
      </div>

      {/* CATEGORY 3: LINGUISTIC CORES & SYMBOLS */}
      <div className="border border-neutral-800 bg-[#0c0c0e]/30 p-6 space-y-6 relative shadow-lg" id="group-linguistic-symbols">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 via-neutral-800 to-transparent" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-900">
          <div className="space-y-1">
            <span className="text-[8px] bg-pink-500/15 text-pink-500 border border-pink-500/25 font-mono font-bold px-2 py-0.5 uppercase tracking-widest">
              CATEGORY 03 // DICTIONARY &amp; EMOJIS
            </span>
            <h3 className="text-sm font-black text-white font-mono uppercase tracking-widest flex items-center gap-2">
              SYMBOLIC GRID &amp; LINGUISTIC CORES
            </h3>
          </div>
          <span className="text-[9px] font-mono text-neutral-500 uppercase">Interactive Vocabulary Analytics</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="dashboard-vocabulary-grid">
          
          {/* Top Emojis Panel */}
          <div className="bg-[#121212]/90 border border-neutral-800 p-6 shadow-xl" id="top-emojis-panel">
            <div className="flex justify-between items-center mb-4 pb-1 border-b border-neutral-900">
              <h3 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-pink-500" /> POPULAR SYMBOLS GRID
              </h3>
              <span className="text-[8px] text-neutral-500 font-mono uppercase">TOP 16 SYMBOLS</span>
            </div>
            
            <motion.div 
              key={`${selectedParticipant || 'all'}-${startIndex}-${endIndex}-emojis`}
              initial={{ opacity: 0.75, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-4 gap-2 text-center" 
              id="top-emojis-grid"
            >
              {allEmojis.slice(0, 16).map((item, idx) => (
                <div key={idx} className="p-2 bg-neutral-950 border border-neutral-900 hover:border-pink-500 hover:bg-neutral-900 transition-all cursor-pointer duration-200" id={`emoji-box-${idx}`}>
                  <p className="text-2xl mb-1 hover:scale-110 transition-transform">{item.emoji}</p>
                  <p className="font-mono text-[8px] font-black text-white bg-black border border-neutral-850 py-0.5 px-1 truncate uppercase">
                    {item.count.toLocaleString()}x
                  </p>
                </div>
              ))}
              {allEmojis.length === 0 && (
                <p className="text-xs text-neutral-500 italic col-span-4 py-8 font-mono uppercase">NO EMOTIVE SYMBOLS FOUND</p>
              )}
            </motion.div>
          </div>

          {/* Top Words Panel */}
          <div className="bg-[#121212]/90 border border-neutral-800 p-6 shadow-xl" id="top-words-panel">
            <div className="flex justify-between items-center mb-4 pb-1 border-b border-neutral-900">
              <h3 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-[#bfff00]" /> LINGUISTIC WORD CORES
              </h3>
              <span className="text-[8px] text-neutral-500 font-mono uppercase">KEY LEXICONS</span>
            </div>
            
            <motion.div 
              key={`${selectedParticipant || 'all'}-${startIndex}-${endIndex}-words`}
              initial={{ opacity: 0.75, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap gap-1.5" 
              id="top-words-list"
            >
              {allWords.slice(0, 22).map((item, idx) => {
                const opacities = [
                  'bg-[#bfff00] text-black border-[#bfff00] font-black text-xs uppercase italic hover:bg-white',
                  'bg-neutral-900 text-[#bfff00] border-neutral-800 font-bold text-[10.5px] hover:border-[#bfff00]',
                  'bg-neutral-950 text-neutral-400 border-neutral-900 text-[10px] hover:border-neutral-700',
                ];
                let styleClass = opacities[2];
                if (idx < 3) styleClass = opacities[0];
                else if (idx < 8) styleClass = opacities[1];

                return (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 border font-mono tracking-wider transition-all duration-200 cursor-default ${styleClass}`}
                    id={`word-badge-${idx}`}
                  >
                    <span>{item.word}</span>
                    <span className="text-[8px] opacity-75 font-black">[{item.count}]</span>
                  </span>
                );
              })}
              {allWords.length === 0 && (
                <p className="text-xs text-neutral-500 italic py-8 font-mono uppercase">No speed dialogue logs matching criteria</p>
              )}
            </motion.div>
          </div>

        </div>
      </div>

    </div>
  );
}

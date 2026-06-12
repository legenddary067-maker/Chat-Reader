import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, ChatStats } from '../types';
import { 
  Sparkles, 
  Brain, 
  CheckSquare, 
  HelpCircle, 
  Send, 
  ArrowRight, 
  Loader, 
  MessageSquare,
  AlertCircle,
  Clock,
  RefreshCw,
  Cpu,
  Smile,
  Frown,
  Meh,
  ChevronDown,
  Code2,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AiSummarizerProps {
  messages: ChatMessage[];
  stats: ChatStats;
  fileName: string;
}

interface SentimentSummary {
  total: number;
  positive: number;
  neutral: number;
  negative: number;
  perSender: Record<string, { positive: number; neutral: number; negative: number }>;
}

export default function AiSummarizer({ messages, stats, fileName }: AiSummarizerProps) {
  const [selectedMode, setSelectedMode] = useState<'general' | 'situation' | 'action-items'>('general');
  const [summaryOutput, setSummaryOutput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>('');
  const [tickerIndex, setTickerIndex] = useState<number>(0);
  const [useLocalModel, setUseLocalModel] = useState<boolean>(false);

  // Sentiment Analysis states
  const [sentimentData, setSentimentData] = useState<SentimentSummary | null>(null);
  const [showSentimentChart, setShowSentimentChart] = useState<boolean>(false);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState<boolean>(false);

  // Custom Prompt states
  const [showCustomPrompt, setShowCustomPrompt] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [customSystemInstruction, setCustomSystemInstruction] = useState<string>('');
  const [customOutput, setCustomOutput] = useState<string>('');
  const [isRunningCustom, setIsRunningCustom] = useState<boolean>(false);

  // Ask Q&A states
  const [question, setQuestion] = useState<string>('');
  const [qaHistory, setQaHistory] = useState<{ query: string; reply: string }[]>([]);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [askError, setAskError] = useState<string>('');

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Engaging retro loading ticker messages
  const loadingTickers = [
    '🔐 INITIALIZING ENCRYPTION BRIDGE...',
    '🧠 GENERATING TEMPORAL DIALOGUE GRAPHS...',
    '⚡ TRANSMITTING CHAT SUBSETS TO GEMINI-3.5-FLASH...',
    '📂 INDEXING SPEAKER COLLABORATION FREQUENCIES...',
    '🔍 COMPILING PSYCHOLOGICAL ALIGNMENTS...',
    '🪐 PARSING EMOTIVE CLUSTERS AND LOGISTICS...',
    '📝 DRAFTING FINAL INTELLIGENCE DATA...',
    '📊 ANALYZING SENTIMENT DISTRIBUTION...',
    '🔄 SYNTHESIZING MULTI-CHUNK ANALYSIS...'
  ];

  // Rotate tickers during load
  useEffect(() => {
    let interval: any;
    if (isLoading || isAsking || isRunningCustom || isAnalyzingSentiment) {
      interval = setInterval(() => {
        setTickerIndex((prev) => (prev + 1) % loadingTickers.length);
      }, 3500);
    } else {
      setTickerIndex(0);
    }
    return () => clearInterval(interval);
  }, [isLoading, isAsking, isRunningCustom, isAnalyzingSentiment]);

  // Handle Scroll to Q&A response
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [qaHistory]);

  // Run sentiment analysis manually and show visual chart
  const analyzeSentiment = async () => {
    setIsAnalyzingSentiment(true);
    setErrorText('');
    setAskError('');
    try {
      const messagePayload = messages.map(m => ({
        sender: m.sender,
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
      }));

      const response = await fetch('/api/ai/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagePayload }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze sentiment.');
      }
      setSentimentData(data);
      setShowSentimentChart(true);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Sentiment analysis failed.');
    } finally {
      setIsAnalyzingSentiment(false);
    }
  };

  const runAnalysis = async (mode: 'general' | 'situation' | 'action-items') => {
    setIsLoading(true);
    setErrorText('');
    setSummaryOutput('');
    setSelectedMode(mode);

    // Prepare serialized messages metadata
    const messagePayload = messages.map(m => ({
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
    }));

    try {
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messagePayload, 
          selectedMode: mode,
          useLocalModel
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server responded with an unexpected error.');
      }

      setSummaryOutput(data.output);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Connection failed. Please verify your GEMINI_API_KEY is configured correctly.');
    } finally {
      setIsLoading(false);
    }
  };

  const runCustomAnalysis = async () => {
    if (!customPrompt.trim()) {
      setErrorText('Please enter a custom prompt.');
      return;
    }
    setIsRunningCustom(true);
    setErrorText('');
    setCustomOutput('');

    const messagePayload = messages.map(m => ({
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
    }));

    try {
      const response = await fetch('/api/ai/custom-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagePayload,
          customPrompt,
          systemInstruction: customSystemInstruction || undefined,
          useLocalModel
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Custom analysis failed.');
      }
      setCustomOutput(data.output);
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || 'Custom prompt analysis execution failed.');
    } finally {
      setIsRunningCustom(false);
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    setAskError('');
    const currentQuestion = question;
    setQuestion('');

    const messagePayload = messages.map(m => ({
      sender: m.sender,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
    }));

    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messagePayload, 
          question: currentQuestion,
          useLocalModel
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze answer.');
      }

      setQaHistory((prev) => [...prev, { query: currentQuestion, reply: data.output }]);
    } catch (err: any) {
      console.error(err);
      setAskError(err.message || 'Failed to submit question. Check connection.');
    } finally {
      setIsAsking(false);
    }
  };

  // Run automatically on first render
  useEffect(() => {
    if (messages.length > 0 && !summaryOutput && !isLoading) {
      runAnalysis('general');
    }
  }, [messages]);

  // Custom visual markdown parsing renderer (headers, bolding, checkboxes, bullets)
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const cleanLine = line.trim();

      // Skip empty lines
      if (!cleanLine) return <div key={idx} className="h-2.5" />;

      // Headers (### Header)
      if (cleanLine.startsWith('### ')) {
        const headerText = cleanLine.replace('###', '').trim();
        return (
          <h4 
            key={idx} 
            className="text-xs font-black font-mono uppercase tracking-widest text-[#bfff00] mt-5 mb-2 pb-1.5 border-b border-neutral-900 flex items-center gap-1.5"
          >
            <Cpu className="w-3.5 h-3.5 text-[#bfff00]" />
            {headerText}
          </h4>
        );
      }

      if (cleanLine.startsWith('## ')) {
        const headerText = cleanLine.replace('##', '').trim();
        return (
          <h3 
            key={idx} 
            className="text-sm font-black font-mono uppercase tracking-widest text-white mt-6 mb-3 pb-2 border-b border-neutral-800 flex items-center gap-2"
          >
            <Brain className="w-4 h-4 text-purple-400" />
            {headerText}
          </h3>
        );
      }

      // Checkboxes (- [ ])
      if (cleanLine.startsWith('- [ ]')) {
        const taskText = cleanLine.substring(5).trim();
        return (
          <div key={idx} className="flex items-start gap-2 py-1 select-none text-neutral-350 text-xs font-mono">
            <span className="w-4 h-4 rounded-none border border-neutral-800 bg-black flex items-center justify-center shrink-0 mt-0.5" />
            <span>{parseInlinedBoldText(taskText)}</span>
          </div>
        );
      }

      if (cleanLine.startsWith('- [x]') || cleanLine.startsWith('- [X]')) {
        const taskText = cleanLine.substring(5).trim();
        return (
          <div key={idx} className="flex items-start gap-2 py-1 select-none text-neutral-500 line-through text-xs font-mono">
            <span className="w-4 h-4 rounded-none border border-[#bfff00] bg-[#bfff00]/10 flex items-center justify-center shrink-0 mt-0.5 text-[#bfff00] font-black leading-none text-[10px]">✓</span>
            <span>{parseInlinedBoldText(taskText)}</span>
          </div>
        );
      }

      // Bullets (- item or * item)
      if (cleanLine.startsWith('- ') || cleanLine.startsWith('* ')) {
        const bulletText = cleanLine.substring(2).trim();
        return (
          <div key={idx} className="flex items-start gap-2.5 py-1 text-xs text-neutral-350 leading-relaxed font-sans">
            <span className="text-[#bfff00] shrink-0 mt-1.5 text-[8.5px] font-bold font-mono">➔</span>
            <span>{parseInlinedBoldText(bulletText)}</span>
          </div>
        );
      }

      // Normal text paragraphs with parsed inline bold tags `**something**`
      return (
        <p key={idx} className="text-xs text-neutral-300 leading-relaxed py-1 font-sans">
          {parseInlinedBoldText(cleanLine)}
        </p>
      );
    });
  };

  // Small helper to replace native bold tags with styled span tags
  const parseInlinedBoldText = (text: string) => {
    const parts = text.split(/\*\*([\s\S]*?)\*\*/g);
    if (parts.length <= 1) return text;
    
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        // This is inside **bold**
        return <strong key={i} className="text-white font-mono uppercase bg-neutral-900 border border-neutral-850 px-1 py-0.2 mx-0.5 font-bold tracking-wider text-[10.5px]">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="ai-cognitive-suite">
      
      {/* LEFT COLUMN: Controls & Analysis Panel */}
      <div className="lg:col-span-7 flex flex-col gap-6" id="analytical-control-column">
        
        {/* Header Brief Summary of Analyzer Capability */}
        <div className="bg-[#121212] border border-neutral-800 p-6 shadow-xl" id="analyzer-modes-panel">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 pb-3 border-b border-neutral-900">
            <div>
              <h3 className="text-sm font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4.5 h-4.5 text-[#bfff00]" /> AI ANALYSING CENTRE
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5">Secure LLM-powered dialogue trace synthesis</p>
            </div>
            
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-[10px] text-neutral-400 font-mono font-extrabold uppercase bg-neutral-950 border border-neutral-850 px-3 py-1 flex items-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 bg-[#bfff00] rounded-full animate-pulse" />
                {useLocalModel ? 'OLLAMA CO-PROCESSOR' : 'INTELLIGENT GEMINI PIPELINE'}
              </span>
              <button 
                onClick={analyzeSentiment}
                disabled={isAnalyzingSentiment}
                className="text-[9px] font-mono text-[#bfff00] hover:text-white transition-colors flex items-center gap-1 uppercase select-none mt-1"
                title="Calculate emotional distribution across speakers"
              >
                <Smile className="w-3.5 h-3.5" />
                {isAnalyzingSentiment ? 'ANALYZING SENTIMENT...' : 'RUN SENTIMENT COMPILER'}
              </button>
            </div>
          </div>

          {/* Tab Selector Buttons for mode analysis */}
          <div className="grid grid-cols-3 gap-2" id="ai-analysis-tabs">
            <button
              onClick={() => {
                setCustomOutput('');
                runAnalysis('general');
              }}
              disabled={isLoading || isRunningCustom}
              className={`p-3 border text-[10px] font-black font-mono uppercase tracking-wider text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                selectedMode === 'general' && !customOutput
                  ? 'bg-neutral-950 border-[#bfff00] text-white shadow-md'
                  : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200 hover:border-neutral-700'
              }`}
              id="analysis-tab-general"
            >
              <Brain className={`w-4 h-4 ${selectedMode === 'general' && !customOutput ? 'text-[#bfff00]' : 'text-neutral-500'}`} />
              <span>CORE SUMMARY</span>
            </button>

            <button
              onClick={() => {
                setCustomOutput('');
                runAnalysis('situation');
              }}
              disabled={isLoading || isRunningCustom}
              className={`p-3 border text-[10px] font-black font-mono uppercase tracking-wider text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                selectedMode === 'situation' && !customOutput
                  ? 'bg-neutral-950 border-[#bfff00] text-white shadow-md'
                  : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200 hover:border-neutral-700'
              }`}
              id="analysis-tab-situation"
            >
              <Clock className={`w-4 h-4 ${selectedMode === 'situation' && !customOutput ? 'text-[#bfff00]' : 'text-neutral-500'}`} />
              <span>SITUATION REPORT</span>
            </button>

            <button
              onClick={() => {
                setCustomOutput('');
                runAnalysis('action-items');
              }}
              disabled={isLoading || isRunningCustom}
              className={`p-3 border text-[10px] font-black font-mono uppercase tracking-wider text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                selectedMode === 'action-items' && !customOutput
                  ? 'bg-neutral-950 border-[#bfff00] text-white shadow-md'
                  : 'bg-neutral-900 border-neutral-850 text-neutral-400 hover:bg-neutral-850 hover:text-neutral-200 hover:border-neutral-700'
              }`}
              id="analysis-tab-actions"
            >
              <CheckSquare className={`w-4 h-4 ${selectedMode === 'action-items' && !customOutput ? 'text-[#bfff00]' : 'text-neutral-500'}`} />
              <span>DUTIES & TASKS</span>
            </button>
          </div>

          {/* Expandable Custom Prompt panel */}
          <div className="mt-4 border-t border-neutral-900 pt-4" id="custom-prompt-wrapper">
            <button
              onClick={() => setShowCustomPrompt(!showCustomPrompt)}
              className="w-full px-3 py-2 text-[10px] font-mono uppercase tracking-wider border border-neutral-800 text-neutral-300 hover:border-[#bfff00] transition-colors flex items-center justify-between"
              id="custom-prompt-toggle-btn"
            >
              <span className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-[#bfff00]" />
                CUSTOM ANALYSIS PLAYGROUND TEMPLATES
              </span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCustomPrompt ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCustomPrompt && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 mt-3 overflow-hidden"
                >
                  <div>
                    <span className="text-[9px] font-mono uppercase text-neutral-500 block mb-1">PROMPT INSTRUCTION (E.G. Extract financial figures, deadlines)</span>
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Enter custom analysis query template (e.g. List all explicit timelines, resolve arguments...)"
                      className="w-full bg-black border border-neutral-850 p-2.5 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#bfff00] font-mono resize-none h-20"
                    />
                  </div>

                  <div>
                    <span className="text-[9px] font-mono uppercase text-neutral-500 block mb-1">SYSTEM CONTROLLER INSTROL (OPTIONAL)</span>
                    <input
                      type="text"
                      value={customSystemInstruction}
                      onChange={(e) => setCustomSystemInstruction(e.target.value)}
                      placeholder="Optional system instruction override role (e.g. You are a forensic psychologist)"
                      className="w-full bg-black border border-neutral-850 p-2 text-xs text-white placeholder-neutral-700 focus:outline-none focus:border-[#bfff00] font-mono"
                    />
                  </div>

                  <button
                    onClick={runCustomAnalysis}
                    disabled={isRunningCustom || !customPrompt.trim()}
                    className="w-full bg-[#bfff00] hover:bg-white text-black transition-colors py-2 text-[10px] font-mono font-bold uppercase disabled:opacity-50 select-none cursor-pointer"
                  >
                    {isRunningCustom ? 'PROCESSING CUSTOM TRACE...' : 'EXECUTE CUSTOM COMPILED PROMPT'}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Local Model Selector Toggle */}
          <div className="mt-3" id="local-model-selector-wrapper">
            <label className="flex items-center gap-3 p-2.5 bg-neutral-950 border border-neutral-850 cursor-pointer hover:border-neutral-750 transition-colors select-none">
              <input
                type="checkbox"
                checked={useLocalModel}
                onChange={(e) => setUseLocalModel(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-4 h-4 border flex items-center justify-center shrink-0 transition-all duration-150 ${
                useLocalModel 
                  ? 'bg-[#bfff00] border-[#bfff00]' 
                  : 'bg-black border-neutral-700'
              }`}>
                {useLocalModel && (
                  <span className="text-[11px] text-black font-extrabold select-none">✓</span>
                )}
              </div>
              <span className="text-[9.5px] font-mono text-neutral-400 uppercase">
                OLLAMA LOCAL BYPASS ENGINE (FALLBACK / OFFLINE PRIVACY)
              </span>
            </label>
          </div>
        </div>

        {/* Dynamic Display Area of AI Analysis Details */}
        <div className="bg-[#121212] border border-neutral-800 p-6 flex-1 flex flex-col min-h-[350px] shadow-xl relative" id="analysis-output-container">
          
          <div className="flex items-center justify-between mb-4 border-b border-neutral-900 pb-2">
            <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-wider uppercase">
              STATUS LOGS: {isLoading || isRunningCustom ? 'PROCESSING TRACE...' : 'COMPILER STANDBY ///'}
            </span>
            {!(isLoading || isRunningCustom) && (summaryOutput || customOutput) && (
              <button
                onClick={() => {
                  if (customOutput) {
                    runCustomAnalysis();
                  } else {
                    runAnalysis(selectedMode);
                  }
                }}
                className="text-[9px] font-mono text-[#bfff00] font-bold uppercase border border-neutral-800 bg-neutral-900 px-2 py-1 flex items-center gap-1 hover:border-[#bfff00] transition-colors"
                id="redo-analysis-btn"
              >
                <RefreshCw className="w-2.5 h-2.5" /> RE-CALCULATE
              </button>
            )}
          </div>

          {/* Core Content Box with loading ticker rotation states */}
          <div className="flex-1 flex flex-col justify-between" id="markdown-viewer">
            <AnimatePresence mode="wait">
              {isLoading || isRunningCustom || isAnalyzingSentiment ? (
                <motion.div
                  key="loading-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center text-center py-10"
                >
                  <div className="relative mb-5 flex items-center justify-center">
                    <Loader className="w-9 h-9 text-[#bfff00] animate-spin shrink-0" />
                    <span className="absolute text-[8px] font-black font-mono text-white animate-pulse">AI</span>
                  </div>
                  
                  <div className="max-w-md space-y-2">
                    <p className="font-mono text-[10px] font-black text-white bg-black border border-neutral-850 px-3 py-1 animate-pulse tracking-wide select-none">
                      {loadingTickers[tickerIndex]}
                    </p>
                    <p className="text-[11px] text-neutral-400 font-sans">
                      Synthesizing large chats triggers parallel chunked computation up to 50MB uploads.
                    </p>
                  </div>
                </motion.div>
              ) : errorText ? (
                <motion.div
                  key="error-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 border border-rose-950/40 bg-rose-950/10 text-rose-300 rounded-none flex items-start gap-3.5"
                >
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h5 className="font-black text-xs font-mono uppercase tracking-widest text-rose-400">Analysis Integration Exception</h5>
                    <p className="text-[11px] leading-relaxed select-all">
                      {errorText}
                    </p>
                    <div className="pt-2">
                      <p className="text-[10px] text-neutral-400 font-sans leading-relaxed">
                        To activate AI capabilities, open the **Secrets tab in Settings** (top-right of AI Studio) and add a valid **GEMINI_API_KEY**, or configure local Ollama setup.
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (summaryOutput || customOutput) ? (
                <motion.div
                  key="markdown-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar"
                >
                  {renderFormattedMarkdown(customOutput || summaryOutput)}
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col items-center justify-center py-12 text-center text-neutral-500"
                >
                  <Brain className="w-8 h-8 text-neutral-700 mb-2" />
                  <p className="text-xs font-mono uppercase tracking-widest font-black text-neutral-400">NO SUMMARY TRACE GENERATED</p>
                  <p className="text-[11px] text-neutral-500 mt-1 max-w-sm">
                    Upload a WhatsApp or Instagram file log to trigger automatically.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* VISUAL SENTIMENT ANALYSIS COMPONENT PANEL */}
        {showSentimentChart && sentimentData && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#121212] border border-neutral-800 p-6 shadow-xl space-y-4"
            id="sentiment-breakdown-panel"
          >
            <div className="flex items-center justify-between border-b border-neutral-900 pb-2.5">
              <h3 className="text-xs font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-[#bfff00]" />
                GLOBAL DIALOGUE EMOTION MATRIX
              </h3>
              <button
                onClick={() => setShowSentimentChart(false)}
                className="text-neutral-500 hover:text-white transition-colors text-xs font-mono uppercase"
              >
                CLOSE [X]
              </button>
            </div>

            {/* Global distribution bar chart */}
            <div className="space-y-3">
              {[
                { label: 'Positive Resonance', count: sentimentData.positive, color: '#86efac', emoji: '😄' },
                { label: 'Neutral Baseline', count: sentimentData.neutral, color: '#9ca3af', emoji: '😐' },
                { label: 'Negative Static', count: sentimentData.negative, color: '#f87171', emoji: '😞' },
              ].map((item) => {
                const percent = sentimentData.total > 0 ? (item.count / sentimentData.total) * 100 : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                      <span>{item.emoji} {item.label}</span>
                      <span className="text-white font-bold">{item.count} messages ({percent.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-neutral-950 border border-neutral-900 h-2.5">
                      <div 
                        className="h-full transition-all duration-500" 
                        style={{ width: `${percent}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Per-participant breakdown stats */}
            <div className="border-t border-neutral-900 pt-3">
              <span className="text-[10px] font-mono font-bold text-neutral-500 tracking-wider uppercase block mb-2">PER-SENDER EMOTIONAL SPLIT:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto no-scrollbar font-mono text-[9px]">
                {Object.entries(sentimentData.perSender).map(([sender, counts]) => {
                  const countsTyped = counts as { positive: number; neutral: number; negative: number };
                  return (
                    <div key={sender} className="p-2 border border-neutral-900 bg-neutral-950/60 flex flex-col justify-between">
                      <span className="text-neutral-200 font-bold block mb-1 truncate">{sender.toUpperCase()}</span>
                      <div className="flex items-center gap-3 text-neutral-400 text-[10px]">
                        <span className="text-emerald-400">😄 {countsTyped.positive}</span>
                        <span className="text-neutral-400">😐 {countsTyped.neutral}</span>
                        <span className="text-rose-450 text-rose-400">😞 {countsTyped.negative}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* RIGHT COLUMN: Interactive Ask Q&A (Ask Gemini anything about the chat) */}
      <div className="lg:col-span-12 lg:col-span-5 flex flex-col" id="chatbot-qa-column">
        <div className="bg-[#121212] border border-neutral-800 p-6 flex flex-col h-full shadow-xl relative min-h-[450px]" id="qa-interactive-card">
          
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-900">
            <div>
              <h3 className="text-sm font-black text-white font-mono uppercase tracking-widest flex items-center gap-1.5">
                <HelpCircle className="w-4.5 h-4.5 text-[#bfff00]" /> CONVERSATION Q&A
              </h3>
              <p className="text-[10px] text-neutral-400 font-mono uppercase mt-0.5">Query logs directly via Gemini core</p>
            </div>
            <MessageSquare className="w-4 h-4 text-purple-400" />
          </div>

          {/* Interactive Chat bubble history */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto border border-neutral-950 bg-black/45 p-4 space-y-4 mb-4 max-h-[380px] no-scrollbar flex flex-col"
            id="qa-threads-display"
          >
            {qaHistory.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-600 my-auto py-10">
                <Brain className="w-7 h-7 text-neutral-800 mb-2.5" />
                <p className="text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-400">ASK SPECIFIC LOG DETAILS</p>
                <div className="text-[11px] text-neutral-500 mt-2 max-w-xs space-y-1.5 leading-relaxed font-sans">
                  <p>Try prompting things like:</p>
                  <ul className="text-left font-mono pl-3 space-y-1.5 text-[9.5px] text-[#bfff00]">
                    <li>➔ "What did they decide about the venue cost?"</li>
                    <li>➔ "Who is causing the planning delays?"</li>
                    <li>➔ "Extract all phone numbers from this log."</li>
                  </ul>
                </div>
              </div>
            )}

            {qaHistory.map((qa, index) => (
              <div key={index} className="space-y-3" id={`qa-exchange-${index}`}>
                {/* User query bubble */}
                <div className="flex justify-end">
                  <div className="bg-neutral-900 border border-neutral-800 text-white text-xs py-2 px-3 max-w-[85%] font-sans relative">
                    <span className="absolute -top-1.5 -right-1 text-[8px] font-mono font-bold text-[#bfff00] uppercase bg-black px-1.5 border border-neutral-850">
                      USER REQUEST
                    </span>
                    {qa.query}
                  </div>
                </div>

                {/* Gemini AI reply bubble */}
                <div className="flex justify-start">
                  <div className="bg-[#121212]/95 border-l-2 border-[#bfff00] text-neutral-250 text-xs py-3 px-3.5 max-w-[90%] leading-relaxed font-sans space-y-1 border-y border-r border-neutral-850 shadow-md">
                    <span className="inline-block text-[8px] font-mono font-bold text-white uppercase bg-neutral-950 border border-neutral-800 px-1.5 py-0.5 mb-1.5">
                      CHATREADER CORES RESPONSE
                    </span>
                    <div className="space-y-1.5 font-sans mt-1">
                      {renderFormattedMarkdown(qa.reply)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isAsking && (
              <div className="flex justify-start">
                <div className="bg-neutral-950 border border-neutral-900 text-neutral-350 text-xs py-2.5 px-3 rounded-none max-w-[85%] animate-pulse font-mono flex items-center gap-2">
                  <Loader className="w-3.5 h-3.5 text-[#bfff00] animate-spin" />
                  <span>GEMINI TRACE IN PROGRESS: "{loadingTickers[tickerIndex]}"</span>
                </div>
              </div>
            )}

            {askError && (
              <div className="p-3 border border-rose-950/40 bg-rose-950/10 text-rose-400 text-[10.5px] font-mono uppercase tracking-wide">
                ⚠️ ERROR: {askError}
              </div>
            )}
          </div>

          {/* Q&A Input Panel */}
          <form onSubmit={handleAskQuestion} className="flex gap-2" id="qa-text-input-form">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={isAsking || messages.length === 0}
              placeholder={messages.length === 0 ? "Upload logs to unlock prompt..." : "Ask Gemini about the conversation logs..."}
              className="flex-1 bg-black border border-neutral-850 px-3.5 py-2.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-[#bfff00] font-mono"
              id="qa-chat-input-box"
            />
            <button
              type="submit"
              disabled={isAsking || !question.trim() || messages.length === 0}
              className="px-4 bg-[#bfff00] text-black font-black font-mono text-xs uppercase tracking-wider hover:bg-white disabled:opacity-50 disabled:hover:bg-[#bfff00] transition-colors flex items-center gap-1.5 cursor-pointer rounded-lg shrink-0"
              id="qa-chat-submit-btn"
            >
              <span>SEND</span>
              <Send className="w-3 h-3 shrink-0" />
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}

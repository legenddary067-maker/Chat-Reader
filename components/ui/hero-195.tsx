"use client"

import * as React from "react"
import { useState, useRef } from "react"
import { TracingBeam } from "@/components/ui/tracing-beam"
import { BorderBeam } from "@/components/ui/border-beam"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Terminal, 
  Play, 
  ShieldCheck, 
  CheckCircle2, 
  Activity,
  Upload,
  FileText,
  MousePointerClick
} from "lucide-react"

interface Hero195Props {
  onPasteSubmit: (text: string) => void;
  onFileUpload: (file: File) => void;
  onLoadSample: (sampleType: 'hackathon' | 'family') => void;
  errorText?: string;
}

export function Hero195({ onPasteSubmit, onFileUpload, onLoadSample, errorText }: Hero195Props) {
  const [sessionName, setSessionName] = useState("My Workspace Session")
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationStep, setSimulationStep] = useState(0)
  
  // File upload state in Hero
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isPasting, setIsPasting] = useState(false)
  const [pasteContent, setPasteContent] = useState("")
  const [dragActive, setDragActive] = useState(false)
  
  // Sample type selected to parse
  const [selectedSample, setSelectedSample] = useState<'hackathon' | 'family' | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setSelectedSample(null)
      setIsPasting(false)
      setSessionName(file.name)
    }
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      setSelectedSample(null)
      setIsPasting(false)
      setSessionName(file.name)
    }
  }

  const selectSample = (sample: 'hackathon' | 'family') => {
    setSelectedSample(sample)
    setSelectedFile(null)
    setIsPasting(false)
    setSessionName(sample === 'hackathon' ? "🌌 DEEP MARS COLONY CREW" : "🍔 REGULAR FAMILY CHAT")
  }

  const handleSimulateAndParse = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSimulating) return

    // Validate we have some resource loaded
    if (!selectedFile && !selectedSample && (!isPasting || !pasteContent.trim())) {
      alert("Please upload a chat trace, choose simulation samples below, or paste a raw log log sequence first.");
      return
    }

    setIsSimulating(true)
    setSimulationStep(1)
    
    // Simulate compilation visuals with real callback execution at end state
    setTimeout(() => {
      setSimulationStep(2)
      
      setTimeout(() => {
        setSimulationStep(3)
        
        setTimeout(() => {
          setIsSimulating(false)
          
          // Execute corresponding real action
          if (selectedSample) {
            onLoadSample(selectedSample)
          } else if (selectedFile) {
            onFileUpload(selectedFile)
          } else if (isPasting && pasteContent.trim()) {
            onPasteSubmit(pasteContent)
          }
        }, 1000)
      }, 1200)
    }, 1000)
  }

  return (
    <div className="w-full bg-black text-white py-16 px-4 md:px-8 border-t border-neutral-900 relative overflow-hidden" id="hero-195-section">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#bfff00]/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 blur-[120px] pointer-events-none rounded-full" />

      <TracingBeam className="px-4 select-none">
        <div className="max-w-3xl mx-auto space-y-12">
          {/* Top Badge */}
          <div className="flex justify-start">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-neutral-900/80 border border-[#bfff00]/30 rounded-full text-[10px] font-mono tracking-widest uppercase font-black text-[#bfff00]">
              <Sparkles className="w-3 h-3 text-[#bfff00] animate-pulse" />
              INTRODUCING HERO BLOCK-195 v4.2
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-6">
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-tight font-display">
              LOCAL FIRST.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#bfff00] via-[#d4ff60] to-emerald-400">
                ZERO CLOUD BIAS.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed font-sans">
              Experience the visual interface of ChatReader Pro layout 195. Powered by 100% on-device cryptography, 
              local sandbox parsers, and custom spotlight highlights, we transform raw convo transcripts into actionable timelines.
            </p>
          </div>

          {/* Interactive Core Control Card with Border Beam */}
          <div 
            className="relative" 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <Card className={`bg-neutral-950/80 border transition-all duration-300 p-6 md:p-8 relative overflow-hidden rounded-xl ${
              dragActive ? 'border-[#bfff00] shadow-[0_0_20px_rgba(191,255,0,0.2)] bg-neutral-900/40' : 'border-neutral-850'
            }`}>
              <BorderBeam 
                size={350} 
                duration={12} 
                borderWidth={1.5} 
                colorFrom="#bfff00" 
                colorTo="#10b981" 
              />
              
              <Tabs defaultValue="parser" className="w-full">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-neutral-900 pb-4">
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight text-white uppercase font-display">
                      INTERACTIVE PORTAL SIMULATOR
                    </CardTitle>
                    <CardDescription className="text-neutral-500 text-[10.5px] font-mono mt-1">
                      RUN SIMULATOR PIPELINES DIRECTLY ON-STAGE
                    </CardDescription>
                  </div>

                  <TabsList className="bg-black border border-neutral-850 rounded-lg p-1 self-stretch sm:self-auto">
                    <TabsTrigger value="parser" className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 data-[state=active]:bg-[#bfff00] data-[state=active]:text-black cursor-pointer">
                      1. Parser
                    </TabsTrigger>
                    <TabsTrigger value="workspace" className="text-[10px] font-mono uppercase tracking-wider px-3 py-1.5 data-[state=active]:bg-[#bfff00] data-[state=active]:text-black cursor-pointer">
                      2. Workspace Settings
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* TAB 1: PARSER SIMULATOR */}
                <TabsContent value="parser" className="space-y-4 outline-none">
                  <form onSubmit={handleSimulateAndParse} className="space-y-4">
                    
                    {/* Source Selection Area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Left side: Upload or Drag files */}
                      <div 
                        onClick={triggerFileInput}
                        className={`border border-dashed rounded-lg p-4 text-center cursor-pointer flex flex-col items-center justify-center min-h-[110px] transition-all bg-black/45 ${
                          selectedFile 
                            ? 'border-[#bfff00] bg-[#bfff00]/5 text-white' 
                            : 'border-neutral-800 hover:border-[#bfff00] text-neutral-400 hover:text-white'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".zip,.txt,.json"
                          className="hidden" 
                        />
                        <Upload className={`w-6 h-6 mb-1.5 ${selectedFile ? 'text-[#bfff00]' : 'text-neutral-500'}`} />
                        {selectedFile ? (
                          <div className="space-y-0.5">
                            <span className="block text-xs font-bold uppercase tracking-wider font-mono text-[#bfff00]">FILE MOUNTED:</span>
                            <span className="text-[10px] font-mono truncate max-w-[200px] block font-medium">{selectedFile.name}</span>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="block text-[10px] font-mono uppercase tracking-wider font-black">DRAG & DROP OR SELECT ARCHIVE</span>
                            <span className="text-[8.5px] text-neutral-500 block font-normal">Supports Whatsapp .zip / .txt / Instagram json</span>
                          </div>
                        )}
                      </div>

                      {/* Right side: Load simulation presets */}
                      <div className="bg-neutral-900/30 border border-neutral-850 p-4 rounded-lg flex flex-col justify-between">
                        <span className="block text-[9px] font-mono font-black text-neutral-400 uppercase tracking-widest mb-2 text-center">
                          SIMULATE TRACE ARCHIVE PRESETS
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => selectSample('hackathon')}
                            className={`px-2 py-2 text-[8.5px] font-mono font-bold uppercase text-left tracking-wider border rounded-md transition-all cursor-pointer ${
                              selectedSample === 'hackathon'
                                ? 'bg-black border-[#bfff00] text-[#bfff00] hover:text-[#bfff00]'
                                : 'bg-black/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                            }`}
                          >
                            🌌 MARS COLONY LOGS
                          </button>
                          <button
                            type="button"
                            onClick={() => selectSample('family')}
                            className={`px-2 py-2 text-[8.5px] font-mono font-bold uppercase text-left tracking-wider border rounded-md transition-all cursor-pointer ${
                              selectedSample === 'family'
                                ? 'bg-black border-[#bfff00] text-[#bfff00] hover:text-[#bfff00]'
                                : 'bg-black/50 border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white'
                            }`}
                          >
                            🍔 FAMILY CHAT LOGS
                          </button>
                        </div>
                        <p className="text-[8.5px] text-neutral-550 italic font-mono text-center mt-2">
                          Select a presets package to boot dynamic workspace structures instantly.
                        </p>
                      </div>

                    </div>

                    {/* Paste Toggle area */}
                    <div className="border-t border-neutral-900 pt-3">
                      {!isPasting ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsPasting(true)
                            setSelectedFile(null)
                            setSelectedSample(null)
                          }}
                          className="text-[9.5px] font-mono font-black uppercase text-neutral-450 hover:text-[#bfff00] transition-colors flex items-center gap-1.5 cursor-pointer mx-auto"
                        >
                          <FileText className="w-3.5 h-3.5 text-neutral-500" /> OR COMPILER RAW TRANSCRIPT TEXT DIRECTLY
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[8.5px] font-mono font-black text-neutral-400 uppercase tracking-widest">PASTE DIRECT DIALOGUE TRANSPORTS:</span>
                            <button
                              type="button"
                              onClick={() => setIsPasting(false)}
                              className="text-[9px] font-mono font-bold text-rose-500 hover:text-rose-400 cursor-pointer uppercase"
                            >
                              DISMISS
                            </button>
                          </div>
                          <textarea
                            value={pasteContent}
                            onChange={(e) => {
                              setPasteContent(e.target.value)
                              setSessionName("Pasted CONVERSATION Matrix");
                            }}
                            placeholder="[10/06/2026, 14:15] Sarah: Ship the release updates! 👍&#10;[10/06/2026, 14:16] Joe: Local sandboxing is online."
                            rows={3}
                            className="w-full bg-black border border-neutral-800 rounded-lg p-2.5 text-[10px] font-mono text-neutral-300 focus:border-[#bfff00] focus:outline-none transition-all placeholder-neutral-750 placeholder:text-neutral-700"
                          />
                        </div>
                      )}
                    </div>

                    {/* Master Action Trigger */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end pt-1">
                      <div className="md:col-span-2 space-y-1.5">
                        <Label htmlFor="session-name" className="text-[8.5px] font-mono text-neutral-500 uppercase tracking-widest font-black">
                          Active Sandbox Profile Identifier Name
                        </Label>
                        <Input 
                          id="session-name"
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                          className="bg-black border-neutral-800 text-xs text-white focus-visible:ring-[#bfff00] focus-visible:ring-offset-0 placeholder:text-neutral-600 rounded-lg h-9"
                          placeholder="e.g. My Workspace Session"
                        />
                      </div>
                      <Button 
                        type="submit"
                        disabled={isSimulating}
                        className="w-full bg-[#bfff00] hover:bg-[#b0eb03] text-black font-black font-mono text-[10.5px] tracking-widest uppercase h-9 transition-all rounded-lg cursor-pointer shadow-lg hover:shadow-[0_0_15px_rgba(191,255,0,0.3)] duration-300"
                      >
                        {isSimulating ? "PARSING LOGS..." : "EXECUTE PORTAL PROCESS"}
                      </Button>
                    </div>
                  </form>

                  {/* Simulator terminal output preview */}
                  <div className="bg-black border border-neutral-900 rounded-lg p-4 font-mono text-[11px] text-neutral-400 min-h-[140px] flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-neutral-500 text-[10px] border-b border-neutral-950 pb-2 mb-2">
                        <Terminal className="w-3.5 h-3.5 text-[#bfff00]" />
                        <span>LOCAL CRYPTON CORE LOG STREAM</span>
                      </div>

                      {simulationStep >= 0 && (
                        <p className="text-neutral-500 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#bfff00]/80" />
                          <span>Initialized secure memory container relative to workspace.</span>
                        </p>
                      )}

                      {simulationStep >= 1 && (
                        <p className="text-[#bfff00] flex items-center gap-1.5 animate-pulse">
                          <Cpu className="w-3.5 h-3.5 animate-spin" />
                          <span>Parsing conversation vectors for [{sessionName}]...</span>
                        </p>
                      )}

                      {simulationStep >= 2 && (
                        <p className="text-amber-400 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 animate-pulse" />
                          <span>Optimizing matrix dialogue lines & tracking participants index mappings...</span>
                        </p>
                      )}

                      {simulationStep >= 3 && (
                        <p className="text-emerald-400 flex items-center gap-1.5 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Success: Sandbox trace verified. Initializing secure client workspace dashboard!</span>
                        </p>
                      )}
                    </div>

                    <div className="text-[9px] text-neutral-600 border-t border-neutral-950 pt-2 flex justify-between items-center uppercase mt-3">
                      <span>Secure Container Cryptography Pipeline</span>
                      <span className="font-bold text-[#bfff00]">
                        {simulationStep === 0 && "IDLE"}
                        {simulationStep === 1 && "SCANNING"}
                        {simulationStep === 2 && "INDEXING"}
                        {simulationStep === 3 && "PIPELINE LOADED"}
                      </span>
                    </div>
                  </div>

                  {/* Internal file level error diagnostics banner */}
                  {errorText && (
                    <div className="bg-[#1c080a] border border-rose-950 text-rose-300 text-[10px] font-mono p-3 leading-normal rounded text-center">
                      <p className="font-bold text-[#ff3352] uppercase tracking-wider text-[11px] mb-1">⚠️ INGESTION SPECIFICATION EXCEPTION</p>
                      <p className="text-neutral-400">{errorText}</p>
                    </div>
                  )}

                </TabsContent>

                {/* TAB 2: WORKSPACE SETTINGS */}
                <TabsContent value="workspace" className="space-y-4 outline-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-850 space-y-2">
                      <span className="block text-[9px] font-mono font-black text-neutral-400 uppercase tracking-widest">
                        METRICS SAMPLING RATE
                      </span>
                      <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                        Adjust timeline metadata parse size. Default configuration executes standard recursion over 4,096 byte chunks.
                      </p>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="text-[10px] bg-black border-neutral-800 text-neutral-350 font-mono py-1 rounded-md h-8 active:border-[#bfff00] focus:border-[#bfff00] cursor-pointer">
                          4096 BYTE
                        </Button>
                        <Button variant="outline" size="sm" className="text-[10px] bg-black border-neutral-800 text-neutral-500 font-mono py-1 rounded-md h-8 cursor-pointer">
                          8192 BYTE
                        </Button>
                      </div>
                    </div>

                    <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-850 space-y-2">
                      <span className="block text-[9px] font-mono font-black text-neutral-400 uppercase tracking-widest">
                        OFF-GRID CRYPTO LOCK
                      </span>
                      <p className="text-xs text-neutral-400 font-sans leading-relaxed">
                        Encrypt all parsed buffers using in-browser AES-GCM before saving to client-side localStorage.
                      </p>
                      <div className="flex items-center gap-2 pt-2 text-[#bfff00] font-mono text-[10px]">
                        <ShieldCheck className="w-4 h-4" />
                        <span>AES-GCM-256 ACTIVE ON CLIENT</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Feature Grid / Core Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="space-y-2">
              <span className="text-xl font-mono text-[#bfff00] font-black block">01</span>
              <h3 className="text-sm font-black uppercase text-white font-display">Fast compilation</h3>
              <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                Parse long strings of exported WhatsApp or Slack dialogues in milliseconds directly in your browser.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xl font-mono text-[#bfff00] font-black block">02</span>
              <h3 className="text-sm font-black uppercase text-white font-display">Perfect Privacy</h3>
              <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                Your data is parsed, stored, and compiled entirely on-device. Zero metrics ever exit your machine.
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-xl font-mono text-[#bfff00] font-black block">03</span>
              <h3 className="text-sm font-black uppercase text-white font-display">Spotlight Deck</h3>
              <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                Beautiful spotlight shadows highlight critical initiatives and action items for rapid group summary review.
              </p>
            </div>
          </div>
        </div>
      </TracingBeam>
    </div>
  )
}

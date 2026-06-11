# 🚀 ChatReader AI — Forensic Dialogue Analytics & Intelligence System

**ChatReader AI** is a definitive, secure, and hyper-powerful multi-channel dialogue log analytics platform. Designed to read, parse, visualize, and analyze massive exported chat records (WhatsApp, Instagram, and general dialogue logs), it delivers a suite of cognitive forensic insights, conversational timelines, dynamic sentiment matrices, and custom role playgrounds. 

Built on a cutting-edge full-stack layout, the application pairs an immersive, pixel-perfect ambient design with robust server-side processing capabilities that leverage premium Gemini models or complete, air-gapped offline local LLMs (via Ollama).

---

## ⚙️ Core Capabilities & Major Technologies

### 1️⃣ Unlimited Message Chunking & Consensus Synthesis
Unlike standard log parsers limited by model token boundaries, ChatReader incorporates an automated, multi-threaded text chunker:
* **Large Log Ingestion**: Conversational exports are segmented into chunks of **2,000 messages**.
* **Parallel Core Execution**: Chunked threads are executed concurrently on the server layer, throttled safely via a concurrency controller (`p-limit` restricted to max 3 concurrent workers) to protect your rate limits.
* **Consensus Synthesizer-Reducer**: A final higher-order synthesis pass fuses individual chunk outputs into a single cohesive, contextual analysis report without data or continuity gaps. Handles logs with over **100,000+ messages** seamlessly!

### 2️⃣ Dual-Engine LLM Core (Gemini SDK & Ollama Bypass)
ChatReader AI operates with a resilient, network-adaptable intelligence backbone:
* **Google Gemini AI SDK**: Interfaced with the modern, official `@google/genai` TypeScript client. Implements aggressive fallback cascades (`gemini-3.5-flash` ➡️ `gemini-3.1-flash-lite` ➡️ `gemini-flash-latest`) to secure high availability during service spikes.
* **Ollama Offline Co-Processor**: A fully client-controlled checkbox completely bypasses outbound API calls. When toggled, the Express server proxies requests to your local model container (such as Mistral or Llama2 running at `http://localhost:11434`), ensuring maximum data privacy and making the app **fully operational air-gapped**.

### 3️⃣ Real-Time Engagement & Sentiment Matrix
An integrated sentiment-profiling framework compiles dialogue emotions:
* **Dual-Layer Analysis**: Runs recursive keyword-based scoring over high-frequency exchanges.
* **Interactive Aggregations**: Features high-contrast, beautiful sentiment distribution bar charts (visualizing positive, neutral, and negative dynamics).
* **Per-Sender Distribution Profiles**: Allows analytical deep-dives into specific speaker attitudes, showcasing who contributed to positivity or drove negative interactions.

### 4️⃣ Hyper-Focused Custom Prompts Playground
An expandable, professional forensic playground that goes far beyond simple summaries:
* **System Persona Overrides**: Profile the exchange through custom analytical lenses (e.g., *Forensic Profiler, Joint Coordinating Officers, Executive Account, Family Counselor*).
* **Tailored Extraction Rules**: Let users prompt custom inquiries regarding deep logs while passing automated history-trimmed contexts.

### 5️⃣ Automated Parsing & Dialog Extractors
* **10+ Regional Handlers**: `parser.ts` safely parses over 10 distinct timestamp variations, standardizing mixed GMT formats, European formats, and AM/PM variants.
* **Thread Extractions**: Dynamically intercepts bracket constructs such as `(Replying to sender)` or inline media payloads, isolating conversational thread states from system announcements.

### 6️⃣ Premium High-Contrast Visual Architecture
ChatReader AI utilizes a beautiful, context-dense dark ambient aesthetic built for advanced desktop analytics:
* **Tailwind CSS v4 & Modern Visuals**: Rich, fluid grid aesthetics lined with dynamic elements like **RetroGrid**, **GlowyWavesHero**, and animated **DotPattern** elements.
* **Fluid Dynamics**: Polished transitions and modal overlays built on TOP of **Framer Motion** & **Radix-UI** primitives.
* **Visual Narrative Features**: Interactive multi-tab widgets that separate overall summaries, action trackers, participant breakdowns, and custom chat engines.

---

## 📂 Project Architecture

```directory
ChatReader/
├── ⚙️ server.ts                # Full-Stack Express Server (Chunking, fallbacks, Ollama proxy, Gemini bindings)
├── 📦 package.json             # Build specifications & dependency tree
├── 🖼️ index.html               # Multi-framework client orchestrator
├── 🎨 Components/              # Custom UI Component Architecture
│   └── ui/                     # Visual design kit & Tailwind-optimized UI components (e.g., buttons, grids, patterns)
└── 💻 src/
    ├── App.tsx                 # Core Single-Page React Application
    ├── types.ts                # Strict TypeScript Interface Declarations
    ├── components/             # High-Fidelity modular React layout modules
    │   ├── Dashboard.tsx       # Core timeline filter, log search, and diagnostic statistics
    │   ├── AiSummarizer.tsx    # Synthesis dashboard, Custom Playgrounds, and Q&A boxes
    │   ├── ChatViewer.tsx      # High-density dialogue visualizer (supports search highlights)
    │   ├── ChatbookCreator.tsx # Dynamic book cover, naming, and publishing studio
    │   └── ExportButton.tsx    # Multi-format renderer (PDF, interactive ZIP file, markdown logs)
    └── utils/
        ├── parser.ts           # Recursive regex date resolver & dialogue thread assembler
        └── sampleData.ts       # Secure demonstration transcript for immediate offline trials
```

---

## 🔌 API Endpoints Schema

The application is engineered as a robust backend-proxied framework, protecting sensitive API keys from browser inspection.

### 📥 POST `/api/ai/summarize`
Synthesizes dialogues on three targeted, structural summary tracks.
* **Payload Structure**:
  ```ts
  {
    messages: LogMessage[];
    selectedMode: 'general' | 'situation' | 'action-items';
    useLocalModel: boolean;
  }
  ```
* **Behavior**: If messages count exceeds 2,000, parallelizes requests using `p-limit` and executes a synthesis pass over the parts.

### 📥 POST `/api/ai/sentiment`
Analyzes raw logs to compute metrics of sentiment.
* **Returns**:
  ```yaml
  total: 4122
  positive: 1542
  neutral: 2011
  negative: 569
  perSender:
    "John Doe": { positive: 921, neutral: 120, negative: 12 }
    "Jane Smith": { positive: 621, neutral: 1891, negative: 557 }
  ```

### 📥 POST `/api/ai/custom-prompt`
Fires customizable system prompts with custom system overrides over a trimmed log context segment.
* **Payload Structure**:
  ```ts
  {
    messages: LogMessage[];
    customPrompt: string;
    systemInstruction?: string;
    useLocalModel?: boolean;
  }
  ```

### 📥 POST `/api/ai/ask`
A Q&A chat layer that reads logs and retrieves explicit, honest text references.

---

## 🛠️ Step-by-Step Setup

### Pre-requisites
1. **Node.js**: Standard active LTS release (v18+).
2. **Ollama (Optional, for offline analysis)**: [Download Ollama](https://ollama.com) and start a local model of your choice:
   ```bash
   ollama run mistral
   ```

### 1️⃣ Installation
Clone and jump into the workspace, then spin up the packages dependency tree:
```bash
npm install
```

### 2️⃣ Configuration
Configure environment variables using `.env.example` as a baseline:
```bash
cp .env.example .env
```
Provide your private keys in `.env`:
```env
# Google Gemini Credentials (Server-hide format)
GEMINI_API_KEY=your_gemini_api_key_here

# Local Offline Co-processors (Default endpoints)
OLLAMA_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=mistral
```

### 3️⃣ Running the Application Local
To run the full-stack development environment (powered by hot Express modules & local server processes):
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4️⃣ Production Ingress Bundling
To compile the entire codebase into a CJS standalone distribution optimized to run cleanly behind Nginx proxies or serverless Cloud instances:
```bash
npm run build
npm start
```

---

## 📝 Parsing Exports — Quick Guide

To import your chat threads directly into the analyzer:
1. **WhatsApp**: Go to any chat ➡️ tap Options ➡️ **More** ➡️ **Export Chat** ➡️ Select **Without Media**. Upload the resulting `.txt` file directly into ChatReader AI.
2. **Instagram**: Request your JSON data dump via Meta Privacy Account Centre, or copy-paste dialogue text selections directly into ChatReader's text-input parser layout.
3. **Custom LOGs**: Supports raw `.txt` transcript lines following standard syntax patterns:
   ```txt
   [10/06/2026, 17:09:12] Sender Name: This is a beautiful dialogue log entry!
   ```

---

*Engineered with 💜 for advanced forensic diagnostics, maximum data privacy, and conversational intelligence.*

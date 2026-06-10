import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import pLimit from 'p-limit';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing for large payloads (up to 50mb now!)
app.use(express.json({ limit: '50mb' }));

// Helper to lazy-initialize the `@google/genai` client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY environment variable is not set. Please add it via the Secrets panel in the Settings menu of AI Studio to enable chat analysis.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Ollama Local Fallback
async function callOllamaFallback(prompt: string, systemInstruction: string): Promise<string> {
  try {
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
    const model = process.env.OLLAMA_MODEL || 'mistral';
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${systemInstruction}\n\n${prompt}`,
        stream: false,
      }),
    });
    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }
    const data = await response.json();
    return data.response;
  } catch (error) {
    throw new Error(`Ollama fallback unavailable: ${error}`);
  }
}

// Message Chunking for Large Conversations
interface LogMessage {
  sender: string;
  content: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

function chunkMessages(messages: LogMessage[], chunkSize: number = 1500): LogMessage[][] {
  const chunks: LogMessage[][] = [];
  for (let i = 0; i < messages.length; i += chunkSize) {
    chunks.push(messages.slice(i, i + chunkSize));
  }
  return chunks;
}

function preprocessChatContent(messages: LogMessage[]): string {
  if (!messages || messages.length === 0) return 'No messages available.';
  return messages
    .map((msg) => {
      const simplifiedTime = msg.timestamp ? msg.timestamp.split('T')[0] : '';
      const sentiment = msg.sentiment ? ` [${msg.sentiment.toUpperCase()}]` : '';
      return `[${simplifiedTime}] ${msg.sender || 'Unknown'}${sentiment}: ${msg.content || ''}`;
    })
    .join('\n');
}

// Simple rule-based sentiment analysis
function analyzeSentiment(content: string): 'positive' | 'neutral' | 'negative' {
  const positiveKeywords = ['great', 'love', 'awesome', 'perfect', 'excellent', '😊', '😍', '🎉', '❤️', 'thanks', 'thank you', 'happy', 'glad'];
  const negativeKeywords = ['bad', 'hate', 'awful', 'terrible', 'angry', '😡', '😢', '💔', '😭', 'sorry', 'apology', 'sad', 'disappointed'];
  const lowerContent = content.toLowerCase();
  const posCount = positiveKeywords.filter(kw => lowerContent.includes(kw)).length;
  const negCount = negativeKeywords.filter(kw => lowerContent.includes(kw)).length;
  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
}

function formatGeminiError(error: any): string {
  const errorMsg = typeof error === 'object' && error !== null 
    ? (error.message || JSON.stringify(error)) 
    : String(error);
  
  if (
    errorMsg.includes('RESOURCE_EXHAUSTED') || 
    errorMsg.includes('quota') || 
    errorMsg.includes('429') ||
    error.status === 'RESOURCE_EXHAUSTED' ||
    error.statusCode === 429
  ) {
    return 'The free tier Gemini API request quota has been exceeded. Please wait a moment or go to Settings > Secrets in the top-right of the Google AI Studio page to provide your own GEMINI_API_KEY for unlimited, faster analysis.';
  }
  
  if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('invalid api key')) {
    return 'The provided GEMINI_API_KEY is invalid. Please double-check the key in the Settings > Secrets panel of Google AI Studio.';
  }

  if (
    errorMsg.includes('503') || 
    errorMsg.includes('UNAVAILABLE') || 
    errorMsg.includes('temporary high demand') || 
    errorMsg.includes('high demand') ||
    error.status === 'UNAVAILABLE' ||
    error.statusCode === 503
  ) {
    return 'Gemini models are currently experiencing high peak demand (503 Service Unavailable). Spikes in demand are usually temporary. Please click "RE-CALCULATE" in a few seconds to retry, or toggle the "Ollama Local Bypass Engine" if you have Ollama active locally.';
  }

  if (
    errorMsg.includes('TypeError: fetch failed') || 
    errorMsg.includes('fetch failed') ||
    errorMsg.includes('Ollama fallback unavailable')
  ) {
    return 'The local Ollama bypass engine is unable to connect to your local Ollama server (fetch failed). Please make sure you have Ollama installed, running on your computer at http://localhost:11434 (e.g. by running "ollama run mistral" or "ollama run llama2" in your developer terminal) before enabling offline local mode.';
  }
  
  return errorMsg;
}

// Retry utility with Exponential Backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const waitTime = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError;
}

// Keep track of rate-limited models globally on the server to prevent parallel requests from all hitting the same 429s
const rateLimitedModels = new Map<string, number>(); // model name -> timestamp
const RATE_LIMIT_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown before trying a rate-limited model again

// Model fallback helper to guard against 503 (temporary high demand) and other error types
async function generateContentWithFallback(
  ai: any,
  params: {
    contents: any;
    config?: any;
  }
): Promise<any> {
  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest'
  ];
  let lastError: any;
  const now = Date.now();

  // Filter out any models that recently hit rate limits (429)
  let activeModels = modelsToTry.filter(model => {
    const limitedAt = rateLimitedModels.get(model);
    if (limitedAt && now - limitedAt < RATE_LIMIT_COOLDOWN_MS) {
      console.log(`[ChatReader Server] Skipping ${model} due to active 429 quota cooldown.`);
      return false;
    }
    return true;
  });

  // Fall back to trying all of them if they are all marked, just in case
  if (activeModels.length === 0) {
    activeModels = modelsToTry;
  }

  for (const model of activeModels) {
    try {
      console.log(`[ChatReader Server] Attempting generation with model: ${model}`);
      const response = await retryWithBackoff(async () => {
        return await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
      }, 1, 800);

      if (response && response.text) {
        return response;
      }
    } catch (err: any) {
      lastError = err;
      const errMsg = err.message || JSON.stringify(err) || String(err);
      console.warn(`[ChatReader Server] Model ${model} failed:`, errMsg);

      // Track if it's a rate limit / quota exceeded error
      if (
        errMsg.includes('RESOURCE_EXHAUSTED') || 
        errMsg.includes('quota') || 
        errMsg.includes('429') ||
        err.status === 'RESOURCE_EXHAUSTED' ||
        err.statusCode === 429
      ) {
        console.log(`[ChatReader Server] Registering 429 rate limit cooldown for: ${model}`);
        rateLimitedModels.set(model, Date.now());
      }

      // If key is invalid or something that fallback won't help with, throw immediately
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('invalid api key')) {
        throw err;
      }
    }
  }

  throw lastError;
}

// Parallel chunked analysis
async function analyzeChunksInParallel(
  chunks: LogMessage[][],
  mode: string,
  useOllama: boolean = false
): Promise<string[]> {
  const limit = pLimit(3); // Max 3 concurrent requests
  
  const tasks = chunks.map((chunk, idx) =>
    limit(async () => {
      const transcript = preprocessChatContent(chunk);
      let prompt = '';
      let systemInstruction = '';
      
      if (mode === 'situation') {
        systemInstruction = 'You are an advanced conversational and situational analyst.';
        prompt = `Analyze this chat excerpt (part ${idx + 1}). Focus on:\n\n${transcript}\n\nProvide a brief situational summary.`;
      } else if (mode === 'action-items') {
        systemInstruction = 'You are a task extraction engine.';
        prompt = `Extract action items from this chat excerpt (part ${idx + 1}):\n\n${transcript}`;
      } else {
        systemInstruction = 'You are an expert conversational intelligence engine.';
        prompt = `Summarize this chat excerpt (part ${idx + 1}):\n\n${transcript}`;
      }
      
      try {
        if (useOllama) {
          return await callOllamaFallback(prompt, systemInstruction);
        } else {
          const ai = getGeminiClient();
          const response = await generateContentWithFallback(ai, {
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          });
          if (!response || !response.text) {
            throw new Error('Empty response received from Gemini model.');
          }
          return response.text;
        }
      } catch (error: any) {
        console.error(`Error analyzing chunk ${idx + 1}:`, error);
        throw error;
      }
    })
  );
  return Promise.all(tasks);
}

// API Endpoints
app.post('/api/ai/summarize', async (req, res) => {
  try {
    let { messages, selectedMode, useLocalModel } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing chat messages array.' });
    }
    
    // Add sentiment analysis to each message
    const messagesWithSentiment: LogMessage[] = messages.map((m: LogMessage) => ({
      ...m,
      sentiment: analyzeSentiment(m.content),
    }));
    
    // Chunk messages for large conversations
    const chunks = chunkMessages(messagesWithSentiment, 2000);
    console.log(`Processing ${messages.length} messages in ${chunks.length} chunks`);
    
    // If only one chunk, use the original fast path (unless local model is forced)
    if (chunks.length === 1) {
      if (useLocalModel) {
        const transcript = preprocessChatContent(messagesWithSentiment);
        let systemInstruction = '';
        let userPrompt = '';
        if (selectedMode === 'situation') {
          systemInstruction = 'You are an advanced conversational and situational analyst.';
          userPrompt = `Analyze this chat excerpt:\n\n${transcript}\n\nProvide a brief situational summary.`;
        } else if (selectedMode === 'action-items') {
          systemInstruction = 'You are a task extraction engine.';
          userPrompt = `Extract action items from this chat:\n\n${transcript}`;
        } else {
          systemInstruction = 'You are an expert conversational intelligence engine.';
          userPrompt = `Summarize this chat:\n\n${transcript}`;
        }
        const localOutput = await callOllamaFallback(userPrompt, systemInstruction);
        return res.json({ output: localOutput });
      } else {
        // Normal Gemini call
        const ai = getGeminiClient();
        const transcript = preprocessChatContent(messagesWithSentiment);
        
        let systemInstruction = '';
        let userPrompt = '';
        if (selectedMode === 'situation') {
          systemInstruction = 'You are an advanced conversational and situational analyst.';
          userPrompt = `Below is a chat session dialogue log. Read through the messages and compile a highly detailed situational analysis. Highlight any real-world conflicts, joint coordination initiatives, emotional alignments, and potential unstated patterns.

Structure your report into these specific scannable sections:
### 📁 THE SITUATION EXPLAINED
Explain the true backdrop situation playing out in 2-3 strong paragraphs. Describe the timeline stakes, joint constraints, or main projects involved.

### 🤝 PARTICIPANT STANDINGS & ATTITUDES
Detail each key speaker's mental model, emotional tone, attitude, and their alignment or pushback on central events.

### 🔍 ESCALATIONS & UNRESOLVED ITEMS
Highlight critical outstanding questions, pending logistics, disputes, or missing information.

Here is the dialogue log:
\"\"\"
${transcript}
\"\"\"`;
        } else if (selectedMode === 'action-items') {
          systemInstruction = 'You are a task extraction engine.';
          userPrompt = `Review this chat dialogue log and extract clear action items, committed timelines, shared duties, and meeting arrangements mentioned by the participants.

Structure your response with:
### ⚡ TASK BOARD & ACTION ITEMS
- List direct tasks with who committed to them. Bold the owner's name. Use checkbox lists representation like - [ ] task.

### 📅 CALENDAR COMMITMENTS & MILESTONES
- Highlighting specific dates, times, dinner commitments, or meetings that were agreed or requested.

### 📣 UNOFFICIAL AGREEMENTS & DEALS
- Mention implicit agreements, compromises, or collaborative concessions made during the conversation.

Here is the dialogue log:
\"\"\"
${transcript}
\"\"\"`;
        } else {
          systemInstruction = 'You are an expert conversational intelligence engine.';
          userPrompt = `Below is a chat session dialogue log. Provide a highly insightful, scannable general summary of the log.

Structure your response into these specific sections:
### 🚨 CORE DISCUSSION BACKLOG
Write a concise, high-impact summary of what this entire chat is mostly about, overall tone, and any standout themes in 2-3 sentences.

### 💡 PRIMARY TOPICS & LOGISTICS
- List the main subjects discussed as key bullet points. Highlight why they were critical in a sentence.

### 📊 SPEAKER CONTRIBUTION INSIGHTS
- Note key speakers, what they mostly contributed, and their characteristic conversational tone.

Here is the dialogue log:
\"\"\"
${transcript}
\"\"\"`;
        }
        
        const response = await generateContentWithFallback(ai, {
          contents: userPrompt,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });
        if (!response || !response.text) {
          throw new Error('Empty response received from Gemini model.');
        }
        return res.json({ output: response.text });
      }
    } else {
      // Multi-chunk analysis
      const chunkResults = await analyzeChunksInParallel(chunks, selectedMode, useLocalModel);
      
      const combinedPrompt = `You are synthesizing multiple analytical summaries of a large conversation split into ${chunks.length} parts.
 
Here are the summaries from each part:
${chunkResults.map((result, i) => `[PART ${i + 1}]\n${result}`).join('\n\n---\n\n')}
 
Now synthesize these into a single, cohesive final analysis using the original structure for mode: "${selectedMode}". Make sure the final output is comprehensive and highlights key patterns across all parts.`;
 
      if (useLocalModel) {
        const localSynthesis = await callOllamaFallback(combinedPrompt, 'You are an expert at synthesizing multiple analyses into coherent summaries.');
        return res.json({ output: localSynthesis });
      } else {
        const ai = getGeminiClient();
        const finalResponse = await generateContentWithFallback(ai, {
          contents: combinedPrompt,
          config: {
            systemInstruction: 'You are an expert at synthesizing multiple analyses into coherent summaries.',
            temperature: 0.3,
          },
        });
        if (!finalResponse || !finalResponse.text) {
          throw new Error('Empty response from synthesis.');
        }
        return res.json({ output: finalResponse.text });
      }
    }
  } catch (error: any) {
    console.error('Error in /api/ai/summarize:', error);
    res.status(500).json({ error: formatGeminiError(error) });
  }
});

app.post('/api/ai/ask', async (req, res) => {
  try {
    let { messages, question, useLocalModel } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing chat messages array.' });
    }
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Missing question string.' });
    }
    
    const messagesWithSentiment: LogMessage[] = messages.map((m: LogMessage) => ({
      ...m,
      sentiment: analyzeSentiment(m.content),
    }));
    
    const chunks = chunkMessages(messagesWithSentiment, 3000);
    let transcript = '';
    if (chunks.length === 1) {
      transcript = preprocessChatContent(messagesWithSentiment);
    } else {
      console.log(`Q&A: Processing ${messagesWithSentiment.length} messages inside chunks`);
      transcript = preprocessChatContent(messagesWithSentiment.slice(-3000)); // Use last 3000 for relevance
    }
    
    const userPrompt = `Below is an extracted chat dialogue log with sentiment annotations.
Answer the following user question based on the events, expressions, and statements inside the log:
"${question}"

Provide an accurate, honest, and elegant response in standard Markdown. If the logs are silent or lack context to answer the question, state that clearly but suggest the closest matching dynamic or what alternative topics were discussed.

Dialogue log:
"""
${transcript}
"""`;
    
    if (useLocalModel) {
      const ollamaResponse = await callOllamaFallback(userPrompt, 'You are an intelligent dialogue analytics companion named ChatReader AI.');
      return res.json({ output: ollamaResponse });
    } else {
      const ai = getGeminiClient();
      const response = await generateContentWithFallback(ai, {
        contents: userPrompt,
        config: {
          systemInstruction: 'You are an intelligent dialogue analytics companion named ChatReader AI.',
          temperature: 0.5,
        },
      });
      if (!response || !response.text) {
        throw new Error('Empty response received from Gemini model.');
      }
      return res.json({ output: response.text });
    }
  } catch (error: any) {
    console.error('Error in /api/ai/ask:', error);
    res.status(500).json({ error: formatGeminiError(error) });
  }
});

app.post('/api/ai/custom-prompt', async (req, res) => {
  try {
    const { messages, customPrompt, systemInstruction, useLocalModel } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing chat messages array.' });
    }
    if (!customPrompt || typeof customPrompt !== 'string') {
      return res.status(400).json({ error: 'Missing custom prompt.' });
    }
    const messagesWithSentiment: LogMessage[] = messages.map((m: LogMessage) => ({
      ...m,
      sentiment: analyzeSentiment(m.content),
    }));
    const transcript = preprocessChatContent(messagesWithSentiment.slice(-2000));
    const finalPrompt = `${customPrompt}\n\nDialogue log:\n\"\"\"\n${transcript}\n\"\"\"`;
    
    if (useLocalModel) {
      const ollamaResponse = await callOllamaFallback(finalPrompt, systemInstruction || 'You are an expert dialogue analyst.');
      return res.json({ output: ollamaResponse });
    } else {
      const ai = getGeminiClient();
      const response = await generateContentWithFallback(ai, {
        contents: finalPrompt,
        config: {
          systemInstruction: systemInstruction || 'You are an expert dialogue analyst.',
          temperature: 0.5,
        },
      });
      if (!response || !response.text) {
        throw new Error('Empty response received from Gemini model.');
      }
      return res.json({ output: response.text });
    }
  } catch (error: any) {
    console.error('Error in /api/ai/custom-prompt:', error);
    res.status(500).json({ error: formatGeminiError(error) });
  }
});

app.post('/api/ai/sentiment', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing chat messages array.' });
    }
    const sentimentData = messages.map((m: LogMessage) => ({
      sender: m.sender,
      sentiment: analyzeSentiment(m.content),
      content: m.content.substring(0, 100),
    }));
    const summary = {
      total: sentimentData.length,
      positive: sentimentData.filter(d => d.sentiment === 'positive').length,
      neutral: sentimentData.filter(d => d.sentiment === 'neutral').length,
      negative: sentimentData.filter(d => d.sentiment === 'negative').length,
      perSender: {} as Record<string, { positive: number; neutral: number; negative: number }>,
    };
    sentimentData.forEach(d => {
      if (!summary.perSender[d.sender]) {
        summary.perSender[d.sender] = { positive: 0, neutral: 0, negative: 0 };
      }
      summary.perSender[d.sender][d.sentiment]++;
    });
    res.json(summary);
  } catch (error: any) {
    console.error('Error in /api/ai/sentiment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Configure Vite middleware or static serving
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ChatReader Server] Active on port ${PORT}`);
    if (process.env.OLLAMA_URL) {
      console.log(`[ChatReader Server] Ollama fallback enabled: ${process.env.OLLAMA_URL}`);
    }
  });
}

bootstrap();

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChatMessage, ChatStats, ParticipantStats } from '../types';

// 1. EMOJI EXTRACTION
export function extractEmojis(text: string): string[] {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F900}-\u{1F9FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{2122}\u{2139}\u{00AE}\u{00A9}]/gu;
  return text.match(emojiRegex) || [];
}

// 2. ID GENERATION
function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// 3. TEXT CLEANING (Handle encoding issues)
export function cleanText(text: string): string {
  if (!text) return '';
  try {
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
}

// 4. ENHANCED ATTACHMENT PARSING
export interface AttachmentMetadata {
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document' | 'url' | 'sticker';
  fileSize?: number;
  mimeType?: string;
  localUrl?: string;
  description?: string;
}

function parseAttachment(content: string): AttachmentMetadata | null {
  // Image patterns
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg|heic)/i.test(content)) {
    const match = content.match(/([a-zA-Z0-9_\-\.]+\.(jpg|jpeg|png|gif|webp|bmp|svg|heic))/i);
    if (match) {
      return {
        fileName: match[1],
        fileType: 'image',
        mimeType: `image/${match[2].toLowerCase()}`,
      };
    }
  }

  // Video patterns
  if (/\.(mp4|mov|mkv|webm|avi|flv|m4v|3gp)/i.test(content)) {
    const match = content.match(/([a-zA-Z0-9_\-\.]+\.(mp4|mov|mkv|webm|avi|flv|m4v|3gp))/i);
    if (match) {
      return {
        fileName: match[1],
        fileType: 'video',
        mimeType: `video/${match[2].toLowerCase()}`,
      };
    }
  }

  // Audio patterns
  if (/\.(mp3|wav|m4a|aac|ogg|flac|opus|caf|amr)/i.test(content)) {
    const match = content.match(/([a-zA-Z0-9_\-\.]+\.(mp3|wav|m4a|aac|ogg|flac|opus|caf|amr))/i);
    if (match) {
      return {
        fileName: match[1],
        fileType: 'audio',
        mimeType: `audio/${match[2].toLowerCase()}`,
      };
    }
  }

  // Document patterns
  if (/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip)/i.test(content)) {
    const match = content.match(/([a-zA-Z0-9_\-\.]+\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip))/i);
    if (match) {
      return {
        fileName: match[1],
        fileType: 'document',
        mimeType: `application/${match[2].toLowerCase()}`,
      };
    }
  }

  // Sticker patterns (WhatsApp)
  if (/sticker|:sticker:/i.test(content)) {
    return {
      fileName: 'sticker.webp',
      fileType: 'sticker',
      mimeType: 'image/webp',
      description: 'WhatsApp sticker element'
    };
  }

  // URL detection
  const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
  if (urlMatch) {
    return {
      fileName: urlMatch[1].split('/').pop() || 'link',
      fileType: 'url',
      description: urlMatch[1],
    };
  }

  // WhatsApp generic attachment format
  if (/omitted|<media omitted>/i.test(content)) {
    return {
      fileName: 'media_omitted',
      fileType: 'document',
      description: 'Media was omitted in export',
    };
  }

  return null;
}

// 5. ADVANCED DATE PARSING
function parseDateParts(
  part1: string,
  part2: string,
  part3: string,
  hourStr: string,
  minuteStr: string,
  secondStr: string | undefined,
  ampmStr: string | undefined
): Date {
  let year = 2026;
  let month = 0;
  let day = 1;

  const p1 = parseInt(part1, 10);
  const p2 = parseInt(part2, 10);
  const p3 = parseInt(part3, 10);

  // Format detection
  if (part1.length === 4 || p1 > 31) {
    // YYYY/MM/DD or YYYY/DD/MM
    year = p1;
    month = p2 - 1;
    day = p3;
  } else if (part3.length === 4 || p3 > 31 || (part1.length <= 2 && part3.length === 2)) {
    // DD/MM/YY or MM/DD/YY or DD/MM/YYYY
    year = p3 < 100 ? p3 + 2000 : p3;

    if (p2 > 12) {
      // p2 is day, p1 is month (MM/DD/YY)
      month = p1 - 1;
      day = p2;
    } else if (p1 > 12) {
      // p1 is day, p2 is month (DD/MM/YY)
      month = p2 - 1;
      day = p1;
    } else {
      // Ambiguous: default to DD/MM/YYYY
      month = p2 - 1;
      day = p1;
    }
  } else {
    year = p3 < 100 ? p3 + 2000 : p3;
    month = p2 - 1;
    day = p1;
  }

  // Bounds check
  if (isNaN(year)) year = 2026;
  if (isNaN(month) || month < 0 || month > 11) month = 0;
  if (isNaN(day) || day < 1 || day > 31) day = 1;

  let hours = parseInt(hourStr, 10);
  if (isNaN(hours)) hours = 0;

  let minutes = parseInt(minuteStr, 10);
  if (isNaN(minutes)) minutes = 0;

  const seconds = secondStr ? parseInt(secondStr, 10) : 0;

  // AM/PM handling
  if (ampmStr) {
    const ampm = ampmStr.toLowerCase();
    if (ampm.includes('pm') && hours < 12) {
      hours += 12;
    } else if (ampm.includes('am') && hours === 12) {
      hours = 0;
    }
  }

  return new Date(year, month, day, hours, minutes, seconds);
}

// 6. WHATSAPP PARSER (ENHANCED WITH REPLIES AND UNLIMITED DEPTH ATTACHMENTS)
export function parseWhatsAppChat(text: string, mediaUrls: { [name: string]: string } = {}): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const lines = text.split(/\r?\n/);

  const tryParseTimestamp = (str: string): Date | null => {
    // Pattern 1: [DD/MM/YYYY, HH:MM:SS] or variations
    const tsPattern = /^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4}),?[\s\u202f\u00a0]*(\d{1,2}):(\d{2})(?::(\d{2}))?[\s\u202f\u00a0]*([aApP]\.?[mM]\.?)?$/;
    const match = str.match(tsPattern);
    if (match) {
      const [, p1, p2, p3, h, min, s, ampm] = match;
      const date = parseDateParts(p1, p2, p3, h, min, s, ampm);
      if (!isNaN(date.getTime())) return date;
    }

    // Pattern 2: Native parser fallback
    const sanitized = str
      .replace(/[\s\u202f\u00a0]+/g, ' ')
      .replace(/\bat\b/gi, '')
      .trim();
    const nativeDate = new Date(sanitized);
    if (!isNaN(nativeDate.getTime())) {
      return nativeDate;
    }

    return null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/[\u200b-\u200d\u200e\u200f\u202a-\u202e\ufeff\u202f]/g, '');
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    let date: Date | null = null;
    let sender = '';
    let content = '';
    let isSystem = false;
    let attachment: AttachmentMetadata | null = null;
    let replyTo: { id?: string; sender: string; content: string } | undefined;

    // Bracket format check: [Date, Time] Sender: Message
    if (trimmedLine.startsWith('[')) {
      const closingBracketIndex = trimmedLine.indexOf(']');
      if (closingBracketIndex > 5 && closingBracketIndex < 45) {
        const timestampStr = trimmedLine.substring(1, closingBracketIndex).trim();
        const parsedDate = tryParseTimestamp(timestampStr);

        if (parsedDate) {
          date = parsedDate;
          const afterTimestamp = trimmedLine.substring(closingBracketIndex + 1).trim();

          // Check for reply pattern
          if (afterTimestamp.includes('(Replying to') && afterTimestamp.includes(')')) {
            const replyMatch = afterTimestamp.match(/\(Replying to ([^)]+)\)/);
            if (replyMatch) {
              replyTo = {
                sender: replyMatch[1],
                content: 'Original message',
              };
              content = afterTimestamp.replace(/\(Replying to [^)]+\)/, '').trim();
            }
          }

          // System message check
          const systemKeywords = ['joined', 'left', 'added', 'removed', 'created', 'encrypted', 'beginning', 'disappearing', 'changed the message timer'];
          if (systemKeywords.some(kw => afterTimestamp.toLowerCase().includes(kw))) {
            isSystem = true;
            content = afterTimestamp;
          } else {
            // Regular message: extract sender and content
            const colonIndex = afterTimestamp.indexOf(':');
            if (colonIndex > 0) {
              sender = afterTimestamp.substring(0, colonIndex).trim();
              content = content || afterTimestamp.substring(colonIndex + 1).trim();
            } else {
              content = content || afterTimestamp;
            }
          }
        }
      }
    }

    // Android/Dash format check: Date, Time - Sender: Message
    if (!date) {
      const dashRegex = /[\s\u202f\u00a0]+[-–—][\s\u202f\u00a0]+/g;
      const dashMatches = [...trimmedLine.matchAll(dashRegex)];
      if (dashMatches.length > 0) {
        for (const matchInfo of dashMatches) {
          if (matchInfo.index !== undefined && matchInfo.index > 5 && matchInfo.index < 45) {
            const timestampStr = trimmedLine.substring(0, matchInfo.index).trim();
            const parsedDate = tryParseTimestamp(timestampStr);
            if (parsedDate) {
              date = parsedDate;
              const remainder = trimmedLine.substring(matchInfo.index + matchInfo[0].length).trim();
              
              // System message check
              const systemKeywords = ['joined', 'left', 'added', 'removed', 'created', 'encrypted', 'beginning', 'disappearing', 'changed code', 'updated message timer'];
              if (systemKeywords.some(kw => remainder.toLowerCase().includes(kw))) {
                isSystem = true;
                sender = 'System';
                content = remainder;
              } else {
                const firstColonIndex = remainder.indexOf(':');
                if (firstColonIndex > 0) {
                  sender = remainder.substring(0, firstColonIndex).trim();
                  content = remainder.substring(firstColonIndex + 1).trim();
                } else {
                  sender = 'System';
                  content = remainder;
                  isSystem = true;
                }
              }
              break;
            }
          }
        }
      }
    }

    // Double-check WhatsApp generic attachment format inside content
    if (content) {
      const parsedAttach = parseAttachment(content);
      if (parsedAttach) {
        attachment = parsedAttach;
      }
    }

    if (date) {
      const message: ChatMessage = {
        id: generateId(),
        timestamp: date,
        sender: sender || 'Unknown',
        content: content,
        isSystem: isSystem,
        emojis: extractEmojis(content),
        replyTo,
        attachment: attachment || undefined,
      };

      // Append continuation lines (multi-line messages)
      while (i + 1 < lines.length) {
        const nextLine = lines[i + 1].replace(/[\u200b-\u200d\u200e\u200f\u202a-\u202e\ufeff\u202f]/g, '').trim();
        
        // Stop if it's a new message starting with [ or starting with a digit/pattern
        if (nextLine.startsWith('[')) break;
        if (/^\d{1,4}[./-]\d{1,2}[./-]/.test(nextLine)) {
          // Double check if next line actually successfully parses as timestamp
          const commaIndex = nextLine.indexOf(',');
          const dashIndex = nextLine.search(/[\s\u202f\u00a0]+[-–—][\s\u202f\u00a0]+/);
          if (commaIndex > 0 || dashIndex > 0) {
            break;
          }
        }
        if (!nextLine) break;
        i++;
        message.content += '\n' + nextLine;
        message.emojis = extractEmojis(message.content);
        
        const nextAttach = parseAttachment(nextLine);
        if (nextAttach) {
          message.attachment = nextAttach;
        }
      }

      messages.push(message);
    }
  }

  // Pre-process reaction logs
  const reactionsProcessed: ChatMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (msg.isSystem) {
      reactionsProcessed.push(msg);
      continue;
    }

    const reactionMatch = msg.content.match(/^([\s\S]+?)\s+reacted\s+to(?:\s*:)?\s*["'\[]?([\s\S]*?)["']?$/i);
    if (reactionMatch) {
      const reactionEmojis = reactionMatch[1].trim();
      const targetRepresentation = reactionMatch[2].trim();

      let targetSender = '';
      let targetContent = targetRepresentation;

      const simpleMatch = targetRepresentation.match(/^([^:]+):\s*([\s\S]*)$/);
      if (simpleMatch) {
        targetSender = simpleMatch[1].trim();
        targetContent = simpleMatch[2].trim();
      }

      // Locate target message
      let bestMatch: ChatMessage | null = null;
      for (let j = reactionsProcessed.length - 1; j >= 0; j--) {
        const potentialMsg = reactionsProcessed[j];
        if (potentialMsg.isSystem) continue;

        if (targetSender && potentialMsg.sender.toLowerCase().trim() !== targetSender.toLowerCase().trim()) {
          continue;
        }

        const cleanPotential = potentialMsg.content.toLowerCase().replace(/[^\w]/g, '');
        const cleanTarget = targetContent.toLowerCase().replace(/[^\w]/g, '');

        if (cleanPotential.includes(cleanTarget) || cleanTarget.includes(cleanPotential)) {
          bestMatch = potentialMsg;
          break;
        }
      }

      if (bestMatch) {
        if (!bestMatch.reactions) {
          bestMatch.reactions = [];
        }
        const emojiToUse = extractEmojis(reactionEmojis)[0] || reactionEmojis;
        const existing = bestMatch.reactions.find(r => r.sender === msg.sender);
        if (existing) {
          existing.emoji = emojiToUse;
        } else {
          bestMatch.reactions.push({ sender: msg.sender, emoji: emojiToUse });
        }
      }
      continue;
    }
    reactionsProcessed.push(msg);
  }

  // Bind attachments before return
  const attachmentsBound = bindAttachments(reactionsProcessed, mediaUrls);
  return attachmentsBound;
}

// 7. INSTAGRAM PARSER
export function parseInstagramChat(text: string): ChatMessage[] {
  try {
    const data = JSON.parse(text);
    const messages: ChatMessage[] = [];
    const inputMessages = data.messages || [];

    for (let i = 0; i < inputMessages.length; i++) {
      const msg = inputMessages[i];
      const rawSender = msg.sender_name || 'Instagram User';
      const sender = cleanText(rawSender);
      const rawContent = msg.content || '';
      let content = cleanText(rawContent);

      let attachment: AttachmentMetadata | null = null;

      if (!content && msg.share) {
        content = `Shared a post: ${msg.share.link || ''} ${msg.share.share_text || ''}`;
        attachment = { fileName: 'shared_post', fileType: 'url', description: msg.share.link };
      } else if (!content && msg.photos) {
        content = `📷 Shared ${msg.photos.length} photo(s)`;
        attachment = { fileName: 'photos', fileType: 'image' };
      } else if (!content && (msg.videos || msg.gifs)) {
        content = `🎥 Shared a video/GIF`;
        attachment = { fileName: 'video', fileType: 'video' };
      } else if (!content && msg.audio_files) {
        content = `Voice Message`;
        attachment = { fileName: 'audio', fileType: 'audio' };
      }

      const date = new Date(msg.timestamp_ms || Date.now());

      messages.push({
        id: generateId(),
        timestamp: date,
        sender,
        content: content || '(Attachment file)',
        isSystem: false,
        emojis: extractEmojis(content),
        attachment: attachment || undefined,
      });
    }

    return messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  } catch (err) {
    console.error('Failed to parse Instagram DM Export:', err);
    throw new Error('Invalid Instagram JSON format. Make sure it has a "messages" array.');
  }
}

// 8. STATS CALCULATION
function analyzeSentimentClient(content: string): 'positive' | 'neutral' | 'negative' {
  const positiveKeywords = ['great', 'love', 'awesome', 'perfect', 'excellent', '😊', '😍', '🎉', '❤️', 'thanks', 'thank you', 'happy', 'glad', 'yay', 'haha', 'lmao', 'lol', 'beautiful', 'wonderful', 'cool', 'sweet'];
  const negativeKeywords = ['bad', 'hate', 'awful', 'terrible', 'angry', '😡', '😢', '💔', '😭', 'sorry', 'apology', 'sad', 'disappointed', 'sucks', 'fake', 'worst', 'stupid', 'annoyed'];
  const lowerContent = content.toLowerCase();
  const posCount = positiveKeywords.filter(kw => lowerContent.includes(kw)).length;
  const negCount = negativeKeywords.filter(kw => lowerContent.includes(kw)).length;
  if (negCount > posCount) return 'negative';
  if (posCount > negCount) return 'positive';
  return 'neutral';
}

export function calculateStats(messages: ChatMessage[]): ChatStats {
  const stats: ChatStats = {
    totalMessages: messages.length,
    totalWords: 0,
    totalCharacters: 0,
    totalEmojis: 0,
    participants: {},
    allEmojis: [],
    allWords: [],
    timeline: [],
    hourlyDistribution: Array(24).fill(0),
    dayOfWeekDistribution: Array(7).fill(0),
    dateRange: { start: null, end: null },
    peakHour: 0,
    peakDay: null,
  };

  if (messages.length === 0) return stats;

  const emojiMap: { [key: string]: number } = {};
  const wordMap: { [key: string]: number } = {};
  const dateMap: { [key: string]: number } = {};

  const stopwords = new Set([
    'the', 'a', 'to', 'and', 'i', 'of', 'in', 'is', 'that', 'it', 'you', 'was', 'for', 'on', 'are', 'as', 'with', 'his', 'they', "i'm",
    'at', 'be', 'this', 'have', 'from', 'or', 'one', 'had', 'by', 'word', 'but', 'not', 'what', 'all', 'were', 'we', 'when', 'your', 'can',
    'said', 'there', 'use', 'an', 'each', 'which', 'she', 'do', 'how', 'their', 'if', 'will', 'up', 'other', 'about', 'out', 'many', 'then',
    'them', 'these', 'so', 'some', 'her', 'would', 'make', 'like', 'him', 'into', 'time', 'has', 'look', 'two', 'more', 'write', 'go',
    'me', 'my', 'no', 'yes', 'ok', 'okay', 'good', 'just', 'get', 'am', 'omitted', 'media', 'attached', 'image', 'sticker',
    'audio', 'voice', 'video', 'document', 'pdf', 'docx', 'xlsx', 'txt', 'zip', 'message'
  ]);

  for (const msg of messages) {
    if (msg.isSystem) continue;

    const words = msg.content
      .toLowerCase()
      .replace(/[^\w\s']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const charCount = msg.content.length;
    stats.totalCharacters += charCount;
    stats.totalWords += words.length;
    stats.totalEmojis += msg.emojis.length;

    // Emojis
    msg.emojis.forEach(emoji => {
      emojiMap[emoji] = (emojiMap[emoji] || 0) + 1;
    });

    // Words
    words.forEach(word => {
      if (!stopwords.has(word) && word.match(/^[a-zA-Z]/)) {
        wordMap[word] = (wordMap[word] || 0) + 1;
      }
    });

    // Timeline
    const dateKey = msg.timestamp.toISOString().split('T')[0];
    dateMap[dateKey] = (dateMap[dateKey] || 0) + 1;

    // Hourly
    const hour = msg.timestamp.getHours();
    stats.hourlyDistribution[hour]++;

    // Day of week
    const day = msg.timestamp.getDay();
    stats.dayOfWeekDistribution[day]++;

    const isQuestion = msg.content.includes('?');
    const isLateNight = hour >= 22 || hour <= 4;
    const itemSentiment = msg.sentiment || analyzeSentimentClient(msg.content);

    // Per-participant
    if (!stats.participants[msg.sender]) {
      stats.participants[msg.sender] = {
        name: msg.sender,
        messageCount: 0,
        wordCount: 0,
        characterCount: 0,
        emojiCount: 0,
        emojis: {},
        hourlyDistribution: Array(24).fill(0),
        dayOfWeekDistribution: Array(7).fill(0),
        sentiment: { positive: 0, neutral: 0, negative: 0 },
        questionCount: 0,
        lateNightCount: 0,
      };
    }

    const participant = stats.participants[msg.sender];
    participant.messageCount++;
    participant.wordCount += words.length;
    participant.characterCount += charCount;
    participant.emojiCount += msg.emojis.length;
    participant.hourlyDistribution[hour]++;
    participant.dayOfWeekDistribution[day]++;
    participant.sentiment[itemSentiment]++;
    if (isQuestion) participant.questionCount++;
    if (isLateNight) participant.lateNightCount++;

    msg.emojis.forEach(emoji => {
      participant.emojis[emoji] = (participant.emojis[emoji] || 0) + 1;
    });
  }

  // Build final stats
  stats.allEmojis = Object.entries(emojiMap)
    .map(([emoji, count]) => ({ emoji, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  stats.allWords = Object.entries(wordMap)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 40);

  stats.timeline = Object.entries(dateMap)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Peak hour
  stats.peakHour = stats.hourlyDistribution.indexOf(Math.max(...stats.hourlyDistribution));

  // Date range
  if (messages.length > 0) {
    const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    stats.dateRange.start = sorted[0].timestamp;
    stats.dateRange.end = sorted[sorted.length - 1].timestamp;
  }

  // Peak day
  if (stats.timeline.length > 0) {
    stats.peakDay = stats.timeline.reduce((max, day) => 
      day.count > max.count ? day : max
    );
  }

  return stats;
}

// 9. ATTACHMENT BINDING (Experimental)
export function bindAttachments(
  messages: ChatMessage[],
  mediaUrls: { [key: string]: string }
): ChatMessage[] {
  return messages.map(msg => {
    if (msg.attachment && msg.attachment.fileName in mediaUrls) {
      return {
        ...msg,
        attachment: {
          ...msg.attachment,
          localUrl: mediaUrls[msg.attachment.fileName],
        },
      };
    }
    return msg;
  });
}

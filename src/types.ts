/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChatMessage {
  id: string;
  timestamp: Date;
  sender: string;
  content: string;
  isSystem: boolean;
  emojis: string[];
  replyTo?: {
    id?: string;
    sender: string;
    content: string;
  };
  attachment?: {
    fileName: string;
    localUrl?: string;
    fileType: 'image' | 'video' | 'audio' | 'document' | 'url' | 'sticker';
    fileSize?: number;
    mimeType?: string;
    description?: string;
  };
  sentiment?: 'positive' | 'neutral' | 'negative';
  reactions?: {
    sender: string;
    emoji: string;
  }[];
}

export interface ParticipantStats {
  name: string;
  messageCount: number;
  wordCount: number;
  characterCount: number;
  emojiCount: number;
  emojis: { [emoji: string]: number };
  hourlyDistribution: number[]; // array of size 24
  dayOfWeekDistribution: number[]; // array of size 7 (0-6)
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
  };
  questionCount: number;
  lateNightCount: number;
}

export interface ChatStats {
  totalMessages: number;
  totalWords: number;
  totalCharacters: number;
  totalEmojis: number;
  participants: { [name: string]: ParticipantStats };
  allEmojis: { emoji: string; count: number }[];
  allWords: { word: string; count: number }[];
  timeline: { date: string; count: number }[]; // daily count
  hourlyDistribution: number[]; // global 24 hr count
  dayOfWeekDistribution: number[]; // global 7 day count
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  peakHour: number;
  peakDay: { date: string; count: number } | null;
}

export type ChatSource = 'whatsapp' | 'instagram' | 'sample';

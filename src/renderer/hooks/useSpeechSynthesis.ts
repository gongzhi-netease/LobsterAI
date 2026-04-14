import { useCallback, useEffect, useRef, useState } from 'react';

export type SpeechStatus = 'idle' | 'playing' | 'paused';

/**
 * Strip Markdown syntax to produce plain text suitable for TTS.
 */
function stripMarkdown(text: string): string {
  return text
    // Remove code fences (```...```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`...`)
    .replace(/`[^`]*`/g, '')
    // Remove headings (#, ##, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic (**text**, *text*, __text__, _text_)
    .replace(/(\*{1,2}|_{1,2})(.*?)\1/g, '$2')
    // Remove strikethrough (~~text~~)
    .replace(/~~(.*?)~~/g, '$1')
    // Remove links [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove images ![alt](url)
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    // Remove blockquotes (> ...)
    .replace(/^>\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove list markers (-, *, +, 1.)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Collapse multiple blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface UseSpeechSynthesisOptions {
  /** Language hint (e.g. 'zh-CN', 'en-US'). Defaults to auto-detect. */
  lang?: string;
  /** Speech rate, 0.1 – 10. Default 1. */
  rate?: number;
  /** Pitch, 0 – 2. Default 1. */
  pitch?: number;
}

export interface UseSpeechSynthesisReturn {
  status: SpeechStatus;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSupported: boolean;
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): UseSpeechSynthesisReturn {
  const { rate = 1, pitch = 1 } = options;

  const [status, setStatus] = useState<SpeechStatus>('idle');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Cancel speech and clean up on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setStatus('idle');
  }, [isSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!isSupported) return;

      // Stop any ongoing speech first
      window.speechSynthesis.cancel();

      const plain = stripMarkdown(text);
      if (!plain) return;

      const utterance = new SpeechSynthesisUtterance(plain);
      utterance.rate = rate;
      utterance.pitch = pitch;

      // Auto-detect language: if text contains CJK characters, use zh-CN
      if (options.lang) {
        utterance.lang = options.lang;
      } else {
        const hasCJK = /[\u4e00-\u9fff\u3040-\u30ff]/.test(plain);
        utterance.lang = hasCJK ? 'zh-CN' : 'en-US';
      }

      utterance.onstart = () => setStatus('playing');
      utterance.onend = () => {
        utteranceRef.current = null;
        setStatus('idle');
      };
      utterance.onerror = (e) => {
        // 'interrupted' is expected when stop() is called explicitly; suppress it
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error('[useSpeechSynthesis] speech error:', e.error);
        }
        utteranceRef.current = null;
        setStatus('idle');
      };
      utterance.onpause = () => setStatus('paused');
      utterance.onresume = () => setStatus('playing');

      utteranceRef.current = utterance;
      setStatus('playing');
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, rate, pitch, options.lang]
  );

  const pause = useCallback(() => {
    if (!isSupported || status !== 'playing') return;
    window.speechSynthesis.pause();
  }, [isSupported, status]);

  const resume = useCallback(() => {
    if (!isSupported || status !== 'paused') return;
    window.speechSynthesis.resume();
  }, [isSupported, status]);

  return { status, speak, pause, resume, stop, isSupported };
}

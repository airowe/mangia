/**
 * useSpeech Hook
 *
 * Text-to-speech functionality for hands-free cooking mode.
 * Uses expo-speech for cross-platform TTS support.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';

export interface SpeechOptions {
  rate?: number; // 0.1 to 2.0, default 1.0
  pitch?: number; // 0.5 to 2.0, default 1.0
  language?: string; // e.g., 'en-US'
}

export interface UseSpeechReturn {
  speak: (text: string) => Promise<void>;
  stop: () => void;
  isSpeaking: boolean;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  isAvailable: boolean;
}

const DEFAULT_OPTIONS: SpeechOptions = {
  rate: 0.9, // Slightly slower for cooking instructions
  pitch: 1.0,
  language: 'en-US',
};

export function useSpeech(options: SpeechOptions = {}): UseSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(options.rate ?? DEFAULT_OPTIONS.rate!);
  const [isAvailable, setIsAvailable] = useState(true);
  const currentUtteranceRef = useRef<string | null>(null);

  // Check if speech is available on mount
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const voices = await Speech.getAvailableVoicesAsync();
        setIsAvailable(voices.length > 0);
      } catch {
        setIsAvailable(false);
      }
    };
    checkAvailability();
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const speak = useCallback(async (text: string): Promise<void> => {
    if (!isAvailable || !text.trim()) return;

    // Stop any current speech
    await Speech.stop();

    // Clean up text for better speech
    const cleanedText = cleanTextForSpeech(text);

    return new Promise((resolve) => {
      currentUtteranceRef.current = cleanedText;
      setIsSpeaking(true);

      Speech.speak(cleanedText, {
        rate: speechRate,
        pitch: options.pitch ?? DEFAULT_OPTIONS.pitch,
        language: options.language ?? DEFAULT_OPTIONS.language,
        onStart: () => {
          setIsSpeaking(true);
        },
        onDone: () => {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          resolve();
        },
        onStopped: () => {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          resolve();
        },
        onError: () => {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          resolve();
        },
      });
    });
  }, [isAvailable, speechRate, options.pitch, options.language]);

  const stop = useCallback(() => {
    Speech.stop();
    setIsSpeaking(false);
    currentUtteranceRef.current = null;
  }, []);

  return {
    speak,
    stop,
    isSpeaking,
    speechRate,
    setSpeechRate,
    isAvailable,
  };
}

/**
 * Clean and prepare text for natural speech
 */
function cleanTextForSpeech(text: string): string {
  let cleaned = text;

  // Replace common cooking abbreviations with full words
  const replacements: Record<string, string> = {
    'tbsp': 'tablespoon',
    'tsp': 'teaspoon',
    'oz': 'ounces',
    'lb': 'pounds',
    'lbs': 'pounds',
    'qt': 'quart',
    'pt': 'pint',
    'ml': 'milliliters',
    'g': 'grams',
    'kg': 'kilograms',
    'min': 'minutes',
    'mins': 'minutes',
    'hr': 'hour',
    'hrs': 'hours',
    'sec': 'seconds',
    'secs': 'seconds',
  };

  // Replace abbreviations (word boundaries)
  for (const [abbr, full] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    cleaned = cleaned.replace(regex, full);
  }

  // Handle fractions for better speech
  cleaned = cleaned
    .replace(/1\/4/g, 'one quarter')
    .replace(/1\/3/g, 'one third')
    .replace(/1\/2/g, 'one half')
    .replace(/2\/3/g, 'two thirds')
    .replace(/3\/4/g, 'three quarters');

  // Add pauses after sentences for better pacing
  cleaned = cleaned
    .replace(/\.\s+/g, '. ... ')
    .replace(/!\s+/g, '! ... ')
    .replace(/\?\s+/g, '? ... ');

  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

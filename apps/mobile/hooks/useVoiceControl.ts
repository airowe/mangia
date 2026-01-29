/**
 * useVoiceControl Hook
 *
 * Voice command recognition for hands-free cooking mode.
 * Uses @jamsch/expo-speech-recognition for speech-to-text.
 *
 * Supported commands:
 * - "Next" / "Next step" - advance to next step
 * - "Back" / "Previous" - go to previous step
 * - "Repeat" - read current step again
 * - "Timer [X] minutes" - start timer
 * - "Stop" / "Pause" - stop listening
 * - "Ingredients" - toggle ingredients panel
 *
 * Note: Requires a development build (not Expo Go) for full functionality.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

// Voice command types
export type VoiceCommand =
  | { type: 'next' }
  | { type: 'previous' }
  | { type: 'repeat' }
  | { type: 'timer'; minutes: number }
  | { type: 'stop' }
  | { type: 'ingredients' }
  | { type: 'unknown'; transcript: string };

export interface UseVoiceControlOptions {
  onCommand?: (command: VoiceCommand) => void;
  autoRestart?: boolean;
  enabled?: boolean;
}

export interface UseVoiceControlReturn {
  isListening: boolean;
  isAvailable: boolean;
  startListening: () => Promise<void>;
  stopListening: () => void;
  lastTranscript: string;
  error: string | null;
}

// Type definitions for speech recognition module (may not be installed)
interface SpeechRecognitionModule {
  getPermissionsAsync: () => Promise<{ granted: boolean; canAskAgain: boolean }>;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    continuous: boolean;
    requiresOnDeviceRecognition: boolean;
    addsPunctuation: boolean;
  }) => void;
  stop: () => void;
  addListener: (event: string, callback: (data: any) => void) => { remove: () => void };
}

// Try to import speech recognition - it may not be available in Expo Go
let ExpoSpeechRecognition: SpeechRecognitionModule | null = null;

try {
  // Dynamic require to avoid build-time errors when module is not installed
  const module = require('@jamsch/expo-speech-recognition');
  ExpoSpeechRecognition = module.ExpoSpeechRecognitionModule;
} catch {
  // Module not available (likely in Expo Go or not installed)
  console.log('Speech recognition not available - requires development build with @jamsch/expo-speech-recognition');
}

/**
 * Parse transcript text into a voice command
 */
function parseCommand(transcript: string): VoiceCommand {
  const text = transcript.toLowerCase().trim();

  // Next step commands
  if (/^(next|next step|go next|forward|continue)$/i.test(text)) {
    return { type: 'next' };
  }

  // Previous step commands
  if (/^(back|previous|go back|last step|previous step)$/i.test(text)) {
    return { type: 'previous' };
  }

  // Repeat commands
  if (/^(repeat|say again|read again|what|what was that)$/i.test(text)) {
    return { type: 'repeat' };
  }

  // Stop commands
  if (/^(stop|pause|quiet|shut up|silence|mute)$/i.test(text)) {
    return { type: 'stop' };
  }

  // Ingredients commands
  if (/^(ingredients|show ingredients|ingredient list|what ingredients)$/i.test(text)) {
    return { type: 'ingredients' };
  }

  // Timer commands - "timer 5 minutes", "set timer for 10 minutes", etc.
  const timerMatch = text.match(
    /(?:set\s+)?(?:a\s+)?timer\s+(?:for\s+)?(\d+)\s*(?:minute|minutes|min|mins)?/i
  );
  if (timerMatch) {
    const minutes = parseInt(timerMatch[1], 10);
    if (minutes > 0 && minutes <= 180) {
      return { type: 'timer', minutes };
    }
  }

  // Also match just numbers if context suggests timer
  const justNumberMatch = text.match(/^(\d+)\s*(?:minute|minutes|min|mins)$/i);
  if (justNumberMatch) {
    const minutes = parseInt(justNumberMatch[1], 10);
    if (minutes > 0 && minutes <= 180) {
      return { type: 'timer', minutes };
    }
  }

  return { type: 'unknown', transcript };
}

export function useVoiceControl(
  options: UseVoiceControlOptions = {}
): UseVoiceControlReturn {
  const { onCommand, autoRestart = true, enabled = true } = options;

  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const shouldRestartRef = useRef(false);

  // Check availability on mount
  useEffect(() => {
    const checkAvailability = async () => {
      if (!ExpoSpeechRecognition) {
        setIsAvailable(false);
        setError('Speech recognition requires a development build');
        return;
      }

      try {
        const status = await ExpoSpeechRecognition.getPermissionsAsync();
        if (status.granted) {
          setIsAvailable(true);
        } else if (status.canAskAgain) {
          const result = await ExpoSpeechRecognition.requestPermissionsAsync();
          setIsAvailable(result.granted);
          if (!result.granted) {
            setError('Microphone permission denied');
          }
        } else {
          setIsAvailable(false);
          setError('Microphone permission denied');
        }
      } catch (e) {
        setIsAvailable(false);
        setError('Failed to check speech recognition availability');
      }
    };

    checkAvailability();
  }, []);

  // Handle app state changes (pause when backgrounded)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App going to background - stop listening
        if (isListening) {
          shouldRestartRef.current = autoRestart;
          stopListening();
        }
      } else if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App coming back to foreground
        if (shouldRestartRef.current && enabled) {
          shouldRestartRef.current = false;
          startListening();
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isListening, autoRestart, enabled]);

  // Set up speech recognition event listeners if available
  useEffect(() => {
    if (!ExpoSpeechRecognition) return;
    // Event listeners are set up in the effect below
  }, []);

  const startListening = useCallback(async () => {
    if (!isAvailable || !ExpoSpeechRecognition || !enabled) {
      return;
    }

    try {
      setError(null);
      setIsListening(true);

      // Configure and start recognition
      ExpoSpeechRecognition.start({
        lang: 'en-US',
        interimResults: false,
        maxAlternatives: 1,
        continuous: true,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
      });
    } catch (e) {
      setIsListening(false);
      setError('Failed to start speech recognition');
      console.error('Speech recognition error:', e);
    }
  }, [isAvailable, enabled]);

  const stopListening = useCallback(() => {
    if (!ExpoSpeechRecognition) return;

    try {
      ExpoSpeechRecognition.stop();
      setIsListening(false);
    } catch (e) {
      console.error('Error stopping speech recognition:', e);
    }
  }, []);

  // Handle speech recognition results
  useEffect(() => {
    if (!ExpoSpeechRecognition || !isListening) return;

    const handleResult = (event: { results: Array<{ transcript: string }> }) => {
      if (event.results && event.results.length > 0) {
        const transcript = event.results[0].transcript;
        setLastTranscript(transcript);

        const command = parseCommand(transcript);
        if (command.type !== 'unknown' && onCommand) {
          onCommand(command);
        }

        // Stop command should actually stop listening
        if (command.type === 'stop') {
          stopListening();
        }
      }
    };

    // Add event listener
    const subscription = ExpoSpeechRecognition.addListener('result', handleResult);

    // Handle end of speech (auto-restart if configured)
    const endSubscription = ExpoSpeechRecognition.addListener('end', () => {
      if (autoRestart && enabled && isListening) {
        // Small delay before restarting
        setTimeout(() => {
          if (enabled) {
            startListening();
          }
        }, 100);
      } else {
        setIsListening(false);
      }
    });

    // Handle errors
    const errorSubscription = ExpoSpeechRecognition.addListener('error', (event: { error: string }) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        setError(event.error);
      }
    });

    return () => {
      subscription?.remove();
      endSubscription?.remove();
      errorSubscription?.remove();
    };
  }, [isListening, onCommand, autoRestart, enabled, stopListening, startListening]);

  return {
    isListening,
    isAvailable,
    startListening,
    stopListening,
    lastTranscript,
    error,
  };
}

/**
 * Hook for simulating voice control in Expo Go (for development)
 * Returns a mock implementation that doesn't actually listen
 */
export function useMockVoiceControl(
  options: UseVoiceControlOptions = {}
): UseVoiceControlReturn {
  const [isListening, setIsListening] = useState(false);

  const startListening = useCallback(async () => {
    setIsListening(true);
    console.log('Mock voice control: listening started (no actual recognition in Expo Go)');
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    console.log('Mock voice control: listening stopped');
  }, []);

  return {
    isListening,
    isAvailable: false,
    startListening,
    stopListening,
    lastTranscript: '',
    error: 'Voice control requires a development build',
  };
}

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";

export const NotificationManagerContext = createContext(null);

// iPhone-style notification sound presets
export const SOUND_PRESETS = {
  default: {
    name: "Default",
    type: "iphone_default", // Two-tone chime
  },
  gentle: {
    name: "Gentle",
    type: "iphone_gentle", // Soft single tone
  },
  chime: {
    name: "Chime",
    type: "iphone_chime", // Classic iPhone chime
  },
  bell: {
    name: "Bell",
    type: "iphone_bell", // Bell-like sound
  },
  soft: {
    name: "Soft",
    type: "iphone_soft", // Very soft tone
  },
  alert: {
    name: "Alert",
    type: "iphone_alert", // More urgent sound
  },
  pleasant: {
    name: "Pleasant",
    type: "iphone_pleasant", // Pleasant two-tone
  },
};

// Generate iPhone-style notification sound using Web Audio API
const createNotificationSound = (audioContext, soundPreset = "default") => {
  if (!audioContext) return null;
  
  const preset = SOUND_PRESETS[soundPreset] || SOUND_PRESETS.default;
  const now = audioContext.currentTime;
  
  try {
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    
    // iPhone-style sound configurations
    const soundConfigs = {
      iphone_default: {
        // Classic iPhone two-tone chime
        tones: [
          { freq: 1318.51, time: 0, duration: 0.1 }, // E6
          { freq: 1046.50, time: 0.1, duration: 0.15 }, // C6
        ],
        volume: 0.25,
      },
      iphone_gentle: {
        // Soft single tone
        tones: [
          { freq: 880, time: 0, duration: 0.2 }, // A5
        ],
        volume: 0.15,
      },
      iphone_chime: {
        // Pleasant chime
        tones: [
          { freq: 1318.51, time: 0, duration: 0.12 }, // E6
          { freq: 1174.66, time: 0.08, duration: 0.12 }, // D6 (overlapping)
        ],
        volume: 0.22,
      },
      iphone_bell: {
        // Bell-like sound with harmonics
        tones: [
          { freq: 523.25, time: 0, duration: 0.3 }, // C5
          { freq: 659.25, time: 0.05, duration: 0.25 }, // E5 (harmonic)
        ],
        volume: 0.2,
      },
      iphone_soft: {
        // Very soft, gentle
        tones: [
          { freq: 622.25, time: 0, duration: 0.18 }, // D#5
        ],
        volume: 0.12,
      },
      iphone_alert: {
        // More urgent, higher pitch
        tones: [
          { freq: 1318.51, time: 0, duration: 0.08 }, // E6
          { freq: 1567.98, time: 0.08, duration: 0.1 }, // G6
        ],
        volume: 0.28,
      },
      iphone_pleasant: {
        // Pleasant two-tone
        tones: [
          { freq: 1046.50, time: 0, duration: 0.12 }, // C6
          { freq: 1318.51, time: 0.1, duration: 0.15 }, // E6
        ],
        volume: 0.2,
      },
    };
    
    const config = soundConfigs[preset.type] || soundConfigs.iphone_default;
    const oscillators = [];
    
    // Create oscillators for each tone
    config.tones.forEach((tone) => {
      const osc = audioContext.createOscillator();
      const toneGain = audioContext.createGain();
      
      osc.type = "sine";
      osc.frequency.value = tone.freq;
      
      osc.connect(toneGain);
      toneGain.connect(gainNode);
      
      // Smooth envelope
      const startTime = now + tone.time;
      toneGain.gain.setValueAtTime(0, startTime);
      toneGain.gain.linearRampToValueAtTime(config.volume, startTime + 0.01);
      toneGain.gain.linearRampToValueAtTime(config.volume * 0.7, startTime + tone.duration * 0.6);
      toneGain.gain.linearRampToValueAtTime(0, startTime + tone.duration);
      
      osc.start(startTime);
      osc.stop(startTime + tone.duration);
      
      oscillators.push({ osc, toneGain });
    });
    
    // Return cleanup function
    return () => {
      oscillators.forEach(({ osc, toneGain }) => {
        try {
          osc.stop();
          osc.disconnect();
          toneGain.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
      });
      try {
        gainNode.disconnect();
      } catch (e) {
        // Ignore
      }
    };
  } catch (error) {
    console.warn("Could not create notification sound:", error);
    return null;
  }
};

const STORAGE_KEY = "cmp-notification-sound-enabled";
const SOUND_PRESET_KEY = "cmp-notification-sound-preset";
const DEFAULT_SOUND_ENABLED = true;
const DEFAULT_SOUND_PRESET = "default";

export const NotificationManagerProvider = ({ children }) => {
  const [currentToast, setCurrentToast] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? stored === "true" : DEFAULT_SOUND_ENABLED;
  });
  const [soundPreset, setSoundPresetState] = useState(() => {
    const stored = localStorage.getItem(SOUND_PRESET_KEY);
    return stored || DEFAULT_SOUND_PRESET;
  });
  const [userInteracted, setUserInteracted] = useState(false);

  const timeoutRef = useRef(null);
  const isProcessingRef = useRef(false);
  const queueRef = useRef([]);
  const seenEventIdsRef = useRef(new Set());
  const audioContextRef = useRef(null);
  const isPlayingSoundRef = useRef(false);
  const soundCleanupRef = useRef(null);
  const soundTimeoutRef = useRef(null);

  // Initialize audio context after user interaction
  useEffect(() => {
    const handleUserInteraction = async () => {
      if (!userInteracted) {
        setUserInteracted(true);
        // Initialize audio context on first interaction
        try {
          if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            console.log("[NotificationSound] Audio context initialized on user interaction");
          }
          
          // Try to resume immediately if suspended
          if (audioContextRef.current.state === "suspended") {
            await audioContextRef.current.resume();
            console.log("[NotificationSound] Audio context resumed on user interaction");
          }
        } catch (error) {
          console.error("[NotificationSound] Could not initialize audio context:", error);
        }
      }
    };

    // Listen for any user interaction
    const events = ["click", "keydown", "touchstart", "mousedown"];
    events.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [userInteracted]);

  // Keep refs in sync
  useEffect(() => {
    queueRef.current = toastQueue;
  }, [toastQueue]);

  // Helper function to initialize and resume audio context
  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.error("[NotificationSound] Could not create audio context:", error);
        return false;
      }
    }

    // Always try to resume audio context (browser autoplay policy)
    if (audioContextRef.current.state === "suspended") {
      try {
        await audioContextRef.current.resume();
      } catch (error) {
        console.error("[NotificationSound] Could not resume audio context:", error);
        return false;
      }
    }

    // If user hasn't interacted yet, try to resume anyway
    if (!userInteracted) {
      try {
        await audioContextRef.current.resume();
        setUserInteracted(true);
      } catch (error) {
        console.warn("[NotificationSound] Audio context requires user interaction:", error);
        return false;
      }
    }

    return true;
  }, [userInteracted]);

  // Preview a specific sound preset (for testing in profile settings)
  const previewSound = useCallback(async (presetKey) => {
    if (isPlayingSoundRef.current) {
      console.log("[PreviewSound] Sound already playing, skipping");
      return; // Don't interrupt if already playing
    }

    console.log("[PreviewSound] Starting preview for:", presetKey);

    // Initialize audio context if needed
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        console.log("[PreviewSound] Created new audio context");
      } catch (error) {
        console.error("[PreviewSound] Could not create audio context:", error);
        return;
      }
    }

    // Always try to resume audio context (browser autoplay policy)
    if (audioContextRef.current.state === "suspended") {
      try {
        console.log("[PreviewSound] Resuming suspended audio context");
        await audioContextRef.current.resume();
        console.log("[PreviewSound] Audio context resumed, state:", audioContextRef.current.state);
      } catch (error) {
        console.error("[PreviewSound] Could not resume audio context:", error);
        // Try to play anyway
      }
    }

    // If user hasn't interacted yet, try to resume anyway
    if (!userInteracted) {
      try {
        console.log("[PreviewSound] User hasn't interacted, attempting to resume");
        await audioContextRef.current.resume();
        setUserInteracted(true);
        console.log("[PreviewSound] Audio context resumed after user interaction");
      } catch (error) {
        console.warn("[PreviewSound] Audio context requires user interaction:", error);
        // Still try to play - user is clicking so interaction should be detected
      }
    }

    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      console.error("[PreviewSound] Audio context not available or closed");
      return;
    }

    try {
      isPlayingSoundRef.current = true;
      console.log("[PreviewSound] Creating sound for preset:", presetKey);
      const cleanup = createNotificationSound(audioContextRef.current, presetKey);
      
      if (!cleanup) {
        console.warn("[PreviewSound] Failed to create sound");
        isPlayingSoundRef.current = false;
        return;
      }
      
      // iPhone sounds are typically 0.2-0.3 seconds
      const maxDuration = 350; // Max duration in ms for cleanup
      setTimeout(() => {
        isPlayingSoundRef.current = false;
        if (cleanup) cleanup();
        console.log("[PreviewSound] Sound playback completed");
      }, maxDuration);
    } catch (error) {
      console.error("[PreviewSound] Could not preview sound:", error);
      isPlayingSoundRef.current = false;
    }
  }, [userInteracted]);

  // Play notification sound (sequential, no overlapping, plays once per toast)
  const playNotificationSound = useCallback(async () => {
    if (!soundEnabled) {
      return;
    }

    // Prevent overlapping sounds - if already playing, skip
    if (isPlayingSoundRef.current) {
      console.log("[NotificationSound] Sound already playing, skipping duplicate");
      return;
    }

    // Cancel any pending sound cleanup/timeout
    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current);
      soundTimeoutRef.current = null;
    }
    if (soundCleanupRef.current) {
      try {
        soundCleanupRef.current();
      } catch (e) {
        // Ignore cleanup errors
      }
      soundCleanupRef.current = null;
    }

    // Set flag IMMEDIATELY and synchronously to prevent duplicates
    isPlayingSoundRef.current = true;

    const initialized = await initializeAudioContext();
    if (!initialized || !audioContextRef.current) {
      console.warn("[NotificationSound] Audio context not initialized");
      isPlayingSoundRef.current = false;
      return;
    }

    try {
      const cleanup = createNotificationSound(audioContextRef.current, soundPreset);
      
      if (!cleanup) {
        console.warn("[NotificationSound] Failed to create sound");
        isPlayingSoundRef.current = false;
        return;
      }
      
      // Store cleanup function
      soundCleanupRef.current = cleanup;
      
      // iPhone sounds are typically 0.2-0.3 seconds
      // Reset flag after sound completes
      const maxDuration = 500; // Longer to ensure all sounds finish
      soundTimeoutRef.current = setTimeout(() => {
        isPlayingSoundRef.current = false;
        if (soundCleanupRef.current) {
          try {
            soundCleanupRef.current();
          } catch (e) {
            // Ignore cleanup errors
          }
          soundCleanupRef.current = null;
        }
        soundTimeoutRef.current = null;
      }, maxDuration);
    } catch (error) {
      console.error("[NotificationSound] Could not play notification sound:", error);
      // Always reset flag on error
      isPlayingSoundRef.current = false;
      soundCleanupRef.current = null;
      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
        soundTimeoutRef.current = null;
      }
    }
  }, [soundEnabled, soundPreset, initializeAudioContext]);

  // Process next toast from queue
  const processNextToast = useCallback(() => {
    if (isProcessingRef.current) {
      return;
    }

    setToastQueue((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      isProcessingRef.current = true;
      const nextToast = prev[0];
      
      // Set current toast IMMEDIATELY
      setCurrentToast(nextToast);

      // Play sound ONLY if sound is enabled AND notification is not silent
      // Play sound synchronously after setting toast to prevent race conditions
      if (!nextToast.silent && soundEnabled && playNotificationSound) {
        // Use requestAnimationFrame to ensure toast is rendered first, then play sound
        // But check flag synchronously to prevent duplicates
        if (!isPlayingSoundRef.current) {
          requestAnimationFrame(() => {
            // Double-check flag again before playing (defensive)
            if (!isPlayingSoundRef.current) {
              playNotificationSound();
            }
          });
        }
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Auto remove after 5 seconds
      timeoutRef.current = setTimeout(() => {
        setCurrentToast(null);
        isProcessingRef.current = false;
        // Process next toast after a short delay
        setTimeout(() => {
          if (queueRef.current.length > 0) {
            processNextToast();
          }
        }, 300);
      }, 5000);

      // Remove from queue
      return prev.slice(1);
    });
  }, [soundEnabled, playNotificationSound]);

  // Process queue when it changes and no current toast
  useEffect(() => {
    if (!isProcessingRef.current && toastQueue.length > 0 && !currentToast) {
      processNextToast();
    }
  }, [toastQueue.length, currentToast, processNextToast]);

  // Show notification (with deduplication)
  const showNotification = useCallback(({ title, description, variant = "default", eventId = null, silent = false }) => {
    // Deduplication: if eventId is provided and we've seen it, skip
    if (eventId && seenEventIdsRef.current.has(eventId)) {
      console.log(`[Notification] Skipping duplicate event: ${eventId}`);
      return;
    }

    // Mark as seen if eventId provided (do this BEFORE adding to queue to prevent race conditions)
    if (eventId) {
      seenEventIdsRef.current.add(eventId);
    }

    const id = Date.now() + Math.random();
    const newToast = { id, title, description, variant, eventId, silent };
    
    // Add to queue
    setToastQueue((prev) => {
      // Double-check for duplicates in queue (defensive programming)
      const isDuplicate = prev.some((toast) => toast.eventId === eventId && eventId !== null);
      if (isDuplicate) {
        console.log(`[Notification] Duplicate found in queue, skipping: ${eventId}`);
        return prev;
      }
      return [...prev, newToast];
    });
    
    // Log to console for debugging
    if (variant === "destructive") {
      console.error(`[Notification] ${title}: ${description}`);
    } else if (variant === "critical") {
      console.warn(`[Notification] ${title}: ${description}`);
    } else {
      console.log(`[Notification] ${title}: ${description}`);
    }
  }, []);

  // Remove toast (dismiss)
  const removeToast = useCallback((id) => {
    if (currentToast?.id === id) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setCurrentToast(null);
      isProcessingRef.current = false;
      // Process next toast after a short delay
      setTimeout(() => {
        if (queueRef.current.length > 0) {
          processNextToast();
        }
      }, 300);
    } else {
      // Remove from queue if not yet shown
      setToastQueue((prev) => prev.filter((t) => t.id !== id));
    }
  }, [currentToast, processNextToast]);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setCurrentToast(null);
    setToastQueue([]);
    isProcessingRef.current = false;
  }, []);

  // Toggle sound preference
  const setSoundEnabled = useCallback((enabled) => {
    setSoundEnabledState(enabled);
    localStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  // Set sound preset
  const setSoundPreset = useCallback((preset) => {
    if (SOUND_PRESETS[preset]) {
      setSoundPresetState(preset);
      localStorage.setItem(SOUND_PRESET_KEY, preset);
    }
  }, []);

  // Clear seen event IDs (useful for testing or reset)
  const clearSeenEvents = useCallback(() => {
    seenEventIdsRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (soundTimeoutRef.current) {
        clearTimeout(soundTimeoutRef.current);
      }
      if (soundCleanupRef.current) {
        try {
          soundCleanupRef.current();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const value = {
    // Toast state
    currentToast,
    toasts: currentToast ? [currentToast] : [],
    
    // Methods
    showNotification,
    removeToast,
    clearAllToasts,
    
    // Sound preferences
    soundEnabled,
    setSoundEnabled,
    soundPreset,
    setSoundPreset,
    soundPresets: SOUND_PRESETS,
    previewSound,
    userInteracted,
    
    // Utility
    clearSeenEvents,
  };

  return (
    <NotificationManagerContext.Provider value={value}>
      {children}
    </NotificationManagerContext.Provider>
  );
};

export const useNotificationManager = () => {
  const context = useContext(NotificationManagerContext);
  if (!context) {
    // Fallback for components that use notification manager before provider is set up
    return {
      showNotification: ({ title, description, variant = "default" }) => {
        console.log(`[Notification] ${title}: ${description}`);
      },
      toasts: [],
      removeToast: () => {},
      clearAllToasts: () => {},
      soundEnabled: true,
      setSoundEnabled: () => {},
      soundPreset: "gentle",
      setSoundPreset: () => {},
      soundPresets: SOUND_PRESETS,
      previewSound: () => {},
      userInteracted: false,
      clearSeenEvents: () => {},
    };
  }
  return context;
};

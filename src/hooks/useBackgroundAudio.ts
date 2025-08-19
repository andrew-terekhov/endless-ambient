import { useEffect, useRef, useCallback } from 'react';

export const useBackgroundAudio = () => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const silentOscillatorRef = useRef<OscillatorNode | null>(null);
  const silentGainRef = useRef<GainNode | null>(null);
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Media Session API for iOS background playback
  const initializeMediaSession = useCallback(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Endless Ambient',
        artist: 'Ambient Music Generator',
        album: 'Ambient Soundscapes',
        artwork: [
          { src: '/favicon.ico', sizes: '96x96', type: 'image/ico' }
        ]
      });

      // Set up media session action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        resumeAudioContext();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        // Don't actually pause, just resume to keep audio active
        resumeAudioContext();
      });

      // Set playback state to playing
      navigator.mediaSession.playbackState = 'playing';
    }
  }, []);

  // Resume audio context with iOS-specific handling
  const resumeAudioContext = useCallback(async () => {
    try {
      if (typeof (window as any).Tone !== 'undefined') {
        const audioContext = (window as any).Tone.getContext();
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume();
          console.log('Audio context resumed');
        }
      }
    } catch (error) {
      console.warn('Failed to resume audio context:', error);
    }
  }, []);

  // Create silent oscillator to keep audio context active on iOS
  const createSilentTone = useCallback(() => {
    try {
      if (typeof (window as any).Tone !== 'undefined') {
        const audioContext = (window as any).Tone.getContext();
        if (audioContext) {
          // Create silent oscillator
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          // Set extremely low volume (essentially silent)
          gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
          
          // Connect oscillator to gain and destination
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          // Use a very high frequency (above human hearing range)
          oscillator.frequency.setValueAtTime(20000, audioContext.currentTime);
          
          // Start the oscillator
          oscillator.start();
          
          // Store references for cleanup
          silentOscillatorRef.current = oscillator;
          silentGainRef.current = gainNode;
          
          // Schedule it to stop after a short duration
          setTimeout(() => {
            try {
              oscillator.stop();
            } catch (e) {
              // Oscillator might already be stopped
            }
          }, 100);
        }
      }
    } catch (error) {
      console.warn('Failed to create silent tone:', error);
    }
  }, []);

  // Keep audio context alive with periodic resume calls
  const startKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }

    keepAliveIntervalRef.current = setInterval(() => {
      resumeAudioContext();
      
      // Play a silent tone every 10 seconds to prevent iOS from suspending audio
      if (document.hidden) {
        createSilentTone();
      }
    }, 10000); // Every 10 seconds
  }, [resumeAudioContext, createSilentTone]);

  const enableBackgroundAudio = useCallback(async () => {
    try {
      // Enable screen wake lock for web
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
          console.log('Screen wake lock acquired');
        } catch (wakeLockError) {
          console.warn('Wake lock failed:', wakeLockError);
        }
      }

      // Initialize Media Session API
      initializeMediaSession();

      // Resume audio context
      await resumeAudioContext();

      // Start keep-alive mechanism for iOS
      startKeepAlive();

      // Play initial silent tone to prime iOS audio
      createSilentTone();

    } catch (error) {
      console.warn('Background audio setup failed:', error);
    }
  }, [initializeMediaSession, resumeAudioContext, startKeepAlive, createSilentTone]);

  const disableBackgroundAudio = useCallback(async () => {
    try {
      // Release wake lock
      if (wakeLockRef.current) {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Screen wake lock released');
      }

      // Stop keep-alive interval
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }

      // Clean up silent oscillator
      if (silentOscillatorRef.current) {
        try {
          silentOscillatorRef.current.stop();
        } catch (e) {
          // Already stopped
        }
        silentOscillatorRef.current = null;
      }

      if (silentGainRef.current) {
        silentGainRef.current.disconnect();
        silentGainRef.current = null;
      }

      // Reset media session
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }

    } catch (error) {
      console.warn('Background audio cleanup failed:', error);
    }
  }, []);

  useEffect(() => {
    // Enhanced visibility change handling for iOS
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Page hidden - maintaining background audio');
        resumeAudioContext();
        createSilentTone();
      } else {
        console.log('Page visible - resuming normal audio');
        resumeAudioContext();
      }
    };

    // Handle page hide/show events (iOS Safari specific)
    const handlePageHide = () => {
      console.log('Page hide event - preparing for background');
      resumeAudioContext();
      createSilentTone();
    };

    const handlePageShow = () => {
      console.log('Page show event - resuming from background');
      resumeAudioContext();
    };

    // Handle focus/blur events for additional iOS compatibility
    const handleBlur = () => {
      resumeAudioContext();
      createSilentTone();
    };

    const handleFocus = () => {
      resumeAudioContext();
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Initial setup
    enableBackgroundAudio();

    return () => {
      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      
      // Cleanup
      disableBackgroundAudio();
    };
  }, [enableBackgroundAudio, disableBackgroundAudio, resumeAudioContext, createSilentTone]);

  return {
    enableBackgroundAudio,
    disableBackgroundAudio,
    resumeAudioContext
  };
};
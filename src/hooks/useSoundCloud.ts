import { useState, useEffect, useCallback } from 'react';

// SoundCloud Widget types
declare global {
  interface Window {
    SC: {
      Widget: {
        (iframe: HTMLIFrameElement): {
          bind: (event: string, callback: () => void) => void;
          play: () => void;
          pause: () => void;
          next: () => void;
          prev: () => void;
          setVolume: (volume: number) => void;
        };
        Events: {
          READY: string;
        };
      };
    };
  }
}

export const useSoundCloud = (initialVolume: number = 60) => {
  const [soundcloudWidget, setSoundcloudWidget] = useState<any>(null);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isWidgetReady, setIsWidgetReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [initializationAttempts, setInitializationAttempts] = useState(0);

  const fieldRecordingTracks = [
    { id: 'track1', title: 'Forest Ambience', url: 'https://soundcloud.com/luftrum-1/sets/field-recordings-1' },
    { id: 'track2', title: 'Ocean Waves', url: 'https://soundcloud.com/luftrum-1/sets/field-recordings-1' },
    { id: 'track3', title: 'Rain Drops', url: 'https://soundcloud.com/luftrum-1/sets/field-recordings-1' },
    { id: 'track4', title: 'Wind Through Trees', url: 'https://soundcloud.com/luftrum-1/sets/field-recordings-1' },
    { id: 'track5', title: 'Bird Songs', url: 'https://soundcloud.com/luftrum-1/sets/field-recordings-1' },
  ];

  // Load SoundCloud script
  useEffect(() => {
    const loadSoundCloudScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.SC) {
          setIsScriptLoaded(true);
          resolve();
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://w.soundcloud.com/player/api.js';
        script.async = true;
        script.onload = () => {
          setIsScriptLoaded(true);
          resolve();
        };
        script.onerror = () => {
          console.error('Failed to load SoundCloud script');
          reject(new Error('Failed to load SoundCloud script'));
        };
        document.head.appendChild(script);
      });
    };

    loadSoundCloudScript().catch(console.error);
  }, []);

  // Initialize widget after script loads with retry logic
  useEffect(() => {
    if (!isScriptLoaded || !window.SC) return;

    const initializeWidget = () => {
      try {
        const iframe = document.querySelector('#soundcloud-widget') as HTMLIFrameElement;
        if (iframe) {
          console.log(`Initializing SoundCloud widget (attempt ${initializationAttempts + 1})...`);
          const widget = window.SC.Widget(iframe);
          setSoundcloudWidget(widget);
          
          widget.bind(window.SC.Widget.Events.READY, () => {
            console.log('SoundCloud widget initialized and ready');
            setIsWidgetReady(true);
            setInitializationAttempts(0);
            widget.setVolume(initialVolume);
          });

        } else {
          console.error(`SoundCloud iframe not found (attempt ${initializationAttempts + 1})`);
          
          // Retry initialization up to 3 times
          if (initializationAttempts < 3) {
            setInitializationAttempts(prev => prev + 1);
            setTimeout(() => {
              initializeWidget();
            }, 1000 * (initializationAttempts + 1)); // Increasing delay
          } else {
            console.error('Failed to initialize SoundCloud widget after 3 attempts');
          }
        }
      } catch (error) {
        console.error('Error initializing SoundCloud widget:', error);
        
        // Retry on error
        if (initializationAttempts < 3) {
          setInitializationAttempts(prev => prev + 1);
          setTimeout(() => {
            initializeWidget();
          }, 1000 * (initializationAttempts + 1));
        }
      }
    };

    // Staggered initialization attempts
    const delay = initializationAttempts === 0 ? 500 : 1000 * initializationAttempts;
    setTimeout(initializeWidget, delay);
  }, [isScriptLoaded, initialVolume, initializationAttempts]);

  const play = useCallback(() => {
    if (soundcloudWidget && isWidgetReady) {
      try {
        soundcloudWidget.play();
        setIsPlaying(true);
        console.log('SoundCloud playback started');
      } catch (error) {
        console.error('Error playing SoundCloud track:', error);
      }
    } else {
      console.warn('SoundCloud widget not ready yet', { 
        hasWidget: !!soundcloudWidget, 
        isReady: isWidgetReady, 
        isScriptLoaded 
      });
    }
  }, [soundcloudWidget, isWidgetReady, isScriptLoaded]);

  const pause = useCallback(() => {
    if (soundcloudWidget && isWidgetReady) {
      try {
        soundcloudWidget.pause();
        setIsPlaying(false);
        console.log('SoundCloud playback paused');
      } catch (error) {
        console.error('Error pausing SoundCloud track:', error);
      }
    }
  }, [soundcloudWidget, isWidgetReady]);

  const setVolume = useCallback((volume: number) => {
    if (soundcloudWidget && isWidgetReady) {
      try {
        soundcloudWidget.setVolume(volume);
      } catch (error) {
        console.error('Error setting SoundCloud volume:', error);
      }
    }
  }, [soundcloudWidget, isWidgetReady]);

  const changeTrack = useCallback((direction: 'next' | 'prev') => {
    if (!soundcloudWidget || !isWidgetReady) return;
    
    try {
      if (direction === 'next') {
        soundcloudWidget.next();
        setCurrentTrack(prev => (prev + 1) % fieldRecordingTracks.length);
      } else {
        soundcloudWidget.prev();
        setCurrentTrack(prev => (prev - 1 + fieldRecordingTracks.length) % fieldRecordingTracks.length);
      }
    } catch (error) {
      console.error('Error changing SoundCloud track:', error);
    }
  }, [soundcloudWidget, isWidgetReady, fieldRecordingTracks.length]);

  return {
    soundcloudWidget,
    currentTrack,
    fieldRecordingTracks,
    isScriptLoaded,
    isWidgetReady,
    isPlaying,
    play,
    pause,
    setVolume,
    changeTrack
  };
};
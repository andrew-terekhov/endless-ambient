import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Instagram, Linkedin, Music, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import * as Tone from 'tone';

// Components
import { MoodSelector } from './MoodSelector';
import { InstrumentPanel, InstrumentConfig } from './InstrumentPanel';

// Hooks
import { useAudioSystem } from '@/hooks/useAudioSystem';
import { useSoundCloud } from '@/hooks/useSoundCloud';
import { useSettingsPersistence } from '@/hooks/useSettingsPersistence';
import { useBackgroundAudio } from '@/hooks/useBackgroundAudio';

// Utils
import { generateAmbientMusic } from '@/utils/musicGeneration';
import { toggleInstrument as toggleInstrumentUtil, updateInstrumentVolume as updateInstrumentVolumeUtil } from '@/utils/instrumentUtils';

// Config
import { DEFAULT_INSTRUMENTS } from '@/config/instruments';

const AmbientMusicGenerator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMood, setCurrentMood] = useState('Lydian');
  const [tempo, setTempo] = useState([60]);
  const [masterVolume, setMasterVolume] = useState([0.7]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [instruments, setInstruments] = useState<InstrumentConfig[]>(DEFAULT_INSTRUMENTS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // Custom hooks
  const audioSystem = useAudioSystem();
  const soundCloud = useSoundCloud(60);
  const { enableBackgroundAudio, disableBackgroundAudio } = useBackgroundAudio();
  const {
    saveCurrentSettings,
    loadSavedSettings
  } = useSettingsPersistence();

  // Initialize audio system and load saved settings
  useEffect(() => {
    const initializeAudio = async () => {
      // Load saved settings first
      const savedSettings = loadSavedSettings();
      if (savedSettings) {
        setCurrentMood(savedSettings.mood);
        setTempo([savedSettings.tempo]);
        setMasterVolume([savedSettings.masterVolume]);

        // Update instruments with saved settings
        setInstruments(prevInstruments => prevInstruments.map(instrument => {
          const savedInstrument = savedSettings.instruments.find(s => s.id === instrument.id);
          return savedInstrument ? {
            ...instrument,
            active: savedInstrument.active,
            volume: savedInstrument.volume
          } : instrument;
        }));
      }
      const success = await audioSystem.initializeAudio(savedSettings?.masterVolume ?? masterVolume[0]);
      setIsInitialized(success);
      if (success) {
        console.log('Audio system initialized successfully');
      }
    };
    initializeAudio();
    return () => {
      audioSystem.cleanup();
    };
  }, []);

  // Update master volume when slider changes

  useEffect(() => {
    if (audioSystem.masterGainRef.current) {
      audioSystem.masterGainRef.current.gain.value = masterVolume[0];
    }
  }, [masterVolume]);
  const handleFieldRecordingsPlay = () => {
    const fieldRecordingsInstrument = instruments.find(i => i.id === 'fieldRecordings');
    if (fieldRecordingsInstrument?.active) {
      soundCloud.play();
    }
  };
  const handleMoodCardClick = async (mood: string) => {
    // Check if any Tone.js instruments are active (non-field-recording instruments)
    const toneInstrumentsActive = instruments.some(i => i.id !== 'fieldRecordings' && i.active);
    const fieldRecordingsActive = instruments.find(i => i.id === 'fieldRecordings')?.active;
    
    // Start Tone.js AudioContext immediately on user interaction if Tone.js instruments are active
    if (toneInstrumentsActive && !isInitialized) {
      console.error('Audio system not initialized');
      return;
    }
    
    if (toneInstrumentsActive) {
      try {
        await Tone.start();
        soundCloud.play();
        console.log('Tone.js AudioContext started from user interaction');
      } catch (error) {
        console.error('Failed to start Tone.js AudioContext:', error);
      }
    }
    
    if (fieldRecordingsActive && soundCloud.isWidgetReady) {
      if (mood === currentMood) {
        // Same card - toggle play/pause for SoundCloud only
        if (soundCloud.isPlaying) {
          soundCloud.pause();
          console.log('SoundCloud paused via mood card');
        } else {
          soundCloud.play();
          console.log('SoundCloud resumed via mood card');
        }
        // Don't change isPlaying state for Tone.js - only SoundCloud
      } else {
        // Different card - change track and ensure SoundCloud is playing
        soundCloud.changeTrack('next');
        setCurrentMood(mood);
        if (!soundCloud.isPlaying) {
          soundCloud.play();
        }
        console.log('SoundCloud track changed and playing via mood card');
      }
    }
    
    // Handle Tone.js instruments
    if (toneInstrumentsActive) {
      if (mood === currentMood && isPlaying) {
        handlePlay();
      } else if (mood !== currentMood) {
        setCurrentMood(mood);
        if (!isPlaying) {
          handlePlay();
        }
      } else {
        handlePlay();
      }
    }
  };
  const handlePlay = async () => {
    if (!isInitialized) {
      console.error('Audio system not initialized');
      return;
    }
    
    const fieldRecordingsActive = instruments.find(i => i.id === 'fieldRecordings')?.active;
    const toneInstrumentsActive = instruments.some(i => i.id !== 'fieldRecordings' && i.active);
    
    if (isPlaying) {
      // Stop Tone.js music
      if (Tone.Transport.state === 'started') {
        Tone.Transport.stop();
      }
      audioSystem.loopsRef.current.forEach(loop => {
        loop.stop();
        loop.dispose();
      });
      audioSystem.loopsRef.current.clear();

      // Only pause SoundCloud if field recordings are not the primary focus
      if (!fieldRecordingsActive) {
        soundCloud.pause();
      }
      
      // Disable background audio
      disableBackgroundAudio();
      setIsPlaying(false);
      console.log('Tone.js music stopped');
    } else {
      try {
        // Ensure Tone.js AudioContext is started before playing
        if (toneInstrumentsActive) {
          try {
            await Tone.start();
            console.log('Tone.js AudioContext started in handlePlay');
          } catch (error) {
            console.error('Failed to start Tone.js AudioContext in handlePlay:', error);
          }
        }
        
        await generateAmbientMusic(audioSystem, instruments, currentMood, tempo[0], handleFieldRecordingsPlay);
        
        // Enable background audio for iOS
        await enableBackgroundAudio();
        setIsPlaying(true);
        console.log('Tone.js music started');
      } catch (error) {
        console.error('Failed to play ambient music:', error);
      }
    }
  };
  const toggleInstrument = (instrumentId: string) => {
    setInstruments(prev => {
      const updated = toggleInstrumentUtil(prev, instrumentId);
      saveCurrentSettings(currentMood, tempo[0], masterVolume[0], updated);
      return updated;
    });
  };
  const updateInstrumentVolume = (instrumentId: string, volume: number) => {
    setInstruments(prev => {
      const updated = updateInstrumentVolumeUtil(prev, instrumentId, volume, audioSystem, soundCloud.setVolume);
      saveCurrentSettings(currentMood, tempo[0], masterVolume[0], updated);
      return updated;
    });
  };

  // Save settings when mood, tempo, or master volume changes
  useEffect(() => {
    if (isInitialized) {
      saveCurrentSettings(currentMood, tempo[0], masterVolume[0], instruments);
    }
  }, [currentMood, tempo, masterVolume, isInitialized]);

  // Restart music when mood changes during playback
  useEffect(() => {
    if (isInitialized && isPlaying) {
      const restartMusic = async () => {
        try {
          // Stop current music
          if (Tone.Transport.state === 'started') {
            Tone.Transport.stop();
          }
          audioSystem.loopsRef.current.forEach(loop => {
            loop.stop();
            loop.dispose();
          });
          audioSystem.loopsRef.current.clear();

          // Pause SoundCloud widget
          soundCloud.pause();

          // Generate new ambient music with updated mood
          await generateAmbientMusic(audioSystem, instruments, currentMood, tempo[0], handleFieldRecordingsPlay);
        } catch (error) {
          console.error('Failed to restart ambient music with new mood:', error);
          setIsPlaying(false);
        }
      };
      restartMusic();
    }
  }, [currentMood, isInitialized]);
  return <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-thin mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Endless Ambient
          </h1>
          <p className="text-lg text-muted-foreground">
            Create infinite ambient soundscapes for relaxation and meditation
          </p>
        </div>

        {/* Main Control Panel */}
        <Card className="ambient-glass p-8 mb-8 ambient-glow">
          <MoodSelector 
            currentMood={currentMood} 
            isPlaying={isPlaying} 
            onMoodChange={setCurrentMood} 
            onPlayPause={handleMoodCardClick} 
          />
        </Card>

        {/* Collapsible Instrument Panel */}
        <Collapsible open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <Card className="ambient-glass p-4">
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-medium bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Settings
                </h3>
                <ChevronDown 
                  className={`w-6 h-6 text-muted-foreground transition-transform duration-200 ${
                    isSettingsOpen ? 'rotate-180' : ''
                  }`} 
                />
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <InstrumentPanel 
                instruments={instruments} 
                tempo={tempo} 
                masterVolume={masterVolume} 
                onToggleInstrument={toggleInstrument} 
                onVolumeChange={updateInstrumentVolume} 
                onTempoChange={setTempo} 
                onMasterVolumeChange={setMasterVolume} 
                onTrackChange={soundCloud.changeTrack} 
              />
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* SoundCloud widget - positioned off-screen but persistent in DOM */}
        <div className="fixed -left-[400px] -top-[200px] w-[380px] h-[166px] pointer-events-none opacity-0">
          <iframe 
            id="soundcloud-widget"
            width="380" 
            height="166" 
            scrolling="no" 
            frameBorder="no" 
            allow="autoplay"
            src="https://w.soundcloud.com/player/?url=https%3A//soundcloud.com/luftrum-1/sets/field-recordings-1&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
          />
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground">
          {/* Creator Links */}
          <div className="mb-6">
            <p className="text-sm mb-3">Connect with me</p>
            <div className="flex justify-center gap-4">
              <a href="https://www.instagram.com/auchord_/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              <a href="https://ffm.to/carbon-footprint" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="Auchord - Carbon Footprint">
                <Music size={20} />
              </a>
              <a href="https://www.linkedin.com/in/andrey-terekhov/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <p className="text-sm">
            Field recordings by{' '}
            <a href="https://www.luftrum.com/free-field-recordings/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">
              Luftrum
            </a>
          </p>
        </div>
      </div>
    </div>;
};

export default AmbientMusicGenerator;

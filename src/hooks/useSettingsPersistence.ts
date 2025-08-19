import { useCallback, useRef } from 'react';
import { saveSettings, loadSettings, UserSettings } from '@/utils/settingsStorage';
import { InstrumentConfig } from '@/components/InstrumentPanel';
import { useToast } from '@/hooks/use-toast';

interface UseSettingsPersistenceReturn {
  saveCurrentSettings: (
    mood: string,
    tempo: number,
    masterVolume: number,
    instruments: InstrumentConfig[]
  ) => void;
  loadSavedSettings: () => UserSettings | null;
}

export const useSettingsPersistence = (): UseSettingsPersistenceReturn => {
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  const saveCurrentSettings = useCallback((
    mood: string,
    tempo: number,
    masterVolume: number,
    instruments: InstrumentConfig[]
  ) => {
    // Debounce saves to avoid excessive localStorage writes
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      const settings: UserSettings = {
        mood,
        tempo,
        masterVolume,
        instruments: instruments.map(({ id, active, volume }) => ({
          id,
          active,
          volume,
        })),
        lastSaved: new Date().toISOString(),
      };

      saveSettings(settings);
      
      // Show a subtle toast notification
      toast({
        title: "Settings saved",
        duration: 1000,
      });
    }, 500); // 500ms debounce
  }, [toast]);

  const loadSavedSettings = useCallback(() => {
    return loadSettings();
  }, []);

  return {
    saveCurrentSettings,
    loadSavedSettings,
  };
};
export interface UserSettings {
  mood: string;
  tempo: number;
  masterVolume: number;
  instruments: Array<{
    id: string;
    active: boolean;
    volume: number;
  }>;
  lastSaved: string;
}

const SETTINGS_KEY = 'ambient-music-settings';

export const saveSettings = (settings: UserSettings): void => {
  try {
    const settingsWithTimestamp = {
      ...settings,
      lastSaved: new Date().toISOString(),
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settingsWithTimestamp));
  } catch (error) {
    console.warn('Failed to save settings to localStorage:', error);
  }
};

export const loadSettings = (): UserSettings | null => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Validate the structure
    if (
      typeof parsed.mood === 'string' &&
      typeof parsed.tempo === 'number' &&
      typeof parsed.masterVolume === 'number' &&
      Array.isArray(parsed.instruments)
    ) {
      return parsed;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to load settings from localStorage:', error);
    return null;
  }
};

export const clearSettings = (): void => {
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.warn('Failed to clear settings from localStorage:', error);
  }
};
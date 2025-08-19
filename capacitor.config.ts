import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.e09c68a63d864622b1645cc85fb77c9d',
  appName: 'endless-ambient',
  webDir: 'dist',
  server: {
    url: 'https://e09c68a6-3d86-4622-b164-5cc85fb77c9d.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    BackgroundMode: {
      notificationTitle: 'Endless Ambient',
      notificationText: 'Playing ambient music',
      enableHighAccuracy: true
    }
  }
};

export default config;
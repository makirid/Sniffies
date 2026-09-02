import type { CapacitorConfig } from '@capacitor/cli';

// Capacitor config for wrapping the dashboard as a native Android app.
// The app bundles this dashboard (webDir: "dist"); the "Enter Sniffies"
// button opens the official sniffies.com in an in-app browser (Custom Tab)
// via @capacitor/browser, so your map and the real app live in one shell.
const config: CapacitorConfig = {
  appId: 'me.swapmobile.sniffies',
  appName: 'Sniffies',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;

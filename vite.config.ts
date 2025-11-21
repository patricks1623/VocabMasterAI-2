import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  // Prioritize system variables (process.env), then loaded .env variables.
  // Check strictly for API_KEY, then VITE_API_KEY, then GOOGLE_API_KEY.
  const apiKey = process.env.API_KEY || env.API_KEY || env.VITE_API_KEY || env.GOOGLE_API_KEY || '';
  
  return {
    plugins: [react()],
    define: {
      // Stringify is crucial here as it replaces the token in the code with the string value
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
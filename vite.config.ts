import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');
  
  // Robustly check for the API key in various common environment variable locations
  // Prioritize system variables (process.env), then loaded .env variables.
  const apiKey = 
    process.env.API_KEY || 
    env.API_KEY || 
    env.VITE_API_KEY || 
    env.GOOGLE_API_KEY || 
    env.VITE_GOOGLE_API_KEY ||
    env.REACT_APP_API_KEY ||
    '';

  // Log status during build (visible in terminal/build logs)
  if (!apiKey) {
    console.warn("⚠️  WARNING: No API_KEY found in environment variables or .env file. The app may not function correctly.");
  } else {
    console.log("✅ API_KEY loaded successfully for build.");
  }
  
  return {
    plugins: [react()],
    define: {
      // Stringify is crucial here as it replaces the token in the code with the string value
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  };
});
// Manually declare process.env to fix missing vite/client types
declare const process: {
  env: {
    [key: string]: string | undefined;
    API_KEY: string;
  }
};

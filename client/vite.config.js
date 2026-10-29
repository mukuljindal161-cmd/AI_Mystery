import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') {
    const url = process.env.VITE_API_URL || loadEnv(mode, process.cwd(), 'VITE_').VITE_API_URL;
    let valid = false;
    try {
      const parsed = new URL(url);
      valid = ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password;
      if (process.env.VERCEL)
        valid =
          valid &&
          parsed.protocol === 'https:' &&
          !['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
    } catch {
      /* Report the configuration name, never its contents. */
    }
    if (!valid)
      throw new Error(
        'Set VITE_API_URL to your API base URL (including /api); Vercel requires a public HTTPS URL.',
      );
  }
  return {
    plugins: [react()],
    server: { port: 5173, strictPort: true },
    test: { environment: 'jsdom', setupFiles: ['./src/testSetup.js'] },
  };
});

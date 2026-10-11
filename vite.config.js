import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Allow SUPABASE_* prefixes in addition to VITE_* so environment variables
  // copied directly from Supabase docs or dashboards will be loaded by Vite.
  envPrefix: ['VITE_', 'SUPABASE_'],
});

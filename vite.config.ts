import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    // Optional: you can adjust other build options here if needed,
    // but the plugin handles most of the necessary changes.
  }
});

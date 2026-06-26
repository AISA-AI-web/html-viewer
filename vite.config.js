import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project is served from a GitHub Pages project subpath:
//   https://aisa-ai-web.github.io/html-viewer/
// so assets must be referenced under /html-viewer/.
export default defineConfig({
  plugins: [react()],
  base: '/html-viewer/',
})

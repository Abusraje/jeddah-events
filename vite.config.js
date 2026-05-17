import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' makes asset paths relative so the build works at any subpath
// (e.g. https://<username>.github.io/<repo-name>/) without changes.
export default defineConfig({
  plugins: [react()],
  base: './',
})

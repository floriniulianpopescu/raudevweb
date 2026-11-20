import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import path from 'path'

/**
 * Link previews need absolute URLs. When VITE_SITE_URL is set (e.g. https://example.com),
 * make og:image absolute and add og:url. Without it the tags stay relative, which is fine in dev.
 */
function siteUrlPlugin(siteUrl: string | undefined): Plugin {
  const site = siteUrl?.trim().replace(/\/+$/, '')
  if (site && !/^https?:\/\/[^/]+/.test(site)) {
    throw new Error(`VITE_SITE_URL must be a full URL like https://example.com (got "${siteUrl}")`)
  }
  return {
    name: 'site-url',
    transformIndexHtml(html) {
      if (!site) return html
      return html
        .replace('<meta property="og:image" content="/og-image.png" />', `<meta property="og:image" content="${site}/og-image.png" />`)
        .replace('<meta property="og:type"', `<meta property="og:url" content="${site}/" />\n    <meta property="og:type"`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), siteUrlPlugin(loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL)],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
}))

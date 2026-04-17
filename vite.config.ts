import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";
import MarkdownIt from "markdown-it";
import pageProps from "./src/page-props.json";

const md = new MarkdownIt({ html: true, typographer: false });

const localePlugin = {
  name: "locale-inject",
  transformIndexHtml(html: string) {
    return html.replace(/%LOCALE_([^%]+)%/g, (match, key) => {
      const value = (pageProps.jsLocales as Record<string, string>)[key];
      if (value === undefined) return match;
      return key.startsWith("md_") ? md.renderInline(value) : value;
    });
  },
};

export default defineConfig({
  plugins: [localePlugin, VitePWA({ registerType: "autoUpdate" })],
  build: {
    outDir: "dist",
  },
});

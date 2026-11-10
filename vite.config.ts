import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// Coloca o CSS dentro do HTML: tira uma requisição que bloqueia a primeira pintura.
function cssInline(): Plugin {
  return {
    name: "css-inline",
    enforce: "post",
    transformIndexHtml(html, ctx) {
      if (!ctx.bundle) return html;
      return html.replace(/<link rel="stylesheet"[^>]*href="([^"]+\.css)"[^>]*>/g, (_m, href: string) => {
        const nome = href.replace(/^\.?\//, "");
        const asset = ctx.bundle![nome];
        if (!asset || asset.type !== "asset") return _m;
        // o CSS saiu de assets/ para a raiz: os caminhos relativos das fontes mudam junto
        const css = String(asset.source).replace(/url\(\.\.\//g, "url(./");
        delete ctx.bundle![nome];
        return `<style>${css}</style>`;
      });
    },
  };
}

// base relativa: funciona em qualquer subcaminho do GitHub Pages
export default defineConfig({
  base: "./",
  plugins: [react(), cssInline()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { sourcemap: false, target: "es2020", cssCodeSplit: false },
});

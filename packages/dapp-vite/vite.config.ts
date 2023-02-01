import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import GlobalPolyFill from "vite-plugin-global-polyfill";
// import GlobalPolyFill from "@esbuild-plugins/node-globals-polyfill";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  define: {
    "process.env": {},
    global: {},
  },
  server: {
    port: 3000,
  },
});

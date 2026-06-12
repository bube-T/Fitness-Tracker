import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/auth": "http://127.0.0.1:3000",
      "/meals": "http://127.0.0.1:3000",
      "/workouts": "http://127.0.0.1:3000",
      "/weight": "http://127.0.0.1:3000",
      "/stats": "http://127.0.0.1:3000",
      "/chat": "http://127.0.0.1:3000",
    },
  },
});

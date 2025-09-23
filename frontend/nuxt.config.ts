import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  vite: {
    plugins: [tailwindcss()],
  },
  runtimeConfig: {
    public: {
      // projectId: process.env.NUXT_PUBLIC_PROJECT_ID,
      projectId: import.meta.env.NUXT_PUBLIC_PROJECT_ID,
      // contractAddress: process.env.NUXT_PUBLIC_CONTRACT_ADDRESS,
      contractAddress: import.meta.env.NUXT_PUBLIC_CONTRACT_ADDRESS,
    },
  },
  app: {
    head: {
      title: "Monad Colors",
      htmlAttrs: {
        lang: "en",
      },
    },
  },
});

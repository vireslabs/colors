import { defineNuxtPlugin } from "#app";
import { createAppKit } from "@reown/appkit/vue";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { mainnet, arbitrum, sepolia } from "@reown/appkit/networks";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [mainnet, arbitrum, sepolia],
    projectId: config.public.projectId,
    metadata: {
      name: "My Nuxt App",
      description: "My Nuxt App description",
      url: "https://mywebsite.com",
      icons: ["https://avatars.mywebsite.com/"],
    },
    features: {
      analytics: false,
    },
  });
});

import { defineNuxtPlugin } from "#app";
import { createAppKit } from "@reown/appkit/vue";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
// import { mainnet, arbitrum, sepolia } from "@reown/appkit/networks";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();

  const monadTestnet = {
    id: 10143,
    name: "Monad Testnet",
    network: "monad-testnet",
    nativeCurrency: {
      name: "Monad",
      symbol: "MON",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: ["https://testnet-rpc.monad.xyz"],
      },
      public: {
        http: ["https://testnet-rpc.monad.xyz"],
      },
    },
    blockExplorers: {
      default: {
        name: "Monad Explorer",
        url: "https://testnet.monadexplorer.com",
      },
    },
    testnet: true,
  };

  createAppKit({
    adapters: [new EthersAdapter()],
    networks: [monadTestnet],
    projectId: config.public.projectId,
    metadata: {
      name: "Monad Colors",
      description: "The 1/1 collection for every color on the internet",
      url: "https://colors-puce.vercel.app",
      icons: ["https://colors-puce.vercel.app/favicon.ico"],
    },
    features: {
      analytics: false,
    },
  });
});
